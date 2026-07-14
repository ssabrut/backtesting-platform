CREATE TABLE IF NOT EXISTS market_bars (
  id         BIGSERIAL PRIMARY KEY,
  symbol     VARCHAR(30)   NOT NULL,
  timeframe  VARCHAR(10)   NOT NULL,
  timestamp  TIMESTAMPTZ   NOT NULL,
  open       NUMERIC(20,8) NOT NULL,
  high       NUMERIC(20,8) NOT NULL,
  low        NUMERIC(20,8) NOT NULL,
  close      NUMERIC(20,8) NOT NULL,
  volume     NUMERIC(20,8) NOT NULL DEFAULT 0,
  UNIQUE (symbol, timeframe, timestamp)
);

CREATE INDEX IF NOT EXISTS idx_market_bars_lookup ON market_bars(symbol, timeframe, timestamp);
