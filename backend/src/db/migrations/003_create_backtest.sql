CREATE TABLE IF NOT EXISTS backtest_runs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id    UUID REFERENCES accounts(id) ON DELETE SET NULL,
  name          VARCHAR(200) NOT NULL,
  symbol        VARCHAR(30),
  timeframe     VARCHAR(20),
  rules         JSONB        NOT NULL,
  csv_filename  VARCHAR(500),
  stats         JSONB,
  status        VARCHAR(20)  NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'running', 'complete', 'error')),
  error_message TEXT,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  completed_at  TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS backtest_trades (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id       UUID NOT NULL REFERENCES backtest_runs(id) ON DELETE CASCADE,
  symbol       VARCHAR(30)   NOT NULL,
  side         VARCHAR(5)    NOT NULL CHECK (side IN ('long', 'short')),
  entry_time   TIMESTAMPTZ   NOT NULL,
  exit_time    TIMESTAMPTZ   NOT NULL,
  entry_price  NUMERIC(20,8) NOT NULL,
  exit_price   NUMERIC(20,8) NOT NULL,
  quantity     NUMERIC(20,8) NOT NULL DEFAULT 1,
  pnl          NUMERIC(20,8) NOT NULL,
  entry_reason JSONB,
  exit_reason  JSONB
);

CREATE INDEX IF NOT EXISTS idx_bt_trades_run ON backtest_trades(run_id, entry_time);
