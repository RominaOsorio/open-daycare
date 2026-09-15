drop policy "posts_select_staff" on public.posts;

create policy "posts_select_staff" on public.posts
  for select to authenticated
  using (
    author_id = (select auth.uid())
    or private.staff_can_read_post(id)
  );
