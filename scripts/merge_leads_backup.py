#!/usr/bin/env python3
"""Merge tree_service_leads.backup.csv with current tree_service_leads.csv (after CBC run).
Keeps full schema from backup; adds any new rows from current; dedupes by (Address, Phone_Number)."""
import pandas as pd
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BACKUP = ROOT / "tree_service_leads.backup.csv"
CURRENT = ROOT / "tree_service_leads.csv"
OUT = ROOT / "tree_service_leads.csv"

def main():
    if not BACKUP.exists():
        print("No backup file found.")
        return
    backup = pd.read_csv(BACKUP)
    if not CURRENT.exists() or pd.read_csv(CURRENT).empty:
        print("No new leads from CBC; keeping backup as-is.")
        backup.to_csv(OUT, index=False)
        print(f"Wrote {len(backup)} rows (backup only) to {OUT}")
        return
    current = pd.read_csv(CURRENT)
    # Align columns: use backup's columns; add missing to current
    for c in backup.columns:
        if c not in current.columns:
            current[c] = ""
    current = current[[c for c in backup.columns if c in current.columns]]
    # Dedupe key
    def key(r):
        a = str(r.get("Address", "")).strip()
        p = str(r.get("Phone_Number", "")).replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
        return (a, p[-10:] if len(p) >= 10 else p)
    backup_keys = set(key(r) for _, r in backup.iterrows())
    new_rows = current[~current.apply(lambda r: key(r) in backup_keys, axis=1)]
    merged = pd.concat([backup, new_rows], ignore_index=True)
    merged = merged.drop_duplicates(subset=["Address", "Phone_Number"], keep="first")
    merged.to_csv(OUT, index=False)
    print(f"Merged: {len(backup)} backup + {len(new_rows)} new = {len(merged)} rows -> {OUT}")

if __name__ == "__main__":
    main()
