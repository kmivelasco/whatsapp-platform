import { useState } from 'react';
import { useConversations } from '../hooks/useConversations';
import Header from '../components/layout/Header';
import ExportButton from '../components/common/ExportButton';
import { formatDate, formatRelativeTime } from '../utils/formatters';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

export default function ConversationHistoryPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data, isLoading } = useConversations({
    page,
    limit: 20,
    search: search || undefined,
    status: status || undefined,
    dateFrom: dateFrom ? new Date(dateFrom).toISOString() : undefined,
    dateTo: dateTo ? new Date(dateTo).toISOString() : undefined,
  });

  return (
    <div className="flex flex-col h-full">
      <Header title="Conversation History">
        <ExportButton
          endpoint="/export/conversations"
          filename="conversations.csv"
          params={{
            ...(dateFrom ? { from: new Date(dateFrom).toISOString() } : {}),
            ...(dateTo ? { to: new Date(dateTo).toISOString() } : {}),
          }}
        />
      </Header>

      <div className="flex-1 overflow-y-auto">
        {/* Filters */}
        <div className="p-4 bg-white border-b border-gray-200">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by client name, phone, or message..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-10 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="CLOSED">Closed</option>
            </select>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
              placeholder="From"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
              placeholder="To"
            />
          </div>
        </div>

        {/* Table */}
        <div className="p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left">Client</th>
                    <th className="px-4 py-3 text-left">Phone</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Mode</th>
                    <th className="px-4 py-3 text-left">Messages</th>
                    <th className="px-4 py-3 text-left">Last Activity</th>
                    <th className="px-4 py-3 text-left">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data?.data?.map((conv: any) => (
                    <tr key={conv.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {conv.client?.name || 'Unknown'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{conv.client?.phoneNumber}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 text-xs rounded font-medium ${
                          conv.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {conv.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 text-xs rounded font-medium ${
                          conv.mode === 'BOT' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {conv.mode}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{conv._count?.messages ?? 0}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{formatRelativeTime(conv.updatedAt)}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(conv.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data?.data?.length === 0 && (
                <div className="text-center py-8 text-gray-500 text-sm">No conversations found</div>
              )}
            </div>
          )}

          {/* Pagination */}
          {data?.pagination && data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-gray-500">
                Page {data.pagination.page} of {data.pagination.totalPages} ({data.pagination.total} total)
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                  disabled={page === data.pagination.totalPages}
                  className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm disabled:opacity-50"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
