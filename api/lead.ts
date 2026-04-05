import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '100kb',
    },
  },
};

// ─────────────────────────────────────────────────────────────
// Security: Input sanitization
// ─────────────────────────────────────────────────────────────

const MAX_STRING_LENGTH = 2000;
const MAX_NOTES_LENGTH = 5000;
const MAX_LEAD_ID_LENGTH = 128;

/**
 * Strip HTML tags and control characters from any string field.
 * Prevents XSS payloads being stored in Airtable and echoed back.
 */
function stripHtml(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/<[^>]*>/g, '')       // strip all HTML/script tags
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')  // strip control chars
    .trim();
}

/**
 * Sanitize a general string field: strip HTML, enforce length limit.
 */
function sanitizeString(value: unknown, maxLen = MAX_STRING_LENGTH): string {
  const stripped = stripHtml(value);
  return stripped.slice(0, maxLen);
}

/**
 * Sanitize a lead_id: only alphanumeric, underscores, hyphens.
 * Prevents path traversal and formula injection via lead_id.
 */
function sanitizeLeadId(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.replace(/[^A-Za-z0-9_\-]/g, '').slice(0, MAX_LEAD_ID_LENGTH);
}

/**
 * Sanitize an email for safe use in Airtable filterByFormula.
 * Only escaping quotes is insufficient — strip any character that could
 * break out of the formula string context.
 */
function sanitizeEmailForFormula(email: string): string {
  return email
    .toLowerCase()
    .replace(/[^a-z0-9@._+\-]/g, '')  // strict allowlist for email chars
    .slice(0, 254);
}

/**
 * Sanitize a numeric field — return 0 for non-finite values.
 */
function sanitizeNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type LeadPayload = {
  lead_id: string;
  created_at: string;
  name: string;
  email: string;
  phone?: string;
  company: string;
  source: string;
  lead_sources?: string[];
  niche?: string;
  service_need: string;
  package_interest?: string;
  recommended_package?: string;
  qualification_status?: string;
  qualification_reason?: string;
  crm_used?: string;
  booking_link?: string;
  current_problem?: string;
  messages_per_day?: number;
  needs_booking?: boolean;
  multiple_offers?: boolean;
  needs_staff_routing?: boolean;
  owner?: string;
  next_action?: string;
  notes?: string;
};

type ActivityPayload = {
  activity_id: string;
  lead_id: string;
  tenant_id: string;
  event_name: string;
  event_timestamp: string;
  actor: string;
  status: string;
  details: string;
};

type MetadataPayload = {
  source_app: string;
  source_step: string;
  tenant_id: string;
  event_name: string;
  submitted_at: string;
  package_key?: string;
  package_label?: string;
  needs_enterprise_scope?: boolean;
};

type NormalizedPayload = {
  proposalMarkdown: string;
  recommendedPackage: string;
  qualificationReason: string;
  leadPayload: LeadPayload;
  airtableFields: Record<string, unknown>;
  activityPayload: ActivityPayload;
  metadata: MetadataPayload;
};

function nowIso() {
  return new Date().toISOString();
}

function joinLeadSources(leadSources: string[] | undefined) {
  if (!Array.isArray(leadSources)) return '';
  return leadSources
    .map(s => sanitizeString(s, 100))
    .filter(Boolean)
    .join(', ');
}

function buildSalesStage(recommendedPackage: string, qualificationStatus: string) {
  if (recommendedPackage === 'Custom / Enterprise') return 'Needs Enterprise Review';
  if (qualificationStatus) return qualificationStatus;
  return 'Qualified';
}

