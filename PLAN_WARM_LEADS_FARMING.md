# Plan: Warm Lead Farming (10–16 per day via Twilio)

**Goal:** Produce 10–16 real warm leads per day by sending Twilio SMS to the list; respondents who opt in (e.g. reply YES) become warm leads, then you can message them separately.

---

## 1. Current state

| Piece | Status |
|-------|--------|
| **Outbound** | `send_campaign.py` sends one SMS per row in `sms_cell_list.csv`, excludes `opt_outs.csv`, no limit — sends entire list. |
| **Inbound** | `inbound_sms_handler.py` (Flask): STOP → `opt_outs.csv`, YES/interest → `warm_leads.csv`. **Writes to CSV only, not Supabase.** |
| **Warm leads in app** | Supabase `warm_leads` table; Lists tab and contact view read from Supabase. New opt-ins from Twilio never reach Supabase. |
| **Opt-outs in app** | Supabase `opt_outs`; send_campaign uses CSV, so CSV and DB can drift. |

**Gaps:**

- Inbound replies (opt-out + opt-in) go to CSV only → warm lead count in app is stale; you can’t “message warm leads” from the same source of truth.
- No daily cap: “Send campaign” blasts the whole list instead of a daily batch sized to hit ~10–16 opt-ins.
- Cold campaign doesn’t exclude existing warm leads (risk of re-messaging people who already said YES).
- No dedicated “message warm leads” flow (follow-up to opted-in people).

---

## 2. Target: 10–16 warm leads per day

**Volume math:**

- Assume **2–4%** of people who get the first message reply with YES/interest.
- To get **10–16** opt-ins:  
  - 10 ÷ 0.04 ≈ 250, 16 ÷ 0.02 ≈ 800.  
  - **~400–500 sends/day** is a reasonable default to land in the 10–16 range (tune after a few days).

So we need:

1. **Daily batch send:** Send only up to N numbers per day (e.g. default 450), not the entire list.
2. **Order and resume:** Send the “next” N who haven’t been contacted yet (or haven’t been contacted in X days), so we don’t keep re-messaging the same people.
3. **Exclude warm leads and opt-outs:** Don’t send cold campaign to numbers already in `opt_outs` or `warm_leads`.

---

## 3. Architecture (end-to-end)

```
[SMS list] → Send daily batch (Twilio) → [Recipients]
                    ↓
            Reply STOP → Inbound webhook → Supabase opt_outs
            Reply YES  → Inbound webhook → Supabase warm_leads
                    ↓
            [Lists UI: Warm leads] ← same data
            [Contact view] ← same data
            [Message warm leads] ← send follow-up to these numbers only
```

- **Single source of truth:** Supabase for `opt_outs` and `warm_leads`. Inbound webhook and all app UI read/write here.
- **Outbound:** Campaign script reads “sendable” list from Supabase (or CSV) and respects opt_outs + warm_leads; supports a daily limit.

---

## 4. Feature breakdown

### 4.1 Inbound webhook → Supabase (required first)

**Purpose:** Every reply (STOP / YES) updates Supabase so the app and send logic use one source of truth.

**Options:**

- **A)** Extend Flask `inbound_sms_handler.py` to also write to Supabase (opt_outs + warm_leads). Keep CSV sync if you still use files elsewhere.
- **B)** Add a **Next.js API route** (e.g. `POST /api/inbound-sms`) that Twilio calls; route writes to Supabase and returns TwiML. No Flask needed; one less service to run.

**Recommendation:** **B** — Next.js API route. Use existing Supabase server client; deploy with the rest of the app; easy to add logging and error handling.

**Logic (same as today, target = Supabase):**

1. Normalize `From` to 10-digit phone.
2. If body matches STOP/unsubscribe/etc. → insert into `opt_outs` (phone, date, source), return TwiML “You’re unsubscribed.”
3. If body matches YES/interested/quote/etc.:
   - If not already in `warm_leads` for this phone → insert (phone_number, first_reply_text, reply_time, source_campaign).
   - Return TwiML “Thanks! We’ll call you shortly.”
