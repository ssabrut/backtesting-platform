import { pool } from '../config/db';

export interface BacktestStatsFilter {
  account_id?: string;
  run_id?: string;
  from?: string;
  to?: string;
}

export async function getSummary(filter: BacktestStatsFilter) {
  const { account_id = null, run_id = null, from = '1970-01-01', to = '2099-01-01' } = filter;
  const { rows } = await pool.query(
    `SELECT
      COUNT(*)::int                                                AS total_trades,
      COUNT(*) FILTER (WHERE bt.pnl > 0)::int                     AS win_count,
      COUNT(*) FILTER (WHERE bt.pnl < 0)::int                     AS loss_count,
      COALESCE(SUM(bt.pnl), 0)::float                             AS net_pnl,
      COALESCE(AVG(bt.pnl) FILTER (WHERE bt.pnl > 0), 0)::float   AS avg_win,
      COALESCE(AVG(bt.pnl) FILTER (WHERE bt.pnl < 0), 0)::float   AS avg_loss,
      COALESCE(SUM(bt.pnl) FILTER (WHERE bt.pnl > 0), 0)::float   AS gross_profit,
      COALESCE(ABS(SUM(bt.pnl) FILTER (WHERE bt.pnl < 0)), 0)::float AS gross_loss
    FROM backtest_trades bt
    JOIN backtest_runs br ON bt.run_id = br.id
    WHERE ($1::uuid IS NULL OR br.account_id = $1)
      AND ($2::uuid IS NULL OR bt.run_id = $2)
      AND bt.entry_time BETWEEN $3 AND $4`,
    [account_id, run_id, from, to]
  );
  const r = rows[0];

  const profit_factor = r.gross_loss > 0 ? r.gross_profit / r.gross_loss : r.gross_profit > 0 ? 999 : 0;
  const win_rate = r.total_trades > 0 ? r.win_count / r.total_trades : 0;

  const dayResult = await pool.query(
    `SELECT
      COUNT(*) FILTER (WHERE daily_pnl > 0)::float AS win_days,
      COUNT(*)::float AS total_days
    FROM (
      SELECT DATE(bt.entry_time) AS d, SUM(bt.pnl) AS daily_pnl
      FROM backtest_trades bt
      JOIN backtest_runs br ON bt.run_id = br.id
      WHERE ($1::uuid IS NULL OR br.account_id = $1)
        AND ($2::uuid IS NULL OR bt.run_id = $2)
        AND bt.entry_time BETWEEN $3 AND $4
      GROUP BY 1
    ) sub`,
    [account_id, run_id, from, to]
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

export async function getDailyStats(filter: BacktestStatsFilter) {
  const { account_id = null, run_id = null, from = '1970-01-01', to = '2099-01-01' } = filter;
  const { rows } = await pool.query(
    `SELECT
      DATE(bt.entry_time AT TIME ZONE 'UTC')::text AS date,
      SUM(bt.pnl)::float                           AS pnl,
      COUNT(*)::int                                AS trade_count,
      COUNT(*) FILTER (WHERE bt.pnl > 0)::int      AS wins,
      COUNT(*) FILTER (WHERE bt.pnl < 0)::int      AS losses
    FROM backtest_trades bt
    JOIN backtest_runs br ON bt.run_id = br.id
    WHERE ($1::uuid IS NULL OR br.account_id = $1)
      AND ($2::uuid IS NULL OR bt.run_id = $2)
      AND bt.entry_time BETWEEN $3 AND $4
    GROUP BY 1
    ORDER BY 1`,
    [account_id, run_id, from, to]
  );
  return rows;
}

export async function getEquityCurve(filter: BacktestStatsFilter) {
  const { account_id = null, run_id = null, from = '1970-01-01', to = '2099-01-01' } = filter;
  const { rows } = await pool.query(
    `SELECT
      bt.entry_time::text AS time,
      bt.pnl::float,
      SUM(bt.pnl) OVER (ORDER BY bt.entry_time ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)::float AS cumulative_pnl
    FROM backtest_trades bt
    JOIN backtest_runs br ON bt.run_id = br.id
    WHERE ($1::uuid IS NULL OR br.account_id = $1)
      AND ($2::uuid IS NULL OR bt.run_id = $2)
      AND bt.entry_time BETWEEN $3 AND $4
    ORDER BY bt.entry_time`,
    [account_id, run_id, from, to]
  );
  return rows;
}

export async function getDrawdown(filter: BacktestStatsFilter) {
  const curve = await getEquityCurve(filter);
  let peak = 0;
  return curve.map(row => {
    const val = row.cumulative_pnl as number;
    if (val > peak) peak = val;
    const drawdown = peak > 0 ? ((val - peak) / peak) * 100 : 0;
    return { time: row.time, drawdown: Math.min(drawdown, 0) };
  });
}
