insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'post-photos',
  'post-photos',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

create or replace function private.post_id_from_photo_path(p_name text)
returns uuid
language sql
immutable
security definer
set search_path = ''
as $$
  select case
    when split_part(p_name, '/', 1) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
     and split_part(p_name, '/', 2) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
     and split_part(p_name, '/', 3) <> ''
    then split_part(p_name, '/', 2)::uuid
  end
$$;

revoke execute on function private.post_id_from_photo_path(text) from public, anon, service_role;
grant execute on function private.post_id_from_photo_path(text) to authenticated;

create policy "post_photos_storage_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'post-photos'
    and private.post_id_from_photo_path(name) is not null
    and (
      private.staff_can_read_post(private.post_id_from_photo_path(name))
      or private.parent_can_read_post(private.post_id_from_photo_path(name))
    )
  );

create policy "post_photos_storage_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'post-photos'
    and split_part(name, '/', 1) = (select private.current_staff_daycare_id())::text
    and private.staff_can_read_post(private.post_id_from_photo_path(name))
  );

create policy "post_photos_storage_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'post-photos'
    and private.post_id_from_photo_path(name) is not null
    and private.staff_can_read_post(private.post_id_from_photo_path(name))
  );
