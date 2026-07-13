import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { CalendarGrid } from '../components/calendar/CalendarGrid';
import { Spinner } from '../components/ui/Spinner';
import { useDashboardStats } from '../hooks/useDashboardStats';

interface OutletCtx { accountId: string }

export function CalendarPage() {
  const { accountId } = useOutletContext<OutletCtx>();
  const [month, setMonth] = useState(new Date());

  const from = format(startOfMonth(month), 'yyyy-MM-dd');
  const to = format(endOfMonth(month), 'yyyy-MM-dd');

  const { daily, loading } = useDashboardStats(accountId, from, to);

  return (
    <div className="max-w-4xl">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64"><Spinner /></div>
        ) : (
          <CalendarGrid month={month} dailyStats={daily} onMonthChange={setMonth} />
        )}
      </div>
    </div>
  );
}
