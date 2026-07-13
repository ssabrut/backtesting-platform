import type { BacktestRun } from '../../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MetricCard } from '../ui/MetricCard';
import { Badge } from '../ui/Badge';
import { formatCurrency, formatPercent, formatRatio, pnlColor } from '../../utils/formatters';
import { format } from 'date-fns';
import { BacktestChart } from './BacktestChart';
import { ChartSettingsPanel } from './ChartSettingsPanel';

interface Props { run: BacktestRun }

export function BacktestResults({ run }: Props) {
  const s = run.stats;
  if (!s) return null;

  const isPositive = s.net_pnl >= 0;
  const color = isPositive ? '#10b981' : '#ef4444';

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard label="Net P&L" value={formatCurrency(s.net_pnl)} positive={s.net_pnl > 0} />
        <MetricCard label="Win Rate" value={formatPercent(s.win_rate)} positive={s.win_rate >= 0.5} />
        <MetricCard label="Profit Factor" value={formatRatio(s.profit_factor)} positive={s.profit_factor >= 1} />
        <MetricCard label="Total Trades" value={String(s.total_trades)} />
        <MetricCard label="Avg Win" value={formatCurrency(s.avg_win)} positive />
        <MetricCard label="Avg Loss" value={formatCurrency(s.avg_loss)} positive={false} />
        <MetricCard label="Max Drawdown" value={formatPercent(s.max_drawdown_pct)} positive={false} />
        <MetricCard label="Gross Profit" value={formatCurrency(s.gross_profit)} positive />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-700">Price Chart</h4>
          <ChartSettingsPanel />
        </div>
        <BacktestChart run={run} />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Equity Curve</h4>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={s.equity_curve}>
            <defs>
              <linearGradient id="bt-eq" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.15} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="time" tickFormatter={v => format(new Date(v), 'MMM d')} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis tickFormatter={v => formatCurrency(v)} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={70} />
            <Tooltip formatter={(v) => [formatCurrency(Number(v)), 'Equity']} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill="url(#bt-eq)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {run.trades && run.trades.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50">
            <h4 className="text-sm font-semibold text-gray-700">Trade List ({run.trades.length})</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['#', 'Side', 'Entry Time', 'Entry', 'Exit Time', 'Exit', 'P&L'].map(h => (
                    <th key={h} className="text-left text-xs font-medium text-gray-400 py-2 px-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {run.trades.map((t, i) => (
                  <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="py-2 px-3 text-gray-400">{i + 1}</td>
                    <td className="py-2 px-3"><Badge variant={t.side}>{t.side.toUpperCase()}</Badge></td>
                    <td className="py-2 px-3 text-gray-500 whitespace-nowrap">{format(new Date(t.entry_time), 'MMM d HH:mm')}</td>
                    <td className="py-2 px-3 text-gray-600">{formatCurrency(t.entry_price)}</td>
                    <td className="py-2 px-3 text-gray-500 whitespace-nowrap">{format(new Date(t.exit_time), 'MMM d HH:mm')}</td>
                    <td className="py-2 px-3 text-gray-600">{formatCurrency(t.exit_price)}</td>
                    <td className={`py-2 px-3 font-semibold ${pnlColor(t.pnl)}`}>{formatCurrency(t.pnl)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
