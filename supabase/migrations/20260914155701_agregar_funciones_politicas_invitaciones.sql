create schema if not exists private;

create or replace function private.current_staff_daycare_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select u.daycare_id
  from public.users u
  where u.id = (select auth.uid())
    and u.role = 'staff'
$$;

revoke execute on function private.current_staff_daycare_id() from public, anon, service_role;
grant usage on schema private to authenticated;
grant execute on function private.current_staff_daycare_id() to authenticated;

create policy "users_select_staff_parents" on public.users
  for select to authenticated
  using (
    exists (
      select 1
      from public.parent_children pc
      join public.children c on c.id = pc.child_id
      join public.rooms r on r.id = c.room_id
      where pc.parent_id = users.id
        and r.daycare_id = (select private.current_staff_daycare_id())
    )
  );

create policy "invitations_update_staff" on public.invitations
  for update to authenticated
  using (
    (select role from public.users u where u.id = (select auth.uid())) = 'staff'
    and exists (
      select 1
      from public.children c
      join public.rooms r on r.id = c.room_id
      where c.id = child_id
        and r.daycare_id = (select u2.daycare_id from public.users u2 where u2.id = (select auth.uid()))
    )
  )
  with check (
    (select role from public.users u where u.id = (select auth.uid())) = 'staff'
    and exists (
      select 1
      from public.children c
      join public.rooms r on r.id = c.room_id
      where c.id = child_id
        and r.daycare_id = (select u2.daycare_id from public.users u2 where u2.id = (select auth.uid()))
    )
  );

create or replace function public.get_invitation_info(p_code text)
returns table (
  full_name text,
  email text,
  relationship public.relationship_type,
  child_name text,
  room_name text,
  status public.invitation_status,
  expires_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    i.full_name,
    i.email,
    i.relationship,
    c.full_name,
    r.name,
    i.status,
    i.expires_at
  from public.invitations i
  join public.children c on c.id = i.child_id
  join public.rooms r on r.id = c.room_id
  where i.code = p_code
$$;

revoke execute on function public.get_invitation_info(text) from public, anon, authenticated, service_role;
grant execute on function public.get_invitation_info(text) to anon, authenticated;

create or replace function public.accept_invitation(p_code text, p_photo_consent boolean)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_email text := lower(coalesce((select auth.jwt()) ->> 'email', ''));
  v_invitation public.invitations%rowtype;
  v_child_name text;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  select *
  into v_invitation
  from public.invitations i
  where i.code = p_code
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'invitation_not_found');
  end if;

  if v_invitation.status <> 'pending' then
    return jsonb_build_object('ok', false, 'error', 'invitation_not_pending');
  end if;

  if v_invitation.expires_at <= now() then
    return jsonb_build_object('ok', false, 'error', 'invitation_expired');
  end if;

  if lower(v_invitation.email) <> v_email then
    return jsonb_build_object('ok', false, 'error', 'email_mismatch');
  end if;

  insert into public.parent_children (parent_id, child_id, relationship)
  values (v_uid, v_invitation.child_id, v_invitation.relationship)
  on conflict (parent_id, child_id) do nothing;

  update public.invitations
  set status = 'accepted', accepted_at = now()
  where id = v_invitation.id;

  if p_photo_consent is false then
    update public.children
    set photo_consent = false
    where id = v_invitation.child_id;
  end if;

  select c.full_name
  into v_child_name
  from public.children c
  where c.id = v_invitation.child_id;

  return jsonb_build_object('ok', true, 'child_name', v_child_name);
end;
$$;

revoke execute on function public.accept_invitation(text, boolean) from public, anon, authenticated, service_role;
grant execute on function public.accept_invitation(text, boolean) to authenticated;
