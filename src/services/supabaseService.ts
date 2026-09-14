import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { LibraryCourse } from './dbService';

// 1. Read Supabase configuration from Vite environment variables
const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const rawAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const rawServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

export const isSupabaseConfigured: boolean = Boolean(
  rawSupabaseUrl &&
    rawAnonKey &&
    !rawSupabaseUrl.includes('placeholder') &&
    !rawSupabaseUrl.includes('your-project') &&
    rawSupabaseUrl.startsWith('http')
);

// Fallback dummy to prevent module crash if unconfigured
const safeUrl = isSupabaseConfigured ? rawSupabaseUrl.trim() : 'https://placeholder.supabase.co';
const safeAnonKey = isSupabaseConfigured ? rawAnonKey.trim() : 'placeholder-anon-key';
const safeServiceKey = rawServiceKey ? rawServiceKey.trim() : safeAnonKey;

// Client instances
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(safeUrl, safeAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

export const supabaseAdmin: SupabaseClient | null =
  isSupabaseConfigured && rawServiceKey
    ? createClient(safeUrl, safeServiceKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      })
    : supabase;

export interface SupabaseHealthStatus {
  isConfigured: boolean;
  isConnected: boolean;
  url: string;
  latencyMs?: number;
  lastChecked: number;
  error?: string;
}

let cachedHealth: SupabaseHealthStatus = {
  isConfigured: isSupabaseConfigured,
  isConnected: false,
  url: isSupabaseConfigured ? safeUrl : '',
  lastChecked: 0,
};

/**
 * Checks live connection to the Supabase backend.
 */
export async function checkSupabaseHealth(forceRefresh = false): Promise<SupabaseHealthStatus> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      isConfigured: false,
      isConnected: false,
      url: '',
      lastChecked: Date.now(),
      error: 'Supabase URL or Anon Key is missing in environment variables (.env)',
    };
  }

  // Use cached result if checked within the last 15 seconds
  if (!forceRefresh && cachedHealth.lastChecked > Date.now() - 15000) {
    return cachedHealth;
  }

  const start = Date.now();
  try {
    // Attempt a light query (limit 1) on library_courses or courses
    const { error } = await supabase
      .from('library_courses')
      .select('id')
      .limit(1);

    const latencyMs = Date.now() - start;

    if (error) {
      // If table does not exist yet (PGRST204 or 42P01), connection itself is still alive
      if (
        error.code === '42P01' ||
        error.message?.includes('does not exist') ||
        error.message?.includes('not found')
      ) {
        cachedHealth = {
          isConfigured: true,
          isConnected: true,
          url: safeUrl,
          latencyMs,
          lastChecked: Date.now(),
          error: 'Connected to Supabase, but "library_courses" table is not created yet. Please run supabase/schema.sql in the SQL Editor.',
        };
        return cachedHealth;
      }

      cachedHealth = {
        isConfigured: true,
        isConnected: false,
        url: safeUrl,
        latencyMs,
        lastChecked: Date.now(),
        error: error.message || 'Supabase query error',
      };
      return cachedHealth;
    }

    cachedHealth = {
      isConfigured: true,
      isConnected: true,
      url: safeUrl,
      latencyMs,
      lastChecked: Date.now(),
    };
    return cachedHealth;
  } catch (err: any) {
    const latencyMs = Date.now() - start;
    const msg = err?.message || 'Network / DNS resolution error';
    cachedHealth = {
      isConfigured: true,
      isConnected: false,
      url: safeUrl,
      latencyMs,
      lastChecked: Date.now(),
      error: msg,
    };
    return cachedHealth;
  }
}

/**
 * Serializes a LibraryCourse into a Supabase record matching the database schema.
 */
