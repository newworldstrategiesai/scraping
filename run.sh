#!/usr/bin/env bash
# Run tree service lead automation. Uses project .venv (Python 3.10).
# Usage: ./run.sh
#   Or:  ./run.sh "Tate County, MS" 50
#   Headless: HEADLESS=1 ./run.sh

set -e
cd "$(dirname "$0")"

if [[ ! -d .venv ]]; then
  echo "Creating .venv (one-time)..."
  python3.10 -m venv .venv 2>/dev/null || python3 -m venv .venv
  .venv/bin/pip install -q -r requirements.txt
fi

CITY="${1:-Senatobia, MS}"
MIN_LEADS="${2:-10}"
VISIBLE="--no-headless"
[[ -n "$HEADLESS" ]] && VISIBLE=""

exec .venv/bin/python tree_service_lead_automation.py --target-city "$CITY" --min-leads "$MIN_LEADS" $VISIBLE
