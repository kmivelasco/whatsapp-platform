import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface TokenUsageChartProps {
  data: Array<{
    period: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  }>;
}

export default function TokenUsageChart({ data }: TokenUsageChartProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Token Usage Over Time</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="period" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="promptTokens" stroke="#8b5cf6" name="Prompt" strokeWidth={2} />
          <Line type="monotone" dataKey="completionTokens" stroke="#3b82f6" name="Completion" strokeWidth={2} />
          <Line type="monotone" dataKey="totalTokens" stroke="#10b981" name="Total" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
