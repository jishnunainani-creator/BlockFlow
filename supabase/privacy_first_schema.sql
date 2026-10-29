-- ============================================================================
-- BlockFlow Privacy-First, Local-First Architecture Schema
-- ============================================================================
-- 
-- PRIVACY MANIFESTO & THREAT MODEL DISCLOSURE:
-- 1. LOCAL-FIRST DEFAULT:
--    All productivity records (Tasks, SMART Goals, Scheduled Blocks, Library Items,
--    Daily Reflections, Focus Sessions) are created and persisted on the user's
--    device inside client-side IndexedDB as 'local_only'.
--
-- 2. NO SILENT UPLOADS:
--    Signing into Supabase Auth authenticates user identity but DOES NOT trigger
--    automatic data migration. Synchronization requires explicit consent via the
--    Privacy & Sync Consent modal.
--
-- 3. SELECTIVE GRANULARITY:
--    Users choose which categories or individual records to synchronize.
--    Sensitive personal items (Goals, Reflections, Focus Logs, Personal Tasks)
--    remain on-device by default, while collaborative or institutional records
--    (e.g., Course Assignments or Timetable blocks) can be selectively synced.
--
-- 4. SERVER STORAGE & ENCRYPTION BOUNDARY:
--    - 'local_only': Stored only on device. Never transmitted to Supabase.
--    - 'cloud_synced': Transmitted to Supabase PostgreSQL, protected by RLS.
--    - 'encrypted_cloud': Reserved roadmap state for client-side E2EE.
--    * TRANSPARENCY NOTICE: Row Level Security (RLS) protects data between users,
--      but database operators with backend admin privileges can inspect plaintext
--      tables unless client-side end-to-end encryption is used. Users are advised
--      to keep strictly private records classified as 'local_only'.
--
-- 5. SOVEREIGN PURGE:
--    Users can delete all remote copies at any time while preserving local records intact.
--
-- 6. TARGET ENVIRONMENT & DDL BEHAVIOR NOTICE:
--    This migration is intended for a fresh database or clean Supabase project.
--    IMPORTANT: In PostgreSQL, 'CREATE TABLE IF NOT EXISTS' will skip table creation
--    if a table with that name already exists; it DOES NOT alter existing tables to
--    add missing columns, alter types, or update primary keys. If your Supabase
--    database already contains legacy versions of these tables with conflicting schemas,
--    they must be inspected and aligned before running this script.
-- ============================================================================

-- Enable UUID Extension
create extension if not exists "uuid-ossp";

-- 1. USER SYNC PROFILES & AUDIT METADATA
create table if not exists public.user_sync_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  consent_given_at timestamp with time zone,
  enabled_categories text[] default array['assignments', 'timetable']::text[],
  e2ee_enabled boolean default false,
  last_synced_at timestamp with time zone,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. ASSIGNMENTS TABLE (Selective Sync Candidate)
create table if not exists public.assignments (
  id text not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  subject text not null,
  description text default '',
  due_date timestamp with time zone not null,
  status text default 'pending',
  priority text default 'medium',
  estimated_hours numeric default 2.0,
  progress_pct numeric default 0,
  study_plan jsonb default '[]'::jsonb,
  storage_state text default 'cloud_synced',
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, id)
);

-- 3. REUSABLE LIBRARY BLOCKS TABLE (Selective Sync Candidate)
create table if not exists public.reusable_blocks (
  id text not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text default '',
  color text not null,
  priority text default 'medium',
  default_duration integer default 60,
  icon text default 'sparkles',
  usage_count integer default 0,
  storage_state text default 'cloud_synced',
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, id)
);

-- 4. SCHEDULED BLOCKS TABLE (Selective Sync Candidate)
create table if not exists public.scheduled_blocks (
  id text not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  block_id text,
  title text not null,
  description text default '',
  color text not null,
  priority text default 'medium',
  icon text default 'sparkles',
  day_of_week integer not null check (day_of_week between 0 and 6),
  start_minutes integer not null check (start_minutes between 0 and 1439),
  duration integer not null check (duration > 0),
  week_id text not null,
  status text default 'not_started',
  completed_at bigint,
  actual_duration integer,
  storage_state text default 'cloud_synced',
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, id)
);

