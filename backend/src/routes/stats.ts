import { Router } from 'express';
import * as ctrl from '../controllers/statsController';

const router = Router();

router.get('/summary', ctrl.summary);
router.get('/daily', ctrl.daily);
router.get('/equity-curve', ctrl.equityCurve);
router.get('/drawdown', ctrl.drawdown);
router.get('/by-hour', ctrl.byHour);
router.get('/by-symbol', ctrl.bySymbol);

export default router;
