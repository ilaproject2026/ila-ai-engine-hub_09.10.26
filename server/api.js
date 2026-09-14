import {
  getAllSessions,
  getSessionById,
  saveSession,
  updateSessionTitle,
  togglePinSession,
  deleteSession,
  clearAllSessions,
  importSessions,
  getAllCourses,
  getCourseById,
  saveCourse,
  deleteCourse,
  clearAllCourses,
  toggleChapterCompletion,
  importCourses,
  getAllHistory,
  saveHistoryItem,
  deleteHistoryItem,
  clearAllHistory,
  getAllCategories,
  saveCategory,
  deleteCategory,
  clearAllCategories,
  getDbStats,
  getAllPermanentCourses,
  getPermanentCourseById,
  savePermanentCourse,
  deletePermanentCourse,
  recordCourseDownload,
  getAllTieupLeads,
  saveTieupLead,
  saveTieupLeadsBatch,
  deleteTieupLead,
  clearTieupLeads,
  togglePartnerStatus,
  getAllPartners,
  getTieupPolicies,
  saveTieupPolicies,
  getAllOutreachLogs,
  saveOutreachLog,
  deleteOutreachLog,
  clearOutreachLogs,
} from './db.js';
import {
  verifySmtpConnection,
  sendBatchOutreach,
  sendOutreachEmail,
} from './smtpService.js';
import {
  getOAuthStatus,
  saveClientCredentials,
  startLocalAuth,
  logoutOAuth,
  sendBatchOAuthOutreach,
  sendGmailOAuthEmail,
} from './googleAuthService.js';

/**
 * Helper to read request JSON body
 */
export async function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      // Safeguard: 50MB max body
      if (body.length > 50 * 1024 * 1024) {
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        if (!body.trim()) return resolve({});
        const parsed = JSON.parse(body);
        resolve(parsed);
      } catch (err) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

/**
 * Helper to send JSON response safely without double-headers
 */