-- 5. WEEKLY TEMPLATES TABLE (Selective Sync Candidate)
create table if not exists public.weekly_templates (
  id text not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text default '',
  blocks jsonb not null default '[]'::jsonb,
  storage_state text default 'cloud_synced',
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, id)
);

-- 6. TASKS TABLE (Selective Sync - Only user-approved non-private tasks)
create table if not exists public.tasks (
  id text not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text default '',
  category text default 'General',
  priority text default 'medium',
  deadline text,
  status text default 'backlog',
  estimated_duration integer default 30,
  completed_at bigint,
  scheduled_block_id text,
  storage_state text default 'cloud_synced',
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, id)
);

-- 7. SMART GOALS TABLE (Selective Sync - Defaults to local_only on client)
create table if not exists public.goals (
  id text not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text default '',
  category text,
  color text default '#3B82F6',
  status text default 'active',
  target_date text,
  progress_pct numeric default 0,
  smart_data jsonb default '{}'::jsonb,
  milestones jsonb default '[]'::jsonb,
  components jsonb default '[]'::jsonb,
  storage_state text default 'cloud_synced',
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, id)
);

-- ============================================================================
-- PERFORMANCE & RLS QUERY INDEXES
-- ============================================================================
create index if not exists idx_assignments_user_updated on public.assignments(user_id, updated_at desc);
create index if not exists idx_reusable_blocks_user_updated on public.reusable_blocks(user_id, updated_at desc);
create index if not exists idx_scheduled_blocks_user_updated on public.scheduled_blocks(user_id, updated_at desc);
create index if not exists idx_weekly_templates_user_updated on public.weekly_templates(user_id, updated_at desc);
create index if not exists idx_tasks_user_updated on public.tasks(user_id, updated_at desc);
create index if not exists idx_goals_user_updated on public.goals(user_id, updated_at desc);

-- ============================================================================
-- STRICT ROW-LEVEL SECURITY (RLS) POLICIES & PRIVILEGES
-- Enforces:
-- 1. Explicit user ownership on SELECT, INSERT, UPDATE, DELETE.
-- 2. Inability to reassign user_id to any other account.
-- 3. Anonymous users have zero read or write access.
-- 4. Repeatable migration: DROP POLICY IF EXISTS ensures idempotent execution.
-- ============================================================================

alter table public.user_sync_profiles enable row level security;
alter table public.assignments enable row level security;
alter table public.reusable_blocks enable row level security;
alter table public.scheduled_blocks enable row level security;
alter table public.weekly_templates enable row level security;
alter table public.tasks enable row level security;
alter table public.goals enable row level security;

-- Explicit privilege restrictions: anon has zero access, authenticated has least privileges bounded by RLS
revoke all on table public.user_sync_profiles, public.assignments, public.reusable_blocks, public.scheduled_blocks, public.weekly_templates, public.tasks, public.goals from anon, public;
grant select, insert, update, delete on table public.user_sync_profiles, public.assignments, public.reusable_blocks, public.scheduled_blocks, public.weekly_templates, public.tasks, public.goals to authenticated;

-- user_sync_profiles
drop policy if exists "Users can select own user_sync_profiles" on public.user_sync_profiles;
create policy "Users can select own user_sync_profiles" on public.user_sync_profiles for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own user_sync_profiles" on public.user_sync_profiles;
create policy "Users can insert own user_sync_profiles" on public.user_sync_profiles for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own user_sync_profiles" on public.user_sync_profiles;
create policy "Users can update own user_sync_profiles" on public.user_sync_profiles for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can delete own user_sync_profiles" on public.user_sync_profiles;
create policy "Users can delete own user_sync_profiles" on public.user_sync_profiles for delete using (auth.uid() = user_id);

