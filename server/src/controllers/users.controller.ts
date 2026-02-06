import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { updateUserSchema } from '../validators/user.validator';
import { AppError } from '../middleware/errorHandler';

type IdParams = { id: string };

export class UsersController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await prisma.user.findMany({
        select: { id: true, email: true, name: true, role: true, createdAt: true },
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
