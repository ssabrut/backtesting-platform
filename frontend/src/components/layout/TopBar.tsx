import type { Account } from '../../types';
import { ChevronDown } from 'lucide-react';

interface TopBarProps {
  accounts: Account[];
  selectedId?: string;
  onSelect: (id: string) => void;
  title: string;
}

export function TopBar({ accounts, selectedId, onSelect, title }: TopBarProps) {
  return (
    <header className="h-14 border-b border-gray-100 bg-white flex items-center justify-between px-6 sticky top-0 z-30">
      <h1 className="text-sm font-semibold text-gray-900">{title}</h1>
      {accounts.length > 0 && (
        <div className="relative">
          <select
            value={selectedId}
            onChange={e => onSelect(e.target.value)}
            className="appearance-none text-sm border border-gray-200 rounded-lg pl-3 pr-8 py-1.5 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            {accounts.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      )}
    </header>
  );
}
