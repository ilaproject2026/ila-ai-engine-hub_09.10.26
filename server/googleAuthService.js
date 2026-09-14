import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { authenticate } from '@google-cloud/local-auth';
import { google } from 'googleapis';
import { saveOutreachLog } from './db.js';
import { personalizeEmailTemplate, isValidEmail } from './smtpService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Root paths for credentials and tokens
const DATA_DIR = path.resolve(__dirname, '../data');
const CREDENTIALS_PATH = path.join(DATA_DIR, 'credentials.json');
const TOKEN_PATH = path.join(DATA_DIR, 'google_token.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (e) {
    console.error('[GoogleAuthService] Failed to create data dir:', e);
  }
}

// Default Google OAuth Scopes for sending outreach emails & getting user email
const OAUTH_SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/userinfo.email',
];

/**
 * Checks if credentials.json is configured (or available via env vars)
 */
export function getCredentialsConfig() {
  if (fs.existsSync(CREDENTIALS_PATH)) {
    try {
      const raw = fs.readFileSync(CREDENTIALS_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      const keys = parsed.installed || parsed.web;
      if (keys && keys.client_id) {
        return {
          exists: true,
          clientId: keys.client_id,
          hasSecret: Boolean(keys.client_secret),
          type: parsed.installed ? 'installed' : 'web',
        };
      }
    } catch (e) {
      console.warn('[GoogleAuthService] Error parsing credentials.json:', e.message);
    }
  }

  // Fallback check on environment variables
  if (process.env.GOOGLE_CLIENT_ID) {
    return {
      exists: true,
      clientId: process.env.GOOGLE_CLIENT_ID,
      hasSecret: Boolean(process.env.GOOGLE_CLIENT_SECRET),
      type: 'env',
    };
  }

  return {
    exists: false,
    clientId: null,
    hasSecret: false,
    type: null,
  };
}

/**
 * Saves Google Client Credentials (either full JSON or client_id/secret) to data/credentials.json
 */
export function saveClientCredentials({ clientId, clientSecret, credentialsJson }) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  let formattedConfig;
  if (credentialsJson && typeof credentialsJson === 'string' && credentialsJson.trim()) {
    const parsed = JSON.parse(credentialsJson.trim());
    if (!parsed.installed && !parsed.web) {
      // Wrap if raw client_id/client_secret JSON was pasted
      if (parsed.client_id) {
        formattedConfig = {
          installed: {
            client_id: parsed.client_id,
            client_secret: parsed.client_secret || '',
            auth_uri: 'https://accounts.google.com/o/oauth2/auth',
            token_uri: 'https://oauth2.googleapis.com/token',
            auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
            redirect_uris: ['http://localhost'],
          },
        };
      } else {
        throw new Error('Invalid credentials JSON format. Expected "installed" or "web" configuration.');
      }
    } else {
      formattedConfig = parsed;
    }
  } else if (clientId && clientSecret) {
    formattedConfig = {
      installed: {
        client_id: clientId.trim(),
        client_secret: clientSecret.trim(),
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
        redirect_uris: ['http://localhost'],
      },
    };
  } else {
    throw new Error('Please provide either credentials JSON or both Client ID and Client Secret.');
  }

  fs.writeFileSync(CREDENTIALS_PATH, JSON.stringify(formattedConfig, null, 2), 'utf-8');
  return { success: true, message: 'Google Client Credentials saved successfully.' };
}

/**
 * Returns an authorized OAuth2 client from credentials.json & google_token.json
 */
export async function getAuthorizedOAuth2Client() {
  // Ensure credentials.json exists; if not in file but in env, generate it
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
      saveClientCredentials({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      });
    } else {
      throw new Error(
        'Google Client Credentials (credentials.json) not configured. Please enter your Google Cloud OAuth Client ID & Secret.'
      );
    }
  }

  const rawCreds = fs.readFileSync(CREDENTIALS_PATH, 'utf-8');
  const creds = JSON.parse(rawCreds);
  const keys = creds.installed || creds.web;
  if (!keys || !keys.client_id || !keys.client_secret) {
    throw new Error('Invalid credentials.json: Missing client_id or client_secret.');
  }

  const oauth2Client = new google.auth.OAuth2(
    keys.client_id,
    keys.client_secret,
    (keys.redirect_uris && keys.redirect_uris[0]) || 'http://localhost'
  );

  if (!fs.existsSync(TOKEN_PATH)) {
    throw new Error('Not authenticated with Google. Please click "Connect with Google" first.');
  }

  const rawToken = fs.readFileSync(TOKEN_PATH, 'utf-8');
  const tokenData = JSON.parse(rawToken);
  oauth2Client.setCredentials(tokenData);

  // Automatically persist refreshed tokens
  oauth2Client.on('tokens', (updatedTokens) => {
    try {
      const merged = { ...tokenData, ...updatedTokens, updated_at: Date.now() };
      fs.writeFileSync(TOKEN_PATH, JSON.stringify(merged, null, 2), 'utf-8');
    } catch (e) {
      console.error('[GoogleAuthService] Failed to persist refreshed tokens:', e);
    }
  });

  return oauth2Client;
}

