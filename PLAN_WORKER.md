# Plan: Worker to Run Jobs from Supabase Queue

**Goal:** A single process (Python) that polls the `jobs` table for pending work, claims a job, runs the matching script, and updates status/log/error so the admin UI shows real progress.

---

## 1. Current state

- **Frontend (Vercel):** Admin can click "Build SMS list", "Parse quality leads", "Run CBC", "Send campaign (dry run)", "Send campaign (for real)". Each call creates a row in `jobs` with `status = 'pending'` and a `payload` (company_name, message_template, sms_delay_sec, include_unknown_phone_type, addresses_csv_name).
- **Supabase:** Tables `app_config`, `jobs` (id, action, payload, status, created_at, started_at, finished_at, log, error).
- **Scripts (repo root):** `scripts/build_sms_list.py`, `parse_quality_leads.py`, `run_cbc_only.sh`, `scripts/send_campaign.py`. They read CSVs and env (Twilio for send); no direct DB yet.

**Gap:** Nothing polls `jobs` or runs these scripts. Jobs stay `pending` until a worker runs.

---

## 2. Worker design

| Step | What |
|------|------|
| 1. Poll | Every N seconds (e.g. 15), query Supabase for one job with `status = 'pending'`, ordered by `created_at` ascending. |
| 2. Claim | Update that job to `status = 'running'`, `started_at = now()`. Use `WHERE id = ? AND status = 'pending'` so only one process claims it. |
| 3. Run | Map `action` to the correct script; pass `payload` (and env). Run in repo root; capture stdout + stderr. |
| 4. Update | Set `status = 'success'` or `'failed'`, `finished_at = now()`, `log` = stdout, `error` = stderr (if failed). |

**Actions → scripts**

| action | Command (from repo root) |
|--------|--------------------------|
| `build_sms_list` | `python scripts/build_sms_list.py` + `--include-unknown-phone-type` if payload says so |
| `parse_quality_leads` | `python parse_quality_leads.py` |
| `run_cbc` | `./run_cbc_only.sh <addresses_csv_name>` (default `propwire_addresses.csv`) |
| `send_campaign_dry_run` | `python scripts/send_campaign.py --dry-run --company "..." --message "..." --delay N` |
| `send_campaign` | Same with `--send`; requires TWILIO_* env on worker |

**Env (worker)**

- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — required (same as app; service role so worker can update jobs).
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM` — only for real send; optional for dry-run / other actions.

---

## 3. Files to add/change

| File | Change |
|------|--------|
| `scripts/worker.py` | New: poll → claim → run → update loop; subprocess per action; Supabase client. |
| `requirements.txt` | Add `supabase` (Python client). |
| `.env.example` (repo root) | Document `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, optional `TWILIO_*`. |
| `PLAN_WORKER.md` | This plan. |

No frontend or schema changes; UI already shows job list and "pending until worker runs".

---

## 4. How to run the worker

1. **Env:** Copy `.env.example` to `.env` in repo root; set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (from Supabase Dashboard → Project Settings → API). For real SMS, add Twilio vars.
2. **Venv:** `python3 -m venv .venv && .venv/bin/pip install -r requirements.txt`
3. **Run:** From repo root, `python scripts/worker.py` (or `.venv/bin/python scripts/worker.py`). Worker runs until Ctrl+C; it will pick up pending jobs every 15s.
4. **Optional:** Run in background (e.g. `nohup .venv/bin/python scripts/worker.py &`) or on a small VPS/Railway with the same env.

---

## 5. Cross-product / safety (this repo)

- This worker is for the **tree-service lead automation** pipeline (PropWire → CBC → SMS). It is not part of DJDash/M10/TipJar; it uses a separate Supabase project (or separate tables) and only touches `jobs`, `app_config`, and local CSVs.
- Twilio and Supabase keys stay on the machine running the worker; the Next.js app never sees Twilio.
- No shared user/event/payment data; safe to run as a standalone process.

---

## 6. Suggested tests (manual for now)

1. Start worker; click "Build SMS list" in admin; confirm job goes pending → running → success and log appears in `/jobs`.
2. Click "Send campaign (dry run)"; confirm dry-run log and success.
3. With Twilio set, click "Send campaign (for real)" and confirm sends (or use a test number).
4. Run CBC job; confirm long-running job shows running then success (or failed if addresses file missing).
