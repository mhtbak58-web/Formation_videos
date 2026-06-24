-- Switches from Supabase Auth magic links to a direct email-allowlist check:
-- the client looks up the typed email with the anon key (no session, no link).
-- Tradeoff: RLS can no longer verify *who* is asking, only that the anon key
-- is valid, so these tables become readable/writable by anyone with the
-- public anon key. Acceptable for now since the app is small and the data
-- isn't sensitive; revisit if that changes.

drop policy if exists "Users and admins can read allowed emails" on public.allowed_emails;
drop policy if exists "Admins can insert allowed emails" on public.allowed_emails;
drop policy if exists "Admins can update allowed emails" on public.allowed_emails;
drop policy if exists "Admins can delete allowed emails" on public.allowed_emails;
drop policy if exists "Admins can read admin emails" on public.admin_emails;
drop policy if exists "Admins can insert admin emails" on public.admin_emails;
drop policy if exists "Admins can delete admin emails" on public.admin_emails;
drop policy if exists "Allowed users and admins can read videos" on public.videos;
drop policy if exists "Admins can insert videos" on public.videos;
drop policy if exists "Admins can update videos" on public.videos;
drop policy if exists "Admins can delete videos" on public.videos;
drop policy if exists "Users can read their progress" on public.video_progress;
drop policy if exists "Users can insert their progress" on public.video_progress;
drop policy if exists "Users can update their progress" on public.video_progress;

drop trigger if exists set_progress_user_id on public.video_progress;
drop function if exists public.set_progress_user_id();

alter table public.video_progress drop constraint if exists video_progress_pkey;
alter table public.video_progress drop constraint if exists video_progress_user_id_fkey;
alter table public.video_progress add column if not exists email text;

update public.video_progress vp
set email = lower(au.email)
from auth.users au
where au.id = vp.user_id and vp.email is null;

delete from public.video_progress where email is null;

alter table public.video_progress alter column email set not null;
alter table public.video_progress drop column if exists user_id;
alter table public.video_progress add constraint video_progress_pkey primary key (email, video_id);

create policy "Anyone can read allowed emails" on public.allowed_emails for select using (true);
create policy "Anyone can read admin emails" on public.admin_emails for select using (true);

create policy "Anyone can read videos" on public.videos for select using (true);
create policy "Anyone can insert videos" on public.videos for insert with check (true);
create policy "Anyone can update videos" on public.videos for update using (true) with check (true);
create policy "Anyone can delete videos" on public.videos for delete using (true);

create policy "Anyone can read progress" on public.video_progress for select using (true);
create policy "Anyone can insert progress" on public.video_progress for insert with check (true);
create policy "Anyone can update progress" on public.video_progress for update using (true) with check (true);
