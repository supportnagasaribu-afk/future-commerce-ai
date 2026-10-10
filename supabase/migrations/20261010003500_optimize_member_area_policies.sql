-- Tune member-area RLS claim lookups and foreign-key access paths.
-- Admin authorization remains based on server-controlled app_metadata.

drop policy if exists "Members can read their own profile; admins can read all" on public.member_profiles;
create policy "Members can read their own profile; admins can read all"
  on public.member_profiles for select to authenticated
  using ((select auth.uid()) = id
    or coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin', false));

drop policy if exists "Members can read their own account; admins can read all" on public.member_accounts;
create policy "Members can read their own account; admins can read all"
  on public.member_accounts for select to authenticated
  using ((select auth.uid()) = user_id
    or coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin', false));

drop policy if exists "Members can read referrals they invited; admins can read all" on public.referral_relationships;
create policy "Members can read referrals they invited; admins can read all"
  on public.referral_relationships for select to authenticated
  using (referrer_id = (select auth.uid())
    or coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin', false));

drop policy if exists "Members can read their own point history; admins can read all" on public.points_transactions;
create policy "Members can read their own point history; admins can read all"
  on public.points_transactions for select to authenticated
  using (member_id = (select auth.uid())
    or coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin', false));

drop policy if exists "Members can read their own support requests; admins can read all" on public.support_requests;
create policy "Members can read their own support requests; admins can read all"
  on public.support_requests for select to authenticated
  using (user_id = (select auth.uid())
    or coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin', false));

drop policy if exists "Only admins can change support request status" on public.support_requests;
create policy "Only admins can change support request status"
  on public.support_requests for update to authenticated
  using (coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin', false))
  with check (coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin', false));

drop policy if exists "Only admins can read member admin activity" on public.member_admin_activity;
create policy "Only admins can read member admin activity"
  on public.member_admin_activity for select to authenticated
  using (coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin', false));

create index if not exists member_profiles_referred_by_id_idx on public.member_profiles (referred_by_id);
create index if not exists points_transactions_admin_id_idx on public.points_transactions (admin_id);
create index if not exists points_transactions_member_id_idx on public.points_transactions (member_id);
create index if not exists referral_relationships_referrer_id_idx on public.referral_relationships (referrer_id);
create index if not exists support_requests_user_id_idx on public.support_requests (user_id);
create index if not exists member_admin_activity_admin_user_id_idx on public.member_admin_activity (admin_user_id);
create index if not exists member_admin_activity_target_member_id_idx on public.member_admin_activity (target_member_id);
