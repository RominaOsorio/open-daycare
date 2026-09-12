create policy "parent_children_select_staff" on public.parent_children
  for select to authenticated
  using (
    (select role from public.users where id = (select auth.uid())) = 'staff'
    and exists (
      select 1 from public.children c
      join public.rooms r on r.id = c.room_id
      where c.id = child_id
        and r.daycare_id = (select daycare_id from public.users where id = (select auth.uid()))
    )
  );

create policy "parent_children_select_own" on public.parent_children
  for select to authenticated
  using (parent_id = (select auth.uid()));

create policy "invitations_select_staff" on public.invitations
  for select to authenticated
  using (
    (select role from public.users where id = (select auth.uid())) = 'staff'
    and exists (
      select 1 from public.children c
      join public.rooms r on r.id = c.room_id
      where c.id = child_id
        and r.daycare_id = (select daycare_id from public.users where id = (select auth.uid()))
    )
  );

create policy "invitations_insert_staff" on public.invitations
  for insert to authenticated
  with check (
    (select role from public.users where id = (select auth.uid())) = 'staff'
    and invited_by = (select auth.uid())
    and exists (
      select 1 from public.children c
      join public.rooms r on r.id = c.room_id
      where c.id = child_id
        and r.daycare_id = (select daycare_id from public.users where id = (select auth.uid()))
    )
  );

create policy "invitations_select_own" on public.invitations
  for select to authenticated
  using (lower(email) = lower((select auth.jwt() ->> 'email')));
