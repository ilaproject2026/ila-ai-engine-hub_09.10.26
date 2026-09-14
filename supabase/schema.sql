-- =========================================================================
-- ILA AI Engine Hub: Supabase Courses Schema
-- Run this script in the Supabase Dashboard -> SQL Editor
-- =========================================================================

-- 1. Create table for library_courses
CREATE TABLE IF NOT EXISTS public.library_courses (
  id TEXT PRIMARY KEY,
  course_id TEXT,
  course_name TEXT,
  title TEXT NOT NULL,
  subtitle TEXT,
  category TEXT,
  sub_category TEXT,
  delivery_path TEXT,
  batch TEXT,
  slot TEXT,
  batch_slot TEXT,
  overview TEXT,
  total_chapters INTEGER DEFAULT 0,
  chapters JSONB DEFAULT '[]'::jsonb,
  tags JSONB DEFAULT '[]'::jsonb,
  is_favorite BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  versions JSONB DEFAULT '[]'::jsonb,
  studied_by TEXT,
  target_audience TEXT,
  admin_course_data JSONB,
  slide_ai_course_data JSONB,
  intelli_coach_course_data JSONB,
  raw_course_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Indexes for fast retrieval and filtering
CREATE INDEX IF NOT EXISTS idx_lib_courses_updated ON public.library_courses(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_lib_courses_category ON public.library_courses(category);
CREATE INDEX IF NOT EXISTS idx_lib_courses_favorite ON public.library_courses(is_favorite DESC);
CREATE INDEX IF NOT EXISTS idx_lib_courses_course_id ON public.library_courses(course_id);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.library_courses ENABLE ROW LEVEL SECURITY;

-- 4. Permissive policies for read, write, update, delete
-- Note: Adjust these according to your institutional authentication requirements
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'library_courses' AND policyname = 'Allow public and service role read'
  ) THEN
    CREATE POLICY "Allow public and service role read" ON public.library_courses
      FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'library_courses' AND policyname = 'Allow public and service role insert'
  ) THEN
    CREATE POLICY "Allow public and service role insert" ON public.library_courses
      FOR INSERT WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'library_courses' AND policyname = 'Allow public and service role update'
  ) THEN
    CREATE POLICY "Allow public and service role update" ON public.library_courses
      FOR UPDATE USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'library_courses' AND policyname = 'Allow public and service role delete'
  ) THEN
    CREATE POLICY "Allow public and service role delete" ON public.library_courses
      FOR DELETE USING (true);
  END IF;
END
$$;

-- 5. Compatibility View for 'courses' (so queries targeting 'courses' resolve transparently)
CREATE OR REPLACE VIEW public.courses AS
  SELECT * FROM public.library_courses;
