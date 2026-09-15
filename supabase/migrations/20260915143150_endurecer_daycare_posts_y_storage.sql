alter table public.posts
  add column daycare_id uuid references public.daycares(id);

update public.posts p
set daycare_id = coalesce(
  (select r.daycare_id from public.rooms r where r.id = p.room_id),
  (select u.daycare_id from public.users u where u.id = p.author_id)
)
where p.daycare_id is null;

alter table public.posts
  alter column daycare_id set not null;

create index posts_daycare_id_idx on public.posts (daycare_id);
create index users_daycare_id_idx on public.users (daycare_id);

create or replace function private.set_post_daycare()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.daycare_id := coalesce(
      (select r.daycare_id from public.rooms r where r.id = new.room_id),
      (select u.daycare_id from public.users u where u.id = new.author_id)
    );
  else
    new.daycare_id := old.daycare_id;
  end if;
  return new;
end
$$;

revoke execute on function private.set_post_daycare() from public, anon, service_role;
grant execute on function private.set_post_daycare() to authenticated;

create trigger posts_set_daycare
  before insert or update on public.posts
  for each row execute procedure private.set_post_daycare();

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
      and p.daycare_id = private.current_staff_daycare_id()
  )
$$;

drop policy "posts_insert_staff" on public.posts;

create policy "posts_insert_staff" on public.posts
  for insert to authenticated
  with check (
    (select private.current_staff_daycare_id()) is not null
    and author_id = (select auth.uid())
    and daycare_id = (select private.current_staff_daycare_id())
    and (
      room_id is null
      or exists (
        select 1 from public.rooms r
        where r.id = room_id
          and r.daycare_id = (select private.current_staff_daycare_id())
      )
    )
  );

drop policy "posts_update_staff" on public.posts;

create policy "posts_update_staff" on public.posts
  for update to authenticated
  using (private.staff_can_read_post(id))
  with check (
    private.staff_can_read_post(id)
    and daycare_id = (select private.current_staff_daycare_id())
    and (
      room_id is null
      or exists (
        select 1 from public.rooms r
        where r.id = room_id
          and r.daycare_id = (select private.current_staff_daycare_id())
      )
    )
  );

drop policy "post_photos_storage_insert" on storage.objects;

create policy "post_photos_storage_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'post-photos'
    and split_part(name, '/', 1) = (select private.current_staff_daycare_id())::text
    and private.staff_can_read_post(private.post_id_from_photo_path(name))
    and private.post_children_all_consent(private.post_id_from_photo_path(name))
  );

create or replace function private.post_id_from_photo_path(p_name text)
returns uuid
language sql
immutable
security definer
set search_path = ''
as $$
  select case
    when p_name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[^/]+\.(jpg|jpeg|png|webp)$'
    then split_part(p_name, '/', 2)::uuid
  end
$$;

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
    and u.role = 'staff'
$$;
