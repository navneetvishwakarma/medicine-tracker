-- ─────────────────────────────────────────────────────────────────────────────
-- Medicine Tracker — Phase 2 initial schema
-- ─────────────────────────────────────────────────────────────────────────────

-- Medicines
create table public.medicines (
  id           uuid primary key,
  user_id      uuid not null references auth.users on delete cascade,
  name         text not null check (char_length(name) <= 100),
  dosage       text not null check (char_length(dosage) <= 50),
  meal_relation text not null check (meal_relation in ('before','after','with','none')),
  schedules    jsonb not null default '[]',
  color        text not null,
  notes        text check (char_length(notes) <= 500),
  active       boolean not null default true,
  created_at   timestamptz not null default now()
);

alter table public.medicines enable row level security;

create policy "medicines: own rows only"
  on public.medicines
  using (user_id = auth.uid());

-- Dose logs
create table public.dose_logs (
  id              uuid primary key,
  user_id         uuid not null references auth.users on delete cascade,
  medicine_id     uuid not null references public.medicines on delete cascade,
  scheduled_date  date not null,
  scheduled_time  text not null check (scheduled_time in ('morning','noon','evening','night')),
  status          text not null check (status in ('pending','taken','skipped')),
  marked_at       timestamptz,
  marked_by       text,
  note            text check (char_length(note) <= 200),
  created_at      timestamptz not null default now()
);

alter table public.dose_logs enable row level security;

create policy "dose_logs: own rows only"
  on public.dose_logs
  using (user_id = auth.uid());

-- Settings (singleton per user — id = 1 locally, using user_id as PK here)
create table public.settings (
  user_id               uuid primary key references auth.users on delete cascade,
  patient_name          text not null default 'Patient' check (char_length(patient_name) <= 100),
  reminder_times        jsonb not null default '{"morning":"08:00","noon":"13:00","evening":"18:00","night":"21:00"}',
  notifications_enabled boolean not null default false,
  migration_done        boolean not null default false,
  updated_at            timestamptz not null default now()
);

alter table public.settings enable row level security;

create policy "settings: own row only"
  on public.settings
  using (user_id = auth.uid());

-- Push subscriptions (Web Push + Expo)
create table public.push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users on delete cascade,
  platform   text not null check (platform in ('web','expo')),
  endpoint   text,                    -- Web Push endpoint URL
  p256dh     text,                    -- Web Push key
  auth_key   text,                    -- Web Push auth
  expo_token text,                    -- Expo push token
  created_at timestamptz not null default now(),
  unique (user_id, platform, endpoint)
);

alter table public.push_subscriptions enable row level security;

create policy "push_subscriptions: own rows only"
  on public.push_subscriptions
  using (user_id = auth.uid());

-- Indexes for common query patterns
create index on public.medicines (user_id) where active = true;
create index on public.dose_logs (user_id, scheduled_date);
create index on public.dose_logs (medicine_id);
