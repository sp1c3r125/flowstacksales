import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = { runtime: 'nodejs' };

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    return res.status(200).json({
      status: 'ok',
      message: 'demo mode response',
      data: {
        lead: 'Juan Dela Cruz',
        status: 'Qualified',
        actions: [
          { step: 'Airtable', status: 'done' },
          { step: 'Email', status: 'sent' },
        ],
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
