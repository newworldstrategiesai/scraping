#!/usr/bin/env python3
"""
Worker: poll Supabase for pending jobs, run the matching script, update status/log/error.
Run from repo root: python scripts/worker.py
Env: SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY.
Optional for send_campaign: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM.
Loads .env from repo root if present (python-dotenv optional).
"""
import os
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

# Repo root (parent of scripts/)
REPO_ROOT = Path(__file__).resolve().parent.parent
POLL_INTERVAL_SEC = 15
JOB_TIMEOUT_SEC = 3600  # 1 hour for long runs (e.g. run_cbc)


def get_supabase():
    url = os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        return None
    try:
        from supabase import create_client
        return create_client(url, key)
    except Exception as e:
        print(f"Supabase client error: {e}", file=sys.stderr)
        return None


WORKER_OPT_OUTS_CSV = "_worker_opt_outs.csv"
WORKER_WARM_LEADS_CSV = "_worker_warm_leads.csv"


def export_opt_outs_and_warm_leads(supabase, dest_dir: Path):
    """Write opt_outs and warm_leads from Supabase to CSVs for send_campaign script."""
    import csv
    opt_path = dest_dir / WORKER_OPT_OUTS_CSV
    warm_path = dest_dir / WORKER_WARM_LEADS_CSV
    try:
        r_opt = supabase.table("opt_outs").select("phone_number,date,source").execute()
        with open(opt_path, "w", newline="") as f:
            w = csv.writer(f)
            w.writerow(["Phone_Number", "Date", "Source"])
            for row in (r_opt.data or []):
                w.writerow([
                    row.get("phone_number", ""),
                    row.get("date", ""),
                    row.get("source", "SMS reply"),
                ])
    except Exception as e:
        print(f"Export opt_outs: {e}", file=sys.stderr)
        opt_path.write_text("Phone_Number,Date,Source\n")
    try:
        r_warm = supabase.table("warm_leads").select("phone_number").execute()
        with open(warm_path, "w", newline="") as f:
            w = csv.writer(f)
            w.writerow(["phone_number"])
            for row in (r_warm.data or []):
                w.writerow([row.get("phone_number", "")])
    except Exception as e:
        print(f"Export warm_leads: {e}", file=sys.stderr)
        warm_path.write_text("phone_number\n")


def claim_pending_job(supabase):
    """Fetch one pending job and set it to running. Returns (job, True) if we claimed it."""
    r = supabase.table("jobs").select("id,action,payload").eq("status", "pending").order("created_at").limit(1).execute()
    if not r.data or len(r.data) == 0:
        return None, False
    job = r.data[0]
    job_id = job["id"]
    now = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    up = supabase.table("jobs").update({"status": "running", "started_at": now}).eq("id", job_id).eq("status", "pending").execute()
    # If no row was updated (someone else claimed it), data is empty
    if not getattr(up, "data", None) or len(up.data) == 0:
        return None, False
    return job, True


def build_cmd(action: str, payload: dict) -> list | None:
    """Build argv (list) for subprocess. None if action unknown."""
    payload = payload or {}
    company = (payload.get("company_name") or "Tree Service").replace('"', '\\"')
    message = (payload.get("message_template") or "").strip()
    delay = payload.get("sms_delay_sec", 1)
    include_unknown = payload.get("include_unknown_phone_type", True)
    addresses_csv = payload.get("addresses_csv_name") or "propwire_addresses.csv"

    if action == "build_sms_list":
        cmd = [
            sys.executable,
            str(REPO_ROOT / "scripts" / "build_sms_list.py"),
            "--opt-outs", str(REPO_ROOT / WORKER_OPT_OUTS_CSV),
        ]
        if include_unknown:
            cmd.append("--include-unknown-phone-type")
        else:
            cmd.append("--require-phone-type")
        city = (payload.get("city") or "").strip()
        state = (payload.get("state") or "").strip()
        zip_code = (payload.get("zip") or "").strip()
        if city:
            cmd.extend(["--city", city])
        if state:
            cmd.extend(["--state", state[:2]])
        if zip_code:
            cmd.extend(["--zip", zip_code])
        return cmd

    if action == "parse_quality_leads":
        return [sys.executable, str(REPO_ROOT / "parse_quality_leads.py")]

    if action == "run_cbc":
        script = REPO_ROOT / "run_cbc_only.sh"
        if not script.exists():
            return None
        return ["/usr/bin/env", "bash", str(script), addresses_csv]

    # Shared args for send_campaign: use Supabase-exported opt_outs and warm_leads, daily batch limit
    worker_opt_outs = REPO_ROOT / "_worker_opt_outs.csv"
    worker_warm_leads = REPO_ROOT / "_worker_warm_leads.csv"
    daily_limit = payload.get("daily_batch_limit") or 450

    if action == "send_campaign_dry_run":
        cmd = [
            sys.executable,
            str(REPO_ROOT / "scripts" / "send_campaign.py"),
            "--dry-run",
            "--company", company,
            "--delay", str(delay),
            "--opt-outs", str(worker_opt_outs),
            "--warm-leads", str(worker_warm_leads),
            "--limit", str(daily_limit),
        ]
        if message:
            cmd.extend(["--message", message])
        return cmd

    if action == "send_campaign":
        cmd = [
            sys.executable,
            str(REPO_ROOT / "scripts" / "send_campaign.py"),
            "--send",
            "--company", company,
            "--delay", str(delay),
            "--opt-outs", str(worker_opt_outs),
            "--warm-leads", str(worker_warm_leads),
            "--limit", str(daily_limit),
        ]
        if message:
            cmd.extend(["--message", message])
        return cmd

    return None


