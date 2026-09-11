"""
SysSight - Process Service & Endpoint Verification Test Script
Tests execution of:
1. get_process_info() from services.process
2. get_processes_command() from main.py
3. Verification of live ps -eLf execution in WSL environment
"""

import json
from services.process import get_process_info
from main import app, get_processes_command


def test_process_service():
    print("=" * 70)
    print("SYSSIGHT BACKEND - PROCESS SERVICE & ENDPOINT VERIFICATION TEST")
    print("=" * 70)

    # 1. Execute live ps -eLf through process service
    data = get_process_info()

    # 2. Print all required metadata and status
    print(f"\n[1] COMMAND     : {data.get('command')}")
    print(f"[2] TIMESTAMP   : {data.get('timestamp')}")
    print(f"[3] EXIT CODE   : {data.get('exit_code')}")
    print(f"[4] ERROR       : {repr(data.get('error'))}")

    raw_output = data.get("raw_output", "")
    lines = raw_output.strip().splitlines()
    print(f"\n[5] RAW OUTPUT SUMMARY:")
    print(f"  Total Lines Captured: {len(lines)}")
    if lines:
        print(f"  Header Line: {lines[0]}")
        print("  Sample First 5 Processes:")
        for line in lines[1:6]:
            print(f"    {line}")

    # 3. Verification checks for process service
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

    # Check command
    if data.get("command") == "ps -eLf":
        print(f"  [PASS] Command is 'ps -eLf'")
    else:
        print(f"  [FAIL] Expected command 'ps -eLf', got '{data.get('command')}'")
        all_passed = False

    # Check exit_code == 0
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

    # Check header contains standard ps -eLf columns
    header = lines[0] if lines else ""
    expected_columns = ["UID", "PID", "PPID", "LWP", "C", "NLWP", "STIME", "TTY", "TIME", "CMD"]
    cols_present = [col for col in expected_columns if col in header]
    if len(cols_present) == len(expected_columns):
        print(f"  [PASS] All expected columns found in header: {expected_columns}")
    else:
        print(f"  [FAIL] Missing columns in header. Present: {cols_present}")
        all_passed = False

    # Check for real live process rows (e.g. init or systemd or ps or python)
    has_init_or_systemd = any("/init" in l or "systemd" in l for l in lines)
    if has_init_or_systemd:
        print("  [PASS] Real live system processes detected (/init or systemd)")
    else:
        print("  [FAIL] No expected system processes found in output")
        all_passed = False

    # 4. Verify main.py endpoint
    print("\n[7] ENDPOINT VERIFICATION CHECKS (main.py):")
    endpoint_data = get_processes_command()
    if endpoint_data.get("exit_code") == 0 and endpoint_data.get("command") == "ps -eLf":
        print("  [PASS] get_processes_command() executed successfully and returned exit_code 0")
    else:
        print("  [FAIL] get_processes_command() returned unexpected result")
        all_passed = False

    # Check route registered in FastAPI app
    route_paths = [route.path for route in app.routes]
    if "/api/commands/processes" in route_paths:
        print("  [PASS] Route '/api/commands/processes' is registered in FastAPI app")
    else:
        print("  [FAIL] Route '/api/commands/processes' NOT found in app.routes")
        all_passed = False

    # 5. Verify live HTTP GET request
    print("\n[8] LIVE HTTP GET REQUEST TEST:")
    try:
        import threading
        import time
        import urllib.request
        import uvicorn

        server = uvicorn.Server(uvicorn.Config(app, host="127.0.0.1", port=8009, log_level="error"))
        t = threading.Thread(target=server.run, daemon=True)
        t.start()
        
        # Wait until server is ready
        for _ in range(50):
            if server.started:
                break
            time.sleep(0.1)

        req = urllib.request.urlopen("http://127.0.0.1:8009/api/commands/processes", timeout=10)
        status_code = req.getcode()
        body = json.loads(req.read().decode())
        server.should_exit = True

        if status_code == 200:
            print(f"  [PASS] HTTP GET /api/commands/processes returned 200 OK")
        else:
            print(f"  [FAIL] HTTP status code: {status_code}")
            all_passed = False

        if body.get("command") == "ps -eLf" and body.get("exit_code") == 0:
            print(f"  [PASS] HTTP response payload valid (command: '{body.get('command')}', exit_code: 0)")
        else:
            print(f"  [FAIL] HTTP response payload invalid: {body}")
            all_passed = False

        if body.get("raw_output") and len(body.get("raw_output").splitlines()) > 1:
            print(f"  [PASS] HTTP response contains live raw_output ({len(body.get('raw_output').splitlines())} lines)")
        else:
            print("  [FAIL] HTTP response raw_output is empty or incomplete")
            all_passed = False

    except Exception as exc:
        print(f"  [FAIL] Live HTTP test failed with exception: {exc}")
        all_passed = False

    print("\n" + "=" * 70)
    if all_passed:
        print("RESULT: ALL PROCESS SERVICE CHECKS PASSED (PASS)")
    else:
        print("RESULT: PROCESS SERVICE VERIFICATION FAILED (FAIL)")
    print("=" * 70)

    return all_passed


if __name__ == "__main__":
    success = test_process_service()
    exit(0 if success else 1)
