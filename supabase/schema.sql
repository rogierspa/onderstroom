-- ── Onderstroom · Database Schema v2 ─────────────────────────────
-- Voer dit uit in Supabase: SQL Editor → New Query → Run

create table if not exists entries (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz default now(),
  date        date not null,
  type        text not null,
  content     jsonb not null default '{}',
  reflection  text,
  user_id     text default 'default'
);

create index if not exists entries_date_idx on entries (date desc);
create index if not exists entries_type_idx on entries (type);

create table if not exists push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz default now(),
  endpoint    text unique not null,
  keys        jsonb not null,
  user_id     text default 'default'
);

create table if not exists settings (
  id          uuid primary key default gen_random_uuid(),
  user_id     text unique default 'default',
  preferences jsonb default '{}'
);

alter table entries disable row level security;
alter table push_subscriptions disable row level security;
alter table settings disable row level security;
