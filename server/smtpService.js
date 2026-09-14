import nodemailer from 'nodemailer';
import { saveOutreachLog } from './db.js';

/**
 * Validates basic email address structure
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim());
}

/**
 * Diagnoses an SMTP error into a clear, actionable user message
 */
export function diagnoseSmtpError(err, { host, port, secure, user, pass } = {}) {
  const errMsg = err instanceof Error ? err.message : String(err || '');
  const code = err?.code || '';
  const response = String(err?.response || '');
  const responseCode = err?.responseCode;
  const sanitizedPass = String(pass || '');

  // 1. Authentication Failure (Bad credentials / Invalid App Password)
  if (
    code === 'EAUTH' ||
    responseCode === 535 ||
    response.includes('535') ||
    errMsg.includes('535') ||
    errMsg.toLowerCase().includes('username and password not accepted') ||
    errMsg.toLowerCase().includes('badcredentials')
  ) {
    let detail = 'Google rejected your email or App Password.';
    if (sanitizedPass.length !== 16) {
      detail += ` (Note: You entered ${sanitizedPass.length} characters; Google App Passwords must be exactly 16 characters).`;
    }
    return {
      errorType: 'AUTH_FAILED',
      actionableMessage: `Authentication Failed (535): ${detail} Please verify that: 1) 2-Step Verification is enabled on "${user}", and 2) You generated a 16-character App Password at https://myaccount.google.com/apppasswords (all spaces are automatically trimmed).`,
    };
  }

  // 2. Network Block / Connection Timeout
  if (
    code === 'ETIMEDOUT' ||
    code === 'ECONNREFUSED' ||
    code === 'ENOTFOUND' ||
    code === 'ESOCKETTIMEDOUT' ||
    errMsg.toLowerCase().includes('timeout') ||
    errMsg.includes('ETIMEDOUT')
  ) {
    return {
      errorType: 'NETWORK_BLOCK',
      actionableMessage: `Network Block / Connection Timeout (${code || 'ETIMEDOUT'}): Unable to connect to ${host} on port ${port} (${secure ? 'SSL' : 'TLS'}). Outbound SMTP traffic on this port may be blocked by your local network, firewall, antivirus, or ISP. Try using port ${port === 465 ? '587 (TLS/STARTTLS)' : '465 (SSL)'}.`,
    };
  }

  // 3. SSL / TLS Protocol or Port Mismatch
  if (
    code === 'ESOCKET' ||
    errMsg.includes('wrong version number') ||
    errMsg.includes('SSL routines') ||
    errMsg.includes('handshake failure')
  ) {
    return {
      errorType: 'PORT_OR_SSL_MISMATCH',
      actionableMessage: `Port / Protocol Mismatch: SSL/TLS handshake failed with ${host}:${port}. Port 465 requires direct SSL (secure: true), whereas Port 587 requires STARTTLS (secure: false).`,
    };
  }

  // 4. Rate Limiting or Temporary Google Service Deferral
  if (responseCode === 421 || responseCode === 451 || errMsg.includes('421') || errMsg.includes('Too many')) {
    return {
      errorType: 'RATE_LIMITED',
      actionableMessage: `Google SMTP Rate Limit (${responseCode}): Gmail is temporarily deferring connections from your IP. Please wait a few minutes before retrying.`,
    };
  }

  // Generic fallback with raw error details
  return {
    errorType: 'UNKNOWN_SMTP_ERROR',
    actionableMessage: `SMTP Connection Error (${code || 'ERROR'}): ${errMsg}`,
  };
}

/**
 * Creates a Gmail or custom SMTP transporter with clean whitespace trimming
 * and explicit TLS/SSL settings (Port 465 with secure: true, Port 587 with secure: false and requireTLS: true)
 */