4. Else → 200, no TwiML (or optional “Reply YES for a quote or STOP to opt out.”).

**Schema:** Existing `opt_outs` and `warm_leads` tables are enough. Optionally add `inbound_log` (phone, body, action, created_at) for debugging.

---

### 4.2 Cold campaign: daily batch + exclude warm leads

**Purpose:** Send only enough messages per day to aim for 10–16 opt-ins, and never send to people who already opted in or out.

**Changes:**

1. **Exclude warm leads**  
   When building the send list, exclude numbers that exist in `warm_leads` (and continue excluding `opt_outs`).  
   - If campaign reads from **Supabase** (`sms_cell_list_rows` + `opt_outs` + `warm_leads`): worker or script fetches sendable rows and passes them (or a temp CSV) to the send script.  
   - If campaign stays **CSV-based**: worker (or a small script) exports “sendable” rows (SMS list minus opt_outs minus warm_leads) to a CSV and runs send_campaign on that; or send_campaign gets `--opt-outs` and `--warm-leads` CSVs that the worker generates from Supabase before the job.

2. **Daily cap**  
   - Add `--limit N` to `send_campaign.py` (send at most N messages).  
   - Worker: new payload field e.g. `daily_batch_limit` (default 450). If present, pass `--limit payload.daily_batch_limit` to the script.

3. **“Already contacted” / resume**  
   - **Option A (simplest):** No extra table. Each run sends the “next” N from the list (e.g. order by `created_at`, skip already in opt_outs/warm_leads). So the list is the full pool; we just send N per run. If you run “daily batch” once per day, you naturally send N per day.  
   - **Option B:** Add `campaign_sent` (phone_number, sent_at, campaign_id). When building the batch, exclude phones sent in the last 7 days (or 30). Then we don’t re-message the same person every day.  
   Recommendation: Start with **Option A**; add Option B if you need strict “don’t contact again for X days” or multiple campaigns.

**Worker:**  
- For `send_campaign` / `send_campaign_dry_run`, pass `--limit` from payload (e.g. `daily_batch_limit: 450`).  
- If we move to “sendable list from Supabase”, worker (or a helper) builds the list: from `sms_cell_list_rows` minus `opt_outs` minus `warm_leads`, then take first N; write to a temp CSV or pass to script via stdin/list.

---

### 4.3 “Send daily batch” in the UI

**Purpose:** One button that sends the right volume for 10–16 warm leads, with optional override.

- **Action:** Reuse `send_campaign` with a payload that includes `daily_batch_limit: 450` (or configurable).
- **UI:**  
  - Option 1: “Send campaign (for real)” opens a small form: “Max messages this run” (default 450), optional message override, then run.  
  - Option 2: Separate button “Send daily batch” that runs `send_campaign` with default 450 and current template.  
- **Config:** Optional `app_config` or env: `daily_batch_default: 450` so the UI and worker share the same default.

---

### 4.4 Message warm leads (follow-up)

**Purpose:** After someone opts in, you can send them a follow-up (e.g. “We’ll call you today” or a custom message).

**Options:**

- **A)** New job `send_warm_lead_message`: script reads warm_leads from Supabase (or CSV exported by worker), sends one Twilio SMS per row with a fixed or payload message.  
- **B)** UI on Lists > Warm leads: “Message all warm leads” → modal with message text → creates job that sends to all current warm_leads.  
- **C)** Per-contact: In contact view, “Send SMS” with a text field → single Twilio send to that phone.

**Recommendation:** Implement **A** + **C** first (job for “message all warm leads” + single-message from contact view). Add **B** if you want a single “compose and send to list” screen.

**Compliance:** Use the same Twilio number; no need to add STOP to every follow-up if it’s a direct reply to someone who already opted in (one-to-one). If you send a bulk “marketing” message to warm leads, include opt-out.

---

### 4.5 Dashboard: warm leads today / this week

