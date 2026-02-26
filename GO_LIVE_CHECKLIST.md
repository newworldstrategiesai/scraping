# Go-live checklist

Use this list to get the app fully live: Supabase + Vercel + Twilio + worker.

---

## 1. Supabase

- [ ] Create a Supabase project (or use existing).
- [ ] In **SQL Editor**, run the contents of **`app/supabase/schema.sql`** (creates `app_config`, `jobs`, `opt_outs`, `warm_leads`, `form_submissions`, `contact_notes`, `list_metadata`, `list_preview`, `sms_cell_list_rows`, etc.).
- [ ] In **Settings → API**: copy **Project URL** and **service_role** key (keep secret).
- [ ] You will need: `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` for both Vercel and the worker.

---

## 2. Vercel (Next.js app)

- [ ] Deploy the **`app`** folder to Vercel (e.g. connect GitHub repo, set root directory to `app`).
- [ ] In Vercel **Settings → Environment Variables**, add:
  - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase project URL
  - `SUPABASE_SERVICE_ROLE_KEY` = your Supabase service_role key
- [ ] Redeploy if needed. Note your app URL (e.g. `https://your-app.vercel.app`).

---

## 3. Twilio (inbound webhook)

- [ ] In Twilio Console: **Phone Numbers → Manage → Active Numbers** → select your number.
- [ ] Under **Messaging**, set **A MESSAGE COMES IN**:
  - **Webhook:** `https://your-app.vercel.app/api/inbound-sms`
  - **HTTP:** POST
- [ ] Save. When someone replies STOP or YES to your number, Twilio will POST to that URL and the app will write to Supabase `opt_outs` / `warm_leads`.

---

## 4. Worker (run jobs)

The worker runs on a machine that has access to your repo and (for send jobs) Twilio.

- [ ] On that machine, clone the repo and install dependencies (e.g. `pip install -r requirements.txt` for Python scripts).
- [ ] Create a `.env` (or set env vars) with:
  - `SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_URL` = same as Vercel
  - `SUPABASE_SERVICE_ROLE_KEY` = same as Vercel
  - For **Send daily batch** and **Message warm leads**: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM`
- [ ] Start the worker: `python scripts/worker.py` (from repo root). It will poll for pending jobs and run Build SMS list, Run CBC, Send daily batch, etc.
- [ ] Leave it running (or run via systemd/supervisor/cron if you prefer).

---

## 5. First run (verify end-to-end)

- [ ] **Addresses:** Put a small CSV in repo root with column **Address** (e.g. `propwire_addresses.csv`), or use existing. In the app **Settings**, set **Addresses CSV name** if different.
- [ ] **Run CBC** (optional): In **Actions**, click **Run CBC lookups**. Worker will run `run_cbc_only.sh` and produce `tree_service_leads.csv`. Skip if you already have leads.
- [ ] **Build SMS list:** In **Actions**, click **Build SMS list** (optional: add city/state/zip). Worker will export opt_outs from Supabase, run `build_sms_list.py`, and update Supabase `sms_cell_list_rows` + list metadata.
- [ ] **Send daily batch (dry run):** Click **Send daily batch (dry run)**. Worker will export opt_outs + warm_leads, run send_campaign with limit 450; no SMS sent. Check job log.
- [ ] **Inbound:** Send an SMS to your Twilio number: reply **STOP** then check **Lists → Opt-outs**; reply **YES** (or “interested”) then check **Lists → Warm leads** and **Dashboard → Warm leads today**.
- [ ] **Lists:** Open **Lists** and confirm SMS list, Opt-outs, and Warm leads tabs show data (or “no data” as expected).

---

## 6. Troubleshooting

- **Jobs stay pending:** Worker is not running or cannot reach Supabase. Check worker env vars and that `python scripts/worker.py` is running.
- **Inbound not updating Lists:** Twilio webhook must point to `https://your-app.vercel.app/api/inbound-sms` (POST). Check Vercel logs and Supabase `opt_outs` / `warm_leads` tables.
- **Build SMS list fails:** Ensure `tree_service_leads.csv` exists (from Run CBC or manual) and has column `Phone_Number`. Worker exports opt_outs to `_worker_opt_outs.csv` automatically.
- **Send campaign fails:** Set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM` on the worker machine.

For more detail, see **README_LEAD_AUTOMATION.md**, **PLAN_WARM_LEADS_FARMING.md**, and **PLAN_SEAMLESS_APP.md**.
