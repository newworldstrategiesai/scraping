# Tree Service Lead Automation (Senatobia, MS)

End-to-end pipeline for tree service lead generation: **PropWire addresses → CyberBackgroundChecks phone lookups → CSV with names, addresses, phone numbers, and phone type (wireless/mobile vs landline)** for SMS outreach and warm leads.

---

## How it works (same pipeline, different tools)

The workflow matches what you’ll see in common tutorials:

1. **Initial data scraping (PropWire)**  
   Extract property addresses from PropWire.  
   - **Tutorials often use:** [Instant Data Scraper](https://chrome.google.com/webstore/detail/instant-data-scraper) (browser extension) on the PropWire search results page to scrape addresses into a CSV.  
   - **This repo:** Cursor browser (when PropWire blocks Selenium) or Python/Selenium with `--use-existing-browser` so you’re logged in. Output: `propwire_addresses.csv` (required column: **Address**; optional: Lead_Type, Lot_Size, etc.).

2. **Automated phone lookup (CyberBackgroundChecks)**  
   Feed each address into CyberBackgroundChecks to get names and phone numbers. CBC is often used because it’s relatively automation-friendly (fewer CAPTCHAs than some alternatives).  
   - **Tutorials often use:** [UI.Vision](https://ui.vision/) (RPA): read addresses from CSV → open CBC → type address → click contact details → save **person name, address, phone number, phone type (wireless/mobile or landline)** into a new CSV; repeat for all rows.  
   - **This repo:** Python/Selenium script (`tree_service_lead_automation.py --addresses-csv ...`) or Cursor browser when automation is blocked. Output: `tree_service_leads.csv` with **Full_Name, Address, Phone_Number, Phone_Type** (and optional Resident_Type, Source_Address, etc.). We record **phone type (mobile/cell vs landline)** so you can filter to cell-only for SMS later.

3. **Scale**  
   Same idea in both approaches: run through thousands of addresses, store name + address + phone + phone type, then filter to **wireless/mobile** for texting.

**Summary:** PropWire (addresses) → CBC (names + phones + phone type) → CSV. We use Cursor browser and/or Python/Selenium; tutorials often use Instant Data Scraper + UI.Vision. The data model and end goal (cell numbers for SMS → warm leads) are the same.

---

## Setup

```bash
cd /Users/benmurray/scraping
pip install -r requirements.txt
```

- **Chrome**: Required. Script uses `webdriver-manager` to install matching ChromeDriver automatically.
- **Credentials**: Generated Propwire password is saved to `.env.credentials` (keep private; add to `.gitignore`).

## Hybrid workflow (recommended): Cursor browser + automation

Use the **Cursor in-editor browser only for Propwire** (avoids bot blocks; you stay logged in). Use the **Python script only for Cyber Background Checks** (reliable, repeatable, mobile-only filter).

1. **Propwire in Cursor browser**  
   In Cursor, ask the AI to: open Propwire, search your area (e.g. Germantown, TN), apply filters, and capture addresses into `propwire_addresses.csv`. The CSV must have a column named **Address** (one full address per row).

2. **Run automation for CBC only**  
   From the project folder:
   ```bash
   ./run_cbc_only.sh
   # or with a different addresses file:  ./run_cbc_only.sh other_addresses.csv
   # or attach to Chrome on port 9222:   USE_EXISTING=1 ./run_cbc_only.sh
   ```
   Or run the script directly:
   ```bash
   .venv/bin/python tree_service_lead_automation.py --addresses-csv propwire_addresses.csv --no-headless
   ```
   The script skips Propwire, loads addresses from the CSV, and runs all Cyber Background Checks lookups. Output: `tree_service_leads.csv` (mobile/cell only when CBC returns phone type).

**Why this flow:** Propwire often blocks headless/automated traffic. CBC is more tolerant. Splitting keeps Propwire human-driven and automates the tedious part.

---

## Lead quality (how to get better leads)

Raw address + name + phone is only the first step. Quality for a **tree service** means targeting people likely to need tree work and who are reachable.

**1. Propwire – who gets into the list**

- **Property type:** Prefer **Single Family** so you get homeowners with yards, not apartments.
- **Lot size:** If the site allows it, filter **Lot Size > 0.5 acre** (or similar) so you get properties with more trees/land.
- **Lead type:** Use Propwire’s lead filters when capturing addresses:
  - **Absentee owners** – may need maintenance (including tree work) done remotely.
  - **High equity** – more likely to invest in property upkeep.
  - **Pre-foreclosure** – sometimes need quick cleanup or trimming for sale.
- **Geography:** Stick to your service area (e.g. Germantown, TN) so leads are actually contactable and serviceable.

**2. CBC – who we treat as the “lead”**

- Prefer people who **“Lives at”** the address (current resident/owner) over **“Used to live”** (past only).
- When possible, use **VIEW DETAILS** and record **Phone_Type**; keep **Mobile/Cell** for outreach and drop or tag Landline so you don’t waste calls.
- One **primary lead per address** (e.g. first “Lives at” person with a mobile) keeps the list clean and avoids duplicate mail/calls to the same house.

**3. After export – tree_service_leads.csv**

- **Dedupe by phone** so the same number isn’t contacted for multiple addresses.
- **Filter to Mobile/Cell only** when you have that column (script does this when CBC returns phone type).
- Optionally add columns: **Lead_Type** (e.g. Absentee, High Equity), **Lot_Size**, **Notes**, so you can prioritize who to call first.

**Summary:** Quality = **right property** (Propwire filters) + **right person** (Lives at, primary resident) + **right contact** (mobile when possible) + **clean list** (dedupe, one lead per address).

---

## Quality over quantity – record useful data, parse later

We **record every useful field** from Propwire and CBC so you can filter and prioritize later. Prefer **quality over quantity**; use the columns to build a shortlist.

- **propwire_addresses.csv** – When capturing from Propwire, record **Address** (required) plus **Lead_Type**, **Property_Type**, **Lot_Size**, **Est_Value**, **Equity_Pct**, **Notes** when visible so we can merge into leads.
- **tree_service_leads.csv** – When recording from CBC, record **Full_Name**, **Address**, **Phone_Number** plus **Phone_Type**, **Resident_Type** (Lives at / Used to live), **Source_Address**, **CBC_Result_Count**, **Notes** when available so we can filter later.

See **DATA_SCHEMA.md** for full column definitions and how to parse/filter (e.g. Resident_Type == "Lives at", Phone_Type in Mobile/Cell, merge Propwire fields, dedupe by phone).

**Build a quality shortlist:**  
`python parse_quality_leads.py --input tree_service_leads.csv --output quality_leads.csv --merge-propwire --mobile-only`  
(Optional: drop `--lives-at-only` to include rows where Resident_Type is blank.)

---

## Run (full automation)

**Headless (default):**
```bash
python tree_service_lead_automation.py --target-city "Senatobia, MS" --min-leads 1000
```

**Visible browser (debugging):**
```bash
python tree_service_lead_automation.py --target-city "Senatobia, MS" --min-leads 100 --no-headless
```

**Other areas:**
```bash
python tree_service_lead_automation.py --target-city "Tate County, MS" --min-leads 500
```

**Use a browser where you're already logged into Propwire (avoids "unusual activity" block):**

1. **Quit Chrome completely** (all windows).
2. Start Chrome with remote debugging (run this in a terminal, then leave it open):

   **macOS:**
   ```bash
   /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222
   ```
   **Windows:** Run Chrome with `--remote-debugging-port=9222` (e.g. shortcut target: `chrome.exe --remote-debugging-port=9222`).

3. In that Chrome window, go to https://propwire.com and **log in**.
4. In another terminal, run the script attached to that browser:
   ```bash
   python tree_service_lead_automation.py --use-existing-browser --no-headless --target-city "Germantown, TN" --min-leads 10
   ```
   The script will use that same Chrome (and your Propwire session); it won’t open a new window or quit Chrome when done.

## SMS → warm leads plan

**Goal:** Get cell numbers for property owners, send one SMS (“we’re doing tree work in your neighborhood – need any help?”), and treat replies that indicate interest as **warm leads**.

See **PLAN_SMS_WARM_LEADS.md** for the full plan: data (cell-only), compliance (TCPA, opt-out), SMS platform and script, inbound handling (interest vs STOP), warm-lead storage, and phased rollout.

- **Build SMS list:** `python scripts/build_sms_list.py` (or `--include-unknown-phone-type` when Phone_Type is Unknown).
- **Send campaign (dry-run):** `python scripts/send_campaign.py` (prints would-send list). **Actually send:** set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM` and run `python scripts/send_campaign.py --send`.
- **Inbound replies:** Run `python scripts/inbound_sms_handler.py` and point your Twilio number's webhook to `https://your-host/inbound-sms`; replies update `opt_outs.csv` (STOP) and `warm_leads.csv` (YES/interest).

---

## Outputs

- `propwire_addresses.csv` – Raw addresses from Propwire (with optional Lead_Type, Lot_Size, etc.).
- `tree_service_leads.csv` – Final leads: **Full_Name, Address, Phone_Number, Phone_Type** (only rows where Phone_Type contains "Mobile" or "Cell").
- `automation_log.txt` – All actions, successes, and errors.

## Manual steps

- If Propwire requires **email verification**, the script logs instructions and exits. Verify the email for `newworldstrategiesai@gmail.com`, then re-run; credentials are in `.env.credentials`.
- **CAPTCHA**: If either site shows a CAPTCHA, the script cannot complete that step; log will indicate and you may need to run with `--no-headless` and solve once, or reduce request rate.

## Selectors

Sites change. If steps fail (e.g. "element not found"):

1. Run with `--no-headless`.
2. Open DevTools (F12) on the target page.
3. Right-click the target element → Copy → Copy selector or Copy XPath.
4. Update the corresponding selector in `tree_service_lead_automation.py` (search for the step name or URL).

## Warnings

- Respect **robots.txt** and each site’s **terms of service**. For educational use.
- Heavy automation can lead to **IP blocks**. For large-scale runs, consider proxies or VPN and longer delays.
