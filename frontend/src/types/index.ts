export interface Account {
  id: string;
  name: string;
  currency: string;
  created_at: string;
}

export interface Trade {
  id: string;
  account_id: string;
  symbol: string;
  side: 'long' | 'short';
  entry_price: number;
  exit_price: number;
  quantity: number;
  entry_time: string;
  exit_time: string;
  commission: number;
  notes?: string;
  screenshot_url?: string;
  pnl: number;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface TradeFormValues {
  symbol: string;
  side: 'long' | 'short';
  entry_price: number;
  exit_price: number;
  quantity: number;
  entry_time: string;
  exit_time: string;
  commission: number;
  notes: string;
  screenshot_url: string;
  tags: string;
}

export interface DailyStats {
  date: string;
  pnl: number;
  trade_count: number;
  wins: number;
  losses: number;
}

export interface SummaryStats {
  net_pnl: number;
  win_rate: number;
  profit_factor: number;
  total_trades: number;
  avg_win: number;
  avg_loss: number;
  day_win_rate: number;
  gross_profit: number;
  gross_loss: number;
}

export interface EquityPoint {
  time: string;
  pnl: number;
  cumulative_pnl: number;
}

export interface DrawdownPoint {
  time: string;
  drawdown: number;
}

export type IndicatorType = 'SMA' | 'EMA' | 'RSI' | 'MACD' | 'BB' | 'ATR' | 'VWAP' | 'Price';
export type OperatorType = 'greaterThan' | 'lessThan' | 'crossesAbove' | 'crossesBelow' | 'equals';

export interface IndicatorTarget {
  indicator: IndicatorType;
  params: Record<string, number>;
}

export interface Condition {
  id: string;
  indicator: IndicatorType;
  params: Record<string, number>;
  operator: OperatorType;
  targetType: 'value' | 'indicator';
  targetValue?: number;
  targetIndicator?: IndicatorTarget;
}

export interface BacktestRules {
  entryConditions: Condition[];
  exitConditions: Condition[];
  side: 'long' | 'short';
  positionSize: number;
  stopLoss?: { type: 'percent' | 'absolute'; value: number };
  takeProfit?: { type: 'percent' | 'absolute'; value: number };
  initialCapital?: number;
}

export interface BacktestStats {
  total_trades: number;
  win_rate: number;
  profit_factor: number;
  net_pnl: number;
  avg_win: number;
  avg_loss: number;
  max_drawdown_pct: number;
  equity_curve: Array<{ time: string; value: number }>;
  gross_profit: number;
  gross_loss: number;
}

export interface BacktestRun {
  id: string;
  name: string;
  symbol?: string;
  timeframe?: string;
  rules?: BacktestRules;
  start_date?: string;
  end_date?: string;
  status: 'pending' | 'running' | 'complete' | 'error';
  stats?: BacktestStats;
  trades?: BacktestTrade[];
  error_message?: string;
  created_at: string;
  completed_at?: string;
}

export interface MarketSeriesSummary {
  symbol: string;
  timeframe: string;
  count: number;
  from: string;
  to: string;
}

export interface BacktestTrade {
  id: string;
  run_id: string;
  symbol: string;
  side: 'long' | 'short';
  entry_time: string;
  exit_time: string;
  entry_price: number;
  exit_price: number;
  quantity: number;
  pnl: number;
  tp_price?: number | null;
  sl_price?: number | null;
}

export interface OHLCVBar {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}
