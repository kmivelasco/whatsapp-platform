import { Request, Response, NextFunction } from 'express';
import { analyticsService } from '../services/analytics.service';
import { analyticsQuerySchema } from '../validators/analytics.validator';
import { AppError } from '../middleware/errorHandler';

export class AnalyticsController {
  async getTokenUsage(req: Request, res: Response, next: NextFunction) {
    try {
      const query = analyticsQuerySchema.parse(req.query);
      const result = await analyticsService.getTokenUsage(query);
      res.json(result);
    } catch (err) {
      if (err instanceof Error && err.name === 'ZodError') {
        return next(new AppError('Invalid query parameters', 400));
      }
      next(err);
    }
  }

  async getCostBreakdown(req: Request, res: Response, next: NextFunction) {
    try {
      const query = analyticsQuerySchema.parse(req.query);
      const result = await analyticsService.getCostBreakdown(query);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async getMessageVolume(req: Request, res: Response, next: NextFunction) {
    try {
      const query = analyticsQuerySchema.parse(req.query);
      const result = await analyticsService.getMessageVolume(query);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async getResponseTimes(req: Request, res: Response, next: NextFunction) {
    try {
      const query = analyticsQuerySchema.parse(req.query);
      const result = await analyticsService.getResponseTimes(query);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async getSummary(_req: Request, res: Response, next: NextFunction) {
    try {
      const result = await analyticsService.getSummary();
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}

export const analyticsController = new AnalyticsController();
