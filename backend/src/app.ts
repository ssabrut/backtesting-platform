import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';

import tradesRouter from './routes/trades';
import statsRouter from './routes/stats';
import uploadsRouter from './routes/uploads';
import backtestRouter from './routes/backtest';
import accountsRouter from './routes/accounts';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));

const uploadsDir = process.env.UPLOADS_DIR || path.join(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadsDir));

app.use('/api/accounts', accountsRouter);
app.use('/api/trades', tradesRouter);
app.use('/api/stats', statsRouter);
app.use('/api/uploads', uploadsRouter);
app.use('/api/backtest', backtestRouter);

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use(errorHandler);

export default app;
