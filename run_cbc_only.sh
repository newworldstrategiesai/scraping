#!/usr/bin/env bash
# Run CBC lookups only: load addresses from propwire_addresses.csv (no PropWire scrape).
# Use when PropWire blocks automation; addresses can come from Cursor browser or manual export.
#
# Usage:
#   ./run_cbc_only.sh                    # uses propwire_addresses.csv, visible browser
#   ./run_cbc_only.sh other_addresses.csv
#   USE_EXISTING=1 ./run_cbc_only.sh     # attach to Chrome on port 9222 (start with start_chrome_for_automation.sh)
#
# Output: tree_service_leads.csv (mobile/cell only from CBC). For full schema + Unknown phone type,
# capture in Cursor browser and merge, or run parse_quality_leads / build_sms_list on existing data.

set -e
cd "$(dirname "$0")"

if [[ ! -d .venv ]]; then
  echo "Creating .venv (one-time)..."
  python3.10 -m venv .venv 2>/dev/null || python3 -m venv .venv
  .venv/bin/pip install -q -r requirements.txt
fi

ADDRESSES_CSV="${1:-propwire_addresses.csv}"
VISIBLE="--no-headless"
[[ -n "$HEADLESS" ]] && VISIBLE=""
EXTRA=""
[[ -n "$USE_EXISTING" ]] && EXTRA="--use-existing-browser"

if [[ ! -f "$ADDRESSES_CSV" ]]; then
  echo "Addresses file not found: $ADDRESSES_CSV"
  echo "Usage: ./run_cbc_only.sh [addresses.csv]   # default: propwire_addresses.csv"
  exit 1
fi

exec .venv/bin/python tree_service_lead_automation.py \
  --addresses-csv "$ADDRESSES_CSV" \
  $VISIBLE $EXTRA
