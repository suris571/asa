import { Router } from 'express';
import { getWaitCutPage, getWaitCutSplitSet , startProduction ,startWeighing , qcCloseReel,saveRemarkController,getQcReelListController,
    saveQcCloseReelController,swapSplitSetSize,closeReel
} from './wait-cut.controller';

const router = Router();

/**
 * 💻 Route สำหรับหน้าจอ (Web Interface)
 * เมื่อพนักงานเข้าลิงก์: GET /wait-cut/
 */
router.get('/', getWaitCutPage);
router.get('/split-cut-set', getWaitCutSplitSet);
router.post('/start-production', startProduction);
router.post('/swap-split-set-size', swapSplitSetSize);
router.post('/start-weighing', startWeighing);
router.get('/qc-close-reel', qcCloseReel);
router.post('/close-reel', closeReel);
router.post('/qc-close-reel/save-remark', saveRemarkController);
router.get('/qc-close-reel/getModal-reel', getQcReelListController);
router.post('/qc-close-reel/save-reel', saveQcCloseReelController);

export default router;