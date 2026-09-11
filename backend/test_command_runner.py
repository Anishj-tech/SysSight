"""
SysSight - Step 2B Test Script
Temporary verification script for command_runner.py.
Tests real execution of:
1. lscpu
2. free -h
3. nonexistent_command
"""

from command_runner import run_command


def test_command_runner():
    tests = [
        {"cmd": ["lscpu"], "expected_exit_code": 0, "should_succeed": True},
        {"cmd": ["free", "-h"], "expected_exit_code": 0, "should_succeed": True},
        {"cmd": ["nonexistent_command"], "expected_exit_code": None, "should_succeed": False},
    ]

    all_passed = True

    print("=" * 60)
    print("SYSSIGHT BACKEND - COMMAND RUNNER TEST SUITE")
    print("=" * 60)

    for idx, t in enumerate(tests, 1):
        cmd = t["cmd"]
        print(f"\n[TEST {idx}] Executing: {cmd}")
        result = run_command(cmd)

        # 1. Verify schema keys presence
        keys = ["command", "timestamp", "raw_output", "error", "exit_code"]
        missing_keys = [k for k in keys if k not in result]
        if missing_keys:
            print(f"  FAIL: Missing keys in result dictionary: {missing_keys}")
            all_passed = False
            continue

        # 2. Verify field types
        valid_types = (
            isinstance(result["command"], str)
            and isinstance(result["timestamp"], str)
            and isinstance(result["raw_output"], str)
            and isinstance(result["error"], str)
            and isinstance(result["exit_code"], int)
        )
        if not valid_types:
            print("  FAIL: Field types invalid.")
            all_passed = False
            continue

        # 3. Print captured details
        print(f"  command    : {result['command']}")
        print(f"  timestamp  : {result['timestamp']}")
        print(f"  exit_code  : {result['exit_code']}")
        print(f"  stdout len : {len(result['raw_output'])} chars")
        print(f"  stderr len : {len(result['error'])} chars")

        # 4. Scenario-specific validations
        if t["should_succeed"]:
            if result["exit_code"] == 0 and len(result["raw_output"]) > 0:
                print("  STATUS     : PASSED (Successful execution, exit_code 0)")
            else:
                print(f"  STATUS     : FAILED (Expected exit_code 0, got {result['exit_code']})")
                all_passed = False
        else:
            if result["exit_code"] != 0 and len(result["error"]) > 0:
                print(f"  STATUS     : PASSED (Non-zero exit_code {result['exit_code']}, error captured)")
                print(f"  Captured Error: {result['error'].strip()}")
            else:
                print("  STATUS     : FAILED (Expected non-zero exit_code and error)")
                all_passed = False

    print("\n" + "=" * 60)
    if all_passed:
        print("ALL TESTS PASSED SUCCESSFULLY.")
    else:
        print("SOME TESTS FAILED.")
    print("=" * 60)

    return all_passed


if __name__ == "__main__":
    success = test_command_runner()
    exit(0 if success else 1)
