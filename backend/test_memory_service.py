"""
SysSight - Step 4B Test Script
Temporary verification script for testing get_memory_info from services.memory.
"""

import json
from services.memory import get_memory_info


def test_memory_service():
    print("=" * 70)
    print("SYSSIGHT BACKEND - MEMORY SERVICE VERIFICATION TEST")
    print("=" * 70)

    # 1. Execute live free -h through memory service
    data = get_memory_info()

    # 2. Print all required information
    print(f"\n[1] COMMAND     : {data.get('command')}")
    print(f"[2] TIMESTAMP   : {data.get('timestamp')}")
    print(f"[3] EXIT CODE   : {data.get('exit_code')}")
    print(f"[4] ERROR       : {repr(data.get('error'))}")

    parsed = data.get("parsed", {})
    mem_info = parsed.get("memory", {})
    swap_info = parsed.get("swap", {})

    print("\n[5] PARSED MEMORY INFORMATION:")
    print(json.dumps(mem_info, indent=2))

    print("\n[6] PARSED SWAP INFORMATION:")
    print(json.dumps(swap_info, indent=2))

    raw_output = data.get("raw_output", "")
    print("\n[7] COMPLETE RAW OUTPUT:")
    print("-" * 50)
    print(raw_output.rstrip())
    print("-" * 50)

    # 3. Verification checks
    print("\n[8] VERIFICATION CHECKS:")
    all_passed = True

    # Check exit_code == 0
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

    # Check parsed is not empty
    if parsed and len(parsed) > 0:
        print("  [PASS] parsed dictionary is not empty")
    else:
        print("  [FAIL] parsed dictionary is empty")
        all_passed = False

    # Check memory exists
    if "memory" in parsed and isinstance(mem_info, dict) and len(mem_info) > 0:
        print("  [PASS] 'memory' section exists in parsed")
    else:
        print("  [FAIL] 'memory' section missing or empty")
        all_passed = False

    # Check swap exists
    if "swap" in parsed and isinstance(swap_info, dict) and len(swap_info) > 0:
        print("  [PASS] 'swap' section exists in parsed")
    else:
        print("  [FAIL] 'swap' section missing or empty")
        all_passed = False

    # Check memory fields: total, used, free, available
    for field in ["total", "used", "free", "available"]:
        if field in mem_info and mem_info[field]:
            print(f"  [PASS] memory.{field} exists: '{mem_info[field]}'")
        else:
            print(f"  [FAIL] memory.{field} is missing")
            all_passed = False

    # Check swap fields: total, used, free
    for field in ["total", "used", "free"]:
        if field in swap_info and swap_info[field] is not None and swap_info[field] != "":
            print(f"  [PASS] swap.{field} exists: '{swap_info[field]}'")
        else:
            print(f"  [FAIL] swap.{field} is missing")
            all_passed = False

    # Confirm values are present in actual raw output (not hardcoded)
    all_fields_to_check = [
        ("memory.total", mem_info.get("total")),
        ("memory.used", mem_info.get("used")),
        ("memory.free", mem_info.get("free")),
        ("memory.available", mem_info.get("available")),
        ("swap.total", swap_info.get("total")),
        ("swap.used", swap_info.get("used")),
        ("swap.free", swap_info.get("free")),
    ]

    for label, val in all_fields_to_check:
        if val and val in raw_output:
            print(f"  [PASS] {label} ('{val}') confirmed in live raw_output (not hardcoded)")
        else:
            print(f"  [FAIL] {label} ('{val}') NOT found in live raw_output")
            all_passed = False

    print("\n" + "=" * 70)
    if all_passed:
        print("RESULT: ALL MEMORY SERVICE CHECKS PASSED (PASS)")
    else:
        print("RESULT: MEMORY SERVICE VERIFICATION FAILED (FAIL)")
    print("=" * 70)

    return all_passed


if __name__ == "__main__":
    success = test_memory_service()
    exit(0 if success else 1)
