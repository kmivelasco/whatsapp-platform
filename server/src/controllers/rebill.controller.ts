import { Request, Response, NextFunction } from 'express';
import { rebillService } from '../services/rebill.service';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';

export const rebillController = {
  async createCheckout(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return next(new AppError('Authentication required', 401));

      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
      });
      if (!user?.organizationId) {
        return next(new AppError('Organization required', 400));
      }

      const result = await rebillService.createCheckoutLink(
        user.organizationId,
        user.email,
        user.name,
      );

      res.json(result);
    } catch (error) {
      console.error('[Rebill] Checkout error:', error);
      next(new AppError('Error creating checkout link', 500));
    }
  },

  async webhook(req: Request, res: Response) {
    try {
      const event = req.body;

      console.log('[Rebill Webhook] Received:', JSON.stringify(event).substring(0, 500));

      await rebillService.handleWebhookEvent(event);

      res.json({ received: true });
    } catch (error) {
      console.error('[Rebill Webhook] Processing error:', error);
      // Always return 200 to Rebill so it doesn't retry
      res.json({ received: true, error: 'Processing error' });
    }
  },

  async cancelSubscription(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return next(new AppError('Authentication required', 401));

      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        include: { organization: true },
      });

      if (!user?.organization?.rebillSubscriptionId) {
        return next(new AppError('No active subscription found', 404));
      }

      await rebillService.cancelSubscription(user.organization.rebillSubscriptionId);

      // Update local state
      await prisma.organization.update({
        where: { id: user.organization.id },
        data: {
          plan: 'canceled',
          rebillSubscriptionId: null,
        },
      });

      res.json({ success: true, message: 'Subscription canceled' });
    } catch (error) {
      console.error('[Rebill] Cancel error:', error);
      next(new AppError('Error canceling subscription', 500));
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
        hasSubscription: !!org.rebillSubscriptionId,
      });
    } catch (error) {
      next(new AppError('Error fetching subscription', 500));
    }
  },
};
