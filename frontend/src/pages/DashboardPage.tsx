import { useOutletContext } from 'react-router-dom';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { MetricCard } from '../components/ui/MetricCard';
import { EquityCurve } from '../components/charts/EquityCurve';
import { DailyPnlBar } from '../components/charts/DailyPnlBar';
import { DrawdownChart } from '../components/charts/DrawdownChart';
import { TradeHeatmap } from '../components/charts/TradeHeatmap';
import { Spinner } from '../components/ui/Spinner';
import { formatCurrency, formatPercent, formatRatio } from '../utils/formatters';
import { TrendingUp, TrendingDown, Percent, BarChart2, DollarSign } from 'lucide-react';

interface OutletCtx { accountId: string }

export function DashboardPage() {
  const { accountId } = useOutletContext<OutletCtx>();
  const { summary, daily, equity, drawdown, loading } = useDashboardStats(accountId);

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

  const s = summary;

  return (
    <div className="space-y-5">
      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <MetricCard
          label="Net P&L"
          value={s ? formatCurrency(s.net_pnl) : '--'}
          positive={s ? s.net_pnl > 0 : null}
          icon={<DollarSign size={16} />}
        />
        <MetricCard
          label="Trade Win %"
          value={s ? formatPercent(s.win_rate) : '--'}
          positive={s ? s.win_rate >= 0.5 : null}
          icon={<Percent size={16} />}
        />
        <MetricCard
          label="Profit Factor"
          value={s ? formatRatio(s.profit_factor) : '--'}
          positive={s ? s.profit_factor >= 1 : null}
          icon={<BarChart2 size={16} />}
        />
        <MetricCard
          label="Day Win %"
          value={s ? formatPercent(s.day_win_rate) : '--'}
          positive={s ? s.day_win_rate >= 0.5 : null}
        />
        <MetricCard
          label="Total Trades"
          value={s ? String(s.total_trades) : '--'}
          sub={s ? `Avg win ${formatCurrency(s.avg_win)}` : undefined}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">Equity Curve</h3>
            <TrendingUp size={16} className="text-gray-300" />
          </div>
          <EquityCurve data={equity} />
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">Daily P&L</h3>
            <BarChart2 size={16} className="text-gray-300" />
          </div>
          <DailyPnlBar data={daily} />
        </div>
      </div>

      {/* Drawdown + Heatmap row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">Drawdown</h3>
            <TrendingDown size={16} className="text-gray-300" />
          </div>
          <DrawdownChart data={drawdown} />
          {s && (
            <div className="mt-2 text-xs text-gray-400">
              Max drawdown: <span className="text-red-500 font-medium">{formatPercent(s.net_pnl < 0 ? 1 : 0)}</span>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">Trade Time Performance</h3>
          </div>
          <TradeHeatmap accountId={accountId} />
        </div>
      </div>

      {/* Stats breakdown */}
      {s && s.total_trades > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">Gross Profit</p>
            <p className="text-lg font-semibold text-emerald-600">{formatCurrency(s.gross_profit)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">Gross Loss</p>
            <p className="text-lg font-semibold text-red-500">-{formatCurrency(s.gross_loss)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">Avg Win</p>
            <p className="text-lg font-semibold text-emerald-600">{formatCurrency(s.avg_win)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">Avg Loss</p>
            <p className="text-lg font-semibold text-red-500">{formatCurrency(s.avg_loss)}</p>
          </div>
        </div>
      )}
    </div>
  );
}
