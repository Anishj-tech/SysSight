"""
SysSight - Linux Command Runner Module
Executes system commands via Python subprocess without shell=True.
Captures stdout, stderr, execution exit code, and timestamps.
"""

import sys
import subprocess
from datetime import datetime, timezone


def run_command(command: list[str], timeout: int = 15) -> dict:
    """
    Executes a Linux command safely using subprocess.run without shell=True.

    If executed on a Windows host, prepends 'wsl' to route commands directly
    to the underlying Linux subsystem (Ubuntu).

    Parameters:
        command (list[str]): The command and its arguments as a list of strings.
        timeout (int): Maximum execution time allowed in seconds (default: 15).

    Returns:
        dict: Standardized execution result with keys:
            - command (str): Human-readable command string
            - timestamp (str): ISO 8601 formatted execution timestamp
            - raw_output (str): Captured stdout as text
            - error (str): Captured stderr or error message
            - exit_code (int): Process exit code (0 for success, non-zero for error)
    """
    human_readable_cmd = " ".join(command)
    timestamp = datetime.now(timezone.utc).isoformat()

    # Prepend 'wsl' if running from a Windows host environment to target WSL Ubuntu
    exec_cmd = (
        ["wsl"] + command
        if sys.platform == "win32" and command and command[0] != "wsl"
        else command
    )

    try:
        result = subprocess.run(
            exec_cmd,
            capture_output=True,
            text=True,
            timeout=timeout,
            shell=False,
        )
        return {
            "command": human_readable_cmd,
            "timestamp": timestamp,
            "raw_output": result.stdout,
            "error": result.stderr,
            "exit_code": result.returncode,
        }

    except FileNotFoundError:
        return {
            "command": human_readable_cmd,
            "timestamp": timestamp,
            "raw_output": "",
            "error": f"Command not found: {command[0] if command else ''}",
            "exit_code": 127,
        }

    except subprocess.TimeoutExpired as exc:
        return {
            "command": human_readable_cmd,
            "timestamp": timestamp,
            "raw_output": exc.stdout if isinstance(exc.stdout, str) else "",
            "error": f"Command timed out after {timeout} seconds",
            "exit_code": 124,
        }

    except Exception as exc:
        return {
            "command": human_readable_cmd,
            "timestamp": timestamp,
            "raw_output": "",
            "error": str(exc),
            "exit_code": 1,
        }
