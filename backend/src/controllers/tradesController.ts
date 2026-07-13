import { Request, Response, NextFunction } from 'express';
import * as svc from '../services/tradeService';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await svc.listTrades({ ...req.query as Record<string, string>, account_id: req.query.account_id as string });
    res.json(result);
  } catch (e) { next(e); }
}

export async function get(req: Request, res: Response, next: NextFunction) {
  try {
    const trade = await svc.getTrade(req.params.id);
    if (!trade) return res.status(404).json({ error: 'Not found' });
    res.json(trade);
  } catch (e) { next(e); }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const trade = await svc.createTrade(req.body);
    res.status(201).json(trade);
  } catch (e) { next(e); }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const trade = await svc.updateTrade(req.params.id, req.body);
    if (!trade) return res.status(404).json({ error: 'Not found' });
    res.json(trade);
  } catch (e) { next(e); }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await svc.deleteTrade(req.params.id);
    res.status(204).send();
  } catch (e) { next(e); }
}
