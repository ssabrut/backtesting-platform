export interface Account {
  id: string;
  name: string;
  currency: string;
  created_at: Date;
}

export interface Trade {
  id: string;
  account_id: string;
  symbol: string;
  side: 'long' | 'short';
  entry_price: number;
  exit_price: number;
  quantity: number;
  entry_time: Date;
  exit_time: Date;
  commission: number;
  notes?: string;
  screenshot_url?: string;
  pnl: number;
  tags: string[];
  created_at: Date;
  updated_at: Date;
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
  max_drawdown: number;
  max_drawdown_pct: number;
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

export interface StopLossTakeProfit {
  type: 'percent' | 'absolute';
  value: number;
}

export interface BacktestRules {
  entryConditions: Condition[];
  exitConditions: Condition[];
  side: 'long' | 'short';
  positionSize: number;
  stopLoss?: StopLossTakeProfit;
  takeProfit?: StopLossTakeProfit;
  initialCapital?: number;
}

export interface BacktestRun {
  id: string;
  account_id?: string;
  name: string;
  symbol?: string;
  timeframe?: string;
  rules: BacktestRules;
  csv_filename?: string;
  stats?: BacktestStats;
  status: 'pending' | 'running' | 'complete' | 'error';
  error_message?: string;
  created_at: Date;
  completed_at?: Date;
}

export interface BacktestTrade {
  id?: string;
  run_id?: string;
  symbol: string;
  side: 'long' | 'short';
  entry_time: Date;
  exit_time: Date;
  entry_price: number;
  exit_price: number;
  quantity: number;
  pnl: number;
  entry_reason?: Record<string, unknown>;
  exit_reason?: Record<string, unknown>;
  tp_price?: number | null;
  sl_price?: number | null;
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

export interface OHLCVBar {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketBar {
  symbol: string;
  timeframe: string;
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}
