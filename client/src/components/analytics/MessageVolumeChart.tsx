import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface MessageVolumeChartProps {
  data: Array<{
    period: string;
    client: number;
    bot: number;
    agent: number;
    total: number;
  }>;
}

export default function MessageVolumeChart({ data }: MessageVolumeChartProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Message Volume</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="period" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend />
          <Area type="monotone" dataKey="client" stackId="1" stroke="#f59e0b" fill="#fef3c7" name="Client" />
          <Area type="monotone" dataKey="bot" stackId="1" stroke="#8b5cf6" fill="#ede9fe" name="Bot" />
          <Area type="monotone" dataKey="agent" stackId="1" stroke="#3b82f6" fill="#dbeafe" name="Agent" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
