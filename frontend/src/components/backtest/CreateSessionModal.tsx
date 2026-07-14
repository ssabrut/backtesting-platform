import { useEffect, useState } from 'react';
import { addYears, format } from 'date-fns';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import client from '../../api/client';
import type { MarketSeriesSummary } from '../../types';

type DateMode = 'range' | 'duration' | 'random';
type Duration = '1y' | '2y' | 'present';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (runId: string) => void;
  accountId?: string;
}

function fmt(d: Date): string {
  return format(d, 'yyyy-MM-dd');
}

export function CreateSessionModal({ open, onClose, onCreated, accountId }: Props) {
  const [series, setSeries] = useState<MarketSeriesSummary[]>([]);
  const [name, setName] = useState('');
  const [balance, setBalance] = useState(10000);
  const [seriesKey, setSeriesKey] = useState('');
  const [dateMode, setDateMode] = useState<DateMode>('range');
  const [rangeFrom, setRangeFrom] = useState('');
  const [rangeTo, setRangeTo] = useState('');
  const [durationStart, setDurationStart] = useState('');
  const [duration, setDuration] = useState<Duration>('1y');
  const [randomDuration, setRandomDuration] = useState<'1y' | '2y'>('1y');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    client.get<MarketSeriesSummary[]>('/market-data').then(r => {
      setSeries(r.data);
      if (r.data.length > 0 && !seriesKey) setSeriesKey(`${r.data[0].symbol}|${r.data[0].timeframe}`);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const selected = series.find(s => `${s.symbol}|${s.timeframe}` === seriesKey);

  const resolveDateRange = (): { start: string; end: string } | null => {
    if (!selected) return null;
    const seriesFrom = new Date(selected.from);
    const seriesTo = new Date(selected.to);

    if (dateMode === 'range') {
      if (!rangeFrom || !rangeTo) return null;
      return { start: rangeFrom, end: rangeTo };
    }

    if (dateMode === 'duration') {
      if (!durationStart) return null;
      const start = new Date(durationStart);
      const end = duration === 'present' ? seriesTo : addYears(start, duration === '1y' ? 1 : 2);
      return { start: fmt(start), end: fmt(end < seriesTo ? end : seriesTo) };
    }

    // random
    const years = randomDuration === '1y' ? 1 : 2;
    const latestPossibleStart = addYears(seriesTo, -years);
    if (latestPossibleStart <= seriesFrom) return { start: fmt(seriesFrom), end: fmt(seriesTo) };
    const span = latestPossibleStart.getTime() - seriesFrom.getTime();
    const randomStart = new Date(seriesFrom.getTime() + Math.random() * span);
    return { start: fmt(randomStart), end: fmt(addYears(randomStart, years)) };
  };

  const handleSubmit = async () => {
    if (!selected) return;
    const range = resolveDateRange();
    if (!range) { setError('Please complete the date selection.'); return; }

    setSubmitting(true);
    setError('');
    try {
      const r = await client.post<{ runId: string }>('/backtest/draft', {
        name: name || 'Unnamed Session',
        symbol: selected.symbol,
        timeframe: selected.timeframe,
        account_balance: balance,
        start: range.start,
        end: range.end,
        account_id: accountId || undefined,
      });
      onCreated(r.data.runId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create session');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create a quick session" size="lg">
      <div className="space-y-5">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
          <input
            value={name} onChange={e => setName(e.target.value)} placeholder="My backtest session"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Account Balance *</label>
          <input
            type="number" value={balance} onChange={e => setBalance(Number(e.target.value))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Assets *</label>
          {series.length === 0 ? (
            <p className="text-xs text-gray-400">No market data available yet.</p>
          ) : (
            <select
              value={seriesKey} onChange={e => setSeriesKey(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {series.map(s => (
                <option key={`${s.symbol}|${s.timeframe}`} value={`${s.symbol}|${s.timeframe}`}>
                  {s.symbol} ({s.timeframe})
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">Date Selection *</label>
          <div className="flex gap-1 mb-3">
            {([
              { key: 'range', label: 'Fixed range' },
              { key: 'duration', label: 'Start + duration' },
              { key: 'random', label: 'Random' },
            ] as { key: DateMode; label: string }[]).map(m => (
              <button
                key={m.key}
                onClick={() => setDateMode(m.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors
                  ${dateMode === m.key ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:bg-gray-50 border border-gray-200'}`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {dateMode === 'range' && (
            <div className="flex items-center gap-2">
              <input type="date" value={rangeFrom} onChange={e => setRangeFrom(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <span className="text-gray-300 text-sm">–</span>
              <input type="date" value={rangeTo} onChange={e => setRangeTo(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          )}

          {dateMode === 'duration' && (
            <div className="flex items-center gap-2 flex-wrap">
              <input type="date" value={durationStart} onChange={e => setDurationStart(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              {([
                { key: '1y', label: '1 year' },
                { key: '2y', label: '2 years' },
                { key: 'present', label: 'Until present' },
              ] as { key: Duration; label: string }[]).map(d => (
                <button
                  key={d.key}
                  onClick={() => setDuration(d.key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors
                    ${duration === d.key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          )}

          {dateMode === 'random' && (
            <div className="flex items-center gap-2">
              {(['1y', '2y'] as const).map(d => (
                <button
                  key={d}
                  onClick={() => setRandomDuration(d)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors
                    ${randomDuration === d ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {d === '1y' ? '1 year' : '2 years'}
                </button>
              ))}
            </div>
          )}

          {selected && (
            <p className="text-xs text-gray-400 mt-2">
              Min: {format(new Date(selected.from), 'MMM d, yyyy')} · Max: {format(new Date(selected.to), 'MMM d, yyyy')}
            </p>
          )}
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} loading={submitting} disabled={!selected}>
            Create session
          </Button>
        </div>
      </div>
    </Modal>
  );
}
