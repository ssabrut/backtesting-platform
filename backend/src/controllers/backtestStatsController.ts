import { Request, Response, NextFunction } from 'express';
import * as svc from '../services/backtestStatsService';

const getFilter = (req: Request) => ({
  account_id: (req.query.account_id as string) || undefined,
  run_id: (req.query.run_id as string) || undefined,
  from: req.query.from as string | undefined,
  to: req.query.to as string | undefined,
});

export async function summary(req: Request, res: Response, next: NextFunction) {
  try { res.json(await svc.getSummary(getFilter(req))); } catch (e) { next(e); }
}

export async function dailyStats(req: Request, res: Response, next: NextFunction) {
  try { res.json(await svc.getDailyStats(getFilter(req))); } catch (e) { next(e); }
}

export async function equityCurve(req: Request, res: Response, next: NextFunction) {
  try { res.json(await svc.getEquityCurve(getFilter(req))); } catch (e) { next(e); }
}

export async function drawdown(req: Request, res: Response, next: NextFunction) {
  try { res.json(await svc.getDrawdown(getFilter(req))); } catch (e) { next(e); }
}

export async function yearly(req: Request, res: Response, next: NextFunction) {
  try {
    const year = parseInt(req.query.year as string, 10) || new Date().getFullYear();
    const from = `${year}-01-01`;
    const to = `${year + 1}-01-01`;
    res.json(await svc.getDailyStats({ ...getFilter(req), from, to }));
  } catch (e) { next(e); }
}
