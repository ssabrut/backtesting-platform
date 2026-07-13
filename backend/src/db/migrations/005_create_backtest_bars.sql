CREATE TABLE IF NOT EXISTS backtest_bars (
  id         BIGSERIAL PRIMARY KEY,
  run_id     UUID NOT NULL REFERENCES backtest_runs(id) ON DELETE CASCADE,
  timestamp  TIMESTAMPTZ   NOT NULL,
  open       NUMERIC(20,8) NOT NULL,
  high       NUMERIC(20,8) NOT NULL,
  low        NUMERIC(20,8) NOT NULL,
  close      NUMERIC(20,8) NOT NULL,
  volume     NUMERIC(20,8) NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_bt_bars_run ON backtest_bars(run_id, timestamp);
