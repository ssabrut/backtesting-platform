import { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import type { BacktestRun } from '../types';
import { BacktestResults } from '../components/backtest/BacktestResults';
import { YearlyHeatmap } from '../components/backtest/YearlyHeatmap';
import { CreateSessionModal } from '../components/backtest/CreateSessionModal';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { Badge } from '../components/ui/Badge';
import { MetricCard } from '../components/ui/MetricCard';
import { EquityCurve } from '../components/charts/EquityCurve';
import { DrawdownChart } from '../components/charts/DrawdownChart';
import { useBacktestDashboardStats } from '../hooks/useBacktestDashboardStats';
import { useBacktestYearly } from '../hooks/useBacktestYearly';
import { formatCurrency, formatPercent, formatRatio } from '../utils/formatters';
import client from '../api/client';
import { ChevronDown, ChevronUp, Plus, Filter, LineChart, CloudOff, Settings } from 'lucide-react';
import { format } from 'date-fns';

interface OutletCtx { accountId: string }

export function BacktestPage() {
  const { accountId } = useOutletContext<OutletCtx>();
  const navigate = useNavigate();
  const [pastRuns, setPastRuns] = useState<BacktestRun[]>([]);
  const [expandedRun, setExpandedRun] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedRunId, setSelectedRunId] = useState('');
  const [dateRange, setDateRange] = useState<{ from?: string; to?: string }>({});

  const { summary, equity, drawdown, loading: statsLoading } = useBacktestDashboardStats({
    account_id: accountId,
    run_id: selectedRunId || undefined,
    from: dateRange.from,
    to: dateRange.to,
  });
  const yearlyData = useBacktestYearly({
    account_id: accountId,
    run_id: selectedRunId || undefined,
    year: new Date().getFullYear(),
  });

  useEffect(() => {
    if (!accountId) return;
    client.get<BacktestRun[]>('/backtest', { params: { account_id: accountId } })
      .then(r => setPastRuns(r.data));
  }, [accountId]);

  const handleLoadPastRun = async (run: BacktestRun) => {
    if (expandedRun === run.id) { setExpandedRun(null); return; }
    const r = await client.get<BacktestRun>(`/backtest/${run.id}`);
    setPastRuns(prev => prev.map(x => x.id === run.id ? r.data : x));
    setExpandedRun(run.id);
  };

  const s = summary;

  return (
    <div className="space-y-5">
      {/* Header controls */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <button
            disabled
            title="No filter dimensions defined yet"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-400 cursor-not-allowed"
          >
            <Filter size={14} /> Filters
          </button>
          <input
            type="date"
            value={dateRange.from ?? ''}
            onChange={e => setDateRange(r => ({ ...r, from: e.target.value || undefined }))}
            className="text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-gray-300 text-sm">–</span>
          <input
            type="date"
            value={dateRange.to ?? ''}
            onChange={e => setDateRange(r => ({ ...r, to: e.target.value || undefined }))}
            className="text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={selectedRunId}
          onChange={e => setSelectedRunId(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
        >
          <option value="">All Sessions</option>
          {pastRuns.map(r => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
      </div>

      {/* Metric tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <MetricCard label="Net P&L" value={s ? formatCurrency(s.net_pnl) : '--'} positive={s ? s.net_pnl > 0 : null} />
        <MetricCard
          label="Trade Win %"
          value={s ? formatPercent(s.win_rate) : '--'}
          positive={s ? s.win_rate >= 0.5 : null}
          ring={s ? { value: s.win_rate } : undefined}
        />
        <MetricCard
          label="Profit Factor"
          value={s ? formatRatio(s.profit_factor) : '--'}
          positive={s ? s.profit_factor >= 1 : null}
          ring={s ? { value: Math.min(s.profit_factor / 2, 1) } : undefined}
        />
        <MetricCard
          label="Day Win %"
          value={s ? formatPercent(s.day_win_rate) : '--'}
          positive={s ? s.day_win_rate >= 0.5 : null}
          ring={s ? { value: s.day_win_rate } : undefined}
        />
        <MetricCard
          label="Avg win/loss trade"
          value={s ? `${formatCurrency(s.avg_win)} / ${formatCurrency(s.avg_loss)}` : '--'}
        />
      </div>

      {/* New session */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <Button onClick={() => setShowModal(true)}>
          <Plus size={15} /> New Backtest Session
        </Button>
      </div>

      <CreateSessionModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onCreated={runId => navigate(`/backtest/${runId}`)}
        accountId={accountId}
      />

      {/* Performance */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-800">Performance</h3>
        </div>
        {statsLoading ? (
          <div className="flex items-center justify-center h-48"><Spinner /></div>
        ) : (
          <EquityCurve
            data={equity}
            emptyTitle="No data to show here"
            emptyIcon={<LineChart size={28} className="text-gray-300" />}
          />
        )}
      </div>

      {/* Drawdown */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-800">Drawdown</h3>
        </div>
        {statsLoading ? (
          <div className="flex items-center justify-center h-32"><Spinner /></div>
        ) : (
          <DrawdownChart
            data={drawdown}
            emptyTitle="No drawdown data to show here"
            emptyIcon={<CloudOff size={28} className="text-gray-300" />}
          />
        )}
      </div>

      {/* Yearly calendar */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Yearly calendar</h3>
        <YearlyHeatmap year={new Date().getFullYear()} dailyStats={yearlyData} />
      </div>

      {/* Statistics */}
      {s && s.total_trades > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-800">Statistics</h3>
            <button disabled title="Settings" className="text-gray-300 cursor-not-allowed">
              <Settings size={16} />
            </button>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Gross Profit</p>
              <p className="text-lg font-semibold text-emerald-600">{formatCurrency(s.gross_profit)}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Gross Loss</p>
              <p className="text-lg font-semibold text-red-500">-{formatCurrency(s.gross_loss)}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Avg Win</p>
              <p className="text-lg font-semibold text-emerald-600">{formatCurrency(s.avg_win)}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Avg Loss</p>
              <p className="text-lg font-semibold text-red-500">{formatCurrency(s.avg_loss)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Sessions */}
      {pastRuns.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-50">
            <h3 className="text-sm font-semibold text-gray-800">Sessions</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {pastRuns.map(run => (
              <div key={run.id}>
                <button
                  onClick={() => handleLoadPastRun(run)}
                  className="w-full flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-800">{run.name}</span>
                    {run.symbol && <span className="text-xs text-gray-400">{run.symbol}</span>}
                    <Badge variant={run.status}>{run.status}</Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    {run.stats && (
                      <span className={`text-sm font-semibold ${run.stats.net_pnl >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {run.stats.net_pnl >= 0 ? '+' : ''}{run.stats.net_pnl.toFixed(2)}
                      </span>
                    )}
                    <span className="text-xs text-gray-400">{format(new Date(run.created_at), 'MMM d, HH:mm')}</span>
                    {expandedRun === run.id ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                  </div>
                </button>
                {expandedRun === run.id && run.stats && (
                  <div className="px-5 pb-5">
                    <BacktestResults run={run} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
