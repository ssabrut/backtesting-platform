import { Router } from 'express';
import { uploadScreenshot as uploadMiddleware } from '../middleware/upload';
import { uploadScreenshot } from '../controllers/uploadsController';

const router = Router();
router.post('/screenshot', uploadMiddleware.single('file'), uploadScreenshot);

export default router;
