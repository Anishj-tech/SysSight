"""
SysSight - Disk & I/O Performance Service Module
Executes 'iostat -xz 1 3' through command_runner to inspect disk throughput,
IOPS, storage device utilization, and CPU I/O wait, packaging results into a standardized payload.
"""

import os
import sys

# Ensure parent 'backend' directory is in sys.path for both direct execution and package imports
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_ROOT = os.path.dirname(CURRENT_DIR)
if BACKEND_ROOT not in sys.path:
    sys.path.insert(0, BACKEND_ROOT)

try:
    from backend.command_runner import run_command
except ImportError:
    from command_runner import run_command


def _safe_float(val: any, default: float = 0.0) -> float:
    """Converts a string or numeric value to float safely."""
    try:
        if val is None:
            return default
        return round(float(val), 2)
    except (ValueError, TypeError):
        return default


def parse_iostat(raw_output: str) -> dict:
    """
    Parses multi-sample output from 'iostat -xz 1 3' into structured CPU and device metrics.

    Defensively extracts:
      - CPU stats: user, system, idle, iowait, nice, steal
      - Device stats: device, read_iops, write_iops, read_mb_s, write_mb_s, util_percent, await
    Handles differing sysstat version column headers and missing fields gracefully.
    """
    parsed = {
        "cpu": {
            "user": 0.0,
            "system": 0.0,
            "idle": 100.0,
            "iowait": 0.0,
        },
        "devices": [],
    }

    if not raw_output:
        return parsed

    lines = raw_output.splitlines()
    if not lines:
        return parsed

    # iostat -xz 1 3 outputs 3 iterations. We split into iteration reports.
    # Each iteration begins around 'avg-cpu:'
    reports = []
    current_report = {"cpu_lines": [], "device_lines": []}
    section = None

    for line in lines:
        line_clean = line.strip()
        if not line_clean:
            continue

        if line_clean.startswith("avg-cpu:"):
            # New iteration report boundary if current report already has data
            if current_report["cpu_lines"] or current_report["device_lines"]:
                reports.append(current_report)
                current_report = {"cpu_lines": [], "device_lines": []}
            section = "cpu"
            # In iostat, CPU headers (%user, %system, etc.) follow directly after 'avg-cpu:' on the same line
            header_part = line_clean[len("avg-cpu:"):].strip()
            if header_part:
                current_report["cpu_lines"].append(header_part)
            continue

        if line_clean.startswith("Device"):
            section = "device"
            current_report["device_lines"].append(line_clean)
            continue

        if section == "cpu":
            current_report["cpu_lines"].append(line_clean)
        elif section == "device":
            current_report["device_lines"].append(line_clean)

    if current_report["cpu_lines"] or current_report["device_lines"]:
        reports.append(current_report)

    # Process each report to extract structured CPU and device records
    parsed_reports = []
    for rep in reports:
        rep_cpu = {}
        rep_devices = []

        # Parse CPU section: typically line 0 is headers (%user, %system, etc.), line 1 is numbers
        if len(rep["cpu_lines"]) >= 2:
            headers = [h.strip().lower() for h in rep["cpu_lines"][0].split()]
            values = rep["cpu_lines"][1].split()
            cpu_map = dict(zip(headers, values))

            rep_cpu = {
                "user": _safe_float(cpu_map.get("%user") or cpu_map.get("user")),
                "system": _safe_float(cpu_map.get("%system") or cpu_map.get("system")),
                "iowait": _safe_float(cpu_map.get("%iowait") or cpu_map.get("iowait")),
                "idle": _safe_float(cpu_map.get("%idle") or cpu_map.get("idle")),
                "steal": _safe_float(cpu_map.get("%steal") or cpu_map.get("steal")),
                "nice": _safe_float(cpu_map.get("%nice") or cpu_map.get("nice")),
            }

        # Parse Device section: line 0 is column headers, lines 1..N are devices
        if len(rep["device_lines"]) >= 2:
            dev_headers = [h.strip().lower() for h in rep["device_lines"][0].split()]
            for dev_line in rep["device_lines"][1:]:
                dev_parts = dev_line.split()
                if not dev_parts:
                    continue

                dev_dict = dict(zip(dev_headers, dev_parts))
                device_name = dev_parts[0]

                # Read IOPS (r/s)
                read_iops = _safe_float(dev_dict.get("r/s"))
                # Write IOPS (w/s)
                write_iops = _safe_float(dev_dict.get("w/s"))

                # Read Throughput: rkB/s or rMB/s
                if "rmb/s" in dev_dict:
                    read_mb_s = _safe_float(dev_dict["rmb/s"])
                elif "rkb/s" in dev_dict:
                    read_mb_s = round(_safe_float(dev_dict["rkb/s"]) / 1024.0, 2)
                else:
                    read_mb_s = 0.0

                # Write Throughput: wkB/s or wMB/s
                if "wmb/s" in dev_dict:
                    write_mb_s = _safe_float(dev_dict["wmb/s"])
                elif "wkb/s" in dev_dict:
                    write_mb_s = round(_safe_float(dev_dict["wkb/s"]) / 1024.0, 2)
                else:
                    write_mb_s = 0.0

                # Disk utilization (%util or util)
                util_percent = _safe_float(dev_dict.get("%util") or dev_dict.get("util"))

                # Await latency
                await_ms = _safe_float(
                    dev_dict.get("r_await") or dev_dict.get("await") or dev_dict.get("w_await")
                )

                # Request merges
                read_req = _safe_float(dev_dict.get("rrqm/s"))
                write_req = _safe_float(dev_dict.get("wrqm/s"))

                rep_devices.append({
                    "device": device_name,
                    "read_iops": read_iops,
                    "write_iops": write_iops,
                    "read_mb_s": read_mb_s,
                    "write_mb_s": write_mb_s,
                    "util_percent": util_percent,
                    "await": await_ms,
                    "read_requests": read_req,
                    "write_requests": write_req,
                })

        parsed_reports.append({"cpu": rep_cpu, "devices": rep_devices})

    if not parsed_reports:
        return parsed

    # 1. Select the latest valid CPU report (reflects the final real-time sample)
    for rep in reversed(parsed_reports):
        if rep["cpu"]:
            parsed["cpu"] = rep["cpu"]
            break

    # 2. Select devices from the latest report that contains devices.
    # Note: Because of -z, idle devices in intervals 2 & 3 are omitted.
    # If the final interval has active devices, use them.
    # If the final interval had 0 active devices due to -z, fall back to report 1 (which lists all known devices).
    for rep in reversed(parsed_reports):
        if rep["devices"]:
            parsed["devices"] = rep["devices"]
            break

    return parsed


