import { Router } from 'express';
import express from 'express';
import { stripeController } from '../controllers/stripe.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Checkout + Portal require auth
router.post('/checkout', authenticate, (req, res, next) => stripeController.createCheckout(req, res, next));
router.post('/portal', authenticate, (req, res, next) => stripeController.createPortal(req, res, next));
router.get('/subscription', authenticate, (req, res, next) => stripeController.getSubscription(req, res, next));

// Webhook needs raw body for signature verification - DO NOT use json parser
router.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => stripeController.webhook(req, res));

export default router;
