# Plan: CRM Contact View and CRUD (Click Phone/Address)

**Goal:** When an admin clicks a phone number or address in Lists (opt-outs, warm leads, SMS preview), open a contact-centric view with full CRM capabilities: unified contact profile, activity timeline, notes, and full CRUD on every record.

---

## 1. Current state

- **opt_outs:** id, phone_number, date, source. Shown in Lists → Opt-outs; Remove only.
- **warm_leads:** id, phone_number, full_name, address, first_reply_text, reply_time, source_campaign. Shown in Lists → Warm leads; Remove only.
- **form_submissions:** id, name, phone, address, email, message, created_at. Shown in Dashboard → Submissions; no edit/delete in Lists.
- **Lists:** Phone and address are plain text; no click-through.

**Gap:** No contact-centric view, no edit, no notes, no unified timeline. Clicking phone/address does nothing.

---

## 2. Contact-centric model

**Contact = one phone number** (normalized to 10 digits). All records that share that phone are “one contact”:

- Opt-out rows (phone opted out)
- Warm lead rows (replied YES, may have name/address)
- Form submission rows (quote request from website)

**Optional later:** Contact by address (e.g. “all contacts at this address”) — multiple phones per address; can be Phase 2.

---

## 3. Data model changes

### 3.1 New table: `contact_notes`

| Column       | Type        | Purpose                    |
|-------------|-------------|----------------------------|
| `id`        | uuid PK     |                            |
| `phone_number` | text     | Normalized 10-digit phone  |
| `note`      | text        | Note content               |
| `created_at`| timestamptz | When note was added        |

- Index on `phone_number` for fast “notes for this contact” queries.
- Enables “Add note” in contact view and timeline.

### 3.2 No new “contacts” table (Phase 1)

- Contact = virtual: we query by `phone_number` across opt_outs, warm_leads, form_submissions, contact_notes.
- Keeps schema small and avoids sync issues with existing tables.

### 3.3 Optional: `form_submissions` update/delete

- Today: submissions are view-only in admin.
- For full CRUD: add server actions `updateFormSubmission(id, data)` and `deleteFormSubmission(id)` so contact view can edit/delete a submission record.

---

## 4. API / server actions

### 4.1 Contact aggregate (read)

- **getContactByPhone(phone: string)**  
  - Normalize phone to 10 digits.  
  - Return:  
    - `optOuts`: all opt_outs rows where phone_number (normalized) = phone.  
    - `warmLeads`: all warm_leads rows where phone_number (normalized) = phone.  
  - Optional: **getFormSubmissionsByPhone(phone)** and merge into same payload so contact view has one call.  
  - Return:  
    - `notes`: all contact_notes for this phone, ordered by created_at desc.

### 4.2 Notes

- **getContactNotes(phone: string)** → ContactNote[]  
- **addContactNote(phone: string, note: string)** → { ok, error }  
- **deleteContactNote(id: string)** → { ok, error }

### 4.3 CRUD per entity

**Opt-outs (already have add/delete):**

- **updateOptOut(id, { phone_number?, source? })** → { ok, error }

**Warm leads (already have delete):**

- **updateWarmLead(id, { phone_number?, full_name?, address?, first_reply_text?, source_campaign? })** → { ok, error }  
- **addWarmLead(data)** → { ok, id?, error } (optional: “Add warm lead” from contact view)

**Form submissions (new):**

- **getFormSubmissionsByPhone(phone)** → FormSubmission[] (for contact view)  
- **updateFormSubmission(id, { name?, phone?, address?, email?, message? })** → { ok, error }  
- **deleteFormSubmission(id)** → { ok, error }

---

## 5. UI: where click opens contact

### 5.1 Clickable fields

- **Lists → Opt-outs:** Make **phone number** a link (e.g. `/lists/contact?phone=5551234567` or open drawer with `?phone=...`).
- **Lists → Warm leads:** Make **phone number** and **address** (and optionally name) links.  
  - Phone → same contact view (by phone).  
  - Address → Phase 2: “contacts at this address” or, for now, same as phone (open contact for that row’s phone).
- **Lists → SMS list (preview):** If we ever show phone/address in preview table, make phone clickable → contact view.
- **Dashboard → Submissions:** Make **phone** (and optionally address) clickable → contact view.

Use a shared helper: `normalizePhone(phone)` → 10 digits; link to `/lists/contact/[phone]` or open contact drawer with that phone.

### 5.2 Contact view: page vs drawer

- **Option A – Dedicated page:** `/lists/contact/[phone]`  
  - Shareable URL, back button, full width.  
  - Good for “send link to this contact” and deep linking.

- **Option B – Drawer/Sheet:** Stay on Lists; open a slide-over panel with contact detail.  
  - Faster, keeps list context.  
  - URL can still reflect contact: e.g. `?contact=5551234567` so refresh keeps drawer open.

