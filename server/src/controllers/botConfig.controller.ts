import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { createBotConfigSchema, updateBotConfigSchema } from '../validators/botConfig.validator';
import { AppError } from '../middleware/errorHandler';
import { getOrgFilter, isPlatformAdmin } from '../middleware/rbac';

type IdParams = { id: string };

export class BotConfigController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const orgFilter = getOrgFilter(req);
      const where = orgFilter ? { organizationId: orgFilter } : {};

      const configs = await prisma.botConfig.findMany({
        where,
        include: { organization: { select: { id: true, name: true, slug: true } } },
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
        include: { organization: { select: { id: true, name: true, slug: true } } },
      });
      if (!config) return next(new AppError('Bot config not found', 404));

      // Tenant check
      const orgFilter = getOrgFilter(req);
      if (orgFilter && config.organizationId !== orgFilter) {
        return next(new AppError('Bot config not found', 404));
      }

      res.json(config);
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const input = createBotConfigSchema.parse(req.body);

      // Platform admin must specify organizationId; org users use their own
      let organizationId = input.organizationId;
      if (!isPlatformAdmin(req)) {
        organizationId = req.user!.organizationId!;
      }
      if (!organizationId) {
        return next(new AppError('organizationId is required', 400));
      }

      const config = await prisma.botConfig.create({
        data: {
          name: input.name,
          systemPrompt: input.systemPrompt,
          aiProvider: input.aiProvider,
          aiApiKey: input.aiApiKey,
          model: input.model,
          temperature: input.temperature,
          maxTokens: input.maxTokens,
          organizationId,
          whatsappPhoneNumberId: input.whatsappPhoneNumberId,
          whatsappApiToken: input.whatsappApiToken,
          whatsappVerifyToken: input.whatsappVerifyToken,
          whatsappBusinessAccountId: input.whatsappBusinessAccountId,
        },
      });
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

      // Tenant check
      const existing = await prisma.botConfig.findUnique({ where: { id: req.params.id } });
      if (!existing) return next(new AppError('Bot config not found', 404));

      const orgFilter = getOrgFilter(req);
      if (orgFilter && existing.organizationId !== orgFilter) {
        return next(new AppError('Bot config not found', 404));
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
      const existing = await prisma.botConfig.findUnique({ where: { id: req.params.id } });
      if (!existing) return next(new AppError('Bot config not found', 404));

      const orgFilter = getOrgFilter(req);
      if (orgFilter && existing.organizationId !== orgFilter) {
        return next(new AppError('Bot config not found', 404));
      }

      await prisma.botConfig.delete({ where: { id: req.params.id } });
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
}

export const botConfigController = new BotConfigController();
