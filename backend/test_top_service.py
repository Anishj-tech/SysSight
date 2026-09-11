"""
SysSight - Top Service & Endpoint Verification Test Script
Tests execution of:
1. get_top_info() from services.top
2. get_top_command() from main.py
3. Verification of live top -b -n 1 execution in WSL environment
4. FastAPI route registration for /api/commands/top
5. Live HTTP request verification to GET /api/commands/top
"""

import json
import threading
import time
import urllib.request
import uvicorn

from services.top import get_top_info
from main import app, get_top_command


def test_top_service():
    print("=" * 70)
    print("SYSSIGHT BACKEND - TOP SERVICE & ENDPOINT VERIFICATION TEST")
    print("=" * 70)

    # 1. Execute live top -b -n 1 through top service
    data = get_top_info()

    # 2. Print metadata
    print(f"\n[1] COMMAND     : {data.get('command')}")
    print(f"[2] TIMESTAMP   : {data.get('timestamp')}")
    print(f"[3] EXIT CODE   : {data.get('exit_code')}")
    print(f"[4] ERROR       : {repr(data.get('error'))}")

    raw_output = data.get("raw_output", "")
    lines = raw_output.strip().splitlines()
    print(f"\n[5] RAW OUTPUT SUMMARY:")
    print(f"  Total Lines Captured: {len(lines)}")
    print("  Header / Summary Snippet:")
    for line in lines[:5]:
        print(f"    {line}")

    # 3. Verification checks
    print("\n[6] SERVICE VERIFICATION CHECKS:")
    all_passed = True

    # Check required keys
    expected_keys = ["command", "timestamp", "raw_output", "error", "exit_code"]
    missing_keys = [k for k in expected_keys if k not in data]
    if not missing_keys:
        print(f"  [PASS] All required keys present: {expected_keys}")
    else:
        print(f"  [FAIL] Missing required keys: {missing_keys}")
        all_passed = False

    # Check command is exactly 'top -b -n 1'
    if data.get("command") == "top -b -n 1":
        print("  [PASS] Command is exactly 'top -b -n 1'")
    else:
        print(f"  [FAIL] Expected command 'top -b -n 1', got '{data.get('command')}'")
        all_passed = False

    # Check exit_code is 0
    if data.get("exit_code") == 0:
        print("  [PASS] exit_code == 0")
    else:
        print(f"  [FAIL] exit_code is {data.get('exit_code')} (Expected 0)")
        all_passed = False

    # Check raw_output is not empty
    if raw_output and len(raw_output.strip()) > 0:
        print(f"  [PASS] raw_output is not empty ({len(raw_output)} chars, {len(lines)} lines)")
    else:
        print("  [FAIL] raw_output is empty")
        all_passed = False

    # Check raw_output contains expected sections: 'Tasks:' and '%Cpu'
    if "Tasks:" in raw_output:
        print("  [PASS] Output contains expected 'Tasks:' section")
    else:
        print("  [FAIL] Output missing 'Tasks:' section")
        all_passed = False

    if "%Cpu" in raw_output:
        print("  [PASS] Output contains expected '%Cpu' section")
    else:
        print("  [FAIL] Output missing '%Cpu' section")
        all_passed = False

    # 4. Check FastAPI route registration
    print("\n[7] ENDPOINT VERIFICATION CHECKS (main.py):")
    endpoint_data = get_top_command()
    if endpoint_data.get("exit_code") == 0 and endpoint_data.get("command") == "top -b -n 1":
        print("  [PASS] get_top_command() executed successfully and returned exit_code 0")
    else:
        print("  [FAIL] get_top_command() returned unexpected result")
        all_passed = False

    route_paths = [route.path for route in app.routes]
    if "/api/commands/top" in route_paths:
        print("  [PASS] Route '/api/commands/top' is registered in FastAPI app")
    else:
        print("  [FAIL] Route '/api/commands/top' NOT found in app.routes")
        all_passed = False

    # 5. Live HTTP GET request test
    print("\n[8] LIVE HTTP GET REQUEST TEST:")
    try:
        server = uvicorn.Server(uvicorn.Config(app, host="127.0.0.1", port=8011, log_level="error"))
        t = threading.Thread(target=server.run, daemon=True)
        t.start()

        # Wait until server is listening
        for _ in range(50):
            if server.started:
                break
            time.sleep(0.1)

        req = urllib.request.urlopen("http://127.0.0.1:8011/api/commands/top", timeout=10)
        status_code = req.getcode()
        body = json.loads(req.read().decode())
        server.should_exit = True

        if status_code == 200:
            print("  [PASS] HTTP GET /api/commands/top returned 200 OK")
        else:
            print(f"  [FAIL] HTTP status code: {status_code} (Expected 200)")
            all_passed = False

        if body.get("command") == "top -b -n 1" and body.get("exit_code") == 0:
            print("  [PASS] HTTP response payload contains valid command and exit_code 0")
        else:
            print(f"  [FAIL] HTTP response payload invalid: {body}")
            all_passed = False

        http_raw_output = body.get("raw_output", "")
        if http_raw_output and "Tasks:" in http_raw_output and "%Cpu" in http_raw_output:
            print(f"  [PASS] HTTP response contains valid raw_output with 'Tasks:' and '%Cpu' ({len(http_raw_output.splitlines())} lines)")
        else:
            print("  [FAIL] HTTP response raw_output is empty or missing expected sections")
            all_passed = False

    except Exception as exc:
        print(f"  [FAIL] Live HTTP test failed with exception: {exc}")
        all_passed = False

    print("\n" + "=" * 70)
    if all_passed:
        print("RESULT: ALL TOP SERVICE CHECKS PASSED (PASS)")
    else:
        print("RESULT: TOP SERVICE VERIFICATION FAILED (FAIL)")
    print("=" * 70)

    return all_passed


if __name__ == "__main__":
    success = test_top_service()
    exit(0 if success else 1)
