-- ============================================================================
-- BlockFlow Versioned Migration: 20261103000000_privacy_hardening.sql
-- ============================================================================
-- Purpose:
-- 1. Eliminate legacy permissive RLS policies (e.g. USING (true) / WITH CHECK (true)).
-- 2. Safely preserve any legacy unowned or deprecated table records without silent deletion.
-- 3. Enforce strict user ownership (user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL).
-- 4. Establish composite primary keys (user_id, id) for all user-owned cloud tables.
-- 5. Revoke anonymous/public permissions; grant least-privilege authenticated access bounded by RLS.
-- 6. Deploy the sovereign remote purge procedure scoped to auth.uid().
-- ============================================================================

-- 0. SAFE LEGACY DATA PRESERVATION TABLE
-- Any legacy row lacking an identifiable authenticated owner is preserved here
-- instead of being silently deleted or assigned to an arbitrary user.
CREATE TABLE IF NOT EXISTS public.legacy_unowned_records_backup (
  backup_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source_table TEXT NOT NULL,
  record_data JSONB NOT NULL,
  backed_up_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Protect the backup table: no public access, viewable only by service_role
ALTER TABLE public.legacy_unowned_records_backup ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.legacy_unowned_records_backup FROM anon, public;

-- 1. SAFE BACKUP FOR OBSOLETE TABLES (activity_library, legacy templates)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'activity_library') THEN
    INSERT INTO public.legacy_unowned_records_backup (source_table, record_data)
    SELECT 'activity_library', to_jsonb(t) FROM public.activity_library t;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'templates') THEN
    INSERT INTO public.legacy_unowned_records_backup (source_table, record_data)
    SELECT 'templates', to_jsonb(t) FROM public.templates t;
  END IF;
END $$;

-- 2. REMOVE LEGACY PERMISSIVE POLICIES
DO $$
BEGIN
  -- Drop obsolete open policies if they exist from early prototypes
  IF EXISTS (SELECT FROM pg_policies WHERE policyname = 'Public access for activity_library') THEN
    DROP POLICY "Public access for activity_library" ON public.activity_library;
  END IF;
  IF EXISTS (SELECT FROM pg_policies WHERE policyname = 'Public access for scheduled_blocks') THEN
    DROP POLICY "Public access for scheduled_blocks" ON public.scheduled_blocks;
  END IF;
  IF EXISTS (SELECT FROM pg_policies WHERE policyname = 'Public access for templates') THEN
    DROP POLICY "Public access for templates" ON public.templates;
  END IF;
  IF EXISTS (SELECT FROM pg_policies WHERE policyname = 'Public access for goals') THEN
    DROP POLICY "Public access for goals" ON public.goals;
  END IF;
END $$;

-- 3. ENSURE ALL 7 AUTHORITATIVE TABLES EXIST WITH PRIVACY-FIRST SPECIFICATION

-- 3.1 USER SYNC PROFILES
CREATE TABLE IF NOT EXISTS public.user_sync_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_given_at TIMESTAMPTZ,
  enabled_categories TEXT[] DEFAULT ARRAY['assignments', 'timetable']::TEXT[],
  e2ee_enabled BOOLEAN DEFAULT false,
  last_synced_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3.2 ASSIGNMENTS
CREATE TABLE IF NOT EXISTS public.assignments (
  id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT DEFAULT '',
  due_date TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'medium',
  estimated_hours NUMERIC DEFAULT 2.0,
  progress_pct NUMERIC DEFAULT 0,
  study_plan JSONB DEFAULT '[]'::JSONB,
  storage_state TEXT DEFAULT 'cloud_synced',
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (user_id, id)
);

-- 3.3 REUSABLE BLOCKS
CREATE TABLE IF NOT EXISTS public.reusable_blocks (
  id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  color TEXT NOT NULL,
  priority TEXT DEFAULT 'medium',
  default_duration INTEGER DEFAULT 60,
  icon TEXT DEFAULT 'sparkles',
  usage_count INTEGER DEFAULT 0,
  storage_state TEXT DEFAULT 'cloud_synced',
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (user_id, id)
);

-- 3.4 SCHEDULED BLOCKS
CREATE TABLE IF NOT EXISTS public.scheduled_blocks (
  id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  block_id TEXT,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  color TEXT NOT NULL,
  priority TEXT DEFAULT 'medium',
  icon TEXT DEFAULT 'sparkles',
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_minutes INTEGER NOT NULL CHECK (start_minutes BETWEEN 0 AND 1439),
  duration INTEGER NOT NULL CHECK (duration > 0),
  week_id TEXT NOT NULL,
  status TEXT DEFAULT 'not_started',
  completed_at BIGINT,
  actual_duration INTEGER,
  storage_state TEXT DEFAULT 'cloud_synced',
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (user_id, id)
);

