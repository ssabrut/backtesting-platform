import { useState, useRef, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { BacktestRules, BacktestRun } from '../types';
import { RuleBuilder } from '../components/backtest/RuleBuilder';
import { BacktestResults } from '../components/backtest/BacktestResults';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { Badge } from '../components/ui/Badge';
import client from '../api/client';
import { Upload, ChevronDown, ChevronUp } from 'lucide-react';
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
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      form.append('name', name || 'Unnamed Run');
      form.append('symbol', symbol);
      form.append('rules', JSON.stringify(rules));
      if (accountId) form.append('account_id', accountId);

      const r = await client.post<{ runId: string }>('/backtest', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setActiveRun({ id: r.data.runId, name: name || 'Unnamed Run', status: 'running', created_at: new Date().toISOString() });
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

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Config panel */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-4">New Backtest</h3>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Run Name</label>
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

        <div className="flex justify-end mt-5">
          <Button
            onClick={handleSubmit}
            loading={submitting}
            disabled={!file || rules.entryConditions.length === 0}
          >
            Run Backtest
          </Button>
        </div>
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

      {/* Past runs */}
      {pastRuns.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-50">
            <h3 className="text-sm font-semibold text-gray-800">Past Runs</h3>
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
