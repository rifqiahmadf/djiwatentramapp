-- Bootstrap only the staff directory dependencies on a fresh Supabase project.
-- Based on 0004_auth_core.sql and the current photo_url directory definition.
-- Never expose password/PIN hashes, PIN fingerprints, raw documents or biometrics.
-- Legacy browser-side PIN fallback requires a server auth endpoint instead.
-- The runner must execute this file in a transaction.

create table if not exists public.yumi_roles (
  source_id text primary key,
  name text not null,
  permissions jsonb not null default '[]'::jsonb,
  raw jsonb not null default '{}'::jsonb
);

create unique index if not exists idx_yumi_roles_name_lower
  on public.yumi_roles ((lower(trim(name))));

create table if not exists public.yumi_users (
  source_id text primary key,
  username text not null,
  password_hash text,
  home_pin_hash text,
  home_pin_fingerprint text,
  name text not null,
  role_source_id text not null references public.yumi_roles (source_id),
  is_active boolean not null default true,
  receive_report_emails boolean not null default false,
  last_login_at timestamptz,
  auth_user_id text,
  face_descriptor jsonb,
  slug text,
  raw jsonb not null default '{}'::jsonb
);

create unique index if not exists idx_yumi_users_username_lower
  on public.yumi_users ((lower(trim(username))));

create unique index if not exists idx_yumi_users_home_pin_fingerprint
  on public.yumi_users (home_pin_fingerprint)
  where home_pin_fingerprint is not null;

create unique index if not exists idx_yumi_users_auth_user_id
  on public.yumi_users (auth_user_id)
  where auth_user_id is not null;

create unique index if not exists idx_yumi_users_slug
  on public.yumi_users (slug)
  where slug is not null and btrim(slug) <> '';

create index if not exists idx_yumi_users_role_source_id
  on public.yumi_users (role_source_id);

alter table public.yumi_users add column if not exists photo_url text;

alter table public.yumi_roles enable row level security;
alter table public.yumi_users enable row level security;
revoke all on public.yumi_roles from public, anon, authenticated;
revoke all on public.yumi_users from public, anon, authenticated;
grant all on public.yumi_roles, public.yumi_users to service_role;

create or replace view public.pos_users_public
with (security_barrier = true, security_invoker = false) as
select
  u.source_id as _id,
  u.name,
  u.slug,
  upper(left(coalesce(u.name, '?'), 1)) as initial,
  coalesce(u.is_active, true) as "isActive",
  case
    when jsonb_typeof(u.raw->'faceDescriptor') = 'array' then true
    else false
  end as "hasFace",
  u.username,
  u.role_source_id as "roleId",
  trim(r.name) as "roleName",
  u.receive_report_emails as "receiveReportEmails",
  u.last_login_at as "lastLogin",
  u.photo_url as "photoUrl"
from public.yumi_users u
left join public.yumi_roles r on r.source_id = u.role_source_id;

revoke all on public.pos_users_public from public, anon, authenticated;
grant select on public.pos_users_public to anon, authenticated;

grant select on public.pos_users_public to service_role;
comment on view public.pos_users_public is
  'Public staff directory only; authentication secrets and biometric data are excluded.';
notify pgrst, 'reload schema';