-- 3.5 WEEKLY TEMPLATES
CREATE TABLE IF NOT EXISTS public.weekly_templates (
  id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  blocks JSONB NOT NULL DEFAULT '[]'::JSONB,
  storage_state TEXT DEFAULT 'cloud_synced',
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (user_id, id)
);

-- 3.6 TASKS
CREATE TABLE IF NOT EXISTS public.tasks (
  id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT DEFAULT 'General',
  priority TEXT DEFAULT 'medium',
  deadline TEXT,
  status TEXT DEFAULT 'backlog',
  estimated_duration INTEGER DEFAULT 30,
  completed_at BIGINT,
  scheduled_block_id TEXT,
  storage_state TEXT DEFAULT 'cloud_synced',
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (user_id, id)
);

-- 3.7 GOALS
CREATE TABLE IF NOT EXISTS public.goals (
  id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT,
  color TEXT DEFAULT '#3B82F6',
  status TEXT DEFAULT 'active',
  target_date TEXT,
  progress_pct NUMERIC DEFAULT 0,
  smart_data JSONB DEFAULT '{}'::JSONB,
  milestones JSONB DEFAULT '[]'::JSONB,
  components JSONB DEFAULT '[]'::JSONB,
  storage_state TEXT DEFAULT 'cloud_synced',
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (user_id, id)
);

-- 4. MIGRATE OR PRESERVE ORPHANED ROWS (NULL user_id)
-- If any existing table had NULL user_id rows, backup then remove from active table
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY['assignments', 'reusable_blocks', 'scheduled_blocks', 'weekly_templates', 'tasks', 'goals']) LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = tbl AND column_name = 'user_id'
    ) THEN
      EXECUTE format(
        'INSERT INTO public.legacy_unowned_records_backup (source_table, record_data) ' ||
        'SELECT %L, to_jsonb(t) FROM public.%I t WHERE t.user_id IS NULL;',
        tbl, tbl
      );
      EXECUTE format('DELETE FROM public.%I WHERE user_id IS NULL;', tbl);
      -- Ensure column is NOT NULL
      EXECUTE format('ALTER TABLE public.%I ALTER COLUMN user_id SET NOT NULL;', tbl);
    END IF;
  END LOOP;
END $$;

