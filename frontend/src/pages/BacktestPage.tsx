import { useState, useRef, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { BacktestRules, BacktestRun } from '../types';
import { RuleBuilder } from '../components/backtest/RuleBuilder';
import { BacktestResults } from '../components/backtest/BacktestResults';
import { YearlyHeatmap } from '../components/backtest/YearlyHeatmap';
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
import { Upload, ChevronDown, ChevronUp, Plus, Filter, LineChart, CloudOff, Settings } from 'lucide-react';
import { format } from 'date-fns';

interface OutletCtx { accountId: string }

const DEFAULT_RULES: BacktestRules = {
  entryConditions: [],
  exitConditions: [],
  side: 'long',
  positionSize: 1,
  initialCapital: 10000,
};

export function BacktestPage() {
  const { accountId } = useOutletContext<OutletCtx>();
  const [rules, setRules] = useState<BacktestRules>(DEFAULT_RULES);
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeRun, setActiveRun] = useState<BacktestRun | null>(null);
  const [pastRuns, setPastRuns] = useState<BacktestRun[]>([]);
  const [expandedRun, setExpandedRun] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedRunId, setSelectedRunId] = useState('');
  const [dateRange, setDateRange] = useState<{ from?: string; to?: string }>({});
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (!activeRun || activeRun.status !== 'running') return;
    pollRef.current = setInterval(async () => {
      const r = await client.get<BacktestRun>(`/backtest/${activeRun.id}`);
      setActiveRun(r.data);
      if (r.data.status !== 'running') {
        clearInterval(pollRef.current!);
        setPastRuns(prev => [r.data, ...prev.filter(x => x.id !== r.data.id)]);
      }
    }, 1500);
    return () => clearInterval(pollRef.current!);
  }, [activeRun?.id, activeRun?.status]);

  const handleSubmit = async () => {
    if (!file) return;
    setSubmitting(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('name', name || 'Unnamed Session');
      form.append('symbol', symbol);
      form.append('rules', JSON.stringify(rules));
      if (accountId) form.append('account_id', accountId);

      const r = await client.post<{ runId: string }>('/backtest', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setActiveRun({ id: r.data.runId, name: name || 'Unnamed Session', status: 'running', created_at: new Date().toISOString() });
      setShowForm(false);
    } finally {
      setSubmitting(false);
    }
  };

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
        {!showForm ? (
          <Button onClick={() => setShowForm(true)}>
            <Plus size={15} /> New Backtest Session
          </Button>
        ) : (
          <>
            <h3 className="text-sm font-semibold text-gray-800 mb-4">New Backtest Session</h3>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Session Name</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="SMA Cross Test"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Symbol</label>
                <input value={symbol} onChange={e => setSymbol(e.target.value.toUpperCase())} placeholder="AAPL"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">OHLCV CSV *</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border border-dashed border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-500 flex items-center gap-2 cursor-pointer hover:bg-gray-50 hover:border-blue-300 transition-colors"
                >
                  <Upload size={14} className="text-gray-400" />
                  {file ? file.name : 'Click to upload'}
                </div>
                <input ref={fileInputRef} type="file" accept=".csv" className="hidden"
                  onChange={e => setFile(e.target.files?.[0] ?? null)} />
              </div>
            </div>

            <RuleBuilder rules={rules} onChange={setRules} />

            <div className="flex justify-end gap-2 mt-5">
              <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button
                onClick={handleSubmit}
                loading={submitting}
                disabled={!file || rules.entryConditions.length === 0}
              >
                Create Session
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Active run */}
      {activeRun && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-semibold text-gray-800">{activeRun.name}</h3>
              <Badge variant={activeRun.status}>{activeRun.status}</Badge>
            </div>
            {activeRun.status === 'running' && <Spinner size="sm" />}
          </div>
          {activeRun.status === 'error' && (
            <p className="text-sm text-red-500">Error: {activeRun.error_message}</p>
          )}
          {activeRun.status === 'complete' && <BacktestResults run={activeRun} />}
        </div>
      )}

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
