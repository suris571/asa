import { Router } from 'express';
import { getWaitCutPage, getWaitCutSplitSet , startProduction ,startWeighing , qcCloseReel,saveRemarkController} from './wait-cut.controller';

const router = Router();

/**
 * 💻 Route สำหรับหน้าจอ (Web Interface)
 * เมื่อพนักงานเข้าลิงก์: GET /wait-cut/
 */
router.get('/', getWaitCutPage);
router.get('/split-cut-set', getWaitCutSplitSet);
router.post('/start-production', startProduction);
router.post('/start-weighing', startWeighing);
router.get('/qc-close-reel', qcCloseReel);
router.post('/qc-close-reel/save-remark', saveRemarkController);

export default router;