import { Router } from 'express';
import * as ctrl from '../controllers/tradesController';

const router = Router();

router.get('/', ctrl.list);
router.post('/', ctrl.create);
router.get('/:id', ctrl.get);
router.patch('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

export default router;
