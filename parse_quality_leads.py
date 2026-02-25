#!/usr/bin/env python3
"""
Build a quality shortlist from tree_service_leads.csv (and optionally propwire_addresses.csv).
Quality over quantity: filter by Resident_Type, Phone_Type, Lead_Type, Lot_Size, etc.
Run: python parse_quality_leads.py [--input tree_service_leads.csv] [--output quality_leads.csv]
"""
import argparse
import pandas as pd
from pathlib import Path

DEFAULT_INPUT = "tree_service_leads.csv"
DEFAULT_OUTPUT = "quality_leads.csv"
PROPWIRE_CSV = "propwire_addresses.csv"


def main():
    parser = argparse.ArgumentParser(description="Filter leads for quality (parse later)")
    parser.add_argument("--input", default=DEFAULT_INPUT, help="Input leads CSV")
    parser.add_argument("--output", default=DEFAULT_OUTPUT, help="Output quality shortlist CSV")
    parser.add_argument("--merge-propwire", action="store_true", help="Merge in Lead_Type, Lot_Size from propwire_addresses.csv")
    parser.add_argument("--lives-at-only", action="store_true", default=True, help="Keep only Resident_Type == Lives at (default True)")
    parser.add_argument("--mobile-only", action="store_true", help="Keep only Phone_Type Mobile/Cell when column present")
    parser.add_argument("--dedupe-phone", action="store_true", default=True, help="Dedupe by Phone_Number (default True)")
    args = parser.parse_args()

    path = Path(args.input)
    if not path.exists():
        print(f"Input not found: {path}")
        return

    df = pd.read_csv(path)
    if df.empty:
        print("No rows in input.")
        return

    # Merge Propwire fields if requested (add columns from propwire_addresses when not already in df)
    if args.merge_propwire and Path(PROPWIRE_CSV).exists():
        pw = pd.read_csv(PROPWIRE_CSV)
        if "Address" in pw.columns:
            extra = [c for c in ["Lead_Type", "Property_Type", "Lot_Size", "Est_Value", "Equity_Pct", "Notes"] if c in pw.columns and c not in df.columns]
            if extra:
                df = df.merge(pw[["Address"] + extra], on="Address", how="left")

    # Quality filters (only when column exists and we have values)
    if args.lives_at_only and "Resident_Type" in df.columns:
        df = df[df["Resident_Type"].astype(str).str.strip().str.lower().eq("lives at")]
    if args.mobile_only and "Phone_Type" in df.columns:
        df = df[df["Phone_Type"].astype(str).str.lower().str.contains("mobile|cell", na=False)]
    if args.dedupe_phone and "Phone_Number" in df.columns:
        df = df.drop_duplicates(subset=["Phone_Number"], keep="first")

    df.to_csv(args.output, index=False)
    print(f"Wrote {len(df)} rows to {args.output}")


if __name__ == "__main__":
    main()
