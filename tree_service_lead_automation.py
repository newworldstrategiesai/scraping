#!/usr/bin/env python3
"""
Tree Service Lead Automation - Senatobia, MS (expandable to Tate County).

FULLY AUTOMATED lead generation: Propwire property search → Cyber Background Checks
address lookup → CSV output with names and mobile phones only.

WARNING: Respect robots.txt and terms of service. For educational purposes.
Heavy automation may trigger IP blocks; consider proxies/VPN for large-scale runs.
"""

import argparse
import logging
import os
from typing import Dict, List
import random
import re
import secrets
import string
import time
from pathlib import Path

import pandas as pd
from selenium import webdriver
from selenium.common.exceptions import (
    ElementClickInterceptedException,
    NoSuchElementException,
    TimeoutException,
)
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait
from webdriver_manager.chrome import ChromeDriverManager

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
LOG_FILE = "automation_log.txt"
PROPWIRE_ADDRESSES_CSV = "propwire_addresses.csv"
FINAL_LEADS_CSV = "tree_service_leads.csv"
CREDENTIALS_FILE = ".env.credentials"  # Store generated password here
DEFAULT_EMAIL = "newworldstrategiesai@gmail.com"
DEFAULT_FIRST_NAME = "New"
DEFAULT_LAST_NAME = "World"
MAX_RETRIES = 3
WAIT_TIMEOUT = 20
HUMAN_DELAY_MIN = 2
HUMAN_DELAY_MAX = 8
CBC_DELAY_MIN = 5
CBC_DELAY_MAX = 15
BATCH_SIZE_CBC = 50
TARGET_LEADS_DEFAULT = 1000

# User-Agent rotation (common desktop Chrome UAs)
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
]

# ---------------------------------------------------------------------------
# Logging setup
# ---------------------------------------------------------------------------
def setup_logging():
    """Configure file and console logging."""
    log_path = Path(LOG_FILE)
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
        handlers=[
            logging.FileHandler(log_path, encoding="utf-8"),
            logging.StreamHandler(),
        ],
    )
    return logging.getLogger(__name__)


logger = setup_logging()


# ---------------------------------------------------------------------------
# Utilities
# ---------------------------------------------------------------------------
def human_delay(min_sec=None, max_sec=None):
    """Random delay between min_sec and max_sec (default 2–8)."""
    lo = min_sec if min_sec is not None else HUMAN_DELAY_MIN
    hi = max_sec if max_sec is not None else HUMAN_DELAY_MAX
    delay = random.uniform(lo, hi)
    time.sleep(delay)


def generate_password(length=14):
    """Generate a strong random password (alphanumeric + symbols)."""
    alphabet = string.ascii_letters + string.digits + "!@#$%&*"
    return "".join(secrets.choice(alphabet) for _ in range(length))


def save_credentials(email: str, password: str):
    """Save credentials to a local file (exclude from git)."""
    with open(CREDENTIALS_FILE, "w") as f:
        f.write(f"PROPWIRE_EMAIL={email}\n")
        f.write(f"PROPWIRE_PASSWORD={password}\n")
    logger.info("Credentials saved to %s (keep private)", CREDENTIALS_FILE)


def get_driver(headless: bool = True, stealth: bool = False, debugger_address: str = None):
    """
    Create Chrome WebDriver. If debugger_address is set (e.g. 127.0.0.1:9222),
    attach to an existing Chrome where you're already logged in (no new window).
    If stealth=True and undetected-chromedriver is installed, use it to reduce bot detection.
    """
    if debugger_address:
        try:
            options = Options()
            options.add_experimental_option("debuggerAddress", debugger_address)
            service = Service(ChromeDriverManager().install())
            driver = webdriver.Chrome(service=service, options=options)
            driver._attached = True  # don't quit this browser when we're done
            logger.info("Attached to existing Chrome at %s", debugger_address)
            return driver
        except Exception as e:
            logger.error("Failed to attach to Chrome at %s: %s", debugger_address, e)
            raise

    if stealth:
        try:
            import undetected_chromedriver as uc
            opts = uc.ChromeOptions()
            if headless:
                opts.add_argument("--headless=new")
            driver = uc.Chrome(options=opts, use_subprocess=True)
            logger.info("Using undetected Chrome (stealth mode)")
            return driver
        except ImportError:
            logger.warning("undetected-chromedriver not installed; run: pip install undetected-chromedriver")
        except Exception as e:
            logger.warning("Stealth driver failed, falling back to regular Chrome: %s", e)

    options = Options()
    if headless:
        options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    ua = random.choice(USER_AGENTS)
    options.add_argument(f"user-agent={ua}")
    try:
        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=options)
        return driver
    except Exception as e:
        logger.error("ChromeDriver setup failed: %s", e)
        raise


