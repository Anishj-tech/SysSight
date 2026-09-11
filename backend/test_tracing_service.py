"""
SysSight - Tracing Service & Endpoint Verification Test Script
Tests execution of:
1. get_strace_info() from services.tracing
2. get_strace_command() from main.py
3. Verification of live strace -c ls execution in WSL environment
4. FastAPI route registration for /api/commands/strace
5. Live HTTP request verification to GET /api/commands/strace
"""

import json
import threading
import time
import urllib.request
import uvicorn

from services.tracing import get_strace_info
from main import app, get_strace_command


def test_tracing_service():
    print("=" * 70)
    print("SYSSIGHT BACKEND - TRACING SERVICE & ENDPOINT VERIFICATION TEST")
    print("=" * 70)

    # 1. Execute live strace -c ls through tracing service
    data = get_strace_info()

    # 2. Print metadata
    print(f"\n[1] COMMAND     : {data.get('command')}")
    print(f"[2] TIMESTAMP   : {data.get('timestamp')}")
    print(f"[3] EXIT CODE   : {data.get('exit_code')}")
    print(f"[4] ERROR LEN   : {len(data.get('error', ''))} chars (preserved from stderr)")

    raw_output = data.get("raw_output", "")
    lines = raw_output.strip().splitlines()
    print(f"\n[5] RAW STRACE SUMMARY:")
    print(f"  Total Lines Captured: {len(lines)}")
    print("  Header / Top Syscalls Snippet:")
    for line in lines[:8]:
        print(f"    {line}")
    if len(lines) > 8:
        print("    ...")
        print(f"    {lines[-1]}")

    parsed = data.get("parsed", {})
    syscalls = parsed.get("syscalls", [])
    print(f"\n[6] PARSED SYSCALL METRICS:")
    print(f"  Syscalls Identified: {len(syscalls)}")
    print(f"  Total Calls        : {parsed.get('total_calls')}")
    print(f"  Total Errors       : {parsed.get('total_errors')}")
    print(f"  Total Time (sec)   : {parsed.get('total_time')}")

    # 3. Verification checks
    print("\n[7] SERVICE VERIFICATION CHECKS:")
    all_passed = True

    # Check required keys
    expected_keys = ["command", "timestamp", "raw_output", "error", "exit_code"]
    missing_keys = [k for k in expected_keys if k not in data]
    if not missing_keys:
        print(f"  [PASS] All required keys present: {expected_keys}")
    else:
        print(f"  [FAIL] Missing required keys: {missing_keys}")
        all_passed = False

    # Check command is exactly 'strace -c ls'
    if data.get("command") == "strace -c ls":
        print("  [PASS] Command is exactly 'strace -c ls'")
    else:
        print(f"  [FAIL] Expected command 'strace -c ls', got '{data.get('command')}'")
        all_passed = False

    # Check exit_code is 0
    if data.get("exit_code") == 0:
        print("  [PASS] exit_code == 0")
    else:
        print(f"  [FAIL] exit_code is {data.get('exit_code')} (Expected 0)")
        all_passed = False

    # Check raw_output is not empty
    if raw_output and len(raw_output.strip()) > 0:
        print(f"  [PASS] strace output is actually captured ({len(raw_output)} chars, {len(lines)} lines)")
    else:
        print("  [FAIL] strace raw_output is empty")
        all_passed = False

    # Check output contains strace header: '% time' and 'syscall'
    if "% time" in raw_output:
        print("  [PASS] Output contains '% time' header")
    else:
        print("  [FAIL] Output missing '% time' header")
        all_passed = False

    if "syscall" in raw_output:
        print("  [PASS] Output contains 'syscall' header")
    else:
        print("  [FAIL] Output missing 'syscall' header")
        all_passed = False

    # Check stderr was preserved
    if data.get("error") and "% time" in data.get("error"):
        print("  [PASS] Stderr output was preserved in 'error' field")
    else:
        print("  [FAIL] Stderr output missing from 'error' field")
        all_passed = False

    # 4. Check FastAPI route registration
    print("\n[8] ENDPOINT VERIFICATION CHECKS (main.py):")
    endpoint_data = get_strace_command()
    if endpoint_data.get("exit_code") == 0 and endpoint_data.get("command") == "strace -c ls":
        print("  [PASS] get_strace_command() executed successfully and returned exit_code 0")
    else:
        print("  [FAIL] get_strace_command() returned unexpected result")
        all_passed = False

    route_paths = [route.path for route in app.routes]
    if "/api/commands/strace" in route_paths:
        print("  [PASS] Route '/api/commands/strace' is registered in FastAPI app")
    else:
        print("  [FAIL] Route '/api/commands/strace' NOT found in app.routes")
        all_passed = False

    # 5. Live HTTP GET request test
    print("\n[9] LIVE HTTP GET REQUEST TEST:")
    try:
        server = uvicorn.Server(uvicorn.Config(app, host="127.0.0.1", port=8013, log_level="error"))
        t = threading.Thread(target=server.run, daemon=True)
        t.start()

        # Wait until server is listening
        for _ in range(50):
            if server.started:
                break
            time.sleep(0.1)

        req = urllib.request.urlopen("http://127.0.0.1:8013/api/commands/strace", timeout=10)
        status_code = req.getcode()
        body = json.loads(req.read().decode())
        server.should_exit = True

        if status_code == 200:
            print("  [PASS] HTTP GET /api/commands/strace returned 200 OK")
        else:
            print(f"  [FAIL] HTTP status code: {status_code} (Expected 200)")
            all_passed = False

        if body.get("command") == "strace -c ls" and body.get("exit_code") == 0:
            print("  [PASS] HTTP response payload contains valid command and exit_code 0")
        else:
            print(f"  [FAIL] HTTP response payload invalid: {body}")
            all_passed = False

        http_raw_output = body.get("raw_output", "")
        if http_raw_output and "% time" in http_raw_output and "syscall" in http_raw_output:
            print(f"  [PASS] HTTP response contains actual strace summary with '% time' and 'syscall' ({len(http_raw_output.splitlines())} lines)")
        else:
            print("  [FAIL] HTTP response raw_output is empty or missing expected strace summary")
            all_passed = False

    except Exception as exc:
        print(f"  [FAIL] Live HTTP test failed with exception: {exc}")
        all_passed = False

    print("\n" + "=" * 70)
    if all_passed:
        print("RESULT: ALL TRACING SERVICE CHECKS PASSED (PASS)")
    else:
        print("RESULT: TRACING SERVICE VERIFICATION FAILED (FAIL)")
    print("=" * 70)

    return all_passed


if __name__ == "__main__":
    success = test_tracing_service()
    exit(0 if success else 1)
