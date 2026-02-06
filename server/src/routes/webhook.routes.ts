import { Router } from 'express';
import { webhookController } from '../controllers/webhook.controller';
import { webhookLimiter } from '../middleware/rateLimiter';

const router = Router();

// No auth — WhatsApp needs direct access
router.get('/', (req, res) => webhookController.verify(req, res));
router.post('/', webhookLimiter, (req, res, next) => webhookController.handleIncoming(req, res, next));

export default router;
