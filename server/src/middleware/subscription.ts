import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AppError } from './errorHandler';

/**
 * Middleware that checks if the user's organization has an active subscription.
 * Active means: plan is 'pro', or plan is 'trial' and trialEndsAt is in the future.
 * Platform admins (no organizationId) are always allowed through.
 */
export async function requireActiveSubscription(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) return next(new AppError('Authentication required', 401));

    // Platform admins without org bypass subscription check
    if (!req.user.organizationId) return next();

    const org = await prisma.organization.findUnique({
      where: { id: req.user.organizationId },
      select: { plan: true, trialEndsAt: true },
    });

    if (!org) return next(new AppError('Organization not found', 404));

    // Pro plan is always active
    if (org.plan === 'pro') return next();

    // Trial plan: check if trial hasn't expired
    if (org.plan === 'trial') {
      if (org.trialEndsAt && new Date() < org.trialEndsAt) {
        return next();
      }
      // Trial expired - set plan to expired
      await prisma.organization.update({
        where: { id: req.user.organizationId },
        data: { plan: 'expired' },
      });
    }

    // Blocked: no active subscription
    return next(
      new AppError(
        'Subscription required. Please upgrade to continue using the platform.',
        402,
      ),
    );
  } catch (error) {
    next(error);
  }
}
