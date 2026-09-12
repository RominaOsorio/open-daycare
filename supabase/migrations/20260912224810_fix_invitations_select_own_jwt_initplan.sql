alter policy "invitations_select_own" on public.invitations
  using (lower(email) = lower((select auth.jwt()) ->> 'email'));