export function sendJson(res, statusCode, data) {
  if (!res || res.headersSent || res.writableEnded) {
    return true;
  }
  try {
    res.writeHead(statusCode, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    res.end(JSON.stringify(data));
  } catch (err) {
    console.error('[sendJson write error]:', err);
  }
  return true;
}

/**
 * Main API Request Handler
 */
export async function handleApiRequest(req, res) {
  const parsedUrl = new URL(req.url || '/', 'http://localhost');
  const pathname = parsedUrl.pathname || '';
  const method = req.method ? req.method.toUpperCase() : 'GET';

  // Handle CORS Preflight
  if (method === 'OPTIONS') {
    if (!res.headersSent && !res.writableEnded) {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      });
      res.end();
    }
    return true;
  }

  // Only handle /api/* routes
  if (!pathname.startsWith('/api/')) {
    return false;
  }

  const endpoint = pathname.replace(/^\/api/, '');

  try {
    // -------------------------------------------------------------
    // HEALTH & STATS
    // -------------------------------------------------------------
    if (endpoint === '/health' && method === 'GET') {
      const stats = getDbStats();
      sendJson(res, 200, {
        status: 'ok',
        engine: 'SQLite (node:sqlite)',
        ...stats,
      });
      return true;
    }

    // -------------------------------------------------------------
    // CHAT SESSIONS ROUTES
    // -------------------------------------------------------------
    if (endpoint === '/sessions' && method === 'GET') {
      const sessions = getAllSessions();
      sendJson(res, 200, { sessions });
      return true;
    }

    if (endpoint === '/sessions' && method === 'POST') {
      const body = await readJsonBody(req);
      const sessionData = (body && body.session) ? body.session : body;
      const saved = saveSession(sessionData);
      sendJson(res, 200, { success: true, session: saved });
      return true;
    }

    if (endpoint === '/sessions' && method === 'DELETE') {
      clearAllSessions();
      sendJson(res, 200, { success: true });
      return true;
    }

    if (endpoint === '/sessions/import' && method === 'POST') {
      const body = await readJsonBody(req);
      const rawList = Array.isArray(body) ? body : body.sessions || [];
      const count = importSessions(rawList);
      sendJson(res, 200, { count });
      return true;
    }

    const sessionMatch = endpoint.match(/^\/sessions\/([^/]+)$/);
    if (sessionMatch) {
      const sessionId = decodeURIComponent(sessionMatch[1]);
      if (method === 'GET') {
        const session = getSessionById(sessionId);
        if (!session) return sendJson(res, 404, { error: 'Session not found' });
        sendJson(res, 200, { session });
        return true;
      }
      if (method === 'DELETE') {
        deleteSession(sessionId);
        sendJson(res, 200, { success: true });
        return true;
      }
    }

    const sessionTitleMatch = endpoint.match(/^\/sessions\/([^/]+)\/title$/);
    if (sessionTitleMatch && (method === 'PUT' || method === 'POST')) {
      const sessionId = decodeURIComponent(sessionTitleMatch[1]);
      const body = await readJsonBody(req);
      const updated = updateSessionTitle(sessionId, body.title || '');
      sendJson(res, 200, { session: updated });
      return true;
    }

    const sessionPinMatch = endpoint.match(/^\/sessions\/([^/]+)\/pin$/);
    if (sessionPinMatch && (method === 'PUT' || method === 'POST')) {
      const sessionId = decodeURIComponent(sessionPinMatch[1]);
      const isPinned = togglePinSession(sessionId);
      sendJson(res, 200, { isPinned });
      return true;
    }

    // -------------------------------------------------------------
    // LIBRARY COURSES ROUTES
    // -------------------------------------------------------------
    if (endpoint === '/courses' && method === 'GET') {
      const courses = getAllCourses();
      sendJson(res, 200, { courses });
      return true;
    }

    if (endpoint === '/courses' && method === 'DELETE') {
      clearAllCourses();
      sendJson(res, 200, { success: true });
      return true;
    }

    if (endpoint === '/courses' && method === 'POST') {
      const body = await readJsonBody(req);
      const saved = saveCourse(body);
      sendJson(res, 200, { course: saved });
      return true;
    }

    if (endpoint === '/courses/import' && method === 'POST') {
      const body = await readJsonBody(req);
      const rawList = Array.isArray(body) ? body : body.courses || [];
      const count = importCourses(rawList);
      sendJson(res, 200, { count });
      return true;
    }

    const courseMatch = endpoint.match(/^\/courses\/([^/]+)$/);
    if (courseMatch) {
      const courseId = decodeURIComponent(courseMatch[1]);
      if (method === 'GET') {
        const course = getCourseById(courseId);
        if (!course) return sendJson(res, 404, { error: 'Course not found' });
        sendJson(res, 200, { course });
        return true;
      }
      if (method === 'DELETE') {
        deleteCourse(courseId);
        sendJson(res, 200, { success: true });
        return true;
      }
    }

    const toggleChapterMatch = endpoint.match(/^\/courses\/([^/]+)\/toggle-chapter$/);
    if (toggleChapterMatch && method === 'POST') {
      const courseId = decodeURIComponent(toggleChapterMatch[1]);
      const body = await readJsonBody(req);
      const updated = toggleChapterCompletion(courseId, body.chapterId);
      sendJson(res, 200, { course: updated });
      return true;
    }

    // -------------------------------------------------------------
    // PERMANENT COURSES ROUTES (LOCKED / MANUAL DELETION ONLY)
    // -------------------------------------------------------------
    if (endpoint === '/permanent-courses' && method === 'GET') {
      const courses = getAllPermanentCourses();
      sendJson(res, 200, { courses });
      return true;
    }

    if (endpoint === '/permanent-courses' && method === 'POST') {
      const body = await readJsonBody(req);
      const saved = savePermanentCourse(body);
      sendJson(res, 200, { success: true, course: saved });
      return true;
    }

    const permDownloadMatch = endpoint.match(/^\/permanent-courses\/([^/]+)\/download$/);
    if (permDownloadMatch && method === 'POST') {
      const courseId = decodeURIComponent(permDownloadMatch[1]);
      const body = await readJsonBody(req);
      recordCourseDownload(courseId, body.format || 'docx');
      sendJson(res, 200, { success: true });
      return true;
    }

    const permCourseMatch = endpoint.match(/^\/permanent-courses\/([^/]+)$/);
    if (permCourseMatch) {
      const courseId = decodeURIComponent(permCourseMatch[1]);
      if (method === 'GET') {
        const course = getPermanentCourseById(courseId);
        if (!course) return sendJson(res, 404, { error: 'Permanent course not found' });
        sendJson(res, 200, { course });
        return true;
      }
      if (method === 'DELETE') {
        const body = await readJsonBody(req);
        const success = deletePermanentCourse(courseId, body.manualConfirm === true);
        if (!success) {
          return sendJson(res, 403, {
            error: 'Cannot delete locked permanent course without manual confirmation',
          });
        }
        sendJson(res, 200, { success: true });
        return true;
      }
    }

    // -------------------------------------------------------------
    // CHAT HISTORY ROUTES (LEGACY COMPATIBILITY)
    // -------------------------------------------------------------
    if (endpoint === '/history' && method === 'GET') {
      const history = getAllHistory();
      sendJson(res, 200, { history });
      return true;
    }

    if (endpoint === '/history' && method === 'POST') {
      const body = await readJsonBody(req);
      const saved = saveHistoryItem(body);
      sendJson(res, 200, { item: saved });
      return true;
    }

    if (endpoint === '/history' && method === 'DELETE') {
      clearAllHistory();
      sendJson(res, 200, { success: true });
      return true;
    }

    const historyItemMatch = endpoint.match(/^\/history\/([^/]+)$/);
    if (historyItemMatch && method === 'DELETE') {
      const id = decodeURIComponent(historyItemMatch[1]);
      deleteHistoryItem(id);
      sendJson(res, 200, { success: true });
      return true;
    }

    // -------------------------------------------------------------
    // COURSE CATEGORIES ROUTES
    // -------------------------------------------------------------
    if (endpoint === '/categories' && method === 'GET') {
      const categories = getAllCategories();
      sendJson(res, 200, { categories });
      return true;
    }

    if (endpoint === '/categories' && method === 'POST') {
      const body = await readJsonBody(req);
      const saved = saveCategory(body);
      sendJson(res, 200, { category: saved });
      return true;
    }

    if (endpoint === '/categories' && method === 'DELETE') {
      clearAllCategories();
      sendJson(res, 200, { success: true });
      return true;
    }

    const categoryItemMatch = endpoint.match(/^\/categories\/([^/]+)$/);
    if (categoryItemMatch && method === 'DELETE') {
      const id = decodeURIComponent(categoryItemMatch[1]);
      deleteCategory(id);
      sendJson(res, 200, { success: true });
      return true;
    }

    // -------------------------------------------------------------
    // TIE-UP LEADS & RESEARCH REPOSITORY ROUTES
    // -------------------------------------------------------------
    if (endpoint === '/tieup-leads' && method === 'GET') {
      const sessionId = parsedUrl.searchParams.get('sessionId') || null;
      const leads = getAllTieupLeads(sessionId);
      sendJson(res, 200, { leads });
      return true;
    }

    if (endpoint === '/tieup-leads' && method === 'POST') {
      const body = await readJsonBody(req);
      const leadData = (body && body.lead) ? body.lead : body;
      const saved = saveTieupLead(leadData);
      sendJson(res, 200, { success: true, lead: saved });
      return true;
    }

    if (endpoint === '/tieup-leads/batch' && method === 'POST') {
      const body = await readJsonBody(req);
      const leadsList = Array.isArray(body) ? body : body.leads || [];
      const sessionId = body.sessionId || null;
      const saved = saveTieupLeadsBatch(leadsList, sessionId);
      sendJson(res, 200, { success: true, count: saved.length, leads: saved });
      return true;
    }

    if (endpoint === '/tieup-leads' && method === 'DELETE') {
      const sessionId = parsedUrl.searchParams.get('sessionId') || null;
      clearTieupLeads(sessionId);
      sendJson(res, 200, { success: true });
      return true;
    }

    const tieupLeadPartnerMatch = endpoint.match(/^\/tieup-leads\/([^/]+)\/partner$/);
    if (tieupLeadPartnerMatch && (method === 'PUT' || method === 'POST')) {
      const id = decodeURIComponent(tieupLeadPartnerMatch[1]);
      const body = await readJsonBody(req);
      const isPartner = body.isPartner !== undefined ? Boolean(body.isPartner) : true;
      const updated = togglePartnerStatus(id, isPartner);
      sendJson(res, 200, { success: true, lead: updated });
      return true;
    }

    if (endpoint === '/tieup-partners' && method === 'GET') {
      const partners = getAllPartners();
      sendJson(res, 200, { partners });
      return true;
    }

    if (endpoint === '/tieup-policies' && method === 'GET') {
      const policies = getTieupPolicies();
      sendJson(res, 200, { policies });
      return true;
    }

    if (endpoint === '/tieup-policies' && method === 'POST') {
      const body = await readJsonBody(req);
      const saved = saveTieupPolicies(body);
      sendJson(res, 200, { success: true, policies: saved });
      return true;
    }

    const tieupLeadMatch = endpoint.match(/^\/tieup-leads\/([^/]+)$/);
    if (tieupLeadMatch && method === 'DELETE') {
      const id = decodeURIComponent(tieupLeadMatch[1]);
      deleteTieupLead(id);
      sendJson(res, 200, { success: true });
      return true;
    }

    // -------------------------------------------------------------
    // OUTREACH TRACKER & ANTI-SPAM STATUS LOGS
    // -------------------------------------------------------------
    if (endpoint === '/tieup-outreach-logs' && method === 'GET') {
      const logs = getAllOutreachLogs();
      sendJson(res, 200, { logs });
      return true;
    }

    if (endpoint === '/tieup-outreach-logs' && method === 'POST') {
      const body = await readJsonBody(req);
      const logData = (body && body.log) ? body.log : body;
      const saved = saveOutreachLog(logData);
      sendJson(res, 200, { success: true, log: saved });
      return true;
    }

    if (endpoint === '/tieup-outreach-logs' && method === 'DELETE') {
      clearOutreachLogs();
      sendJson(res, 200, { success: true });
      return true;
    }

    const tieupOutreachLogMatch = endpoint.match(/^\/tieup-outreach-logs\/([^/]+)$/);
    if (tieupOutreachLogMatch && method === 'DELETE') {
      const id = decodeURIComponent(tieupOutreachLogMatch[1]);
      deleteOutreachLog(id);
      sendJson(res, 200, { success: true });
      return true;
    }

    // -------------------------------------------------------------
    // GMAIL SMTP TRANSPORTER & BULK OUTREACH DISPATCH
    // -------------------------------------------------------------
    if (endpoint === '/outreach/verify-smtp' && method === 'POST') {
      try {
        const body = await readJsonBody(req);
        const rawUser = body.senderEmail || body.user || '';
        const rawPass = body.appPassword || body.pass || '';
        const trimmedEmail = typeof rawUser === 'string' ? rawUser.trim() : '';
        const trimmedPass = typeof rawPass === 'string' ? rawPass.trim() : '';

        const result = await verifySmtpConnection({
          user: trimmedEmail,
          pass: trimmedPass,
          port: body.port,
          host: body.host,
          secure: body.secure,
        });
        sendJson(res, 200, result);
      } catch (err) {
        console.error('[API /outreach/verify-smtp Error]:', err);
        sendJson(res, 500, {
          success: false,
          connected: false,
          statusCode: 500,
          errorType: 'SERVER_EXCEPTION',
          error: `Server exception during SMTP verification: ${err?.message || err}`,
        });
      }
      return true;
    }

    if (endpoint === '/outreach/dispatch-smtp' && method === 'POST') {
      try {
        const body = await readJsonBody(req);
        const rawUser = body.senderEmail || '';
        const rawPass = body.appPassword || '';
        const senderEmail = typeof rawUser === 'string' ? rawUser.trim() : '';
        const appPassword = typeof rawPass === 'string' ? rawPass.trim() : '';

        const result = await sendBatchOutreach({
          senderEmail,
          appPassword,
          subjectTemplate: body.subject,
          bodyTemplate: body.bodyTemplate,
          leads: body.leads || [],
        });
        sendJson(res, 200, result);
      } catch (err) {
        console.error('[API /outreach/dispatch-smtp Error]:', err);
        sendJson(res, 500, { success: false, error: err?.message || String(err) });
      }
      return true;
    }

    if (endpoint === '/outreach/send-single-smtp' && method === 'POST') {
      try {
        const body = await readJsonBody(req);
        const rawUser = body.senderEmail || '';
        const rawPass = body.appPassword || '';
        const senderEmail = typeof rawUser === 'string' ? rawUser.trim() : '';
        const appPassword = typeof rawPass === 'string' ? rawPass.trim() : '';

        const result = await sendOutreachEmail({
          from: senderEmail,
          to: typeof body.recipientEmail === 'string' ? body.recipientEmail.trim() : body.recipientEmail,
          subject: body.subject,
          text: body.body,
          appPassword,
        });
        sendJson(res, 200, result);
      } catch (err) {
        console.error('[API /outreach/send-single-smtp Error]:', err);
        sendJson(res, 500, { success: false, error: err?.message || String(err) });
      }
      return true;
    }

    // -------------------------------------------------------------
    // GOOGLE OAUTH 2.0 (@google-cloud/local-auth) & GMAIL API DISPATCH
    // (Bypasses SMTP port blocks and operates cleanly over HTTPS 443)
    // -------------------------------------------------------------
    if (endpoint === '/outreach/oauth-status' && method === 'GET') {
      try {
        const status = await getOAuthStatus();
        sendJson(res, 200, status);
      } catch (err) {
        console.error('[API /outreach/oauth-status Error]:', err);
        sendJson(res, 500, { configured: false, authenticated: false, error: err?.message || String(err) });
      }
      return true;
    }

    if (endpoint === '/outreach/oauth-save-credentials' && method === 'POST') {
      try {
        const body = await readJsonBody(req);
        const result = saveClientCredentials(body);
        sendJson(res, 200, result);
      } catch (err) {
        console.error('[API /outreach/oauth-save-credentials Error]:', err);
        sendJson(res, 400, { success: false, error: err?.message || String(err) });
      }
      return true;
    }

    if (endpoint === '/outreach/oauth-authenticate' && method === 'POST') {
      try {
        const body = await readJsonBody(req);
        const result = await startLocalAuth(body);
        sendJson(res, 200, result);
      } catch (err) {
        console.error('[API /outreach/oauth-authenticate Error]:', err);
        sendJson(res, 500, { success: false, error: err?.message || String(err) });
      }
      return true;
    }

    if (endpoint === '/outreach/oauth-logout' && method === 'POST') {
      try {
        const result = await logoutOAuth();
        sendJson(res, 200, result);
      } catch (err) {
        console.error('[API /outreach/oauth-logout Error]:', err);
        sendJson(res, 500, { success: false, error: err?.message || String(err) });
      }
      return true;
    }

    if (endpoint === '/outreach/dispatch-oauth' && method === 'POST') {
      try {
        const body = await readJsonBody(req);
        const result = await sendBatchOAuthOutreach({
          senderEmail: body.senderEmail,
          subjectTemplate: body.subject,
          bodyTemplate: body.bodyTemplate,
          leads: body.leads || [],
        });
        sendJson(res, 200, result);
      } catch (err) {
        console.error('[API /outreach/dispatch-oauth Error]:', err);
        sendJson(res, 500, { success: false, error: err?.message || String(err) });
      }
      return true;
    }

    if (endpoint === '/outreach/send-single-oauth' && method === 'POST') {
      try {
        const body = await readJsonBody(req);
        const result = await sendGmailOAuthEmail({
          from: body.senderEmail,
          to: typeof body.recipientEmail === 'string' ? body.recipientEmail.trim() : body.recipientEmail,
          subject: body.subject,
          text: body.body,
        });
        sendJson(res, 200, result);
      } catch (err) {
        console.error('[API /outreach/send-single-oauth Error]:', err);
        sendJson(res, 500, { success: false, error: err?.message || String(err) });
      }
      return true;
    }

    // -------------------------------------------------------------
    // REGIONAL MULTI-LANGUAGE TTS STREAMING PROXY ROUTE
    // (Used to stream native Malayalam, Tamil, Hindi, German, Arabic, etc. audio)
    // -------------------------------------------------------------
    if (endpoint === '/tts' && method === 'GET') {
      const q = parsedUrl.searchParams.get('q') || '';
      const tl = parsedUrl.searchParams.get('tl') || 'en';

      if (!q.trim()) {
        sendJson(res, 400, { error: 'Missing text parameter q' });
        return true;
      }

      const encoded = encodeURIComponent(q.trim());
      const targetUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(tl)}&client=tw-ob&q=${encoded}`;

      try {
        const fetchRes = await fetch(targetUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          },
        });

        if (!fetchRes.ok) {
          throw new Error(`TTS upstream error: ${fetchRes.status}`);
        }

        const arrayBuffer = await fetchRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        res.writeHead(200, {
          'Content-Type': 'audio/mpeg',
          'Content-Length': buffer.length,
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=86400',
        });
        res.end(buffer);
        return true;
      } catch (streamErr) {
        console.error('[TTS Proxy Error]:', streamErr);
        sendJson(res, 502, { error: 'Failed to fetch regional TTS audio stream', message: String(streamErr) });
        return true;
      }
    }

    // -------------------------------------------------------------
    // BULK MIGRATION SYNC ROUTE
    // (Used when browser IndexedDB data is migrated into SQLite)
    // -------------------------------------------------------------
    if (endpoint === '/sync/migrate' && method === 'POST') {
      const body = await readJsonBody(req);
      let sessionsCount = 0;
      let coursesCount = 0;
      let historyCount = 0;

      if (Array.isArray(body.sessions)) {
        sessionsCount = importSessions(body.sessions);
      }
      if (Array.isArray(body.courses)) {
        coursesCount = importCourses(body.courses);
      }
      if (Array.isArray(body.history)) {
        for (const h of body.history) {
          saveHistoryItem(h);
          historyCount++;
        }
      }

      sendJson(res, 200, {
        success: true,
        migrated: {
          sessions: sessionsCount,
          courses: coursesCount,
          history: historyCount,
        },
      });
      return true;
    }

    // Unmatched API route
    sendJson(res, 404, { error: `Endpoint not found: ${method} ${pathname}` });
    return true;
  } catch (err) {
    console.error(`[API Error] ${method} ${pathname}:`, err);
    sendJson(res, 500, {
      error: 'Internal Server Error',
      message: err instanceof Error ? err.message : String(err),
    });
    return true;
  }
}
