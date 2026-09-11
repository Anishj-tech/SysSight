"""
SysSight - CPU Service Module
Executes 'lscpu' through command_runner, parses hardware architecture details,
and packages the results into a standardized payload.
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



# Mapping of lscpu field labels to simple, normalized dictionary keys
LSCPU_FIELD_MAP = {
    "Architecture": "architecture",
    "CPU op-mode(s)": "cpu_op_modes",
    "Byte Order": "byte_order",
    "CPU(s)": "cpus",
    "On-line CPU(s) list": "online_cpus",
    "Vendor ID": "vendor_id",
    "Model name": "model_name",
    "CPU family": "cpu_family",
    "Model": "model",
    "Thread(s) per core": "threads_per_core",
    "Core(s) per socket": "cores_per_socket",
    "Socket(s)": "sockets",
    "Virtualization": "virtualization",
    "Hypervisor vendor": "hypervisor_vendor",
    "Virtualization type": "virtualization_type",
    "L1d cache": "l1d_cache",
    "L1i cache": "l1i_cache",
    "L2 cache": "l2_cache",
    "L3 cache": "l3_cache",
    "CPU MHz": "cpu_mhz",
    "BogoMIPS": "bogomips",
}


def parse_lscpu(raw_output: str) -> dict:
    """
    Parses key-value pairs from raw lscpu output text.

    Splits the output line-by-line, identifies the first colon (':') separator,
    strips extraneous whitespace, and maps recognized hardware labels to clean keys.
    """
    parsed = {}
    if not raw_output:
        return parsed

    for line in raw_output.splitlines():
        if ":" not in line:
            continue

        label, value = line.split(":", 1)
        label = label.strip()
        value = value.strip()

        # Only extract recognized labels; ignore unmapped or empty lines
        if label in LSCPU_FIELD_MAP:
            clean_key = LSCPU_FIELD_MAP[label]
            parsed[clean_key] = value

    return parsed


def get_cpu_info() -> dict:
    """
    Retrieves CPU hardware and ISA specifications.

    Executes the real 'lscpu' command via command_runner, parses the raw output,
    and returns a payload conforming to the SysSight API specification.
    """
    # 1. Execute live lscpu command
    cmd_result = run_command(["lscpu"])

    # 2. Parse output only if command completed successfully
    parsed_data = {}
    if cmd_result.get("exit_code") == 0:
        parsed_data = parse_lscpu(cmd_result.get("raw_output", ""))

    # 3. Assemble response using command_runner metadata
    return {
        "command": cmd_result.get("command", "lscpu"),
        "timestamp": cmd_result.get("timestamp", ""),
        "raw_output": cmd_result.get("raw_output", ""),
        "parsed": parsed_data,
        "error": cmd_result.get("error", ""),
        "exit_code": cmd_result.get("exit_code", 0),
    }


if __name__ == "__main__":
    import json
    data = get_cpu_info()
    print(json.dumps(data, indent=2))
