create or replace function private.staff_colleagues()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select u.id
  from public.users u
  where u.daycare_id = private.current_staff_daycare_id()
    and u.role in ('staff', 'admin')
$$;

revoke execute on function private.staff_colleagues() from public, anon, service_role;
grant execute on function private.staff_colleagues() to authenticated;

create policy "users_select_staff_colleagues" on public.users
  for select to authenticated
  using (id in (select private.staff_colleagues()));

create policy "daycares_select_staff" on public.daycares
  for select to authenticated
  using (id = (select private.current_staff_daycare_id()));
