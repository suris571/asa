import { Router } from 'express';
import { getWaitCutPage } from './wait-cut.controller';

const router = Router();

// เมื่อพนักงานเข้าเว็บลิงก์ /wait-cut จะวิ่งไปหาคอนโทรลเลอร์ด้านบน
router.get('/', getWaitCutPage);

export default router;