**Recommendation:** Start with **dedicated page** `/lists/contact/[phone]` for simplicity and shareable links; add a “Open in new tab” from list if needed. Drawer can be a later enhancement.

---

## 6. Contact page/drawer content (CRM view)

### 6.1 Header

- **Phone:** Display formatted (e.g. (555) 123-4567), copy button.
- **Display name:** First available from warm_leads.full_name or form_submissions.name; else “Unknown”.
- **Address:** First available from warm_leads.address or form_submissions.address; else “—”.
- **Quick actions:** Call (tel: link), SMS (sms: link), Copy phone, Copy address.

### 6.2 Activity timeline (unified)

- Single chronological list (newest first) of:
  - **Opt-out:** “Opted out – [source]” + date.
  - **Warm lead:** “Replied YES – [source_campaign]” + reply snippet + reply_time.
  - **Form submission:** “Quote request – [name]” + created_at; expand to show message.
  - **Note:** “Note” + created_at + note text.
- Each item: type badge, date, one-line summary; click to expand and show **Edit** / **Delete** for that record (if entity supports it).

### 6.3 Notes section

- List existing notes (newest first).
- “Add note” textarea + Save.
- Each note: Edit (inline or modal), Delete.

### 6.4 CRUD per activity item

- **Opt-out row:** Edit (phone, source), Delete.
- **Warm lead row:** Edit (phone, full_name, address, first_reply_text, source_campaign), Delete.
- **Form submission row:** Edit (name, phone, address, email, message), Delete (with confirm).
- **Note:** Edit text, Delete.

Use modals or inline forms to avoid leaving the contact page; after save, refetch contact data and update timeline/notes.

### 6.5 Empty state

- If phone has no opt_outs, warm_leads, form_submissions, or notes: show “No activity yet” and “Add note” / “Add opt-out” (and optionally “Add warm lead”) so the contact can still be used as a CRM record.

---

## 7. Implementation order

1. **Schema**  
   - Add `contact_notes` table and index on `phone_number`.  
   - Run migration in Supabase.

2. **Types**  
   - Add `ContactNote` and optional `FormSubmission` update/delete types if not present.

3. **Server actions**  
   - `getContactByPhone(phone)` (opt_outs + warm_leads + notes; optionally form_submissions).  
   - Notes: `getContactNotes`, `addContactNote`, `deleteContactNote`.  
   - Update: `updateOptOut`, `updateWarmLead`; optional `updateFormSubmission`, `deleteFormSubmission`.  
   - Optional: `addWarmLead` for “Add warm lead” from contact.

4. **Contact page**  
   - New route: `app/lists/contact/[phone]/page.tsx`.  
   - Normalize `phone` from param (10 digits).  
   - Fetch contact data; render header, timeline, notes, CRUD UI.

5. **Make phone/address clickable in Lists**  
   - Opt-outs tab: wrap phone in `<Link href={/lists/contact/${normalizePhone(row.phone_number)}}>`.  
   - Warm leads tab: wrap phone (and optionally address) in same Link.  
   - Use shared `normalizePhone()` (e.g. in lib or component).

6. **Optional: form submissions**  
   - Add `getFormSubmissionsByPhone`, `updateFormSubmission`, `deleteFormSubmission`.  
   - Include form_submissions in `getContactByPhone` and show in timeline with Edit/Delete.

7. **Polish**  
   - Copy phone/address buttons, tel:/sms: links, confirm before delete, loading/error states, empty states.

---

## 8. Cross-product and safety

- **Scope:** Lead automation only. No shared DJDash/M10/TipJar tables; opt_outs, warm_leads, form_submissions, contact_notes are pipeline-specific.
- **PII:** Contact view shows phone, name, address, messages. Keep behind admin auth (existing protected routes).
- **Audit:** Optional later: log “viewed contact”, “edited opt_out”, etc. in an audit table; not required for MVP.

---

## 9. Summary: “most useful” feature set

| Feature | Description |
|--------|-------------|
| **Click phone/address** | Opens contact view (phone normalized; address can open same contact for that row’s phone). |
| **Unified contact view** | One page per phone: header (phone, name, address) + timeline + notes. |
| **Activity timeline** | Opt-outs, warm leads, form submissions, notes in one chronological list. |
| **Notes** | Add, edit, delete notes per contact (contact_notes table). |
| **Full CRUD** | Edit/delete each opt_out, warm_lead, form_submission; add opt-out, add note; optional add warm lead. |
| **Quick actions** | Call, SMS, copy phone, copy address from header. |
| **Shareable URL** | `/lists/contact/[phone]` so contact view can be bookmarked or shared. |

This gives a single place to see everything about a contact and manage all related records without leaving the Lists flow.
