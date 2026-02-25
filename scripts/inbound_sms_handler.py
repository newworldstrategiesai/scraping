#!/usr/bin/env python3
"""
Inbound SMS webhook: opt-out vs interest → update opt_outs.csv and warm_leads.csv.
Designed for Twilio: POST with From, Body (and optionally To). Run as Flask app and
point Twilio inbound webhook URL to http(s)://your-host/inbound-sms.

Usage:
  TWILIO_AUTH_TOKEN=... python scripts/inbound_sms_handler.py
  Then set Twilio phone number webhook to: https://your-domain/inbound-sms
"""
import csv
import os
import re
from datetime import datetime, timezone
from pathlib import Path

# Opt-out keywords (case-insensitive)
OPT_OUT_KEYWORDS = re.compile(r"\b(stop|unsubscribe|cancel|opt\s*out|remove)\b", re.I)
# Interest keywords → warm lead
INTEREST_KEYWORDS = re.compile(r"\b(yes|sure|interested|quote|help|call\s*me|please)\b", re.I)

OPT_OUTS_CSV = "opt_outs.csv"
WARM_LEADS_CSV = "warm_leads.csv"
SOURCE_CAMPAIGN_DEFAULT = "SMS-neighborhood"


def project_root():
    return Path(__file__).resolve().parent.parent


def normalize_phone(s: str) -> str:
    digits = re.sub(r"\D", "", str(s))
    return digits[-10:] if len(digits) >= 10 else ""


def append_opt_out(phone: str, source: str = "SMS reply"):
    path = project_root() / OPT_OUTS_CSV
    row = {"Phone_Number": phone, "Date": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC"), "Source": source}
    file_exists = path.exists()
    with open(path, "a", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["Phone_Number", "Date", "Source"])
        if not file_exists:
            w.writeheader()
        w.writerow(row)


def append_warm_lead(phone: str, body: str, full_name: str = "", address: str = "", source_campaign: str = SOURCE_CAMPAIGN_DEFAULT):
    path = project_root() / WARM_LEADS_CSV
    row = {
        "Phone_Number": phone,
        "Full_Name": full_name or "",
        "Address": address or "",
        "First_Reply_Text": body[:500],
        "Reply_Time": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC"),
        "Source_Campaign": source_campaign,
    }
    file_exists = path.exists()
    with open(path, "a", newline="") as f:
        w = csv.DictWriter(
            f, fieldnames=["Phone_Number", "Full_Name", "Address", "First_Reply_Text", "Reply_Time", "Source_Campaign"]
        )
        if not file_exists:
            w.writeheader()
        w.writerow(row)


def warm_lead_exists(phone: str) -> bool:
    path = project_root() / WARM_LEADS_CSV
    if not path.exists():
        return False
    p = normalize_phone(phone)
    with open(path) as f:
        r = csv.DictReader(f)
        for row in r:
            if normalize_phone(row.get("Phone_Number", "")) == p:
                return True
    return False


def handle_inbound(from_number: str, body: str) -> tuple[str, str | None]:
    """
    Returns (response_message, twiml_response).
    response_message is for logging; twiml_response is the TwiML to return (or None for 200 only).
    """
    phone = normalize_phone(from_number)
    if not phone:
        return "Invalid phone", None

    body_clean = (body or "").strip()

    if OPT_OUT_KEYWORDS.search(body_clean):
        append_opt_out(phone)
        return "Opt-out recorded", '<?xml version="1.0" encoding="UTF-8"?><Response><Message>You\'re unsubscribed. We won\'t text again.</Message></Response>'

    if INTEREST_KEYWORDS.search(body_clean):
        if not warm_lead_exists(phone):
            append_warm_lead(phone, body_clean, source_campaign=SOURCE_CAMPAIGN_DEFAULT)
        return "Warm lead recorded", '<?xml version="1.0" encoding="UTF-8"?><Response><Message>Thanks! We\'ll call you shortly.</Message></Response>'

    return "Reply logged (no action)", None


# Flask app for Twilio webhook
def create_app():
    from flask import Flask, request, Response

    app = Flask(__name__)

    @app.route("/inbound-sms", methods=["POST", "GET"])
    def inbound_sms():
        # Twilio sends POST with From, To, Body
        from_num = request.values.get("From", "")
        body = request.values.get("Body", "")
        msg, twiml = handle_inbound(from_num, body)
        print(f"Inbound: {from_num} -> {msg}")
        if twiml:
            return Response(twiml, mimetype="application/xml")
        return "", 200

    @app.route("/health")
    def health():
        return "ok", 200

    return app


if __name__ == "__main__":
    # Optional: verify Twilio signature with TWILIO_AUTH_TOKEN
    app = create_app()
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), debug=os.environ.get("FLASK_DEBUG", "0") == "1")