function buildAirtableCompatibilityFields(leadPayload: LeadPayload) {
  const salesStage = buildSalesStage(
    leadPayload.recommended_package || '',
    leadPayload.qualification_status || 'Qualified'
  );

  return {
    lead_id: leadPayload.lead_id,
    created_at: leadPayload.created_at,
    name: leadPayload.name,
    email: leadPayload.email,
    phone: leadPayload.phone || '',
    company: leadPayload.company,
    source: leadPayload.source,
    service_need: leadPayload.service_need,
    package_interest: leadPayload.package_interest || '',
    recommended_package: leadPayload.recommended_package || '',
    qualification_status: leadPayload.qualification_status || 'Qualified',
    qualification_reason: leadPayload.qualification_reason || '',
    crm_used: leadPayload.crm_used || '',
    booking_link: leadPayload.booking_link || '',
    current_problem: leadPayload.current_problem || '',
    messages_per_day: sanitizeNumber(leadPayload.messages_per_day),
    needs_booking: Boolean(leadPayload.needs_booking),
    multiple_offers: Boolean(leadPayload.multiple_offers),
    needs_staff_routing: Boolean(leadPayload.needs_staff_routing),
    owner: leadPayload.owner || '',
    next_action: leadPayload.next_action || '',
    notes: leadPayload.notes || '',
    niche: leadPayload.niche || '',
    lead_sources: joinLeadSources(leadPayload.lead_sources),

    'Lead ID': leadPayload.lead_id,
    'Created At': leadPayload.created_at,
    'Name': leadPayload.name,
    'Email': leadPayload.email,
    'Phone': leadPayload.phone || '',
    'Company': leadPayload.company,
    'Source': leadPayload.source,
    'Lead Sources': joinLeadSources(leadPayload.lead_sources),
    'Niche': leadPayload.niche || '',
    'Service Need': leadPayload.service_need,
    'Package Interest': leadPayload.package_interest || '',
    'Recommended Package': leadPayload.recommended_package || '',
    'Qualification Status': leadPayload.qualification_status || 'Qualified',
    'Qualification Reason': leadPayload.qualification_reason || '',
    'Sales Stage': salesStage,
    'Sales Stage (Derived)': salesStage,
    'Current Problem': leadPayload.current_problem || '',
    'CRM Used': leadPayload.crm_used || '',
    'Booking Link': leadPayload.booking_link || '',
    'Messages Per Day': sanitizeNumber(leadPayload.messages_per_day),
    'Needs Booking': Boolean(leadPayload.needs_booking),
    'Multiple Offers': Boolean(leadPayload.multiple_offers),
    'Needs Staff Routing': Boolean(leadPayload.needs_staff_routing),
    'Owner': leadPayload.owner || '',
    'Next Action': leadPayload.next_action || '',
    'Notes': leadPayload.notes || '',
  };
}

