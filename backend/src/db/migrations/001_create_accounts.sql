CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS accounts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(100) NOT NULL,
  currency   VARCHAR(10)  NOT NULL DEFAULT 'USD',
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

INSERT INTO accounts (name, currency)
SELECT 'Default Account', 'USD'
WHERE NOT EXISTS (SELECT 1 FROM accounts LIMIT 1);
