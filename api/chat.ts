import { VercelRequest, VercelResponse } from '@vercel/node';
import { guardFlowstackChat, type ChatMessage } from '../services/groqService';

const MODEL = 'llama-3.3-70b-versatile';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) {
    return res.status(500).json({ error: 'GROQ_API_KEY is not configured' });
  }

  const incomingMessages = Array.isArray(req.body?.messages) ? (req.body.messages as ChatMessage[]) : [];
  const guarded = guardFlowstackChat(incomingMessages);

  if (!guarded.allowed) {
    return res.status(200).json({
      choices: [
        {
          message: {
            role: 'assistant',
            content: guarded.refusalMessage
          }
        }
      ]
    });
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.2,
        max_tokens: 220,
        messages: [
          { role: 'system', content: guarded.systemPrompt },
          ...guarded.sanitizedHistory
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message || 'Failed to fetch from Groq'
      });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Chat API Error:', error);
    return res.status(500).json({ error: 'Failed to fetch from Groq' });
  }
}
