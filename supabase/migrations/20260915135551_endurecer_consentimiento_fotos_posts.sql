create or replace function private.post_has_photos(p_post_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.post_photos ph where ph.post_id = p_post_id
  )
$$;

create or replace function private.child_photo_consent(p_child_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select c.photo_consent from public.children c where c.id = p_child_id
$$;

create or replace function private.post_children_all_consent(p_post_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select not exists (
    select 1
    from public.post_children pc
    join public.children c on c.id = pc.child_id
    where pc.post_id = p_post_id
      and c.photo_consent is false
  )
$$;

revoke execute on function private.post_has_photos(uuid) from public, anon, service_role;
revoke execute on function private.child_photo_consent(uuid) from public, anon, service_role;
revoke execute on function private.post_children_all_consent(uuid) from public, anon, service_role;
grant execute on function private.post_has_photos(uuid) to authenticated;
grant execute on function private.child_photo_consent(uuid) to authenticated;
grant execute on function private.post_children_all_consent(uuid) to authenticated;

drop policy "post_children_insert_staff" on public.post_children;

create policy "post_children_insert_staff" on public.post_children
  for insert to authenticated
  with check (
    private.staff_can_read_post(post_id)
    and private.is_child_in_staff_daycare(child_id)
    and (
      not private.post_has_photos(post_id)
      or private.child_photo_consent(child_id)
    )
  );

drop policy "post_photos_insert_staff" on public.post_photos;

create policy "post_photos_insert_staff" on public.post_photos
  for insert to authenticated
  with check (
    private.staff_can_read_post(post_id)
    and private.post_children_all_consent(post_id)
  );

create policy "posts_delete_staff" on public.posts
  for delete to authenticated
  using (
    author_id = (select auth.uid())
    and (select private.current_staff_daycare_id()) is not null
  );
