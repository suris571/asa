"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startProduction = exports.getWaitCutPage = void 0;
const wait_cut_model_1 = require("./wait-cut.model");
const socket_1 = require("../../socket");
const getWaitCutPage = async (req, res) => {
    try {
        const queueData = await wait_cut_model_1.WaitCutModel.getAllWaitingAndWeighing();
        const statusList = await wait_cut_model_1.WaitCutModel.getAllCutStatuses();
        res.render('wait-cut/index', { orders: queueData, statusList });
    }
    catch (error) {
        console.error('🔴 Controller พังจังหวะเรนเดอร์หน้าเว็บ:', error);
        res.status(500).send('เกิดข้อผิดพลาดในการโหลดหน้าเว็บครับกัปตัน');
    }
};
exports.getWaitCutPage = getWaitCutPage;
const startProduction = async (req, res) => {
    const { orderId, orderDetailId, qty } = req.body;
    // ตรวจสอบความถูกต้องของข้อมูลเบื้องต้น (Validation) ก่อนลงแรงทำงาน
    if (!orderId || !orderDetailId || !qty || isNaN(Number(qty))) {
        return res.status(400).json({ success: false, message: 'ข้อมูลไม่ครบถ้วนหรือจำนวนเซ็ตไม่ถูกต้อง' });
    }
    try {
        console.log(`📡 [Controller] รับคำสั่งเริ่มกระบวนการตัดงาน สำหรับใบงานย่อย ID: ${orderDetailId}`);
        // 🚀 สั่งเรียกใช้งานฟังก์ชัน Model ที่กัปตันย้ายคำสั่งไปจัดเก็บไว้
        await wait_cut_model_1.WaitCutModel.createOrderSplitSet(Number(orderId), Number(orderDetailId), Number(qty));
        // 🔊 ขั้นตอนกระจายข่าว (Broadcast): ตะโกนบอกทุกสถานีเครื่องจักรที่เปิดหน้านี้อยู่ให้วาดตารางใหม่เรียลไทม์
        const io = (0, socket_1.getIO)();
        io.of('/socket/wait-cut').emit('queue_structure_changed', { success: true });
        // ส่งสัญญาณตอบกลับ HTTP สำเร็จให้เครื่องตนเองรับทราบเพื่อปลดล็อกหน้าจอ
        return res.status(200).json({ success: true, message: 'บันทึกคำสั่งและสร้างรายการเซ็ตย่อยสำเร็จ' });
    }
    catch (error) {
        console.error("❌ [Controller Error] ระบบสั่งการติดขัด:", error);
        return res.status(500).json({ success: false, message: error.message || 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
    }
};
exports.startProduction = startProduction;
