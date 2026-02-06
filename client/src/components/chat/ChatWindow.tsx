import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { X, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { useMessages, useSendMessage, useUpdateMode, useConversation } from '../../hooks/useConversations';
import { useSocket } from '../../hooks/useSocket';
import { useAuthStore } from '../../stores/authStore';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import HandoverToggle from './HandoverToggle';
import api from '../../api/client';

interface ChatWindowProps {
  conversationId: string;
  onClose: () => void;
}

export default function ChatWindow({ conversationId, onClose }: ChatWindowProps) {
  const { data: conversation } = useConversation(conversationId);
  const { data: messagesData } = useMessages(conversationId);
  const sendMessage = useSendMessage();
  const updateMode = useUpdateMode();
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { joinConversation, leaveConversation, onNewMessage } = useSocket();
  const [liveMessages, setLiveMessages] = useState<any[]>([]);

  useEffect(() => {
    joinConversation(conversationId);
    return () => leaveConversation(conversationId);
  }, [conversationId, joinConversation, leaveConversation]);

  useEffect(() => {
    const cleanup = onNewMessage((msg: any) => {
      if (msg.conversationId === conversationId || msg.conversation?.id === conversationId) {
        setLiveMessages((prev) => [...prev, msg]);
      }
    });
    return cleanup;
  }, [conversationId, onNewMessage]);

  useEffect(() => {
    setLiveMessages([]);
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagesData, liveMessages]);

  const allMessages = [
    ...(messagesData?.data || []),
    ...liveMessages.filter(
      (lm) => !(messagesData?.data || []).some((m: any) => m.id === lm.id)
    ),
  ];

  const handleSend = (content: string) => {
    sendMessage.mutate({ conversationId, content });
  };

  const handleModeToggle = (mode: 'BOT' | 'HUMAN') => {
    updateMode.mutate({ conversationId, mode });
  };

  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      const response = await api.get(`/export/conversations/${conversationId}?format=${format}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `conversation-${conversationId}.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error(`Failed to export as ${format.toUpperCase()}`);
    }
  };

  const canSend = user?.role !== 'VIEWER' && conversation?.mode === 'HUMAN';

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        <div>
          <h3 className="font-medium text-gray-900">
            {conversation?.client?.name || conversation?.client?.phoneNumber || 'Loading...'}
          </h3>
          <p className="text-xs text-gray-500">{conversation?.client?.phoneNumber}</p>
        </div>
        <div className="flex items-center gap-3">
          <HandoverToggle
            mode={conversation?.mode || 'BOT'}
            onToggle={handleModeToggle}
            disabled={user?.role === 'VIEWER'}
          />
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleExport('csv')}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded"
              title="Export CSV"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {allMessages.map((msg: any) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <MessageInput onSend={handleSend} disabled={!canSend} />
    </div>
  );
}
