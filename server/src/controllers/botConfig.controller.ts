import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { createBotConfigSchema, updateBotConfigSchema } from '../validators/botConfig.validator';
import { AppError } from '../middleware/errorHandler';

type IdParams = { id: string };

export class BotConfigController {
  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      const configs = await prisma.botConfig.findMany({
        orderBy: { createdAt: 'desc' },
      });
      res.json(configs);
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request<IdParams>, res: Response, next: NextFunction) {
    try {
      const config = await prisma.botConfig.findUnique({
        where: { id: req.params.id },
      });
      if (!config) return next(new AppError('Bot config not found', 404));
      res.json(config);
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const input = createBotConfigSchema.parse(req.body);

      // If setting as active, deactivate others
      if (input.isActive) {
        await prisma.botConfig.updateMany({
          where: { isActive: true },
          data: { isActive: false },
        });
      }

      const config = await prisma.botConfig.create({ data: input });
      res.status(201).json(config);
    } catch (err) {
      if (err instanceof Error && err.name === 'ZodError') {
        return next(new AppError('Invalid input', 400));
      }
      next(err);
    }
  }

  async update(req: Request<IdParams>, res: Response, next: NextFunction) {
    try {
      const input = updateBotConfigSchema.parse(req.body);

      if (input.isActive) {
        await prisma.botConfig.updateMany({
          where: { isActive: true, NOT: { id: req.params.id } },
          data: { isActive: false },
        });
      }

      const config = await prisma.botConfig.update({
        where: { id: req.params.id },
        data: input,
      });
      res.json(config);
    } catch (err) {
      if (err instanceof Error && err.name === 'ZodError') {
        return next(new AppError('Invalid input', 400));
      }
      next(err);
    }
  }

  async delete(req: Request<IdParams>, res: Response, next: NextFunction) {
    try {
      await prisma.botConfig.delete({ where: { id: req.params.id } });
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
}

export const botConfigController = new BotConfigController();
