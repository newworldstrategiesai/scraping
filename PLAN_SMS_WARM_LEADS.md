# Plan: SMS to Property Owners → Warm Leads

**Goal:** Get cell numbers for property owners, send a neighborhood tree-work SMS, and treat anyone who replies with interest as a **warm lead**.

---

## 1. End-to-end flow

```
Propwire (addresses + optional Lead_Type, Lot_Size)
    → CBC lookups (names + phones)
    → Filter to cell only + "Lives at" + quality
    → SMS: "We're doing tree work in your neighborhood – need any help? Reply YES or STOP to opt out."
    → Inbound: detect interest (YES, SURE, INTERESTED, etc.) or opt-out (STOP)
    → Interest reply → mark as warm lead (CRM/CSV + notify)
```

---

## 2. Data: cell numbers only

- **Source:** `tree_service_leads.csv` (from PropWire addresses + CBC lookups).  
  Same pipeline as common tutorials: PropWire (e.g. Instant Data Scraper) → CSV of addresses → CBC (e.g. UI.Vision RPA or our Python/Cursor flow) → CSV with name, address, phone, **phone type (wireless/mobile vs landline)**. We keep phone type so we can filter to cell-only for SMS.
- **Must-have for SMS:** `Phone_Number` that is **Mobile/Cell**. Landlines can’t receive SMS.
- **How we get cell type:**
  - **Option A:** When recording from CBC in Cursor, use **VIEW DETAILS** per person and note Phone_Type (Mobile/Cell vs Landline). Only add rows where type is Mobile/Cell.
  - **Option B:** Use a **phone-type lookup** (e.g. Twilio Lookup, or a bulk carrier API) on the numbers we have: keep only wireless. Add a small script that takes `tree_service_leads.csv`, calls the API, and outputs `tree_service_leads_cell_only.csv`.
- **Quality filters (before SMS):** Prefer Resident_Type = "Lives at", dedupe by phone, one lead per address if you want to avoid duplicate texts to same household. Use `parse_quality_leads.py` with `--mobile-only` once Phone_Type is populated, or after a cell-only lookup.

**Deliverable:** A **cell-only, opted-in-ready list** (see Compliance below): e.g. `sms_cell_list.csv` with columns like Full_Name, Address, Phone_Number, Source_Address, Lead_Type (optional).

---

## 3. Compliance (TCPA / Do Not Text)

- **TCPA:** In the US, marketing SMS generally requires **prior express written consent** (or at least consent) and **clear opt-out**.
- **“We’re in your neighborhood”** can be treated as **solicitation**. To stay safe:
  - **Option 1 – Consent first:** Only text numbers you’ve obtained with clear “we may text you about tree services” consent (e.g. form on site, checkbox at sign-up). Then your “tree work in your neighborhood” message is fine.
  - **Option 2 – First-time outreach:** If you’re texting people whose numbers came only from public/CBC-style data (no prior consent), treat it as **cold outreach**. Best practice: (1) very short, (2) clear identity, (3) **one clear opt-out** (e.g. “Reply STOP to opt out”), (4) no marketing until they reply with interest (then their reply can support consent for follow-up). Consult a lawyer for your exact use case.
- **Do-Not-Contact list:** Keep a list of numbers that replied STOP (or asked to opt out). Before any campaign, **exclude** these numbers. Store in e.g. `opt_outs.csv` (Phone_Number, Date, Source).
- **Frequency:** Don’t re-text the same number if they didn’t reply, or space out messages (e.g. once per neighborhood campaign).

**Deliverable:** (1) Short script wording that includes identity + opt-out (see below). (2) Process: log every STOP, maintain `opt_outs.csv`, and filter it out before sending.

---

## 4. SMS platform and script

- **Platform:** Use an SMS API so you can send + receive (for warm leads and opt-outs). Examples:
  - **Twilio** – popular, good docs, supports inbound webhooks.
  - Others: Vonage, Plivo, etc.
- **Setup:** Buy a number (or use short code if you scale), configure **inbound webhook** to your server (or a serverless function) so you can process replies in real time.
- **Outbound script (example):**
  - “Hi [First Name optional], [Your Company] here. We’re doing tree work in your neighborhood – need any help? Reply YES for a free quote, or STOP to opt out.”
  - Keep under 160 characters if you want a single segment (or break into 2 segments and keep both under 160).
- **Identity:** Always include who’s texting (e.g. “[Your Company]” or “This is [Name] from [Company]”).
- **Opt-out:** Every message must offer a clear way to opt out (e.g. “Reply STOP to opt out”) and you must honor it immediately (add to opt-out list, send no more).

