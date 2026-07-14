import { Request, Response, NextFunction } from 'express';
import { parse } from 'csv-parse/sync';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../config/db';
import { OHLCVBar, BacktestRules } from '../types';
import { computeIndicators, runSimulation, computeStats } from '../services/backtestEngine';
import { listMarketBars } from '../services/marketDataService';

function parseCSV(buffer: Buffer): OHLCVBar[] {
  const records = parse(buffer, { columns: true, skip_empty_lines: true, trim: true });
  return records.map((r: Record<string, string>) => {
    const keys = Object.keys(r).map(k => k.toLowerCase());
    const get = (names: string[]) => {
      for (const n of names) {
        const k = Object.keys(r).find(k => k.toLowerCase() === n);
        if (k) return parseFloat(r[k]);
      }
      return 0;
    };
    const getDate = () => {
      const k = Object.keys(r).find(k => ['date', 'time', 'datetime', 'timestamp'].includes(k.toLowerCase()));
      return k ? new Date(r[k]) : new Date();
    };
    void keys;
    return {
      timestamp: getDate(),
      open: get(['open', 'o']),
      high: get(['high', 'h']),
      low: get(['low', 'l']),
      close: get(['close', 'c', 'adj close', 'adj_close']),
      volume: get(['volume', 'vol', 'v']),
    } as OHLCVBar;
  }).filter((b: OHLCVBar) => !isNaN(b.close) && b.close > 0);
}

