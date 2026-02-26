# Path to 100 Leads

You have **50 addresses** in `propwire_addresses.csv` and need **100 leads** (name + phone per person). Here’s what’s in place and how to get there.

## What’s done

- **Address loading:** Fixed so full addresses (e.g. `1569 Blue Grass Cv Germantown, TN 38138`) are read from CSV correctly (comma in address no longer splits into wrong columns).
- **Saving all leads:** The automation now saves **all** phone types (Mobile, Cell, Unknown, Landline) to `tree_service_leads.csv`. You filter to cell-only when building the SMS list with `build_sms_list.py`.
- **CBC automation:** Still fails on the current CBC page (search input not found or not interactable). So automated CBC from this repo is unreliable until the site’s selectors are updated.

## Ways to get to 100 leads

### Option A: Cursor browser (recommended)

1. Open **CyberBackgroundChecks** in the Cursor browser.
2. For each address in `propwire_addresses.csv` (or a subset), search the address, then copy name + phone + phone type (and “Lives at” when shown) into a sheet or CSV.
3. Save that as e.g. `cbc_export.csv` with columns: `Full_Name`, `Address`, `Phone_Number`, `Phone_Type`, and optionally `Resident_Type`.
4. Merge into the main leads file:
   ```bash
   python scripts/merge_cbc_results.py cbc_export.csv
   ```
   That appends new rows to `tree_service_leads.csv` and dedupes by (Address, Phone_Number).

Do this for as many addresses as you need (e.g. ~50 addresses at ~2 leads each ≈ 100 leads).

### Option B: More addresses, then CBC

1. Add more PropWire addresses (e.g. expand area or pages) so you have 100+ addresses in `propwire_addresses.csv`.
2. Run CBC lookups (Cursor browser as in Option A) for those addresses and merge with `merge_cbc_results.py`.

### Option C: Try automation again (visible browser)

CBC may work with a visible (non-headless) browser and current selectors:

```bash
./run_cbc_only.sh propwire_addresses.csv
```

If the CBC page shows a search box, the script might work; if it still can’t find the input or gets blocked, use Option A.

## After you have 100+ rows in tree_service_leads.csv

1. **Quality shortlist (optional):**
   ```bash
   python parse_quality_leads.py --lives-at-only --output quality_leads.csv
   ```
2. **SMS list (cell-only for texting):**
   ```bash
   python scripts/build_sms_list.py --include-unknown-phone-type
   ```
   Use `--include-unknown-phone-type` if many rows have Unknown phone type; drop that flag when you only want Mobile/Cell.

You’ll get `sms_cell_list.csv` with up to 100 numbers (after dedupe and opt-outs) ready for your SMS campaign.
