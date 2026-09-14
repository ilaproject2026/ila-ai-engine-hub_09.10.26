# Supabase Course Fetch Blueprint
**Integrating Shared Courses into Another React / Vite Application**

This blueprint provides a production-ready guide to retrieve courses created in the **ILA Course Creator** directly from the shared **Supabase** backend.

---

## 1. Prerequisites & Package Installation

In your target React application, install the official Supabase JavaScript client:

```bash
npm install @supabase/supabase-js
```

---

## 2. Environment Configuration (`.env`)

Add the same Supabase credentials configured in the Course Creator:

```env
VITE_SUPABASE_URL=https://neqpasduluxmgrhacejq.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_HRS1u-a-uv0RoLMA5F7B4Q_ay8nsDe7
```

> **Note:** If using Next.js instead of Vite, use `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

---

## 3. Supabase Client Setup (`src/supabaseClient.ts`)

Create a singleton client instance for your application:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;
```

---

## 4. TypeScript Interface (`src/types/course.ts`)

```typescript
export interface CourseChapter {
  id: string;
  chapterNumber: number;
  title: string;
  summary: string;
  content: string;
  subTopics?: Array<{ id: string; topicNumber: string; title: string }>;
  isCompleted?: boolean;
}

export interface SharedCourse {
  id: string;
  course_id: string;
  course_name?: string;
  title: string;
  subtitle?: string;
  category?: string;
  sub_category?: string;
  delivery_path?: string;
  batch?: string;
  slot?: string;
  batch_slot?: string;
  overview?: string;
  total_chapters: number;
  chapters: CourseChapter[];
  tags?: string[];
  is_favorite?: boolean;
  studied_by?: string;
  target_audience?: string;
  admin_course_data?: any;
  slide_ai_course_data?: any;
  intelli_coach_course_data?: any;
  raw_course_data?: any;
  created_at: string;
  updated_at: string;
}
```

---

## 5. Course Fetching Hook (`src/hooks/useCourses.ts`)

Supports initial load, category filtering, search, and real-time live sync:

```typescript
import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import type { SharedCourse } from '../types/course';

interface UseCoursesOptions {
  category?: string;
  enableRealtime?: boolean;
}

export function useCourses(options?: UseCoursesOptions) {
  const [courses, setCourses] = useState<SharedCourse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCourses = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      setError('Supabase is not configured in .env');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Primary query against library_courses (with fallback to courses view)
      let query = supabase
        .from('library_courses')
        .select('*')
        .order('updated_at', { ascending: false });

      if (options?.category && options.category !== 'all') {
        query = query.eq('category', options.category);
      }

      let { data, error: queryError } = await query;

      // Fallback if table is aliased as courses
      if (queryError && (queryError.code === '42P01' || queryError.message?.includes('does not exist'))) {
        let fallbackQuery = supabase
          .from('courses')
          .select('*')
          .order('updated_at', { ascending: false });

        if (options?.category && options.category !== 'all') {
          fallbackQuery = fallbackQuery.eq('category', options.category);
        }

        const fallbackRes = await fallbackQuery;
        data = fallbackRes.data;
        queryError = fallbackRes.error;
      }

      if (queryError) throw queryError;
      setCourses(data || []);
    } catch (err: any) {
      console.error('[useCourses] Fetch error:', err);
      setError(err?.message || 'Failed to fetch courses from Supabase');
    } finally {
      setLoading(false);
    }
  }, [options?.category]);

  useEffect(() => {
    fetchCourses();

    // Optional: Real-time Live Subscription
    // Automatically re-fetches when a course is generated or updated in the Course Creator
    if (options?.enableRealtime && supabase) {
      const channel = supabase
        .channel('realtime_shared_courses')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'library_courses' },
          () => {
            fetchCourses();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [fetchCourses, options?.enableRealtime]);

  return { courses, loading, error, refetch: fetchCourses };
}
```

---

## 6. Single Course Fetch Hook (`src/hooks/useCourseDetail.ts`)

```typescript
import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import type { SharedCourse } from '../types/course';

export function useCourseDetail(courseId: string | null) {
  const [course, setCourse] = useState<SharedCourse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!courseId) {
      setCourse(null);
      setLoading(false);
      return;
    }

    async function load() {
      if (!isSupabaseConfigured || !supabase) {
        setError('Supabase is not configured');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data, error: qErr } = await supabase
          .from('library_courses')
          .select('*')
          .eq('id', courseId)
          .maybeSingle();

        if (qErr) throw qErr;
        setCourse(data || null);
      } catch (err: any) {
        setError(err?.message || 'Failed to load course details');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [courseId]);

  return { course, loading, error };
}
```

---

## 7. Sample UI Component (`src/components/CourseCatalogSection.tsx`)

```tsx
import React, { useState } from 'react';
import { useCourses } from '../hooks/useCourses';
import type { SharedCourse } from '../types/course';

export default function CourseCatalogSection() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const { courses, loading, error, refetch } = useCourses({
    category: selectedCategory,
    enableRealtime: true, // Auto-refreshes when courses are published in Course Creator
  });

  const filteredCourses = courses.filter((course) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      course.title.toLowerCase().includes(q) ||
      (course.overview && course.overview.toLowerCase().includes(q)) ||
      (course.category && course.category.toLowerCase().includes(q))
    );
  });

  return (
    <section className="max-w-7xl mx-auto px-4 py-8">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Available Courses</h2>
          <p className="text-sm text-slate-500">Live synchronized with ILA Course Creator</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search Input */}
          <input
            type="text"
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            <option value="Computer Science & AI">Computer Science & AI</option>
            <option value="Business & Leadership">Business & Leadership</option>
            <option value="German Language">German Language</option>
            <option value="Healthcare & Clinical Sciences">Healthcare</option>
            <option value="Finance & Quantitative Economics">Finance</option>
          </select>

          {/* Manual Refresh */}
          <button
            onClick={() => refetch()}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12 text-slate-500">
          Loading courses from Supabase cloud...
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm mb-6">
          <strong>Error connecting to Supabase:</strong> {error}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredCourses.length === 0 && (
        <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <p className="text-slate-500">No courses found matching your criteria.</p>
        </div>
      )}

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course: SharedCourse) => (
          <article
            key={course.id}
            className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg transition-all flex flex-col justify-between"
          >
            <div>
              {/* Category & Badge */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
                  {course.category || 'General'}
                </span>
                {course.studied_by && (
                  <span className="text-xs text-slate-400 font-medium">
                    For: {course.studied_by}
                  </span>
                )}
              </div>

              {/* Title & Subtitle */}
              <h3 className="text-lg font-bold text-slate-900 mb-1 leading-snug">
                {course.title}
              </h3>
              {course.subtitle && (
                <p className="text-xs text-slate-500 font-medium mb-3">
                  {course.subtitle}
                </p>
              )}

              {/* Overview */}
              <p className="text-sm text-slate-600 line-clamp-3 mb-4">
                {course.overview || 'Comprehensive structured academic curriculum.'}
              </p>
            </div>

            {/* Footer Metadata & Action */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>
                {course.total_chapters || course.chapters?.length || 0} Modules
              </span>
              <button
                onClick={() => alert(`Selected course: ${course.title}`)}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
              >
                Enroll / View
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
```

---

## 8. Summary Checklist for Your Other App

- [ ] Run `npm install @supabase/supabase-js`.
- [ ] Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to `.env`.
- [ ] Add `src/supabaseClient.ts`.
- [ ] Add `src/hooks/useCourses.ts` and `src/types/course.ts`.
- [ ] Mount `<CourseCatalogSection />` in your course listing page or student dashboard.
