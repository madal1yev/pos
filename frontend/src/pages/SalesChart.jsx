import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../utils/uzbek';

export default function SalesChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data}>
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12 }}
          tickFormatter={(v) => new Date(v).toLocaleDateString('uz', { weekday: 'short' })}
        />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip formatter={(v) => formatCurrency(v)} />
        <Bar dataKey="revenue" fill="#10b981" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
