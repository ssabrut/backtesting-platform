import { Request, Response, NextFunction } from 'express';
import { fetchAndStoreBars, isAppTimeframe, listAvailableSeries, listMarketBars } from '../services/marketDataService';

export async function fetchMarketData(req: Request, res: Response, next: NextFunction) {
  try {
    const { symbol, timeframe, start, end } = req.body;
    if (!symbol || !timeframe || !start || !end) {
      return res.status(400).json({ error: 'symbol, timeframe, start, end are required' });
    }
    if (!isAppTimeframe(timeframe)) {
      return res.status(400).json({ error: `Unsupported timeframe '${timeframe}', expected one of M1, M15, H1, H4, D1` });
    }

    const startDate = new Date(start);
    const endDate = new Date(end);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({ error: 'start/end must be valid dates' });
    }

    const result = await fetchAndStoreBars(symbol, timeframe, startDate, endDate);
    res.json({ symbol, timeframe, ...result });
  } catch (e) {
    if (e instanceof Error && e.message.startsWith('No data returned')) {
      return res.status(400).json({ error: e.message });
    }
    if (e instanceof TypeError && e.message === 'fetch failed') {
      return res.status(502).json({ error: 'Could not reach Dukascopy data feed. Check network connectivity and try again.' });
    }
    next(e);
  }
}

export async function getAvailableSeries(req: Request, res: Response, next: NextFunction) {
  try {
    const series = await listAvailableSeries();
    res.json(series);
  } catch (e) { next(e); }
}

export async function getMarketBars(req: Request, res: Response, next: NextFunction) {
  try {
    const { symbol, timeframe, start, end } = req.query;
    if (!symbol || !timeframe) {
      return res.status(400).json({ error: 'symbol and timeframe query params are required' });
    }
    const bars = await listMarketBars(
      String(symbol),
      String(timeframe),
      start ? new Date(String(start)) : undefined,
      end ? new Date(String(end)) : undefined,
    );
    res.json(bars);
  } catch (e) { next(e); }
}
