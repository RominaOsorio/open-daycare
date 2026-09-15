create or replace function private.is_parent_of_child(p_child_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.parent_children pc
    where pc.child_id = p_child_id
      and pc.parent_id = (select auth.uid())
  )
$$;

create or replace function private.parent_can_read_post(p_post_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.posts p
    where p.id = p_post_id
      and (
        exists (
          select 1
          from public.post_children pc
          where pc.post_id = p.id
            and private.is_parent_of_child(pc.child_id)
        )
        or (
          p.type = 'announcement'
          and exists (
            select 1
            from public.children c
            join public.parent_children pc on pc.child_id = c.id
            where pc.parent_id = (select auth.uid())
              and c.room_id = p.room_id
          )
        )
      )
  )
$$;

create or replace function private.is_child_in_staff_daycare(p_child_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.children c
    join public.rooms r on r.id = c.room_id
    where c.id = p_child_id
      and r.daycare_id = private.current_staff_daycare_id()
  )
$$;

create or replace function private.staff_can_read_post(p_post_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.posts p
    where p.id = p_post_id
      and (
        exists (
          select 1 from public.users a
          where a.id = p.author_id
            and a.daycare_id = private.current_staff_daycare_id()
        )
        or exists (
          select 1 from public.rooms r
          where r.id = p.room_id
            and r.daycare_id = private.current_staff_daycare_id()
        )
      )
  )
$$;

revoke execute on function private.is_parent_of_child(uuid) from public, anon, service_role;
revoke execute on function private.parent_can_read_post(uuid) from public, anon, service_role;
revoke execute on function private.is_child_in_staff_daycare(uuid) from public, anon, service_role;
revoke execute on function private.staff_can_read_post(uuid) from public, anon, service_role;
grant execute on function private.is_parent_of_child(uuid) to authenticated;
grant execute on function private.parent_can_read_post(uuid) to authenticated;
grant execute on function private.is_child_in_staff_daycare(uuid) to authenticated;
grant execute on function private.staff_can_read_post(uuid) to authenticated;

create policy "posts_select_staff" on public.posts
  for select to authenticated
  using (private.staff_can_read_post(id));

create policy "posts_insert_staff" on public.posts
  for insert to authenticated
  with check (
    (select private.current_staff_daycare_id()) is not null
    and author_id = (select auth.uid())
    and (
      room_id is null
      or exists (
        select 1 from public.rooms r
        where r.id = room_id
          and r.daycare_id = (select private.current_staff_daycare_id())
      )
    )
  );

create policy "posts_update_staff" on public.posts
  for update to authenticated
  using (private.staff_can_read_post(id))
  with check (private.staff_can_read_post(id));

create policy "post_children_select_staff" on public.post_children
  for select to authenticated
  using (private.staff_can_read_post(post_id));

create policy "post_children_insert_staff" on public.post_children
  for insert to authenticated
  with check (
    private.staff_can_read_post(post_id)
    and private.is_child_in_staff_daycare(child_id)
  );

create policy "post_children_delete_staff" on public.post_children
  for delete to authenticated
  using (private.staff_can_read_post(post_id));

create policy "post_photos_select_staff" on public.post_photos
  for select to authenticated
  using (private.staff_can_read_post(post_id));

create policy "post_photos_insert_staff" on public.post_photos
  for insert to authenticated
  with check (private.staff_can_read_post(post_id));

create policy "post_photos_delete_staff" on public.post_photos
  for delete to authenticated
  using (private.staff_can_read_post(post_id));

create policy "posts_select_parent" on public.posts
  for select to authenticated
  using (private.parent_can_read_post(id));

create policy "post_children_select_parent" on public.post_children
  for select to authenticated
  using (private.is_parent_of_child(child_id));

create policy "post_photos_select_parent" on public.post_photos
  for select to authenticated
  using (private.parent_can_read_post(post_id));