function normalizeLeadPayload(body: any): NormalizedPayload {
  // Guard: body must be an object, not null/array/primitive
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    body = {};
  }

  const timestamp = nowIso();
  const rawLeadId = body?.leadPayload?.lead_id || body?.lead_id || `fs_lead_${Date.now()}`;
  const leadId = sanitizeLeadId(rawLeadId) || `fs_lead_${Date.now()}`;

  const leadPayload: LeadPayload = body?.leadPayload
    ? {
        lead_id: sanitizeLeadId(body.leadPayload.lead_id) || leadId,
        created_at: sanitizeString(body.leadPayload.created_at, 50) || timestamp,
        name: sanitizeString(body.leadPayload.name || body.ingest?.contactName),
        email: sanitizeString(body.leadPayload.email || body.ingest?.contactEmail, 254),
        phone: sanitizeString(body.leadPayload.phone || body.ingest?.phone, 30),
        company: sanitizeString(body.leadPayload.company || body.ingest?.agencyName),
        source: sanitizeString(body.leadPayload.source, 200) || 'Website',
        lead_sources: Array.isArray(body.leadPayload.lead_sources)
          ? body.leadPayload.lead_sources.map((s: unknown) => sanitizeString(s, 100)).filter(Boolean)
          : [],
        niche: sanitizeString(body.leadPayload.niche || body.ingest?.niche, 100),
        service_need: sanitizeString(body.leadPayload.service_need || body.ingest?.primaryProblem),
        package_interest: sanitizeString(body.leadPayload.package_interest, 200),
        recommended_package: sanitizeString(body.leadPayload.recommended_package || body.recommendedPackage, 200),
        qualification_status: sanitizeString(body.leadPayload.qualification_status, 100) || 'Qualified',
        qualification_reason: sanitizeString(body.leadPayload.qualification_reason || body.qualificationReason),
        crm_used: sanitizeString(body.leadPayload.crm_used || body.ingest?.crmUsed, 200),
        booking_link: sanitizeString(body.leadPayload.booking_link || body.ingest?.bookingLink, 500),
        current_problem: sanitizeString(body.leadPayload.current_problem || body.ingest?.problemDetail),
        messages_per_day: sanitizeNumber(body.leadPayload.messages_per_day),
        needs_booking: Boolean(body.leadPayload.needs_booking),
        multiple_offers: Boolean(body.leadPayload.multiple_offers),
        needs_staff_routing: Boolean(body.leadPayload.needs_staff_routing),
        owner: sanitizeString(body.leadPayload.owner, 200),
        next_action: sanitizeString(body.leadPayload.next_action, 500) || 'Review new inbound lead',
        notes: sanitizeString(body.leadPayload.notes, MAX_NOTES_LENGTH),
      }
    : {
        lead_id: leadId,
        created_at: timestamp,
        name: sanitizeString(body?.name || body?.ingest?.contactName),
        email: sanitizeString(body?.email || body?.ingest?.contactEmail, 254),
        phone: sanitizeString(body?.phone || body?.ingest?.phone, 30),
        company: sanitizeString(body?.company || body?.ingest?.agencyName),
        source: sanitizeString(body?.source, 200) || 'Website',
        lead_sources: Array.isArray(body?.lead_sources) ? body.lead_sources.map((s: unknown) => sanitizeString(s, 100)).filter(Boolean) : [],
        niche: sanitizeString(body?.niche || body?.ingest?.niche, 100),
        service_need: sanitizeString(body?.service_need || body?.primaryProblem || body?.ingest?.primaryProblem),
        package_interest: '',
        recommended_package: sanitizeString(body?.recommended_package || body?.recommendedPackage, 200),
        qualification_status: 'Qualified',
        qualification_reason: sanitizeString(body?.qualification_reason || body?.qualificationReason),
        crm_used: sanitizeString(body?.crm_used || body?.crmUsed || body?.ingest?.crmUsed, 200),
        booking_link: sanitizeString(body?.booking_link || body?.bookingLink || body?.ingest?.bookingLink, 500),
        current_problem: sanitizeString(body?.current_problem || body?.problemDetail || body?.ingest?.problemDetail),
        messages_per_day: sanitizeNumber(body?.messages_per_day || body?.messagesPerDay || body?.ingest?.messagesPerDay),
        needs_booking: Boolean(body?.needs_booking ?? body?.needsBooking ?? body?.ingest?.needsBooking),
        multiple_offers: Boolean(body?.multiple_offers ?? body?.multipleOffers ?? body?.ingest?.multipleOffers),
        needs_staff_routing: Boolean(body?.needs_staff_routing ?? body?.needsStaffRouting ?? body?.ingest?.needsStaffRouting),
        owner: '',
        next_action: 'Review new inbound lead',
        notes: sanitizeString(body?.notes, MAX_NOTES_LENGTH),
      };

  const airtableFields = {
    ...buildAirtableCompatibilityFields(leadPayload),
    ...(body?.airtableFields && typeof body.airtableFields === 'object' && !Array.isArray(body.airtableFields)
      ? body.airtableFields
      : {}),
  };

  const resolvedEventName = sanitizeString(
    body?.metadata?.event_name ||
    body?.activityPayload?.event_name ||
    body?.event_name ||
    'website_intake_submitted',
    100
  );

  const activityPayload: ActivityPayload = body?.activityPayload && typeof body.activityPayload === 'object'
    ? {
        activity_id: sanitizeString(body.activityPayload.activity_id, 128) || `act_${Date.now()}`,
        lead_id: leadPayload.lead_id,
        tenant_id: sanitizeString(body.activityPayload.tenant_id, 100) || 'demo-client',
        event_name: resolvedEventName,
        event_timestamp: sanitizeString(body.activityPayload.event_timestamp, 50) || timestamp,
        actor: sanitizeString(body.activityPayload.actor, 50) || 'website',
        status: sanitizeString(body.activityPayload.status, 50) || 'success',
        details: sanitizeString(body.activityPayload.details, 1000) || 'Lead submitted from website',
      }
    : {
        activity_id: `act_${Date.now()}`,
        lead_id: leadPayload.lead_id,
        tenant_id: 'demo-client',
        event_name: resolvedEventName,
        event_timestamp: timestamp,
        actor: 'website',
        status: 'success',
        details: 'Lead submitted from website intake form',
      };

  const metadata: MetadataPayload = body?.metadata && typeof body.metadata === 'object'
    ? {
        source_app: 'flowstacksales',
        source_step: sanitizeString(body.metadata.source_step || body?.step, 100) || 'proposal',
        tenant_id: 'demo-client',
        event_name: resolvedEventName,
        submitted_at: sanitizeString(body.metadata.submitted_at, 50) || timestamp,
        package_key: sanitizeString(body.metadata.package_key, 50),
        package_label: sanitizeString(body.metadata.package_label, 200),
        needs_enterprise_scope: Boolean(body.metadata.needs_enterprise_scope),
      }
    : {
        source_app: 'flowstacksales',
        source_step: 'proposal',
        tenant_id: 'demo-client',
        event_name: resolvedEventName,
        submitted_at: timestamp,
      };

  return {
    proposalMarkdown: sanitizeString(body?.proposalMarkdown, 20000),
    recommendedPackage: sanitizeString(body?.recommendedPackage || leadPayload.recommended_package, 200),
    qualificationReason: sanitizeString(body?.qualificationReason || leadPayload.qualification_reason),
    leadPayload,
    airtableFields,
    activityPayload,
    metadata,
  };
}

