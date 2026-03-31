-- ── Onderstroom · Database Schema ────────────────────────────────
-- Voer dit uit in Supabase: SQL Editor → New Query → Run

-- Entries tabel (dagboek, dromen, voice, week)
create table if not exists entries (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz default now(),
  date        date not null,
  type        text not null check (type in ('daily','dream','voice','weekly')),
  content     jsonb not null default '{}',
  reflection  text,
  user_id     text default 'default'
);

create index on entries (date desc);
create index on entries (type);
create index on entries (user_id);

-- Push subscriptions tabel
create table if not exists push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz default now(),
  endpoint    text unique not null,
  keys        jsonb not null,
  user_id     text default 'default'
);

-- Row Level Security uitschakelen voor single-user gebruik
-- (schakel in + voeg auth toe als je meerdere gebruikers wil)
alter table entries disable row level security;
alter table push_subscriptions disable row level security;