-- assignments
drop policy if exists "Users can select own assignments" on public.assignments;
create policy "Users can select own assignments" on public.assignments for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own assignments" on public.assignments;
create policy "Users can insert own assignments" on public.assignments for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own assignments" on public.assignments;
create policy "Users can update own assignments" on public.assignments for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can delete own assignments" on public.assignments;
create policy "Users can delete own assignments" on public.assignments for delete using (auth.uid() = user_id);

-- reusable_blocks
drop policy if exists "Users can select own reusable_blocks" on public.reusable_blocks;
create policy "Users can select own reusable_blocks" on public.reusable_blocks for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own reusable_blocks" on public.reusable_blocks;
create policy "Users can insert own reusable_blocks" on public.reusable_blocks for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own reusable_blocks" on public.reusable_blocks;
create policy "Users can update own reusable_blocks" on public.reusable_blocks for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can delete own reusable_blocks" on public.reusable_blocks;
create policy "Users can delete own reusable_blocks" on public.reusable_blocks for delete using (auth.uid() = user_id);

-- scheduled_blocks
drop policy if exists "Users can select own scheduled_blocks" on public.scheduled_blocks;
create policy "Users can select own scheduled_blocks" on public.scheduled_blocks for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own scheduled_blocks" on public.scheduled_blocks;
create policy "Users can insert own scheduled_blocks" on public.scheduled_blocks for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own scheduled_blocks" on public.scheduled_blocks;
create policy "Users can update own scheduled_blocks" on public.scheduled_blocks for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can delete own scheduled_blocks" on public.scheduled_blocks;
create policy "Users can delete own scheduled_blocks" on public.scheduled_blocks for delete using (auth.uid() = user_id);

-- weekly_templates
drop policy if exists "Users can select own weekly_templates" on public.weekly_templates;
create policy "Users can select own weekly_templates" on public.weekly_templates for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own weekly_templates" on public.weekly_templates;
create policy "Users can insert own weekly_templates" on public.weekly_templates for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own weekly_templates" on public.weekly_templates;
create policy "Users can update own weekly_templates" on public.weekly_templates for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can delete own weekly_templates" on public.weekly_templates;
create policy "Users can delete own weekly_templates" on public.weekly_templates for delete using (auth.uid() = user_id);

-- tasks
drop policy if exists "Users can select own tasks" on public.tasks;
create policy "Users can select own tasks" on public.tasks for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own tasks" on public.tasks;
create policy "Users can insert own tasks" on public.tasks for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own tasks" on public.tasks;
create policy "Users can update own tasks" on public.tasks for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can delete own tasks" on public.tasks;
create policy "Users can delete own tasks" on public.tasks for delete using (auth.uid() = user_id);

-- goals
drop policy if exists "Users can select own goals" on public.goals;
create policy "Users can select own goals" on public.goals for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own goals" on public.goals;
create policy "Users can insert own goals" on public.goals for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own goals" on public.goals;
create policy "Users can update own goals" on public.goals for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can delete own goals" on public.goals;
create policy "Users can delete own goals" on public.goals for delete using (auth.uid() = user_id);

-- ============================================================================
-- REMOTE PURGE STORED PROCEDURE (SOVEREIGN DATA REMOVAL)
-- Deletes all cloud data for the calling user in a single transaction.
-- Strictly scoped to auth.uid() with fixed search_path to prevent hijacking.
-- ============================================================================
create or replace function public.purge_all_user_cloud_data()
returns void
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  -- Deletion ordered to respect dependencies
  delete from public.assignments where user_id = auth.uid();
  delete from public.scheduled_blocks where user_id = auth.uid();
  delete from public.reusable_blocks where user_id = auth.uid();
  delete from public.weekly_templates where user_id = auth.uid();
  delete from public.tasks where user_id = auth.uid();
  delete from public.goals where user_id = auth.uid();
  delete from public.user_sync_profiles where user_id = auth.uid();
end;
$$;

-- Restrict function execution to authenticated callers only
revoke all on function public.purge_all_user_cloud_data() from public;
grant execute on function public.purge_all_user_cloud_data() to authenticated;
