import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format, isSameMonth, isToday,
  addMonths, subMonths
} from 'date-fns';
import type { DailyStats } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  month: Date;
  dailyStats: DailyStats[];
  onMonthChange: (d: Date) => void;
}

export function CalendarGrid({ month, dailyStats, onMonthChange }: Props) {
  const statsMap = new Map(dailyStats.map(d => [d.date, d]));

  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

  const monthPnl = dailyStats.reduce((s, d) => s + d.pnl, 0);
  const monthWinDays = dailyStats.filter(d => d.pnl > 0).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{format(month, 'MMMM yyyy')}</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {formatCurrency(monthPnl)} · {monthWinDays} winning day{monthWinDays !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => onMonthChange(subMonths(month, 1))}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 cursor-pointer"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => onMonthChange(addMonths(month, 1))}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 cursor-pointer"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px bg-gray-100 rounded-lg overflow-hidden border border-gray-100">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="bg-gray-50 text-center py-2 text-xs font-medium text-gray-400">{d}</div>
        ))}
        {weeks.flat().map(day => {
          const key = format(day, 'yyyy-MM-dd');
          const stat = statsMap.get(key);
          const inMonth = isSameMonth(day, month);
          const today = isToday(day);

          return (
            <div
              key={key}
              className={`bg-white min-h-[72px] p-2 flex flex-col
                ${!inMonth ? 'opacity-30' : ''}
                ${today ? 'ring-1 ring-inset ring-blue-400' : ''}
              `}
            >
              <span className={`text-xs font-medium mb-1 w-5 h-5 flex items-center justify-center rounded-full
                ${today ? 'bg-blue-600 text-white' : 'text-gray-500'}`}>
                {format(day, 'd')}
              </span>
              {stat && inMonth && (
                <div className={`flex-1 rounded px-1 py-0.5 text-xs font-semibold
                  ${stat.pnl > 0 ? 'bg-emerald-50 text-emerald-700' : stat.pnl < 0 ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-500'}`}>
                  {formatCurrency(stat.pnl)}
                  <div className="text-xs font-normal opacity-60">{stat.trade_count} trade{stat.trade_count !== 1 ? 's' : ''}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
