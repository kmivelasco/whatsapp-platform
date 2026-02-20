import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireActiveSubscription } from '../middleware/subscription';
import { whatsappWebController } from '../controllers/whatsappWeb.controller';

const router = Router();

// All routes require authentication + active subscription
router.post('/connect', authenticate, requireActiveSubscription, whatsappWebController.connect);
router.post('/disconnect', authenticate, requireActiveSubscription, whatsappWebController.disconnect);
router.get('/status/:botConfigId', authenticate, requireActiveSubscription, whatsappWebController.status);
router.post('/send', authenticate, requireActiveSubscription, whatsappWebController.send);

export default router;
