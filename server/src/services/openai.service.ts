import OpenAI from 'openai';
import { env } from '../config/env';
import { prisma } from '../config/database';
import { TokenCostMap } from '../types';

// Cost per 1M tokens (USD) — update as pricing changes
const TOKEN_COSTS: TokenCostMap = {
  'gpt-4o': { input: 2.50, output: 10.00 },
  'gpt-4o-mini': { input: 0.15, output: 0.60 },
  'gpt-4-turbo': { input: 10.00, output: 30.00 },
};

interface GenerateOptions {
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

interface GenerateResult {
  content: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  model: string;
  estimatedCost: number;
}

export class OpenAIService {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  }

  async generateResponse(options: GenerateOptions): Promise<GenerateResult> {
    const model = options.model || env.OPENAI_DEFAULT_MODEL;

    const completion = await this.client.chat.completions.create({
      model,
      messages: options.messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 1024,
    });

    const choice = completion.choices[0];
    const usage = completion.usage;

    const promptTokens = usage?.prompt_tokens ?? 0;
    const completionTokens = usage?.completion_tokens ?? 0;
    const totalTokens = promptTokens + completionTokens;
    const estimatedCost = this.calculateCost(model, promptTokens, completionTokens);

    return {
      content: choice?.message?.content ?? '',
      promptTokens,
      completionTokens,
      totalTokens,
      model,
      estimatedCost,
    };
  }

  async recordTokenUsage(
    conversationId: string,
    messageId: string,
    result: GenerateResult
  ) {
    await prisma.tokenUsage.create({
      data: {
        conversationId,
        messageId,
        promptTokens: result.promptTokens,
        completionTokens: result.completionTokens,
        totalTokens: result.totalTokens,
        model: result.model,
        estimatedCost: result.estimatedCost,
      },
    });
  }

  private calculateCost(model: string, promptTokens: number, completionTokens: number): number {
    const costs = TOKEN_COSTS[model] ?? TOKEN_COSTS['gpt-4o'];
    const inputCost = (promptTokens / 1_000_000) * costs.input;
    const outputCost = (completionTokens / 1_000_000) * costs.output;
    return parseFloat((inputCost + outputCost).toFixed(6));
  }
}

export const openaiService = new OpenAIService();
