import { useEffect, useRef, useState } from 'react';
import { createChart, CrosshairMode, type IChartApi, type ISeriesApi, type Time } from 'lightweight-charts';
import type { BacktestRun, OHLCVBar } from '../../types';
import { computeChartIndicators } from '../../utils/indicators';
import { TradeZonesPrimitive } from './tradeZonesPrimitive';
import { useChartSettings } from '../../hooks/useChartSettings';
import { Spinner } from '../ui/Spinner';
import client from '../../api/client';

const OVERLAY_COLORS: Record<string, string> = {
  SMA: '#2962ff', EMA: '#ab47bc', BB: '#787b86', VWAP: '#ff9800',
};
const OSCILLATOR_COLORS: Record<string, string> = {
  RSI: '#2962ff', MACD: '#ff9800',
};

function toUnixSeconds(iso: string): number {
  return Math.floor(new Date(iso).getTime() / 1000);
}

interface Props {
  run: BacktestRun;
  barsSource?: 'run' | 'market-data';
}

export function BacktestChart({ run, barsSource = 'run' }: Props) {
  const { settings } = useChartSettings();
  const hostRef = useRef<HTMLDivElement>(null);
  const oscHostRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const oscChartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);

  const [bars, setBars] = useState<OHLCVBar[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasOscillator, setHasOscillator] = useState(false);

  useEffect(() => {
    if (barsSource === 'run' && run.status !== 'complete') { setLoading(false); setBars(null); return; }
    let cancelled = false;
    setLoading(true);

    const request = barsSource === 'market-data'
      ? client.get<OHLCVBar[]>('/market-data/bars', {
          params: { symbol: run.symbol, timeframe: run.timeframe, start: run.start_date, end: run.end_date },
        })
      : client.get<OHLCVBar[]>(`/backtest/${run.id}/bars`);

    request
      .then(r => {
        // pg returns NUMERIC columns as strings — coerce once here for all downstream consumers.
        const numeric = r.data.map(b => ({
          timestamp: b.timestamp,
          open: Number(b.open), high: Number(b.high), low: Number(b.low), close: Number(b.close),
          volume: Number(b.volume),
        }));
        if (!cancelled) setBars(numeric);
      })
      .catch(() => { if (!cancelled) setBars([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [run.id, run.status, run.symbol, run.timeframe, run.start_date, run.end_date, barsSource]);

  useEffect(() => {
    if (!hostRef.current || !bars || bars.length === 0) return;

    const chart = createChart(hostRef.current, {
      layout: { background: { color: '#ffffff' }, textColor: '#131722' },
      grid: {
        vertLines: { visible: settings.gridLines, color: '#f0f3fa' },
        horzLines: { visible: false },
      },
      timeScale: { timeVisible: true, secondsVisible: false, borderColor: '#d1d4dc' },
      rightPriceScale: { borderColor: '#d1d4dc' },
      crosshair: { mode: CrosshairMode.Normal },
    });
    chartRef.current = chart;

    const series = chart.addCandlestickSeries({
      upColor: settings.upColor, downColor: settings.downColor,
      borderUpColor: settings.upColor, borderDownColor: settings.downColor,
      wickUpColor: settings.upColor, wickDownColor: settings.downColor,
      priceFormat: { type: 'price', precision: settings.precision, minMove: 1 / Math.pow(10, settings.precision) },
    });
    seriesRef.current = series;

    series.setData(bars.map(b => ({
      time: toUnixSeconds(b.timestamp) as Time,
      open: b.open, high: b.high, low: b.low, close: b.close,
    })));

    const indicatorSeries = settings.indicators
      ? computeChartIndicators(bars, run.rules?.entryConditions ?? [], run.rules?.exitConditions ?? [])
      : [];
    const overlaySeries = indicatorSeries.filter(s => s.kind === 'overlay');
    const oscSeries = indicatorSeries.filter(s => s.kind === 'oscillator');
    setHasOscillator(oscSeries.length > 0);

    overlaySeries.forEach(s => {
      const kind = s.key.split(':')[0];
      const line = chart.addLineSeries({
        color: OVERLAY_COLORS[kind] || '#787b86',
        lineWidth: 1, title: s.label, priceLineVisible: false, lastValueVisible: false,
      });
      const points = bars
        .map((b, i) => ({ time: toUnixSeconds(b.timestamp) as Time, value: s.values[i] }))
        .filter(p => !isNaN(p.value));
      line.setData(points);
    });

    let oscChart: IChartApi | null = null;
    if (oscSeries.length > 0 && oscHostRef.current) {
      oscChart = createChart(oscHostRef.current, {
        layout: { background: { color: '#ffffff' }, textColor: '#131722' },
        grid: {
          vertLines: { visible: settings.gridLines, color: '#f0f3fa' },
          horzLines: { visible: false },
        },
        timeScale: { timeVisible: true, secondsVisible: false, borderColor: '#d1d4dc', visible: false },
        rightPriceScale: { borderColor: '#d1d4dc' },
        crosshair: { mode: CrosshairMode.Normal },
        handleScroll: false, handleScale: false,
      });
      oscChartRef.current = oscChart;

      oscSeries.forEach(s => {
        const kind = s.key.split(':')[0];
        const line = oscChart!.addLineSeries({
          color: OSCILLATOR_COLORS[kind] || '#787b86',
          lineWidth: 1, title: s.label, priceLineVisible: false, lastValueVisible: false,
        });
        const points = bars
          .map((b, i) => ({ time: toUnixSeconds(b.timestamp) as Time, value: s.values[i] }))
          .filter(p => !isNaN(p.value));
        line.setData(points);
      });

      let syncing = false;
      chart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
        if (syncing || !range) return;
        syncing = true;
        oscChart!.timeScale().setVisibleLogicalRange(range);
        syncing = false;
      });
      oscChart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
        if (syncing || !range) return;
        syncing = true;
        chart.timeScale().setVisibleLogicalRange(range);
        syncing = false;
      });
    }

    if (barsSource === 'run' && settings.trades && run.trades && run.trades.length > 0) {
      // pg returns NUMERIC columns as strings — coerce before handing to the canvas primitive.
      const numericTrades = run.trades.map(t => ({
        ...t,
        entry_price: Number(t.entry_price), exit_price: Number(t.exit_price),
        quantity: Number(t.quantity), pnl: Number(t.pnl),
        tp_price: t.tp_price != null ? Number(t.tp_price) : t.tp_price,
        sl_price: t.sl_price != null ? Number(t.sl_price) : t.sl_price,
      }));
      const primitive = new TradeZonesPrimitive(numericTrades, settings.upColor, settings.downColor);
      series.attachPrimitive(primitive);
    }

    chart.timeScale().fitContent();

    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      chart.resize(width, height);
    });
    ro.observe(hostRef.current);

    let oscRo: ResizeObserver | null = null;
    if (oscChart && oscHostRef.current) {
      oscRo = new ResizeObserver(entries => {
        const { width, height } = entries[0].contentRect;
        if (height > 0) oscChart!.resize(width, height);
      });
      oscRo.observe(oscHostRef.current);
    }

    return () => {
      ro.disconnect();
      oscRo?.disconnect();
      chart.remove();
      oscChart?.remove();
      chartRef.current = null;
      oscChartRef.current = null;
      seriesRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bars, run.id, settings, barsSource]);

  if (barsSource === 'run' && run.status !== 'complete') return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Spinner size="md" />
      </div>
    );
  }

  if (!bars || bars.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-sm text-gray-400">
        No chart data available for this run.
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div ref={hostRef} className="h-80 w-full" />
      <div ref={oscHostRef} className={hasOscillator ? 'h-24 w-full' : 'hidden'} />
    </div>
  );
}
