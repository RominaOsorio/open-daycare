drop policy "users_select_staff_parents" on public.users;

create or replace function private.parents_of_staff_daycare()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select pc.parent_id
  from public.parent_children pc
  join public.children c on c.id = pc.child_id
  join public.rooms r on r.id = c.room_id
  where r.daycare_id = private.current_staff_daycare_id()
$$;

revoke execute on function private.parents_of_staff_daycare() from public, anon, service_role;
grant execute on function private.parents_of_staff_daycare() to authenticated;

create policy "users_select_staff_parents" on public.users
  for select to authenticated
  using (id in (select private.parents_of_staff_daycare()));