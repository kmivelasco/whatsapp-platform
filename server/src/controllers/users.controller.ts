import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/database';
import { createUserSchema, updateUserSchema } from '../validators/user.validator';
import { AppError } from '../middleware/errorHandler';
import { getOrgFilter, isPlatformAdmin } from '../middleware/rbac';

type IdParams = { id: string };

export class UsersController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const input = createUserSchema.parse(req.body);

      // Platform admin can assign any org; org users can only create within their org
      let organizationId = input.organizationId || null;
      if (!isPlatformAdmin(req)) {
        organizationId = req.user!.organizationId || null;
      }

      const existing = await prisma.user.findUnique({ where: { email: input.email } });
      if (existing) {
        return next(new AppError('Email already registered', 409));
      }

      const passwordHash = await bcrypt.hash(input.password, 12);
      const user = await prisma.user.create({
        data: {
          email: input.email,
          passwordHash,
          name: input.name,
          role: input.role,
          organizationId,
        },
        select: { id: true, email: true, name: true, role: true, organizationId: true, createdAt: true },
      });

      res.status(201).json(user);
    } catch (err) {
      if (err instanceof Error && err.name === 'ZodError') {
        return next(new AppError('Invalid input', 400));
      }
      next(err);
    }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const orgFilter = getOrgFilter(req);
      const where = orgFilter ? { organizationId: orgFilter } : {};

      const users = await prisma.user.findMany({
        where,
        select: {
          id: true, email: true, name: true, role: true, organizationId: true, createdAt: true,
          organization: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      res.json(users);
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request<IdParams>, res: Response, next: NextFunction) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.params.id },
        select: { id: true, email: true, name: true, role: true, createdAt: true },
      });
      if (!user) return next(new AppError('User not found', 404));
      res.json(user);
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request<IdParams>, res: Response, next: NextFunction) {
    try {
      const input = updateUserSchema.parse(req.body);
      const user = await prisma.user.update({
        where: { id: req.params.id },
        data: input,
        select: { id: true, email: true, name: true, role: true, createdAt: true },
      });
      res.json(user);
    } catch (err) {
      if (err instanceof Error && err.name === 'ZodError') {
        return next(new AppError('Invalid input', 400));
      }
      next(err);
    }
  }

  async delete(req: Request<IdParams>, res: Response, next: NextFunction) {
    try {
      if (req.params.id === req.user!.userId) {
        return next(new AppError('Cannot delete your own account', 400));
      }
      await prisma.user.delete({ where: { id: req.params.id } });
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
}

export const usersController = new UsersController();
