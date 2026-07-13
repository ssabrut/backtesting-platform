import fs from 'fs';
import path from 'path';
import { pool } from '../config/db';

export async function runMigrations() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

    for (const file of files) {
      const { rows } = await client.query(
        'SELECT 1 FROM schema_migrations WHERE filename = $1',
        [file]
      );
      if (rows.length > 0) continue;

      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
      console.log(`Running migration: ${file}`);
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
      console.log(`Migration applied: ${file}`);
    }
  } finally {
    client.release();
  }
}