**Deliverable:** (1) Chosen platform + Twilio (or other) account and number. (2) Final script with identity + opt-out. (3) Sending script or workflow (e.g. script that reads `sms_cell_list.csv`, filters out `opt_outs.csv`, and sends via API).

---

## 5. Inbound: detect interest vs opt-out

- **Webhook:** Inbound SMS → your endpoint (e.g. `/inbound-sms`). Parse body and sender number.
- **Logic:**
  - **Opt-out:** If message contains “STOP”, “UNSUBSCRIBE”, “CANCEL”, “OPT OUT” (case-insensitive) → add number to `opt_outs.csv` (or DB), send one confirmation: “You’re unsubscribed. We won’t text again.”
  - **Interest:** If message contains “YES”, “SURE”, “INTERESTED”, “QUOTE”, “HELP”, “CALL ME”, etc. (define a list) → **warm lead**: save to warm-leads store (see below), optionally send auto-reply: “Thanks! We’ll call you shortly,” and/or notify your team.
  - **Other:** Optional: “Reply with your address or best time to call” or just log and have someone follow up manually.
- **Dedupe:** If the same number replies YES twice, still count once as warm lead (idempotent).

**Deliverable:** Inbound handler (e.g. small Flask/Node server or serverless function) that (1) updates opt-outs, (2) detects interest keywords, (3) writes warm leads and (4) sends any auto-replies.

---

## 6. Warm lead: definition and storage

- **Definition:** A contact who (1) received the neighborhood tree-work SMS and (2) replied with **indicated interest** (e.g. YES, SURE, INTERESTED, QUOTE, HELP).
- **Storage:** Persist so you can follow up (call, estimate, etc.):
  - **Simple:** Append to `warm_leads.csv` with columns e.g. Phone_Number, Full_Name, Address, First_Reply_Text, Reply_Time, Source_Campaign (e.g. “Germantown TN 2026-02”).
  - **Scalable:** Same fields in a DB (e.g. Supabase/Postgres) or CRM (e.g. HubSpot, Pipedrive) with a “Source: SMS – neighborhood campaign” tag.
- **Notify:** When a new warm lead is created, optionally: email/Slack to your team, or add to a “to call” queue.

**Deliverable:** Schema for warm leads (e.g. `warm_leads.csv` or DB table) and the logic in the inbound handler that writes to it when interest is detected.

---

## 7. Phased rollout

| Phase | What | Outcome |
|-------|------|--------|
| **1. Data** | Finish cell-only list (CBC VIEW DETAILS and/or phone-type API), dedupe, opt-outs list | `sms_cell_list.csv`, `opt_outs.csv` |
| **2. Compliance** | Finalize script (identity + opt-out), document process for STOP and Do-Not-Contact | Script + one-pager for your team |
| **3. Send + receive** | Twilio (or other) setup, send script, inbound webhook | Can send one campaign and receive replies |
| **4. Warm leads** | Inbound handler: opt-out + interest detection, write to `warm_leads.csv` (or DB) | Every “interested” reply becomes a warm lead |
| **5. Scale** | More neighborhoods (new Propwire/CBC runs), reuse same flow; keep opt-outs global | Repeatable SMS → warm-lead pipeline |

---

## 8. Files and scripts (this repo)

- **Existing:** `tree_service_leads.csv` (with Phone_Type, Resident_Type, etc.), `propwire_addresses.csv`, `parse_quality_leads.py`, `DATA_SCHEMA.md`.
- **Added:**
  - `sms_cell_list.csv` – cell-only, campaign-ready list (generated from tree_service_leads + opt-outs excluded).
  - `opt_outs.csv` – Phone_Number, Date, Source (e.g. “SMS reply”).
  - `warm_leads.csv` – Phone_Number, Full_Name, Address, First_Reply_Text, Reply_Time, Source_Campaign.
  - `scripts/build_sms_list.py` – reads tree_service_leads, filters to cell (or runs phone-type lookup), excludes opt_outs, writes sms_cell_list.
  - `scripts/send_campaign.py` – reads sms_cell_list, sends one message per number via Twilio (rate limit, e.g. 1/sec).
  - `scripts/inbound_sms_handler.py` – example webhook: parse body, opt-out vs interest, update opt_outs and warm_leads (or call your API).

---

## 9. One-line summary

**Get cell numbers (CBC + optional phone-type API) → send one compliant SMS (“tree work in your neighborhood – need help? Reply YES or STOP”) → on YES/interest, save as warm lead and follow up by phone.**

If you tell me your preferred stack (e.g. Twilio + Python, or Node, or Supabase), I can turn this into concrete scripts (build_sms_list, send_campaign, inbound handler) and schema for `opt_outs` and `warm_leads` next.
