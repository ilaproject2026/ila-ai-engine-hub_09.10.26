import nodemailer from 'nodemailer';
import { saveOutreachLog } from './db.js';

/**
 * Creates a Gmail or custom SMTP transporter
 */
export function createMailTransporter(options = {}) {
  const user = options.user || process.env.GMAIL_USER || 'rafiaquafqu@gmail.com';
  const pass = options.pass || process.env.GMAIL_APP_PASSWORD || '';
  const host = options.host || process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(options.port || process.env.SMTP_PORT || 465);
  const secure = options.secure !== undefined ? Boolean(options.secure) : port === 465;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });

  return { transporter, user, pass, host, port, secure };
}

/**
 * Verifies SMTP connection to Gmail
 */
export async function verifySmtpConnection(options = {}) {
  try {
    const { transporter, user, pass } = createMailTransporter(options);
    if (!pass) {
      return {
        success: false,
        error: 'Missing Gmail App Password. Please provide a 16-character Google App Password.',
      };
    }
    await transporter.verify();
    return {
      success: true,
      message: `Successfully connected to Gmail SMTP server as ${user}. Ready for real-time outreach dispatch!`,
    };
  } catch (err) {
    console.error('[SMTP Verify Error]:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
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
  const { transporter, user, pass } = createMailTransporter({
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

  const info = await transporter.sendMail(mailOptions);
  return {
    success: true,
    messageId: info.messageId,
    response: info.response,
  };
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
    const recipientEmail = (lead.contactEmail || '').trim();
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
