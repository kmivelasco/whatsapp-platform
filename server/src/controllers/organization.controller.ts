import { Request, Response, NextFunction } from 'express';
import { organizationService } from '../services/organization.service';
import { createOrganizationSchema, updateOrganizationSchema } from '../validators/organization.validator';
import { AppError } from '../middleware/errorHandler';

type IdParams = { id: string };

export class OrganizationController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const result = await organizationService.list(page, limit);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request<IdParams>, res: Response, next: NextFunction) {
    try {
      const org = await organizationService.getById(req.params.id);
      if (!org) return next(new AppError('Organization not found', 404));
      res.json(org);
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const input = createOrganizationSchema.parse(req.body);
      const org = await organizationService.create(input);
      res.status(201).json(org);
    } catch (err) {
      if (err instanceof Error && err.name === 'ZodError') {
        return next(new AppError('Invalid input', 400));
      }
      next(err);
    }
  }

  async update(req: Request<IdParams>, res: Response, next: NextFunction) {
    try {
      const input = updateOrganizationSchema.parse(req.body);
      const org = await organizationService.update(req.params.id, input);
      res.json(org);
    } catch (err) {
      if (err instanceof Error && err.name === 'ZodError') {
        return next(new AppError('Invalid input', 400));
      }
      next(err);
    }
  }

  async delete(req: Request<IdParams>, res: Response, next: NextFunction) {
    try {
      await organizationService.delete(req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
}

export const organizationController = new OrganizationController();