**Purpose:** See at a glance whether you’re hitting 10–16 per day.

- **Metrics:**  
  - Warm leads **today** (count where `reply_time` >= start of today).  
  - Warm leads **this week** (last 7 days).  
- **Placement:** Dashboard or Actions page: small card “Warm leads: X today, Y this week.”  
- **Implementation:** Server action or direct Supabase query:  
  `select count(*) from warm_leads where reply_time >= $start_of_today` and `reply_time >= $seven_days_ago`.

---

## 5. Compliance and safety

- **Identity + opt-out:** First message already includes company name and “Reply STOP to opt out.” Keep it.
- **Inbound STOP:** Always write to `opt_outs` and respond with “You’re unsubscribed.”
- **Outbound:** Never send to numbers in `opt_outs` or `warm_leads` for the cold campaign.
- **Rate limit:** Keep `sms_delay_sec` (e.g. 1 sec) to avoid carrier flags.
- **Logging:** Optional `inbound_log` and job logs for sent messages; helps with disputes and tuning.

---

## 5a. Setup after implementation

- **Twilio inbound webhook:** Point your Twilio phone number’s “A message comes in” webhook to:  
  `https://your-app-domain.com/api/inbound-sms`  
  Method: **POST**.  
  Replies (STOP / YES) will then write to Supabase.
- **Worker:** Ensure the worker runs with the same Supabase and (for send jobs) Twilio env vars:  
  `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM`.

---

## 6. Implementation order

| Phase | What | Delivers |
|-------|------|----------|
| **1** | Inbound webhook → Supabase | Next.js `POST /api/inbound-sms` (or extend Flask to write to Supabase). Twilio points to this URL. Opt-outs and warm leads flow into Supabase. |
| **2** | Cold campaign: exclude warm leads + daily limit | send_campaign.py: `--limit N`; worker builds sendable list (SMS list − opt_outs − warm_leads) from Supabase or CSV generated from Supabase; worker passes limit in payload. |
| **3** | “Send daily batch” in UI | Default 450 (or from config); button/form to run send with limit. |
| **4** | Message warm leads | Job or script to send one follow-up SMS to all warm_leads; optional “Send SMS” in contact view for one number. |
| **5** | Dashboard widget | “Warm leads: X today, Y this week” on dashboard or Actions page. |
| **6** (optional) | “Already contacted” tracking | Table `campaign_sent`; exclude phones sent in last 7 days when building daily batch. |

---

## 7. Files to add/change (summary)

- **New:** `app/app/api/inbound-sms/route.ts` — Twilio webhook: parse From/Body, update Supabase opt_outs/warm_leads, return TwiML.
- **Change:** `scripts/send_campaign.py` — Add `--limit`; support reading opt_outs and warm_leads from Supabase (or from CSVs that worker pre-generates from Supabase).
- **Change:** `scripts/worker.py` — For send_campaign: build sendable list (exclude opt_outs + warm_leads), pass `--limit` from payload; optionally write temp CSV for script.
- **Change:** `app/app/actions/action-buttons.tsx` (and job types) — “Send daily batch” or form for “Send campaign” with max messages (default 450).
- **New (optional):** Script or job “send message to warm leads” + UI to trigger it; contact view “Send SMS” button calling Twilio or an API.
- **New (optional):** Dashboard component + server action for “Warm leads today / this week”.

---

## 8. Success criteria

- Inbound: Every STOP and YES reply updates Supabase within seconds; Lists and contact view show up-to-date warm leads and opt-outs.
- Daily batch: One click (or one scheduled run) sends ~450 messages to cold list only; no sends to opt_outs or warm_leads.
- Within a few days of tuning: ~10–16 new warm leads per day from that batch.
- You can send a follow-up message to all warm leads (or to one from contact view) from the same app and Twilio number.

This plan keeps the system safe (single source of truth, no cross-brand mixing), focuses on 10–16 real warm leads per day, and makes the feature useful end-to-end: farm → opt-in → see in app → message them.