export function mapLibraryCourseToSupabaseRow(course: LibraryCourse): Record<string, any> {
  const nowIso = new Date().toISOString();
  return {
    id: course.id,
    course_id: course.courseId || course.id,
    course_name: course.courseName || course.title,
    title: course.title || 'Enterprise Masterclass',
    subtitle: course.subtitle || '',
    category: course.category || 'Enterprise Education',
    sub_category: course.subCategory || '',
    delivery_path: course.deliveryPath || '',
    batch: course.batch || '',
    slot: course.slot || '',
    batch_slot: course.batchSlot || '',
    overview: course.overview || '',
    total_chapters: course.totalChapters || (course.chapters ? course.chapters.length : 0),
    chapters: course.chapters || [],
    tags: course.tags || [],
    is_favorite: Boolean(course.isFavorite),
    metadata: course.metadata || {},
    versions: course.versions || [],
    studied_by: course.studiedBy || course.targetAudience || '',
    target_audience: course.targetAudience || course.studiedBy || '',
    admin_course_data: course.adminCourseData || null,
    slide_ai_course_data: course.slideAiCourseData || null,
    intelli_coach_course_data: course.intelliCoachCourseData || null,
    raw_course_data: course, // Complete source snapshot to guarantee zero data loss
    updated_at: course.updatedAt ? new Date(course.updatedAt).toISOString() : nowIso,
    created_at: course.createdAt ? new Date(course.createdAt).toISOString() : nowIso,
  };
}

/**
 * Reconstitutes a LibraryCourse from a Supabase row.
 */
export function mapSupabaseRowToLibraryCourse(row: any): LibraryCourse {
  // If complete raw snapshot exists, merge it with top-level fields
  const base = row.raw_course_data && typeof row.raw_course_data === 'object' ? row.raw_course_data : {};

  return {
    ...base,
    id: row.id,
    courseId: row.course_id || base.courseId || row.id,
    courseName: row.course_name || base.courseName || row.title,
    title: row.title || base.title || 'Enterprise Masterclass',
    subtitle: row.subtitle || base.subtitle || '',
    category: row.category || base.category || 'Enterprise Education',
    subCategory: row.sub_category || base.subCategory || '',
    deliveryPath: row.delivery_path || base.deliveryPath || '',
    batch: row.batch || base.batch || '',
    slot: row.slot || base.slot || '',
    batchSlot: row.batch_slot || base.batchSlot || '',
    overview: row.overview || base.overview || '',
    totalChapters: Number(row.total_chapters) || (Array.isArray(row.chapters) ? row.chapters.length : base.totalChapters || 0),
    chapters: Array.isArray(row.chapters) ? row.chapters : base.chapters || [],
    tags: Array.isArray(row.tags) ? row.tags : base.tags || [],
    isFavorite: Boolean(row.is_favorite ?? base.isFavorite),
    metadata: row.metadata || base.metadata || {},
    versions: Array.isArray(row.versions) ? row.versions : base.versions || [],
    studiedBy: row.studied_by || base.studiedBy || row.target_audience,
    targetAudience: row.target_audience || base.targetAudience || row.studied_by,
    adminCourseData: row.admin_course_data || base.adminCourseData,
    slideAiCourseData: row.slide_ai_course_data || base.slideAiCourseData,
    intelliCoachCourseData: row.intelli_coach_course_data || base.intelliCoachCourseData,
    createdAt: row.created_at ? new Date(row.created_at).getTime() : base.createdAt || Date.now(),
    updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : base.updatedAt || Date.now(),
  };
}

/**
 * Saves or updates a created course in the Supabase backend.
 * Non-blocking: will never throw or crash caller if Supabase is offline or paused.
 */
