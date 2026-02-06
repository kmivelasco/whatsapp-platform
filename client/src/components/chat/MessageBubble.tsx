import { clsx } from 'clsx';
import { format } from 'date-fns';

interface Message {
  id: string;
  senderType: 'CLIENT' | 'BOT' | 'AGENT';
  content: string;
  timestamp: string;
}

export default function MessageBubble({ message }: { message: Message }) {
  const isClient = message.senderType === 'CLIENT';
  const isBot = message.senderType === 'BOT';

  return (
    <div className={clsx('flex mb-3', isClient ? 'justify-start' : 'justify-end')}>
      <div
        className={clsx(
          'max-w-[70%] px-4 py-2 rounded-2xl text-sm',
          isClient && 'bg-white text-gray-900 border border-gray-200 rounded-bl-md',
          isBot && 'bg-purple-500 text-white rounded-br-md',
          !isClient && !isBot && 'bg-blue-500 text-white rounded-br-md'
        )}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium opacity-75">
            {isClient ? 'Client' : isBot ? 'Bot' : 'Agent'}
          </span>
        </div>
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        <p className={clsx('text-xs mt-1', isClient ? 'text-gray-400' : 'opacity-60')}>
          {format(new Date(message.timestamp), 'HH:mm')}
        </p>
      </div>
    </div>
  );
}
