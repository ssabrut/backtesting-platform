import { pool } from '../config/db';
import { Trade } from '../types';

export interface TradeFilters {
  account_id: string;
  symbol?: string;
  side?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
  sort?: string;
  order?: string;
}

export async function listTrades(filters: TradeFilters) {
  const { account_id, symbol, side, from, to, page = 1, limit = 50, sort = 'entry_time', order = 'desc' } = filters;
  const params: unknown[] = [account_id];
  const conditions: string[] = ['account_id = $1'];

  if (symbol) { params.push(symbol.toUpperCase()); conditions.push(`symbol = $${params.length}`); }
  if (side) { params.push(side); conditions.push(`side = $${params.length}`); }
  if (from) { params.push(from); conditions.push(`entry_time >= $${params.length}`); }
  if (to) { params.push(to); conditions.push(`entry_time <= $${params.length}`); }

  const allowedSort = ['entry_time', 'exit_time', 'symbol', 'pnl', 'created_at'];
  const safeSort = allowedSort.includes(sort) ? sort : 'entry_time';
  const safeOrder = order === 'asc' ? 'ASC' : 'DESC';

  const offset = (page - 1) * limit;
  params.push(limit, offset);

  const where = conditions.join(' AND ');
  const { rows } = await pool.query(
    `SELECT * FROM trades WHERE ${where} ORDER BY ${safeSort} ${safeOrder} LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  const countResult = await pool.query(`SELECT COUNT(*) FROM trades WHERE ${where}`, params.slice(0, -2));
  return { trades: rows as Trade[], total: parseInt(countResult.rows[0].count) };
}

export async function getTrade(id: string) {
  const { rows } = await pool.query('SELECT * FROM trades WHERE id = $1', [id]);
  return rows[0] as Trade | undefined;
}

export async function createTrade(data: Omit<Trade, 'id' | 'pnl' | 'created_at' | 'updated_at'>) {
  const { rows } = await pool.query(
    `INSERT INTO trades (account_id, symbol, side, entry_price, exit_price, quantity, entry_time, exit_time, commission, notes, screenshot_url, tags)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING *`,
    [data.account_id, data.symbol.toUpperCase(), data.side, data.entry_price, data.exit_price,
     data.quantity, data.entry_time, data.exit_time, data.commission ?? 0,
     data.notes ?? null, data.screenshot_url ?? null, data.tags ?? []]
  );
  return rows[0] as Trade;
}

export async function updateTrade(id: string, data: Partial<Omit<Trade, 'id' | 'pnl' | 'created_at' | 'updated_at'>>) {
  const fields = Object.keys(data).filter(k => k !== 'account_id');
  if (fields.length === 0) return getTrade(id);

  const sets = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');
  const values = fields.map(f => (data as Record<string, unknown>)[f]);
  const { rows } = await pool.query(
    `UPDATE trades SET ${sets}, updated_at = NOW() WHERE id = $1 RETURNING *`,
    [id, ...values]
  );
  return rows[0] as Trade | undefined;
}

export async function deleteTrade(id: string) {
  await pool.query('DELETE FROM trades WHERE id = $1', [id]);
}
