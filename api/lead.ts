import type { VercelRequest, VercelResponse } from "@vercel/node";

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '2mb',
        },
    },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const url = process.env.N8N_WEBHOOK_URL;
    const secret = process.env.N8N_WEBHOOK_SECRET;

    console.log("=== Lead API Called ===");
    console.log("Webhook URL:", url);
    console.log("Secret exists:", !!secret);
    console.log("Request body:", req.body);

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
            body: JSON.stringify(req.body ?? {}),
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
