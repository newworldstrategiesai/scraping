#!/usr/bin/env python3
"""
Merge CBC lookup results into tree_service_leads.csv.
Use when you've done lookups in Cursor browser (or exported from CBC) and have a CSV
with columns like Full_Name, Address, Phone_Number, Phone_Type (and optionally Resident_Type).

Usage:
  python scripts/merge_cbc_results.py new_leads.csv
  python scripts/merge_cbc_results.py new_leads.csv --output tree_service_leads.csv

Reads existing tree_service_leads.csv (if present), appends rows from new_leads.csv,
dedupes by (Address, Phone_Number), writes back. Keeps all columns from existing;
new rows get empty for missing columns.
"""
import argparse
import csv
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_LEADS = ROOT / "tree_service_leads.csv"


def main():
    parser = argparse.ArgumentParser(description="Merge CBC results into tree_service_leads.csv")
    parser.add_argument("new_csv", help="CSV with new leads (Full_Name, Address, Phone_Number, Phone_Type)")
    parser.add_argument("--output", default=str(DEFAULT_LEADS), help="Output path (default tree_service_leads.csv)")
    args = parser.parse_args()

    out_path = Path(args.output)
    new_path = Path(args.new_csv)
    if not new_path.exists():
        print(f"File not found: {new_path}")
        return

    existing_rows = []
    fieldnames = []
    if out_path.exists():
        with open(out_path, newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            fieldnames = reader.fieldnames or []
            existing_rows = list(reader)

    with open(new_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        new_fieldnames = reader.fieldnames or []
        for c in new_fieldnames:
            if c not in fieldnames:
                fieldnames.append(c)
        new_rows = list(reader)

    def key(r):
        addr = (r.get("Address") or "").strip()
        phone = (r.get("Phone_Number") or "").replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
        return (addr, phone[-10:] if len(phone) >= 10 else phone)

    seen = set(key(r) for r in existing_rows)
    added = 0
    for r in new_rows:
        k = key(r)
        if k in seen:
            continue
        seen.add(k)
        row = {fn: r.get(fn, "") for fn in fieldnames}
        existing_rows.append(row)
        added += 1

    with open(out_path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        w.writeheader()
        w.writerows(existing_rows)

    print(f"Merged {added} new rows into {out_path} (total {len(existing_rows)} rows).")


if __name__ == "__main__":
    main()
