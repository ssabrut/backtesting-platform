import { OHLCVBar, BacktestRules, BacktestTrade, BacktestStats, Condition, IndicatorType } from '../types';

// --- Indicator computation (pure functions) ---

function sma(closes: number[], period: number): number[] {
  return closes.map((_, i) => {
    if (i < period - 1) return NaN;
    const slice = closes.slice(i - period + 1, i + 1);
    return slice.reduce((s, v) => s + v, 0) / period;
  });
}

function ema(closes: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const result: number[] = new Array(closes.length).fill(NaN);
  let seed = closes.slice(0, period).reduce((s, v) => s + v, 0) / period;
  result[period - 1] = seed;
  for (let i = period; i < closes.length; i++) {
    seed = closes[i] * k + seed * (1 - k);
    result[i] = seed;
  }
  return result;
}

function rsi(closes: number[], period: number): number[] {
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

function atr(bars: OHLCVBar[], period: number): number[] {
  const result: number[] = new Array(bars.length).fill(NaN);
  const trs = bars.map((b, i) => {
    if (i === 0) return b.high - b.low;
    const prevClose = bars[i - 1].close;
    return Math.max(b.high - b.low, Math.abs(b.high - prevClose), Math.abs(b.low - prevClose));
  });
  let atrVal = trs.slice(0, period).reduce((s, v) => s + v, 0) / period;
  result[period - 1] = atrVal;
  for (let i = period; i < bars.length; i++) {
    atrVal = (atrVal * (period - 1) + trs[i]) / period;
    result[i] = atrVal;
  }
  return result;
}

function bollingerBands(closes: number[], period: number, stdMult: number) {
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

function vwap(bars: OHLCVBar[]): number[] {
  let cumPV = 0, cumV = 0;
  return bars.map(b => {
    const typical = (b.high + b.low + b.close) / 3;
    cumPV += typical * b.volume;
    cumV += b.volume;
    return cumV === 0 ? NaN : cumPV / cumV;
  });
}

export interface IndicatorValues {
  SMA: Map<string, number[]>;
  EMA: Map<string, number[]>;
  RSI: Map<string, number[]>;
  ATR: Map<string, number[]>;
  BB_upper: Map<string, number[]>;
  BB_middle: Map<string, number[]>;
  BB_lower: Map<string, number[]>;
  VWAP: number[];
  Price: number[];
}

function paramsKey(params: Record<string, number>) {
  return JSON.stringify(params);
}

export function computeIndicators(bars: OHLCVBar[], rules: BacktestRules): IndicatorValues {
  const closes = bars.map(b => b.close);
  const allConditions = [...rules.entryConditions, ...rules.exitConditions];
  const indicatorDefs: Array<{ indicator: IndicatorType; params: Record<string, number> }> = [];

  for (const cond of allConditions) {
    indicatorDefs.push({ indicator: cond.indicator, params: cond.params });
    if (cond.targetType === 'indicator' && cond.targetIndicator) {
      indicatorDefs.push({ indicator: cond.targetIndicator.indicator, params: cond.targetIndicator.params });
    }
  }

  const iv: IndicatorValues = {
    SMA: new Map(), EMA: new Map(), RSI: new Map(), ATR: new Map(),
    BB_upper: new Map(), BB_middle: new Map(), BB_lower: new Map(),
    VWAP: vwap(bars), Price: closes,
  };

  for (const { indicator, params } of indicatorDefs) {
    const key = paramsKey(params);
    if (indicator === 'SMA' && !iv.SMA.has(key)) iv.SMA.set(key, sma(closes, params.period));
    if (indicator === 'EMA' && !iv.EMA.has(key)) iv.EMA.set(key, ema(closes, params.period));
    if (indicator === 'RSI' && !iv.RSI.has(key)) iv.RSI.set(key, rsi(closes, params.period));
    if (indicator === 'ATR' && !iv.ATR.has(key)) iv.ATR.set(key, atr(bars, params.period));
    if (indicator === 'BB' && !iv.BB_upper.has(key)) {
      const bb = bollingerBands(closes, params.period ?? 20, params.stddev ?? 2);
      iv.BB_upper.set(key, bb.upper);
      iv.BB_middle.set(key, bb.middle);
      iv.BB_lower.set(key, bb.lower);
    }
  }

  return iv;
}

function getSeriesValue(
  indicator: IndicatorType,
  params: Record<string, number>,
  iv: IndicatorValues,
  barIndex: number
): number {
  const key = paramsKey(params);
  switch (indicator) {
    case 'SMA': return iv.SMA.get(key)?.[barIndex] ?? NaN;
    case 'EMA': return iv.EMA.get(key)?.[barIndex] ?? NaN;
    case 'RSI': return iv.RSI.get(key)?.[barIndex] ?? NaN;
    case 'ATR': return iv.ATR.get(key)?.[barIndex] ?? NaN;
    case 'BB': return iv.BB_middle.get(key)?.[barIndex] ?? NaN;
    case 'VWAP': return iv.VWAP[barIndex] ?? NaN;
    case 'Price': return iv.Price[barIndex] ?? NaN;
    default: return NaN;
  }
}

function evaluateCondition(cond: Condition, iv: IndicatorValues, barIndex: number): boolean {
  if (barIndex < 1) return false;
  const curr = getSeriesValue(cond.indicator, cond.params, iv, barIndex);
  const prev = getSeriesValue(cond.indicator, cond.params, iv, barIndex - 1);
  if (isNaN(curr) || isNaN(prev)) return false;

  let target: number, prevTarget: number;
  if (cond.targetType === 'value') {
    target = cond.targetValue ?? 0;
    prevTarget = target;
  } else {
    target = getSeriesValue(cond.targetIndicator!.indicator, cond.targetIndicator!.params, iv, barIndex);
    prevTarget = getSeriesValue(cond.targetIndicator!.indicator, cond.targetIndicator!.params, iv, barIndex - 1);
    if (isNaN(target) || isNaN(prevTarget)) return false;
  }

  switch (cond.operator) {
    case 'greaterThan':  return curr > target;
    case 'lessThan':     return curr < target;
    case 'crossesAbove': return prev <= prevTarget && curr > target;
    case 'crossesBelow': return prev >= prevTarget && curr < target;
    case 'equals':       return Math.abs(curr - target) < 1e-10;
    default: return false;
  }
}

function allConditionsTrue(conditions: Condition[], iv: IndicatorValues, barIndex: number): boolean {
  return conditions.every(c => evaluateCondition(c, iv, barIndex));
}

export function runSimulation(bars: OHLCVBar[], rules: BacktestRules, iv: IndicatorValues, symbol: string): BacktestTrade[] {
  const trades: BacktestTrade[] = [];
  let position: {
    entryBar: number;
    entryPrice: number;
    entryReason: Record<string, unknown>;
    slPrice: number | null;
    tpPrice: number | null;
  } | null = null;

  for (let i = 1; i < bars.length - 1; i++) {
    const bar = bars[i];
    const nextBar = bars[i + 1];

    if (!position) {
      if (allConditionsTrue(rules.entryConditions, iv, i)) {
        const entryPrice = nextBar.open;
        const slPrice = rules.stopLoss
          ? rules.side === 'long'
            ? entryPrice * (1 - rules.stopLoss.value / 100)
            : entryPrice * (1 + rules.stopLoss.value / 100)
          : null;
        const tpPrice = rules.takeProfit
          ? rules.side === 'long'
            ? entryPrice * (1 + rules.takeProfit.value / 100)
            : entryPrice * (1 - rules.takeProfit.value / 100)
          : null;

        position = {
          entryBar: i + 1,
          entryPrice,
          entryReason: { bar: i, conditions: rules.entryConditions.map(c => c.indicator) },
          slPrice,
          tpPrice,
        };
      }
    } else {
      const { entryPrice, slPrice, tpPrice } = position;
      let exitPrice: number | null = null;
      let exitReason: string = 'signal';

      // Check stop loss
      if (slPrice !== null) {
        if (rules.side === 'long' && bar.low <= slPrice) { exitPrice = slPrice; exitReason = 'stopLoss'; }
        if (rules.side === 'short' && bar.high >= slPrice) { exitPrice = slPrice; exitReason = 'stopLoss'; }
      }

      // Check take profit
      if (!exitPrice && tpPrice !== null) {
        if (rules.side === 'long' && bar.high >= tpPrice) { exitPrice = tpPrice; exitReason = 'takeProfit'; }
        if (rules.side === 'short' && bar.low <= tpPrice) { exitPrice = tpPrice; exitReason = 'takeProfit'; }
      }

      // Check exit conditions
      if (!exitPrice && rules.exitConditions.length > 0 && allConditionsTrue(rules.exitConditions, iv, i)) {
        exitPrice = nextBar.open;
        exitReason = 'signal';
      }

      if (exitPrice !== null) {
        const qty = rules.positionSize;
        const pnl = rules.side === 'long'
          ? (exitPrice - entryPrice) * qty
          : (entryPrice - exitPrice) * qty;

        trades.push({
          symbol,
          side: rules.side,
          entry_time: bars[position.entryBar].timestamp,
          exit_time: exitReason === 'stopLoss' || exitReason === 'takeProfit' ? bar.timestamp : nextBar.timestamp,
          entry_price: entryPrice,
          exit_price: exitPrice,
          quantity: qty,
          pnl,
          entry_reason: position.entryReason,
          exit_reason: { reason: exitReason },
          tp_price: tpPrice,
          sl_price: slPrice,
        });
        position = null;
      }
    }
  }
  return trades;
}

export function computeStats(trades: BacktestTrade[], initialCapital = 10000): BacktestStats {
  if (trades.length === 0) {
    return {
      total_trades: 0, win_rate: 0, profit_factor: 0, net_pnl: 0,
      avg_win: 0, avg_loss: 0, max_drawdown_pct: 0,
      equity_curve: [{ time: new Date().toISOString(), value: initialCapital }],
      gross_profit: 0, gross_loss: 0,
    };
  }

  const pnls = trades.map(t => t.pnl);
  const wins = pnls.filter(p => p > 0);
  const losses = pnls.filter(p => p < 0);
  const gross_profit = wins.reduce((s, p) => s + p, 0);
  const gross_loss = Math.abs(losses.reduce((s, p) => s + p, 0));

  let equity = initialCapital;
  let peak = initialCapital;
  let maxDD = 0;
  const equity_curve = trades.map(t => {
    equity += t.pnl;
    if (equity > peak) peak = equity;
    const dd = peak > 0 ? (peak - equity) / peak : 0;
    if (dd > maxDD) maxDD = dd;
    return { time: t.exit_time.toISOString(), value: equity };
  });
  equity_curve.unshift({ time: trades[0].entry_time.toISOString(), value: initialCapital });

  return {
    total_trades: trades.length,
    win_rate: wins.length / trades.length,
    profit_factor: gross_loss > 0 ? gross_profit / gross_loss : gross_profit > 0 ? 999 : 0,
    net_pnl: pnls.reduce((s, p) => s + p, 0),
    avg_win: wins.length ? gross_profit / wins.length : 0,
    avg_loss: losses.length ? -(gross_loss / losses.length) : 0,
    max_drawdown_pct: maxDD,
    equity_curve,
    gross_profit,
    gross_loss,
  };
}
