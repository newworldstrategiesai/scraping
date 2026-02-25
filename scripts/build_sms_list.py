#!/usr/bin/env python3
"""
Build campaign-ready SMS list: cell-only, exclude opt-outs.
Reads tree_service_leads.csv (and optional phone-type filter), excludes opt_outs.csv,
writes sms_cell_list.csv.
Run: python scripts/build_sms_list.py [--leads tree_service_leads.csv] [--opt-outs opt_outs.csv] [--output sms_cell_list.csv]
"""
import argparse
import pandas as pd
from pathlib import Path

DEFAULT_LEADS = "tree_service_leads.csv"
DEFAULT_OPT_OUTS = "opt_outs.csv"
DEFAULT_OUTPUT = "sms_cell_list.csv"


def main():
    parser = argparse.ArgumentParser(description="Build cell-only SMS list, exclude opt-outs")
    parser.add_argument("--leads", default=DEFAULT_LEADS, help="Leads CSV")
    parser.add_argument("--opt-outs", default=DEFAULT_OPT_OUTS, help="Opt-outs CSV")
    parser.add_argument("--output", default=DEFAULT_OUTPUT, help="Output SMS list CSV")
    parser.add_argument("--require-phone-type", action="store_true",
                        help="Only keep rows where Phone_Type is Mobile/Cell")
    parser.add_argument("--include-unknown-phone-type", action="store_true",
                        help="Include rows where Phone_Type is Unknown/empty (for current data before carrier lookup)")
    args = parser.parse_args()

    require_phone_type = args.require_phone_type or not args.include_unknown_phone_type

    root = Path(__file__).resolve().parent.parent
    leads_path = root / args.leads
    opt_path = root / args.opt_outs
    out_path = root / args.output

    if not leads_path.exists():
        print(f"Leads file not found: {leads_path}")
        return

    df = pd.read_csv(leads_path)
    if df.empty or "Phone_Number" not in df.columns:
        print("Leads file missing or no Phone_Number column.")
        return

    # Normalize phone for dedupe and opt-out match
    df["Phone_Number"] = df["Phone_Number"].astype(str).str.replace(r"\D", "", regex=True)
    df = df[df["Phone_Number"].str.len() >= 10]
    df["Phone_Number"] = df["Phone_Number"].str[-10:]  # last 10 digits

    if require_phone_type and "Phone_Type" in df.columns:
        df = df[df["Phone_Type"].astype(str).str.lower().str.contains("mobile|cell", na=False)]
    elif require_phone_type:
        print("Warning: No Phone_Type column; keeping all rows. Add Phone_Type from CBC VIEW DETAILS for cell-only.")

    # Exclude opt-outs
    if opt_path.exists():
        opt = pd.read_csv(opt_path)
        if "Phone_Number" in opt.columns and not opt.empty:
            opt_nums = set(opt["Phone_Number"].astype(str).str.replace(r"\D", "", regex=True).str[-10:])
            df = df[~df["Phone_Number"].isin(opt_nums)]

    # Dedupe by phone (keep first)
    df = df.drop_duplicates(subset=["Phone_Number"], keep="first")

    # Prefer Source_Address for context; fall back to Address if Source_Address is missing or looks like a count (e.g. CBC_Result_Count)
    if "Source_Address" in df.columns and "Address" in df.columns:
        df["Source_Address"] = df["Source_Address"].astype(str)
        bad = df["Source_Address"].str.strip().str.match(r"^\d+$") | (df["Source_Address"].str.len() < 10)
        df.loc[bad, "Source_Address"] = df.loc[bad, "Address"].astype(str).values

    out_cols = [c for c in ["Full_Name", "Address", "Phone_Number", "Source_Address", "Lead_Type", "Resident_Type"] if c in df.columns]
    df[out_cols].to_csv(out_path, index=False)
    print(f"Wrote {len(df)} rows to {out_path}")


if __name__ == "__main__":
    main()
