import { useState } from 'react';
import { startOfYear, endOfYear, eachDayOfInterval, format, getDay } from 'date-fns';
import type { DailyStats } from '../../types';
import { formatCurrency } from '../../utils/formatters';

type Metric = 'win_rate' | 'pnl' | 'trades';

const METRICS: { key: Metric; label: string }[] = [
  { key: 'win_rate', label: 'Win rate' },
  { key: 'pnl', label: 'P&L' },
  { key: 'trades', label: 'Trades' },
];

interface Props {
  year: number;
  dailyStats: DailyStats[];
}

export function YearlyHeatmap({ year, dailyStats }: Props) {
  const [metric, setMetric] = useState<Metric>('pnl');
  const statsMap = new Map(dailyStats.map(d => [d.date, d]));

  const yearStart = startOfYear(new Date(year, 0, 1));
  const yearEnd = endOfYear(new Date(year, 0, 1));
  const days = eachDayOfInterval({ start: yearStart, end: yearEnd });

  const leadingBlanks = getDay(yearStart);
  const cells: (Date | null)[] = [...Array(leadingBlanks).fill(null), ...days];

  const maxAbsPnl = Math.max(...dailyStats.map(d => Math.abs(d.pnl)), 1);
  const maxTrades = Math.max(...dailyStats.map(d => d.trade_count), 1);

  const colorFor = (stat: DailyStats | undefined): string => {
    if (!stat || stat.trade_count === 0) return '#f3f4f6';
    if (metric === 'pnl') {
      const intensity = Math.min(Math.abs(stat.pnl) / maxAbsPnl, 1);
      return stat.pnl > 0
        ? `rgba(16, 185, 129, ${0.15 + intensity * 0.7})`
        : stat.pnl < 0
        ? `rgba(239, 68, 68, ${0.15 + intensity * 0.7})`
        : '#f3f4f6';
    }
    if (metric === 'win_rate') {
      const rate = stat.trade_count > 0 ? stat.wins / stat.trade_count : 0;
      return `rgba(16, 185, 129, ${0.15 + rate * 0.7})`;
    }
    const intensity = Math.min(stat.trade_count / maxTrades, 1);
    return `rgba(37, 99, 235, ${0.15 + intensity * 0.7})`;
  };

  const tooltipFor = (day: Date, stat: DailyStats | undefined): string => {
    const label = format(day, 'EEE, MMM d');
    if (!stat || stat.trade_count === 0) return `${label} — no sessions`;
    const rate = stat.trade_count > 0 ? (stat.wins / stat.trade_count) * 100 : 0;
    return `${label} — ${formatCurrency(stat.pnl)} (${stat.trade_count} trade${stat.trade_count !== 1 ? 's' : ''}, ${rate.toFixed(0)}% win)`;
  };

  return (
    <div>
      <div className="flex gap-1 mb-3">
        {METRICS.map(m => (
          <button
            key={m.key}
            onClick={() => setMetric(m.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors
              ${metric === m.key ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <div className="grid grid-flow-col gap-[3px]" style={{ gridTemplateRows: 'repeat(7, 11px)' }}>
          {cells.map((day, i) => {
            if (!day) return <div key={i} className="w-[11px] h-[11px]" />;
            const key = format(day, 'yyyy-MM-dd');
            const stat = statsMap.get(key);
            return (
              <div
                key={key}
                className="w-[11px] h-[11px] rounded-sm cursor-default"
                style={{ backgroundColor: colorFor(stat) }}
                title={tooltipFor(day, stat)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
