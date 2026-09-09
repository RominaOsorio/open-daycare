create policy "rooms_select_staff" on public.rooms
  for select to authenticated
  using (
    (select role from public.users where id = (select auth.uid())) = 'staff'
    and daycare_id = (select daycare_id from public.users where id = (select auth.uid()))
  );

create policy "children_select_staff" on public.children
  for select to authenticated
  using (
    (select role from public.users where id = (select auth.uid())) = 'staff'
    and exists (
      select 1 from public.rooms r
      where r.id = room_id
        and r.daycare_id = (select daycare_id from public.users where id = (select auth.uid()))
    )
  );

create policy "children_insert_staff" on public.children
  for insert to authenticated
  with check (
    (select role from public.users where id = (select auth.uid())) = 'staff'
    and exists (
      select 1 from public.rooms r
      where r.id = room_id
        and r.daycare_id = (select daycare_id from public.users where id = (select auth.uid()))
    )
  );

create policy "children_update_staff" on public.children
  for update to authenticated
  using (
    (select role from public.users where id = (select auth.uid())) = 'staff'
    and exists (
      select 1 from public.rooms r
      where r.id = room_id
        and r.daycare_id = (select daycare_id from public.users where id = (select auth.uid()))
    )
  )
  with check (
    (select role from public.users where id = (select auth.uid())) = 'staff'
    and exists (
      select 1 from public.rooms r
      where r.id = room_id
        and r.daycare_id = (select daycare_id from public.users where id = (select auth.uid()))
    )
  );
