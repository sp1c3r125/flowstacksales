import type { VercelRequest, VercelResponse } from "@vercel/node";

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '2mb',
        },
    },
};



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
