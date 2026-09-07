create type public.user_role as enum ('staff', 'parent', 'admin');

create type public.user_status as enum ('pending', 'active');

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  daycare_id uuid references public.daycares(id),
  role public.user_role not null default 'parent',
  status public.user_status not null default 'active',
  full_name text not null,
  avatar_url text,
  notify_on_post boolean not null default true,
  daily_summary_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.users enable row level security;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.users (id, full_name, daycare_id, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'daycare_id', '')::uuid,
    coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'parent')
  );
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger users_set_updated_at
  before update on public.users
  for each row execute procedure public.set_updated_at();

insert into auth.users (
  instance_id, id, aud, role, email,
  encrypted_password, email_confirmed_at,
  confirmation_token, recovery_token,
  email_change_token_new, email_change,
  raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated', 'authenticated',
  'juan@mail.cl',
  extensions.crypt('Abc123456', extensions.gen_salt('bf')),
  now(),
  '', '', '', '',
  '{"provider":"email","providers":["email"]}',
  jsonb_build_object(
    'full_name', 'Juan Herrera',
    'role', 'staff',
    'daycare_id', (select id from public.daycares where name = 'Guardería Sala Soles')
  ),
  now(), now()
);