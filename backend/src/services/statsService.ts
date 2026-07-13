import { pool } from '../config/db';

export interface StatsFilter {
  account_id: string;
  from?: string;
  to?: string;
}

export async function getSummary(filter: StatsFilter) {
  const { account_id, from = '1970-01-01', to = '2099-01-01' } = filter;
  const { rows } = await pool.query(
    `SELECT
      COUNT(*)::int                                                AS total_trades,
      COUNT(*) FILTER (WHERE pnl > 0)::int                        AS win_count,
      COUNT(*) FILTER (WHERE pnl < 0)::int                        AS loss_count,
      COALESCE(SUM(pnl), 0)::float                                AS net_pnl,
      COALESCE(AVG(pnl) FILTER (WHERE pnl > 0), 0)::float         AS avg_win,
      COALESCE(AVG(pnl) FILTER (WHERE pnl < 0), 0)::float         AS avg_loss,
      COALESCE(SUM(pnl) FILTER (WHERE pnl > 0), 0)::float         AS gross_profit,
      COALESCE(ABS(SUM(pnl) FILTER (WHERE pnl < 0)), 0)::float    AS gross_loss
    FROM trades
    WHERE account_id = $1 AND entry_time BETWEEN $2 AND $3`,
    [account_id, from, to]
  );
  const r = rows[0];

  const profit_factor = r.gross_loss > 0 ? r.gross_profit / r.gross_loss : r.gross_profit > 0 ? 999 : 0;
  const win_rate = r.total_trades > 0 ? r.win_count / r.total_trades : 0;

  // day win rate
  const dayResult = await pool.query(
    `SELECT
      COUNT(*) FILTER (WHERE daily_pnl > 0)::float AS win_days,
      COUNT(*)::float AS total_days
    FROM (
      SELECT DATE(entry_time) AS d, SUM(pnl) AS daily_pnl
      FROM trades
      WHERE account_id = $1 AND entry_time BETWEEN $2 AND $3
      GROUP BY 1
    ) sub`,
    [account_id, from, to]
  );
  const dr = dayResult.rows[0];
  const day_win_rate = dr.total_days > 0 ? dr.win_days / dr.total_days : 0;

  return {
    net_pnl: r.net_pnl,
    win_rate,
    profit_factor,
    total_trades: r.total_trades,
    avg_win: r.avg_win,
    avg_loss: r.avg_loss,
    day_win_rate,
    gross_profit: r.gross_profit,
    gross_loss: r.gross_loss,
  };
}

export async function getDailyStats(filter: StatsFilter) {
  const { account_id, from = '1970-01-01', to = '2099-01-01' } = filter;
  const { rows } = await pool.query(
    `SELECT
      DATE(entry_time AT TIME ZONE 'UTC')::text AS date,
      SUM(pnl)::float                           AS pnl,
      COUNT(*)::int                             AS trade_count,
      COUNT(*) FILTER (WHERE pnl > 0)::int      AS wins,
      COUNT(*) FILTER (WHERE pnl < 0)::int      AS losses
    FROM trades
    WHERE account_id = $1 AND entry_time BETWEEN $2 AND $3
    GROUP BY 1
    ORDER BY 1`,
    [account_id, from, to]
  );
  return rows;
}

export async function getEquityCurve(filter: StatsFilter) {
  const { account_id, from = '1970-01-01', to = '2099-01-01' } = filter;
  const { rows } = await pool.query(
    `SELECT
      entry_time::text AS time,
      pnl::float,
      SUM(pnl) OVER (ORDER BY entry_time ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)::float AS cumulative_pnl
    FROM trades
    WHERE account_id = $1 AND entry_time BETWEEN $2 AND $3
    ORDER BY entry_time`,
    [account_id, from, to]
  );
  return rows;
}

export async function getDrawdown(filter: StatsFilter) {
  const curve = await getEquityCurve(filter);
  let peak = 0;
  return curve.map(row => {
    const val = row.cumulative_pnl as number;
    if (val > peak) peak = val;
    const drawdown = peak > 0 ? ((val - peak) / peak) * 100 : 0;
    return { time: row.time, drawdown: Math.min(drawdown, 0) };
  });
}

export async function getByHour(filter: StatsFilter) {
  const { account_id, from = '1970-01-01', to = '2099-01-01' } = filter;
  const { rows } = await pool.query(
    `SELECT
      EXTRACT(DOW FROM entry_time AT TIME ZONE 'UTC')::int  AS day_of_week,
      EXTRACT(HOUR FROM entry_time AT TIME ZONE 'UTC')::int AS hour,
      SUM(pnl)::float                                       AS pnl,
      COUNT(*)::int                                         AS trade_count,
      COUNT(*) FILTER (WHERE pnl > 0)::int                  AS wins
    FROM trades
    WHERE account_id = $1 AND entry_time BETWEEN $2 AND $3
    GROUP BY 1, 2
    ORDER BY 1, 2`,
    [account_id, from, to]
  );
  return rows;
}

export async function getBySymbol(filter: StatsFilter) {
  const { account_id, from = '1970-01-01', to = '2099-01-01' } = filter;
  const { rows } = await pool.query(
    `SELECT
      symbol,
      COUNT(*)::int                             AS total_trades,
      SUM(pnl)::float                           AS net_pnl,
      COUNT(*) FILTER (WHERE pnl > 0)::int      AS wins,
      AVG(pnl)::float                           AS avg_pnl
    FROM trades
    WHERE account_id = $1 AND entry_time BETWEEN $2 AND $3
    GROUP BY symbol
    ORDER BY net_pnl DESC`,
    [account_id, from, to]
  );
  return rows;
}