-- 5. PERFORMANCE AND RLS INDEXES
CREATE INDEX IF NOT EXISTS idx_assignments_user_updated ON public.assignments(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_reusable_blocks_user_updated ON public.reusable_blocks(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_scheduled_blocks_user_updated ON public.scheduled_blocks(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_weekly_templates_user_updated ON public.weekly_templates(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_user_updated ON public.tasks(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_goals_user_updated ON public.goals(user_id, updated_at DESC);

-- 6. STRICT ROW-LEVEL SECURITY ENFORCEMENT
ALTER TABLE public.user_sync_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reusable_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- Explicit privilege restrictions: anon has zero access, authenticated has least privileges bounded by RLS
REVOKE ALL ON TABLE public.user_sync_profiles, public.assignments, public.reusable_blocks, public.scheduled_blocks, public.weekly_templates, public.tasks, public.goals FROM anon, public;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_sync_profiles, public.assignments, public.reusable_blocks, public.scheduled_blocks, public.weekly_templates, public.tasks, public.goals TO authenticated;

-- Policies for user_sync_profiles
DROP POLICY IF EXISTS "Users can select own user_sync_profiles" ON public.user_sync_profiles;
CREATE POLICY "Users can select own user_sync_profiles" ON public.user_sync_profiles FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own user_sync_profiles" ON public.user_sync_profiles;
CREATE POLICY "Users can insert own user_sync_profiles" ON public.user_sync_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own user_sync_profiles" ON public.user_sync_profiles;
CREATE POLICY "Users can update own user_sync_profiles" ON public.user_sync_profiles FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own user_sync_profiles" ON public.user_sync_profiles;
CREATE POLICY "Users can delete own user_sync_profiles" ON public.user_sync_profiles FOR DELETE USING (auth.uid() = user_id);

-- Policies for assignments
DROP POLICY IF EXISTS "Users can select own assignments" ON public.assignments;
CREATE POLICY "Users can select own assignments" ON public.assignments FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own assignments" ON public.assignments;
CREATE POLICY "Users can insert own assignments" ON public.assignments FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own assignments" ON public.assignments;
CREATE POLICY "Users can update own assignments" ON public.assignments FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own assignments" ON public.assignments;
CREATE POLICY "Users can delete own assignments" ON public.assignments FOR DELETE USING (auth.uid() = user_id);

-- Policies for reusable_blocks
DROP POLICY IF EXISTS "Users can select own reusable_blocks" ON public.reusable_blocks;
CREATE POLICY "Users can select own reusable_blocks" ON public.reusable_blocks FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own reusable_blocks" ON public.reusable_blocks;
CREATE POLICY "Users can insert own reusable_blocks" ON public.reusable_blocks FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own reusable_blocks" ON public.reusable_blocks;
CREATE POLICY "Users can update own reusable_blocks" ON public.reusable_blocks FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own reusable_blocks" ON public.reusable_blocks;
CREATE POLICY "Users can delete own reusable_blocks" ON public.reusable_blocks FOR DELETE USING (auth.uid() = user_id);

-- Policies for scheduled_blocks
DROP POLICY IF EXISTS "Users can select own scheduled_blocks" ON public.scheduled_blocks;
CREATE POLICY "Users can select own scheduled_blocks" ON public.scheduled_blocks FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own scheduled_blocks" ON public.scheduled_blocks;
CREATE POLICY "Users can insert own scheduled_blocks" ON public.scheduled_blocks FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own scheduled_blocks" ON public.scheduled_blocks;
CREATE POLICY "Users can update own scheduled_blocks" ON public.scheduled_blocks FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own scheduled_blocks" ON public.scheduled_blocks;
CREATE POLICY "Users can delete own scheduled_blocks" ON public.scheduled_blocks FOR DELETE USING (auth.uid() = user_id);

-- Policies for weekly_templates
DROP POLICY IF EXISTS "Users can select own weekly_templates" ON public.weekly_templates;
CREATE POLICY "Users can select own weekly_templates" ON public.weekly_templates FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own weekly_templates" ON public.weekly_templates;
CREATE POLICY "Users can insert own weekly_templates" ON public.weekly_templates FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own weekly_templates" ON public.weekly_templates;
CREATE POLICY "Users can update own weekly_templates" ON public.weekly_templates FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own weekly_templates" ON public.weekly_templates;
CREATE POLICY "Users can delete own weekly_templates" ON public.weekly_templates FOR DELETE USING (auth.uid() = user_id);

-- Policies for tasks
DROP POLICY IF EXISTS "Users can select own tasks" ON public.tasks;
CREATE POLICY "Users can select own tasks" ON public.tasks FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own tasks" ON public.tasks;
CREATE POLICY "Users can insert own tasks" ON public.tasks FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own tasks" ON public.tasks;
CREATE POLICY "Users can update own tasks" ON public.tasks FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own tasks" ON public.tasks;
CREATE POLICY "Users can delete own tasks" ON public.tasks FOR DELETE USING (auth.uid() = user_id);

-- Policies for goals
DROP POLICY IF EXISTS "Users can select own goals" ON public.goals;
CREATE POLICY "Users can select own goals" ON public.goals FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own goals" ON public.goals;
CREATE POLICY "Users can insert own goals" ON public.goals FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own goals" ON public.goals;
CREATE POLICY "Users can update own goals" ON public.goals FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own goals" ON public.goals;
CREATE POLICY "Users can delete own goals" ON public.goals FOR DELETE USING (auth.uid() = user_id);

-- 7. SOVEREIGN PURGE STORED PROCEDURE
CREATE OR REPLACE FUNCTION public.purge_all_user_cloud_data()
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  DELETE FROM public.assignments WHERE user_id = auth.uid();
  DELETE FROM public.scheduled_blocks WHERE user_id = auth.uid();
  DELETE FROM public.reusable_blocks WHERE user_id = auth.uid();
  DELETE FROM public.weekly_templates WHERE user_id = auth.uid();
  DELETE FROM public.tasks WHERE user_id = auth.uid();
  DELETE FROM public.goals WHERE user_id = auth.uid();
  DELETE FROM public.user_sync_profiles WHERE user_id = auth.uid();
END;
$$;

REVOKE ALL ON FUNCTION public.purge_all_user_cloud_data() FROM public;
GRANT EXECUTE ON FUNCTION public.purge_all_user_cloud_data() TO authenticated;
