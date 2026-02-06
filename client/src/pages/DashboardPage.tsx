import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useConversations } from '../hooks/useConversations';
import { useSocket } from '../hooks/useSocket';
import { useChatStore } from '../stores/chatStore';
import Header from '../components/layout/Header';
import ConversationList from '../components/chat/ConversationList';
import ChatWindow from '../components/chat/ChatWindow';
import SearchFilters from '../components/common/SearchFilters';
import { MessageSquare } from 'lucide-react';

export default function DashboardPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [mode, setMode] = useState('');
  const { activeConversationId, setActiveConversation } = useChatStore();
  const queryClient = useQueryClient();

  const { data, isLoading } = useConversations({
    search: search || undefined,
    status: status || undefined,
    mode: mode || undefined,
    limit: 50,
  });

  const { onConversationUpdated } = useSocket();

  useEffect(() => {
    const cleanup = onConversationUpdated(() => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    });
    return cleanup;
  }, [onConversationUpdated, queryClient]);

  return (
    <div className="flex flex-col h-full">
      <Header title="Conversations" />
      <div className="flex flex-1 overflow-hidden">
        {/* Conversation List Panel */}
        <div className="w-80 border-r border-gray-200 bg-white flex flex-col">
          <SearchFilters
            search={search}
            onSearchChange={setSearch}
            status={status}
            onStatusChange={setStatus}
            mode={mode}
            onModeChange={setMode}
          />
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
            </div>
          ) : (
            <ConversationList
              conversations={data?.data || []}
              activeId={activeConversationId}
              onSelect={setActiveConversation}
            />
          )}
          {data?.pagination && (
            <div className="p-3 border-t border-gray-200 text-xs text-gray-500 text-center">
              {data.pagination.total} conversations
            </div>
          )}
        </div>

        {/* Chat Panel */}
        <div className="flex-1 bg-gray-50">
          {activeConversationId ? (
            <ChatWindow
              conversationId={activeConversationId}
              onClose={() => setActiveConversation(null)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <MessageSquare className="w-16 h-16 mb-4" />
              <p className="text-lg font-medium">Select a conversation</p>
              <p className="text-sm mt-1">Choose a conversation from the list to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