def run_job(job_id: str, action: str, payload: dict) -> tuple[bool, str, str]:
    """Run the job; return (success, stdout, stderr)."""
    cmd = build_cmd(action, payload)
    if cmd is None:
        return False, "", f"Unknown action: {action}"

    try:
        proc = subprocess.run(
            cmd,
            cwd=str(REPO_ROOT),
            capture_output=True,
            text=True,
            timeout=JOB_TIMEOUT_SEC,
        )
        out = (proc.stdout or "").strip()
        err = (proc.stderr or "").strip()
        if proc.returncode != 0:
            err = err or f"Exit code {proc.returncode}"
        return proc.returncode == 0, out, err
    except subprocess.TimeoutExpired:
        return False, "", f"Job timed out after {JOB_TIMEOUT_SEC}s"
    except Exception as e:
        return False, "", str(e)


def set_job_result(supabase, job_id: str, success: bool, log: str, error: str):
    now = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    supabase.table("jobs").update({
        "status": "success" if success else "failed",
        "finished_at": now,
        "log": log or None,
        "error": error if not success else None,
    }).eq("id", job_id).execute()


def update_list_after_build_sms(supabase, job_id: str):
    """After build_sms_list success: write full list to sms_cell_list_rows, update list_metadata and list_preview."""
    import json
    csv_path = REPO_ROOT / "sms_cell_list.csv"
    if not csv_path.exists():
        return
    try:
        import pandas as pd
        df = pd.read_csv(csv_path)
        row_count = len(df)
        now = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

        # 1. Map CSV columns to table columns (build_sms_list outputs Full_Name, Address, Phone_Number, etc.)
        rename = {"Phone_Number": "phone_number", "Full_Name": "full_name", "Address": "address", "Source_Address": "source_address", "Lead_Type": "lead_type", "Resident_Type": "resident_type"}
        df_out = df.rename(columns={k: v for k, v in rename.items() if k in df.columns})
        cols = [c for c in ["phone_number", "full_name", "address", "source_address", "lead_type", "resident_type"] if c in df_out.columns]
        if not cols:
            cols = list(df_out.columns)[:6]

        # 2. Delete all existing rows (Supabase: delete with filter that matches all)
        supabase.table("sms_cell_list_rows").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()

        # 3. Insert all rows in batches of 100
        rows_data = df_out[cols].replace({pd.NA: None}).to_dict(orient="records")
        for r in rows_data:
            for k, v in list(r.items()):
                if v is not None and not isinstance(v, str):
                    r[k] = str(v)
        for i in range(0, len(rows_data), 100):
            chunk = rows_data[i : i + 100]
            supabase.table("sms_cell_list_rows").insert(chunk).execute()

        # 4. Update list_metadata
        supabase.table("list_metadata").upsert({
            "id": "sms_cell_list",
            "name": "SMS campaign list",
            "list_type": "sms_cell",
            "source": "table",
            "source_identifier": "sms_cell_list_rows",
            "row_count": row_count,
            "last_updated_at": now,
            "updated_by_job_id": job_id,
        }, on_conflict="id").execute()

        # 5. Update list_preview (first 200 rows for quick display)
        preview_size = min(200, row_count)
        rows = json.loads(df.head(preview_size).to_json(orient="records", date_format="iso"))
        supabase.table("list_preview").upsert({
            "list_id": "sms_cell_list",
            "rows": rows,
            "updated_at": now,
        }, on_conflict="list_id").execute()
    except Exception as e:
        print(f"Failed to update list in Supabase: {e}", file=sys.stderr)


def load_dotenv():
    """Load .env from repo root if present."""
    env_path = REPO_ROOT / ".env"
    if not env_path.exists():
        return
    try:
        for line in env_path.read_text().splitlines():
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" in line:
                k, v = line.split("=", 1)
                k, v = k.strip(), v.strip()
                if k and v.startswith('"') and v.endswith('"'):
                    v = v[1:-1].replace('\\"', '"')
                elif k and v.startswith("'") and v.endswith("'"):
                    v = v[1:-1].replace("\\'", "'")
                if k and k not in os.environ:
                    os.environ[k] = v
    except Exception:
        pass


def main():
    load_dotenv()
    supabase = get_supabase()
    if not supabase:
        print("Set SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.", file=sys.stderr)
        sys.exit(1)

    print("Worker started. Polling for pending jobs (Ctrl+C to stop).")
    while True:
        try:
            job, claimed = claim_pending_job(supabase)
            if claimed and job:
                job_id = job["id"]
                action = job.get("action", "")
                payload = job.get("payload") or {}
                if action in ("send_campaign", "send_campaign_dry_run"):
                    export_opt_outs_and_warm_leads(supabase, REPO_ROOT)
                if action == "build_sms_list":
                    export_opt_outs_and_warm_leads(supabase, REPO_ROOT)
                if action == "send_warm_lead_message":
                    export_opt_outs_and_warm_leads(supabase, REPO_ROOT)
                print(f"Running job {job_id}: {action}")
                success, log, err = run_job(job_id, action, payload)
                set_job_result(supabase, job_id, success, log, err)
                if action == "build_sms_list" and success:
                    update_list_after_build_sms(supabase, job_id)
                print(f"  -> {'success' if success else 'failed'}")
            else:
                time.sleep(POLL_INTERVAL_SEC)
        except KeyboardInterrupt:
            print("\nWorker stopped.")
            break
        except Exception as e:
            print(f"Error: {e}", file=sys.stderr)
            time.sleep(POLL_INTERVAL_SEC)


if __name__ == "__main__":
    main()
