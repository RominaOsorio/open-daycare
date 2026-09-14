delete from public.parent_children;

delete from public.invitations;

delete from auth.users
where email in (
  'r.osorio.marmolejo@gmail.com',
  'jose@gmail.com',
  'andrea@mail.cl'
);
