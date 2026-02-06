import { Request, Response, NextFunction } from 'express';
import { whatsappService } from '../services/whatsapp.service';
import { botPipelineService } from '../services/botPipeline.service';

export class WebhookController {
  async verify(req: Request, res: Response) {
    const mode = req.query['hub.mode'] as string;
    const token = req.query['hub.verify_token'] as string;
    const challenge = req.query['hub.challenge'] as string;

    const result = whatsappService.verifyWebhook(mode, token, challenge);
    if (result) {
      res.status(200).send(result);
    } else {
      res.status(403).send('Verification failed');
    }
  }

  async handleIncoming(req: Request, res: Response, _next: NextFunction) {
    // Always respond 200 to WhatsApp quickly
    res.status(200).send('OK');

    try {
      const messages = whatsappService.parseWebhookPayload(req.body);

      for (const msg of messages) {
        await botPipelineService.processIncomingMessage(msg);
      }
    } catch (err) {
      console.error('Error processing webhook:', err);
    }
  }
}

export const webhookController = new WebhookController();