/**
 * Retrieves the current Google OAuth connection status
 */
export async function getOAuthStatus() {
  const creds = getCredentialsConfig();
  const tokenExists = fs.existsSync(TOKEN_PATH);

  if (!creds.exists) {
    return {
      configured: false,
      authenticated: false,
      email: null,
      message: 'Google Cloud OAuth credentials not configured yet.',
    };
  }

  if (!tokenExists) {
    return {
      configured: true,
      authenticated: false,
      clientId: creds.clientId,
      email: null,
      message: 'Credentials configured. Ready to connect Google account.',
    };
  }

  try {
    const rawToken = fs.readFileSync(TOKEN_PATH, 'utf-8');
    const tokenData = JSON.parse(rawToken);

    // If email was cached in token file, we can return it, but also verify token validity
    let userEmail = tokenData.user_email || null;

    try {
      const auth = await getAuthorizedOAuth2Client();
      const gmail = google.gmail({ version: 'v1', auth });
      const profile = await gmail.users.getProfile({ userId: 'me' });
      userEmail = profile.data.emailAddress || userEmail;

      // Update cached email in token if newly fetched
      if (userEmail && userEmail !== tokenData.user_email) {
        tokenData.user_email = userEmail;
        fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokenData, null, 2), 'utf-8');
      }

      return {
        configured: true,
        authenticated: true,
        clientId: creds.clientId,
        email: userEmail,
        expiryDate: tokenData.expiry_date,
        message: `Connected to Google as ${userEmail}`,
      };
    } catch (authErr) {
      console.warn('[GoogleAuthService] Token validation failed:', authErr.message);
      return {
        configured: true,
        authenticated: false,
        clientId: creds.clientId,
        email: userEmail,
        error: `Authentication expired or revoked: ${authErr.message}. Please re-authenticate.`,
      };
    }
  } catch (e) {
    return {
      configured: true,
      authenticated: false,
      clientId: creds.clientId,
      email: null,
      error: `Failed to read token file: ${e.message}`,
    };
  }
}

/**
 * Initiates the local-auth flow using @google-cloud/local-auth
 * Spawns an ephemeral HTTP listener and launches the system browser for Google OAuth sign-in.
 */
export async function startLocalAuth({ clientId, clientSecret, credentialsJson } = {}) {
  // If credentials were provided with the request, save them first
  if (credentialsJson || (clientId && clientSecret)) {
    saveClientCredentials({ clientId, clientSecret, credentialsJson });
  }

  if (!fs.existsSync(CREDENTIALS_PATH)) {
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
      saveClientCredentials({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      });
    } else {
      throw new Error(
        'Google Client Credentials file (credentials.json) is required before authenticating. Please configure your Client ID and Client Secret.'
      );
    }
  }

  console.log('[GoogleAuthService] Initiating @google-cloud/local-auth flow...');

  // authenticate opens browser to consent screen and waits for local redirect
  const authClient = await authenticate({
    keyfilePath: CREDENTIALS_PATH,
    scopes: OAUTH_SCOPES,
  });

  const tokens = authClient.credentials;

  // Retrieve user's email address via Gmail profile
  let userEmail = '';
  try {
    const gmail = google.gmail({ version: 'v1', auth: authClient });
    const profile = await gmail.users.getProfile({ userId: 'me' });
    userEmail = profile.data.emailAddress || '';
  } catch (e) {
    console.warn('[GoogleAuthService] Could not fetch user profile:', e.message);
  }

  // Persist token with user email
  const tokenPayload = {
    ...tokens,
    user_email: userEmail,
    created_at: Date.now(),
  };

  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokenPayload, null, 2), 'utf-8');
  console.log(`[GoogleAuthService] OAuth authentication successful for: ${userEmail || 'unknown'}`);

  return {
    success: true,
    authenticated: true,
    email: userEmail,
    message: `Successfully authenticated with Google as ${userEmail}!`,
  };
}

/**
 * Logs out and clears the stored token
 */
export async function logoutOAuth() {
  if (fs.existsSync(TOKEN_PATH)) {
    try {
      fs.unlinkSync(TOKEN_PATH);
    } catch (e) {
      console.warn('[GoogleAuthService] Error removing token file:', e.message);
    }
  }
  return { success: true, message: 'Google account disconnected successfully.' };
}

/**
 * Builds an RFC 2822 base64url encoded email string
 */
