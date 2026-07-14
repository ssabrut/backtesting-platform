import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse';
import { pool } from '../config/db';

const SEED_DIR = process.env.SEED_DIR || path.join(__dirname, '../../seed');

interface SeedSpec {
  file: string;
  symbol: string;
  timeframe: string;
}

const SEEDS: SeedSpec[] = [
  { file: 'NAS100_M1.csv', symbol: 'NAS100', timeframe: 'M1' },
];

async function alreadySeeded(symbol: string, timeframe: string): Promise<boolean> {
  const { rows } = await pool.query(
    'SELECT 1 FROM market_bars WHERE symbol=$1 AND timeframe=$2 LIMIT 1',
    [symbol, timeframe]
  );
  return rows.length > 0;
}

interface CsvRow {
  datetime: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
}

async function seedFile({ file, symbol, timeframe }: SeedSpec) {
  const filePath = path.join(SEED_DIR, file);
  if (!fs.existsSync(filePath)) {
    console.log(`[seed] ${file} not found at ${filePath}, skipping`);
    return;
  }
  if (await alreadySeeded(symbol, timeframe)) {
    console.log(`[seed] ${symbol} ${timeframe} already has data, skipping ${file}`);
    return;
  }

  console.log(`[seed] importing ${file} -> ${symbol} ${timeframe}...`);
  const BATCH_SIZE = 1000;
  let batch: CsvRow[] = [];
  let total = 0;

  async function flush() {
    if (batch.length === 0) return;
    const values: unknown[] = [];
    const rowsSql = batch.map((r, j) => {
      const base = j * 8;
      values.push(symbol, timeframe, new Date(r.datetime), r.open, r.high, r.low, r.close, r.volume ?? 0);
      return `($${base + 1},$${base + 2},$${base + 3},$${base + 4},$${base + 5},$${base + 6},$${base + 7},$${base + 8})`;
    }).join(',');
    await pool.query(
      `INSERT INTO market_bars (symbol, timeframe, timestamp, open, high, low, close, volume)
       VALUES ${rowsSql}
       ON CONFLICT (symbol, timeframe, timestamp) DO NOTHING`,
      values
    );
    total += batch.length;
    batch = [];
  }

  const parser = fs.createReadStream(filePath).pipe(parse({ columns: true, skip_empty_lines: true, trim: true }));

  for await (const record of parser as AsyncIterable<CsvRow>) {
    batch.push(record);
    if (batch.length >= BATCH_SIZE) await flush();
  }
  await flush();

  console.log(`[seed] ${file}: inserted ${total} rows`);
}

export async function runSeeds() {
  for (const spec of SEEDS) {
    await seedFile(spec);
  }
}
