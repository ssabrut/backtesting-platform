import { Router } from 'express';
import { uploadCsv } from '../middleware/upload';
import * as ctrl from '../controllers/backtestController';
import * as statsCtrl from '../controllers/backtestStatsController';

const router = Router();

router.post('/preview-csv', uploadCsv.single('file'), ctrl.previewCsv);
router.post('/', uploadCsv.single('file'), ctrl.submitBacktest);

router.get('/stats/summary', statsCtrl.summary);
router.get('/stats/daily', statsCtrl.dailyStats);
router.get('/stats/equity-curve', statsCtrl.equityCurve);
router.get('/stats/drawdown', statsCtrl.drawdown);
router.get('/stats/yearly', statsCtrl.yearly);

router.get('/', ctrl.listBacktestRuns);
router.get('/:runId', ctrl.getBacktestRun);
router.get('/:runId/bars', ctrl.getBacktestBars);
router.delete('/:runId', ctrl.deleteBacktestRun);

export default router;
