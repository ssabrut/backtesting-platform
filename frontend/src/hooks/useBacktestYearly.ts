import { useState, useEffect } from 'react';
import client from '../api/client';
import type { DailyStats } from '../types';

interface Params {
  account_id?: string;
  run_id?: string;
  year: number;
}

export function useBacktestYearly(params: Params) {
  const [data, setData] = useState<DailyStats[]>([]);

  useEffect(() => {
    client.get<DailyStats[]>('/backtest/stats/yearly', { params }).then(r => setData(r.data));
  }, [params.account_id, params.run_id, params.year]);

  return data;
}
