#!/usr/bin/env python3
"""
Send one SMS to a single phone number via Twilio.
Used from contact view "Send SMS" or similar.

Usage:
  TWILIO_ACCOUNT_SID=... TWILIO_AUTH_TOKEN=... TWILIO_FROM=+1... python scripts/send_single_sms.py --phone 5551234567 --message "Hello"
"""
import argparse
import os
import re
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(description="Send one SMS via Twilio")
    parser.add_argument("--phone", required=True, help="10-digit US phone number")
    parser.add_argument("--message", required=True, help="Message body")
    args = parser.parse_args()

    digits = re.sub(r"\D", "", args.phone)
    if len(digits) < 10:
        print("Invalid phone: need at least 10 digits.")
        return
    to_num = "+1" + digits[-10:]

    sid = os.environ.get("TWILIO_ACCOUNT_SID")
    token = os.environ.get("TWILIO_AUTH_TOKEN")
    from_num = os.environ.get("TWILIO_FROM")
    if not all([sid, token, from_num]):
        print("Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM. Exiting.")
        return

    try:
        from twilio.rest import Client
    except ImportError:
        print("Install twilio: pip install twilio")
        return

    client = Client(sid, token)
    try:
        client.messages.create(to=to_num, from_=from_num, body=args.message.strip())
        print(f"Sent to {to_num}")
    except Exception as e:
        print(f"Failed: {e}")
        raise


if __name__ == "__main__":
    main()
