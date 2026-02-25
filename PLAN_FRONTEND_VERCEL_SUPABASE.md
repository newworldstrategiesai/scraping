# Plan: Web Frontend for Lead Automation (Vercel + Supabase)

**Goal:** A browser-accessible dashboard to control parameters and trigger actions for the tree service lead pipeline (PropWire → CBC → SMS → warm leads), with data and status in one place.

---

## 1. Why Vercel + Supabase (and one caveat)

| Piece | Choice | Why |
|-------|--------|-----|
| **Frontend** | Next.js on **Vercel** | You already use React, Next.js, Tailwind, ShadCN. Vercel gives fast deploys, preview URLs, and a great DX. |
| **Auth + DB** | **Supabase** | Auth (email/social), Postgres for config, job queue, and lead/opt-out data. Fits your stack; realtime and RLS for multi-user later. |
| **Running the automation** | **Not on Vercel** | Selenium needs a real browser; CBC lookups and send_campaign can run minutes. Vercel serverless has short time limits and no persistent process. So the **Python scripts run elsewhere** (see §3). |

**Summary:** Frontend (Vercel) + data/auth (Supabase) + **worker** (your machine or a small server) that runs the Python automation and reports status to Supabase.

---

## 2. What the frontend should do

### 2.1 Parameters (settings)

- **CBC / addresses**
  - Target addresses source: choice of CSV name or “use default `propwire_addresses.csv`”.
  - Optional: use existing browser (Chrome debug port).
- **SMS campaign**
  - Company name, message template (with `{company}`), delay between sends.
  - Dry-run vs real send (real send only if Twilio env is set on worker).
- **Quality / build list**
  - Toggle: include unknown phone type when building SMS list.
  - Merge PropWire / lives-at-only / mobile-only (or link to run with current defaults).

### 2.2 Actions (trigger from UI)

- **Build SMS list** – run `build_sms_list.py` with current params → update `sms_cell_list` (or Supabase table).
- **Parse quality leads** – run `parse_quality_leads.py` → update `quality_leads` (or table).
- **Run CBC lookups** – run `run_cbc_only.sh` (or equivalent) with selected addresses CSV. Long-running; show status.
- **Send campaign** – dry-run or send via `send_campaign.py` (worker must have Twilio env).
- **View / export** – opt-outs, warm leads, SMS list, last run logs.

### 2.3 Data views

- **Opt-outs** – list from `opt_outs` (CSV or Supabase table).
- **Warm leads** – list from `warm_leads` (CSV or Supabase table).
- **SMS list** – count and sample from `sms_cell_list` (or table).
- **Job history** – last N runs: action, params, status (pending/running/success/failed), started/ended, log snippet.

---

## 3. Where the Python automation runs (critical)

The existing scripts need:

- **Selenium** (Chrome) for PropWire/CBC.
- **Twilio** for send_campaign and (optionally) inbound webhook.
- **File I/O** or DB for CSVs / opt_outs / warm_leads.
- **Minutes of runtime** for CBC and campaigns.

So they **cannot run inside Vercel serverless**. Options:

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **A) Worker on your machine** | Small API (Flask/FastAPI) or a “run script” process that polls Supabase for jobs. You start it when you want to run automation. | No extra cost; full control; can use local Chrome. | Only runs when your machine and worker are on. |
| **B) Worker on a VPS / Railway / Render** | Same worker, deployed on a small server or background worker. Frontend triggers jobs via API or Supabase. | Always on; can run headless Chrome. | Monthly cost; need to secure API and secrets. |
| **C) Hybrid** | Frontend and API routes on Vercel; “trigger job” writes to Supabase; a separate worker (A or B) picks up jobs and runs Python. | Clear separation; frontend stays serverless. | Two deploy targets. |