function cleanFields<T extends Record<string, unknown>>(fields: T): T {
  const cleaned = Object.fromEntries(
    Object.entries(fields).map(([key, value]) => {
      if (value === undefined || value === null) return [key, ''];
      if (Array.isArray(value)) return [key, value.join(', ')];
      return [key, value];
    })
  );
  return cleaned as T;
}

async function airtableRequest(url: string, pat: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${pat}`,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(`Airtable request failed (${response.status}) ${text}`);
  }

  return text ? JSON.parse(text) : null;
}

async function findLeadRecord(baseId: string, pat: string, leadId: string, email: string) {
  const filters: string[] = [];

  // Sanitize both inputs before formula construction
  const safeLeadId = sanitizeLeadId(leadId);
  const safeEmail = sanitizeEmailForFormula(email);

  if (safeLeadId) {
    // Escape remaining quotes after sanitization (belt-and-suspenders)
    const escapedId = safeLeadId.replace(/"/g, '\\"');
    filters.push(`OR({lead_id}="${escapedId}",{Lead ID}="${escapedId}")`);
  }
  if (safeEmail) {
    filters.push(`OR(LOWER({email})="${safeEmail}",LOWER({Email})="${safeEmail}")`);
  }

  if (filters.length === 0) return null;

  const formula = filters.length === 1 ? filters[0] : `OR(${filters.join(',')})`;
  const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent('Leads')}?maxRecords=1&filterByFormula=${encodeURIComponent(formula)}`;
  const result = await airtableRequest(url, pat);

  return result?.records?.[0] || null;
}

async function createAirtableRecord(baseId: string, tableName: string, pat: string, fields: Record<string, unknown>) {
  const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`;
  return airtableRequest(url, pat, {
    method: 'POST',
    body: JSON.stringify({ fields: cleanFields(fields) }),
  });
}

async function updateAirtableRecord(
  baseId: string,
  tableName: string,
  recordId: string,
  pat: string,
  fields: Record<string, unknown>
) {
  const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}/${recordId}`;
  return airtableRequest(url, pat, {
    method: 'PATCH',
    body: JSON.stringify({ fields: cleanFields(fields) }),
  });
}

function buildBriefMarkdown(payload: NormalizedPayload) {
  return [
    '# Flowstack Proposal',
    '',
    `Generated: ${payload.metadata.submitted_at}`,
    '',
    '## Contact',
    `Name: ${payload.leadPayload.name}`,
    `Business: ${payload.leadPayload.company}`,
    `Email: ${payload.leadPayload.email}`,
    `Phone: ${payload.leadPayload.phone || ''}`,
    '',
    '## Business Context',
    `Niche: ${payload.leadPayload.niche || ''}`,
    `Lead Sources: ${Array.isArray(payload.leadPayload.lead_sources) ? payload.leadPayload.lead_sources.join(', ') : ''}`,
    `Primary Problem: ${payload.leadPayload.service_need || ''}`,
    `Problem Detail: ${payload.leadPayload.current_problem || ''}`,
    `CRM Used: ${payload.leadPayload.crm_used || ''}`,
    `Booking Link: ${payload.leadPayload.booking_link || ''}`,
    `Needs Booking: ${payload.leadPayload.needs_booking ? 'Yes' : 'No'}`,
    `Multiple Offers: ${payload.leadPayload.multiple_offers ? 'Yes' : 'No'}`,
    `Needs Staff Routing: ${payload.leadPayload.needs_staff_routing ? 'Yes' : 'No'}`,
    '',
    '## Recommendation',
    `Package: ${payload.recommendedPackage || payload.leadPayload.recommended_package || ''}`,
    `Reason: ${payload.qualificationReason || payload.leadPayload.qualification_reason || ''}`,
    '',
    '## Proposal',
    payload.proposalMarkdown || '',
    '',
  ].join('\n');
}

