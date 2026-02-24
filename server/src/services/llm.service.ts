import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { env } from '../config/env';
import { prisma } from '../config/database';
import { TokenCostMap } from '../types';

// Cost per 1M tokens (USD)
const TOKEN_COSTS: TokenCostMap = {
  // OpenAI models
  'gpt-4o': { input: 2.50, output: 10.00 },
  'gpt-4o-mini': { input: 0.15, output: 0.60 },
  'gpt-4-turbo': { input: 10.00, output: 30.00 },
  // Anthropic/Claude models
  'claude-opus-4-20250514': { input: 15.00, output: 75.00 },
  'claude-sonnet-4-20250514': { input: 3.00, output: 15.00 },
  'claude-haiku-4-20250506': { input: 0.80, output: 4.00 },
};

export type AiProvider = 'openai' | 'anthropic';

interface GenerateOptions {
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  provider?: AiProvider;
  apiKey?: string | null;
}

interface GenerateResult {
  content: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  model: string;
  estimatedCost: number;
}

export class LLMService {
  private async generateWithOpenAI(options: GenerateOptions): Promise<GenerateResult> {
    const apiKey = options.apiKey || env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not configured. Set OPENAI_API_KEY or provide a per-bot API key.');
    }
    const client = new OpenAI({ apiKey });
    const model = options.model || env.OPENAI_DEFAULT_MODEL;

    const completion = await client.chat.completions.create({
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

  private async generateWithAnthropic(options: GenerateOptions): Promise<GenerateResult> {
    const apiKey = options.apiKey;
    if (!apiKey) {
      throw new Error('Anthropic API key is required. Provide a per-bot API key for Claude models.');
    }
    const client = new Anthropic({ apiKey });
    const model = options.model || 'claude-sonnet-4-20250514';

    // Separate system message from conversation messages
    const systemMessage = options.messages.find(m => m.role === 'system')?.content || '';
    const conversationMessages = options.messages
      .filter(m => m.role !== 'system')
      .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    // Ensure conversation starts with a user message (Anthropic requirement)
    if (conversationMessages.length === 0 || conversationMessages[0].role !== 'user') {
      conversationMessages.unshift({ role: 'user', content: '...' });
    }

    const response = await client.messages.create({
      model,
      max_tokens: options.maxTokens ?? 1024,
      temperature: options.temperature ?? 0.7,
      system: systemMessage,
      messages: conversationMessages,
    });

    const content = response.content
      .filter(block => block.type === 'text')
      .map(block => (block as Anthropic.TextBlock).text)
      .join('');

    const promptTokens = response.usage.input_tokens;
    const completionTokens = response.usage.output_tokens;
    const totalTokens = promptTokens + completionTokens;
    const estimatedCost = this.calculateCost(model, promptTokens, completionTokens);

    return {
      content,
      promptTokens,
      completionTokens,
      totalTokens,
      model,
      estimatedCost,
    };
  }

  async generateResponse(options: GenerateOptions): Promise<GenerateResult> {
    const provider = options.provider || 'openai';

    if (provider === 'anthropic') {
      return this.generateWithAnthropic(options);
    }
    return this.generateWithOpenAI(options);
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

export const llmService = new LLMService();
