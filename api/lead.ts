import type { VercelRequest, VercelResponse } from "@vercel/node";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '2mb',
    },
  },
};

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
};

function nowIso() {
  return new Date().toISOString();
}

function normalizeLeadPayload(body: any) {
  const timestamp = nowIso();
  const leadId = body?.leadPayload?.lead_id || body?.lead_id || `fs_lead_${Date.now()}`;

  const leadPayload: LeadPayload = body?.leadPayload || {
    lead_id: leadId,
    created_at: body?.created_at || timestamp,
    name: body?.name || body?.ingest?.contactName || '',
    email: body?.email || body?.ingest?.contactEmail || '',
    phone: body?.phone || body?.ingest?.phone || '',
    company: body?.company || body?.ingest?.agencyName || '',
    source: body?.source || (Array.isArray(body?.leadSources) ? body.leadSources.join(', ') : '') || 'Website',
    lead_sources: body?.lead_sources || body?.leadSources || body?.ingest?.leadSources || [],
    niche: body?.niche || body?.ingest?.niche || '',
    service_need: body?.service_need || body?.primaryProblem || body?.ingest?.primaryProblem || '',
    package_interest: body?.package_interest || '',
    recommended_package: body?.recommended_package || body?.recommendedPackage || '',
    qualification_status: body?.qualification_status || 'Qualified',
    qualification_reason: body?.qualification_reason || body?.qualificationReason || '',
    crm_used: body?.crm_used || body?.crmUsed || body?.ingest?.crmUsed || '',
    booking_link: body?.booking_link || body?.bookingLink || body?.ingest?.bookingLink || '',
    current_problem: body?.current_problem || body?.problemDetail || body?.ingest?.problemDetail || '',
    messages_per_day: body?.messages_per_day || body?.messagesPerDay || body?.ingest?.messagesPerDay || 0,
    needs_booking: body?.needs_booking ?? body?.needsBooking ?? body?.ingest?.needsBooking ?? false,
    multiple_offers: body?.multiple_offers ?? body?.multipleOffers ?? body?.ingest?.multipleOffers ?? false,
    needs_staff_routing: body?.needs_staff_routing ?? body?.needsStaffRouting ?? body?.ingest?.needsStaffRouting ?? false,
    owner: body?.owner || '',
    next_action: body?.next_action || 'Review new inbound lead',
    notes: body?.notes || '',
  };

  const airtableFields = body?.airtableFields || {
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
    qualification_status: leadPayload.qualification_status || '',
    qualification_reason: leadPayload.qualification_reason || '',
    crm_used: leadPayload.crm_used || '',
    booking_link: leadPayload.booking_link || '',
    current_problem: leadPayload.current_problem || '',
    messages_per_day: leadPayload.messages_per_day || 0,
    needs_booking: leadPayload.needs_booking ?? false,
    multiple_offers: leadPayload.multiple_offers ?? false,
    needs_staff_routing: leadPayload.needs_staff_routing ?? false,
    owner: leadPayload.owner || '',
    next_action: leadPayload.next_action || '',
    notes: leadPayload.notes || '',
    niche: leadPayload.niche || '',
    lead_sources: Array.isArray(leadPayload.lead_sources) ? leadPayload.lead_sources.join(', ') : '',
  };

  const activityPayload: ActivityPayload = body?.activityPayload || {
    activity_id: `act_${Date.now()}`,
    lead_id: leadPayload.lead_id,
    tenant_id: body?.tenant_id || 'demo-client',
    event_name: 'website_intake_submitted',
    event_timestamp: timestamp,
    actor: 'website',
    status: 'success',
    details: 'Lead submitted from website intake form',
  };

  const metadata: MetadataPayload = body?.metadata || {
    source_app: 'flowstacksales',
    source_step: body?.step || 'proposal',
    tenant_id: body?.tenant_id || 'demo-client',
    event_name: 'website_intake_submitted',
    submitted_at: timestamp,
  };

  return {
    ...body,
    proposalMarkdown: body?.proposalMarkdown || '',
    recommendedPackage: body?.recommendedPackage || leadPayload.recommended_package || '',
    qualificationReason: body?.qualificationReason || leadPayload.qualification_reason || '',
    leadPayload,
    airtableFields,
    activityPayload,
    metadata,
  };
}

