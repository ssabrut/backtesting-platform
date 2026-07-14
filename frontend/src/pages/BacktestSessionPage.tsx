import { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { BacktestRules, BacktestRun } from '../types';
import { RuleBuilder } from '../components/backtest/RuleBuilder';
import { BacktestResults } from '../components/backtest/BacktestResults';
import { BacktestChart } from '../components/backtest/BacktestChart';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { Badge } from '../components/ui/Badge';
import client from '../api/client';
import { ArrowLeft } from 'lucide-react';

const DEFAULT_RULES: BacktestRules = {
  entryConditions: [],
  exitConditions: [],
  side: 'long',
  positionSize: 1,
  initialCapital: 10000,
};

export function BacktestSessionPage() {
  const { runId } = useParams<{ runId: string }>();
  const [run, setRun] = useState<BacktestRun | null>(null);
  const [rules, setRules] = useState<BacktestRules>(DEFAULT_RULES);
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!runId) return;
    client.get<BacktestRun>(`/backtest/${runId}`).then(r => {
      setRun(r.data);
      if (r.data.rules) setRules(r.data.rules);
      setLoading(false);
    });
  }, [runId]);

  useEffect(() => {
    if (!run || run.status !== 'running') return;
    pollRef.current = setInterval(async () => {
      const r = await client.get<BacktestRun>(`/backtest/${run.id}`);
      setRun(r.data);
      if (r.data.status !== 'running') clearInterval(pollRef.current!);
    }, 1500);
    return () => clearInterval(pollRef.current!);
  }, [run?.id, run?.status]);

  const handleRun = async () => {
    if (!run) return;
    setRunning(true);
    try {
      await client.post(`/backtest/${run.id}/run`, { rules });
      setRun({ ...run, status: 'running', rules });
    } finally {
      setRunning(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;
  }

  if (!run) {
    return <p className="text-sm text-gray-400">Session not found.</p>;
  }

  const isDraft = run.status === 'pending';
  const isRunning = run.status === 'running';

  return (
    <div className="space-y-5 max-w-5xl">
      <Link to="/backtest" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800">
        <ArrowLeft size={14} /> Back to sessions
      </Link>

      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold text-gray-900">{run.name}</h2>
        <Badge variant={run.status}>{run.status}</Badge>
        {run.symbol && <span className="text-sm text-gray-400">{run.symbol} · {run.timeframe}</span>}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Chart</h3>
        <BacktestChart run={run} barsSource={run.status === 'complete' ? 'run' : 'market-data'} />
      </div>

      {(isDraft || isRunning) && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Entry / Exit Rules</h3>
          <RuleBuilder rules={rules} onChange={setRules} />
          <div className="flex justify-end mt-5">
            <Button
              onClick={handleRun}
              loading={running || isRunning}
              disabled={rules.entryConditions.length === 0 || isRunning}
            >
              {isRunning ? 'Running…' : 'Run Backtest'}
            </Button>
          </div>
        </div>
      )}

      {run.status === 'error' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm text-red-500">Error: {run.error_message}</p>
        </div>
      )}

      {run.status === 'complete' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <BacktestResults run={run} />
        </div>
      )}
    </div>
  );
}
