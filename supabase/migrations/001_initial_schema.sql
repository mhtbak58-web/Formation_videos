create extension if not exists pgcrypto;

create table if not exists public.allowed_emails (
  email text primary key,
  created_at timestamptz not null default now(),
  note text,
  constraint allowed_emails_lowercase check (email = lower(email))
);

create table if not exists public.admin_emails (
  email text primary key,
  created_at timestamptz not null default now(),
  constraint admin_emails_lowercase check (email = lower(email))
);

create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text not null default 'General',
  duration_minutes integer,
  playback_url text not null,
  thumbnail_url text,
  sort_order integer not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.video_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  video_id uuid not null references public.videos(id) on delete cascade,
  completed boolean not null default false,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, video_id)
);

alter table public.allowed_emails enable row level security;
alter table public.admin_emails enable row level security;
alter table public.videos enable row level security;
alter table public.video_progress enable row level security;

create or replace function public.current_user_email()
returns text
language sql
stable
as $$
  select lower(coalesce(auth.jwt() ->> 'email', ''))
$$;

create or replace function public.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_emails
    where admin_emails.email = public.current_user_email()
  )
$$;

drop policy if exists "Users can read only their allowed email" on public.allowed_emails;
drop policy if exists "Users and admins can read allowed emails" on public.allowed_emails;
drop policy if exists "Admins can insert allowed emails" on public.allowed_emails;
drop policy if exists "Admins can update allowed emails" on public.allowed_emails;
drop policy if exists "Admins can delete allowed emails" on public.allowed_emails;
drop policy if exists "Admins can read admin emails" on public.admin_emails;
drop policy if exists "Admins can insert admin emails" on public.admin_emails;
drop policy if exists "Admins can delete admin emails" on public.admin_emails;
drop policy if exists "Allowed users can read published videos" on public.videos;
drop policy if exists "Allowed users and admins can read videos" on public.videos;
drop policy if exists "Admins can insert videos" on public.videos;
drop policy if exists "Admins can update videos" on public.videos;
drop policy if exists "Admins can delete videos" on public.videos;
drop policy if exists "Users can read their progress" on public.video_progress;
drop policy if exists "Users can insert their progress" on public.video_progress;
drop policy if exists "Users can update their progress" on public.video_progress;

create policy "Users and admins can read allowed emails"
on public.allowed_emails
for select
to authenticated
using (email = public.current_user_email() or public.current_user_is_admin());

create policy "Admins can insert allowed emails"
on public.allowed_emails
for insert
to authenticated
with check (public.current_user_is_admin());

create policy "Admins can update allowed emails"
on public.allowed_emails
for update
to authenticated
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

create policy "Admins can delete allowed emails"
on public.allowed_emails
for delete
to authenticated
using (public.current_user_is_admin());

create policy "Admins can read admin emails"
on public.admin_emails
for select
to authenticated
using (email = public.current_user_email() or public.current_user_is_admin());

create policy "Admins can insert admin emails"
on public.admin_emails
for insert
to authenticated
with check (public.current_user_is_admin());

create policy "Admins can delete admin emails"
on public.admin_emails
for delete
to authenticated
using (public.current_user_is_admin());

create policy "Allowed users and admins can read videos"
on public.videos
for select
to authenticated
using (
  public.current_user_is_admin()
  or (
    is_published = true
    and exists (
      select 1
      from public.allowed_emails
      where allowed_emails.email = public.current_user_email()
    )
  )
);

create policy "Admins can insert videos"
on public.videos
for insert
to authenticated
with check (public.current_user_is_admin());

create policy "Admins can update videos"
on public.videos
for update
to authenticated
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

create policy "Admins can delete videos"
on public.videos
for delete
to authenticated
using (public.current_user_is_admin());

create policy "Users can read their progress"
on public.video_progress
for select
to authenticated
using (user_id = auth.uid());

create policy "Users can insert their progress"
on public.video_progress
for insert
to authenticated
with check (user_id = auth.uid());

create policy "Users can update their progress"
on public.video_progress
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create or replace function public.set_progress_user_id()
returns trigger
language plpgsql
security definer
as $$
begin
  new.user_id = auth.uid();
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_progress_user_id on public.video_progress;
create trigger set_progress_user_id
before insert or update on public.video_progress
for each row execute function public.set_progress_user_id();

insert into public.videos (title, description, category, duration_minutes, playback_url, sort_order, is_published)
values
  ('Bienvenue dans la formation', 'Une introduction courte pour comprendre le parcours.', 'Demarrage', 4, 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 1, true),
  ('Les bases essentielles', 'Les premiers concepts a maitriser avant de continuer.', 'Fondamentaux', 12, 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', 2, true),
  ('Mise en pratique', 'Un cas concret pour transformer la theorie en reflexe.', 'Exercices', 18, 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4', 3, true)
on conflict do nothing;

-- A executer une seule fois dans Supabase SQL Editor pour creer le premier admin :
-- insert into public.admin_emails (email) values ('ton-email@exemple.com');
