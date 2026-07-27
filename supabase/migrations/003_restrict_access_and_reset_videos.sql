-- Archives every currently-allowed email except the 3 kept ones into a
-- table with RLS enabled and NO policies: unlike the other tables (see
-- 002_email_only_access.sql, which intentionally opened everything to the
-- anon key), this table is unreachable from the app entirely. It is only
-- readable/writable from the Supabase dashboard / SQL editor, so it acts
-- as a restricted holding area to restore access later if needed.
create table if not exists public.archived_emails (
  email text primary key,
  archived_at timestamptz not null default now()
);

alter table public.archived_emails enable row level security;

insert into public.archived_emails (email)
select email from public.allowed_emails
where email not in (
  'myriam.anedjar@hotmail.fr',
  'oumethica@gmail.com',
  'alyssa.thq@hotmail.com'
)
on conflict (email) do nothing;

delete from public.allowed_emails
where email not in (
  'myriam.anedjar@hotmail.fr',
  'oumethica@gmail.com',
  'alyssa.thq@hotmail.com'
);

delete from public.videos;