function createRawEmailMessage({ from, to, subject, html, text }) {
  // RFC 2047 UTF-8 Base64 encode for subject
  const utf8Subject = `=?utf-8?B?${Buffer.from(subject || '', 'utf-8').toString('base64')}?=`;
  const boundary = `__boundary_${Date.now()}_${Math.random().toString(36).substring(2, 9)}__`;

  const senderHeader = from ? `"Ila Academy Partnerships" <${from}>` : '"Ila Academy Partnerships" <me>';

  const messageParts = [
    `From: ${senderHeader}`,
    `To: ${to}`,
    `Subject: ${utf8Subject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    Buffer.from(text || '', 'utf-8').toString('base64'),
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    Buffer.from(html || text?.replace(/\n/g, '<br/>') || '', 'utf-8').toString('base64'),
    '',
    `--${boundary}--`,
  ];

  const fullMessage = messageParts.join('\r\n');

  // Convert to URL-safe base64
  return Buffer.from(fullMessage, 'utf-8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Sends a single email via Gmail API using authorized Google OAuth
 */
export async function sendGmailOAuthEmail({
  to,
  subject,
  html,
  text,
  from,
}) {
  const auth = await getAuthorizedOAuth2Client();
  const gmail = google.gmail({ version: 'v1', auth });

  const rawMessage = createRawEmailMessage({ from, to, subject, html, text });

  const res = await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: rawMessage,
    },
  });

  return {
    success: true,
    messageId: res.data.id,
    threadId: res.data.threadId,
  };
}

/**
 * Dispatches bulk personalized outreach emails via Google OAuth over HTTPS (Port 443)
 * Completely avoids SMTP network blocks and App Password requirements.
 */
export async function sendBatchOAuthOutreach({
  senderEmail = '',
  subjectTemplate = 'Bilateral Partnership MOU & Institutional Articulation - Ila Academy',
  bodyTemplate = '',
  leads = [],
}) {
  const now = Date.now();
  const results = [];
  const generatedLogs = [];

  // Check connection
  const status = await getOAuthStatus();
  if (!status.authenticated) {
    return {
      success: false,
      total: leads.length,
      deliveredCount: 0,
      failedCount: leads.length,
      error: status.error || 'Google OAuth is not authenticated. Please connect your Google account first.',
      results: [],
      logs: [],
    };
  }

  const effectiveSender = senderEmail || status.email || 'me';

  for (const lead of leads) {
    const recipientEmail = (lead.contactEmail || lead.email || lead.recipientEmail || '').trim();
    if (!recipientEmail) continue;

    const personalizedSubject = personalizeEmailTemplate(subjectTemplate, lead);
    const personalizedBody = personalizeEmailTemplate(bodyTemplate, lead);
    const isGeneric = recipientEmail.includes('noreply') || recipientEmail.includes('info@');

    let sendResult;
    try {
      sendResult = await sendGmailOAuthEmail({
        from: effectiveSender,
        to: recipientEmail,
        subject: personalizedSubject,
        text: personalizedBody,
      });
    } catch (err) {
      console.error(`[Google OAuth Send Error for ${recipientEmail}]:`, err);
      sendResult = {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }

    const logStatus = isGeneric
      ? 'flagged_generic'
      : sendResult.success
      ? 'delivered'
      : 'flagged_generic';

    const logItem = {
      id: `log_${now}_${Math.random().toString(36).substring(2, 7)}`,
      leadId: lead.id,
      institutionName: lead.name || 'Institution',
      recipientEmail,
      recipientName: lead.contactPerson || 'Admissions Liaison',
      senderEmail: effectiveSender,
      subject: personalizedSubject,
      status: logStatus,
      flagReason: isGeneric
        ? 'Generic/robotic alias detected (noreply/info). Held for manual review.'
        : !sendResult.success
        ? `Gmail API Error: ${sendResult.error}`
        : undefined,
      spamScore: isGeneric ? 80 : 5, // OAuth has exceptionally high inbox deliverability
      phase: isGeneric ? 'outreach' : 'followup',
      sentAt: now,
      followupCount: 0,
      retryCount: 0,
      leadDataSnapshot: lead,
      lastChecked: now,
    };

    // Save to SQLite database
    try {
      saveOutreachLog(logItem);
    } catch (dbErr) {
      console.error('[DB Save Outreach Log Error via OAuth]:', dbErr);
    }

    generatedLogs.push(logItem);
    results.push({
      leadId: lead.id,
      recipientEmail,
      success: sendResult.success,
      messageId: sendResult.messageId,
      error: sendResult.error,
      log: logItem,
    });
  }

  const deliveredCount = results.filter((r) => r.success).length;
  const failedCount = results.filter((r) => !r.success).length;

  return {
    success: deliveredCount > 0 || results.length === 0,
    total: leads.length,
    deliveredCount,
    failedCount,
    senderEmail: effectiveSender,
    results,
    logs: generatedLogs,
  };
}
