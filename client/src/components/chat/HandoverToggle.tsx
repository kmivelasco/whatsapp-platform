import { Bot, User } from 'lucide-react';
import { clsx } from 'clsx';

interface HandoverToggleProps {
  mode: 'BOT' | 'HUMAN';
  onToggle: (mode: 'BOT' | 'HUMAN') => void;
  disabled?: boolean;
}

export default function HandoverToggle({ mode, onToggle, disabled }: HandoverToggleProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 font-medium">Mode:</span>
      <div className="flex bg-gray-100 rounded-lg p-0.5">
        <button
          onClick={() => onToggle('BOT')}
          disabled={disabled}
          className={clsx(
            'flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium transition-colors',
            mode === 'BOT'
              ? 'bg-purple-500 text-white'
              : 'text-gray-600 hover:text-gray-900'
          )}
        >
          <Bot className="w-3.5 h-3.5" />
          Bot
        </button>
        <button
          onClick={() => onToggle('HUMAN')}
          disabled={disabled}
          className={clsx(
            'flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium transition-colors',
            mode === 'HUMAN'
              ? 'bg-green-500 text-white'
              : 'text-gray-600 hover:text-gray-900'
          )}
        >
          <User className="w-3.5 h-3.5" />
          Human
        </button>
      </div>
    </div>
  );
}