def retry_on_failure(func, *args, max_attempts=MAX_RETRIES, **kwargs):
    """Execute func with retries on exception."""
    last_err = None
    for attempt in range(max_attempts):
        try:
            return func(*args, **kwargs)
        except Exception as e:
            last_err = e
            logger.warning("Attempt %d failed: %s", attempt + 1, e)
            if attempt < max_attempts - 1:
                human_delay(1, 3)
    raise last_err


# ---------------------------------------------------------------------------
# Propwire: Account creation (conditional)
# ---------------------------------------------------------------------------
def propwire_needs_account(driver) -> bool:
    """
    Check if Propwire requires login for export or full search.
    Returns True if we should create/log in.
    """
    try:
        # Look for sign-up / login links
        sign_up = driver.find_elements(
            By.XPATH,
            "//a[contains(translate(text(),'SIGN','sign'),'sign up') or contains(translate(text(),'SIGN','sign'),'sign up') or contains(@href,'register') or contains(@href,'signup')]",
        )
        login_links = driver.find_elements(
            By.XPATH,
            "//a[contains(translate(text(),'LOG','log'),'log in') or contains(@href,'login')]",
        )
        return bool(sign_up or login_links)
    except Exception:
        return False


def propwire_register_and_login(driver, email: str, first: str, last: str) -> str:
    """
    Create Propwire account and log in. Returns password (generated).
    If email verification is required, logs instruction and raises.
    """
    password = generate_password(14)
    base = "https://propwire.com"
    register_url = f"{base}/register"  # common pattern; adjust if site uses different path

    for attempt in range(MAX_RETRIES):
        try:
            driver.get(register_url)
            human_delay(3, 6)
            wait = WebDriverWait(driver, WAIT_TIMEOUT)

            # Selectors: update via DevTools if site changes (Inspect → copy XPath/CSS)
            email_inp = wait.until(
                EC.presence_of_element_located(
                    (By.CSS_SELECTOR, "input[type='email'], input[name*='email'], #email")
                )
            )
            email_inp.clear()
            email_inp.send_keys(email)
            human_delay(0.5, 1.5)

            # Password
            pwd_sel = "input[type='password'], input[name*='password'], #password"
            pwd_inp = driver.find_element(By.CSS_SELECTOR, pwd_sel)
            pwd_inp.clear()
            pwd_inp.send_keys(password)
            human_delay(0.5, 1)

            # First / Last name if present
            for sel, val in [
                ("input[name*='first'], input#firstName, input[placeholder*='First']", first),
                ("input[name*='last'], input#lastName, input[placeholder*='Last']", last),
            ]:
                try:
                    el = driver.find_element(By.CSS_SELECTOR, sel)
                    el.clear()
                    el.send_keys(val)
                    human_delay(0.3, 0.8)
                except NoSuchElementException:
                    pass

            # Terms checkbox
            try:
                terms = driver.find_element(
                    By.XPATH,
                    "//input[@type='checkbox' and (contains(@id,'term') or contains(@name,'term') or contains(@aria-label,'term'))]",
                )
                if not terms.is_selected():
                    terms.click()
                human_delay(0.5, 1)
            except NoSuchElementException:
                pass

            # Submit (use XPath if button text varies; update via DevTools)
            try:
                submit = driver.find_element(By.CSS_SELECTOR, "button[type='submit'], input[type='submit'], a.btn-primary")
            except NoSuchElementException:
                submit = driver.find_element(By.XPATH, "//button[contains(.,'Sign Up') or contains(.,'Create') or contains(.,'Register')]")
            submit.click()
            human_delay(5, 10)

            # Check for email verification message
            page_src = driver.page_source.lower()
            if "verify" in page_src or "verification" in page_src or "check your email" in page_src:
                save_credentials(email, password)
                logger.error(
                    "MANUAL INTERVENTION: Email verification required. Check inbox for %s. "
                    "After verifying, run script again; credentials saved to %s.",
                    email,
                    CREDENTIALS_FILE,
                )
                raise RuntimeError("Email verification required - please verify and re-run.")

            save_credentials(email, password)
            logger.info("Account creation submitted. Attempting login.")
            propwire_login(driver, email, password)
            return password

        except TimeoutException as e:
            logger.warning("Propwire register attempt %d timeout: %s", attempt + 1, e)
        except Exception as e:
            logger.warning("Propwire register attempt %d failed: %s", attempt + 1, e)
        human_delay(2, 5)

    raise RuntimeError("Propwire account creation failed after retries.")


