import type { Trade } from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { formatCurrency, pnlColor } from '../../utils/formatters';
import { format } from 'date-fns';
import { Pencil, Trash2 } from 'lucide-react';

interface Props {
  trades: Trade[];
  onEdit: (trade: Trade) => void;
  onDelete: (id: string) => void;
}

export function TradeTable({ trades, onEdit, onDelete }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            {['Symbol', 'Side', 'Entry', 'Exit', 'Qty', 'Entry Time', 'P&L', 'Tags', ''].map(h => (
              <th key={h} className="text-left text-xs font-medium text-gray-400 py-3 px-3 whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {trades.map(t => (
            <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
              <td className="py-3 px-3 font-medium text-gray-900">{t.symbol}</td>
              <td className="py-3 px-3">
                <Badge variant={t.side}>{t.side.toUpperCase()}</Badge>
              </td>
              <td className="py-3 px-3 text-gray-600">{formatCurrency(t.entry_price)}</td>
              <td className="py-3 px-3 text-gray-600">{formatCurrency(t.exit_price)}</td>
              <td className="py-3 px-3 text-gray-600">{t.quantity}</td>
              <td className="py-3 px-3 text-gray-500 whitespace-nowrap">
                {format(new Date(t.entry_time), 'MMM d, HH:mm')}
              </td>
              <td className={`py-3 px-3 font-semibold whitespace-nowrap ${pnlColor(t.pnl)}`}>
                {formatCurrency(t.pnl)}
              </td>
              <td className="py-3 px-3">
                <div className="flex gap-1 flex-wrap">
                  {t.tags.map(tag => (
                    <span key={tag} className="text-xs bg-gray-100 text-gray-500 rounded px-1.5 py-0.5">{tag}</span>
                  ))}
                </div>
              </td>
              <td className="py-3 px-3">
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => onEdit(t)}>
                    <Pencil size={13} />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onDelete(t.id)}>
                    <Trash2 size={13} className="text-red-400" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
