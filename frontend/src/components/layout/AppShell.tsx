import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useAccounts } from '../../hooks/useAccounts';
import { useState, useEffect } from 'react';

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/journal': 'Trade Journal',
  '/calendar': 'Calendar',
  '/backtest': 'Backtesting',
};

export function AppShell() {
  const { pathname } = useLocation();
  const { accounts, loading } = useAccounts();
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');

  useEffect(() => {
    if (accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts]);

  const title = PAGE_TITLES[pathname] ?? 'BackTest Pro';

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-[220px] flex flex-col">
        <TopBar
          accounts={accounts}
          selectedId={selectedAccountId}
          onSelect={setSelectedAccountId}
          title={title}
        />
        <main className="flex-1 p-6">
          {!loading && <Outlet context={{ accountId: selectedAccountId }} />}
        </main>
      </div>
    </div>
  );
}
