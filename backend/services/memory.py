"""
SysSight - Memory Service Module
Executes 'free -h' through command_runner, parses RAM and Swap utilization metrics,
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


def parse_free_h(raw_output: str) -> dict:
    """
    Parses key metrics from the raw 'free -h' output table.

    Identifies the 'Mem:' and 'Swap:' rows, extracts the columnar values,
    and maps them to clean dictionary structures without modifying units.
    """
    parsed = {
        "memory": {},
        "swap": {},
    }

    if not raw_output:
        return parsed

    for line in raw_output.splitlines():
        parts = line.split()
        if not parts:
            continue

        row_header = parts[0].rstrip(":")

        if row_header == "Mem":
            # Expected columns: total, used, free, shared, buff/cache, available
            keys = ["total", "used", "free", "shared", "buff_cache", "available"]
            for idx, key in enumerate(keys, start=1):
                if idx < len(parts):
                    parsed["memory"][key] = parts[idx]

        elif row_header == "Swap":
            # Expected columns: total, used, free
            keys = ["total", "used", "free"]
            for idx, key in enumerate(keys, start=1):
                if idx < len(parts):
                    parsed["swap"][key] = parts[idx]

    return parsed


def get_memory_info() -> dict:
    """
    Retrieves system RAM and Swap memory utilization.

    Executes the real 'free -h' command via command_runner, parses the raw output,
    and returns a payload conforming to the SysSight API specification.
    """
    # 1. Execute live 'free -h' command
    cmd_result = run_command(["free", "-h"])

    # 2. Parse output only if command completed successfully
    parsed_data = {}
    if cmd_result.get("exit_code") == 0:
        parsed_data = parse_free_h(cmd_result.get("raw_output", ""))

    # 3. Assemble response using command_runner metadata
    return {
        "command": cmd_result.get("command", "free -h"),
        "timestamp": cmd_result.get("timestamp", ""),
        "raw_output": cmd_result.get("raw_output", ""),
        "parsed": parsed_data,
        "error": cmd_result.get("error", ""),
        "exit_code": cmd_result.get("exit_code", 0),
    }


if __name__ == "__main__":
    import json
    data = get_memory_info()
    print(json.dumps(data, indent=2))
