drop policy "posts_update_staff" on public.posts;

create policy "posts_update_staff" on public.posts
  for update to authenticated
  using (private.staff_can_read_post(id))
  with check (
    private.staff_can_read_post(id)
    and (
      room_id is null
      or exists (
        select 1 from public.rooms r
        where r.id = room_id
          and r.daycare_id = (select private.current_staff_daycare_id())
      )
    )
  );
