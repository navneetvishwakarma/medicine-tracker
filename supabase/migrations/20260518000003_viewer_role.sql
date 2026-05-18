-- Invite codes — short-lived tokens a primary user shares with a viewer
create table public.viewer_invites (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,
  owner_user_id uuid not null references auth.users on delete cascade,
  expires_at  timestamptz not null,
  used_at     timestamptz,
  created_at  timestamptz not null default now()
);

alter table public.viewer_invites enable row level security;

-- Owner can manage their own invites; viewers can read by code (for redemption)
create policy "viewer_invites: owner full access"
  on public.viewer_invites
  using (owner_user_id = auth.uid());

-- Family members — links a viewer to an owner
create table public.family_members (
  id              uuid primary key default gen_random_uuid(),
  viewer_user_id  uuid not null references auth.users on delete cascade,
  owner_user_id   uuid not null references auth.users on delete cascade,
  role            text not null default 'viewer' check (role = 'viewer'),
  created_at      timestamptz not null default now(),
  unique (viewer_user_id, owner_user_id)
);

alter table public.family_members enable row level security;

-- Both parties can see the link
create policy "family_members: own rows"
  on public.family_members
  using (viewer_user_id = auth.uid() or owner_user_id = auth.uid());

-- Viewer read access on owner's medicines
create policy "medicines: viewer read"
  on public.medicines for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.family_members
      where viewer_user_id = auth.uid()
        and owner_user_id = medicines.user_id
    )
  );

-- Viewer read access on owner's dose_logs
create policy "dose_logs: viewer read"
  on public.dose_logs for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.family_members
      where viewer_user_id = auth.uid()
        and owner_user_id = dose_logs.user_id
    )
  );

create index on public.family_members (viewer_user_id);
create index on public.viewer_invites (code) where used_at is null;
