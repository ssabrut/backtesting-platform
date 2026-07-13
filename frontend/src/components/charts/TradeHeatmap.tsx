import { useEffect, useState } from 'react';
import client from '../../api/client';
import { formatCurrency } from '../../utils/formatters';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

interface HeatmapCell { day_of_week: number; hour: number; pnl: number; trade_count: number }

interface Props { accountId?: string }

export function TradeHeatmap({ accountId }: Props) {
  const [data, setData] = useState<HeatmapCell[]>([]);

  useEffect(() => {
    if (!accountId) return;
    client.get('/stats/by-hour', { params: { account_id: accountId } })
      .then(r => setData(r.data));
  }, [accountId]);

  const maxAbs = Math.max(...data.map(d => Math.abs(d.pnl)), 1);

  const getCell = (day: number, hour: number) =>
    data.find(d => d.day_of_week === day && d.hour === hour);

  const cellColor = (pnl: number) => {
    const intensity = Math.min(Math.abs(pnl) / maxAbs, 1);
    if (pnl > 0) return `rgba(16, 185, 129, ${0.1 + intensity * 0.7})`;
    if (pnl < 0) return `rgba(239, 68, 68, ${0.1 + intensity * 0.7})`;
    return '#f9fafb';
  };

  return (
    <div className="overflow-x-auto">
      <div className="flex text-xs text-gray-400 mb-1 ml-10">
        {HOURS.filter((_, i) => i % 3 === 0).map(h => (
          <div key={h} className="w-[calc(100%/8)] text-center">{h}:00</div>
        ))}
      </div>
      {DAYS.map((day, dayIdx) => (
        <div key={day} className="flex items-center gap-0.5 mb-0.5">
          <div className="w-9 text-xs text-gray-400 text-right pr-1">{day}</div>
          {HOURS.map(hour => {
            const cell = getCell(dayIdx, hour);
            return (
              <div
                key={hour}
                className="flex-1 h-5 rounded-sm cursor-default"
                style={{ backgroundColor: cell ? cellColor(cell.pnl) : '#f9fafb' }}
                title={cell ? `${day} ${hour}:00 — ${formatCurrency(cell.pnl)} (${cell.trade_count} trades)` : ''}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
