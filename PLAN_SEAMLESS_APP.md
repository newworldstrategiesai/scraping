# Plan: Make the App Work Seamlessly

**Goal:** One coherent pipeline from addresses → leads → SMS list → daily batch → warm leads, with a single source of truth, clear status, and minimal manual steps.

---

## 1. Current flow (what we have)

| Step | Input | Output | Where it runs |
|------|--------|--------|----------------|
| **1. Addresses** | PropWire scrape or manual CSV | `propwire_addresses.csv` (or `addresses_csv_name`) | Cursor / Selenium / manual; file on **worker disk** |
| **2. CBC lookups** | Addresses CSV | `tree_service_leads.csv` | **Worker:** `run_cbc_only.sh` |
| **3. Build SMS list** | `tree_service_leads.csv` + `opt_outs.csv` | `sms_cell_list.csv` + Supabase `sms_cell_list_rows` | **Worker:** `build_sms_list.py` |
| **4. Send daily batch** | `sms_cell_list.csv` − opt_outs − warm_leads, limit 450 | Twilio SMS | **Worker:** `send_campaign.py` (uses **Supabase** opt_outs/warm_leads via export) |
| **5. Inbound replies** | Twilio webhook | Supabase `opt_outs` / `warm_leads` | **Vercel:** `/api/inbound-sms` |
| **6. Message warm leads** | Supabase `warm_leads` | Twilio SMS | **Worker:** `send_warm_lead_message.py` (uses exported CSV from Supabase) |

**Gaps that break “seamless”:**

1. **Build SMS list uses stale opt-outs.** It reads `opt_outs.csv` on disk. Inbound STOP writes to **Supabase** only. So new opt-outs never affect the next Build SMS list run until someone syncs CSV ↔ Supabase manually.
2. **Addresses are file-only.** There’s no in-app upload; addresses must land on worker disk (e.g. `propwire_addresses.csv`) before Run CBC. Fine for “run worker on same machine as scrape,” unclear when worker is remote.
3. **Worker visibility.** Dashboard shows “X pending”; it doesn’t show “worker last ran at X” or “no worker connected,” so it’s unclear if jobs will ever run.
4. **No single “go live” checklist.** Env vars, Twilio webhook, worker start, and first run are spread across README, PLAN_WARM_LEADS_FARMING, etc.

---

## 2. Principles for seamless operation

- **Single source of truth for opt-outs and warm leads:** Supabase. Every script that needs them gets them from Supabase (today: worker exports to CSV before run; later: optional direct read if we add it).
- **Worker exports before any job that needs opt_outs/warm_leads:** Send campaign already does this; Build SMS list should too.
- **Clear expectations for file-based data:** Addresses and lead CSVs live on worker disk; UI and docs state that and (optional) how to get files there (e.g. upload later, or “run worker where you run CBC”).
- **Visibility:** Dashboard or Actions page shows pending count and (optional) “last job finished at” so users know the worker is alive.
- **One go-live checklist:** Env, Twilio webhook, worker, first flow in one place.

---

## 3. Changes to make (in order)

### 3.1 Build SMS list: use Supabase opt-outs (required)

**Problem:** Build SMS list reads `opt_outs.csv` on disk; inbound opt-outs go to Supabase only, so the list can include people who already said STOP.

**Change:**

- **Worker:** Before running `build_sms_list`, export opt_outs from Supabase to `_worker_opt_outs.csv` (reuse existing `export_opt_outs_and_warm_leads` or a slim export-opt-outs-only).
- **Worker:** Pass `--opt-outs _worker_opt_outs.csv` to `build_sms_list.py` so it always uses current Supabase opt-outs.
- **Result:** Build SMS list and Send daily batch both use the same source of truth (Supabase) for opt-outs; no manual CSV sync.

**Files:** `scripts/worker.py` (export before build_sms_list, add `--opt-outs` to build_cmd for build_sms_list).

---

### 3.2 Go-live checklist (doc + optional UI hint)

**Problem:** Getting the app “live” (Vercel + worker + Twilio) is spread across several docs.

**Change:**

- Add **GO_LIVE_CHECKLIST.md** (or a section in README) with one ordered list:
  1. **Supabase:** Project created, schema from `app/supabase/schema.sql` applied, copy `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` into Vercel and worker env.
  2. **Vercel:** Deploy app; set same Supabase vars; note app URL (e.g. `https://your-app.vercel.app`).
  3. **Twilio:** Phone number; set “A message comes in” webhook to `https://your-app.vercel.app/api/inbound-sms` (POST).
  4. **Worker:** Same machine or server as CBC/scripts; set `SUPABASE_URL` (or `NEXT_PUBLIC_SUPABASE_URL`), `SUPABASE_SERVICE_ROLE_KEY`, and for send jobs `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM`; run `python scripts/worker.py` (or equivalent).
  5. **First run:** Put `propwire_addresses.csv` in repo root (or set `addresses_csv_name` in Settings) → Run CBC → Build SMS list → Send daily batch (dry run then for real). Confirm inbound: reply STOP and YES and check Lists (opt-outs / warm leads) and dashboard “Warm leads today.”
