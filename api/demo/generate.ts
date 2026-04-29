import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = { runtime: 'nodejs' };

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    return res.status(200).json({
      status: 'ok',
      message: 'demo mode response',
      data: {
        steps: ['Capture Lead', 'Qualify Lead', 'Store in Airtable', 'Send Email'],
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
