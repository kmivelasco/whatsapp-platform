import { WhatsAppCredentials } from '../types';

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
  recipientPhoneNumberId: string;
}

export class WhatsAppService {
  // Normalize Argentine phone numbers: Meta sends 5491125367148 but expects 541125367148
  private normalizePhoneNumber(phone: string): string {
    // Argentina: remove the 9 after country code 54 for mobile numbers
    if (phone.startsWith('549') && phone.length === 13) {
      return '54' + phone.slice(3);
    }
    return phone;
  }

  async sendMessage(to: string, text: string, credentials: WhatsAppCredentials): Promise<string | null> {
    const normalizedTo = this.normalizePhoneNumber(to);
    const url = `${WHATSAPP_API_URL}/${credentials.phoneNumberId}/messages`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${credentials.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: normalizedTo,
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

        const recipientPhoneNumberId = value.metadata.phone_number_id;

        for (const msg of value.messages) {
          if (msg.type !== 'text' || !msg.text?.body) continue;

          const contact = value.contacts?.find((c) => c.wa_id === msg.from);
          messages.push({
            from: msg.from,
            messageId: msg.id,
            timestamp: msg.timestamp,
            text: msg.text.body,
            contactName: contact?.profile?.name,
            recipientPhoneNumberId,
          });
        }
      }
    }

    return messages;
  }

  verifyWebhook(mode: string, token: string, challenge: string, expectedToken: string): string | null {
    if (mode === 'subscribe' && token === expectedToken) {
      return challenge;
    }
    return null;
  }
}

export const whatsappService = new WhatsAppService();