def propwire_login(driver, email: str, password: str):
    """Log into Propwire with given credentials."""
    base = "https://propwire.com"
    login_url = f"{base}/login"  # adjust path if different
    driver.get(login_url)
    human_delay(3, 6)
    wait = WebDriverWait(driver, WAIT_TIMEOUT)
    wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='email'], input[name*='email']")))
    driver.find_element(By.CSS_SELECTOR, "input[type='email'], input[name*='email']").send_keys(email)
    human_delay(0.5, 1)
    driver.find_element(By.CSS_SELECTOR, "input[type='password']").send_keys(password)
    human_delay(0.5, 1)
    driver.find_element(By.CSS_SELECTOR, "button[type='submit'], input[type='submit']").click()
    human_delay(5, 8)
    logger.info("Propwire login completed.")


# ---------------------------------------------------------------------------
# Propwire: Search and scrape addresses
# ---------------------------------------------------------------------------
def propwire_search_and_scrape(
    driver,
    target_city: str,
    min_leads: int,
    email: str,
    first: str,
    last: str,
) -> List[str]:
    """
    Search Propwire for target area, apply filters, paginate, and collect addresses.
    Creates account and logs in if needed. Returns list of full addresses.
    """
    addresses = []
    base = "https://propwire.com"
    driver.get(base)
    human_delay(4, 7)

    # Check if we need to log in (e.g. export or full list blocked)
    try:
        # Try to find search box / location input
        wait = WebDriverWait(driver, WAIT_TIMEOUT)
        search_input = wait.until(
            EC.presence_of_element_located(
                (By.CSS_SELECTOR, "input[placeholder*='address'], input[placeholder*='city'], input[name*='search'], input[name*='location'], input#search")
            )
        )
    except TimeoutException:
        search_input = None

    # If we see sign up / login and no easy search, try register then continue
    if propwire_needs_account(driver):
        try:
            if os.path.isfile(CREDENTIALS_FILE):
                pwd = None
                with open(CREDENTIALS_FILE) as f:
                    for line in f:
                        if line.startswith("PROPWIRE_PASSWORD="):
                            pwd = line.split("=", 1)[1].strip()
                            break
                if pwd is None:
                    raise FileNotFoundError("PROPWIRE_PASSWORD not in credentials file")
                propwire_login(driver, email, pwd)
            else:
                propwire_register_and_login(driver, email, first, last)
        except Exception as e:
            logger.error("Propwire auth failed: %s", e)
            raise
        human_delay(3, 6)

    # Navigate to search — Propwire often has a main search bar or "Search" link
    try:
        driver.get(base)
        human_delay(3, 6)
        wait = WebDriverWait(driver, WAIT_TIMEOUT)
        # Location search
        loc_sel = "input[placeholder*='address'], input[placeholder*='city'], input[placeholder*='Address'], input[name*='search'], input[name*='location'], input#search, input[type='search']"
        loc = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, loc_sel)))
        loc.clear()
        loc.send_keys(target_city)
        human_delay(2, 4)
        # Submit search (button or Enter)
        try:
            try:
                driver.find_element(By.CSS_SELECTOR, "button[type='submit'], input[type='submit'], [data-testid='search-button']").click()
            except NoSuchElementException:
                driver.find_element(By.XPATH, "//button[contains(.,'Search')]").click()
        except NoSuchElementException:
            loc.send_keys(Keys.RETURN)
        human_delay(5, 10)
    except Exception as e:
        logger.warning("Propwire search form not found with default selectors: %s", e)
        # Fallback: direct URL if Propwire uses query params
        driver.get(f"{base}/search?q={target_city.replace(' ', '%20')}")
        human_delay(5, 10)

    # Apply filters if available (Pre-foreclosure, Absentee, High Equity, Single Family, Lot size)
    try:
        # Open filters panel if exists
        filter_btn = driver.find_elements(
            By.XPATH,
            "//button[contains(translate(.,'FILTER','filter'),'filter')] | //a[contains(.,'Filter')]",
        )
        if filter_btn:
            filter_btn[0].click()
            human_delay(2, 4)
        for label in ["Pre-Foreclosure", "Pre Foreclosure", "Absentee", "High Equity", "Single Family", "Lot Size"]:
            try:
                el = driver.find_element(By.XPATH, f"//*[contains(translate(.,'{label.upper()[:10]}','{label.lower()[:10]}'),'{label.lower()[:10]}')]")
                el.click()
                human_delay(1, 2)
            except NoSuchElementException:
                pass
    except Exception:
        pass

    # Paginate and scrape table rows (or cards)
    page = 1
    while len(addresses) < min_leads:
        human_delay(2, 5)
        wait = WebDriverWait(driver, WAIT_TIMEOUT)
        # Table rows: adjust selectors per site (Inspect → copy selector for result rows)
        rows = driver.find_elements(
            By.CSS_SELECTOR,
            "table tbody tr, [data-testid='result-row'], .search-result-row, .property-row, .listing-row, [class*='ResultRow'], [class*='result-row']",
        )
        if not rows:
            # Card-style results
            rows = driver.find_elements(
                By.CSS_SELECTOR,
                "[class*='property-card'], [class*='listing-card'], [class*='result-card'], article",
            )
        for row in rows:
            try:
                # Address often in first link or first column or data attribute
                addr_el = row.find_element(
                    By.CSS_SELECTOR,
                    "a[href*='property'], a[href*='listing'], td:first-child, [class*='address'], [class*='Address']",
                )
                addr_text = addr_el.text.strip()
                if addr_text and len(addr_text) > 5 and addr_text not in addresses:
                    addresses.append(addr_text)
                    if len(addresses) >= min_leads:
                        break
            except NoSuchElementException:
                pass
        if len(addresses) >= min_leads:
            break
        # Next page
        try:
            next_btn = driver.find_element(
                By.XPATH,
                "//a[contains(.,'Next')] | //button[contains(.,'Next')] | //li[@class='next']/a | //a[@aria-label='Next']",
            )
            next_btn.click()
            page += 1
            human_delay(3, 6)
        except NoSuchElementException:
            logger.info("No more Propwire pages at page %d.", page)
            break

    # Save raw addresses
    df = pd.DataFrame({"Address": addresses})
    df.to_csv(PROPWIRE_ADDRESSES_CSV, index=False)
    logger.info("Saved %d addresses to %s", len(addresses), PROPWIRE_ADDRESSES_CSV)
    return addresses


