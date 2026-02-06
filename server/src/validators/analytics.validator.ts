import { z } from 'zod';

export const analyticsQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  groupBy: z.enum(['day', 'week', 'month']).default('day'),
  conversationId: z.string().optional(),
});

export const exportQuerySchema = z.object({
  format: z.enum(['csv', 'pdf']).default('csv'),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});
