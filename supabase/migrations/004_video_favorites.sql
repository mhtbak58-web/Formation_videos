-- Lets a user save videos to a personal "Favoris" list. Same permissive RLS
-- pattern as video_progress/replay_emails (see 002_email_only_access.sql):
-- there's no session-based auth to check "who" beyond the anon key.
create table if not exists public.video_favorites (
  email text not null,
  video_id uuid not null references public.videos(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (email, video_id)
);

alter table public.video_favorites enable row level security;

drop policy if exists "Anyone can read favorites" on public.video_favorites;
drop policy if exists "Anyone can insert favorites" on public.video_favorites;
drop policy if exists "Anyone can delete favorites" on public.video_favorites;

create policy "Anyone can read favorites" on public.video_favorites for select using (true);
create policy "Anyone can insert favorites" on public.video_favorites for insert with check (true);
create policy "Anyone can delete favorites" on public.video_favorites for delete using (true);