# ---------------------------------------------------------------------------
# Cyber Background Checks: address lookup
# ---------------------------------------------------------------------------
def cbc_lookup_address(driver, address: str) -> List[Dict]:
    """
    Look up one address on Cyber Background Checks. Returns list of dicts
    with keys: Full_Name, Address, Phone_Number, Phone_Type.
    Only includes mobile/cell in returned list.
    """
    results = []
    url = "https://www.cyberbackgroundchecks.com/"
    driver.get(url)
    human_delay(3, 6)
    wait = WebDriverWait(driver, WAIT_TIMEOUT)
    try:
        # Address search input — wait for interactable, scroll into view, then type
        inp = wait.until(
            EC.presence_of_element_located(
                (By.CSS_SELECTOR, "input[name*='address'], input[placeholder*='Address'], input#address, input[type='search'], input[placeholder*='address']")
            )
        )
        driver.execute_script("arguments[0].scrollIntoView({block:'center'});", inp)
        human_delay(0.5, 1)
        wait.until(EC.visibility_of(inp))
        try:
            inp.click()
        except Exception:
            pass
        human_delay(0.3, 0.6)
        try:
            inp.clear()
        except Exception:
            ActionChains(driver).click(inp).key_down(Keys.COMMAND if os.name != "nt" else Keys.CONTROL).send_keys("a").key_up(Keys.COMMAND if os.name != "nt" else Keys.CONTROL).perform()
        inp.send_keys(address)
        human_delay(1, 2)
        # Submit
        try:
            try:
                driver.find_element(By.CSS_SELECTOR, "button[type='submit'], input[type='submit']").click()
            except NoSuchElementException:
                driver.find_element(By.XPATH, "//button[contains(.,'Search')]").click()
        except NoSuchElementException:
            inp.send_keys(Keys.RETURN)
        human_delay(5, 12)
    except TimeoutException:
        logger.warning("CBC search input not found for: %s", address[:50])
        return results

    # Parse results page: names, phones, phone types
    try:
        # Containers: //div[contains(@class,'result')] or similar
        blocks = driver.find_elements(
            By.CSS_SELECTOR,
            "[class*='result'], [class*='person'], [class*='record'], table tbody tr",
        )
        if not blocks:
            blocks = [driver]  # fallback to full page
        for block in blocks:
            try:
                name_el = block.find_elements(
                    By.XPATH,
                    "//*[contains(@class,'name') or contains(@class,'person')]//*[self::span or self::a or self::div] | //strong",
                )
                name = name_el[0].text.strip() if name_el else ""
                if not name:
                    continue
                # Phone rows: look for "Mobile", "Cell", "Phone"
                phone_els = block.find_elements(
                    By.XPATH,
                    "//*[contains(.,'Phone') or contains(.,'Mobile') or contains(.,'Cell')]/..//*[contains(.,'(') or contains(.,'-')]",
                )
                for pe in phone_els:
                    text = pe.text.strip()
                    if not re.search(r"\d{3}[-.\s]?\d{3}[-.\s]?\d{4}", text):
                        continue
                    phone_type = "Unknown"
                    if "mobile" in text.lower() or "cell" in text.lower():
                        phone_type = "Mobile"
                    elif "landline" in text.lower() or "home" in text.lower():
                        phone_type = "Landline"
                    digits = re.sub(r"\D", "", text)
                    if len(digits) >= 10:
                        phone = f"({digits[-10:-7]}) {digits[-7:-4]}-{digits[-4:]}" if len(digits) == 10 else text
                        results.append({
                            "Full_Name": name,
                            "Address": address,
                            "Phone_Number": phone,
                            "Phone_Type": phone_type,
                        })
            except (NoSuchElementException, IndexError):
                continue
    except Exception as e:
        logger.debug("CBC parse error for %s: %s", address[:40], e)
    return results


