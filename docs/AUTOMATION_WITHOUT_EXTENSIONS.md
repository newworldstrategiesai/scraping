# Automation Without Chrome Extensions

**Yes – we automate PropWire → CBC → leads without using Chrome extensions manually.** We use **Python + Selenium (WebDriver)**, which is the programmatic equivalent of Selenium IDE / UI Vision. No Instant Data Scraper or UI Vision extension is required to run the pipeline.

---

## How it works

| Video / extension flow | Our automation |
|------------------------|----------------|
| **Instant Data Scraper** on PropWire → export addresses CSV | **Python/Selenium** in `tree_service_lead_automation.py`: PropWire search + scrape addresses, or **skip PropWire** and load addresses from `propwire_addresses.csv` (e.g. from Cursor browser or manual export when PropWire blocks). |
| **UI Vision RPA**: read CSV → open CBC → type address → click → store name/phone/type → save CSV | **Same steps in code**: `tree_service_lead_automation.py` reads addresses from CSV, opens CyberBackgroundChecks, types each address, clicks search, finds contact blocks, extracts **name, phone, phone type** (like `storeText`), appends to a list, then writes **tree_service_leads.csv**. |
| Run in a **loop** (one row per iteration) | We loop over addresses in Python: `for addr in addresses: ... cbc_lookup_address(driver, addr)`. |
| **Command line** to run the macro | We run: `./run_cbc_only.sh` or `python tree_service_lead_automation.py --addresses-csv propwire_addresses.csv`. Worker can run the same via the **Run CBC lookups** job. |

So the **CBC part is fully automated in code** – no extension, no manual “play macro.” The **PropWire part** is also automated in code when possible; when PropWire blocks automation we use Cursor browser or manual export to get addresses into a CSV, then CBC still runs automatically.

---

## Selenium IDE commands → our Python/Selenium code

The Selenium IDE (and UI Vision) commands you see in the docs map directly to WebDriver API calls in our script:

| Selenium IDE command | Target / Value | Our code (equivalent) |
|----------------------|----------------|------------------------|
| **open** | URL | `driver.get(url)` |
| **type** | locator, text | `element.send_keys(text)` |
| **click** | locator | `element.click()` |
| **storeText** | locator | variable | `name = element.text` then store in dict/CSV |
| **storeValue** | locator | variable | `value = element.get_attribute("value")` |
| **csvRead** | CSV file | (loop) | `addresses = pd.read_csv(csv_path)["Address"].tolist()` then `for addr in addresses:` |
| **csvSave** / write line | CSV file | | `pd.DataFrame(leads).to_csv(output_path)` (we build a list of dicts, then write once) |
| **pause** | milliseconds | | `time.sleep(seconds)` (we use `human_delay()` for CBC) |
| **waitForElementPresent** | locator | | `WebDriverWait(driver, timeout).until(EC.presence_of_element_located((By.XPATH, ...)))` (implicit/explicit wait) |
| **selectFrame** | frame | | `driver.switch_to.frame(...)` (we use when needed) |

So everything you can do in Selenium IDE (open, type, click, store text, read/write CSV, wait, loop) we do in **Python with the same WebDriver**. No extension is needed at runtime.

---

## What runs where

| Step | Automated? | How |
|------|------------|-----|
| **1. Get addresses** | Optional (can be manual) | **Automated:** `tree_service_lead_automation.py` can scrape PropWire. **When blocked:** Use Cursor browser or Instant Data Scraper once to export addresses → save as `propwire_addresses.csv`. |
| **2. CBC lookups** | **Yes, fully automated** | `tree_service_lead_automation.py` + `run_cbc_only.sh`: read addresses CSV → for each address: open CBC, type, click, extract name/phone/type → write **tree_service_leads.csv**. No extension. |
| **3. Build SMS list** | **Yes** | Worker runs `scripts/build_sms_list.py`: reads tree_service_leads + opt_outs → writes sms_cell_list.csv + Supabase. |
| **4. Send daily batch** | **Yes** | Worker runs `scripts/send_campaign.py` with Supabase-exported opt_outs/warm_leads. |
| **5. Inbound → warm leads** | **Yes** | Next.js API `/api/inbound-sms` writes to Supabase. |

So the only step that might involve a browser extension is **getting addresses from PropWire** when we choose not to use (or when PropWire blocks) our Selenium PropWire scraper. All other steps, including **all of CBC**, are automated without any Chrome extension.

---

## Running it

- **CBC only (no PropWire in this run):**  
  Put addresses in `propwire_addresses.csv` (one per row, column `Address`). Then:
  ```bash
  ./run_cbc_only.sh
  # or
  python tree_service_lead_automation.py --addresses-csv propwire_addresses.csv --no-headless
  ```
- **From the app:**  
  Use **Run CBC lookups** on the Actions page (worker must be running; it runs `run_cbc_only.sh` with the configured addresses CSV).

No Selenium IDE or UI Vision extension is required; the same “open → type → click → storeText → CSV” flow is implemented in Python/Selenium in this repo.
