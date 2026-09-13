import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_FILE_PATH = path.join(DATA_DIR, 'course_creator.db');
const JSON_STORE_PATH = path.join(DATA_DIR, 'permanent_courses_store.json');
const PERSISTENCE_STORE_PATH = path.join(DATA_DIR, 'app_persistence_store.json');

let dbInstance = null;

export function getDatabase() {
  if (!dbInstance) {
    dbInstance = new DatabaseSync(DB_FILE_PATH);
    initSchema(dbInstance);
  }
  return dbInstance;
}

export function getDatabasePath() {
  return DB_FILE_PATH;
}

export function getPermanentJsonPath() {
  return JSON_STORE_PATH;
}

export function getPersistenceStorePath() {
  return PERSISTENCE_STORE_PATH;
}

function initSchema(db) {
  // Optimize SQLite PRAGMAs for concurrency and performance
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS chat_sessions (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      is_pinned INTEGER DEFAULT 0,
      course_plan TEXT,
      attached_documents TEXT,
      messages TEXT,
      autonomous_plan TEXT,
      product_type TEXT,
      product_params TEXT,
      studied_by TEXT,
      is_permanent INTEGER DEFAULT 0,
      locked INTEGER DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_updated ON chat_sessions(updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_sessions_pinned ON chat_sessions(is_pinned DESC, updated_at DESC);

    CREATE TABLE IF NOT EXISTS library_courses (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      subtitle TEXT,
      category TEXT,
      overview TEXT,
      total_chapters INTEGER DEFAULT 0,
      chapters TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      source_session_id TEXT,
      tags TEXT,
      is_favorite INTEGER DEFAULT 0,
      metadata TEXT,
      versions TEXT,
      studied_by TEXT,
      target_audience TEXT,
      is_permanent INTEGER DEFAULT 0,
      locked INTEGER DEFAULT 0,
      last_downloaded_at INTEGER,
      download_count INTEGER DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_courses_updated ON library_courses(updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_courses_favorite ON library_courses(is_favorite DESC, updated_at DESC);

    CREATE TABLE IF NOT EXISTS permanent_courses (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      data TEXT NOT NULL,
      updated_at INTEGER NOT NULL,
      locked INTEGER DEFAULT 1
    );

    CREATE INDEX IF NOT EXISTS idx_permanent_courses_updated ON permanent_courses(updated_at DESC);

    CREATE TABLE IF NOT EXISTS chat_history (
      id TEXT PRIMARY KEY,
      query TEXT NOT NULL,
      response TEXT NOT NULL,
      model TEXT,
      model_display_name TEXT,
      timestamp INTEGER NOT NULL,
      response_time_ms INTEGER,
      is_favorite INTEGER DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_history_timestamp ON chat_history(timestamp DESC);

    CREATE TABLE IF NOT EXISTS course_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      department TEXT,
      description TEXT,
      color TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_categories_updated ON course_categories(updated_at DESC);

    CREATE TABLE IF NOT EXISTS tieup_leads (
      id TEXT PRIMARY KEY,
      session_id TEXT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      sub_category TEXT,
      country TEXT NOT NULL,
      region TEXT,
      location_main TEXT,
      location_sub TEXT,
      contact_person TEXT,
      contact_title TEXT,
      contact_email TEXT,
      contact_phone TEXT,
      anti_spam_status TEXT DEFAULT 'verified',
      anti_spam_notes TEXT,
      terms_summary TEXT,
      partnership_terms TEXT,
      website_url TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_tieup_leads_updated ON tieup_leads(updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_tieup_leads_session ON tieup_leads(session_id);

    CREATE TABLE IF NOT EXISTS tieup_outreach_logs (
      id TEXT PRIMARY KEY,
      lead_id TEXT,
      institution_name TEXT,
      recipient_email TEXT NOT NULL,
      recipient_name TEXT,
      subject TEXT,
      status TEXT NOT NULL,
      flag_reason TEXT,
      spam_score INTEGER DEFAULT 0,
      last_checked INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_tieup_logs_checked ON tieup_outreach_logs(last_checked DESC);

    CREATE TABLE IF NOT EXISTS tieup_policies (
      id TEXT PRIMARY KEY,
      min_commission_percent REAL DEFAULT 15,
      target_commission_percent REAL DEFAULT 20,
      partnership_criteria TEXT,
      student_requirements_guidelines TEXT,
      terms_expectations TEXT,
      preferred_payment_terms TEXT,
      updated_at INTEGER NOT NULL
    );
  `);

  // Safe incremental schema column migrations
  const safeAddColumn = (table, colDef) => {
    try {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${colDef};`);
    } catch {
      // Column already exists or table busy
    }
  };

  safeAddColumn('chat_sessions', 'autonomous_plan TEXT');
  safeAddColumn('chat_sessions', 'product_type TEXT');
  safeAddColumn('chat_sessions', 'product_params TEXT');
  safeAddColumn('chat_sessions', 'studied_by TEXT');
  safeAddColumn('chat_sessions', 'is_permanent INTEGER DEFAULT 0');
  safeAddColumn('chat_sessions', 'locked INTEGER DEFAULT 0');
  safeAddColumn('chat_sessions', 'tieup_leads TEXT');

  safeAddColumn('library_courses', 'metadata TEXT');
  safeAddColumn('library_courses', 'versions TEXT');
  safeAddColumn('library_courses', 'studied_by TEXT');
  safeAddColumn('library_courses', 'target_audience TEXT');
  safeAddColumn('library_courses', 'is_permanent INTEGER DEFAULT 0');
  safeAddColumn('library_courses', 'locked INTEGER DEFAULT 0');
  safeAddColumn('library_courses', 'last_downloaded_at INTEGER');
  safeAddColumn('library_courses', 'download_count INTEGER DEFAULT 0');

  safeAddColumn('tieup_leads', 'is_partner INTEGER DEFAULT 0');
  safeAddColumn('tieup_leads', 'compatibility_score INTEGER DEFAULT 88');
  safeAddColumn('tieup_leads', 'matching_criteria TEXT');
  safeAddColumn('tieup_leads', 'commission_percent REAL DEFAULT 15');
  safeAddColumn('tieup_leads', 'direct_source_page_url TEXT');
  safeAddColumn('tieup_leads', 'student_requirements TEXT');
  safeAddColumn('tieup_leads', 'institution_criteria TEXT');
  safeAddColumn('tieup_leads', 'terms_of_partnership TEXT');
  safeAddColumn('tieup_leads', 'min_ielts_score REAL DEFAULT 6.0');
  safeAddColumn('tieup_leads', 'german_level_required TEXT DEFAULT "None (English Only)"');
  safeAddColumn('tieup_leads', 'tuition_fee_yearly TEXT DEFAULT "€0 (Public)"');
  safeAddColumn('tieup_leads', 'tuition_amount_eur REAL DEFAULT 0');
  safeAddColumn('tieup_leads', 'scholarship_available INTEGER DEFAULT 0');
  safeAddColumn('tieup_leads', 'scholarship_details TEXT DEFAULT ""');
  safeAddColumn('tieup_leads', 'course_list TEXT DEFAULT "[]"');
  safeAddColumn('tieup_leads', 'mou_document_url TEXT DEFAULT ""');

  safeAddColumn('tieup_outreach_logs', 'phase TEXT DEFAULT "outreach"');
  safeAddColumn('tieup_outreach_logs', 'sent_at INTEGER');
  safeAddColumn('tieup_outreach_logs', 'last_followup_at INTEGER');
  safeAddColumn('tieup_outreach_logs', 'followup_count INTEGER DEFAULT 0');
  safeAddColumn('tieup_outreach_logs', 'meeting_scheduled_at TEXT');
  safeAddColumn('tieup_outreach_logs', 'meeting_link TEXT');
  safeAddColumn('tieup_outreach_logs', 'meeting_agenda TEXT');
  safeAddColumn('tieup_outreach_logs', 'meeting_notes TEXT');
  safeAddColumn('tieup_outreach_logs', 'lead_data_snapshot TEXT');
  safeAddColumn('tieup_outreach_logs', 'sender_email TEXT DEFAULT "partnerships@ila-academy.com"');
  safeAddColumn('tieup_outreach_logs', 'response_excerpt TEXT DEFAULT ""');
  safeAddColumn('tieup_outreach_logs', 'response_sentiment TEXT DEFAULT ""');
  safeAddColumn('tieup_outreach_logs', 'response_received_at INTEGER');
  safeAddColumn('tieup_outreach_logs', 'ai_suggested_reply TEXT DEFAULT ""');
  safeAddColumn('tieup_outreach_logs', 'ai_suggested_subject TEXT DEFAULT ""');
  safeAddColumn('tieup_outreach_logs', 'retry_count INTEGER DEFAULT 0');

  // Automatic bi-directional rehydration: Rehydrate SQLite from JSON store if SQLite has missing rows
  rehydrateFromPersistenceStore(db);
}

// -------------------------------------------------------------
// DUAL-TIER DURABLE DISK JSON PERSISTENCE STORE
// Guaranteed permanent local file storage in project directory
// -------------------------------------------------------------

export function readPersistenceStore() {
  try {
    if (fs.existsSync(PERSISTENCE_STORE_PATH)) {
      const content = fs.readFileSync(PERSISTENCE_STORE_PATH, 'utf-8');
      if (content.trim()) {
        const parsed = JSON.parse(content);
        return parsed && typeof parsed === 'object' ? parsed : null;
      }
    }
  } catch (err) {
    console.warn('[server/db] Failed to read app_persistence_store.json:', err);
  }
  return null;
}

let syncTimeout = null;
export function schedulePersistenceSync(immediate = false) {
  if (immediate) {
    if (syncTimeout) clearTimeout(syncTimeout);
    syncTimeout = null;
    return syncPersistenceStoreToDisk();
  }
  if (!syncTimeout) {
    syncTimeout = setTimeout(() => {
      syncTimeout = null;
      syncPersistenceStoreToDisk();
    }, 150);
  }
}

export function syncPersistenceStoreToDisk() {
  try {
    const db = getDatabase();
    const sessions = getAllSessions();
    const courses = getAllCourses();
    const permanentCourses = getAllPermanentCourses();
    const tieupLeads = getAllTieupLeads();
    const tieupPolicies = getTieupPolicies();
    const outreachLogs = getAllOutreachLogs();

    const payload = {
      version: '6.0.0',
      lastSyncedAt: Date.now(),
      counts: {
        sessions: sessions.length,
        courses: courses.length,
        permanentCourses: permanentCourses.length,
        tieupLeads: tieupLeads.length,
        outreachLogs: outreachLogs.length,
      },
      sessions,
      courses,
      permanentCourses,
      tieupLeads,
      tieupPolicies,
      outreachLogs,
    };

    const tempPath = `${PERSISTENCE_STORE_PATH}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(payload, null, 2), 'utf-8');
    try {
      fs.renameSync(tempPath, PERSISTENCE_STORE_PATH);
    } catch {
      // On Windows fallback if target is briefly held
      fs.writeFileSync(PERSISTENCE_STORE_PATH, JSON.stringify(payload, null, 2), 'utf-8');
      try { fs.unlinkSync(tempPath); } catch {}
    }
    return payload;
  } catch (err) {
    console.warn('[server/db] Failed to write app_persistence_store.json:', err);
    return null;
  }
}

export function rehydrateFromPersistenceStore(db) {
  const store = readPersistenceStore();
  if (!store) return;

  try {
    // Check if SQLite sessions are empty but store has sessions
    const sessionCount = db.prepare(`SELECT COUNT(*) AS count FROM chat_sessions`).get()?.count || 0;
    if (sessionCount === 0 && Array.isArray(store.sessions) && store.sessions.length > 0) {
      console.log(`[server/db] Rehydrating ${store.sessions.length} sessions from app_persistence_store.json...`);
      for (const s of store.sessions) {
        saveSession(s);
      }
    }

    // Check if SQLite courses are empty but store has courses
    const coursesCount = db.prepare(`SELECT COUNT(*) AS count FROM library_courses`).get()?.count || 0;
    if (coursesCount === 0 && Array.isArray(store.courses) && store.courses.length > 0) {
      console.log(`[server/db] Rehydrating ${store.courses.length} courses from app_persistence_store.json...`);
      for (const c of store.courses) {
        saveCourse(c);
      }
    }

    // Check if SQLite tieup_leads are empty but store has leads
    const leadsCount = db.prepare(`SELECT COUNT(*) AS count FROM tieup_leads`).get()?.count || 0;
    if (leadsCount === 0 && Array.isArray(store.tieupLeads) && store.tieupLeads.length > 0) {
      console.log(`[server/db] Rehydrating ${store.tieupLeads.length} tie-up leads from app_persistence_store.json...`);
      saveTieupLeadsBatch(store.tieupLeads);
    }

    // Rehydrate policies if available
    if (store.tieupPolicies) {
      saveTieupPolicies(store.tieupPolicies);
    }
  } catch (err) {
    console.warn('[server/db] Error during rehydration from app_persistence_store.json:', err);
  }
}

// -------------------------------------------------------------
// DISK JSON PERMANENT STORE HELPERS
// -------------------------------------------------------------

function readPermanentCoursesFromFile() {
  try {
    if (fs.existsSync(JSON_STORE_PATH)) {
      const content = fs.readFileSync(JSON_STORE_PATH, 'utf-8');
      if (content.trim()) {
        const parsed = JSON.parse(content);
        return Array.isArray(parsed) ? parsed : [];
      }
    }
  } catch (err) {
    console.warn('[server/db] Failed to read permanent_courses_store.json:', err);
  }
  return [];
}

function writePermanentCoursesToFile(courses) {
  try {
    fs.writeFileSync(JSON_STORE_PATH, JSON.stringify(courses, null, 2), 'utf-8');
  } catch (err) {
    console.error('[server/db] Failed to write permanent_courses_store.json:', err);
  }
}

// -------------------------------------------------------------
// PERMANENT COURSES OPERATIONS (LOCKED / MANUAL DELETION ONLY)
// -------------------------------------------------------------

export function getAllPermanentCourses() {
  const db = getDatabase();
  const fileCourses = readPermanentCoursesFromFile();
  const fileMap = new Map(fileCourses.map((c) => [c.id, c]));

  try {
    const rows = db.prepare(`SELECT * FROM permanent_courses ORDER BY updated_at DESC`).all();
    for (const row of rows) {
      if (!fileMap.has(row.id)) {
        try {
          const parsed = JSON.parse(row.data);
          fileMap.set(row.id, parsed);
        } catch {
          // ignore
        }
      }
    }
  } catch (err) {
    console.warn('[server/db] SQLite permanent_courses query notice:', err);
  }

  const merged = Array.from(fileMap.values()).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  return merged;
}

export function getPermanentCourseById(id) {
  const all = getAllPermanentCourses();
  return all.find((c) => c.id === id) || null;
}

export function savePermanentCourse(courseRecord) {
  const db = getDatabase();
  const now = Date.now();
  const id = courseRecord.id || `perm_course_${now}_${Math.random().toString(36).substring(2, 8)}`;
  const title = courseRecord.title || 'Masterclass Course';

  const updatedRecord = {
    ...courseRecord,
    id,
    courseId: id,
    title,
    isPermanent: true,
    locked: true,
    updatedAt: now,
  };

  // 1. Save to SQLite permanent_courses table
  try {
    const stmt = db.prepare(`
      INSERT INTO permanent_courses (id, title, data, updated_at, locked)
      VALUES (?, ?, ?, ?, 1)
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        data = excluded.data,
        updated_at = excluded.updated_at,
        locked = 1
    `);
    stmt.run(id, title, JSON.stringify(updatedRecord), now);
  } catch (err) {
    console.error('[server/db] SQLite permanent_courses save error:', err);
  }

  // 2. Also save to library_courses table so it is listed in general library queries
  try {
    saveCourse({
      ...updatedRecord,
      isPermanent: true,
      locked: true,
    });
  } catch (err) {
    console.warn('[server/db] Auto-sync to library_courses notice:', err);
  }

  // 3. If messages are present, also save corresponding chat session so Course Creator displays it
  if (Array.isArray(updatedRecord.messages) && updatedRecord.messages.length > 0) {
    try {
      const sessionId = updatedRecord.sourceSessionId || `session_perm_${id}`;
      saveSession({
        id: sessionId,
        title,
        createdAt: updatedRecord.createdAt || now,
        updatedAt: now,
        isPinned: true,
        productType: 'course_creator',
        studiedBy: updatedRecord.studiedBy || updatedRecord.targetAudience,
        messages: updatedRecord.messages,
        coursePlan: updatedRecord.coursePlan,
        autonomousPlan: updatedRecord.autonomousPlan,
        isPermanent: true,
        locked: true,
      });
    } catch (err) {
      console.warn('[server/db] Auto-sync to chat_sessions notice:', err);
    }
  }

  // 4. Update disk JSON file
  const fileCourses = readPermanentCoursesFromFile();
  const existingIdx = fileCourses.findIndex((c) => c.id === id);
  if (existingIdx >= 0) {
    fileCourses[existingIdx] = updatedRecord;
  } else {
    fileCourses.unshift(updatedRecord);
  }
  writePermanentCoursesToFile(fileCourses);

  return updatedRecord;
}

export function deletePermanentCourse(id, manualConfirm = false) {
  if (!manualConfirm) {
    console.warn(`[server/db] Deletion rejected: locked permanent course '${id}' requires manual confirmation.`);
    return false;
  }

  const db = getDatabase();

  // 1. Delete from permanent_courses table
  try {
    db.prepare(`DELETE FROM permanent_courses WHERE id = ?`).run(id);
  } catch (err) {
    console.warn('[server/db] Error deleting permanent_courses row:', err);
  }

  // 2. Delete from library_courses table
  try {
    db.prepare(`DELETE FROM library_courses WHERE id = ?`).run(id);
  } catch (err) {
    console.warn('[server/db] Error deleting library_courses row:', err);
  }

  // 3. Delete from chat_sessions if matched
  try {
    db.prepare(`DELETE FROM chat_sessions WHERE id = ? OR id = ?`).run(id, `session_perm_${id}`);
  } catch (err) {
    console.warn('[server/db] Error deleting chat_sessions row:', err);
  }

  // 4. Delete from disk JSON file
  const fileCourses = readPermanentCoursesFromFile().filter((c) => c.id !== id);
  writePermanentCoursesToFile(fileCourses);

  return true;
}

export function recordCourseDownload(id, format = 'docx') {
  const db = getDatabase();
  const now = Date.now();

  // 1. Update permanent_courses
  const course = getPermanentCourseById(id);
  if (course) {
    course.lastDownloadedAt = now;
    course.downloadCount = (course.downloadCount || 0) + 1;
    course.locked = true;
    savePermanentCourse(course);
  }

  // 2. Update library_courses
  try {
    db.prepare(`
      UPDATE library_courses
      SET last_downloaded_at = ?, download_count = download_count + 1, locked = 1
      WHERE id = ?
    `).run(now, id);
  } catch {
    // ignore
  }

  return true;
}

// -------------------------------------------------------------
// CHAT SESSIONS OPERATIONS
// -------------------------------------------------------------

export function getAllSessions() {
  const db = getDatabase();
  const query = db.prepare(`
    SELECT * FROM chat_sessions 
    ORDER BY is_pinned DESC, updated_at DESC
  `);
  const rows = query.all();
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isPinned: Boolean(row.is_pinned),
    coursePlan: row.course_plan ? JSON.parse(row.course_plan) : undefined,
    attachedDocuments: row.attached_documents ? JSON.parse(row.attached_documents) : [],
    messages: row.messages ? JSON.parse(row.messages) : [],
    autonomousPlan: row.autonomous_plan ? JSON.parse(row.autonomous_plan) : undefined,
    productType: row.product_type || 'course_creator',
    productParams: row.product_params ? JSON.parse(row.product_params) : undefined,
    studiedBy: row.studied_by,
    isPermanent: Boolean(row.is_permanent),
    locked: Boolean(row.locked),
  }));
}

export function getSessionById(id) {
  const db = getDatabase();
  const query = db.prepare(`SELECT * FROM chat_sessions WHERE id = ?`);
  const row = query.get(id);
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isPinned: Boolean(row.is_pinned),
    coursePlan: row.course_plan ? JSON.parse(row.course_plan) : undefined,
    attachedDocuments: row.attached_documents ? JSON.parse(row.attached_documents) : [],
    messages: row.messages ? JSON.parse(row.messages) : [],
    autonomousPlan: row.autonomous_plan ? JSON.parse(row.autonomous_plan) : undefined,
    productType: row.product_type || 'course_creator',
    productParams: row.product_params ? JSON.parse(row.product_params) : undefined,
    studiedBy: row.studied_by,
    isPermanent: Boolean(row.is_permanent),
    locked: Boolean(row.locked),
  };
}

export function saveSession(session) {
  const db = getDatabase();
  const now = Date.now();
  const id = session.id || `session_${now}_${Math.random().toString(36).substring(2, 9)}`;
  const title = session.title || 'New Course Workspace';
  const createdAt = session.createdAt || now;
  const updatedAt = session.updatedAt || now;
  const isPinned = session.isPinned ? 1 : 0;
  const coursePlan = session.coursePlan ? JSON.stringify(session.coursePlan) : null;
  const attachedDocuments = JSON.stringify(session.attachedDocuments || []);
  const messages = JSON.stringify(session.messages || []);
  const autonomousPlan = session.autonomousPlan ? JSON.stringify(session.autonomousPlan) : null;
  const productType = session.productType || 'course_creator';
  const productParams = session.productParams ? JSON.stringify(session.productParams) : null;
  const studiedBy = session.studiedBy || null;
  const isPermanent = session.isPermanent ? 1 : 0;
  const locked = session.locked ? 1 : 0;

  const stmt = db.prepare(`
    INSERT INTO chat_sessions (
      id, title, created_at, updated_at, is_pinned, 
      course_plan, attached_documents, messages,
      autonomous_plan, product_type, product_params, studied_by, is_permanent, locked
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      updated_at = excluded.updated_at,
      is_pinned = excluded.is_pinned,
      course_plan = excluded.course_plan,
      attached_documents = excluded.attached_documents,
      messages = excluded.messages,
      autonomous_plan = excluded.autonomous_plan,
      product_type = excluded.product_type,
      product_params = excluded.product_params,
      studied_by = excluded.studied_by,
      is_permanent = CASE WHEN excluded.is_permanent = 1 THEN 1 ELSE chat_sessions.is_permanent END,
      locked = CASE WHEN excluded.locked = 1 THEN 1 ELSE chat_sessions.locked END
  `);

  stmt.run(
    id, title, createdAt, updatedAt, isPinned,
    coursePlan, attachedDocuments, messages,
    autonomousPlan, productType, productParams, studiedBy, isPermanent, locked
  );

  return {
    id,
    title,
    createdAt,
    updatedAt,
    isPinned: Boolean(isPinned),
    coursePlan: session.coursePlan,
    attachedDocuments: session.attachedDocuments || [],
    messages: session.messages || [],
    autonomousPlan: session.autonomousPlan,
    productType,
    productParams: session.productParams,
    studiedBy,
    isPermanent: Boolean(isPermanent),
    locked: Boolean(locked),
  };
}

export function updateSessionTitle(id, newTitle) {
  const db = getDatabase();
  const updatedAt = Date.now();
  const stmt = db.prepare(`
    UPDATE chat_sessions
    SET title = ?, updated_at = ?
    WHERE id = ?
  `);
  stmt.run(newTitle.trim() || 'Untitled Course', updatedAt, id);
  return getSessionById(id);
}

export function togglePinSession(id) {
  const db = getDatabase();
  const session = getSessionById(id);
  if (!session) return null;
  const newPinned = session.isPinned ? 0 : 1;
  const updatedAt = Date.now();
  const stmt = db.prepare(`
    UPDATE chat_sessions
    SET is_pinned = ?, updated_at = ?
    WHERE id = ?
  `);
  stmt.run(newPinned, updatedAt, id);
  return Boolean(newPinned);
}

export function deleteSession(id) {
  const db = getDatabase();
  // Protected: do not delete locked permanent sessions
  const stmt = db.prepare(`DELETE FROM chat_sessions WHERE id = ? AND (locked IS NULL OR locked = 0)`);
  stmt.run(id);
  return true;
}

export function clearAllSessions() {
  const db = getDatabase();
  // Safe: preserve permanent and locked courses
  db.exec(`DELETE FROM chat_sessions WHERE (is_permanent IS NULL OR is_permanent = 0) AND (locked IS NULL OR locked = 0)`);
  return true;
}

export function importSessions(sessions) {
  const db = getDatabase();
  let count = 0;
  if (!Array.isArray(sessions)) return 0;

  db.exec('BEGIN TRANSACTION;');
  try {
    for (const session of sessions) {
      if (session && session.id && Array.isArray(session.messages)) {
        saveSession(session);
        count++;
      }
    }
    db.exec('COMMIT;');
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
  return count;
}

// -------------------------------------------------------------
// LIBRARY COURSES OPERATIONS
// -------------------------------------------------------------

export function getAllCourses() {
  const db = getDatabase();
  const query = db.prepare(`
    SELECT * FROM library_courses 
    ORDER BY is_favorite DESC, updated_at DESC
  `);
  const rows = query.all();
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    category: row.category,
    overview: row.overview,
    totalChapters: row.total_chapters,
    chapters: row.chapters ? JSON.parse(row.chapters) : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    sourceSessionId: row.source_session_id,
    tags: row.tags ? JSON.parse(row.tags) : [],
    isFavorite: Boolean(row.is_favorite),
    metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
    versions: row.versions ? JSON.parse(row.versions) : undefined,
    studiedBy: row.studied_by,
    targetAudience: row.target_audience,
    isPermanent: Boolean(row.is_permanent),
    locked: Boolean(row.locked),
    lastDownloadedAt: row.last_downloaded_at,
    downloadCount: row.download_count || 0,
  }));
}

export function getCourseById(id) {
  const db = getDatabase();
  const query = db.prepare(`SELECT * FROM library_courses WHERE id = ?`);
  const row = query.get(id);
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    category: row.category,
    overview: row.overview,
    totalChapters: row.total_chapters,
    chapters: row.chapters ? JSON.parse(row.chapters) : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    sourceSessionId: row.source_session_id,
    tags: row.tags ? JSON.parse(row.tags) : [],
    isFavorite: Boolean(row.is_favorite),
    metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
    versions: row.versions ? JSON.parse(row.versions) : undefined,
    studiedBy: row.studied_by,
    targetAudience: row.target_audience,
    isPermanent: Boolean(row.is_permanent),
    locked: Boolean(row.locked),
    lastDownloadedAt: row.last_downloaded_at,
    downloadCount: row.download_count || 0,
  };
}

export function saveCourse(course) {
  const db = getDatabase();
  const now = Date.now();
  const id = course.id || `course_${now}_${Math.random().toString(36).substring(2, 9)}`;
  const title = course.title || 'Masterclass Course';
  const subtitle = course.subtitle || '';
  const category = course.category || 'Enterprise Education';
  const overview = course.overview || '';
  const totalChapters = course.chapters ? course.chapters.length : 0;
  const chapters = JSON.stringify(course.chapters || []);
  const createdAt = course.createdAt || now;
  const updatedAt = course.updatedAt || now;
  const sourceSessionId = course.sourceSessionId || null;
  const tags = JSON.stringify(course.tags || []);
  const isFavorite = course.isFavorite ? 1 : 0;
  const metadata = course.metadata ? JSON.stringify(course.metadata) : null;
  const versions = course.versions ? JSON.stringify(course.versions) : null;
  const studiedBy = course.studiedBy || course.targetAudience || null;
  const targetAudience = course.targetAudience || course.studiedBy || null;
  const isPermanent = course.isPermanent ? 1 : 0;
  const locked = course.locked ? 1 : 0;
  const lastDownloadedAt = course.lastDownloadedAt || null;
  const downloadCount = course.downloadCount || 0;

  const stmt = db.prepare(`
    INSERT INTO library_courses (
      id, title, subtitle, category, overview, 
      total_chapters, chapters, created_at, updated_at, 
      source_session_id, tags, is_favorite,
      metadata, versions, studied_by, target_audience,
      is_permanent, locked, last_downloaded_at, download_count
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      subtitle = excluded.subtitle,
      category = excluded.category,
      overview = excluded.overview,
      total_chapters = excluded.total_chapters,
      chapters = excluded.chapters,
      updated_at = excluded.updated_at,
      source_session_id = excluded.source_session_id,
      tags = excluded.tags,
      is_favorite = excluded.is_favorite,
      metadata = excluded.metadata,
      versions = excluded.versions,
      studied_by = excluded.studied_by,
      target_audience = excluded.target_audience,
      is_permanent = CASE WHEN excluded.is_permanent = 1 THEN 1 ELSE library_courses.is_permanent END,
      locked = CASE WHEN excluded.locked = 1 THEN 1 ELSE library_courses.locked END,
      last_downloaded_at = COALESCE(excluded.last_downloaded_at, library_courses.last_downloaded_at),
      download_count = CASE WHEN excluded.download_count > 0 THEN excluded.download_count ELSE library_courses.download_count END
  `);

  stmt.run(
    id, title, subtitle, category, overview,
    totalChapters, chapters, createdAt, updatedAt,
    sourceSessionId, tags, isFavorite,
    metadata, versions, studiedBy, targetAudience,
    isPermanent, locked, lastDownloadedAt, downloadCount
  );

  return {
    id,
    title,
    subtitle,
    category,
    overview,
    totalChapters,
    chapters: course.chapters || [],
    createdAt,
    updatedAt,
    sourceSessionId,
    tags: course.tags || [],
    isFavorite: Boolean(isFavorite),
    metadata: course.metadata,
    versions: course.versions,
    studiedBy,
    targetAudience,
    isPermanent: Boolean(isPermanent),
    locked: Boolean(locked),
    lastDownloadedAt,
    downloadCount,
  };
}

export function deleteCourse(id) {
  const db = getDatabase();
  // Protected: do not delete locked permanent courses via generic deleteCourse
  const stmt = db.prepare(`DELETE FROM library_courses WHERE id = ? AND (locked IS NULL OR locked = 0)`);
  stmt.run(id);
  return true;
}

export function clearAllCourses() {
  const db = getDatabase();
  // Safe: preserve permanent and locked courses
  db.exec(`DELETE FROM library_courses WHERE (is_permanent IS NULL OR is_permanent = 0) AND (locked IS NULL OR locked = 0)`);
  return true;
}

export function toggleChapterCompletion(courseId, chapterId) {
  const course = getCourseById(courseId);
  if (!course) return null;

  course.chapters = course.chapters.map((ch) =>
    ch.id === chapterId ? { ...ch, isCompleted: !ch.isCompleted } : ch
  );
  course.updatedAt = Date.now();
  return saveCourse(course);
}

export function importCourses(courses) {
  const db = getDatabase();
  let count = 0;
  if (!Array.isArray(courses)) return 0;

  db.exec('BEGIN TRANSACTION;');
  try {
    for (const course of courses) {
      if (course && course.id && Array.isArray(course.chapters)) {
        saveCourse(course);
        count++;
      }
    }
    db.exec('COMMIT;');
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
  return count;
}

// -------------------------------------------------------------
// CHAT HISTORY (LEGACY COMPATIBILITY)
// -------------------------------------------------------------

export function getAllHistory() {
  const db = getDatabase();
  const query = db.prepare(`SELECT * FROM chat_history ORDER BY timestamp DESC`);
  const rows = query.all();
  return rows.map((row) => ({
    id: row.id,
    query: row.query,
    response: row.response,
    model: row.model,
    modelDisplayName: row.model_display_name,
    timestamp: row.timestamp,
    responseTimeMs: row.response_time_ms,
    isFavorite: Boolean(row.is_favorite),
  }));
}

export function saveHistoryItem(item) {
  const db = getDatabase();
  const id = item.id || `chat_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const query = item.query || '';
  const response = item.response || '';
  const model = item.model || '';
  const modelDisplayName = item.modelDisplayName || '';
  const timestamp = item.timestamp || Date.now();
  const responseTimeMs = item.responseTimeMs || 0;
  const isFavorite = item.isFavorite ? 1 : 0;

  const stmt = db.prepare(`
    INSERT INTO chat_history (id, query, response, model, model_display_name, timestamp, response_time_ms, is_favorite)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      query = excluded.query,
      response = excluded.response,
      model = excluded.model,
      model_display_name = excluded.model_display_name,
      timestamp = excluded.timestamp,
      response_time_ms = excluded.response_time_ms,
      is_favorite = excluded.is_favorite
  `);

  stmt.run(id, query, response, model, modelDisplayName, timestamp, responseTimeMs, isFavorite);

  return {
    id,
    query,
    response,
    model,
    modelDisplayName,
    timestamp,
    responseTimeMs,
    isFavorite: Boolean(isFavorite),
  };
}

export function deleteHistoryItem(id) {
  const db = getDatabase();
  const stmt = db.prepare(`DELETE FROM chat_history WHERE id = ?`);
  stmt.run(id);
  return true;
}

export function clearAllHistory() {
  const db = getDatabase();
  db.exec(`DELETE FROM chat_history`);
  return true;
}

// -------------------------------------------------------------
// COURSE CATEGORIES OPERATIONS
// -------------------------------------------------------------

export function getAllCategories() {
  const db = getDatabase();
  const query = db.prepare(`SELECT * FROM course_categories ORDER BY updated_at DESC`);
  const rows = query.all();
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    department: row.department,
    description: row.description,
    color: row.color,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export function saveCategory(category) {
  const db = getDatabase();
  const now = Date.now();
  const id = category.id || `cat_${now}_${Math.random().toString(36).substring(2, 9)}`;
  const name = category.name ? category.name.trim() : 'General';
  const department = category.department ? category.department.trim() : '';
  const description = category.description ? category.description.trim() : '';
  const color = category.color || '#6366f1';
  const createdAt = category.createdAt || now;
  const updatedAt = category.updatedAt || now;

  const stmt = db.prepare(`
    INSERT INTO course_categories (id, name, department, description, color, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      department = excluded.department,
      description = excluded.description,
      color = excluded.color,
      updated_at = excluded.updated_at
  `);

  stmt.run(id, name, department, description, color, createdAt, updatedAt);

  return {
    id,
    name,
    department,
    description,
    color,
    createdAt,
    updatedAt,
  };
}

export function deleteCategory(id) {
  const db = getDatabase();
  const stmt = db.prepare(`DELETE FROM course_categories WHERE id = ?`);
  stmt.run(id);
  return true;
}

export function clearAllCategories() {
  const db = getDatabase();
  db.exec(`DELETE FROM course_categories`);
  return true;
}

// -------------------------------------------------------------
// TIE-UP LEADS & RESEARCH OPERATIONS
// -------------------------------------------------------------

export function getAllTieupLeads(sessionId = null) {
  const db = getDatabase();
  let query;
  if (sessionId) {
    query = db.prepare(`SELECT * FROM tieup_leads WHERE session_id = ? ORDER BY updated_at DESC`);
    return query.all(sessionId).map(formatTieupLeadRow);
  }
  query = db.prepare(`SELECT * FROM tieup_leads ORDER BY updated_at DESC`);
  return query.all().map(formatTieupLeadRow);
}

export function isValidDirectUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (['not available', 'n/a', 'none', '#', ''].includes(trimmed.toLowerCase())) return false;
  try {
    const parsed = new URL(trimmed);
    return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && parsed.hostname.includes('.');
  } catch {
    return false;
  }
}

function formatTieupLeadRow(row) {
  let parsedTerms = null;
  if (row.partnership_terms) {
    try {
      parsedTerms = JSON.parse(row.partnership_terms);
    } catch {
      parsedTerms = row.partnership_terms;
    }
  }

  let parsedCourseList = [];
  if (row.course_list) {
    try {
      parsedCourseList = JSON.parse(row.course_list);
    } catch {
      parsedCourseList = [row.course_list];
    }
  }

  return {
    id: row.id,
    sessionId: row.session_id,
    name: row.name,
    category: row.category,
    subCategory: row.sub_category,
    country: row.country,
    region: row.region,
    locationMain: row.location_main,
    locationSub: row.location_sub,
    contactPerson: row.contact_person,
    contactTitle: row.contact_title,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    antiSpamStatus: row.anti_spam_status || 'verified',
    antiSpamNotes: row.anti_spam_notes || '',
    termsSummary: row.terms_summary || '',
    partnershipTerms: parsedTerms,
    websiteUrl: isValidDirectUrl(row.website_url) ? row.website_url : 'Not Available',
    isPartner: Boolean(row.is_partner),
    compatibilityScore: row.compatibility_score || 88,
    matchingCriteria: row.matching_criteria ? (row.matching_criteria.startsWith('[') ? JSON.parse(row.matching_criteria) : row.matching_criteria) : [],
    commissionPercent: row.commission_percent != null ? Number(row.commission_percent) : 15,
    directSourcePageUrl: isValidDirectUrl(row.direct_source_page_url) ? row.direct_source_page_url : 'Not Available',
    studentRequirements: row.student_requirements || '',
    institutionCriteria: row.institution_criteria || '',
    termsOfPartnership: row.terms_of_partnership || row.terms_summary || '',
    minIeltsScore: row.min_ielts_score != null ? Number(row.min_ielts_score) : 6.0,
    germanLevelRequired: row.german_level_required || 'None (English Only)',
    tuitionFeeYearly: row.tuition_fee_yearly || '€0 (Public / Semester Fee Only)',
    tuitionAmountEur: row.tuition_amount_eur != null ? Number(row.tuition_amount_eur) : 0,
    scholarshipAvailable: Boolean(row.scholarship_available),
    scholarshipDetails: row.scholarship_details || '',
    courseList: Array.isArray(parsedCourseList) ? parsedCourseList : [],
    mouDocumentUrl: isValidDirectUrl(row.mou_document_url) ? row.mou_document_url : 'Not Available',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function saveTieupLead(lead) {
  const db = getDatabase();
  const now = Date.now();
  const id = lead.id || `tieup_lead_${now}_${Math.random().toString(36).substring(2, 9)}`;
  const sessionId = lead.sessionId || null;
  const name = lead.name || 'Unnamed Institution';
  const category = lead.category || 'College & University';
  const subCategory = lead.subCategory || 'General Partner';
  const country = lead.country || 'Germany';
  const region = lead.region || '';
  const locationMain = lead.locationMain || '';
  const locationSub = lead.locationSub || '';
  const contactPerson = lead.contactPerson || '';
  const contactTitle = lead.contactTitle || '';
  const contactEmail = lead.contactEmail || '';
  const contactPhone = lead.contactPhone || '';
  const antiSpamStatus = lead.antiSpamStatus || 'verified';
  const antiSpamNotes = lead.antiSpamNotes || '';
  const termsSummary = lead.termsSummary || '';
  const partnershipTerms = typeof lead.partnershipTerms === 'object' ? JSON.stringify(lead.partnershipTerms) : (lead.partnershipTerms || '');
  const websiteUrl = isValidDirectUrl(lead.websiteUrl) ? lead.websiteUrl : 'Not Available';
  const isPartner = lead.isPartner ? 1 : 0;
  const compatibilityScore = lead.compatibilityScore || 88;
  const matchingCriteria = Array.isArray(lead.matchingCriteria) ? JSON.stringify(lead.matchingCriteria) : (lead.matchingCriteria || '');
  const commissionPercent = lead.commissionPercent != null ? Number(lead.commissionPercent) : 15;
  const directSourcePageUrl = isValidDirectUrl(lead.directSourcePageUrl) ? lead.directSourcePageUrl : 'Not Available';
  const studentRequirements = lead.studentRequirements || '';
  const institutionCriteria = lead.institutionCriteria || '';
  const termsOfPartnership = lead.termsOfPartnership || lead.termsSummary || '';
  const minIeltsScore = lead.minIeltsScore != null ? Number(lead.minIeltsScore) : 6.0;
  const germanLevelRequired = lead.germanLevelRequired || 'None (English Only)';
  const tuitionFeeYearly = lead.tuitionFeeYearly || '€0 (Public / Semester Fee Only)';
  const tuitionAmountEur = lead.tuitionAmountEur != null ? Number(lead.tuitionAmountEur) : 0;
  const scholarshipAvailable = lead.scholarshipAvailable ? 1 : 0;
  const scholarshipDetails = lead.scholarshipDetails || '';
  const courseList = Array.isArray(lead.courseList) ? JSON.stringify(lead.courseList) : (lead.courseList || '[]');
  const mouDocumentUrl = isValidDirectUrl(lead.mouDocumentUrl) ? lead.mouDocumentUrl : 'Not Available';
  const createdAt = lead.createdAt || now;
  const updatedAt = lead.updatedAt || now;

  const stmt = db.prepare(`
    INSERT INTO tieup_leads (
      id, session_id, name, category, sub_category, country, region,
      location_main, location_sub, contact_person, contact_title,
      contact_email, contact_phone, anti_spam_status, anti_spam_notes,
      terms_summary, partnership_terms, website_url, is_partner, compatibility_score, matching_criteria,
      commission_percent, direct_source_page_url, student_requirements, institution_criteria, terms_of_partnership,
      min_ielts_score, german_level_required, tuition_fee_yearly, tuition_amount_eur, scholarship_available, scholarship_details,
      course_list, mou_document_url, created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      session_id = excluded.session_id,
      name = excluded.name,
      category = excluded.category,
      sub_category = excluded.sub_category,
      country = excluded.country,
      region = excluded.region,
      location_main = excluded.location_main,
      location_sub = excluded.location_sub,
      contact_person = excluded.contact_person,
      contact_title = excluded.contact_title,
      contact_email = excluded.contact_email,
      contact_phone = excluded.contact_phone,
      anti_spam_status = excluded.anti_spam_status,
      anti_spam_notes = excluded.anti_spam_notes,
      terms_summary = excluded.terms_summary,
      partnership_terms = excluded.partnership_terms,
      website_url = excluded.website_url,
      is_partner = excluded.is_partner,
      compatibility_score = excluded.compatibility_score,
      matching_criteria = excluded.matching_criteria,
      commission_percent = excluded.commission_percent,
      direct_source_page_url = excluded.direct_source_page_url,
      student_requirements = excluded.student_requirements,
      institution_criteria = excluded.institution_criteria,
      terms_of_partnership = excluded.terms_of_partnership,
      min_ielts_score = excluded.min_ielts_score,
      german_level_required = excluded.german_level_required,
      tuition_fee_yearly = excluded.tuition_fee_yearly,
      tuition_amount_eur = excluded.tuition_amount_eur,
      scholarship_available = excluded.scholarship_available,
      scholarship_details = excluded.scholarship_details,
      course_list = excluded.course_list,
      mou_document_url = excluded.mou_document_url,
      updated_at = excluded.updated_at
  `);

  stmt.run(
    id, sessionId, name, category, subCategory, country, region,
    locationMain, locationSub, contactPerson, contactTitle,
    contactEmail, contactPhone, antiSpamStatus, antiSpamNotes,
    termsSummary, partnershipTerms, websiteUrl, isPartner, compatibilityScore, matchingCriteria,
    commissionPercent, directSourcePageUrl, studentRequirements, institutionCriteria, termsOfPartnership,
    minIeltsScore, germanLevelRequired, tuitionFeeYearly, tuitionAmountEur, scholarshipAvailable, scholarshipDetails,
    courseList, mouDocumentUrl, createdAt, updatedAt
  );

  return formatTieupLeadRow({
    id, session_id: sessionId, name, category, sub_category: subCategory, country, region,
    location_main: locationMain, location_sub: locationSub, contact_person: contactPerson, contact_title: contactTitle,
    contact_email: contactEmail, contact_phone: contactPhone, anti_spam_status: antiSpamStatus, anti_spam_notes: antiSpamNotes,
    terms_summary: termsSummary, partnership_terms: partnershipTerms, website_url: websiteUrl,
    is_partner: isPartner, compatibility_score: compatibilityScore, matching_criteria: matchingCriteria,
    commission_percent: commissionPercent, direct_source_page_url: directSourcePageUrl,
    student_requirements: studentRequirements, institution_criteria: institutionCriteria, terms_of_partnership: termsOfPartnership,
    min_ielts_score: minIeltsScore, german_level_required: germanLevelRequired, tuition_fee_yearly: tuitionFeeYearly,
    tuition_amount_eur: tuitionAmountEur, scholarship_available: scholarshipAvailable, scholarship_details: scholarshipDetails,
    course_list: courseList, mou_document_url: mouDocumentUrl,
    created_at: createdAt, updated_at: updatedAt
  });
}

export function togglePartnerStatus(id, isPartner = true) {
  const db = getDatabase();
  const stmt = db.prepare(`UPDATE tieup_leads SET is_partner = ?, updated_at = ? WHERE id = ?`);
  stmt.run(isPartner ? 1 : 0, Date.now(), id);
  const row = db.prepare(`SELECT * FROM tieup_leads WHERE id = ?`).get(id);
  return row ? formatTieupLeadRow(row) : null;
}

export function getAllPartners() {
  const db = getDatabase();
  const rows = db.prepare(`SELECT * FROM tieup_leads WHERE is_partner = 1 ORDER BY updated_at DESC`).all();
  return rows.map(formatTieupLeadRow);
}

export function saveTieupLeadsBatch(leads, sessionId = null) {
  if (!Array.isArray(leads) || leads.length === 0) return [];
  return leads.map((lead) => saveTieupLead({ ...lead, sessionId: lead.sessionId || sessionId }));
}

export function deleteTieupLead(id) {
  const db = getDatabase();
  const stmt = db.prepare(`DELETE FROM tieup_leads WHERE id = ?`);
  stmt.run(id);
  return true;
}

export function clearTieupLeads(sessionId = null) {
  const db = getDatabase();
  if (sessionId) {
    const stmt = db.prepare(`DELETE FROM tieup_leads WHERE session_id = ?`);
    stmt.run(sessionId);
  } else {
    db.exec(`DELETE FROM tieup_leads`);
  }
  return true;
}

// -------------------------------------------------------------
// OUR PARTNERSHIP POLICIES (ADMIN BASELINE CONFIGURATION)
// -------------------------------------------------------------

const DEFAULT_TIEUP_POLICIES = {
  id: 'default_policies',
  minCommissionPercent: 15,
  targetCommissionPercent: 20,
  partnershipCriteria: 'State-accredited institution or licensed educational service provider; direct admissions/partnership liaison inbox; transparent student processing; non-exclusive mutual partnership.',
  studentRequirementsGuidelines: 'Minimum IELTS 6.5 / TOEFL 85+ / Duolingo 115; B2 German for bilingual tracks; APS certificate for relevant jurisdictions; minimum German GPA equivalent 2.5.',
  termsExpectations: 'Standard bilateral Memorandum of Understanding (MoU); quarterly commission payment cycles (50% on visa clearance, 50% on semester 1 enrollment); 3-year renewable validity with 90-day review period.',
  preferredPaymentTerms: 'Net 30 days via direct SEPA/SWIFT wire transfer upon official student enrollment census date.',
  updatedAt: Date.now()
};

export function getTieupPolicies() {
  const db = getDatabase();
  try {
    const row = db.prepare(`SELECT * FROM tieup_policies WHERE id = 'default_policies'`).get();
    if (!row) {
      saveTieupPolicies(DEFAULT_TIEUP_POLICIES);
      return DEFAULT_TIEUP_POLICIES;
    }
    return {
      id: row.id,
      minCommissionPercent: row.min_commission_percent != null ? Number(row.min_commission_percent) : 15,
      targetCommissionPercent: row.target_commission_percent != null ? Number(row.target_commission_percent) : 20,
      partnershipCriteria: row.partnership_criteria || DEFAULT_TIEUP_POLICIES.partnershipCriteria,
      studentRequirementsGuidelines: row.student_requirements_guidelines || DEFAULT_TIEUP_POLICIES.studentRequirementsGuidelines,
      termsExpectations: row.terms_expectations || DEFAULT_TIEUP_POLICIES.termsExpectations,
      preferredPaymentTerms: row.preferred_payment_terms || DEFAULT_TIEUP_POLICIES.preferredPaymentTerms,
      updatedAt: row.updated_at || Date.now(),
    };
  } catch {
    return DEFAULT_TIEUP_POLICIES;
  }
}

export function saveTieupPolicies(policies) {
  const db = getDatabase();
  const id = 'default_policies';
  const minCommissionPercent = policies.minCommissionPercent != null ? Number(policies.minCommissionPercent) : 15;
  const targetCommissionPercent = policies.targetCommissionPercent != null ? Number(policies.targetCommissionPercent) : 20;
  const partnershipCriteria = policies.partnershipCriteria || '';
  const studentRequirementsGuidelines = policies.studentRequirementsGuidelines || '';
  const termsExpectations = policies.termsExpectations || '';
  const preferredPaymentTerms = policies.preferredPaymentTerms || '';
  const updatedAt = Date.now();

  const stmt = db.prepare(`
    INSERT INTO tieup_policies (
      id, min_commission_percent, target_commission_percent,
      partnership_criteria, student_requirements_guidelines,
      terms_expectations, preferred_payment_terms, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      min_commission_percent = excluded.min_commission_percent,
      target_commission_percent = excluded.target_commission_percent,
      partnership_criteria = excluded.partnership_criteria,
      student_requirements_guidelines = excluded.student_requirements_guidelines,
      terms_expectations = excluded.terms_expectations,
      preferred_payment_terms = excluded.preferred_payment_terms,
      updated_at = excluded.updated_at
  `);

  stmt.run(
    id, minCommissionPercent, targetCommissionPercent,
    partnershipCriteria, studentRequirementsGuidelines,
    termsExpectations, preferredPaymentTerms, updatedAt
  );

  return {
    id,
    minCommissionPercent,
    targetCommissionPercent,
    partnershipCriteria,
    studentRequirementsGuidelines,
    termsExpectations,
    preferredPaymentTerms,
    updatedAt
  };
}

// -------------------------------------------------------------
// OUTREACH TRACKER OPERATIONS
// -------------------------------------------------------------

export function getAllOutreachLogs() {
  const db = getDatabase();
  const rows = db.prepare(`SELECT * FROM tieup_outreach_logs ORDER BY last_checked DESC`).all();
  return rows.map((r) => {
    let parsedSnapshot = null;
    if (r.lead_data_snapshot) {
      try {
        parsedSnapshot = JSON.parse(r.lead_data_snapshot);
      } catch {
        parsedSnapshot = null;
      }
    }
    return {
      id: r.id,
      leadId: r.lead_id,
      institutionName: r.institution_name,
      recipientEmail: r.recipient_email,
      recipientName: r.recipient_name,
      senderEmail: r.sender_email || 'partnerships@ila-academy.com',
      subject: r.subject,
      status: r.status,
      flagReason: r.flag_reason,
      spamScore: r.spam_score || 0,
      phase: r.phase || 'outreach',
      sentAt: r.sent_at || r.last_checked,
      lastFollowupAt: r.last_followup_at || null,
      followupCount: r.followup_count != null ? Number(r.followup_count) : 0,
      meetingScheduledAt: r.meeting_scheduled_at || '',
      meetingLink: r.meeting_link || '',
      meetingAgenda: r.meeting_agenda || '',
      meetingNotes: r.meeting_notes || '',
      responseExcerpt: r.response_excerpt || '',
      responseSentiment: r.response_sentiment || '',
      responseReceivedAt: r.response_received_at || null,
      aiSuggestedReply: r.ai_suggested_reply || '',
      aiSuggestedSubject: r.ai_suggested_subject || '',
      retryCount: r.retry_count != null ? Number(r.retry_count) : 0,
      leadDataSnapshot: parsedSnapshot,
      lastChecked: r.last_checked,
    };
  });
}

export function saveOutreachLog(log) {
  const db = getDatabase();
  const now = Date.now();
  const id = log.id || `outreach_log_${now}_${Math.random().toString(36).substring(2, 8)}`;
  const snapshotStr = log.leadDataSnapshot
    ? (typeof log.leadDataSnapshot === 'object' ? JSON.stringify(log.leadDataSnapshot) : log.leadDataSnapshot)
    : '';

  const stmt = db.prepare(`
    INSERT INTO tieup_outreach_logs (
      id, lead_id, institution_name, recipient_email, recipient_name, subject, status, flag_reason, spam_score,
      phase, sent_at, last_followup_at, followup_count, meeting_scheduled_at, meeting_link, meeting_agenda, meeting_notes,
      lead_data_snapshot, sender_email, response_excerpt, response_sentiment, response_received_at, ai_suggested_reply, ai_suggested_subject, retry_count, last_checked
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      status = excluded.status,
      flag_reason = excluded.flag_reason,
      spam_score = excluded.spam_score,
      phase = excluded.phase,
      sent_at = excluded.sent_at,
      last_followup_at = excluded.last_followup_at,
      followup_count = excluded.followup_count,
      meeting_scheduled_at = excluded.meeting_scheduled_at,
      meeting_link = excluded.meeting_link,
      meeting_agenda = excluded.meeting_agenda,
      meeting_notes = excluded.meeting_notes,
      lead_data_snapshot = excluded.lead_data_snapshot,
      sender_email = excluded.sender_email,
      response_excerpt = excluded.response_excerpt,
      response_sentiment = excluded.response_sentiment,
      response_received_at = excluded.response_received_at,
      ai_suggested_reply = excluded.ai_suggested_reply,
      ai_suggested_subject = excluded.ai_suggested_subject,
      retry_count = excluded.retry_count,
      last_checked = excluded.last_checked
  `);
  stmt.run(
    id,
    log.leadId || null,
    log.institutionName || '',
    log.recipientEmail,
    log.recipientName || '',
    log.subject || '',
    log.status || 'delivered',
    log.flagReason || '',
    log.spamScore || 0,
    log.phase || 'outreach',
    log.sentAt || now,
    log.lastFollowupAt || null,
    log.followupCount != null ? Number(log.followupCount) : 0,
    log.meetingScheduledAt || '',
    log.meetingLink || '',
    log.meetingAgenda || '',
    log.meetingNotes || '',
    snapshotStr,
    log.senderEmail || 'partnerships@ila-academy.com',
    log.responseExcerpt || '',
    log.responseSentiment || '',
    log.responseReceivedAt || null,
    log.aiSuggestedReply || '',
    log.aiSuggestedSubject || '',
    log.retryCount != null ? Number(log.retryCount) : 0,
    log.lastChecked || now
  );
  return {
    ...log,
    id,
    phase: log.phase || 'outreach',
    sentAt: log.sentAt || now,
    lastFollowupAt: log.lastFollowupAt || null,
    followupCount: log.followupCount != null ? Number(log.followupCount) : 0,
    meetingScheduledAt: log.meetingScheduledAt || '',
    meetingLink: log.meetingLink || '',
    meetingAgenda: log.meetingAgenda || '',
    meetingNotes: log.meetingNotes || '',
    senderEmail: log.senderEmail || 'partnerships@ila-academy.com',
    responseExcerpt: log.responseExcerpt || '',
    responseSentiment: log.responseSentiment || '',
    responseReceivedAt: log.responseReceivedAt || null,
    aiSuggestedReply: log.aiSuggestedReply || '',
    aiSuggestedSubject: log.aiSuggestedSubject || '',
    retryCount: log.retryCount != null ? Number(log.retryCount) : 0,
    leadDataSnapshot: log.leadDataSnapshot || null,
    lastChecked: log.lastChecked || now,
  };
}

// -------------------------------------------------------------
// STATS & DIAGNOSTICS
// -------------------------------------------------------------

export function getDbStats() {
  const db = getDatabase();
  const sessionsCount = db.prepare(`SELECT COUNT(*) AS count FROM chat_sessions`).get()?.count || 0;
  const coursesCount = db.prepare(`SELECT COUNT(*) AS count FROM library_courses`).get()?.count || 0;
  const permanentCoursesCount = db.prepare(`SELECT COUNT(*) AS count FROM permanent_courses`).get()?.count || 0;
  const historyCount = db.prepare(`SELECT COUNT(*) AS count FROM chat_history`).get()?.count || 0;
  const categoriesCount = db.prepare(`SELECT COUNT(*) AS count FROM course_categories`).get()?.count || 0;
  const tieupLeadsCount = db.prepare(`SELECT COUNT(*) AS count FROM tieup_leads`).get()?.count || 0;
  const outreachLogsCount = db.prepare(`SELECT COUNT(*) AS count FROM tieup_outreach_logs`).get()?.count || 0;

  let fileSizeBytes = 0;
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      fileSizeBytes = fs.statSync(DB_FILE_PATH).size;
    }
  } catch {
    // Ignore stat error
  }

  return {
    dbPath: DB_FILE_PATH,
    relativeDbPath: 'data/course_creator.db',
    fileSizeBytes,
    sessionsCount,
    coursesCount,
    permanentCoursesCount,
    historyCount,
    categoriesCount,
    tieupLeadsCount,
    outreachLogsCount,
  };
}