def run_cbc_lookups(addresses: List[str], driver, batch_size: int = BATCH_SIZE_CBC) -> List[Dict]:
    """Run CBC lookups for all addresses; return list of lead dicts (mobile only)."""
    all_leads = []
    for i, addr in enumerate(addresses):
        if (i + 1) % batch_size == 0:
            logger.info("CBC batch %d/%d completed.", (i + 1) // batch_size, (len(addresses) + batch_size - 1) // batch_size)
        leads = retry_on_failure(cbc_lookup_address, driver, addr)
        all_leads.extend(leads)
        human_delay(CBC_DELAY_MIN, CBC_DELAY_MAX)
    return all_leads


# ---------------------------------------------------------------------------
# Post-processing and output
# ---------------------------------------------------------------------------
def post_process_and_save(leads: List[Dict], output_path: str = FINAL_LEADS_CSV):
    """Dedupe, save all leads (all phone types). Filter to cell later via build_sms_list."""
    if not leads:
        logger.warning("No leads to save.")
        return
    df = pd.DataFrame(leads)
    if df.empty:
        return
    df = df.drop_duplicates(subset=["Address", "Phone_Number"], keep="first")
    cols = [c for c in ["Full_Name", "Address", "Phone_Number", "Phone_Type"] if c in df.columns]
    df[cols].to_csv(output_path, index=False)
    logger.info("Saved %d leads to %s", len(df), output_path)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser(description="Tree service lead automation")
    parser.add_argument("--target-city", default="Senatobia, MS", help="City/area to search (e.g. Germantown, TN)")
    parser.add_argument("--min-leads", type=int, default=TARGET_LEADS_DEFAULT, help="Target number of addresses to collect from Propwire")
    parser.add_argument("--no-headless", action="store_true", help="Run browser in visible mode for debugging")
    parser.add_argument("--stealth", action="store_true", help="Use undetected Chrome to reduce bot detection (pip install undetected-chromedriver)")
    parser.add_argument("--addresses-csv", metavar="FILE", default="", help="Skip Propwire; load addresses from CSV (must have 'Address' column). Use when Propwire blocks automation.")
    parser.add_argument("--use-existing-browser", action="store_true", help="Attach to Chrome already open with remote debugging (you log in to Propwire there). See README.")
    parser.add_argument("--debugger-port", type=int, default=9222, help="Chrome remote-debugging port when using --use-existing-browser (default 9222)")
    args = parser.parse_args()

    logger.info("Starting tree service lead automation: %s, min_leads=%d", args.target_city, args.min_leads)
    driver = None
    try:
        debugger_addr = ("127.0.0.1:%d" % args.debugger_port) if args.use_existing_browser else None
        driver = get_driver(headless=not args.no_headless, stealth=args.stealth, debugger_address=debugger_addr)
        addresses = []

        if args.addresses_csv and Path(args.addresses_csv).exists():
            logger.info("Skipping Propwire; loading addresses from %s", args.addresses_csv)
            addresses = []
            import csv as csv_mod
            with open(args.addresses_csv, newline="", encoding="utf-8") as f:
                reader = csv_mod.reader(f)
                next(reader, None)
                for row in reader:
                    if not row or not row[0].strip():
                        continue
                    if len(row) >= 2 and row[1].strip() and re.match(r"^\s*[A-Z]{2}\s+\d{5}", row[1].strip()):
                        a = (row[0].strip() + ", " + row[1].strip())
                    else:
                        a = row[0].strip()
                    addresses.append(a)
        else:
            addresses = propwire_search_and_scrape(
                driver,
                target_city=args.target_city,
                min_leads=args.min_leads,
                email=DEFAULT_EMAIL,
                first=DEFAULT_FIRST_NAME,
                last=DEFAULT_LAST_NAME,
            )
            if not addresses and Path(PROPWIRE_ADDRESSES_CSV).exists():
                logger.info("Loading addresses from existing %s", PROPWIRE_ADDRESSES_CSV)
                addresses = pd.read_csv(PROPWIRE_ADDRESSES_CSV)["Address"].astype(str).tolist()

        if not addresses:
            logger.warning(
                "No addresses to process. If Propwire showed 'unusual activity', export addresses manually to a CSV "
                "(with an 'Address' column) and run with: --addresses-csv your_file.csv"
            )
        else:
            leads = run_cbc_lookups(addresses, driver)
            post_process_and_save(leads)
    except RuntimeError as e:
        if "verification" in str(e).lower():
            logger.error("Exiting due to email verification requirement.")
        raise
    finally:
        if driver and not getattr(driver, "_attached", False):
            driver.quit()
        elif driver and getattr(driver, "_attached", False):
            logger.info("Left existing browser open (attached session).")
    logger.info("Automation finished.")


if __name__ == "__main__":
    main()
