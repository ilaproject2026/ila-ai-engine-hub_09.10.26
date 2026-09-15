import emailjs from '@emailjs/browser';
import type { TieupLeadItem, OutreachStatusLogItem } from './dbService';

export type TransporterType = 'supabase_smtp' | 'emailjs';

export interface SupabaseSmtpConfig {
  host?: string;
  port?: number;
  secure?: boolean;
  user?: string;
  pass?: string;
  senderEmail?: string;
  senderName?: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
}

export interface EmailJsConfig {
  serviceId: string;
  templateId: string;
  publicKey: string;
  senderEmail?: string;
}

export interface EmailSendResult {
  success: boolean;
  status?: number;
  messageId?: string;
  text?: string;
  error?: string;
  isSimulated?: boolean;
}

export interface EmailBulkResult {
  total: number;
  deliveredCount: number;
  failedCount: number;
  logs: OutreachStatusLogItem[];
}

/**
 * Verifies Supabase SMTP connection by sending a live handshake through backend relay
 */
export async function verifySupabaseSmtpConnection(
  config: SupabaseSmtpConfig,
  testRecipient?: string
): Promise<{ success: boolean; message: string; details?: any }> {
  const host = (config.host || 'smtp.resend.com').trim();
  const port = Number(config.port || 587);
  const user = (config.user || config.senderEmail || '').trim();
  const pass = (config.pass || '').trim();
  const toEmail = (testRecipient || config.senderEmail || user || 'rafiaqua@gmail.com').trim();

  if (!user) {
    return { success: false, message: 'SMTP User / Sender Email is required.' };
  }
  if (!pass) {
    return { success: false, message: 'SMTP Password / API Key is required.' };
  }

  try {
    const res = await fetch('/api/outreach/verify-smtp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderEmail: toEmail,
        user,
        pass,
        host,
        port,
        secure: config.secure ?? (port === 465),
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success || data.connected) {
        return {
          success: true,
          message: data.message || `✓ Connected to Supabase SMTP relay (${host}:${port}) as ${user}!`,
          details: data.details,
        };
      }
      return {
        success: false,
        message: data.error || data.message || `SMTP Error from ${host}:${port}`,
      };
    }

    const errData = await res.json().catch(() => ({}));
    return {
      success: false,
      message: errData.error || errData.message || `HTTP ${res.status}: Failed to reach SMTP relay endpoint.`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Supabase SMTP connection failed: ${err.message || 'Check network or SMTP server settings.'}`,
    };
  }
}

/**
 * Dispatch single email via Supabase SMTP Transporter
 */
export async function sendSupabaseSmtpSingle(params: {
  config: SupabaseSmtpConfig;
  recipientEmail: string;
  recipientName?: string;
  subject: string;
  body: string;
  institutionName?: string;
  commissionPercent?: number;
  courses?: string;
  mouLink?: string;
}): Promise<EmailSendResult> {
  const { config, recipientEmail, subject, body } = params;
  const user = (config.user || config.senderEmail || '').trim();
  const pass = (config.pass || '').trim();
  const host = (config.host || 'smtp.resend.com').trim();
  const port = Number(config.port || 587);
  const senderEmail = (config.senderEmail || user || 'rafiaqua@gmail.com').trim();

  try {
    const res = await fetch('/api/outreach/send-single-smtp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderEmail,
        user,
        pass,
        host,
        port,
        secure: config.secure ?? (port === 465),
        senderName: config.senderName || 'Ila Academy Academic Partnerships',
        recipientEmail,
        subject,
        body,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return {
        success: Boolean(data.success),
        messageId: data.messageId,
        isSimulated: data.isSimulated,
        error: data.error,
      };
    }

    const errData = await res.json().catch(() => ({}));
    return {
      success: false,
      error: errData.error || `HTTP ${res.status} dispatch error`,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Supabase SMTP network dispatch failed',
    };
  }
}

/**
 * Dispatch bulk emails via Supabase SMTP Transporter
 */
export async function sendSupabaseSmtpBulk(params: {
  config: SupabaseSmtpConfig;
  senderEmail: string;
  subject: string;
  bodyTemplate: string;
  leads: TieupLeadItem[];
}): Promise<{
  success: boolean;
  total: number;
  deliveredCount: number;
  failedCount: number;
  results: any[];
  logs: OutreachStatusLogItem[];
}> {
  const { config, senderEmail, subject, bodyTemplate, leads } = params;
  const user = (config.user || senderEmail || '').trim();
  const pass = (config.pass || '').trim();
  const host = (config.host || 'smtp.resend.com').trim();
  const port = Number(config.port || 587);

  try {
    const res = await fetch('/api/outreach/dispatch-smtp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderEmail,
        user,
        pass,
        host,
        port,
        secure: config.secure ?? (port === 465),
        senderName: config.senderName || 'Ila Academy Academic Partnerships',
        subject,
        bodyTemplate,
        leads,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return data;
    }

    const errData = await res.json().catch(() => ({}));
    return {
      success: false,
      total: leads.length,
      deliveredCount: 0,
      failedCount: leads.length,
      results: [],
      logs: [],
    };
  } catch (err: any) {
    console.error('Supabase SMTP bulk dispatch error:', err);
    return {
      success: false,
      total: leads.length,
      deliveredCount: 0,
      failedCount: leads.length,
      results: [],
      logs: [],
    };
  }
}

/**
 * Verify EmailJS connection by sending a lightweight test message to the designated address
 */
export async function verifyEmailJsConnection(
  config: EmailJsConfig,
  testRecipient?: string
): Promise<{ success: boolean; message: string }> {
  const serviceId = config.serviceId?.trim();
  const templateId = config.templateId?.trim();
  const publicKey = config.publicKey?.trim();
  const toEmail = (testRecipient || config.senderEmail || '').trim();

  if (!serviceId) {
    return { success: false, message: 'EmailJS Service ID is required (e.g. service_xxxxxxx).' };
  }
  if (!templateId) {
    return { success: false, message: 'EmailJS Template ID is required (e.g. template_xxxxxxx).' };
  }
  if (!publicKey) {
    return { success: false, message: 'EmailJS Public Key is required (Account > Security).' };
  }
  if (!toEmail) {
    return { success: false, message: 'Sender/Target email is required to send verification handshake.' };
  }

  try {
    const testParams = {
      to_name: 'Ila Test Admin',
      to_email: toEmail,
      recipient_name: 'Ila Test Admin',
      recipient_email: toEmail,
      from_name: 'Ila Academy Partnership Engine',
      from_email: toEmail,
      reply_to: toEmail,
      subject: 'EmailJS Handshake Verification - Ila Academy',
      message:
        'This is a verification handshake confirming that your EmailJS integration (Service ID, Template ID, and Public Key) is functioning successfully from Ila Academy.',
      email_subject: 'EmailJS Handshake Verification - Ila Academy',
      email_body:
        'This is a verification handshake confirming that your EmailJS integration (Service ID, Template ID, and Public Key) is functioning successfully from Ila Academy.',
      institution_name: 'Ila Academy Verification Check',
      contact_person: 'Admissions Liaison',
      commission_percent: '20',
      courses: 'International Programs & Articulation',
      mou_link: 'https://ila-academy.de/mou/partner-draft',
      CONTACT_PERSON: 'Admissions Liaison',
      INSTITUTION_NAME: 'Ila Academy Verification Check',
      COMMISSION_PERCENT: '20',
      COURSES: 'International Programs & Articulation',
      MOU_LINK: 'https://ila-academy.de/mou/partner-draft',
    };

    const res = await emailjs.send(serviceId, templateId, testParams, publicKey);
    if (res.status === 200) {
      return {
        success: true,
        message: `✓ Connected! Test verification email successfully sent to ${toEmail} via EmailJS.`,
      };
    }
    return {
      success: false,
      message: `EmailJS responded with status: ${res.status} (${res.text || 'Unknown'})`,
    };
  } catch (err: any) {
    const errorMsg =
      err?.text ||
      err?.message ||
      (typeof err === 'string' ? err : 'Failed to send test email through EmailJS.');
    return {
      success: false,
      message: `EmailJS Connection Error: ${errorMsg}`,
    };
  }
}

/**
 * Dispatch single email via EmailJS
 */
export async function sendEmailJsSingle(params: {
  config: EmailJsConfig;
  recipientEmail: string;
  recipientName?: string;
  subject: string;
  body: string;
  institutionName?: string;
  commissionPercent?: number;
  courses?: string;
  mouLink?: string;
}): Promise<EmailSendResult> {
  const { config, recipientEmail, recipientName, subject, body } = params;
  const serviceId = config.serviceId?.trim();
  const templateId = config.templateId?.trim();
  const publicKey = config.publicKey?.trim();
  const fromEmail = (config.senderEmail || '').trim();

  if (!serviceId || !templateId || !publicKey) {
    return {
      success: false,
      error: 'Missing EmailJS configuration (Service ID, Template ID, or Public Key).',
    };
  }

  const templateParams = {
    to_name: recipientName || recipientEmail,
    to_email: recipientEmail,
    recipient_name: recipientName || recipientEmail,
    recipient_email: recipientEmail,
    from_name: 'Ila Academy Academic Partnerships',
    from_email: fromEmail || recipientEmail,
    reply_to: fromEmail || recipientEmail,
    subject,
    message: body,
    email_subject: subject,
    email_body: body,
    institution_name: params.institutionName || '',
    contact_person: recipientName || 'Admissions Liaison',
    commission_percent: String(params.commissionPercent || 15),
    courses: params.courses || 'Undergraduate & Graduate Articulation',
    mou_link: params.mouLink || 'https://ila-academy.de/mou/partner-draft',
    CONTACT_PERSON: recipientName || 'Admissions Liaison',
    INSTITUTION_NAME: params.institutionName || '',
    COMMISSION_PERCENT: String(params.commissionPercent || 15),
    COURSES: params.courses || 'Undergraduate & Graduate Articulation',
    MOU_LINK: params.mouLink || 'https://ila-academy.de/mou/partner-draft',
  };

  try {
    const res = await emailjs.send(serviceId, templateId, templateParams, publicKey);
    return {
      success: res.status === 200,
      status: res.status,
      text: res.text,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.text || err?.message || 'EmailJS dispatch failed',
    };
  }
}

/**
 * Replace dynamic template tokens in string
 */
export function substituteEmailTokens(
  template: string,
  lead: Partial<TieupLeadItem>
): string {
  const contactPerson = lead.contactPerson || 'Admissions Liaison';
  const instName = lead.name || 'Partner Institution';
  const commPercent = String(lead.commissionPercent || 15);
  const courses = (lead.courseList && lead.courseList.length > 0)
    ? lead.courseList.join(', ')
    : (lead as any)?.programs || 'Undergraduate & Graduate Articulation';
  const mouLink = lead.mouDocumentUrl || 'https://ila-academy.de/mou/partner-draft';

  return template
    .replace(/\{\{CONTACT_PERSON\}\}/gi, contactPerson)
    .replace(/\{\{INSTITUTION_NAME\}\}/gi, instName)
    .replace(/\{\{COMMISSION_PERCENT\}\}/gi, commPercent)
    .replace(/\{\{COURSES\}\}/gi, courses)
    .replace(/\{\{MOU_LINK\}\}/gi, mouLink);
}
