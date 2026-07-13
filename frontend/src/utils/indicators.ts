import type { OHLCVBar, Condition, IndicatorType } from '../types';

export function sma(closes: number[], period: number): number[] {
  return closes.map((_, i) => {
    if (i < period - 1) return NaN;
    const slice = closes.slice(i - period + 1, i + 1);
    return slice.reduce((s, v) => s + v, 0) / period;
  });
}

export function ema(closes: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const result: number[] = new Array(closes.length).fill(NaN);
  if (closes.length < period) return result;
  let seed = closes.slice(0, period).reduce((s, v) => s + v, 0) / period;
  result[period - 1] = seed;
  for (let i = period; i < closes.length; i++) {
    seed = closes[i] * k + seed * (1 - k);
    result[i] = seed;
  }
  return result;
}

export function rsi(closes: number[], period: number): number[] {
  const result: number[] = new Array(closes.length).fill(NaN);
  if (closes.length < period + 1) return result;
  let avgGain = 0, avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) avgGain += diff; else avgLoss += Math.abs(diff);
  }
  avgGain /= period; avgLoss /= period;
  result[period] = 100 - 100 / (1 + (avgLoss === 0 ? Infinity : avgGain / avgLoss));
  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? Math.abs(diff) : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    result[i] = 100 - 100 / (1 + (avgLoss === 0 ? Infinity : avgGain / avgLoss));
  }
  return result;
}

export function bollingerBands(closes: number[], period: number, stdMult: number) {
  const middle = sma(closes, period);
  const upper: number[] = new Array(closes.length).fill(NaN);
  const lower: number[] = new Array(closes.length).fill(NaN);
  for (let i = period - 1; i < closes.length; i++) {
    const slice = closes.slice(i - period + 1, i + 1);
    const mean = middle[i];
    const variance = slice.reduce((s, v) => s + (v - mean) ** 2, 0) / period;
    const std = Math.sqrt(variance);
    upper[i] = mean + stdMult * std;
    lower[i] = mean - stdMult * std;
  }
  return { upper, middle, lower };
}

export function vwap(bars: OHLCVBar[]): number[] {
  let cumPV = 0, cumV = 0;
  return bars.map(b => {
    const typical = (b.high + b.low + b.close) / 3;
    cumPV += typical * b.volume;
    cumV += b.volume;
    return cumV === 0 ? NaN : cumPV / cumV;
  });
}

export const OVERLAY_INDICATORS: IndicatorType[] = ['SMA', 'EMA', 'BB', 'VWAP'];
export const OSCILLATOR_INDICATORS: IndicatorType[] = ['RSI', 'MACD'];

export interface IndicatorSeries {
  key: string;
  label: string;
  kind: 'overlay' | 'oscillator';
  values: number[];
}

function paramsKey(indicator: string, params: Record<string, number>) {
  return `${indicator}:${JSON.stringify(params)}`;
}

function collectIndicatorDefs(conditions: Condition[]): Array<{ indicator: IndicatorType; params: Record<string, number> }> {
  const defs: Array<{ indicator: IndicatorType; params: Record<string, number> }> = [];
  for (const cond of conditions) {
    defs.push({ indicator: cond.indicator, params: cond.params });
    if (cond.targetType === 'indicator' && cond.targetIndicator) {
      defs.push({ indicator: cond.targetIndicator.indicator, params: cond.targetIndicator.params });
    }
  }
  return defs;
}

/** Computes overlay/oscillator indicator series for a chart from the bars actually used by a run's rules. */
export function computeChartIndicators(bars: OHLCVBar[], entryConditions: Condition[], exitConditions: Condition[]): IndicatorSeries[] {
  const closes = bars.map(b => b.close);
  const defs = [...collectIndicatorDefs(entryConditions), ...collectIndicatorDefs(exitConditions)];
  const seen = new Set<string>();
  const series: IndicatorSeries[] = [];

  for (const { indicator, params } of defs) {
    const key = paramsKey(indicator, params);
    if (seen.has(key)) continue;
    seen.add(key);

    const kind: 'overlay' | 'oscillator' = OSCILLATOR_INDICATORS.includes(indicator) ? 'oscillator' : 'overlay';

    if (indicator === 'SMA') {
      series.push({ key, label: `SMA(${params.period})`, kind, values: sma(closes, params.period) });
    } else if (indicator === 'EMA') {
      series.push({ key, label: `EMA(${params.period})`, kind, values: ema(closes, params.period) });
    } else if (indicator === 'RSI') {
      series.push({ key, label: `RSI(${params.period})`, kind, values: rsi(closes, params.period) });
    } else if (indicator === 'BB') {
      const bb = bollingerBands(closes, params.period ?? 20, params.stddev ?? 2);
      series.push({ key: `${key}:upper`, label: `BB upper(${params.period ?? 20})`, kind: 'overlay', values: bb.upper });
      series.push({ key: `${key}:lower`, label: `BB lower(${params.period ?? 20})`, kind: 'overlay', values: bb.lower });
    } else if (indicator === 'VWAP') {
      series.push({ key, label: 'VWAP', kind: 'overlay', values: vwap(bars) });
    }
    // ATR/Price/MACD/ADX are not chart-plottable overlays/oscillators in this view — skipped.
  }

  return series;
}
