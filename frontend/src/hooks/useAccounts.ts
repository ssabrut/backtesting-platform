import { useState, useEffect } from 'react';
import client from '../api/client';
import type { Account } from '../types';

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get<Account[]>('/accounts')
      .then(r => setAccounts(r.data))
      .finally(() => setLoading(false));
  }, []);

  return { accounts, loading };
}
