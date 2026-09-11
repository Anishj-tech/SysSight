"""
SysSight - Step 3B Test Script
Temporary verification script for testing get_cpu_info from services.cpu.
"""

import json
from services.cpu import get_cpu_info


def test_cpu_service():
    print("=" * 70)
    print("SYSSIGHT BACKEND - CPU SERVICE VERIFICATION TEST")
    print("=" * 70)

    # 1. Execute live lscpu through CPU service
    data = get_cpu_info()

    # 2. Print all required fields
    print(f"\n[1] COMMAND     : {data.get('command')}")
    print(f"[2] TIMESTAMP   : {data.get('timestamp')}")
    print(f"[3] EXIT CODE   : {data.get('exit_code')}")
    print(f"[4] ERROR       : {repr(data.get('error'))}")
    
    print("\n[5] PARSED CPU INFORMATION:")
    print(json.dumps(data.get("parsed"), indent=2))

    print("\n[6] COMPLETE RAW OUTPUT:")
    print("-" * 50)
    print(data.get("raw_output", "").rstrip())
    print("-" * 50)

    # 3. Assertions and Validations
    print("\n[7] VERIFICATION CHECKS:")
    all_passed = True

    # Check exit_code == 0
    if data.get("exit_code") == 0:
        print("  [PASS] exit_code == 0")
    else:
        print(f"  [FAIL] exit_code is {data.get('exit_code')} (Expected 0)")
        all_passed = False

    # Check raw_output not empty
    raw_output = data.get("raw_output", "")
    if raw_output and len(raw_output.strip()) > 0:
        print(f"  [PASS] raw_output is not empty ({len(raw_output)} chars)")
    else:
        print("  [FAIL] raw_output is empty")
        all_passed = False

    # Check parsed is not empty
    parsed = data.get("parsed", {})
    if parsed and len(parsed) > 0:
        print(f"  [PASS] parsed dictionary is not empty ({len(parsed)} fields parsed)")
    else:
        print("  [FAIL] parsed dictionary is empty")
        all_passed = False

    # Check required fields exist in parsed
    for field in ["architecture", "model_name", "cpus"]:
        if field in parsed and parsed[field]:
            print(f"  [PASS] '{field}' exists in parsed: '{parsed[field]}'")
        else:
            print(f"  [FAIL] '{field}' is missing from parsed")
            all_passed = False

    # Confirm parsed values are present in actual raw lscpu output (not hardcoded)
    for field in ["architecture", "model_name", "cpus"]:
        val = parsed.get(field)
        if val and val in raw_output:
            print(f"  [PASS] '{field}' value ('{val}') confirmed in live raw_output (not hardcoded)")
        else:
            print(f"  [FAIL] '{field}' value ('{val}') NOT found in raw_output")
            all_passed = False

    print("\n" + "=" * 70)
    if all_passed:
        print("RESULT: ALL CPU SERVICE CHECKS PASSED (PASS)")
    else:
        print("RESULT: CPU SERVICE VERIFICATION FAILED (FAIL)")
    print("=" * 70)

    return all_passed


if __name__ == "__main__":
    success = test_cpu_service()
    exit(0 if success else 1)
