import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { whatsappWebController } from '../controllers/whatsappWeb.controller';

const router = Router();

// All routes require authentication
router.post('/connect', authenticate, whatsappWebController.connect);
router.post('/disconnect', authenticate, whatsappWebController.disconnect);
router.get('/status/:botConfigId', authenticate, whatsappWebController.status);
router.post('/send', authenticate, whatsappWebController.send);

export default router;