export function createMailTransporter(options = {}) {
  const rawUser = options.user || options.senderEmail || process.env.GMAIL_USER || 'rafiaquafqu@gmail.com';
  const rawPass = options.pass || options.appPassword || process.env.GMAIL_APP_PASSWORD || '';

  // Sanitize: trim email and strip ALL whitespace from the 16-character App Password
  const user = (rawUser || '').trim();
  const pass = (rawPass || '').replace(/\s+/g, '').trim();

  const host = (options.host || process.env.SMTP_HOST || 'smtp.gmail.com').trim();
  const port = Number(options.port || process.env.SMTP_PORT || 465);

  // Strict TLS/SSL configuration:
  // Port 465 requires direct SSL (secure: true, requireTLS: false)
  // Port 587 requires explicit STARTTLS (secure: false, requireTLS: true)
  const isPort465 = port === 465;
  const secure = options.secure !== undefined ? Boolean(options.secure) : isPort465;
  const requireTLS = options.requireTLS !== undefined ? Boolean(options.requireTLS) : (!secure || port === 587);

  const transportConfig = {
    host,
    port,
    secure,
    requireTLS,
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: true,
      minVersion: 'TLSv1.2',
      servername: host, // Guarantees SNI certificate handshake match with Google's servers
    },
    connectionTimeout: 10000,
    greetingTimeout: 8000,
    socketTimeout: 15000,
  };

  const transporter = nodemailer.createTransport(transportConfig);

  return { transporter, user, pass, host, port, secure, requireTLS, transportConfig };
}

/**
 * Verifies SMTP connection to Gmail with comprehensive validation and fallback diagnostics
 */
export async function verifySmtpConnection(options = {}) {
  const rawUser = options.user || options.senderEmail || process.env.GMAIL_USER || '';
  const rawPass = options.pass || options.appPassword || process.env.GMAIL_APP_PASSWORD || '';

  const user = (rawUser || '').trim();
  const pass = (rawPass || '').replace(/\s+/g, '').trim();

  // 1. Validate Sender Email
  if (!user) {
    return {
      success: false,
      connected: false,
      statusCode: 400,
      errorType: 'VALIDATION_ERROR',
      error: 'Sender email address is required. Please enter your Gmail / Google Workspace address.',
      details: { field: 'senderEmail' },
    };
  }

  if (!isValidEmail(user)) {
    return {
      success: false,
      connected: false,
      statusCode: 400,
      errorType: 'VALIDATION_ERROR',
      error: `Invalid sender email address "${user}". Please provide a valid email format (e.g. user@gmail.com).`,
      details: { field: 'senderEmail', user },
    };
  }

  // 2. Validate App Password
  if (!pass) {
    return {
      success: false,
      connected: false,
      statusCode: 400,
      errorType: 'MISSING_PASSWORD',
      error: 'Missing Gmail App Password. Please provide your 16-character Google App Password (all spaces are automatically trimmed).',
      details: { field: 'appPassword', user },
    };
  }

  const { transporter, host, port, secure, requireTLS } = createMailTransporter({ ...options, user, pass });

  try {
    await transporter.verify();
    return {
      success: true,
      connected: true,
      statusCode: 200,
      message: `Successfully connected to Gmail SMTP server (${host}:${port}, ${secure ? 'SSL port 465' : 'STARTTLS port 587'}) as ${user}. Ready for real-time outreach dispatch!`,
      details: {
        host,
        port,
        secure,
        requireTLS,
        user,
      },
    };
  } catch (primaryErr) {
    const is535Auth =
      primaryErr?.code === 'EAUTH' ||
      primaryErr?.responseCode === 535 ||
      String(primaryErr?.response || '').includes('535') ||
      String(primaryErr?.message || '').includes('535') ||
      String(primaryErr?.message || '').toLowerCase().includes('username and password not accepted') ||
      String(primaryErr?.message || '').toLowerCase().includes('badcredentials');

    // Robust 535 Authentication Error Catching & Console Debugging
    if (is535Auth) {
      console.error(`
================================================================================
[GMAIL SMTP AUTHENTICATION FAILED - 535 ERROR DETECTED]
--------------------------------------------------------------------------------
Timestamp       : ${new Date().toISOString()}
Target Server   : ${host}:${port} (${secure ? 'Direct SSL' : 'STARTTLS'})
Sender Account  : ${user}
Password Length : ${pass.length} chars ${pass.length === 16 ? '(Format: 16 chars OK)' : `(WARNING: Expected 16 chars, got ${pass.length})`}
Nodemailer Code : ${primaryErr?.code || 'EAUTH'}
SMTP Status Code: ${primaryErr?.responseCode || 535}
SMTP Command    : ${primaryErr?.command || 'AUTH PLAIN / AUTH LOGIN'}
Google Response : ${primaryErr?.response || primaryErr?.message}
--------------------------------------------------------------------------------
DIAGNOSIS & REMEDIATION CHECKLIST:
1. Ensure 2-Step Verification is active on the Google Account: "${user}".
2. Generate an App Password specifically for this account:
   -> Go to: https://myaccount.google.com/apppasswords
   -> App name: Select "Mail" or enter "Ila Academy Outreach"
   -> Copy the 16-character code (e.g. "abcd efgh ijkl mnop").
3. DO NOT use your personal Google account sign-in password.
4. Note: Whitespace is automatically stripped before authentication.
================================================================================
      `);

      let lengthHint = '';
      if (pass.length !== 16) {
        lengthHint = ` You entered ${pass.length} characters, but Google App Passwords must be exactly 16 characters.`;
      }

      return {
        success: false,
        connected: false,
        statusCode: 535,
        errorType: 'AUTH_FAILED',
        error: `Authentication Failed (535): Google rejected your Gmail address or App Password.${lengthHint} Please check 2-Step Verification and verify your 16-character App Password at https://myaccount.google.com/apppasswords.`,
        diagnosis: {
          summary: `Google SMTP rejected authentication for "${user}".`,
          recommendation: 'Verify that 2-Step Verification is enabled and generate a fresh 16-character App Password.',
          checklist: [
            `Verify sender email address matches exactly: "${user}"`,
            'Ensure 2-Step Verification is enabled on your Google Account',
            'Generate a new 16-character App Password at https://myaccount.google.com/apppasswords',
            'Do not use your main Google account password',
          ],
        },
        details: {
          host,
          port,
          secure,
          requireTLS,
          user,
          passwordLength: pass.length,
          responseCode: 535,
          code: primaryErr?.code || 'EAUTH',
        },
        rawError: primaryErr instanceof Error ? primaryErr.message : String(primaryErr),
      };
    }

    console.error(`[SMTP Verify Error on ${host}:${port}]:`, primaryErr);

    // Automatic Fallback Check: If port 465 timed out or was blocked, attempt port 587 (TLS)
    if (
      port === 465 &&
      (primaryErr?.code === 'ETIMEDOUT' || primaryErr?.code === 'ECONNREFUSED' || primaryErr?.message?.includes('timeout'))
    ) {
      try {
        console.log('[SMTP Verify]: Port 465 timed out. Testing port 587 (TLS/STARTTLS) as fallback...');
        const fallback = createMailTransporter({ ...options, user, pass, port: 587, secure: false, requireTLS: true });
        await fallback.transporter.verify();
        return {
          success: true,
          connected: true,
          statusCode: 200,
          message: `Successfully connected to Gmail SMTP server via Port 587 (TLS/STARTTLS) as ${user}. (Note: Port 465 was blocked on your local network, but Port 587 succeeded!)`,
          details: {
            host,
            port: 587,
            secure: false,
            requireTLS: true,
            user,
          },
        };
      } catch (fallbackErr) {
        console.error('[SMTP Verify Fallback Error on 587]:', fallbackErr);
      }
    }

    const diagnosis = diagnoseSmtpError(primaryErr, { host, port, secure, user, pass });
    return {
      success: false,
      connected: false,
      statusCode: primaryErr?.responseCode || 500,
      error: diagnosis.actionableMessage,
      errorType: diagnosis.errorType,
      rawError: primaryErr instanceof Error ? primaryErr.message : String(primaryErr),
      details: {
        host,
        port,
        secure,
        requireTLS,
        user,
      },
    };
  }
}