function cleanFields<T extends Record<string, any>>(fields: T): T {
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

  if (leadId) filters.push(`{lead_id}="${leadId.replace(/"/g, '\\"')}"`);
  if (email) filters.push(`LOWER({email})="${email.toLowerCase().replace(/"/g, '\\"')}"`);

  if (filters.length === 0) return null;

  const formula = filters.length === 1 ? filters[0] : `OR(${filters.join(',')})`;
  const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent('Leads')}?maxRecords=1&filterByFormula=${encodeURIComponent(formula)}`;
  const result = await airtableRequest(url, pat);

  return result?.records?.[0] || null;
}

async function createAirtableRecord(baseId: string, tableName: string, pat: string, fields: Record<string, any>) {
  const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`;
  return airtableRequest(url, pat, {
    method: 'POST',
    body: JSON.stringify({ fields: cleanFields(fields) }),
  });
}

async function updateAirtableRecord(baseId: string, tableName: string, recordId: string, pat: string, fields: Record<string, any>) {
  const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}/${recordId}`;
  return airtableRequest(url, pat, {
    method: 'PATCH',
    body: JSON.stringify({ fields: cleanFields(fields) }),
  });
}

function buildBriefMarkdown(payload: ReturnType<typeof normalizeLeadPayload>) {
  return [
    `# Flowstack Proposal`,
    ``,
    `Generated: ${payload.metadata.submitted_at}`,
    ``,
    `## Contact`,
    `Name: ${payload.leadPayload.name}`,
    `Business: ${payload.leadPayload.company}`,
    `Email: ${payload.leadPayload.email}`,
    `Phone: ${payload.leadPayload.phone || ''}`,
    ``,
    `## Business Context`,
    `Niche: ${payload.leadPayload.niche || ''}`,
    `Lead Sources: ${Array.isArray(payload.leadPayload.lead_sources) ? payload.leadPayload.lead_sources.join(', ') : ''}`,
    `Primary Problem: ${payload.leadPayload.service_need || ''}`,
    `Problem Detail: ${payload.leadPayload.current_problem || ''}`,
    ``,
    `## Recommendation`,
    `Package: ${payload.recommendedPackage || payload.leadPayload.recommended_package || ''}`,
    `Reason: ${payload.qualificationReason || payload.leadPayload.qualification_reason || ''}`,
    ``,
    `## Proposal`,
    payload.proposalMarkdown || '',
    ``,
  ].join('\n');
}

async function sendSalesHandoffEmail(payload: ReturnType<typeof normalizeLeadPayload>) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const emailFrom = process.env.FLOWSTACK_SALES_EMAIL_FROM;
  const emailTo = process.env.FLOWSTACK_SALES_EMAIL_TO;

  if (!resendApiKey || !emailFrom || !emailTo) {
    return { sent: false, skipped: true, reason: 'Missing RESEND / sales email env vars' };
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
      subject: `Flowstack Sales Handoff — ${payload.leadPayload.company}`,
      html: `<p>New sales handoff for <strong>${payload.leadPayload.company}</strong>.</p><p>Recommended package: <strong>${payload.recommendedPackage || ''}</strong></p>`,
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

  return { sent: true, skipped: false, response: text ? JSON.parse(text) : null };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const pat = process.env.FLOWSTACK_AIRTABLE_PAT;
  const baseId = process.env.FLOWSTACK_AIRTABLE_BASE_ID;

  if (!pat || !baseId) {
    return res.status(500).json({
      error: "Missing FLOWSTACK_AIRTABLE_PAT or FLOWSTACK_AIRTABLE_BASE_ID",
      debug: {
        has_pat: !!pat,
        has_base_id: !!baseId,
      },
    });
  }

  try {
    const normalizedBody = normalizeLeadPayload(req.body ?? {});
    console.log("=== Direct Lead Ingest Called ===");
    console.log("Event:", normalizedBody.metadata.event_name);
    console.log("Lead email:", normalizedBody.leadPayload.email);
    console.log("Lead company:", normalizedBody.leadPayload.company);

    const existingLead = await findLeadRecord(
      baseId,
      pat,
      normalizedBody.leadPayload.lead_id,
      normalizedBody.leadPayload.email
    );

    let leadResult: any;
    let leadMode: 'created' | 'updated';

    if (existingLead?.id) {
      leadResult = await updateAirtableRecord(
        baseId,
        'Leads',
        existingLead.id,
        pat,
        normalizedBody.airtableFields
      );
      leadMode = 'updated';
    } else {
      leadResult = await createAirtableRecord(
        baseId,
        'Leads',
        pat,
        normalizedBody.airtableFields
      );
      leadMode = 'created';
    }

    const activityResult = await createAirtableRecord(
      baseId,
      'Activities',
      pat,
      normalizedBody.activityPayload
    );

    let emailResult: any = { sent: false, skipped: true };

    if (normalizedBody.metadata.event_name === 'sales_handoff_sent') {
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
    console.error("Direct lead ingest error:", error);
    return res.status(500).json({
      error: "Direct lead ingest failed",
      details: String(error),
    });
  }
}