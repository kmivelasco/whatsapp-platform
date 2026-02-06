import { useState } from 'react';
import { useAnalyticsSummary, useTokenUsage, useCostBreakdown, useMessageVolume, useResponseTimes } from '../hooks/useAnalytics';
import Header from '../components/layout/Header';
import TokenUsageChart from '../components/analytics/TokenUsageChart';
import CostBreakdown from '../components/analytics/CostBreakdown';
import MessageVolumeChart from '../components/analytics/MessageVolumeChart';
import ExportButton from '../components/common/ExportButton';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { Activity, DollarSign, MessageSquare, Zap, Clock } from 'lucide-react';

export default function AnalyticsPage() {
  const [groupBy, setGroupBy] = useState('day');
  const { data: summary } = useAnalyticsSummary();
  const { data: tokenData } = useTokenUsage({ groupBy });
  const { data: costData } = useCostBreakdown();
  const { data: volumeData } = useMessageVolume({ groupBy });
  const { data: responseData } = useResponseTimes();

  const summaryCards = [
    {
      label: 'Active Conversations',
      value: summary?.activeConversations ?? 0,
      icon: Activity,
      color: 'text-green-600 bg-green-50',
    },
    {
      label: 'Total Messages',
      value: formatNumber(summary?.totalMessages ?? 0),
      icon: MessageSquare,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      label: 'Total Tokens',
      value: formatNumber(summary?.totalTokens ?? 0),
      icon: Zap,
      color: 'text-purple-600 bg-purple-50',
    },
    {
      label: 'Total Cost',
      value: formatCurrency(summary?.totalCost ?? 0),
      icon: DollarSign,
      color: 'text-amber-600 bg-amber-50',
    },
  ];

  return (
    <div className="flex flex-col h-full">
      <Header title="Analytics">
        <select
          value={groupBy}
          onChange={(e) => setGroupBy(e.target.value)}
          className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm"
        >
          <option value="day">Daily</option>
          <option value="week">Weekly</option>
          <option value="month">Monthly</option>
        </select>
        <ExportButton endpoint="/export/analytics" filename="analytics.csv" />
      </Header>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryCards.map((card) => (
            <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${card.color}`}>
                  <card.icon className="w-5 h-5" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Response Time */}
        {responseData && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg text-cyan-600 bg-cyan-50">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Average Response Time</p>
                <p className="text-xl font-bold text-gray-900">{responseData.averageSeconds}s</p>
              </div>
              <div className="ml-8">
                <p className="text-sm text-gray-500">Median</p>
                <p className="text-xl font-bold text-gray-900">{responseData.medianSeconds}s</p>
              </div>
            </div>
          </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TokenUsageChart data={tokenData?.grouped || []} />
          <CostBreakdown data={costData || []} />
        </div>

        <MessageVolumeChart data={volumeData || []} />
      </div>
    </div>
  );
}
