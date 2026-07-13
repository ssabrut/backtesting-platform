import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { DailyStats } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { format } from 'date-fns';

interface Props { data: DailyStats[] }

export function DailyPnlBar({ data }: Props) {
  if (data.length === 0) return <div className="h-48 flex items-center justify-center text-sm text-gray-400">No data</div>;

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis dataKey="date" tickFormatter={v => format(new Date(v + 'T00:00:00'), 'MMM d')} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
        <YAxis tickFormatter={v => formatCurrency(v)} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={70} />
        <Tooltip
          formatter={(v) => [formatCurrency(Number(v)), 'P&L']}
          labelFormatter={v => format(new Date(String(v) + 'T00:00:00'), 'MMM d, yyyy')}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
        />
        <Bar dataKey="pnl" radius={[3, 3, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.pnl >= 0 ? '#10b981' : '#ef4444'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
