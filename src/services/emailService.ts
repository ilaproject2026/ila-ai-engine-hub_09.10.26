import emailjs from '@emailjs/browser';
import type { TieupLeadItem, OutreachStatusLogItem } from './dbService';

export interface EmailJsConfig {
  serviceId: string;
  templateId: string;
  publicKey: string;
  senderEmail?: string;
}

export interface EmailJsSendResult {
  success: boolean;
  status?: number;
  text?: string;
  error?: string;
}

export interface EmailJsBulkResult {
  total: number;
  deliveredCount: number;
  failedCount: number;
  logs: OutreachStatusLogItem[];
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
      // Upper-case token aliases
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
}): Promise<EmailJsSendResult> {
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
    // Upper-case token aliases
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
