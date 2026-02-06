import { env } from '../config/env';

const WHATSAPP_API_URL = 'https://graph.facebook.com/v21.0';

interface WhatsAppMessage {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: { body: string };
}

interface WebhookEntry {
  id: string;
  changes: Array<{
    value: {
      messaging_product: string;
      metadata: { phone_number_id: string };
      contacts?: Array<{ profile: { name: string }; wa_id: string }>;
      messages?: WhatsAppMessage[];
      statuses?: Array<{ id: string; status: string; timestamp: string }>;
    };
    field: string;
  }>;
}

export interface ParsedIncomingMessage {
  from: string;
  messageId: string;
  timestamp: string;
  text: string;
  contactName?: string;
}

export class WhatsAppService {
  async sendMessage(to: string, text: string): Promise<string | null> {
    const url = `${WHATSAPP_API_URL}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.WHATSAPP_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: text },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('WhatsApp API error:', response.status, errorBody);
      return null;
    }

    const data = (await response.json()) as { messages?: Array<{ id: string }> };
    return data.messages?.[0]?.id ?? null;
  }

  parseWebhookPayload(body: { entry?: WebhookEntry[] }): ParsedIncomingMessage[] {
    const messages: ParsedIncomingMessage[] = [];

    if (!body.entry) return messages;

    for (const entry of body.entry) {
      for (const change of entry.changes) {
        const value = change.value;
        if (!value.messages) continue;

        for (const msg of value.messages) {
          if (msg.type !== 'text' || !msg.text?.body) continue;

          const contact = value.contacts?.find((c) => c.wa_id === msg.from);
          messages.push({
            from: msg.from,
            messageId: msg.id,
            timestamp: msg.timestamp,
            text: msg.text.body,
            contactName: contact?.profile?.name,
          });
        }
      }
    }

    return messages;
  }

  verifyWebhook(mode: string, token: string, challenge: string): string | null {
    if (mode === 'subscribe' && token === env.WHATSAPP_VERIFY_TOKEN) {
      return challenge;
    }
    return null;
  }
}

export const whatsappService = new WhatsAppService();
