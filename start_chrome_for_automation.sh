#!/usr/bin/env bash
# Start Chrome with remote debugging so the automation can attach to it.
# 1. Quit Chrome completely first, then run this script.
# 2. In the Chrome window that opens, go to https://propwire.com and log in.
# 3. In another terminal: ./run.sh "Germantown, TN" 10
#    But run the Python script with --use-existing-browser (see below).
#
# To run automation attached to this Chrome:
#   .venv/bin/python tree_service_lead_automation.py --use-existing-browser --no-headless --target-city "Germantown, TN" --min-leads 10

set -e
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
if [[ ! -x "$CHROME" ]]; then
  echo "Chrome not found at $CHROME"
  exit 1
fi
echo "Starting Chrome with remote debugging on port 9222. Log in to Propwire in that window, then run:"
echo "  .venv/bin/python tree_service_lead_automation.py --use-existing-browser --no-headless --target-city \"Germantown, TN\" --min-leads 10"
exec "$CHROME" --remote-debugging-port=9222