export async function saveCourseToSupabase(
  course: LibraryCourse
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Supabase credentials not configured' };
  }

  const client = supabaseAdmin || supabase;
  if (!client) {
    return { success: false, error: 'Supabase client is not available' };
  }

  const row = mapLibraryCourseToSupabaseRow(course);

  try {
    // 1. Primary target table: library_courses
    const { error: libErr } = await client
      .from('library_courses')
      .upsert(row, { onConflict: 'id' });

    if (!libErr) {
      notifySyncStatus('synced', course.id);
      return { success: true };
    }

    // 2. If library_courses failed because table does not exist, try 'courses' table fallback
    if (libErr.code === '42P01' || libErr.message?.includes('does not exist')) {
      const { error: courseErr } = await client
        .from('courses')
        .upsert(row, { onConflict: 'id' });

      if (!courseErr) {
        notifySyncStatus('synced', course.id);
        return { success: true };
      }
      console.warn('[SupabaseService] Fallback table save failed:', courseErr);
      notifySyncStatus('error', course.id, courseErr.message);
      return { success: false, error: courseErr.message };
    }

    console.warn('[SupabaseService] Save to library_courses failed:', libErr);
    notifySyncStatus('error', course.id, libErr.message);
    return { success: false, error: libErr.message };
  } catch (err: any) {
    const errorMsg = err?.message || 'Network / Supabase error during course save';
    console.warn('[SupabaseService] Exception saving course to Supabase:', errorMsg);
    notifySyncStatus('error', course.id, errorMsg);
    return { success: false, error: errorMsg };
  }
}

/**
 * Fetches all courses stored in Supabase.
 */
export async function getAllCoursesFromSupabase(): Promise<LibraryCourse[]> {
  if (!isSupabaseConfigured) return [];
  const client = supabaseAdmin || supabase;
  if (!client) return [];

  try {
    // Try library_courses first
    let res = await client
      .from('library_courses')
      .select('*')
      .order('updated_at', { ascending: false });

    if (res.error && (res.error.code === '42P01' || res.error.message?.includes('does not exist'))) {
      res = await client
        .from('courses')
        .select('*')
        .order('updated_at', { ascending: false });
    }

    if (res.error || !res.data) {
      return [];
    }

    return res.data.map(mapSupabaseRowToLibraryCourse);
  } catch (err) {
    console.warn('[SupabaseService] Failed to load courses from Supabase:', err);
    return [];
  }
}

/**
 * Fetches a single course by ID from Supabase.
 */
export async function getCourseFromSupabase(id: string): Promise<LibraryCourse | null> {
  if (!isSupabaseConfigured) return null;
  const client = supabaseAdmin || supabase;
  if (!client) return null;

  try {
    let res = await client
      .from('library_courses')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (res.error && (res.error.code === '42P01' || res.error.message?.includes('does not exist'))) {
      res = await client
        .from('courses')
        .select('*')
        .eq('id', id)
        .maybeSingle();
    }

    if (res.error || !res.data) return null;
    return mapSupabaseRowToLibraryCourse(res.data);
  } catch {
    return null;
  }
}

/**
 * Deletes a course from Supabase by ID.
 */
export async function deleteCourseFromSupabase(id: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  const client = supabaseAdmin || supabase;
  if (!client) return false;

  try {
    await client.from('library_courses').delete().eq('id', id);
    await client.from('courses').delete().eq('id', id);
    return true;
  } catch {
    return false;
  }
}

/**
 * Bulk syncs an array of local courses into Supabase.
 */
export async function syncAllCoursesToSupabase(
  courses: LibraryCourse[]
): Promise<{ synced: number; failed: number; error?: string }> {
  if (!isSupabaseConfigured) {
    return { synced: 0, failed: courses.length, error: 'Supabase credentials not configured in .env' };
  }
  if (!courses.length) {
    return { synced: 0, failed: 0 };
  }

  notifySyncStatus('syncing');

  let synced = 0;
  let failed = 0;
  let lastError = '';

  for (const course of courses) {
    const res = await saveCourseToSupabase(course);
    if (res.success) {
      synced++;
    } else {
      failed++;
      if (res.error) lastError = res.error;
    }
  }

  notifySyncStatus(failed === 0 ? 'synced' : 'error', undefined, lastError);
  return { synced, failed, error: lastError || undefined };
}

/**
 * Internal helper to broadcast synchronization events to UI listeners.
 */
function notifySyncStatus(status: 'synced' | 'error' | 'syncing', courseId?: string, message?: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('ila_supabase_sync_status', {
        detail: {
          status,
          courseId,
          message,
          timestamp: Date.now(),
        },
      })
    );
  }
}
