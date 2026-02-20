import PDFDocument from 'pdfkit';
import { prisma } from '../config/database';

export class ExportService {
  async exportConversationsCSV(filters: { from?: string; to?: string }, organizationId?: string) {
    const where: any = {};
    if (filters.from || filters.to) {
      where.createdAt = {};
      if (filters.from) where.createdAt.gte = new Date(filters.from);
      if (filters.to) where.createdAt.lte = new Date(filters.to);
    }
    // Tenant isolation: filter by organization through client
    if (organizationId) {
      where.client = { organizationId };
    }

    const conversations = await prisma.conversation.findMany({
      where,
      include: {
        client: true,
        messages: { orderBy: { timestamp: 'asc' } },
        _count: { select: { messages: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const rows: string[] = [
      'Conversation ID,Client Name,Phone Number,Status,Mode,Messages Count,Created At',
    ];

    for (const conv of conversations) {
      rows.push(
        [
          conv.id,
          `"${conv.client.name ?? 'Unknown'}"`,
          conv.client.phoneNumber,
          conv.status,
          conv.mode,
          conv._count.messages,
          conv.createdAt.toISOString(),
        ].join(',')
      );
    }

    return rows.join('\n');
  }

  async exportMessagesCSV(conversationId: string, organizationId?: string) {
    // Tenant isolation: verify conversation belongs to org
    if (organizationId) {
      const conversation = await prisma.conversation.findFirst({
        where: { id: conversationId, client: { organizationId } },
      });
      if (!conversation) throw new Error('Conversation not found');
    }

    const messages = await prisma.message.findMany({
      where: { conversationId },
      include: { conversation: { include: { client: true } } },
      orderBy: { timestamp: 'asc' },
    });

    const rows: string[] = [
      'Message ID,Sender Type,Content,Timestamp,WA Message ID',
    ];

    for (const msg of messages) {
      rows.push(
        [
          msg.id,
          msg.senderType,
          `"${msg.content.replace(/"/g, '""').replace(/\n/g, ' ').replace(/\r/g, '')}"`,
          msg.timestamp.toISOString(),
          msg.waMessageId ?? '',
        ].join(',')
      );
    }

    return rows.join('\n');
  }

  async exportAnalyticsCSV(filters: { from?: string; to?: string }, organizationId?: string) {
    const where: any = {};
    if (filters.from || filters.to) {
      where.createdAt = {};
      if (filters.from) where.createdAt.gte = new Date(filters.from);
      if (filters.to) where.createdAt.lte = new Date(filters.to);
    }
    // Tenant isolation: filter through conversation → client → organization
    if (organizationId) {
      where.conversation = { client: { organizationId } };
    }

    const usages = await prisma.tokenUsage.findMany({
      where,
      include: { conversation: { include: { client: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const rows: string[] = [
      'Date,Conversation ID,Client,Model,Prompt Tokens,Completion Tokens,Total Tokens,Estimated Cost',
    ];

    for (const usage of usages) {
      rows.push(
        [
          usage.createdAt.toISOString(),
          usage.conversationId,
          `"${usage.conversation.client.name ?? 'Unknown'}"`,
          usage.model,
          usage.promptTokens,
          usage.completionTokens,
          usage.totalTokens,
          Number(usage.estimatedCost).toFixed(6),
        ].join(',')
      );
    }

    return rows.join('\n');
  }

  async exportConversationPDF(conversationId: string, organizationId?: string): Promise<Buffer> {
    const whereClause: any = { id: conversationId };
    // Tenant isolation: verify conversation belongs to org
    if (organizationId) {
      whereClause.client = { organizationId };
    }

    const conversation = await prisma.conversation.findFirst({
      where: whereClause,
      include: {
        client: true,
        messages: { orderBy: { timestamp: 'asc' } },
      },
    });

    if (!conversation) throw new Error('Conversation not found');

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const buffers: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Header
      doc.fontSize(18).text('Conversation Export', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Client: ${conversation.client.name ?? conversation.client.phoneNumber}`);
      doc.text(`Phone: ${conversation.client.phoneNumber}`);
      doc.text(`Status: ${conversation.status} | Mode: ${conversation.mode}`);
      doc.text(`Date: ${conversation.createdAt.toLocaleDateString()}`);
      doc.moveDown();
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();

      // Messages
      for (const msg of conversation.messages) {
        const label =
          msg.senderType === 'CLIENT' ? 'Client' :
          msg.senderType === 'BOT' ? 'Bot' : 'Agent';
        const time = msg.timestamp.toLocaleTimeString();

        doc.fontSize(10).fillColor('#666').text(`[${time}] ${label}:`, { continued: false });
        doc.fontSize(11).fillColor('#000').text(msg.content);
        doc.moveDown(0.5);
      }

      doc.end();
    });
  }
}

export const exportService = new ExportService();
