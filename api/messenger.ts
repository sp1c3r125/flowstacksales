import { VercelRequest, VercelResponse } from '@vercel/node';

const FB_VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN!;
const FB_PAGE_ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN!;
const AIRTABLE_PAT = process.env.FLOWSTACK_AIRTABLE_PAT!;
const BASE_ID = process.env.FLOWSTACK_AIRTABLE_BASE_ID!;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. Webhook verification (GET request from Meta)
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === FB_VERIFY_TOKEN) {
      console.log('Webhook verified');
      return res.status(200).send(challenge);
    }
    return res.status(403).send('Forbidden');
  }

  // 2. Handle incoming messages (POST request)
  if (req.method === 'POST') {
    const body = req.body;

    try {
      // Extract message data
      const entry = body.entry?.[0];
      const messaging = entry?.messaging?.[0];
      const senderId = messaging?.sender?.id;
      const messageText = messaging?.message?.text;

      if (!senderId || !messageText) {
        console.log('Invalid payload - missing sender or message');
        return res.status(200).send('EVENT_RECEIVED');
      }

      console.log('Received message from ' + senderId + ': ' + messageText);

      // 3. Send immediate acknowledgment
      await fetch('https://graph.facebook.com/v18.0/me/messages', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + FB_PAGE_ACCESS_TOKEN,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient: { id: senderId },
          message: { 
            text: "Thanks for reaching out! We'll review your inquiry and get back to you shortly." 
          }
        })
      });

      // 4. Normalize to LeadPayload format
      const leadPayload = {
        lead_id: 'FB_' + senderId + '_' + Date.now(),
        source: 'Facebook Messenger',
        lead_sources: ['Facebook'],
        current_problem: messageText,
        niche: 'Unknown',
        name: 'Facebook User',
        email: '',
        phone: '',
        messages_per_day: 0,
        booking_needs: false,
        platform_preference: ['Facebook Messenger'],
        qualification_status: 'Cold',
        created_at: new Date().toISOString(),
      };

      // 5. Write to Airtable
      const airtableResponse = await fetch(
        'https://api.airtable.com/v0/' + BASE_ID + '/Leads',
        {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + AIRTABLE_PAT,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fields: leadPayload,
            typecast: true,
          }),
        }
      );

      if (!airtableResponse.ok) {
        const error = await airtableResponse.text();
        console.error('Airtable write failed:', error);
        return res.status(200).send('EVENT_RECEIVED');
      }

      console.log('Lead saved to Airtable:', leadPayload.lead_id);
      return res.status(200).json({ success: true, lead_id: leadPayload.lead_id });

    } catch (error) {
      console.error('Error processing message:', error);
      return res.status(200).send('EVENT_RECEIVED');
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
