# Lead Automation Dashboard

Browser UI to control parameters and queue jobs for the tree service lead pipeline (PropWire → CBC → SMS). Phase 1: settings + job queue. Phase 2: **worker** runs jobs (see parent repo).

## Stack

- **Next.js 16** (App Router), **Tailwind**, **ShadCN UI**
- **Supabase** for config and job queue
- **Worker** (parent repo): `python scripts/worker.py` polls Supabase and runs scripts

## Setup

1. **Env**
   - Copy `.env.example` to `.env.local`
   - Set `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from [Supabase](https://supabase.com/dashboard) → Project Settings → API

2. **Schema**
   - In Supabase → SQL Editor, run the contents of `supabase/schema.sql` to create `app_config`, `jobs`, and optional `opt_outs` / `warm_leads` tables

3. **Run**
   ```bash
   npm install
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

## Pages

- **Dashboard** (`/`) – Connection status, link to Settings / Actions / Jobs
- **Settings** (`/settings`) – Company name, SMS template, delay, addresses CSV name, include unknown phone type. Saved to Supabase `app_config`.
- **Actions** (`/actions`) – Buttons: Build SMS list, Parse quality leads, Run CBC, Send campaign (dry run / for real). Each creates a **pending** job in `jobs`.
- **Jobs** (`/jobs`) – List of jobs (status, created/started/finished, log). Without a worker they stay pending.

## Deploy (Vercel)

1. Push to GitHub and import the repo in Vercel (or link `app` as root).
2. Add env vars: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
3. Deploy. The UI works; jobs run when a worker is running (see below).

## Running the worker (Phase 2)

From the **parent repo root** (not `app/`):

1. **Env:** Ensure `.env` has `SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (same as app). Optional for real SMS: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM`.
2. **Install:** `pip install -r requirements.txt` (or use existing `.venv`).
3. **Run:** `python scripts/worker.py`. Worker polls every 15s; Ctrl+C to stop.

See parent `PLAN_WORKER.md` for full design and script mapping.
