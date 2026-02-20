import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from './env';
import { prisma } from './database';

let io: Server;

interface AuthPayload {
  userId: string;
  role: string;
  organizationId?: string;
}

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
  organizationId?: string;
}

export function initializeSocket(httpServer: HttpServer): Server {
  const corsOrigin = env.CORS_ORIGIN || true;

  io = new Server(httpServer, {
    cors: {
      origin: corsOrigin,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as AuthPayload;
      socket.userId = payload.userId;
      socket.userRole = payload.role;
      socket.organizationId = payload.organizationId;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`User connected: ${socket.userId}`);

    socket.on('join_conversation', async (conversationId: string) => {
      try {
        // Tenant isolation: verify conversation belongs to user's org
        // Platform admins (no organizationId) can join any conversation
        if (socket.organizationId) {
          const conversation = await prisma.conversation.findFirst({
            where: {
              id: conversationId,
              client: { organizationId: socket.organizationId },
            },
          });
          if (!conversation) {
            socket.emit('error', { message: 'Conversation not found' });
            return;
          }
        }
        socket.join(`conversation:${conversationId}`);
      } catch (err) {
        console.error('Error joining conversation:', err);
        socket.emit('error', { message: 'Failed to join conversation' });
      }
    });

    socket.on('leave_conversation', (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
}