- Optionally add a short “Setup” or “Go live” card on the dashboard that links to this checklist.

**Files:** New `GO_LIVE_CHECKLIST.md` (or README section); optionally one line/link on dashboard.

---

### 3.3 Worker status (optional but helpful)

**Problem:** Users can’t tell if the worker is running; they only see “X pending.”

**Change:**

- **Dashboard or Actions:** Show “Last job finished at &lt;time&gt;” (from latest job with `status in ('success','failed')` and `finished_at`). If there’s no such job, show “No jobs run yet. Start the worker to process jobs.”
- **Result:** “Last job finished 2 min ago” = worker is alive; “No jobs run yet” or very old time = start or check worker.

**Files:** `app/app/dashboard/page.tsx` (or actions page): fetch latest finished job, display `finished_at`; optional small “Worker status” card.

---

### 3.4 Addresses and lead files: clarify in UI (optional)

**Problem:** Address and lead lists are file-based; it’s not obvious where the file must live (worker disk) and how it gets there.

**Change:**

- **Lists → Address lists tab:** Short line: “Address list is read from a file on the **worker machine**: &lt;filename&gt; (set in Settings). Put the CSV in the repo root where the worker runs, or run the worker where you export PropWire/addresses.”
- **Settings:** Already shows “Addresses CSV name (for CBC)”. No code change required if the doc is clear; optional: add one sentence in Settings description: “File must exist in repo root on the worker.”
- **Result:** No surprise that “Run CBC” fails if the file isn’t on the worker; path to fix is clear.

**Files:** `app/app/lists/address-lists-tab.tsx` or Lists page (one line of copy); optionally Settings placeholder/description.

---

### 3.5 Error recovery and timeouts (optional)

**Problem:** Long jobs (e.g. Run CBC) can time out; failed jobs show error but there’s no formal “resume” flow.

**Change:**

- **Docs:** In RUNBOOK or GO_LIVE: “If Run CBC times out (e.g. 1 hour), reduce the addresses CSV (e.g. first 200 rows) or run CBC in chunks; worker timeout is 1 hour by default.”
- **Optional:** Worker or script support for “resume from row N” (e.g. `run_cbc_only.sh` reads a checkpoint or start row). Lower priority; doc is enough for first version.
- **Result:** Users know why a job failed and how to split work.

**Files:** RUNBOOK or GO_LIVE_CHECKLIST.md; optionally worker/script for CBC resume.

---

## 4. Data flow after changes (target state)

```
Inbound SMS (STOP/YES) → Supabase opt_outs / warm_leads  (single source of truth)
                                    ↑
Worker (before Build SMS list):     │ export opt_outs → _worker_opt_outs.csv
Worker (before Send daily batch):   │ export opt_outs + warm_leads → _worker_*.csv
                                    │
Build SMS list:  tree_service_leads + _worker_opt_outs → sms_cell_list.csv + Supabase sms_cell_list_rows
Send daily batch: sms_cell_list.csv − _worker_opt_outs − _worker_warm_leads, limit 450 → Twilio
Message warm leads: _worker_warm_leads → Twilio
```

- **Addresses:** Still file on worker disk (`propwire_addresses.csv` or `addresses_csv_name`). No change for now; doc and UI copy make it explicit.
- **Leads:** Still `tree_service_leads.csv` from Run CBC on worker. Optional future: upload addresses/leads via UI (e.g. store in Supabase and have worker pull or write to disk); out of scope for this plan.

---

## 5. Implementation order

| # | What | Delivers |
|---|------|----------|
| 1 | Build SMS list use Supabase opt-outs | Worker exports opt_outs before build_sms_list; pass `--opt-outs _worker_opt_outs.csv`. Build SMS list always excludes current opt-outs. |
| 2 | Go-live checklist | Single doc (or README section) with: Supabase, Vercel, Twilio webhook, worker env + start, first run (addresses → CBC → Build SMS list → Send daily batch → verify inbound). Optional: link from dashboard. |
| 3 | Worker status on dashboard | Show “Last job finished at X” or “No jobs run yet. Start the worker.” |
| 4 | Address/list copy in UI | One line on Lists (address tab) and/or Settings: file must be on worker machine; filename from Settings. |
| 5 | Error/timeout docs | RUNBOOK or GO_LIVE: what to do when Run CBC times out (chunk addresses, 1-hour timeout). Optional: CBC resume later. |

---

## 6. Success criteria

- **Opt-outs:** Anyone who replies STOP is excluded from the **next** Build SMS list and from all Send daily batch runs (already true for send; after 3.1 true for build).
- **One place for live setup:** One checklist (GO_LIVE or README) so a new deploy is “follow this list and you’re live.”
- **Visibility:** User can see pending count and (after 3.3) whether the worker has run recently.
- **No hidden assumptions:** Address/list files are clearly “on worker disk” in UI or docs.

After 3.1 and 3.2, the app runs seamlessly for the main path: addresses on worker → CBC → Build SMS list (with current opt-outs) → Send daily batch (with current opt-outs + warm leads) → inbound → warm leads; one checklist gets you there.
