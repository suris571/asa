import { Request, Response, Router } from 'express';

import { getWeighingPage , saveWeighingController , fetchweighinglist } from './weighing.controller';
import { requirePermission } from '../../middleware/auth-middleware.js';

const router = Router();

// วิ่งเข้าสเปกหน้าหลักการชั่งน้ำหนัก
router.get('/', requirePermission(16804), getWeighingPage);

router.post('/save', requirePermission(16804), saveWeighingController);
router.get('/fetch-sub-rolls', requirePermission(16804), fetchweighinglist);

export default router;