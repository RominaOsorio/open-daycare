delete from public.parent_children
where parent_id = (select id from auth.users where email = 'r.osorio.marmolejo@gmail.com')
  and child_id = (select id from public.children where full_name = 'Felipe Torres');

delete from public.invitations
where email = 'r.osorio.marmolejo@gmail.com'
  and child_id = (select id from public.children where full_name = 'Felipe Torres');
