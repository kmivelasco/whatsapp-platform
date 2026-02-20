import { Request, Response, NextFunction } from 'express';
import { exportService } from '../services/export.service';
import { exportQuerySchema } from '../validators/analytics.validator';
import { AppError } from '../middleware/errorHandler';
import { getOrgFilter } from '../middleware/rbac';

type IdParams = { id: string };

export class ExportController {
  async exportConversations(req: Request, res: Response, next: NextFunction) {
    try {
      const { format, from, to } = exportQuerySchema.parse(req.query);
      const organizationId = getOrgFilter(req);

      if (format === 'csv') {
        const csv = await exportService.exportConversationsCSV({ from, to }, organizationId);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=conversations.csv');
        return res.send(csv);
      }

      return next(new AppError('PDF export for conversations list not supported, use per-conversation export', 400));
    } catch (err) {
      next(err);
    }
  }

  async exportConversationMessages(req: Request<IdParams>, res: Response, next: NextFunction) {
    try {
      const format = (req.query.format as string) || 'csv';
      const conversationId = req.params.id;
      const organizationId = getOrgFilter(req);

      if (format === 'csv') {
        const csv = await exportService.exportMessagesCSV(conversationId, organizationId);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=conversation-${conversationId}.csv`);
        return res.send(csv);
      }

      if (format === 'pdf') {
        const pdf = await exportService.exportConversationPDF(conversationId, organizationId);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=conversation-${conversationId}.pdf`);
        return res.send(pdf);
      }

      return next(new AppError('Invalid format, use csv or pdf', 400));
    } catch (err) {
      next(err);
    }
  }

  async exportAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const { from, to } = exportQuerySchema.parse(req.query);
      const organizationId = getOrgFilter(req);
      const csv = await exportService.exportAnalyticsCSV({ from, to }, organizationId);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=analytics.csv');
      res.send(csv);
    } catch (err) {
      next(err);
    }
  }
}

export const exportController = new ExportController();
