import { getHistoricalRates, ConfigJsonItem, InstrumentType } from 'dukascopy-node';
import { pool } from '../config/db';
import { MarketBar } from '../types';

export type AppTimeframe = 'M1' | 'M15' | 'H1' | 'H4' | 'D1';

const TIMEFRAME_MAP: Record<AppTimeframe, 'm1' | 'm15' | 'h1' | 'h4' | 'd1'> = {
  M1: 'm1', M15: 'm15', H1: 'h1', H4: 'h4', D1: 'd1',
};

export function isAppTimeframe(tf: string): tf is AppTimeframe {
  return tf in TIMEFRAME_MAP;
}

export async function fetchAndStoreBars(
  symbol: string,
  timeframe: AppTimeframe,
  start: Date,
  end: Date,
): Promise<{ inserted: number; fetched: number }> {
  const config: ConfigJsonItem = {
    instrument: symbol.toLowerCase() as InstrumentType,
    dates: { from: start, to: end },
    timeframe: TIMEFRAME_MAP[timeframe],
    format: 'json',
    volumes: true,
  };
  const rows = await getHistoricalRates(config);

  if (!rows || rows.length === 0) {
    throw new Error(`No data returned for ${symbol} ${timeframe}: ${start.toISOString()} -> ${end.toISOString()}`);
  }

  const BATCH_SIZE = 500;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const values: unknown[] = [];
    const rowsSql = batch.map((r, j) => {
      const base = j * 8;
      values.push(symbol, timeframe, new Date(r.timestamp), r.open, r.high, r.low, r.close, r.volume ?? 0);
      return `($${base + 1},$${base + 2},$${base + 3},$${base + 4},$${base + 5},$${base + 6},$${base + 7},$${base + 8})`;
    }).join(',');

    const { rowCount } = await pool.query(
      `INSERT INTO market_bars (symbol, timeframe, timestamp, open, high, low, close, volume)
       VALUES ${rowsSql}
       ON CONFLICT (symbol, timeframe, timestamp) DO NOTHING`,
      values
    );
    inserted += rowCount ?? 0;
  }

  return { inserted, fetched: rows.length };
}

export async function listMarketBars(
  symbol: string,
  timeframe: string,
  start?: Date,
  end?: Date,
): Promise<MarketBar[]> {
  const { rows } = await pool.query(
    `SELECT symbol, timeframe, timestamp, open, high, low, close, volume
     FROM market_bars
     WHERE symbol=$1 AND timeframe=$2
       AND ($3::timestamptz IS NULL OR timestamp >= $3)
       AND ($4::timestamptz IS NULL OR timestamp <= $4)
     ORDER BY timestamp`,
    [symbol, timeframe, start ?? null, end ?? null]
  );
  return rows;
}

export interface MarketSeriesSummary {
  symbol: string;
  timeframe: string;
  count: number;
  from: Date;
  to: Date;
}

export async function listAvailableSeries(): Promise<MarketSeriesSummary[]> {
  const { rows } = await pool.query(
    `SELECT symbol, timeframe, count(*)::int AS count, min(timestamp) AS from, max(timestamp) AS to
     FROM market_bars
     GROUP BY symbol, timeframe
     ORDER BY symbol, timeframe`
  );
  return rows;
}
