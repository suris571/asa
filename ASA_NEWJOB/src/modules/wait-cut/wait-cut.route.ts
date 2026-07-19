import { Router } from 'express';
import { getWaitCutPage, startProduction } from './wait-cut.controller';

const router = Router();

/**
 * 💻 Route สำหรับหน้าจอ (Web Interface)
 * เมื่อพนักงานเข้าลิงก์: GET /wait-cut/
 */
router.get('/', getWaitCutPage);

/**
 * 📡 Route สำหรับ API สั่งตัดแยกเซ็ต (Action Endpoint)
 * เมื่อหน้าบ้านยิงคำสั่ง: POST /wait-cut/start-production
 * 🎯 แก้ไข: เปลี่ยนจาก .get เป็น .post และลบช่องว่าง (Space) ท้าย String ออกเรียบร้อย
 */
router.post('/start-production', startProduction);

export default router;