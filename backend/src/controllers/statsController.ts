import { Request, Response, NextFunction } from 'express';
import * as svc from '../services/statsService';

const getFilter = (req: Request) => ({
  account_id: req.query.account_id as string,
  from: req.query.from as string | undefined,
  to: req.query.to as string | undefined,
});

export async function summary(req: Request, res: Response, next: NextFunction) {
  try { res.json(await svc.getSummary(getFilter(req))); } catch (e) { next(e); }
}

export async function daily(req: Request, res: Response, next: NextFunction) {
  try { res.json(await svc.getDailyStats(getFilter(req))); } catch (e) { next(e); }
}

export async function equityCurve(req: Request, res: Response, next: NextFunction) {
  try { res.json(await svc.getEquityCurve(getFilter(req))); } catch (e) { next(e); }
}

export async function drawdown(req: Request, res: Response, next: NextFunction) {
  try { res.json(await svc.getDrawdown(getFilter(req))); } catch (e) { next(e); }
}

export async function byHour(req: Request, res: Response, next: NextFunction) {
  try { res.json(await svc.getByHour(getFilter(req))); } catch (e) { next(e); }
}

export async function bySymbol(req: Request, res: Response, next: NextFunction) {
  try { res.json(await svc.getBySymbol(getFilter(req))); } catch (e) { next(e); }
}
