import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { DrawdownPoint } from '../../types';
import { format } from 'date-fns';

interface Props { data: DrawdownPoint[] }

export function DrawdownChart({ data }: Props) {
  if (data.length === 0) return <div className="h-32 flex items-center justify-center text-sm text-gray-400">No data</div>;

  return (
    <ResponsiveContainer width="100%" height={130}>
      <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="dd" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="time" tickFormatter={v => format(new Date(v), 'MMM d')} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
        <YAxis tickFormatter={v => `${v.toFixed(1)}%`} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={48} />
        <Tooltip
          formatter={(v) => [`${Number(v).toFixed(2)}%`, 'Drawdown']}
          labelFormatter={v => format(new Date(v as string), 'MMM d, yyyy')}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
        />
        <Area type="monotone" dataKey="drawdown" stroke="#ef4444" strokeWidth={1.5} fill="url(#dd)" dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
