"""
SysSight - Cache Locality Service Module

Executes compiled './locality' executable through command_runner
to benchmark spatial cache locality (row-wise vs column-wise
matrix traversal).
"""

import re

from command_runner import run_command


def parse_locality(raw_output: str) -> dict:
    """
    Parse locality benchmark output.
    """

    matrix_size = ""
    runs = []
    row_major_time = 0.0
    col_major_time = 0.0
    ratio = 0.0

    if not raw_output:
        return {
            "matrix_size": matrix_size,
            "row_major_time": row_major_time,
            "col_major_time": col_major_time,
            "ratio": ratio,
            "runs": runs,
        }

    # Array size
    match = re.search(r"Array size:\s*([^\r\n]+)", raw_output)
    if match:
        matrix_size = match.group(1).strip()

    # Individual runs
    run_matches = re.finditer(
        r"Run\s+(\d+):\s*\n"
        r"Row-wise time:\s*([\d.]+)\s*seconds\s*\n"
        r"Column-wise time:\s*([\d.]+)\s*seconds",
        raw_output,
        re.IGNORECASE,
    )

    for match in run_matches:
        runs.append({
            "run": int(match.group(1)),
            "row_major": float(match.group(2)),
            "col_major": float(match.group(3)),
        })

    # Mean row-wise time
    match = re.search(
        r"Mean row-wise time:\s*([\d.]+)\s*seconds",
        raw_output,
        re.IGNORECASE,
    )

    if match:
        row_major_time = float(match.group(1))
    elif runs:
        row_major_time = sum(
            run["row_major"] for run in runs
        ) / len(runs)

    # Mean column-wise time
    match = re.search(
        r"Mean column-wise time:\s*([\d.]+)\s*seconds",
        raw_output,
        re.IGNORECASE,
    )

    if match:
        col_major_time = float(match.group(1))
    elif runs:
        col_major_time = sum(
            run["col_major"] for run in runs
        ) / len(runs)

    # Column / Row ratio
    match = re.search(
        r"Column/Row ratio:\s*([\d.]+)x?",
        raw_output,
        re.IGNORECASE,
    )

    if match:
        ratio = float(match.group(1))
    elif row_major_time > 0:
        ratio = col_major_time / row_major_time

    return {
        "matrix_size": matrix_size,
        "row_major_time": row_major_time,
        "col_major_time": col_major_time,
        "ratio": ratio,
        "runs": runs,
    }


def get_locality_info() -> dict:
    """
    Execute the compiled './locality' benchmark live
    and return the raw output plus parsed metrics.
    """

    cmd_result = run_command(["./locality"])

    raw_output = cmd_result.get("raw_output", "")

    parsed_data = parse_locality(raw_output)

    return {
        "command": cmd_result.get("command", "./locality"),
        "timestamp": cmd_result.get("timestamp", ""),
        "raw_output": raw_output,
        "error": cmd_result.get("error", ""),
        "exit_code": cmd_result.get("exit_code", 0),

        # Top-level fields expected by frontend
        "row_major_time": parsed_data["row_major_time"],
        "col_major_time": parsed_data["col_major_time"],
        "ratio": parsed_data["ratio"],
        "matrix_size": parsed_data["matrix_size"],
        "runs": parsed_data["runs"],

        # Parsed object
        "parsed": parsed_data,
    }


if __name__ == "__main__":
    import json

    data = get_locality_info()

    print(
        json.dumps(
            {key: value for key, value in data.items()
             if key != "raw_output"},
            indent=2
        )
    )

    print("\nRaw output:")
    print(data["raw_output"])