**Recommended:** **C) Hybrid.**  
- **Vercel:** Next.js app + API routes that only read/write Supabase (config, job queue, status).  
- **Worker:** One process (your machine or a small server) that:  
  - Polls Supabase for new jobs (or is triggered by webhook),  
  - Runs the appropriate Python script(s),  
  - Writes back status and logs to Supabase (and optionally syncs CSVs to Supabase tables).

---

## 4. Supabase schema (suggested)

### 4.1 Config (key-value or one row per “run type”)

- `app_config` – e.g. `company_name`, `default_message_template`, `sms_delay_sec`, `include_unknown_phone_type`, `addresses_csv_name`, etc. Frontend reads/writes; worker reads when starting a job.

### 4.2 Job queue and history

- `jobs`  
  - `id`, `action` (e.g. `build_sms_list`, `run_cbc`, `send_campaign`), `payload` (JSON params), `status` (`pending` | `running` | `success` | `failed`), `created_at`, `started_at`, `finished_at`, `log` (text), `error` (text).  
  - Worker polls for `status = 'pending'` (or uses Supabase Realtime), runs the script, then updates `status`, timestamps, `log`, `error`.

### 4.3 Lead data (optional but useful)

Migrate or mirror CSV data so the UI and worker both use Supabase:

- `opt_outs` – `phone_number`, `date`, `source` (match current `opt_outs.csv`).
- `warm_leads` – `phone_number`, `full_name`, `address`, `first_reply_text`, `reply_time`, `source_campaign` (match `warm_leads.csv`).
- `sms_cell_list` – snapshot or sync of the list used for the last campaign (e.g. `full_name`, `address`, `phone_number`, `source_address`, …).

Then:

- **Inbound webhook** (Twilio → your worker or a serverless function that has DB access) writes to `opt_outs` and `warm_leads` in Supabase instead of (or in addition to) CSV.
- **Worker** can read/write these tables when building list or sending campaign, or continue writing CSVs and periodically sync CSV → Supabase for the UI.

---

## 5. High-level architecture

```
[Browser]
    │
    ▼
[Next.js on Vercel]
    │  • Settings form (params)
    │  • Buttons: Build list, Run CBC, Send campaign, etc.
    │  • Tables: opt-outs, warm leads, job history
    │  • API routes: GET/POST to Supabase only (no Python)
    ▼
[Supabase]
    │  • Auth (optional)
    │  • Tables: app_config, jobs, opt_outs, warm_leads, (sms_cell_list)
    │  • Realtime: job status updates
    ▼
[Worker – your machine or VPS]
    │  • Polls jobs (or webhook from Supabase/Edge Function)
    │  • Runs: build_sms_list.py, parse_quality_leads.py,
    │          tree_service_lead_automation.py, send_campaign.py
    │  • Updates job status + log in Supabase
    │  • Reads app_config from Supabase; writes opt_outs/warm_leads or syncs CSVs
    ▼
[Existing Python scripts + optional Chrome + Twilio]
```

---

## 6. Phased implementation

### Phase 1: Frontend + Supabase only (no worker yet) ✅ Done

