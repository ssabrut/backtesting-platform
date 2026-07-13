CREATE TABLE IF NOT EXISTS trades (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id     UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  symbol         VARCHAR(30)   NOT NULL,
  side           VARCHAR(5)    NOT NULL CHECK (side IN ('long', 'short')),
  entry_price    NUMERIC(20,8) NOT NULL,
  exit_price     NUMERIC(20,8) NOT NULL,
  quantity       NUMERIC(20,8) NOT NULL,
  entry_time     TIMESTAMPTZ   NOT NULL,
  exit_time      TIMESTAMPTZ   NOT NULL,
  commission     NUMERIC(10,4) NOT NULL DEFAULT 0,
  notes          TEXT,
  screenshot_url VARCHAR(500),
  pnl            NUMERIC(20,8) GENERATED ALWAYS AS (
    CASE
      WHEN side = 'long'  THEN (exit_price - entry_price) * quantity - commission
      WHEN side = 'short' THEN (entry_price - exit_price) * quantity - commission
    END
  ) STORED,
  tags           TEXT[] NOT NULL DEFAULT '{}',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trades_account_entry ON trades(account_id, entry_time DESC);
CREATE INDEX IF NOT EXISTS idx_trades_symbol ON trades(account_id, symbol);
