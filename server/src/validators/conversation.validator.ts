import { z } from 'zod';

export const conversationFiltersSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(['ACTIVE', 'CLOSED']).optional(),
  mode: z.enum(['BOT', 'HUMAN']).optional(),
  search: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  clientId: z.string().optional(),
  assignedAgentId: z.string().optional(),
});

export const updateModeSchema = z.object({
  mode: z.enum(['BOT', 'HUMAN']),
});

export const updateStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'CLOSED']),
});

export const assignAgentSchema = z.object({
  agentId: z.string().nullable(),
});

export const sendMessageSchema = z.object({
  content: z.string().min(1).max(4096),
});
