import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { runMigrations } from './db/migrate';

const PORT = parseInt(process.env.PORT ?? '4000', 10);

async function start() {
  await runMigrations();
  app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
