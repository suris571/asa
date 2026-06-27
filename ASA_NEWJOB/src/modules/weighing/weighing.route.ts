import { Request, Response, Router } from 'express';

import { getWeighingPage } from './weighing.controller';

const router = Router();

// วิ่งเข้าสเปกหน้าหลักการชั่งน้ำหนัก
router.get('/', getWeighingPage);

router.get('/api/fetch-sub-rolls', async (req: Request, res: Response) => {
    try {
        // 1. แกะเลขใบสั่งผลิตที่หน้าบ้านส่งมาพร้อมกับ URL
        const orderNo = req.query.order_no as string;

        console.log(`🔍 [Backend API]: มีการร้องขอข้อมูลลูกม้วนย่อยของใบสั่งผลิตเลขที่: ${orderNo}`);

        // ตรวจสอบความปลอดภัยเบื้องต้น
        if (!orderNo) {
            return res.status(400).json({ 
                success: false, 
                message: 'กรุณาระบุเลขใบสั่งผลิต (order_no)' 
            });
        }

        // 💡 [สเปกวันเสาร์]: ตรงนี้เราจะเขียน SQL ไป SELECT ข้อมูลจริงจากฐานข้อมูล Oracle
        // ตัวอย่างตรรกะ: SELECT * FROM production_rolls WHERE order_no = :orderNo AND status = 'WAIT_WEIGH'
        
        // 🎁 [ขัดตาทัพคืนนี้]: จำลองข้อมูลชุด Happy Path (ม้วนเล็ก 6 ม้วนใน Set) ส่งกลับไปให้หน้าบ้านเทสก่อน
        const mockSubRolls = [
            { roll_no: `${orderNo}-01`, rell_no: '01', order_no: orderNo, grade: 'KA185', version: 'รุ่น A', size: '72 นิ้ว', diameter: 1200, status: 'รอชั่งน้ำหนัก' },
            { roll_no: `${orderNo}-02`, rell_no: '02', order_no: orderNo, grade: 'KA185', version: 'รุ่น A', size: '72 นิ้ว', diameter: 1200, status: 'รอชั่งน้ำหนัก' },
            { roll_no: `${orderNo}-03`, rell_no: '03', order_no: orderNo, grade: 'KA185', version: 'รุ่น A', size: '72 นิ้ว', diameter: 1200, status: 'รอชั่งน้ำหนัก' },
            { roll_no: `${orderNo}-04`, rell_no: '04', order_no: orderNo, grade: 'KA185', version: 'รุ่น A', size: '72 นิ้ว', diameter: 1200, status: 'รอชั่งน้ำหนัก' },
            { roll_no: `${orderNo}-05`, rell_no: '05', order_no: orderNo, grade: 'KA185', version: 'รุ่น A', size: '72 นิ้ว', diameter: 1200, status: 'รอชั่งน้ำหนัก' },
            { roll_no: `${orderNo}-06`, rell_no: '06', order_no: orderNo, grade: 'KA185', version: 'รุ่น A', size: '72 นิ้ว', diameter: 1200, status: 'รอชั่งน้ำหนัก' }
        ];

        // 🚀 ยิงข้อมูลกลับไปให้หน้าบ้านในรูปแบบ JSON สากล
        return res.json({
            success: true,
            message: 'ดึงข้อมูลลูกม้วนย่อยสำเร็จ',
            data: mockSubRolls
        });

    } catch (error) {
        console.error('❌ [Backend Error] พังที่ API fetch-sub-rolls:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์หลังบ้าน' 
        });
    }
});

export default router;