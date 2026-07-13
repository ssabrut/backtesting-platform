import { useState, useEffect, useCallback } from 'react';
import client from '../api/client';
import type { Trade } from '../types';

interface TradeFilters {
  account_id?: string;
  symbol?: string;
  side?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export function useTrades(filters: TradeFilters = {}) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(() => {
    setLoading(true);
    setError(null);
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v != null && v !== ''));
    client.get<{ trades: Trade[]; total: number }>('/trades', { params })
      .then(r => { setTrades(r.data.trades); setTotal(r.data.total); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [JSON.stringify(filters)]);

  useEffect(() => { fetch(); }, [fetch]);

  return { trades, total, loading, error, refetch: fetch };
}
