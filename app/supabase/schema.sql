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

-- RLS (optional): enable when you add Supabase Auth; use service_role to bypass until then
-- alter table app_config enable row level security;
-- alter table jobs enable row level security;
-- alter table opt_outs enable row level security;
-- alter table warm_leads enable row level security;