- **Created:** Next.js app in `app/` (Next 16, Tailwind, ShadCN). Deploy to Vercel; connect Supabase (env: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`).
- **Schema:** Run `app/supabase/schema.sql` in Supabase SQL Editor to create `app_config`, `jobs`, and optional `opt_outs` / `warm_leads`.
- **UI:**  
  - **Settings** (`/settings`): form for company name, message template, delay, “include unknown phone type”, addresses CSV name. Save to `app_config`.  
  - **Actions** (`/actions`): buttons “Build SMS list”, “Parse quality leads”, “Run CBC”, “Send campaign (dry-run)”, “Send campaign (for real)”. Each inserts a row into `jobs` with `status = 'pending'` and current config as payload.  
  - **Jobs** (`/jobs`): list last 50 jobs (status, created_at, started_at, finished_at, log/error). No worker yet, so they stay `pending`.
- **Outcome:** You can change settings and queue jobs from the browser; job list is visible. See `app/README.md` for run and deploy steps.

### Phase 2: Worker (local or VPS)

- Implement a small **worker** (Python or Node):
  - Poll Supabase every N seconds for `jobs` where `status = 'pending'` (or use Supabase Realtime / pg_notify).
  - Dequeue one job, set `status = 'running'`, `started_at = now()`.
  - Map `action` to the correct script (e.g. `build_sms_list`, `run_cbc`, `send_campaign`), pass `payload` and env (e.g. Twilio keys on the worker machine).
  - Run the script (subprocess or in-process), capture stdout/stderr.
  - On exit: set `status = 'success' | 'failed'`, `finished_at`, `log`, `error`.
- Store Twilio and any secrets in the worker’s environment (or Supabase Vault / Doppler), not in the frontend.
- **Optional:** Worker writes `opt_outs` / `warm_leads` to Supabase so the UI always shows up-to-date data.

**Outcome:** From the browser you trigger a job; the worker runs it and updates status; you see “running” then “success” or “failed” and the log.

### Phase 3: Inbound SMS → Supabase

- Point Twilio inbound webhook to a URL that can write to Supabase:
  - **Option A:** Worker exposes a small HTTP endpoint (e.g. `/inbound-sms`) that does the same logic as `inbound_sms_handler.py` but writes to Supabase `opt_outs` and `warm_leads` instead of (or in addition to) CSV.  
  - **Option B:** Supabase Edge Function or a separate serverless function (e.g. Vercel serverless) that receives Twilio POST, parses body, and inserts into `opt_outs` / `warm_leads`. No Python; use Twilio webhook signature verification.
- Frontend: “Opt-outs” and “Warm leads” pages read from Supabase in real time.

**Outcome:** Replies (STOP / YES) update the DB and show in the dashboard without touching CSVs on the worker.

### Phase 4: Polish and safety

- Auth: protect the app with Supabase Auth (e.g. email or Google); RLS so only authenticated users see jobs and lead data.
- Rate limiting and idempotency: e.g. only one “running” job per action at a time; prevent double-send.
- Audit: keep job history and optionally an audit log for “who changed config / who sent campaign”.

---

## 7. Tech summary

| Layer | Tech | Notes |
|-------|------|------|
| Frontend | Next.js (App Router), React, Tailwind, ShadCN | Deploy on Vercel; optimize for light/dark. |
| API (Vercel) | Next.js API routes or Server Actions | Only talk to Supabase; no long-running or Selenium. |
| DB + Auth | Supabase (Postgres, Auth, Realtime) | Tables: app_config, jobs, opt_outs, warm_leads; optional sms_cell_list. |
| Worker | Python (existing scripts) + small runner (e.g. FastAPI or a cron + script) | Runs on your machine or VPS; polls Supabase for jobs; runs scripts; updates status. |
| Inbound SMS | Twilio → Worker HTTP or Supabase Edge / Vercel serverless | Writes opt_outs and warm_leads; worker can stay CSV-first and sync, or DB-first. |

---

## 8. Where to put the frontend code

- **Option A – Same repo:** e.g. `scraping/app/` (Next.js). Single repo; Vercel points to `./app` as root or monorepo.  
- **Option B – Separate repo:** e.g. `scraping-dashboard`. Clean split; two Vercel projects; both use same Supabase project.

Recommendation: **Option A** if you want one repo and simple deploys; **Option B** if you prefer strict separation between “automation scripts” and “dashboard app”.

---

## 9. One-line summary

**Next.js on Vercel (settings + trigger actions + view data) + Supabase (config, jobs, opt_outs, warm_leads) + a small worker (your machine or VPS) that runs the existing Python scripts and updates job status in Supabase.**

If you tell me your preference (same repo vs separate repo, and whether you want Phase 1 scaffolded now), I can outline the exact Next.js + Supabase steps and table definitions next.
