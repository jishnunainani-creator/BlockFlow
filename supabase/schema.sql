-- ============================================================================
-- BlockFlow Supabase PostgreSQL Database Schema & Row-Level Security (RLS)
-- ============================================================================

-- Enable UUID Extension
create extension if not exists "uuid-ossp";

-- 1. USERS PREFERENCES TABLE
create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  theme text default 'system',
  grid_resolution integer default 60,
  notifications_enabled boolean default false,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. CATEGORIES TABLE
create table if not exists public.categories (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  color text not null,
  icon text default 'tag',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. REUSABLE BLOCKS (LIBRARY)
create table if not exists public.reusable_blocks (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  color text not null,
  priority text default 'medium',
  default_duration integer default 60,
  icon text default 'sparkles',
  last_used_at bigint,
  usage_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. SCHEDULED BLOCKS
create table if not exists public.scheduled_blocks (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  block_id text references public.reusable_blocks(id) on delete set null,
  title text not null,
  description text,
  color text not null,
  priority text default 'medium',
  icon text default 'sparkles',
  day_of_week integer not null check (day_of_week between 0 and 6),
  start_minutes integer not null check (start_minutes between 0 and 1439),
  duration integer not null check (duration > 0),
  week_id text not null,
  reminder_minutes integer default 15,
  status text default 'not_started',
  completed_at bigint,
  actual_duration integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. WEEKLY TEMPLATES
create table if not exists public.weekly_templates (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text,
  blocks jsonb not null default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

alter table public.user_preferences enable row level security;
alter table public.categories enable row level security;
alter table public.reusable_blocks enable row level security;
alter table public.scheduled_blocks enable row level security;
alter table public.weekly_templates enable row level security;

-- Policies for user_preferences
create policy "Users can view own preferences" on public.user_preferences
  for select using (auth.uid() = user_id);
create policy "Users can update own preferences" on public.user_preferences
  for insert with check (auth.uid() = user_id);
create policy "Users can modify own preferences" on public.user_preferences
  for update using (auth.uid() = user_id);

-- Policies for categories
create policy "Users can CRUD own categories" on public.categories
  for all using (auth.uid() = user_id);

-- Policies for reusable_blocks
create policy "Users can CRUD own reusable_blocks" on public.reusable_blocks
  for all using (auth.uid() = user_id);

-- Policies for scheduled_blocks
create policy "Users can CRUD own scheduled_blocks" on public.scheduled_blocks
  for all using (auth.uid() = user_id);

-- Policies for weekly_templates
create policy "Users can CRUD own weekly_templates" on public.weekly_templates
  for all using (auth.uid() = user_id);
