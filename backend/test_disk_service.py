"""
SysSight - Disk & I/O Performance Service Verification Test
Tests get_disk_info and parse_iostat from services.disk.
"""

import json
from services.disk import get_disk_info, parse_iostat


def test_disk_service():
    print("=" * 70)
    print("SYSSIGHT BACKEND - DISK SERVICE VERIFICATION TEST")
    print("=" * 70)

    # 1. Execute live iostat command via Disk service
    data = get_disk_info()

    # 2. Print all required fields
    print(f"\n[1] COMMAND     : {data.get('command')}")
    print(f"[2] TIMESTAMP   : {data.get('timestamp')}")
    print(f"[3] EXIT CODE   : {data.get('exit_code')}")
    print(f"[4] ERROR       : {repr(data.get('error'))}")

    print("\n[5] PARSED CPU STATS:")
    parsed = data.get("parsed", {})
    cpu = parsed.get("cpu", {})
    print(json.dumps(cpu, indent=2))

    print("\n[6] PARSED STORAGE DEVICES:")
    devices = parsed.get("devices", [])
    print(json.dumps(devices, indent=2))
    print(f"Total parsed devices: {len(devices)}")

    # 3. Verification Checks
    print("\n[7] VERIFICATION CHECKS:")
    all_passed = True

    if data.get("exit_code") == 0:
        print("  [PASS] exit_code == 0")
    else:
        print(f"  [FAIL] exit_code is {data.get('exit_code')} (Expected 0)")
        all_passed = False

    raw_output = data.get("raw_output", "")
    if raw_output and len(raw_output.strip()) > 0:
        print(f"  [PASS] raw_output is not empty ({len(raw_output)} chars)")
    else:
        print("  [FAIL] raw_output is empty")
        all_passed = False

    for key in ["user", "system", "iowait", "idle"]:
        if key in cpu:
            print(f"  [PASS] CPU field '{key}' exists: {cpu[key]}%")
        else:
            print(f"  [FAIL] CPU field '{key}' missing from parsed['cpu']")
            all_passed = False

    if isinstance(devices, list) and len(devices) > 0:
        print(f"  [PASS] parsed devices list has {len(devices)} device entries")
        dev = devices[0]
        for key in ["device", "read_iops", "write_iops", "read_mb_s", "write_mb_s", "util_percent"]:
            if key in dev:
                print(f"  [PASS] Device field '{key}' exists in parsed device")
            else:
                print(f"  [FAIL] Device field '{key}' missing in parsed device")
                all_passed = False
    else:
        print("  [FAIL] devices list is empty")
        all_passed = False

    # 4. Test parser with synthetic sample (multiple reports and different fields)
    sample = """Linux 6.1.0 (test-host) 	09/29/26 	_x86_64_	(4 CPU)

avg-cpu:  %user   %nice %system %iowait  %steal   %idle
           5.20    0.00    2.10    2.30    0.00   90.40

Device            r/s     rkB/s   rrqm/s  %rrqm r_await rareq-sz     w/s     wkB/s   wrqm/s  %wrqm w_await wareq-sz     d/s     dkB/s   drqm/s  %drqm d_await dareq-sz     f/s f_await  aqu-sz  %util
sda              12.50   2457.60     1.00  10.00    1.50   196.60    4.20    819.20     0.50  10.00    3.20   195.00    0.00      0.00     0.00   0.00    0.00     0.00    0.00    0.00    0.05   15.20

avg-cpu:  %user   %nice %system %iowait  %steal   %idle
           4.50    0.00    1.80    1.20    0.00   92.50

Device            r/s     rkB/s   rrqm/s  %rrqm r_await rareq-sz     w/s     wkB/s   wrqm/s  %wrqm w_await wareq-sz     d/s     dkB/s   drqm/s  %drqm d_await dareq-sz     f/s f_await  aqu-sz  %util
sda              10.00   1024.00     0.00   0.00    1.00   102.40    2.00    512.00     0.00   0.00    2.00   256.00    0.00      0.00     0.00   0.00    0.00     0.00    0.00    0.00    0.02    8.50
"""
    test_parsed = parse_iostat(sample)
    if test_parsed["cpu"]["user"] == 4.5 and test_parsed["cpu"]["idle"] == 92.5:
        print("  [PASS] Latest report CPU stats parsed accurately from synthetic sample")
    else:
        print(f"  [FAIL] Synthetic CPU mismatch: {test_parsed['cpu']}")
        all_passed = False

    if len(test_parsed["devices"]) == 1 and test_parsed["devices"][0]["device"] == "sda":
        dev = test_parsed["devices"][0]
        print(f"  [PASS] Synthetic device parsed: {dev['device']} (read_mb_s: {dev['read_mb_s']}, util: {dev['util_percent']}%)")
    else:
        print(f"  [FAIL] Synthetic device parse mismatch: {test_parsed['devices']}")
        all_passed = False

    print("\n" + "=" * 70)
    if all_passed:
        print("RESULT: ALL DISK SERVICE CHECKS PASSED (PASS)")
    else:
        print("RESULT: DISK SERVICE VERIFICATION FAILED (FAIL)")
    print("=" * 70)

    return all_passed


if __name__ == "__main__":
    success = test_disk_service()
    exit(0 if success else 1)
