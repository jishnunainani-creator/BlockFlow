-- ============================================================================
-- BlockFlow Versioned Migration: 20261125_user_feedback.sql
-- ============================================================================
-- Purpose:
-- 1. Create `user_feedback` table synced with Supabase for user bug reports,
--    feature requests, UI/UX feedback, and ratings.
-- 2. Create `feedback_admins` table so the app owner can view & triage
--    feedback from ALL users in-app or via Supabase Dashboard.
-- 3. Enforce strict Row-Level Security (RLS).
-- ============================================================================

-- 1. ADMIN ALLOWLIST TABLE (Owner emails who can view & triage all feedback)
CREATE TABLE IF NOT EXISTS public.feedback_admins (
  email TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.feedback_admins ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.feedback_admins FROM anon, public;
GRANT SELECT ON TABLE public.feedback_admins TO authenticated;

DROP POLICY IF EXISTS "Authenticated users can check own admin status" ON public.feedback_admins;
CREATE POLICY "Authenticated users can check own admin status"
  ON public.feedback_admins
  FOR SELECT
  USING (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

-- 2. USER FEEDBACK TABLE
CREATE TABLE IF NOT EXISTS public.user_feedback (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  user_email TEXT NOT NULL DEFAULT 'Anonymous',
  category TEXT NOT NULL CHECK (category IN ('bug', 'feature', 'ui_ux', 'performance', 'general')),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  page_context TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_review', 'planned', 'resolved')),
  admin_note TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. INDEXES
CREATE INDEX IF NOT EXISTS idx_user_feedback_user_created ON public.user_feedback(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_feedback_status_created ON public.user_feedback(status, created_at DESC);

-- 4. ROW-LEVEL SECURITY (RLS)
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;

-- Revoke anonymous access; allow authenticated users bounded by RLS
REVOKE ALL ON TABLE public.user_feedback FROM anon, public;
GRANT SELECT, INSERT, UPDATE ON TABLE public.user_feedback TO authenticated;

-- Users can insert their own feedback
DROP POLICY IF EXISTS "Users can insert own feedback" ON public.user_feedback;
CREATE POLICY "Users can insert own feedback"
  ON public.user_feedback
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own feedback; Admins can view ALL users' feedback
DROP POLICY IF EXISTS "Users see own feedback and admins see all" ON public.user_feedback;
CREATE POLICY "Users see own feedback and admins see all"
  ON public.user_feedback
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.feedback_admins a
      WHERE lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  );

-- Only Admins can update feedback status & admin_note
DROP POLICY IF EXISTS "Admins can update feedback status and notes" ON public.user_feedback;
CREATE POLICY "Admins can update feedback status and notes"
  ON public.user_feedback
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.feedback_admins a
      WHERE lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.feedback_admins a
      WHERE lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  );
