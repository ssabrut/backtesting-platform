import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { EquityPoint } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { format } from 'date-fns';
import { EmptyState } from '../ui/EmptyState';

interface Props {
  data: EquityPoint[];
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: React.ReactNode;
}

export function EquityCurve({ data, emptyTitle = 'No data', emptyDescription, emptyIcon }: Props) {
  if (data.length === 0) return <EmptyState title={emptyTitle} description={emptyDescription} icon={emptyIcon} />;

  const isPositive = data[data.length - 1]?.cumulative_pnl >= 0;
  const color = isPositive ? '#10b981' : '#ef4444';

  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="equity" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.15} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="time" tickFormatter={v => format(new Date(v), 'MMM d')} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
        <YAxis tickFormatter={v => formatCurrency(v)} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={70} />
        <Tooltip
          formatter={(v) => [formatCurrency(Number(v)), 'Equity']}
          labelFormatter={v => format(new Date(v as string), 'MMM d, yyyy')}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
        />
        <Area type="monotone" dataKey="cumulative_pnl" stroke={color} strokeWidth={2} fill="url(#equity)" dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
