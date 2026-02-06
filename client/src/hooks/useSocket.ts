import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../stores/authStore';

const WS_URL = import.meta.env.VITE_WS_URL || '';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (!token) return;

    const socket = io(WS_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('Socket connected');
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
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
