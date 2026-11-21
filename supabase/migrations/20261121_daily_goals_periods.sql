-- ============================================================================
-- BlockFlow Versioned Migration: 20261121_daily_goals_periods.sql
-- ============================================================================
-- Purpose:
-- 1. Create tables for Daily Goals, Plan Periods, and Day Reflections.
-- 2. Enforce strict user ownership (user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL).
-- 3. Establish composite primary keys for user-scoped cloud storage.
-- 4. Enable Row-Level Security (RLS) with strict owner-only policies (auth.uid() = user_id).
-- 5. Revoke anonymous access; grant least-privilege authenticated access bounded by RLS.
-- ============================================================================

-- 1. PLAN PERIODS TABLE
CREATE TABLE IF NOT EXISTS public.plan_periods (
  id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
  name TEXT NOT NULL,
  start_date TEXT NOT NULL, -- YYYY-MM-DD
  end_date TEXT NOT NULL,   -- YYYY-MM-DD
  color TEXT DEFAULT 'indigo',
  kind TEXT DEFAULT 'custom', -- exam | sprint | custom
  milestones JSONB DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (user_id, id)
);

-- 2. DAILY GOALS TABLE
CREATE TABLE IF NOT EXISTS public.daily_goals (
  id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
  date TEXT NOT NULL, -- YYYY-MM-DD
  period_id TEXT,
  title TEXT NOT NULL,
  notes TEXT,
  color TEXT DEFAULT 'indigo',
  priority TEXT DEFAULT 'medium', -- high | medium | low
  is_must_do BOOLEAN DEFAULT false,
  start_time TEXT, -- HH:mm
  end_time TEXT,   -- HH:mm
  estimate_min INTEGER,
  actual_min INTEGER,
  measure JSONB DEFAULT '{"type":"check","current":0}'::JSONB,
  status TEXT DEFAULT 'planned', -- planned | in_progress | done | partial | skipped | carried
  carried_from_id TEXT,
  carry_count INTEGER DEFAULT 0,
  linked_block_id TEXT,
  linked_assignment_id TEXT,
  linked_smart_goal_id TEXT,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  completed_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, id)
);

-- 3. DAY REFLECTIONS TABLE
CREATE TABLE IF NOT EXISTS public.day_reflections (
  date TEXT NOT NULL, -- YYYY-MM-DD
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
  energy INTEGER NOT NULL CHECK (energy >= 1 AND energy <= 5),
  reason_tags JSONB DEFAULT '{}'::JSONB,
  win TEXT DEFAULT '',
  tomorrow_first_step TEXT DEFAULT '',
  completed_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (user_id, date)
);

-- 4. PERFORMANCE AND RLS INDEXES
CREATE INDEX IF NOT EXISTS idx_plan_periods_user_updated ON public.plan_periods(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_daily_goals_user_date ON public.daily_goals(user_id, date);
CREATE INDEX IF NOT EXISTS idx_daily_goals_user_updated ON public.daily_goals(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_day_reflections_user_date ON public.day_reflections(user_id, date);

-- 5. STRICT ROW-LEVEL SECURITY ENFORCEMENT
ALTER TABLE public.plan_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.day_reflections ENABLE ROW LEVEL SECURITY;

-- Revoke anonymous access completely
REVOKE ALL ON TABLE public.plan_periods, public.daily_goals, public.day_reflections FROM anon, public;

-- Grant least-privilege operations to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.plan_periods, public.daily_goals, public.day_reflections TO authenticated;

-- Strict Owner-Only Policies for plan_periods
DROP POLICY IF EXISTS "Users can select own plan_periods" ON public.plan_periods;
CREATE POLICY "Users can select own plan_periods" ON public.plan_periods FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own plan_periods" ON public.plan_periods;
CREATE POLICY "Users can insert own plan_periods" ON public.plan_periods FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own plan_periods" ON public.plan_periods;
CREATE POLICY "Users can update own plan_periods" ON public.plan_periods FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own plan_periods" ON public.plan_periods;
CREATE POLICY "Users can delete own plan_periods" ON public.plan_periods FOR DELETE USING (auth.uid() = user_id);

-- Strict Owner-Only Policies for daily_goals
DROP POLICY IF EXISTS "Users can select own daily_goals" ON public.daily_goals;
CREATE POLICY "Users can select own daily_goals" ON public.daily_goals FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own daily_goals" ON public.daily_goals;
CREATE POLICY "Users can insert own daily_goals" ON public.daily_goals FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own daily_goals" ON public.daily_goals;
CREATE POLICY "Users can update own daily_goals" ON public.daily_goals FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own daily_goals" ON public.daily_goals;
CREATE POLICY "Users can delete own daily_goals" ON public.daily_goals FOR DELETE USING (auth.uid() = user_id);

-- Strict Owner-Only Policies for day_reflections
DROP POLICY IF EXISTS "Users can select own day_reflections" ON public.day_reflections;
CREATE POLICY "Users can select own day_reflections" ON public.day_reflections FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own day_reflections" ON public.day_reflections;
CREATE POLICY "Users can insert own day_reflections" ON public.day_reflections FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own day_reflections" ON public.day_reflections;
CREATE POLICY "Users can update own day_reflections" ON public.day_reflections FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own day_reflections" ON public.day_reflections;
CREATE POLICY "Users can delete own day_reflections" ON public.day_reflections FOR DELETE USING (auth.uid() = user_id);
