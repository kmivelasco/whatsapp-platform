import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { AppError } from './errorHandler';

export function authorize(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError('Insufficient permissions', 403));
    }
    next();
  };
}

// Platform admin = ADMIN role with no organizationId (sees everything)
export function isPlatformAdmin(req: Request): boolean {
  return req.user?.role === 'ADMIN' && !req.user?.organizationId;
}

// Get the organizationId to filter by (undefined for platform admins = no filter)
export function getOrgFilter(req: Request): string | undefined {
  if (isPlatformAdmin(req)) return undefined;
  return req.user?.organizationId;
}
