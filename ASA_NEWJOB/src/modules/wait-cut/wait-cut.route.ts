import { Router } from 'express';
import { getWaitCutPage, getWaitCutSplitSet , startProduction ,startWeighing , qcCloseReel,saveRemarkController,getQcReelListController,
    saveQcCloseReelController,swapSplitSetSize,closeReel
} from './wait-cut.controller';
import { requirePermission } from '../../middleware/auth-middleware.js';

const router = Router();

/**
 * 💻 Route สำหรับหน้าจอ (Web Interface)
 * เมื่อพนักงานเข้าลิงก์: GET /wait-cut/
 */
router.get('/',requirePermission(16801),getWaitCutPage);


router.get('/split-cut-set',requirePermission(16802), getWaitCutSplitSet);
router.post('/start-production', requirePermission(16802), startProduction);
router.post('/swap-split-set-size', requirePermission(16802), swapSplitSetSize);
router.post('/start-weighing', requirePermission(16802), startWeighing);


router.get('/qc-close-reel', requirePermission(16803), qcCloseReel);
router.post('/close-reel', requirePermission(16803), closeReel);
router.post('/qc-close-reel/save-remark', requirePermission(16803), saveRemarkController);
router.get('/qc-close-reel/getModal-reel', requirePermission(16803), getQcReelListController);
router.post('/qc-close-reel/save-reel', requirePermission(16803), saveQcCloseReelController);

export default router;