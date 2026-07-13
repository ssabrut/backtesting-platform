CREATE TABLE IF NOT EXISTS uploads (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id  UUID REFERENCES accounts(id) ON DELETE CASCADE,
  filename    VARCHAR(500)  NOT NULL,
  filepath    VARCHAR(1000) NOT NULL,
  mime_type   VARCHAR(100),
  size_bytes  INTEGER,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
