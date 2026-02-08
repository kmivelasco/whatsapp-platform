import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../stores/authStore';

const WS_URL = import.meta.env.VITE_WS_URL || '';

// Singleton socket instance to avoid multiple connections
let globalSocket: Socket | null = null;
let socketRefCount = 0;

function getSocket(token: string): Socket {
  if (!globalSocket || globalSocket.disconnected) {
    globalSocket = io(WS_URL, {
      auth: { token },
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    globalSocket.on('connect', () => {
      console.log('Socket connected');
    });

    globalSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    globalSocket.on('connect_error', (err) => {
      console.log('Socket connection error:', err.message);
    });
  }
  return globalSocket;
}

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (!token) return;

    const socket = getSocket(token);
    socketRef.current = socket;
    socketRefCount++;

    return () => {
      socketRefCount--;
      if (socketRefCount <= 0) {
        socket.disconnect();
        globalSocket = null;
        socketRefCount = 0;
      }
      socketRef.current = null;
    };
  }, [token]);

  const joinConversation = useCallback((conversationId: string) => {
    socketRef.current?.emit('join_conversation', conversationId);
  }, []);

  const leaveConversation = useCallback((conversationId: string) => {
    socketRef.current?.emit('leave_conversation', conversationId);
  }, []);

  const onNewMessage = useCallback((callback: (message: any) => void) => {
    socketRef.current?.on('new_message', callback);
    return () => {
      socketRef.current?.off('new_message', callback);
    };
  }, []);

  const onConversationUpdated = useCallback((callback: (data: any) => void) => {
    socketRef.current?.on('conversation_updated', callback);
    return () => {
      socketRef.current?.off('conversation_updated', callback);
    };
  }, []);

  return {
    socket: socketRef.current,
    joinConversation,
    leaveConversation,
    onNewMessage,
    onConversationUpdated,
  };
}
