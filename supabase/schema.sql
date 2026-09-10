-- Cuebetza database schema
-- Run this in the Supabase SQL Editor (Dashboard -> SQL Editor -> New query).
-- Mirrors the TypeScript models in src/models/, turned into real tables
-- with primary keys, foreign keys, timestamps and array columns.

create extension if not exists pgcrypto;

-- ---------- Profiles (extends Supabase's built-in auth.users) ----------
-- Supabase Auth already stores email + hashed password in auth.users, so
-- profiles only holds the app-specific fields, linked 1:1 by primary key.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  name text,
  surname text,
  contact_number text unique,
  level text not null default 'beginner'
    check (level in ('beginner', 'intermediate', 'advanced', 'pro')),
  balance numeric not null default 0,
  status text not null default 'active'
    check (status in ('active', 'suspended', 'banned')),
  kyc_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create a profile row whenever someone signs up via Supabase Auth.
-- The username is pulled from the metadata passed to supabase.auth.signUp().
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, new.raw_user_meta_data ->> 'username');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------- Operating tables ----------

create table public.operating_tables (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('standard', 'tournament', 'special')),
  variant text not null check (variant in ('8_ball', '9_ball', 'classic')),
  min_stake numeric not null,
  max_stake numeric not null,
  capacity int not null,
  active_players int not null default 0,
  active_player_ids uuid[] not null default '{}' -- array of FK -> profiles.id
);

-- ---------- Rooms / matchmaking ----------

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  table_id uuid not null references public.operating_tables (id),
  variant text not null check (variant in ('8_ball', '9_ball', 'classic')),
  required_level text check (required_level in ('beginner', 'intermediate', 'advanced', 'pro')),
  max_players int not null default 2,
  status text not null default 'open'
    check (status in ('open', 'full', 'in_progress', 'closed')),
  created_at timestamptz not null default now()
);

create table public.room_players (
  room_id uuid not null references public.rooms (id) on delete cascade,
  player_id uuid not null references public.profiles (id) on delete cascade,
  player_level text not null check (player_level in ('beginner', 'intermediate', 'advanced', 'pro')),
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  primary key (room_id, player_id)
);

create table public.matchmaking_queue (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.profiles (id) on delete cascade,
  player_level text not null check (player_level in ('beginner', 'intermediate', 'advanced', 'pro')),
  variant text not null check (variant in ('8_ball', '9_ball', 'classic')),
  desired_stake numeric,
  queued_at timestamptz not null default now()
);

-- ---------- Games ----------

create table public.games (
  id uuid primary key default gen_random_uuid(),
  mode text not null check (mode in ('ai_vs_player', 'player_vs_player')),
  variant text not null check (variant in ('8_ball', '9_ball', 'classic')),
  table_id uuid not null references public.operating_tables (id),
  room_id uuid references public.rooms (id),
  player1_id uuid not null references public.profiles (id),
  player2_id uuid references public.profiles (id),
  status text not null default 'waiting'
    check (status in ('waiting', 'in_progress', 'completed', 'cancelled')),
  winner_id uuid references public.profiles (id),
  started_at timestamptz,
  ended_at timestamptz
);

-- ---------- Tournaments ----------

create table public.tournaments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  variant text not null check (variant in ('8_ball', '9_ball', 'classic')),
  table_id uuid not null references public.operating_tables (id),
  entry_fee numeric not null,
  prize_pool numeric not null default 0,
  status text not null default 'registration'
    check (status in ('registration', 'in_progress', 'completed')),
  starts_at timestamptz not null,
  ends_at timestamptz
);

create table public.tournament_participants (
  tournament_id uuid not null references public.tournaments (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  registered_at timestamptz not null default now(),
  placement int,
  primary key (tournament_id, user_id)
);

-- ---------- Wallet: vouchers, transactions, withdrawals ----------

create table public.vouchers (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  value numeric not null,
  status text not null default 'issued'
    check (status in ('issued', 'redeemed', 'expired')),
  issued_to_user_id uuid references public.profiles (id),
  issued_at timestamptz not null default now(),
  redeemed_at timestamptz,
  expires_at timestamptz
);

-- Source of truth for all balance changes. profiles.balance should only
-- ever be updated as a derived result of inserting a row here.
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id),
  type text not null
    check (type in ('deposit', 'withdrawal', 'voucher_redeem', 'wager_stake', 'wager_payout', 'refund')),
  amount numeric not null, -- positive = credit, negative = debit
  balance_after numeric not null,
  reference_id uuid, -- points at a wager/voucher/withdrawal row depending on type; not a strict FK since it's polymorphic
  created_at timestamptz not null default now()
);

create table public.withdrawal_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id),
  amount numeric not null,
  method text not null check (method in ('bank_transfer', 'e_wallet', 'voucher')),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'completed')),
  requested_at timestamptz not null default now(),
  processed_at timestamptz,
  transaction_id uuid references public.transactions (id)
);

-- ---------- Wagers ----------

create table public.wagers (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games (id),
  user_id uuid not null references public.profiles (id),
  stake numeric not null,
  potential_payout numeric not null,
  win_boost numeric not null default 0,
  status text not null default 'pending'
    check (status in ('pending', 'won', 'lost', 'refunded')),
  placed_at timestamptz not null default now(),
  settled_at timestamptz
);

-- ---------- Row Level Security ----------
-- Every table starts locked down; each policy below opens exactly the
-- access a normal signed-in player needs. Tighten/extend as features land.

alter table public.profiles enable row level security;
create policy "Profiles are viewable by their owner" on public.profiles
  for select using (auth.uid() = id);
create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = id);

alter table public.operating_tables enable row level security;
create policy "Operating tables are readable by any signed-in user" on public.operating_tables
  for select using (auth.role() = 'authenticated');

alter table public.rooms enable row level security;
create policy "Rooms are readable by any signed-in user" on public.rooms
  for select using (auth.role() = 'authenticated');

alter table public.room_players enable row level security;
create policy "Players can see their own room memberships" on public.room_players
  for select using (auth.uid() = player_id);

alter table public.matchmaking_queue enable row level security;
create policy "Players can manage their own queue entry" on public.matchmaking_queue
  for all using (auth.uid() = player_id);

alter table public.games enable row level security;
create policy "Games are readable by any signed-in user" on public.games
  for select using (auth.role() = 'authenticated');

alter table public.tournaments enable row level security;
create policy "Tournaments are readable by any signed-in user" on public.tournaments
  for select using (auth.role() = 'authenticated');

alter table public.tournament_participants enable row level security;
create policy "Users can see their own tournament entries" on public.tournament_participants
  for select using (auth.uid() = user_id);

alter table public.vouchers enable row level security;
create policy "Users can see vouchers issued to them" on public.vouchers
  for select using (auth.uid() = issued_to_user_id);

alter table public.transactions enable row level security;
create policy "Users can see their own transactions" on public.transactions
  for select using (auth.uid() = user_id);

alter table public.withdrawal_requests enable row level security;
create policy "Users can manage their own withdrawal requests" on public.withdrawal_requests
  for all using (auth.uid() = user_id);

alter table public.wagers enable row level security;
create policy "Users can see their own wagers" on public.wagers
  for select using (auth.uid() = user_id);
