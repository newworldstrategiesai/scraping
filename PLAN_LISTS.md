# Plan: Lists – View and Manage Pipeline Lists

**Goal:** A dedicated UI to view and manage all list types in the lead automation pipeline: address lists (CBC input), lead lists, SMS campaign list, opt-outs, and warm leads. Single place to see counts, preview data, export, and manage rows where applicable.

---

## 1. List types in the system

| Type | Source | Where it lives | Today |
|------|--------|----------------|-------|
| **Address lists** | File (worker disk) | e.g. `propwire_addresses.csv` | Settings: `addresses_csv_name`; used by Run CBC |
| **Lead lists** | File | `tree_service_leads.csv`, `quality_leads.csv` | Output of CBC / parse_quality_leads |
| **SMS list** | File | `sms_cell_list.csv` | Output of Build SMS list; used by Send campaign |
| **Opt-outs** | Supabase + optional CSV | `opt_outs` table (and `opt_outs.csv` on worker) | Inbound SMS / manual; exclude from sends |
| **Warm leads** | Supabase + optional CSV | `warm_leads` table | Inbound SMS (YES replies) |

The app runs on Vercel and cannot read worker files. So:
- **Supabase-backed lists** (opt_outs, warm_leads): full CRUD, view, export from the UI.
- **File-backed lists** (addresses, leads, sms_cell_list): we store **metadata** (and optional **preview**) in Supabase; the worker updates these when a job completes.

---

## 2. Data model (Supabase)

### 2.1 `list_metadata` (one row per logical list)

Tracks name, type, row count, and last update for file-based lists (and can be used for Supabase lists for a unified view).

| Column | Type | Purpose |
|--------|------|--------|
| `id` | text PK | Stable id, e.g. `sms_cell_list`, `opt_outs`, `warm_leads`, `propwire_addresses`, `tree_service_leads`, `quality_leads` |
| `name` | text | Display name, e.g. "SMS campaign list" |
| `list_type` | text | `addresses` \| `leads` \| `sms_cell` \| `opt_outs` \| `warm_leads` |
| `source` | text | `file` \| `table` – where the list lives |
| `source_identifier` | text | File name (e.g. `sms_cell_list.csv`) or table name |
| `row_count` | int | Number of rows (updated by worker or Supabase count) |
| `last_updated_at` | timestamptz | When list was last updated |
| `updated_by_job_id` | uuid FK → jobs | If updated by a job, which one |

- **Worker:** After `build_sms_list` (and optionally other jobs) succeeds, upsert `list_metadata` for `sms_cell_list`: row count from script output, `last_updated_at`, `updated_by_job_id`.
- **UI:** Reads `list_metadata` to show "SMS list: N rows, last built at …".

### 2.2 `list_preview` (optional, for file-based lists)

Stores a small preview (e.g. first 200 rows) so the UI can show a table without reading the worker’s disk.

| Column | Type | Purpose |
|--------|------|--------|
| `list_id` | text PK FK → list_metadata.id | Which list |
| `rows` | jsonb | Array of row objects, e.g. `[{ "Phone_Number": "...", "Full_Name": "..." }, ...]` |
| `updated_at` | timestamptz | When preview was generated |

- **Worker:** After `build_sms_list` succeeds, read `sms_cell_list.csv`, take first 200 rows, upsert `list_preview` for `sms_cell_list`.
- **UI:** Shows a "Preview" table for SMS list (and other file-based lists when we add worker updates).

### 2.3 Existing tables

- **opt_outs**, **warm_leads** – already in schema; no change. Lists page queries them for view/export/manage.

---

## 3. Lists page (UI)

### 3.1 Route and nav

- **Route:** `/lists` (protected).
- **Nav:** Add "Lists" link next to Dashboard, Settings, Actions, Jobs.

### 3.2 Layout

- **Tabs** (or sections): **SMS list** | **Opt-outs** | **Warm leads** | **Address lists** | **Lead lists**  
  - Or group: **Campaign** (SMS list, Opt-outs, Warm leads) and **Pipeline** (Address lists, Lead lists).

### 3.3 Per-tab behavior

**SMS list**
- Show: name, row count, last updated (from `list_metadata`); optional "Last built by job X" link to `/jobs`.
- If `list_preview` exists: table with first N rows (columns: Phone_Number, Full_Name, Address / Source_Address).
- Actions: "Build SMS list" → link to Actions (or open Build SMS form in a modal).
- No edit/delete of rows (file-based); build replaces the list.

**Opt-outs**
- Table: phone_number, date, source; pagination (e.g. 50 per page).
- Actions: "Export CSV", "Add opt-out" (manual phone + source), delete row.
- Count in tab or header from Supabase.

**Warm leads**
- Table: phone_number, full_name, address, first_reply_text, reply_time, source_campaign; pagination.
- Actions: "Export CSV", delete row.
- Count in tab or header.

**Address lists**
- Show: current default list name (from `app_config.addresses_csv_name`), e.g. "propwire_addresses.csv".
- Optional: list_metadata rows for known address files (row count, last_updated if we have worker updates).
- Action: "Change default" → link to Settings.

**Lead lists**
- Show: list_metadata for `tree_service_leads`, `quality_leads` (row count, last_updated, updated_by_job_id).
- Optional: list_preview for each if worker pushes previews.
- Action: "Run CBC" / "Parse quality leads" → link to Actions.

### 3.4 Export

- **Opt-outs / Warm leads:** Server action or API that selects from Supabase and returns CSV (or generates CSV server-side and streams download).
- **SMS list (file-based):** Export current preview as CSV (limited to preview size) or "Full export" as a future job that writes to Supabase/storage and provides a link.

### 3.5 Light/dark and accessibility

- Use existing Card, Table, Button, Tabs; ensure contrast and focus states (already in ShadCN/Tailwind).

---

## 4. Worker changes

- **build_sms_list** (on success):
  1. Parse log for "Wrote N rows" (or count rows in output CSV).
  2. Upsert `list_metadata`: id `sms_cell_list`, name "SMS campaign list", list_type `sms_cell`, source `file`, source_identifier `sms_cell_list.csv`, row_count, last_updated_at, updated_by_job_id.
  3. Read `sms_cell_list.csv`, take first 200 rows (or 500), upsert `list_preview` for `sms_cell_list` with `rows` JSONB and updated_at.

- **Optional later:** After `run_cbc` or `parse_quality_leads` success, update list_metadata (and optionally list_preview) for `tree_service_leads` / `quality_leads`.

---

## 5. Implementation order

1. **Schema** – Add `list_metadata` and `list_preview` in Supabase (migration or SQL in schema.sql).
2. **Lists page** – New route `/lists`, nav link, tabs; implement Opt-outs and Warm leads first (full table + export + add opt-out + delete).
3. **list_metadata + list_preview** – Worker updates after build_sms_list; server actions to read list_metadata and list_preview.
4. **SMS list tab** – Show metadata + preview table; "Build SMS list" link.
5. **Address / Lead lists tabs** – Metadata only + links to Settings/Actions; optionally worker updates for run_cbc/parse_quality_leads later.

---

## 6. Cross-product / safety

- Lists and list_metadata are **pipeline-specific** (lead automation). No shared DJDash/M10/TipJar tables.
- Opt-outs and warm leads contain PII (phone, name, address). Export and delete are admin-only; ensure `/lists` stays behind admin auth (already under protected paths).
- list_preview is a cache; deleting or rebuilding the list on the worker doesn’t auto-clear preview (we update on next successful build). Acceptable for preview UX.
