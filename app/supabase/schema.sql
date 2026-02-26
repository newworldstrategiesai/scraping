-- Run this in Supabase SQL Editor (Dashboard → SQL Editor) to create tables for the lead automation dashboard.
-- Replace with your Supabase project URL and keys in app env (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).

-- Config: key-value or single row for app settings (used by worker and UI)
create table if not exists app_config (
  id text primary key default 'default',
  company_name text default 'Tree Service',
  message_template text default 'Hi, {company} here. We''re doing tree work in your neighborhood – need any help? Reply YES for a free quote, or STOP to opt out.',
  sms_delay_sec numeric default 1,
  include_unknown_phone_type boolean default true,
  addresses_csv_name text default 'propwire_addresses.csv',
  updated_at timestamptz default now()
);

insert into app_config (id) values ('default') on conflict (id) do nothing;

-- Job queue and history: worker polls for pending, UI shows status
create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  payload jsonb default '{}',
  status text not null default 'pending' check (status in ('pending', 'running', 'success', 'failed')),
  created_at timestamptz default now(),
  started_at timestamptz,
  finished_at timestamptz,
  log text,
  error text
);

create index if not exists jobs_status_created on jobs (status, created_at desc);

-- Optional: opt_outs and warm_leads (mirror CSV; inbound webhook or worker can write here)
create table if not exists opt_outs (
  id uuid primary key default gen_random_uuid(),
  phone_number text not null,
  date timestamptz default now(),
  source text default 'SMS reply'
);

create table if not exists warm_leads (
  id uuid primary key default gen_random_uuid(),
  phone_number text not null,
  full_name text,
  address text,
  first_reply_text text,
  reply_time timestamptz default now(),
  source_campaign text default 'SMS-neighborhood'
);

-- Contact / quote form submissions (public form → admin view)
create table if not exists form_submissions (
  id uuid primary key default gen_random_uuid(),
  name text,
  phone text,
  address text,
  email text,
  message text,
  created_at timestamptz default now()
);

create index if not exists form_submissions_created_at on form_submissions (created_at desc);

-- Contact notes: CRM notes per phone (contact-centric)
create table if not exists contact_notes (
  id uuid primary key default gen_random_uuid(),
  phone_number text not null,
  note text not null,
  created_at timestamptz default now()
);

create index if not exists contact_notes_phone on contact_notes (phone_number);

-- List metadata: name, type, row count, last updated (for file-based and unified list view)
create table if not exists list_metadata (
  id text primary key,
  name text not null,
  list_type text not null check (list_type in ('addresses', 'leads', 'sms_cell', 'opt_outs', 'warm_leads')),
  source text not null default 'file' check (source in ('file', 'table')),
  source_identifier text,
  row_count integer default 0,
  last_updated_at timestamptz default now(),
  updated_by_job_id uuid references jobs(id)
);

-- List preview: first N rows for file-based lists (worker pushes after build)
create table if not exists list_preview (
  list_id text primary key references list_metadata(id) on delete cascade,
  rows jsonb not null default '[]',
  updated_at timestamptz default now()
);

-- Full SMS list rows (worker replaces on each Build SMS list; UI reads from here)
create table if not exists sms_cell_list_rows (
  id uuid primary key default gen_random_uuid(),
  phone_number text not null,
  full_name text,
  address text,
  source_address text,
  lead_type text,
  resident_type text,
  created_at timestamptz default now()
);

create index if not exists sms_cell_list_rows_phone on sms_cell_list_rows (phone_number);

insert into list_metadata (id, name, list_type, source, source_identifier) values
  ('sms_cell_list', 'SMS campaign list', 'sms_cell', 'file', 'sms_cell_list.csv'),
  ('propwire_addresses', 'Address list (CBC)', 'addresses', 'file', 'propwire_addresses.csv'),
  ('tree_service_leads', 'CBC leads', 'leads', 'file', 'tree_service_leads.csv'),
  ('quality_leads', 'Quality leads', 'leads', 'file', 'quality_leads.csv'),
  ('opt_outs', 'Opt-outs', 'opt_outs', 'table', 'opt_outs'),
  ('warm_leads', 'Warm leads', 'warm_leads', 'table', 'warm_leads')
on conflict (id) do nothing;

-- RLS (optional): enable when you add Supabase Auth; use service_role to bypass until then
-- alter table app_config enable row level security;
-- alter table jobs enable row level security;
-- alter table opt_outs enable row level security;
-- alter table warm_leads enable row level security;
-- alter table form_submissions enable row level security;
-- alter table list_metadata enable row level security;
-- alter table list_preview enable row level security;
-- alter table sms_cell_list_rows enable row level security;
-- alter table contact_notes enable row level security;