async function executeBacktest(runId: string, bars: OHLCVBar[], rules: BacktestRules, symbol: string) {
  try {
    if (bars.length < 2) throw new Error('Not enough bars to run a backtest');

    const iv = computeIndicators(bars, rules);
    const trades = runSimulation(bars, rules, iv, symbol);
    const stats = computeStats(trades, rules.initialCapital ?? 10000);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `UPDATE backtest_runs SET status='complete', stats=$1, completed_at=NOW() WHERE id=$2`,
        [JSON.stringify(stats), runId]
      );
      for (const t of trades) {
        await client.query(
          `INSERT INTO backtest_trades (id, run_id, symbol, side, entry_time, exit_time, entry_price, exit_price, quantity, pnl, entry_reason, exit_reason, tp_price, sl_price)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
          [uuidv4(), runId, t.symbol, t.side, t.entry_time, t.exit_time,
           t.entry_price, t.exit_price, t.quantity, t.pnl,
           JSON.stringify(t.entry_reason), JSON.stringify(t.exit_reason),
           t.tp_price ?? null, t.sl_price ?? null]
        );
      }

      const BATCH_SIZE = 500;
      for (let i = 0; i < bars.length; i += BATCH_SIZE) {
        const batch = bars.slice(i, i + BATCH_SIZE);
        const values: unknown[] = [];
        const rowsSql = batch.map((b, j) => {
          const base = j * 6;
          values.push(runId, b.timestamp, b.open, b.high, b.low, b.close);
          return `($${base + 1},$${base + 2},$${base + 3},$${base + 4},$${base + 5},$${base + 6})`;
        }).join(',');
        await client.query(
          `INSERT INTO backtest_bars (run_id, timestamp, open, high, low, close) VALUES ${rowsSql}`,
          values
        );
      }

      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (err) {
    await pool.query(
      `UPDATE backtest_runs SET status='error', error_message=$1, completed_at=NOW() WHERE id=$2`,
      [(err as Error).message, runId]
    );
  }
}

export async function submitBacktest(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) return res.status(400).json({ error: 'CSV file required' });
    const { name, rules: rulesJson, symbol, timeframe, account_id } = req.body;
    const rules: BacktestRules = typeof rulesJson === 'string' ? JSON.parse(rulesJson) : rulesJson;
    const runId = uuidv4();

    await pool.query(
      `INSERT INTO backtest_runs (id, account_id, name, symbol, timeframe, rules, csv_filename, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'running')`,
      [runId, account_id ?? null, name || 'Unnamed Run', symbol || '', timeframe || '', JSON.stringify(rules), req.file.originalname]
    );

    const bars = parseCSV(req.file.buffer);
    setImmediate(() => executeBacktest(runId, bars, rules, symbol || 'UNKNOWN'));

    res.status(202).json({ runId });
  } catch (e) { next(e); }
}

export async function createDraftSession(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, symbol, timeframe, account_balance, start, end, account_id } = req.body;
    if (!symbol || !timeframe || !start || !end) {
      return res.status(400).json({ error: 'symbol, timeframe, start, end are required' });
    }
    const runId = uuidv4();
    const rules: BacktestRules = {
      entryConditions: [],
      exitConditions: [],
      side: 'long',
      positionSize: 1,
      initialCapital: account_balance ?? 10000,
    };

    await pool.query(
      `INSERT INTO backtest_runs (id, account_id, name, symbol, timeframe, rules, start_date, end_date, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'pending')`,
      [runId, account_id ?? null, name || 'Unnamed Session', symbol, timeframe, JSON.stringify(rules), start, end]
    );

    res.status(201).json({ runId });
  } catch (e) { next(e); }
}

export async function runDraftSession(req: Request, res: Response, next: NextFunction) {
  try {
    const { runId } = req.params;
    const { rules: rulesJson } = req.body;
    const rules: BacktestRules = typeof rulesJson === 'string' ? JSON.parse(rulesJson) : rulesJson;

    const { rows } = await pool.query('SELECT * FROM backtest_runs WHERE id=$1', [runId]);
    const run = rows[0];
    if (!run) return res.status(404).json({ error: 'Not found' });

    await pool.query(
      `UPDATE backtest_runs SET status='running', rules=$1 WHERE id=$2`,
      [JSON.stringify(rules), runId]
    );

    const marketBars = await listMarketBars(run.symbol, run.timeframe, run.start_date, run.end_date);
    if (marketBars.length < 2) {
      await pool.query(
        `UPDATE backtest_runs SET status='error', error_message=$1, completed_at=NOW() WHERE id=$2`,
        ['Not enough market data for the selected symbol/date range', runId]
      );
      return res.status(202).json({ runId });
    }
    const bars: OHLCVBar[] = marketBars.map(b => ({
      timestamp: b.timestamp,
      open: Number(b.open), high: Number(b.high), low: Number(b.low), close: Number(b.close),
      volume: Number(b.volume),
    }));

    setImmediate(() => executeBacktest(runId, bars, rules, run.symbol));

    res.status(202).json({ runId });
  } catch (e) { next(e); }
}

export async function getBacktestRun(req: Request, res: Response, next: NextFunction) {
  try {
    const { rows } = await pool.query('SELECT * FROM backtest_runs WHERE id=$1', [req.params.runId]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    const run = rows[0];
    if (run.status === 'complete') {
      const { rows: trades } = await pool.query(
        'SELECT * FROM backtest_trades WHERE run_id=$1 ORDER BY entry_time',
        [req.params.runId]
      );
      run.trades = trades;
    }
    res.json(run);
  } catch (e) { next(e); }
}

export async function listBacktestRuns(req: Request, res: Response, next: NextFunction) {
  try {
    const { account_id } = req.query;
    const { rows } = await pool.query(
      `SELECT id, name, symbol, timeframe, status, stats, created_at, completed_at
       FROM backtest_runs
       WHERE ($1::uuid IS NULL OR account_id=$1)
       ORDER BY created_at DESC LIMIT 50`,
      [account_id ?? null]
    );
    res.json(rows);
  } catch (e) { next(e); }
}

export async function deleteBacktestRun(req: Request, res: Response, next: NextFunction) {
  try {
    await pool.query('DELETE FROM backtest_runs WHERE id=$1', [req.params.runId]);
    res.status(204).send();
  } catch (e) { next(e); }
}

export async function previewCsv(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) return res.status(400).json({ error: 'CSV file required' });
    const records = parse(req.file.buffer, { columns: true, skip_empty_lines: true, trim: true, to: 5 });
    const columns = records.length > 0 ? Object.keys(records[0]) : [];
    res.json({ columns, sample: records });
  } catch (e) { next(e); }
}

export async function getBacktestBars(req: Request, res: Response, next: NextFunction) {
  try {
    const { rows } = await pool.query(
      `SELECT timestamp, open, high, low, close, volume
       FROM backtest_bars WHERE run_id=$1 ORDER BY timestamp`,
      [req.params.runId]
    );
    res.json(rows);
  } catch (e) { next(e); }
}
