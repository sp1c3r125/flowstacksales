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

async function createAirtableRecord(
  baseId: string,
  tableName: string,
  pat: string,
  fields: Record<string, any>
) {
  const response = await fetch(`https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${pat}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fields: cleanFields(fields),
    }),
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(`Airtable ${tableName} write failed (${response.status}) ${text}`);
  }

  return JSON.parse(text);
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
    });
  }

  try {
    const normalizedBody = normalizeLeadPayload(req.body ?? {});
    console.log("=== Direct Lead Ingest Called ===");
    console.log("Normalized request body:", normalizedBody);

    const leadResult = await createAirtableRecord(
      baseId,
      'Leads',
      pat,
      normalizedBody.airtableFields
    );

    const activityResult = await createAirtableRecord(
      baseId,
      'Activities',
      pat,
      normalizedBody.activityPayload
    );

    return res.status(200).json({
      ok: true,
      mode: 'direct-airtable',
      lead_record_id: leadResult?.id || null,
      activity_record_id: activityResult?.id || null,
      lead_id: normalizedBody.leadPayload.lead_id,
      event_name: normalizedBody.metadata.event_name,
    });
  } catch (error) {
    console.error("Direct lead ingest error:", error);
    return res.status(500).json({
      error: "Direct lead ingest failed",
      details: String(error),
    });
  }
}