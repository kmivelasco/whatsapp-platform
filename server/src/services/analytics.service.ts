import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';

interface AnalyticsQuery {
  from?: string;
  to?: string;
  groupBy?: 'day' | 'week' | 'month';
  conversationId?: string;
}

export class AnalyticsService {
  async getTokenUsage(query: AnalyticsQuery) {
    const where: Prisma.TokenUsageWhereInput = {};

    if (query.conversationId) where.conversationId = query.conversationId;
    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) where.createdAt.gte = new Date(query.from);
      if (query.to) where.createdAt.lte = new Date(query.to);
    }

    const usages = await prisma.tokenUsage.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });

    // Aggregate by groupBy period
    const grouped = this.groupByPeriod(usages, query.groupBy ?? 'day');

    const totals = usages.reduce(
      (acc, u) => ({
        promptTokens: acc.promptTokens + u.promptTokens,
        completionTokens: acc.completionTokens + u.completionTokens,
        totalTokens: acc.totalTokens + u.totalTokens,
        estimatedCost: acc.estimatedCost + Number(u.estimatedCost),
      }),
      { promptTokens: 0, completionTokens: 0, totalTokens: 0, estimatedCost: 0 }
    );

    return { grouped, totals };
  }

  async getCostBreakdown(query: AnalyticsQuery) {
    const where: Prisma.TokenUsageWhereInput = {};
    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) where.createdAt.gte = new Date(query.from);
      if (query.to) where.createdAt.lte = new Date(query.to);
    }

    const byModel = await prisma.tokenUsage.groupBy({
      by: ['model'],
      where,
      _sum: {
        promptTokens: true,
        completionTokens: true,
        totalTokens: true,
        estimatedCost: true,
      },
      _count: true,
    });

    return byModel.map((row) => ({
      model: row.model,
      requests: row._count,
      promptTokens: row._sum.promptTokens ?? 0,
      completionTokens: row._sum.completionTokens ?? 0,
      totalTokens: row._sum.totalTokens ?? 0,
      estimatedCost: Number(row._sum.estimatedCost ?? 0),
    }));
  }

  async getMessageVolume(query: AnalyticsQuery) {
    const where: Prisma.MessageWhereInput = {};
    if (query.from || query.to) {
      where.timestamp = {};
      if (query.from) where.timestamp.gte = new Date(query.from);
      if (query.to) where.timestamp.lte = new Date(query.to);
    }

    const messages = await prisma.message.findMany({
      where,
      select: { senderType: true, timestamp: true },
      orderBy: { timestamp: 'asc' },
    });

    const grouped = new Map<string, { client: number; bot: number; agent: number }>();

    for (const msg of messages) {
      const key = this.getPeriodKey(msg.timestamp, query.groupBy ?? 'day');
      const entry = grouped.get(key) ?? { client: 0, bot: 0, agent: 0 };
      const senderKey = msg.senderType.toLowerCase() as 'client' | 'bot' | 'agent';
      entry[senderKey]++;
      grouped.set(key, entry);
    }

    return Array.from(grouped.entries()).map(([period, counts]) => ({
      period,
      ...counts,
      total: counts.client + counts.bot + counts.agent,
    }));
  }

  async getResponseTimes(query: AnalyticsQuery) {
    const where: Prisma.ConversationWhereInput = {};
    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) where.createdAt.gte = new Date(query.from);
      if (query.to) where.createdAt.lte = new Date(query.to);
    }

    const conversations = await prisma.conversation.findMany({
      where,
      include: {
        messages: { orderBy: { timestamp: 'asc' }, take: 10 },
      },
    });

    const responseTimes: number[] = [];

    for (const conv of conversations) {
      for (let i = 0; i < conv.messages.length - 1; i++) {
        const current = conv.messages[i];
        const next = conv.messages[i + 1];
        if (current.senderType === 'CLIENT' && next.senderType !== 'CLIENT') {
          const diff = next.timestamp.getTime() - current.timestamp.getTime();
          responseTimes.push(diff / 1000); // seconds
        }
      }
    }

    const avg = responseTimes.length
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;
    const sorted = [...responseTimes].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length
      ? sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
      : 0;

    return {
      averageSeconds: Math.round(avg * 100) / 100,
      medianSeconds: Math.round(median * 100) / 100,
      totalMeasured: responseTimes.length,
    };
  }

  async getSummary() {
    const [totalConversations, activeConversations, totalMessages, totalTokenUsage] =
      await Promise.all([
        prisma.conversation.count(),
        prisma.conversation.count({ where: { status: 'ACTIVE' } }),
        prisma.message.count(),
        prisma.tokenUsage.aggregate({
          _sum: { totalTokens: true, estimatedCost: true },
        }),
      ]);

    return {
      totalConversations,
      activeConversations,
      totalMessages,
      totalTokens: totalTokenUsage._sum.totalTokens ?? 0,
      totalCost: Number(totalTokenUsage._sum.estimatedCost ?? 0),
    };
  }

  private groupByPeriod(usages: any[], groupBy: string) {
    const grouped = new Map<string, any>();

    for (const usage of usages) {
      const key = this.getPeriodKey(usage.createdAt, groupBy);
      const entry = grouped.get(key) ?? {
        period: key,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        estimatedCost: 0,
        count: 0,
      };
      entry.promptTokens += usage.promptTokens;
      entry.completionTokens += usage.completionTokens;
      entry.totalTokens += usage.totalTokens;
      entry.estimatedCost += Number(usage.estimatedCost);
      entry.count++;
      grouped.set(key, entry);
    }

    return Array.from(grouped.values());
  }

  private getPeriodKey(date: Date, groupBy: string): string {
    const d = new Date(date);
    switch (groupBy) {
      case 'week': {
        const day = d.getDay();
        d.setDate(d.getDate() - day);
        return d.toISOString().split('T')[0];
      }
      case 'month':
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      default:
        return d.toISOString().split('T')[0];
    }
  }
}

export const analyticsService = new AnalyticsService();
