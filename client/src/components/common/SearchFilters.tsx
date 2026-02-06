import { Search } from 'lucide-react';

interface SearchFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  mode: string;
  onModeChange: (value: string) => void;
}

export default function SearchFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  mode,
  onModeChange,
}: SearchFiltersProps) {
  return (
    <div className="p-3 border-b border-gray-200 space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search conversations..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="flex gap-2">
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          className="flex-1 px-2 py-1.5 bg-gray-50 border border-gray-200 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="CLOSED">Closed</option>
        </select>
        <select
          value={mode}
          onChange={(e) => onModeChange(e.target.value)}
          className="flex-1 px-2 py-1.5 bg-gray-50 border border-gray-200 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Modes</option>
          <option value="BOT">Bot</option>
          <option value="HUMAN">Human</option>
        </select>
      </div>
    </div>
  );
}
