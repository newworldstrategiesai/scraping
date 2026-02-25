# Lead Automation Dashboard

Browser UI to control parameters and queue jobs for the tree service lead pipeline (PropWire → CBC → SMS). Phase 1: settings + job queue. Jobs stay **pending** until a worker runs (Phase 2).

## Stack

- **Next.js 16** (App Router), **Tailwind**, **ShadCN UI**
- **Supabase** for config and job queue (no worker yet)

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
3. Deploy. The UI works; jobs stay pending until you add a worker (see parent `PLAN_FRONTEND_VERCEL_SUPABASE.md` Phase 2).

## Next (Phase 2)

Run a **worker** (your machine or a server) that polls Supabase for `status = 'pending'` jobs, runs the matching Python script from the parent repo, and updates `status`, `log`, `error` in `jobs`.
