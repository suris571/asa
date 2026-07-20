import { Router } from 'express';
import { getWaitCutPage, getWaitCutSplitSet , startProduction ,startWeighing} from './wait-cut.controller';

const router = Router();

/**
 * 💻 Route สำหรับหน้าจอ (Web Interface)
 * เมื่อพนักงานเข้าลิงก์: GET /wait-cut/
 */
router.get('/', getWaitCutPage);
router.get('/split-cut-set', getWaitCutSplitSet);
router.post('/start-production', startProduction);
router.post('/start-weighing', startWeighing);

export default router;