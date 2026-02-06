import { ConversationMode, ConversationStatus, Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { PaginatedResponse } from '../types';

interface ConversationFilters {
  page?: number;
  limit?: number;
  status?: ConversationStatus;
  mode?: ConversationMode;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  clientId?: string;
  assignedAgentId?: string;
}

export class ConversationService {
  async list(filters: ConversationFilters): Promise<PaginatedResponse<any>> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.ConversationWhereInput = {};

    if (filters.status) where.status = filters.status;
    if (filters.mode) where.mode = filters.mode;
    if (filters.clientId) where.clientId = filters.clientId;
    if (filters.assignedAgentId) where.assignedAgentId = filters.assignedAgentId;

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo);
    }

    if (filters.search) {
      where.OR = [
        { client: { name: { contains: filters.search, mode: 'insensitive' } } },
        { client: { phoneNumber: { contains: filters.search } } },
        { messages: { some: { content: { contains: filters.search, mode: 'insensitive' } } } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.conversation.findMany({
        where,
        include: {
          client: true,
          assignedAgent: { select: { id: true, name: true, email: true } },
          messages: { orderBy: { timestamp: 'desc' }, take: 1 },
          _count: { select: { messages: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.conversation.count({ where }),
    ]);

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getById(id: string) {
    return prisma.conversation.findUnique({
      where: { id },
      include: {
        client: true,
        assignedAgent: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async getMessages(conversationId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: { conversationId },
        orderBy: { timestamp: 'asc' },
        skip,
        take: limit,
      }),
      prisma.message.count({ where: { conversationId } }),
    ]);

    return {
      data: messages,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async updateMode(id: string, mode: ConversationMode) {
    return prisma.conversation.update({
      where: { id },
      data: { mode },
      include: { client: true },
    });
  }

  async updateStatus(id: string, status: ConversationStatus) {
    return prisma.conversation.update({
      where: { id },
      data: { status },
      include: { client: true },
    });
  }

  async assignAgent(id: string, agentId: string | null) {
    return prisma.conversation.update({
      where: { id },
      data: {
        assignedAgentId: agentId,
        mode: agentId ? 'HUMAN' : 'BOT',
      },
      include: {
        client: true,
        assignedAgent: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async findOrCreateForClient(phoneNumber: string, contactName?: string) {
    let client = await prisma.client.findUnique({
      where: { phoneNumber },
    });

    if (!client) {
      client = await prisma.client.create({
        data: { phoneNumber, name: contactName ?? null },
      });
    } else if (contactName && !client.name) {
      client = await prisma.client.update({
        where: { id: client.id },
        data: { name: contactName },
      });
    }

    let conversation = await prisma.conversation.findFirst({
      where: { clientId: client.id, status: 'ACTIVE' },
      include: { client: true },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: { clientId: client.id },
        include: { client: true },
      });
    }

    return { client, conversation };
  }
}

export const conversationService = new ConversationService();