function buildSalesEmailHtml(payload: NormalizedPayload) {
  // HTML-escape all dynamic values before inserting into email HTML
  const esc = (s: string) =>
    String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
      <h2>New Flowstack Sales Handoff</h2>
      <p><strong>Lead:</strong> ${esc(payload.leadPayload.name)}</p>
      <p><strong>Business:</strong> ${esc(payload.leadPayload.company)}</p>
      <p><strong>Email:</strong> ${esc(payload.leadPayload.email)}</p>
      <p><strong>Phone:</strong> ${esc(payload.leadPayload.phone || '')}</p>
      <p><strong>Recommended Package:</strong> ${esc(payload.recommendedPackage || payload.leadPayload.recommended_package || '')}</p>
      <p><strong>Qualification Reason:</strong> ${esc(payload.qualificationReason || payload.leadPayload.qualification_reason || '')}</p>
      <p><strong>Main Problem:</strong> ${esc(payload.leadPayload.service_need || '')}</p>
      <p><strong>Lead Sources:</strong> ${esc(Array.isArray(payload.leadPayload.lead_sources) ? payload.leadPayload.lead_sources.join(', ') : '')}</p>
      <p><strong>Event:</strong> ${esc(payload.metadata.event_name)}</p>
      <hr />
      <p>The exported brief is attached as a markdown file.</p>
    </div>
  `;
}

async function sendSalesHandoffEmail(payload: NormalizedPayload) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const emailFrom = process.env.FLOWSTACK_SALES_EMAIL_FROM;
  const emailTo = process.env.FLOWSTACK_SALES_EMAIL_TO;

  if (!resendApiKey || !emailFrom || !emailTo) {
    return {
      sent: false,
      skipped: true,
      reason: 'Missing RESEND_API_KEY or FLOWSTACK_SALES_EMAIL_FROM / FLOWSTACK_SALES_EMAIL_TO',
    };
  }

  const briefMarkdown = buildBriefMarkdown(payload);
  const attachmentContent = Buffer.from(briefMarkdown, 'utf8').toString('base64');

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: emailFrom,
      to: [emailTo],
      subject: `Flowstack Sales Handoff — ${payload.leadPayload.company} — ${payload.recommendedPackage || payload.leadPayload.recommended_package || 'Recommendation'}`,
      html: buildSalesEmailHtml(payload),
      text: briefMarkdown,
      attachments: [
        {
          filename: `flowstack-proposal-${payload.leadPayload.lead_id}.md`,
          content: attachmentContent,
        },
      ],
    }),
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(`Resend email failed (${response.status}) ${text}`);
  }

  return {
    sent: true,
    skipped: false,
    response: text ? JSON.parse(text) : null,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const pat = process.env.FLOWSTACK_AIRTABLE_PAT;
  const baseId = process.env.FLOWSTACK_AIRTABLE_BASE_ID;

  if (!pat || !baseId) {
    return res.status(500).json({
      error: 'Missing FLOWSTACK_AIRTABLE_PAT or FLOWSTACK_AIRTABLE_BASE_ID',
    });
  }

  try {
    // Guard: if Vercel body parser failed (e.g. malformed JSON), req.body may be
    // undefined or a raw string. Normalise to an object before proceeding.
    const rawBody = req.body;
    const safeBody =
      rawBody !== null &&
      rawBody !== undefined &&
      typeof rawBody === 'object' &&
      !Array.isArray(rawBody)
        ? rawBody
        : {};

    const normalizedBody = normalizeLeadPayload(safeBody);

    const existingLead = await findLeadRecord(
      baseId,
      pat,
      normalizedBody.leadPayload.lead_id,
      normalizedBody.leadPayload.email
    );

    let leadResult: any;
    let leadMode: 'created' | 'updated';

    if (existingLead?.id) {
      leadResult = await updateAirtableRecord(baseId, 'Leads', existingLead.id, pat, normalizedBody.airtableFields);
      leadMode = 'updated';
    } else {
      leadResult = await createAirtableRecord(baseId, 'Leads', pat, normalizedBody.airtableFields);
      leadMode = 'created';
    }

    const activityResult = await createAirtableRecord(baseId, 'Activities', pat, normalizedBody.activityPayload as Record<string, unknown>);

    const shouldSendSalesHandoff =
      normalizedBody.metadata.event_name === 'sales_handoff_sent' ||
      normalizedBody.activityPayload.event_name === 'sales_handoff_sent';

    let emailResult: any = { sent: false, skipped: true };

    if (shouldSendSalesHandoff) {
      emailResult = await sendSalesHandoffEmail(normalizedBody);
    }

    return res.status(200).json({
      ok: true,
      mode: 'direct-airtable',
      lead_mode: leadMode,
      lead_record_id: leadResult?.id || null,
      activity_record_id: activityResult?.id || null,
      lead_id: normalizedBody.leadPayload.lead_id,
      event_name: normalizedBody.metadata.event_name,
      email: emailResult,
    });
  } catch (error) {
    console.error('Direct lead ingest error:', error);
    return res.status(500).json({
      error: 'Direct lead ingest failed',
      details: String(error),
    });
  }
}