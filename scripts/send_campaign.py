#!/usr/bin/env python3
"""
Send one SMS per row from sms_cell_list.csv via Twilio.
Excludes opt_outs.csv, rate-limits (e.g. 1/sec), identity + opt-out in message.
Dry-run by default; set TWILIO_* env and pass --send to actually send.

Usage:
  python scripts/send_campaign.py [--dry-run] [--send] [--list sms_cell_list.csv] [--delay 1]
  TWILIO_ACCOUNT_SID=... TWILIO_AUTH_TOKEN=... TWILIO_FROM=+1... python scripts/send_campaign.py --send
"""
import argparse
import os
import time
from pathlib import Path

DEFAULT_LIST = "sms_cell_list.csv"
DEFAULT_OPT_OUTS = "opt_outs.csv"
DEFAULT_DELAY_SEC = 1.0

# Example script (identity + opt-out). Replace COMPANY with your name.
DEFAULT_MESSAGE = (
    "Hi, {company} here. We're doing tree work in your neighborhood – need any help? "
    "Reply YES for a free quote, or STOP to opt out."
)


def main():
    parser = argparse.ArgumentParser(description="Send campaign SMS from sms_cell_list (Twilio)")
    parser.add_argument("--list", default=DEFAULT_LIST, help="SMS list CSV (Phone_Number column)")
    parser.add_argument("--opt-outs", default=DEFAULT_OPT_OUTS, help="Opt-outs CSV")
    parser.add_argument("--send", action="store_true", help="Actually send (default: dry-run)")
    parser.add_argument("--dry-run", action="store_true", help="Explicitly dry-run (default when --send not passed)")
    parser.add_argument("--delay", type=float, default=DEFAULT_DELAY_SEC, help="Seconds between sends (default 1)")
    parser.add_argument("--message", default="", help="Override message; use {company} and keep under 160 chars")
    parser.add_argument("--company", default="Tree Service", help="Company name for identity in message")
    args = parser.parse_args()
    dry_run = not args.send

    root = Path(__file__).resolve().parent.parent
    list_path = root / args.list
    opt_path = root / args.opt_outs

    if not list_path.exists():
        print(f"SMS list not found: {list_path}")
        return

    import pandas as pd
    df = pd.read_csv(list_path)
    if df.empty or "Phone_Number" not in df.columns:
        print("SMS list missing or no Phone_Number column.")
        return

    # Normalize phone to E.164-ish (US: +1 + 10 digits)
    df["Phone_Number"] = df["Phone_Number"].astype(str).str.replace(r"\D", "", regex=True)
    df = df[df["Phone_Number"].str.len() >= 10]
    df["Phone_Number"] = df["Phone_Number"].str[-10:]
    df["To"] = "+1" + df["Phone_Number"]

    # Exclude opt-outs
    if opt_path.exists():
        opt = pd.read_csv(opt_path)
        if "Phone_Number" in opt.columns and not opt.empty:
            opt_nums = set(opt["Phone_Number"].astype(str).str.replace(r"\D", "", regex=True).str[-10:])
            df = df[~df["Phone_Number"].isin(opt_nums)]

    df = df.drop_duplicates(subset=["Phone_Number"], keep="first")
    message = (args.message or DEFAULT_MESSAGE).strip().format(company=args.company)
    if len(message) > 160:
        print(f"Warning: message length {len(message)} > 160 chars (extra segment cost).")

    if dry_run:
        print(f"DRY RUN: would send to {len(df)} numbers (opt-outs excluded).")
        for _, row in df.head(5).iterrows():
            print(f"  -> {row['To']} ({getattr(row, 'Full_Name', '')})")
        if len(df) > 5:
            print(f"  ... and {len(df) - 5} more.")
        print("Pass --send and set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM to send.")
        return

    sid = os.environ.get("TWILIO_ACCOUNT_SID")
    token = os.environ.get("TWILIO_AUTH_TOKEN")
    from_num = os.environ.get("TWILIO_FROM")
    if not all([sid, token, from_num]):
        print("Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM to send. Exiting.")
        return

    try:
        from twilio.rest import Client
    except ImportError:
        print("Install twilio: pip install twilio")
        return

    client = Client(sid, token)
    sent = 0
    for _, row in df.iterrows():
        try:
            client.messages.create(to=row["To"], from_=from_num, body=message)
            sent += 1
            print(f"Sent to {row['To']}")
        except Exception as e:
            print(f"Failed {row['To']}: {e}")
        time.sleep(args.delay)

    print(f"Sent {sent} messages.")


if __name__ == "__main__":
    main()
