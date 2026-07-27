-- General site access (allowed_emails) is unrestricted: everyone keeps
-- access to the main catalogue. Only the Replays & Tutos page is gated,
-- through this separate allow-list table (same permissive RLS pattern as
-- the rest of the app, since there is no session-based auth to check
-- "who" is asking beyond the anon key -- see 002_email_only_access.sql).
create table if not exists public.replay_emails (
  email text primary key,
  created_at timestamptz not null default now()
);

alter table public.replay_emails enable row level security;

drop policy if exists "Anyone can read replay emails" on public.replay_emails;
drop policy if exists "Anyone can insert replay emails" on public.replay_emails;
drop policy if exists "Anyone can delete replay emails" on public.replay_emails;

create policy "Anyone can read replay emails" on public.replay_emails for select using (true);
create policy "Anyone can insert replay emails" on public.replay_emails for insert with check (true);
create policy "Anyone can delete replay emails" on public.replay_emails for delete using (true);

insert into public.replay_emails (email)
values
  ('myriam.anedjar@hotmail.fr'),
  ('oumethica@gmail.com'),
  ('alyssa.thq@hotmail.com')
on conflict (email) do nothing;

delete from public.videos;
