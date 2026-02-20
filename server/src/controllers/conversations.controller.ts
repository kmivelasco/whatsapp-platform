import { Request, Response, NextFunction } from 'express';
import { conversationService } from '../services/conversation.service';
import { botPipelineService } from '../services/botPipeline.service';
import {
  conversationFiltersSchema,
  updateModeSchema,
  updateStatusSchema,
  assignAgentSchema,
  sendMessageSchema,
} from '../validators/conversation.validator';
import { AppError } from '../middleware/errorHandler';
import { getOrgFilter } from '../middleware/rbac';

export class ConversationsController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = conversationFiltersSchema.parse(req.query);
      const organizationId = getOrgFilter(req);
      const result = await conversationService.list(filters, organizationId);
      res.json(result);
    } catch (err) {
      if (err instanceof Error && err.name === 'ZodError') {
        return next(new AppError('Invalid filters', 400));
      }
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const organizationId = getOrgFilter(req);
      const conversation = await conversationService.getById(id);
      if (!conversation) return next(new AppError('Conversation not found', 404));
      // Tenant isolation: verify conversation belongs to user's org
      if (organizationId && conversation.client?.organizationId !== organizationId) {
        return next(new AppError('Conversation not found', 404));
      }
      res.json(conversation);
    } catch (err) {
      next(err);
    }
  }

  async getMessages(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const organizationId = getOrgFilter(req);
      // Tenant isolation: verify conversation belongs to user's org
      if (organizationId) {
        const conversation = await conversationService.getById(id);
        if (!conversation || conversation.client?.organizationId !== organizationId) {
          return next(new AppError('Conversation not found', 404));
        }
      }
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const result = await conversationService.getMessages(id, page, limit);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async sendMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const organizationId = getOrgFilter(req);
      // Tenant isolation
      if (organizationId) {
        const conversation = await conversationService.getById(id);
        if (!conversation || conversation.client?.organizationId !== organizationId) {
          return next(new AppError('Conversation not found', 404));
        }
      }
      const { content } = sendMessageSchema.parse(req.body);
      const message = await botPipelineService.sendAgentMessage(id, content, req.user!.userId);
      res.status(201).json(message);
    } catch (err) {
      if (err instanceof Error && err.name === 'ZodError') {
        return next(new AppError('Invalid message', 400));
      }
      next(err);
    }
  }

  async updateMode(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const organizationId = getOrgFilter(req);
      if (organizationId) {
        const conversation = await conversationService.getById(id);
        if (!conversation || conversation.client?.organizationId !== organizationId) {
          return next(new AppError('Conversation not found', 404));
        }
      }
      const { mode } = updateModeSchema.parse(req.body);
      const conversation = await conversationService.updateMode(id, mode);
      res.json(conversation);
    } catch (err) {
      next(err);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const organizationId = getOrgFilter(req);
      if (organizationId) {
        const conversation = await conversationService.getById(id);
        if (!conversation || conversation.client?.organizationId !== organizationId) {
          return next(new AppError('Conversation not found', 404));
        }
      }
      const { status } = updateStatusSchema.parse(req.body);
      const conversation = await conversationService.updateStatus(id, status);
      res.json(conversation);
    } catch (err) {
      next(err);
    }
  }

  async assignAgent(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const organizationId = getOrgFilter(req);
      if (organizationId) {
        const conversation = await conversationService.getById(id);
        if (!conversation || conversation.client?.organizationId !== organizationId) {
          return next(new AppError('Conversation not found', 404));
        }
      }
      const { agentId } = assignAgentSchema.parse(req.body);
      const conversation = await conversationService.assignAgent(id, agentId);
      res.json(conversation);
    } catch (err) {
      next(err);
    }
  }
}

export const conversationsController = new ConversationsController();
