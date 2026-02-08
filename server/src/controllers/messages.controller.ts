import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { getOrgFilter } from '../middleware/rbac';

export class MessagesController {
  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const { q, page = '1', limit = '20' } = req.query;
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      if (!q) {
        return res.json({ data: [], pagination: { page: pageNum, limit: limitNum, total: 0, totalPages: 0 } });
      }

      const orgFilter = getOrgFilter(req);
      const where: Prisma.MessageWhereInput = {
        content: { contains: q as string, mode: 'insensitive' },
        ...(orgFilter ? { conversation: { client: { organizationId: orgFilter } } } : {}),
      };

      const [messages, total] = await Promise.all([
        prisma.message.findMany({
          where,
          include: {
            conversation: { include: { client: true } },
          },
          orderBy: { timestamp: 'desc' },
          skip,
          take: limitNum,
        }),
        prisma.message.count({ where }),
      ]);

      res.json({
        data: messages,
        pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
      });
    } catch (err) {
      next(err);
    }
  }
}

export const messagesController = new MessagesController();
