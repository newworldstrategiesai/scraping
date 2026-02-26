#!/usr/bin/env python3
"""
Send one SMS to each warm lead from a CSV (e.g. exported from Supabase).
Used for follow-up messages to opted-in contacts.

Usage:
  python scripts/send_warm_lead_message.py --list warm_leads.csv --message "We'll call you shortly."
  TWILIO_ACCOUNT_SID=... TWILIO_AUTH_TOKEN=... TWILIO_FROM=+1... python scripts/send_warm_lead_message.py --send --list ...
"""
import argparse
import os
import time
from pathlib import Path

DEFAULT_DELAY_SEC = 1.0


def main():
    parser = argparse.ArgumentParser(description="Send SMS to all warm leads (Twilio)")
    parser.add_argument("--list", required=True, help="Warm leads CSV (phone_number or Phone_Number column)")
    parser.add_argument("--message", required=True, help="Message body (under 160 chars)")
    parser.add_argument("--send", action="store_true", help="Actually send (default: dry-run)")
    parser.add_argument("--dry-run", action="store_true", help="Explicitly dry-run")
    parser.add_argument("--delay", type=float, default=DEFAULT_DELAY_SEC, help="Seconds between sends")
    args = parser.parse_args()
    dry_run = not args.send

    root = Path(__file__).resolve().parent.parent
    list_path = root / args.list if not os.path.isabs(args.list) else Path(args.list)
    if not list_path.exists():
        print(f"List not found: {list_path}")
        return

    import pandas as pd
    df = pd.read_csv(list_path)
    col = "phone_number" if "phone_number" in df.columns else "Phone_Number"
    if col not in df.columns or df.empty:
        print(f"CSV must have '{col}' column and at least one row.")
        return

    df[col] = df[col].astype(str).str.replace(r"\D", "", regex=True)
    df = df[df[col].str.len() >= 10]
    df["To"] = "+1" + df[col].str[-10:]
    df = df.drop_duplicates(subset=["To"], keep="first")

    message = (args.message or "").strip()
    if not message:
        print("--message is required.")
        return
    if len(message) > 160:
        print(f"Warning: message length {len(message)} > 160 chars.")

    if dry_run:
        print(f"DRY RUN: would send to {len(df)} warm leads.")
        for _, row in df.head(5).iterrows():
            print(f"  -> {row['To']}")
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

    print(f"Sent {sent} messages to warm leads.")


if __name__ == "__main__":
    main()
