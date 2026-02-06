import { clsx } from 'clsx';
import { formatRelativeTime } from '../../utils/formatters';

interface Conversation {
  id: string;
  status: string;
  mode: string;
  client: { name?: string; phoneNumber: string };
  messages: Array<{ content: string; timestamp: string }>;
  _count: { messages: number };
  updatedAt: string;
}

interface ConversationListProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
}

export default function ConversationList({ conversations, activeId, onSelect }: ConversationListProps) {
  return (
    <div className="flex-1 overflow-y-auto">
      {conversations.length === 0 && (
        <div className="p-6 text-center text-gray-500 text-sm">
          No conversations yet
        </div>
      )}
      {conversations.map((conv) => {
        const lastMsg = conv.messages?.[0];
        return (
          <button
            key={conv.id}
            onClick={() => onSelect(conv.id)}
            className={clsx(
              'w-full p-4 text-left border-b border-gray-100 hover:bg-gray-50 transition-colors',
              activeId === conv.id && 'bg-blue-50'
            )}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-900 text-sm truncate">
                {conv.client.name || conv.client.phoneNumber}
              </span>
              <span className="text-xs text-gray-400">
                {formatRelativeTime(conv.updatedAt)}
              </span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <p className="text-sm text-gray-500 truncate max-w-[180px]">
                {lastMsg?.content || 'No messages'}
              </p>
              <div className="flex items-center gap-1">
                <span
                  className={clsx(
                    'px-1.5 py-0.5 text-xs rounded font-medium',
                    conv.mode === 'BOT' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'
                  )}
                >
                  {conv.mode}
                </span>
                {conv.status === 'CLOSED' && (
                  <span className="px-1.5 py-0.5 text-xs rounded font-medium bg-gray-100 text-gray-500">
                    Closed
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
