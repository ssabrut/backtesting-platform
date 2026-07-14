import { useState, useEffect } from 'react';
import client from '../api/client';
import type { SummaryStats, DailyStats, EquityPoint, DrawdownPoint } from '../types';

interface Params {
  account_id?: string;
  run_id?: string;
  from?: string;
  to?: string;
}

export function useBacktestDashboardStats(params: Params) {
  const [summary, setSummary] = useState<SummaryStats | null>(null);
  const [daily, setDaily] = useState<DailyStats[]>([]);
  const [equity, setEquity] = useState<EquityPoint[]>([]);
  const [drawdown, setDrawdown] = useState<DrawdownPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      client.get<SummaryStats>('/backtest/stats/summary', { params }),
      client.get<DailyStats[]>('/backtest/stats/daily', { params }),
      client.get<EquityPoint[]>('/backtest/stats/equity-curve', { params }),
      client.get<DrawdownPoint[]>('/backtest/stats/drawdown', { params }),
    ])
      .then(([s, d, e, dd]) => {
        setSummary(s.data);
        setDaily(d.data);
        setEquity(e.data);
        setDrawdown(dd.data);
      })
      .finally(() => setLoading(false));
  }, [params.account_id, params.run_id, params.from, params.to]);

  return { summary, daily, equity, drawdown, loading };
}
