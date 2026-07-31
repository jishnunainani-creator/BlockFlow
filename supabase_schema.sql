-- ========================================================
-- BLOCKFLOW SUPABASE POSTGRESQL DATABASE SCHEMA & POLICIES
-- Run this script in Supabase Dashboard -> SQL Editor
-- Project: https://supabase.com/dashboard/project/wdbvwtolhfjmkogxxeyy
-- ========================================================

-- 1. Activity Library Table
CREATE TABLE IF NOT EXISTS public.activity_library (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  block_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6366F1',
  priority TEXT DEFAULT 'medium',
  default_duration INT DEFAULT 60,
  icon TEXT DEFAULT 'sparkles',
  usage_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unq_user_block UNIQUE(user_id, block_id)
);

-- 2. Scheduled Blocks Table
CREATE TABLE IF NOT EXISTS public.scheduled_blocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  scheduled_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6366F1',
  priority TEXT DEFAULT 'medium',
  day_of_week INT NOT NULL,
  start_minutes INT NOT NULL,
  duration INT NOT NULL,
  week_id TEXT NOT NULL,
  reminder_minutes INT DEFAULT 0,
  status TEXT DEFAULT 'not_started',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unq_user_scheduled UNIQUE(user_id, scheduled_id)
);

-- 3. Routine Templates Table
CREATE TABLE IF NOT EXISTS public.templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  template_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  blocks JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unq_user_template UNIQUE(user_id, template_id)
);

-- 4. Goals & Outcomes Table
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  goal_id TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT DEFAULT 'Career',
  deadline TEXT,
  target_hours_per_day NUMERIC DEFAULT 2.0,
  progress_pct INT DEFAULT 0,
  color TEXT DEFAULT '#8B5CF6',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unq_user_goal UNIQUE(user_id, goal_id)
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.activity_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- Drop previous policies if present
DROP POLICY IF EXISTS "Users can manage their activity_library" ON public.activity_library;
DROP POLICY IF EXISTS "Public access for activity_library" ON public.activity_library;
DROP POLICY IF EXISTS "Users can manage their scheduled_blocks" ON public.scheduled_blocks;
DROP POLICY IF EXISTS "Public access for scheduled_blocks" ON public.scheduled_blocks;
DROP POLICY IF EXISTS "Users can manage their templates" ON public.templates;
DROP POLICY IF EXISTS "Public access for templates" ON public.templates;
DROP POLICY IF EXISTS "Users can manage their goals" ON public.goals;
DROP POLICY IF EXISTS "Public access for goals" ON public.goals;

-- Permissive Row Level Security Policies (Allows sync without RLS 42501 error)
CREATE POLICY "Public access for activity_library" ON public.activity_library FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access for scheduled_blocks" ON public.scheduled_blocks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access for templates" ON public.templates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access for goals" ON public.goals FOR ALL USING (true) WITH CHECK (true);
