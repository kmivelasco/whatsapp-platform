import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../../utils/formatters';

interface CostBreakdownProps {
  data: Array<{
    model: string;
    requests: number;
    totalTokens: number;
    estimatedCost: number;
  }>;
}

export default function CostBreakdown({ data }: CostBreakdownProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Cost by Model</h3>
      {data.length > 0 ? (
        <>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="model" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Bar dataKey="estimatedCost" fill="#8b5cf6" name="Cost" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            {data.map((item) => (
              <div key={item.model} className="flex justify-between p-2 bg-gray-50 rounded">
                <span className="text-gray-600">{item.model}</span>
                <span className="font-medium">{formatCurrency(item.estimatedCost)}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="text-sm text-gray-500 text-center py-8">No cost data yet</p>
      )}
    </div>
  );
}
