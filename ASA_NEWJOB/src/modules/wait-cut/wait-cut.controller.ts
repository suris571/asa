import { Request, Response } from 'express';
import { WaitCutModel } from './wait-cut.model';
import { getIO } from '../../socket';

export const getWaitCutPage = async (req: Request, res: Response) => {
    try {
      const queueData = await WaitCutModel.getAllWaitingAndWeighing();
      const statusList = await WaitCutModel.getAllCutStatuses();
      res.render('wait-cut/index', { orders: queueData,statusList});
    } catch (error) {
      console.error('🔴 Controller พังจังหวะเรนเดอร์หน้าเว็บ:', error);
      res.status(500).send('เกิดข้อผิดพลาดในการโหลดหน้าเว็บครับกัปตัน');
    }
};

export const getWaitCutSplitSet = async (req: Request, res: Response) => {
    try {
      const queueData = await WaitCutModel.getSplitSetQueueData();
      const statusList = await WaitCutModel.getAllCutStatuses();
      res.render('wait-cut/index_splite_cut', { orders: queueData,statusList});
    } catch (error) {
      console.error('🔴 Controller พังจังหวะเรนเดอร์หน้าเว็บ:', error);
      res.status(500).send('เกิดข้อผิดพลาดในการโหลดหน้าเว็บครับกัปตัน');
    }
};

export const startProduction = async (req: Request, res: Response) => {
    const { orderId, orderDetailId, qty } = req.body;
    // ตรวจสอบความถูกต้องของข้อมูลเบื้องต้น (Validation) ก่อนลงแรงทำงาน
    if (!orderId || !orderDetailId || !qty || isNaN(Number(qty))) {
        return res.status(400).json({ success: false, message: 'ข้อมูลไม่ครบถ้วนหรือจำนวนเซ็ตไม่ถูกต้อง' });
    }

    try {
        console.log(`📡 [Controller] รับคำสั่งเริ่มกระบวนการตัดงาน สำหรับใบงานย่อย ID: ${orderDetailId}`);

        // 🚀 สั่งเรียกใช้งานฟังก์ชัน Model ที่กัปตันย้ายคำสั่งไปจัดเก็บไว้
        await WaitCutModel.createOrderSplitSet(Number(orderId), Number(orderDetailId), Number(qty));

        // 🔊 ขั้นตอนกระจายข่าว (Broadcast): ตะโกนบอกทุกสถานีเครื่องจักรที่เปิดหน้านี้อยู่ให้วาดตารางใหม่เรียลไทม์
        const io = getIO();
        io.of('/socket/wait-cut').emit('queue_structure_changed', { success: true });

        // ส่งสัญญาณตอบกลับ HTTP สำเร็จให้เครื่องตนเองรับทราบเพื่อปลดล็อกหน้าจอ
        return res.status(200).json({ success: true, message: 'บันทึกคำสั่งและสร้างรายการเซ็ตย่อยสำเร็จ' });

    } catch (error: any) {
        console.error("❌ [Controller Error] ระบบสั่งการติดขัด:", error);
        return res.status(500).json({ success: false, message: error.message || 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
    }
};

export const startWeighing = async (req: Request, res: Response) => {
    const { split_set_id, pl_order_id, pl_order_detail_id } = req.body;
    // ตรวจสอบความถูกต้องของข้อมูลเบื้องต้น (Validation) ก่อนลงแรงทำงาน
    if (!split_set_id || !pl_order_id || !pl_order_detail_id) {
        return res.status(400).json({ success: false, message: 'ข้อมูลไม่ครบถ้วนหรือจำนวนเซ็ตไม่ถูกต้อง' });
    }

    try {
        console.log(`📡 [Controller] รับคำสั่งเริ่มกระบวนการตัดงาน สำหรับใบงานย่อย ID: ${split_set_id}`);

        // 🚀 สั่งเรียกใช้งานฟังก์ชัน Model ที่กัปตันย้ายคำสั่งไปจัดเก็บไว้
        await WaitCutModel.createOrderWeighing(Number(split_set_id), Number(pl_order_id), Number(pl_order_detail_id));
        return res.status(200).json({ success: true, message: 'บันทึกคำสั่งและสร้างรายการเซ็ตย่อยสำเร็จ' });

    } catch (error: any) {
        console.error("❌ [Controller Error] ระบบสั่งการติดขัด:", error);
        return res.status(500).json({ success: false, message: error.message || 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
    }
};