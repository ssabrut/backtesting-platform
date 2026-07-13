import { Router } from 'express';
import { uploadCsv } from '../middleware/upload';
import * as ctrl from '../controllers/backtestController';

const router = Router();

router.post('/preview-csv', uploadCsv.single('file'), ctrl.previewCsv);
router.post('/', uploadCsv.single('file'), ctrl.submitBacktest);
router.get('/', ctrl.listBacktestRuns);
router.get('/:runId', ctrl.getBacktestRun);
router.get('/:runId/bars', ctrl.getBacktestBars);
router.delete('/:runId', ctrl.deleteBacktestRun);

export default router;
