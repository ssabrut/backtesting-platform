import { useState, useEffect } from 'react';
import client from '../api/client';
import type { SummaryStats, DailyStats, EquityPoint, DrawdownPoint } from '../types';

export function useDashboardStats(account_id?: string, from?: string, to?: string) {
  const [summary, setSummary] = useState<SummaryStats | null>(null);
  const [daily, setDaily] = useState<DailyStats[]>([]);
  const [equity, setEquity] = useState<EquityPoint[]>([]);
  const [drawdown, setDrawdown] = useState<DrawdownPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!account_id) return;
    const params = { account_id, from, to };
    setLoading(true);
    Promise.all([
      client.get<SummaryStats>('/stats/summary', { params }),
      client.get<DailyStats[]>('/stats/daily', { params }),
      client.get<EquityPoint[]>('/stats/equity-curve', { params }),
      client.get<DrawdownPoint[]>('/stats/drawdown', { params }),
    ])
      .then(([s, d, e, dd]) => {
        setSummary(s.data);
        setDaily(d.data);
        setEquity(e.data);
        setDrawdown(dd.data);
      })
      .finally(() => setLoading(false));
  }, [account_id, from, to]);

  return { summary, daily, equity, drawdown, loading };
}
