import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = { runtime: 'nodejs' };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const ingest = (req.body as Record<string, any> | undefined)?.ingest || {};
    const calculator = (req.body as Record<string, any> | undefined)?.calculator || {};

    return res.status(200).json({
      status: 'ok',
      message: 'demo mode response',
      data: {
        schema: {
          lead_sources: Array.isArray(ingest.leadSources) ? ingest.leadSources : ['Website'],
          leads_per_day: Number(ingest.messagesPerDay || 5),
          lead_value: Number(calculator.value || 5000),
          actions: Array.isArray(ingest.actions) && ingest.actions.length ? ingest.actions : ['store_in_airtable', 'send_followup_email'],
          tools: Array.isArray(ingest.tools) && ingest.tools.length ? ingest.tools : ['Airtable', 'Gmail'],
          qualification_rules: 'Demo mode qualification',
          response_time: ingest.responseTime || 'within_15_minutes',
          conversion_action: ingest.conversionAction || 'book_call',
        },
      },
    });
  } catch {
    return res.status(200).json({
      status: 'fallback',
      message: 'demo mode response',
      data: {},
    });
  }
}
