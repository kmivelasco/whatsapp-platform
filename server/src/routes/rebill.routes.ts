import { Router } from 'express';
import { rebillController } from '../controllers/rebill.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Checkout + Cancel require auth
router.post('/checkout', authenticate, (req, res, next) => rebillController.createCheckout(req, res, next));
router.post('/cancel', authenticate, (req, res, next) => rebillController.cancelSubscription(req, res, next));
router.get('/subscription', authenticate, (req, res, next) => rebillController.getSubscription(req, res, next));

// Webhook - no auth, Rebill sends events here
router.post('/webhook', (req, res) => rebillController.webhook(req, res));

export default router;
