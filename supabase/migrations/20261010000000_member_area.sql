-- Member area schema for BarangViral.Store.
-- Authorization is based only on Supabase app_metadata, never user-editable user_metadata.

create table if not exists public.member_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null default '',
  commerce_role text not null default 'buyer'
    check (commerce_role in ('buyer', 'seller', 'supplier', 'partner')),
  referral_code text not null unique,
  referred_by_id uuid references public.member_profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.member_accounts (
  user_id uuid primary key references public.member_profiles (id) on delete cascade,
  membership_type text not null default 'gold' check (membership_type = 'gold'),
  account_status text not null default 'active'
    check (account_status in ('active', 'suspended')),
  points_balance integer not null default 0
    check (points_balance between 0 and 2147483647),
  created_at timestamptz not null default now()
);

create table if not exists public.referral_relationships (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.member_profiles (id) on delete cascade,
  referred_user_id uuid not null unique references public.member_profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  check (referrer_id <> referred_user_id)
);

create table if not exists public.points_transactions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.member_profiles (id) on delete cascade,
  member_email text not null,
  amount integer not null check (amount <> 0),
  reason text not null check (char_length(reason) between 1 and 500),
  balance_after integer not null check (balance_after between 0 and 2147483647),
  admin_id uuid references auth.users (id) on delete set null,
  admin_email text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.support_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.member_profiles (id) on delete cascade,
  subject text not null check (char_length(subject) between 3 and 160),
  message text not null check (char_length(message) between 10 and 5000),
  status text not null default 'open'
    check (status in ('open', 'in_progress', 'resolved', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.member_profiles enable row level security;
alter table public.member_accounts enable row level security;
alter table public.referral_relationships enable row level security;
alter table public.points_transactions enable row level security;
alter table public.support_requests enable row level security;

revoke all on public.member_profiles, public.member_accounts, public.referral_relationships,
  public.points_transactions, public.support_requests from anon, authenticated;

grant select on public.member_profiles, public.member_accounts,
  public.referral_relationships, public.points_transactions, public.support_requests
  to authenticated;
grant update (full_name, commerce_role) on public.member_profiles to authenticated;
grant insert (user_id, subject, message) on public.support_requests to authenticated;
grant update (status) on public.support_requests to authenticated;

create policy "Members can read their own profile; admins can read all"
  on public.member_profiles for select to authenticated
  using ((select auth.uid()) = id
    or coalesce((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false));

create policy "Members can update their own editable profile fields"
  on public.member_profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "Members can read their own account; admins can read all"
  on public.member_accounts for select to authenticated
  using ((select auth.uid()) = user_id
    or coalesce((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false));

create policy "Members can read referrals they invited; admins can read all"
  on public.referral_relationships for select to authenticated
  using (referrer_id = (select auth.uid())
    or coalesce((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false));

create policy "Members can read their own point history; admins can read all"
  on public.points_transactions for select to authenticated
  using (member_id = (select auth.uid())
    or coalesce((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false));

create policy "Members can read their own support requests; admins can read all"
  on public.support_requests for select to authenticated
  using (user_id = (select auth.uid())
    or coalesce((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false));

create policy "Authenticated members can open their own support requests"
  on public.support_requests for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "Only admins can change support request status"
  on public.support_requests for update to authenticated
  using (coalesce((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false))
  with check (coalesce((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false));

create or replace function public.handle_new_member()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_referrer_id uuid;
  v_referral_code text;
begin
  v_referral_code := upper(nullif(trim(new.raw_user_meta_data ->> 'referral_code'), ''));
  if v_referral_code is not null then
    select id into v_referrer_id
      from public.member_profiles
      where upper(referral_code) = v_referral_code
      limit 1;
  end if;

  insert into public.member_profiles (id, email, full_name, commerce_role, referral_code, referred_by_id)
  values (
    new.id,
    coalesce(new.email, ''),
    left(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), 120),
    case when new.raw_user_meta_data ->> 'commerce_role' in ('buyer', 'seller', 'supplier', 'partner')
      then new.raw_user_meta_data ->> 'commerce_role' else 'buyer' end,
    'BV-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
    v_referrer_id
  );

  insert into public.member_accounts (user_id) values (new.id);

  if v_referrer_id is not null then
    insert into public.referral_relationships (referrer_id, referred_user_id)
    values (v_referrer_id, new.id)
    on conflict (referred_user_id) do nothing;
  end if;

  return new;
end;
$$;

revoke all on function public.handle_new_member() from public, anon, authenticated;
drop trigger if exists on_auth_user_created_member on auth.users;
create trigger on_auth_user_created_member
  after insert on auth.users
  for each row execute function public.handle_new_member();

create or replace function public.adjust_member_points(
  p_member_id uuid,
  p_amount integer,
  p_reason text
)
returns public.points_transactions
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_balance integer;
  v_after integer;
  v_member_email text;
  v_admin_email text;
  v_transaction public.points_transactions;
begin
  if (select auth.uid()) is null
    or coalesce((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false) is not true then
    raise exception 'Admin access required' using errcode = '42501';
  end if;
  if p_member_id is null or p_amount is null or p_amount = 0
    or p_reason is null or char_length(trim(p_reason)) not between 1 and 500 then
    raise exception 'Invalid point adjustment' using errcode = '22023';
  end if;

  select points_balance into v_balance
    from public.member_accounts where user_id = p_member_id for update;
  if not found then
    raise exception 'Member not found' using errcode = 'P0002';
  end if;

  v_after := v_balance + p_amount;
  if v_after < 0 or v_after > 2147483647 then
    raise exception 'Adjustment is outside the supported balance range' using errcode = '22003';
  end if;

  select email into v_member_email from public.member_profiles where id = p_member_id;
  select email into v_admin_email from auth.users where id = (select auth.uid());

  update public.member_accounts set points_balance = v_after where user_id = p_member_id;
  insert into public.points_transactions
    (member_id, member_email, amount, reason, balance_after, admin_id, admin_email)
  values
    (p_member_id, coalesce(v_member_email, ''), p_amount, trim(p_reason), v_after,
     (select auth.uid()), coalesce(v_admin_email, ''))
  returning * into v_transaction;

  return v_transaction;
end;
$$;

create or replace function public.admin_set_member_status(
  p_member_id uuid,
  p_account_status text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null
    or coalesce((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false) is not true then
    raise exception 'Admin access required' using errcode = '42501';
  end if;
  if p_account_status not in ('active', 'suspended') then
    raise exception 'Invalid account status' using errcode = '22023';
  end if;

  update public.member_accounts
    set account_status = p_account_status
    where user_id = p_member_id;
  if not found then
    raise exception 'Member not found' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.adjust_member_points(uuid, integer, text) from public, anon;
revoke all on function public.admin_set_member_status(uuid, text) from public, anon;
grant execute on function public.adjust_member_points(uuid, integer, text) to authenticated;
grant execute on function public.admin_set_member_status(uuid, text) to authenticated;
