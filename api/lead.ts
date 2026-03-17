import type { VercelRequest, VercelResponse } from "@vercel/node";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '2mb',
    },
  },
};

<<<<<<< HEAD
function normalizeLeadPayload(body: any) {
  if (body?.airtableFields && body?.leadPayload) return body;
=======


function normalizeLeadPayload(body: any) {
    if (body?.airtableFields && body?.leadPayload) return body;

    const leadPayload = body?.leadPayload || {
        source: body?.source || 'FlowStackOS Intake',
        status: body?.status || 'New',
        salesStage: body?.salesStage || 'New',
        fullName: body?.fullName || body?.ingest?.contactName || '',
        businessName: body?.businessName || body?.ingest?.agencyName || '',
        email: body?.email || body?.ingest?.contactEmail || '',
        phone: body?.phone || body?.ingest?.phone || '',
        niche: body?.niche || body?.ingest?.niche || '',
        leadSource: body?.leadSource || body?.ingest?.leadSource || '',
        messagesPerDay: body?.messagesPerDay || body?.ingest?.messagesPerDay || 0,
        currentProblem: body?.currentProblem || body?.ingest?.currentProblem || '',
        needsBooking: body?.needsBooking ?? body?.ingest?.needsBooking ?? false,
        multipleOffers: body?.multipleOffers ?? body?.ingest?.multipleOffers ?? false,
        needsStaffRouting: body?.needsStaffRouting ?? body?.ingest?.needsStaffRouting ?? false,
        crmUsed: body?.crmUsed || body?.ingest?.crmUsed || '',
        bookingLink: body?.bookingLink || body?.ingest?.bookingLink || '',
        recommendedPackage: body?.recommendedPackage || '',
        qualificationReason: body?.qualificationReason || '',
        packageInterest: body?.packageInterest || body?.ingest?.packageInterest || 'Not Sure',
        notes: body?.notes || '',
    };

    return {
        ...body,
        leadPayload,
        airtableFields: {
            'Lead Name': leadPayload.fullName,
            Email: leadPayload.email,
            Phone: leadPayload.phone,
            Company: leadPayload.businessName,
            Source: leadPayload.source,
            Status: leadPayload.status,
            'Sales Stage': leadPayload.salesStage,
            'Messages Per Day': leadPayload.messagesPerDay,
            'Current Problem': leadPayload.currentProblem,
            'Needs Booking': leadPayload.needsBooking,
            'Multiple Offers': leadPayload.multipleOffers,
            'Needs Staff Routing': leadPayload.needsStaffRouting,
            'CRM Used': leadPayload.crmUsed,
            'Booking Link': leadPayload.bookingLink,
            'Recommended Package': leadPayload.recommendedPackage,
            'Qualification Reason': leadPayload.qualificationReason,
            'Package Interest': leadPayload.packageInterest,
            Notes: leadPayload.notes,
        },
    };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }
>>>>>>> origin/main

  const leadPayload = body?.leadPayload || {
    lead_id: body?.lead_id || `fs_lead_${Date.now()}`,
    created_at: body?.created_at || new Date().toISOString(),
    name: body?.name || body?.ingest?.contactName || '',
    email: body?.email || body?.ingest?.contactEmail || '',
    phone: body?.phone || body?.ingest?.phone || '',
    company: body?.company || body?.ingest?.agencyName || '',
    source: body?.source || (Array.isArray(body?.leadSources) ? body.leadSources.join(', ') : '') || 'Website',
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
    niche: body?.niche || body?.ingest?.niche || '',
    lead_sources: body?.lead_sources || body?.leadSources || body?.ingest?.leadSources || [],
  };

<<<<<<< HEAD
  return {
    ...body,
    leadPayload,
    airtableFields: {
      lead_id: leadPayload.lead_id,
      created_at: leadPayload.created_at,
      name: leadPayload.name,
      email: leadPayload.email,
      phone: leadPayload.phone,
      company: leadPayload.company,
      source: leadPayload.source,
      service_need: leadPayload.service_need,
      package_interest: leadPayload.package_interest,
      recommended_package: leadPayload.recommended_package,
      qualification_status: leadPayload.qualification_status,
      qualification_reason: leadPayload.qualification_reason,
      crm_used: leadPayload.crm_used,
      booking_link: leadPayload.booking_link,
      current_problem: leadPayload.current_problem,
      messages_per_day: leadPayload.messages_per_day,
      needs_booking: leadPayload.needs_booking,
      multiple_offers: leadPayload.multiple_offers,
      needs_staff_routing: leadPayload.needs_staff_routing,
      owner: leadPayload.owner,
      next_action: leadPayload.next_action,
      notes: leadPayload.notes,
      niche: leadPayload.niche,
      lead_sources: Array.isArray(leadPayload.lead_sources) ? leadPayload.lead_sources.join(', ') : leadPayload.lead_sources,
    },
  };
=======
    console.log("=== Lead API Called ===");
    console.log("Webhook URL:", url);
    console.log("Secret exists:", !!secret);
    const normalizedBody = normalizeLeadPayload(req.body ?? {});
    console.log("Request body:", normalizedBody);

    if (!url || !secret) {
        console.error("Missing N8N_WEBHOOK_URL or N8N_WEBHOOK_SECRET");
        return res.status(500).json({ error: "Missing N8N_WEBHOOK_URL or N8N_WEBHOOK_SECRET" });
    }

    try {
        console.log("Sending to n8n...");
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-flowstack-secret": secret,
            },
            body: JSON.stringify(normalizedBody),
        });

        console.log("n8n response status:", response.status);
        const data = await response.text();
        console.log("n8n response:", data);

        if (!response.ok) {
            console.error("n8n webhook error:", response.status, data);
            return res.status(500).json({ error: "Failed to forward lead to n8n", details: data });
        }

        return res.status(200).send(data);
    } catch (error) {
        console.error("Lead endpoint error:", error);
        return res.status(500).json({ error: "Internal server error", details: String(error) });
    }
>>>>>>> origin/main
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const url = process.env.N8N_WEBHOOK_URL;
  const secret = process.env.N8N_WEBHOOK_SECRET;

  console.log("=== Lead API Called ===");
  console.log("Webhook URL:", url);
  console.log("Secret exists:", !!secret);

  const normalizedBody = normalizeLeadPayload(req.body ?? {});
  console.log("Request body:", normalizedBody);

  if (!url || !secret) {
    console.error("Missing N8N_WEBHOOK_URL or N8N_WEBHOOK_SECRET");
    return res.status(500).json({ error: "Missing N8N_WEBHOOK_URL or N8N_WEBHOOK_SECRET" });
  }

  try {
    console.log("Sending to n8n...");
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-flowstack-secret": secret,
      },
      body: JSON.stringify(normalizedBody),
    });

    console.log("n8n response status:", response.status);
    const data = await response.text();
    console.log("n8n response:", data);

    if (!response.ok) {
      console.error("n8n webhook error:", response.status, data);
      return res.status(500).json({ error: "Failed to forward lead to n8n", details: data });
    }

    return res.status(200).send(data);
  } catch (error) {
    console.error("Lead endpoint error:", error);
    return res.status(500).json({ error: "Internal server error", details: String(error) });
  }
}