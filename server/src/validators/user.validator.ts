import { z } from 'zod';

export const updateUserSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  role: z.enum(['ADMIN', 'AGENT', 'VIEWER']).optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
