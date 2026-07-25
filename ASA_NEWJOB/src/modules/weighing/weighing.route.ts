import { Request, Response, Router } from 'express';

import { getWeighingPage , saveWeighingController , fetchweighinglist } from './weighing.controller';

const router = Router();

// วิ่งเข้าสเปกหน้าหลักการชั่งน้ำหนัก
router.get('/', getWeighingPage);

router.post('/save', saveWeighingController);
router.get('/fetch-sub-rolls', fetchweighinglist);

export default router;