"""
SysSight - Network Service Verification Test
Tests get_network_info and parse_ss from services.network.
"""

import json
from services.network import get_network_info, parse_ss


def test_network_service():
    print("=" * 70)
    print("SYSSIGHT BACKEND - NETWORK SERVICE VERIFICATION TEST")
    print("=" * 70)

    # 1. Execute live command via Network service
    data = get_network_info()

    # 2. Print all required fields
    print(f"\n[1] COMMAND     : {data.get('command')}")
    print(f"[2] TIMESTAMP   : {data.get('timestamp')}")
    print(f"[3] EXIT CODE   : {data.get('exit_code')}")
    print(f"[4] ERROR       : {repr(data.get('error'))}")

    print("\n[5] PARSED SOCKETS (first 5):")
    parsed = data.get("parsed", [])
    print(json.dumps(parsed[:5], indent=2))
    print(f"Total parsed sockets: {len(parsed)}")

    print("\n[6] RAW OUTPUT PREVIEW:")
    print("-" * 50)
    raw_output = data.get("raw_output", "")
    lines = raw_output.splitlines()
    for l in lines[:8]:
        print(l)
    if len(lines) > 8:
        print(f"... ({len(lines) - 8} more lines)")
    print("-" * 50)

    # 3. Verification Checks
    print("\n[7] VERIFICATION CHECKS:")
    all_passed = True

    if data.get("exit_code") == 0:
        print("  [PASS] exit_code == 0")
    else:
        print(f"  [FAIL] exit_code is {data.get('exit_code')} (Expected 0)")
        all_passed = False

    if raw_output and len(raw_output.strip()) > 0:
        print(f"  [PASS] raw_output is not empty ({len(raw_output)} chars)")
    else:
        print("  [FAIL] raw_output is empty")
        all_passed = False

    if isinstance(parsed, list) and len(parsed) > 0:
        print(f"  [PASS] parsed list has {len(parsed)} socket entries")
        first_entry = parsed[0]
        for key in ["protocol", "local_address", "port", "state"]:
            if key in first_entry:
                print(f"  [PASS] field '{key}' exists in parsed socket entry")
            else:
                print(f"  [FAIL] field '{key}' missing in parsed socket entry")
                all_passed = False
    else:
        print("  [FAIL] parsed list is empty")
        all_passed = False

    # 4. Test parser with synthetic sample including process details
    sample = """Netid State  Recv-Q Send-Q  Local Address:Port Peer Address:PortProcess
tcp   LISTEN 0      128        127.0.0.1:8000       0.0.0.0:*    users:(("python",pid=1234,fd=3))
udp   UNCONN 0      0          0.0.0.0:5353         0.0.0.0:*    
tcp   LISTEN 0      4096       [::]:22              [::]:*    users:(("sshd",pid=567,fd=4))
"""
    test_parsed = parse_ss(sample)
    if len(test_parsed) == 3:
        print("  [PASS] Synthetic ss sample parsed 3 entries correctly")
        if test_parsed[0]["process"] == "python" and test_parsed[0]["pid"] == 1234 and test_parsed[0]["port"] == 8000:
            print("  [PASS] Process name, PID, and port extracted correctly from users:(...)")
        else:
            print(f"  [FAIL] Synthetic parse mismatch: {test_parsed[0]}")
            all_passed = False
    else:
        print(f"  [FAIL] Expected 3 entries, got {len(test_parsed)}")
        all_passed = False

    print("\n" + "=" * 70)
    if all_passed:
        print("RESULT: ALL NETWORK SERVICE CHECKS PASSED (PASS)")
    else:
        print("RESULT: NETWORK SERVICE VERIFICATION FAILED (FAIL)")
    print("=" * 70)

    return all_passed


if __name__ == "__main__":
    success = test_network_service()
    exit(0 if success else 1)