def get_disk_info() -> dict:
    """
    Retrieves real-time disk and I/O performance metrics.

    Executes 'iostat -xz 1 3' via command_runner.
    Defensively catches missing sysstat utility and returns a clean, helpful error message.
    """
    cmd_result = run_command(["iostat", "-xz", "1", "3"], timeout=20)

    exit_code = cmd_result.get("exit_code", 0)
    raw_output = cmd_result.get("raw_output", "")
    error = cmd_result.get("error", "")

    # Check if iostat / sysstat is not installed
    if exit_code == 127 or "not found" in error.lower() or "cannot find" in error.lower():
        return {
            "command": "iostat -xz 1 3",
            "timestamp": cmd_result.get("timestamp", ""),
            "raw_output": "",
            "parsed": {
                "cpu": {"user": 0.0, "system": 0.0, "idle": 100.0, "iowait": 0.0},
                "devices": [],
            },
            "error": "iostat command is not available. Install sysstat.",
            "exit_code": 127,
        }

    # If execution succeeded, parse the raw output
    parsed_data = {
        "cpu": {"user": 0.0, "system": 0.0, "idle": 100.0, "iowait": 0.0},
        "devices": [],
    }

    if exit_code == 0 and raw_output:
        parsed_data = parse_iostat(raw_output)

    return {
        "command": "iostat -xz 1 3",
        "timestamp": cmd_result.get("timestamp", ""),
        "raw_output": raw_output,
        "parsed": parsed_data,
        "error": error,
        "exit_code": exit_code,
    }


if __name__ == "__main__":
    import json
    data = get_disk_info()
    print(f"Command: {data['command']}")
    print(f"Exit code: {data['exit_code']}")
    print("Parsed CPU:", json.dumps(data["parsed"]["cpu"], indent=2))
    print(f"Parsed devices count: {len(data['parsed']['devices'])}")
    print("Devices:", json.dumps(data["parsed"]["devices"], indent=2))
