import { Request, Response, NextFunction } from 'express';
import Stripe from 'stripe';
import { env } from '../config/env';
import { stripeService } from '../services/stripe.service';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';

export const stripeController = {
  async createCheckout(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return next(new AppError('Authentication required', 401));

      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
      });
      if (!user?.organizationId) {
        return next(new AppError('Organization required', 400));
      }

      const result = await stripeService.createCheckoutSession(
        user.organizationId,
        user.email,
      );

      res.json(result);
    } catch (error) {
      console.error('[Stripe] Checkout error:', error);
      next(new AppError('Error creating checkout session', 500));
    }
  },

  async webhook(req: Request, res: Response) {
    if (!env.STRIPE_SECRET_KEY || !env.STRIPE_WEBHOOK_SECRET) {
      return res.status(500).json({ error: 'Stripe not configured' });
    }

    const stripe = new Stripe(env.STRIPE_SECRET_KEY);
    const sig = req.headers['stripe-signature'] as string;

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        env.STRIPE_WEBHOOK_SECRET,
      );
    } catch (err) {
      console.error('[Stripe] Webhook signature failed:', err);
      return res.status(400).json({ error: 'Invalid signature' });
    }

    console.log('[Stripe Webhook] Event:', event.type);

    try {
      await stripeService.handleWebhookEvent(event);
    } catch (error) {
      console.error('[Stripe Webhook] Processing error:', error);
    }

    res.json({ received: true });
  },

  async createPortal(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return next(new AppError('Authentication required', 401));

      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        include: { organization: true },
      });

      if (!user?.organization?.stripeCustomerId) {
        return next(new AppError('No active subscription found', 404));
      }

      const result = await stripeService.createPortalSession(
        user.organization.stripeCustomerId,
      );

      res.json(result);
    } catch (error) {
      console.error('[Stripe] Portal error:', error);
      next(new AppError('Error creating portal session', 500));
    }
  },

  async getSubscription(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return next(new AppError('Authentication required', 401));

      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        include: { organization: true },
      });

      if (!user?.organization) {
        return next(new AppError('Organization not found', 404));
      }

      const org = user.organization;
      res.json({
        plan: org.plan,
        trialEndsAt: org.trialEndsAt,
        currentPeriodEnd: org.currentPeriodEnd,
        hasStripeSubscription: !!org.stripeSubscriptionId,
      });
    } catch (error) {
      next(new AppError('Error fetching subscription', 500));
    }
  },
};