/**
 * Replace email template tokens with lead data
 */
export function personalizeEmailTemplate(template, lead) {
  if (!template) return '';
  const contactPerson = lead.contactPerson || 'Admissions Liaison';
  const instName = lead.name || 'Educational Partner';
  const commPercent = lead.commissionPercent != null ? `${lead.commissionPercent}%` : '20%';
  const courses = Array.isArray(lead.courseList) && lead.courseList.length > 0
    ? lead.courseList.join(', ')
    : 'B.Sc. Applied Computing, Master of Science & Articulation Pathways';
  const mouLink = lead.directSourcePageUrl && lead.directSourcePageUrl !== 'Not Available'
    ? lead.directSourcePageUrl
    : 'https://ila-academy.com/partnerships/mou';

  return template
    .replace(/\{\{CONTACT_PERSON\}\}/g, contactPerson)
    .replace(/\{\{INSTITUTION_NAME\}\}/g, instName)
    .replace(/\{\{COMMISSION_PERCENT\}\}/g, commPercent)
    .replace(/\{\{COURSES\}\}/g, courses)
    .replace(/\{\{MOU_LINK\}\}/g, mouLink);
}

/**
 * Dispatches personalized outreach email to a single lead
 */
export async function sendOutreachEmail({
  from,
  to,
  subject,
  html,
  text,
  appPassword,
}) {
  const { transporter, user, pass, host, port, secure } = createMailTransporter({
    user: from,
    pass: appPassword,
  });

  if (!pass) {
    return {
      success: false,
      isSimulated: true,
      messageId: `sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      error: 'Gmail App Password not provided. Running in simulated delivery mode.',
    };
  }

  const mailOptions = {
    from: `"Ila Academy Partnerships" <${from || user}>`,
    to,
    subject,
    text,
    html: html || text?.replace(/\n/g, '<br/>'),
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return {
      success: true,
      messageId: info.messageId,
      response: info.response,
    };
  } catch (err) {
    // If port 465 timed out or connection was refused, retry with Port 587 (TLS)
    if (
      port === 465 &&
      (err?.code === 'ETIMEDOUT' || err?.code === 'ECONNREFUSED' || err?.message?.includes('timeout'))
    ) {
      try {
        console.log(`[SMTP Send]: Port 465 timed out for ${to}. Retrying via Port 587 (TLS/STARTTLS)...`);
        const fallback = createMailTransporter({ user: from, pass: appPassword, port: 587, secure: false, requireTLS: true });
        const info = await fallback.transporter.sendMail(mailOptions);
        return {
          success: true,
          messageId: info.messageId,
          response: info.response,
        };
      } catch (fallbackErr) {
        console.error(`[SMTP Send Fallback Error on 587 for ${to}]:`, fallbackErr);
      }
    }

    const diag = diagnoseSmtpError(err, { host, port, secure, user, pass });
    return {
      success: false,
      error: diag.actionableMessage,
      errorType: diag.errorType,
      rawError: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Dispatches bulk personalized outreach emails to multiple leads simultaneously
 */
export async function sendBatchOutreach({
  senderEmail = 'rafiaquafqu@gmail.com',
  appPassword = '',
  subjectTemplate = 'Bilateral Partnership MOU & Institutional Articulation - Ila Academy',
  bodyTemplate = '',
  leads = [],
}) {
  const now = Date.now();
  const results = [];
  const generatedLogs = [];

  for (const lead of leads) {
    const recipientEmail = (lead.contactEmail || lead.email || lead.recipientEmail || '').trim();
    if (!recipientEmail) continue;

    const personalizedSubject = personalizeEmailTemplate(subjectTemplate, lead);
    const personalizedBody = personalizeEmailTemplate(bodyTemplate, lead);
    const isGeneric = recipientEmail.includes('noreply') || recipientEmail.includes('info@');

    let sendResult;
    try {
      sendResult = await sendOutreachEmail({
        from: senderEmail,
        to: recipientEmail,
        subject: personalizedSubject,
        text: personalizedBody,
        appPassword,
      });
    } catch (err) {
      console.error(`[SMTP Send Error for ${recipientEmail}]:`, err);
      sendResult = {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }

    const logStatus = isGeneric
      ? 'flagged_generic'
      : sendResult.success
      ? 'delivered'
      : sendResult.isSimulated
      ? 'delivered'
      : 'flagged_generic';

    const logItem = {
      id: `log_${now}_${Math.random().toString(36).substring(2, 7)}`,
      leadId: lead.id,
      institutionName: lead.name || 'Institution',
      recipientEmail,
      recipientName: lead.contactPerson || 'Admissions Liaison',
      senderEmail,
      subject: personalizedSubject,
      status: logStatus,
      flagReason: isGeneric
        ? 'Generic/robotic alias detected (noreply/info). Held for manual review.'
        : !sendResult.success && !sendResult.isSimulated
        ? `SMTP Error: ${sendResult.error}`
        : sendResult.isSimulated
        ? 'Simulated sandbox delivery (no Gmail App Password configured).'
        : undefined,
      spamScore: isGeneric ? 80 : 8,
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
      console.error('[DB Save Outreach Log Error]:', dbErr);
    }

    generatedLogs.push(logItem);
    results.push({
      leadId: lead.id,
      recipientEmail,
      institutionName: lead.name,
      success: sendResult.success || sendResult.isSimulated,
      isSimulated: sendResult.isSimulated || false,
      messageId: sendResult.messageId,
      error: sendResult.error,
      log: logItem,
    });
  }

  const deliveredCount = results.filter((r) => r.success && !r.error).length;
  const simulatedCount = results.filter((r) => r.isSimulated).length;
  const failedCount = results.filter((r) => !r.success && !r.isSimulated).length;

  return {
    success: true,
    total: results.length,
    deliveredCount,
    simulatedCount,
    failedCount,
    senderEmail,
    results,
    logs: generatedLogs,
  };
}
