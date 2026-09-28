"""
SysSight - Process Service Module
Executes 'ps -eLf' through command_runner to inspect processes and threads,
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


def get_process_info() -> dict:
    """
    Retrieves real-time system process and thread information.

    Executes the live 'ps -eLf' command via command_runner and returns
    the execution result containing command, timestamp, raw_output, error,
    and exit_code without permanent caching or synthetic data.
    """
    cmd_result = run_command([
    "ps", "-e", "-L", "-o",
    "uid,pid,ppid,lwp,c,nlwp,state,start,etime,tty,time,cmd"
])
    return {
        "command": cmd_result.get(
    "command",
    "ps -e -L -o uid,pid,ppid,lwp,c,nlwp,state,start,etime,tty,time,cmd"
),
        "timestamp": cmd_result.get("timestamp", ""),
        "raw_output": cmd_result.get("raw_output", ""),
        "error": cmd_result.get("error", ""),
        "exit_code": cmd_result.get("exit_code", 0),
    }


if __name__ == "__main__":
    import json
    data = get_process_info()
    print(json.dumps({k: v for k, v in data.items() if k != "raw_output"}, indent=2))
    print(f"raw_output line count: {len(data.get('raw_output', '').splitlines())}")
