"""
SysSight - Locality Service & Endpoint Verification Test Script
Tests execution of:
1. get_locality_info() from services.locality
2. get_locality_command() from main.py
3. Verification of live ./locality execution in WSL environment
4. FastAPI route registration for /api/locality
5. Live HTTP request verification to GET /api/locality
"""

import json
import math
import threading
import time
import urllib.request
import uvicorn

from services.locality import get_locality_info
from main import app, get_locality_command


def test_locality_service():
    print("=" * 70)
    print("SYSSIGHT BACKEND - LOCALITY SERVICE & ENDPOINT VERIFICATION TEST")
    print("=" * 70)

    # 1. Execute live ./locality through locality service
    data = get_locality_info()

    # 2. Print metadata
    print(f"\n[1] COMMAND     : {data.get('command')}")
    print(f"[2] TIMESTAMP   : {data.get('timestamp')}")
    print(f"[3] EXIT CODE   : {data.get('exit_code')}")
    print(f"[4] ERROR       : {repr(data.get('error'))}")

    raw_output = data.get("raw_output", "")
    print(f"\n[5] RAW BENCHMARK OUTPUT:")
    print("-" * 50)
    print(raw_output.rstrip())
    print("-" * 50)

    print(f"\n[6] PARSED LOCALITY METRICS:")
    print(f"  Matrix Size   : {data.get('matrix_size')}")
    print(f"  Row-Major Time: {data.get('row_major_time')}s")
    print(f"  Col-Major Time: {data.get('col_major_time')}s")
    print(f"  Speedup Ratio : {data.get('ratio')}x")
    print(f"  Runs Captured : {len(data.get('runs', []))}")
    for r in data.get("runs", []):
        print(f"    Run #{r.get('run')}: row={r.get('row_major')}s, col={r.get('col_major')}s")

    # 3. Verification checks
    print("\n[7] SERVICE VERIFICATION CHECKS:")
    all_passed = True

    # Check required keys
    expected_top_keys = [
        "command", "timestamp", "raw_output", "error", "exit_code",
        "row_major_time", "col_major_time", "ratio", "matrix_size", "runs", "parsed"
    ]
    missing_keys = [k for k in expected_top_keys if k not in data]
    if not missing_keys:
        print(f"  [PASS] All expected keys present at top-level: {expected_top_keys}")
    else:
        print(f"  [FAIL] Missing keys: {missing_keys}")
        all_passed = False

    # Check command is exactly './locality'
    if data.get("command") == "./locality":
        print("  [PASS] ./locality is actually executed (command: './locality')")
    else:
        print(f"  [FAIL] Expected command './locality', got '{data.get('command')}'")
        all_passed = False

    # Check exit_code is 0
    if data.get("exit_code") == 0:
        print("  [PASS] exit_code == 0")
    else:
        print(f"  [FAIL] exit_code is {data.get('exit_code')} (Expected 0)")
        all_passed = False

    # Check raw_output is not empty
    if raw_output and len(raw_output.strip()) > 0:
        print(f"  [PASS] raw_output is not empty ({len(raw_output)} chars)")
    else:
        print("  [FAIL] raw_output is empty")
        all_passed = False

    # Check required substring markers in raw_output
    required_markers = [
        "Array size:",
        "Row-wise time:",
        "Column-wise time:",
        "Mean row-wise time:",
        "Mean column-wise time:",
        "Column/Row ratio:",
    ]
    for marker in required_markers:
        if marker in raw_output:
            print(f"  [PASS] output contains '{marker}'")
        else:
            print(f"  [FAIL] output missing marker: '{marker}'")
            all_passed = False

    # Check exactly 3 runs are parsed
    runs = data.get("runs", [])
    if len(runs) == 3:
        print(f"  [PASS] Exactly 3 runs are parsed (found {len(runs)})")
    else:
        print(f"  [FAIL] Expected 3 runs, but parsed {len(runs)}")
        all_passed = False

    # Check row_major_time is numeric and > 0
    row_t = data.get("row_major_time")
    if isinstance(row_t, (int, float)) and row_t > 0:
        print(f"  [PASS] row_major_time is numeric ({row_t}s)")
    else:
        print(f"  [FAIL] row_major_time invalid or non-numeric: {row_t}")
        all_passed = False

    # Check col_major_time is numeric and > 0
    col_t = data.get("col_major_time")
    if isinstance(col_t, (int, float)) and col_t > 0:
        print(f"  [PASS] col_major_time is numeric ({col_t}s)")
    else:
        print(f"  [FAIL] col_major_time invalid or non-numeric: {col_t}")
        all_passed = False

    # Check ratio is numeric and > 0
    ratio = data.get("ratio")
    if isinstance(ratio, (int, float)) and ratio > 0:
        print(f"  [PASS] ratio is numeric ({ratio})")
    else:
        print(f"  [FAIL] ratio invalid or non-numeric: {ratio}")
        all_passed = False

    # Check ratio is approximately col_major_time / row_major_time
    if row_t and col_t and ratio:
        calc_ratio = col_t / row_t
        if abs(ratio - calc_ratio) < 0.2:
            print(f"  [PASS] ratio ({ratio}) is approximately col_major_time / row_major_time ({calc_ratio:.2f})")
        else:
            print(f"  [FAIL] ratio mismatch: parsed {ratio} vs calculated {calc_ratio:.2f}")
            all_passed = False

    # 4. Check FastAPI route registration
    print("\n[8] ENDPOINT VERIFICATION CHECKS (main.py):")
    endpoint_data = get_locality_command()
    if endpoint_data.get("exit_code") == 0 and endpoint_data.get("command") == "./locality":
        print("  [PASS] get_locality_command() executed successfully and returned exit_code 0")
    else:
        print("  [FAIL] get_locality_command() returned unexpected result")
        all_passed = False

    route_paths = [route.path for route in app.routes]
    if "/api/locality" in route_paths:
        print("  [PASS] Route '/api/locality' is registered in FastAPI app")
    else:
        print("  [FAIL] Route '/api/locality' NOT found in app.routes")
        all_passed = False

    # 5. Live HTTP GET request test
    print("\n[9] LIVE HTTP GET REQUEST TEST:")
    try:
        server = uvicorn.Server(uvicorn.Config(app, host="127.0.0.1", port=8015, log_level="error"))
        t = threading.Thread(target=server.run, daemon=True)
        t.start()

        # Wait until server is listening
        for _ in range(50):
            if server.started:
                break
            time.sleep(0.1)

        req = urllib.request.urlopen("http://127.0.0.1:8015/api/locality", timeout=20)
        status_code = req.getcode()
        body = json.loads(req.read().decode())
        server.should_exit = True

        if status_code == 200:
            print("  [PASS] HTTP GET /api/locality returned 200 OK")
        else:
            print(f"  [FAIL] HTTP status code: {status_code} (Expected 200)")
            all_passed = False

        if body.get("command") == "./locality" and body.get("exit_code") == 0:
            print("  [PASS] HTTP response payload contains valid command and exit_code 0")
        else:
            print(f"  [FAIL] HTTP response payload invalid: {body}")
            all_passed = False

        http_parsed = body.get("parsed", {})
        if http_parsed.get("row_major_time") and http_parsed.get("col_major_time") and len(http_parsed.get("runs", [])) == 3:
            print(f"  [PASS] HTTP response contains parsed locality metrics ({http_parsed.get('ratio')}x speedup, 3 runs)")
        else:
            print("  [FAIL] HTTP response parsed metrics missing or incomplete")
            all_passed = False

    except Exception as exc:
        print(f"  [FAIL] Live HTTP test failed with exception: {exc}")
        all_passed = False

    print("\n" + "=" * 70)
    if all_passed:
        print("RESULT: ALL LOCALITY SERVICE CHECKS PASSED (PASS)")
    else:
        print("RESULT: LOCALITY SERVICE VERIFICATION FAILED (FAIL)")
    print("=" * 70)

    return all_passed


if __name__ == "__main__":
    success = test_locality_service()
    exit(0 if success else 1)
