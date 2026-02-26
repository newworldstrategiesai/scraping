#!/usr/bin/env python3
"""
Build campaign-ready SMS list: cell-only, exclude opt-outs.
Reads tree_service_leads.csv (and optional phone-type filter), excludes opt_outs.csv,
writes sms_cell_list.csv. Optional --city, --state, --zip to filter by location.
Run: python scripts/build_sms_list.py [--leads ...] [--opt-outs ...] [--output ...] [--city CITY] [--state ST] [--zip ZIP]
"""
import argparse
import re
import pandas as pd
from pathlib import Path

DEFAULT_LEADS = "tree_service_leads.csv"
DEFAULT_OPT_OUTS = "opt_outs.csv"
DEFAULT_OUTPUT = "sms_cell_list.csv"


def _parse_address_parts(addr: str) -> tuple[str, str, str]:
    """Parse US-style 'Street, City, ST 12345' into (city, state, zip). Returns ('','','') if unclear."""
    if not addr or not isinstance(addr, str):
        return ("", "", "")
    parts = [p.strip() for p in addr.split(",")]
    city, state, zip_ = "", "", ""
    if len(parts) >= 2:
        city = parts[-2].strip()
    if len(parts) >= 1:
        last = parts[-1].strip()
        # e.g. "TN 38101" or "TN"
        match = re.match(r"^([A-Za-z]{2})\s*(\d{5}(?:-\d{4})?)?$", last)
        if match:
            state = (match.group(1) or "").upper()
            zip_ = (match.group(2) or "").split("-")[0]
        elif len(last) == 2 and last.isalpha():
            state = last.upper()
        elif re.match(r"^\d{5}", last):
            zip_ = last[:5]
    return (city, state, zip_)


def _filter_by_location(
    df: pd.DataFrame,
    address_col: str,
    city_filter: str | None,
    state_filter: str | None,
    zip_filter: str | None,
) -> pd.DataFrame:
    """Filter rows by city, state, and/or zip. Uses City/State/Zip columns if present, else parses Address."""
    if not city_filter and not state_filter and not zip_filter:
        return df
    city_filter = (city_filter or "").strip()
    state_filter = (state_filter or "").strip().upper()[:2]
    zip_filter = (zip_filter or "").strip()
    zip_filter = re.sub(r"\D", "", zip_filter)[:5] if zip_filter else ""

    # Use explicit columns when present
    if city_filter and "City" in df.columns:
        df = df[df["City"].astype(str).str.strip().str.lower().str.contains(city_filter.lower(), na=False)]
    if state_filter and "State" in df.columns:
        df = df[df["State"].astype(str).str.strip().str.upper().str[:2].eq(state_filter)]
    if zip_filter and "Zip" in df.columns:
        df = df[df["Zip"].astype(str).str.replace(r"\D", "", regex=True).str[:5].eq(zip_filter)]

    # When no City/State/Zip columns, parse from Address
    if address_col in df.columns and (city_filter and "City" not in df.columns or state_filter and "State" not in df.columns or zip_filter and "Zip" not in df.columns):

        def matches(addr: str) -> bool:
            city, state, zip_ = _parse_address_parts(addr)
            if city_filter and "City" not in df.columns:
                if city_filter.lower() not in (city or "").lower():
                    return False
            if state_filter and "State" not in df.columns:
                if state != state_filter:
                    return False
            if zip_filter and "Zip" not in df.columns:
                if (zip_ or "").replace(" ", "") != zip_filter:
                    return False
            return True

        mask = df[address_col].astype(str).apply(matches)
        df = df[mask]

    return df


def main():
    parser = argparse.ArgumentParser(description="Build cell-only SMS list, exclude opt-outs")
    parser.add_argument("--leads", default=DEFAULT_LEADS, help="Leads CSV")
    parser.add_argument("--opt-outs", default=DEFAULT_OPT_OUTS, help="Opt-outs CSV")
    parser.add_argument("--output", default=DEFAULT_OUTPUT, help="Output SMS list CSV")
    parser.add_argument("--require-phone-type", action="store_true",
                        help="Only keep rows where Phone_Type is Mobile/Cell")
    parser.add_argument("--include-unknown-phone-type", action="store_true",
                        help="Include rows where Phone_Type is Unknown/empty (for current data before carrier lookup)")
    parser.add_argument("--city", default="", help="Filter leads by city (optional)")
    parser.add_argument("--state", default="", help="Filter leads by state (2-letter, optional)")
    parser.add_argument("--zip", default="", dest="zip_code", help="Filter leads by ZIP code (optional)")
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

    # Location filter (before phone normalization to keep messaging accurate)
    address_col = "Source_Address" if "Source_Address" in df.columns else "Address"
    if not (address_col in df.columns):
        address_col = "Address" if "Address" in df.columns else None
    if address_col:
        before = len(df)
        df = _filter_by_location(df, address_col, args.city or None, args.state or None, getattr(args, "zip_code", None) or None)
        if args.city or args.state or getattr(args, "zip_code", None):
            print(f"Location filter: {before} -> {len(df)} leads (city={args.city or 'any'}, state={args.state or 'any'}, zip={getattr(args, 'zip_code', '') or 'any'})")

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
