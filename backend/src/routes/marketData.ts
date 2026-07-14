import { Router } from 'express';
import * as ctrl from '../controllers/marketDataController';

const router = Router();

router.post('/fetch', ctrl.fetchMarketData);
router.get('/', ctrl.getAvailableSeries);
router.get('/bars', ctrl.getMarketBars);

export default router;
