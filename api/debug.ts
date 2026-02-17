import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    return res.status(200).json({
        N8N_WEBHOOK_URL: process.env.N8N_WEBHOOK_URL || "NOT SET",
        N8N_WEBHOOK_SECRET: process.env.N8N_WEBHOOK_SECRET ? "SET" : "NOT SET",
        GROQ_API_KEY: process.env.GROQ_API_KEY ? "SET" : "NOT SET",
        NODE_ENV: process.env.NODE_ENV,
    });
}