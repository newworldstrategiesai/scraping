# Runbook: PropWire + CBC Pipeline (from video tutorial)

This doc maps the **video tutorial** (scrape homeowner phone numbers: PropWire → CyberBackgroundChecks → CSV) to **this app** and captures tips that make the pipeline more reliable and faster.

**We automate this without Chrome extensions.** The video uses Instant Data Scraper + UI Vision; we use **Python + Selenium (WebDriver)** for the same flow (open → type → click → store text → CSV). See **docs/AUTOMATION_WITHOUT_EXTENSIONS.md** for the Selenium IDE command → our code mapping and how to run CBC fully automatically.

---

## Video flow vs this app

| Video step | Video tools | This app equivalent |
|------------|-------------|---------------------|
| **1. Get addresses** | PropWire + Instant Data Scraper | PropWire in Cursor browser or Selenium; output **`propwire_addresses.csv`** (column **Address**). Settings: `addresses_csv_name` (default `propwire_addresses.csv`). |
| **2. Get phone numbers** | Addresses CSV → CyberBackgroundChecks + UI Vision RPA | **Run CBC lookups** job or `./run_cbc_only.sh [propwire_addresses.csv]`. Uses `tree_service_lead_automation.py` (Selenium) or Cursor browser. Output: **`tree_service_leads.csv`** (Full_Name, Address, Phone_Number, Phone_Type, etc.). |
| **3. Filter to mobile / build SMS list** | (Manual or same CSV) | **Build SMS list** job: reads `tree_service_leads.csv`, excludes opt-outs (and warm leads), filters to cell/wireless (or includes unknown). Output: **`sms_cell_list.csv`** + Supabase **`sms_cell_list_rows`**. |
| **4. Send & collect opt-ins** | (External) | **Send daily batch** (e.g. 450/day) via Twilio; **inbound webhook** `/api/inbound-sms` → Supabase **opt_outs** / **warm_leads**. |

So: **PropWire (addresses) → CBC (phones + type) → Build SMS list → Send daily batch → Inbound → Warm leads.** The video teaches the same pipeline with different tools (Instant Data Scraper, UI Vision); we use Cursor/Selenium and the dashboard jobs.

---

## Tips from the video that help our app

### PropWire / address scraping

- **Instant Data Scraper “Locate next button”:** On PropWire, “locate next button” often **doesn’t work** (e.g. it jumps to the last page and skips the middle). **Workaround:** click **Next** manually, then click **Start crawling** again; repeat to scrape ~250 rows per page. If you use Cursor or Selenium for PropWire instead of the extension, you control pagination the same way (next → scrape → next).
- **Output for our pipeline:** Save CSV with at least **Address** (one full address per row). Optional: Lead_Type, City, State, Zip, etc. Save as `propwire_addresses.csv` (or set `addresses_csv_name` in Settings to match).

### CyberBackgroundChecks (CBC) automation

- **Why CBC:** Fewer CAPTCHAs than some alternatives, so it’s easier to automate. Same idea in the video (UI Vision) and here (Selenium / run_cbc_only.sh).
- **Data to capture:** First name, last name, **phone number**, **phone type (wireless/mobile vs landline)**, address. We need **phone type** so Build SMS list can keep only cell/wireless (or include unknown). Our `tree_service_leads.csv` has **Phone_Type**; the video’s “store phone type” is the same.
- **Throughput:** Video reports ~**300 lookups/hour** (one address at a time). With “no delay” and shorter timeout, ~300–600/hour is plausible. So for 400 addresses, expect ~1–2 hours. Our **Run CBC** job has a 1-hour timeout by default; for large CSVs you may need to run in chunks or increase timeout.
- **If elements can’t be found (different screen size / layout):** Video fix: use **full XPath**. In DevTools: right-click the element (name, phone, phone type, “View details” button) → Copy → **Copy full XPath**, then paste into the automation’s selector/target. Our Selenium script uses similar selectors; if CBC changes layout or you use a different resolution, update the selectors (or use full XPath) in `tree_service_lead_automation.py` / CBC-related code.
- **Speed settings (UI Vision):** Video uses **timeout 5 seconds** (instead of 60) and **no delay** between steps to run faster. In our stack, equivalent knobs: Selenium implicit/explícit wait and any `time.sleep` between CBC steps; reduce where safe so long runs finish in reasonable time.

### Phone type (landline vs mobile)

- **SMS:** We only want **mobile/wireless** for the SMS list. Landlines don’t receive SMS. Build SMS list already filters by **Phone_Type** (cell/wireless) and can include “Unknown” via Settings (**Include unknown phone type**). So the video’s “store whether it’s wireless or landline” maps directly to our **Phone_Type** column and **Build SMS list** options.

---

## Quick reference: where things live in the app

| What | Where |
|------|--------|
| Address list name (for CBC) | Settings → **Addresses CSV name** (e.g. `propwire_addresses.csv`) |
| Run CBC on that list | Actions → **Run CBC lookups** (worker runs `run_cbc_only.sh` with that CSV) |
| Leads with phone + type | `tree_service_leads.csv` (and optionally quality_leads after parse) |
| Build SMS list (cell-only, exclude opt-outs/warm) | Actions → **Build SMS list** (optional city/state/zip); writes `sms_cell_list.csv` + Supabase |
| Send to cold list (daily batch) | Actions → **Send daily batch** (dry run or for real; default 450/day) |
| Opt-outs / warm leads (from replies) | Inbound webhook → Supabase; Lists → Opt-outs / Warm leads; Dashboard → Warm leads today/week |
| Message warm leads | Actions → **Message warm leads**; Contact view → **Send SMS (Twilio)** |

---

## How this runbook helps

- **New team members:** One place that ties the “scrape PropWire, look up phones on CBC” video to our actual jobs and files.
- **When CBC or PropWire breaks:** Use the video’s fixes (full XPath, manual next + crawl, timeout/delay) in the relevant step (address scrape vs CBC script).
- **Throughput and timeouts:** Expect ~300–600 CBC lookups/hour; size address lists and job timeouts accordingly.
- **Data quality:** Emphasize capturing **phone type** so Build SMS list can target mobile only and hit the 10–16 warm leads/day goal efficiently.

For full pipeline details (Cursor browser, Selenium, Twilio, Supabase), see **README_LEAD_AUTOMATION.md**, **PLAN_WARM_LEADS_FARMING.md**, and **PATH_TO_100_LEADS.md**.
