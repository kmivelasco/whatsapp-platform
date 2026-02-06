import { z } from 'zod';

export const createBotConfigSchema = z.object({
  name: z.string().min(1).max(255),
  systemPrompt: z.string().min(1).max(10000),
  model: z.string().default('gpt-4o'),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().int().min(1).max(16384).default(1024),
  isActive: z.boolean().default(false),
});

export const updateBotConfigSchema = createBotConfigSchema.partial();

export type CreateBotConfigInput = z.infer<typeof createBotConfigSchema>;
export type UpdateBotConfigInput = z.infer<typeof updateBotConfigSchema>;
