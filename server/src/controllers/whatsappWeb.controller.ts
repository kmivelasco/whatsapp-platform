import { Request, Response } from 'express';
import { whatsappWebService } from '../services/whatsappWeb.service';

export const whatsappWebController = {
  /**
   * POST /api/wa-web/connect
   * Start WhatsApp Web connection for a bot config — generates QR
   */
  async connect(req: Request, res: Response) {
    try {
      const { botConfigId } = req.body;
      if (!botConfigId) {
        return res.status(400).json({ error: 'botConfigId is required' });
      }

      const result = await whatsappWebService.connect(botConfigId);
      res.json(result);
    } catch (err: any) {
      console.error('[WA-Web Controller] Connect error:', err);
      res.status(500).json({ error: err.message || 'Failed to connect' });
    }
  },

  /**
   * POST /api/wa-web/disconnect
   * Disconnect and clear WhatsApp Web session
   */
  async disconnect(req: Request, res: Response) {
    try {
      const { botConfigId } = req.body;
      if (!botConfigId) {
        return res.status(400).json({ error: 'botConfigId is required' });
      }

      await whatsappWebService.disconnect(botConfigId);
      res.json({ status: 'disconnected' });
    } catch (err: any) {
      console.error('[WA-Web Controller] Disconnect error:', err);
      res.status(500).json({ error: err.message || 'Failed to disconnect' });
    }
  },

  /**
   * GET /api/wa-web/status/:botConfigId
   * Get connection status and QR code
   */
  async status(req: Request, res: Response) {
    try {
      const botConfigId = req.params.botConfigId as string;
      const status = whatsappWebService.getStatus(botConfigId);
      res.json(status);
    } catch (err: any) {
      console.error('[WA-Web Controller] Status error:', err);
      res.status(500).json({ error: err.message || 'Failed to get status' });
    }
  },

  /**
   * POST /api/wa-web/send
   * Send a message via WhatsApp Web (for agent messages)
   */
  async send(req: Request, res: Response) {
    try {
      const { botConfigId, to, text } = req.body;
      if (!botConfigId || !to || !text) {
        return res.status(400).json({ error: 'botConfigId, to, and text are required' });
      }

      const messageId = await whatsappWebService.sendMessage(botConfigId, to, text);
      res.json({ messageId });
    } catch (err: any) {
      console.error('[WA-Web Controller] Send error:', err);
      res.status(500).json({ error: err.message || 'Failed to send message' });
    }
  },
};
