"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveQcCloseReelController = exports.getQcReelListController = exports.saveRemarkController = exports.qcCloseReel = exports.startWeighing = exports.startProduction = exports.getWaitCutSplitSet = exports.getWaitCutPage = void 0;
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
const getWaitCutSplitSet = async (req, res) => {
    try {
        const queueData = await wait_cut_model_1.WaitCutModel.getSplitSetQueueData();
        const statusList = await wait_cut_model_1.WaitCutModel.getAllCutStatuses();
        res.render('wait-cut/index_splite_cut', { orders: queueData, statusList });
    }
    catch (error) {
        console.error('🔴 Controller พังจังหวะเรนเดอร์หน้าเว็บ:', error);
        res.status(500).send('เกิดข้อผิดพลาดในการโหลดหน้าเว็บครับกัปตัน');
    }
};
exports.getWaitCutSplitSet = getWaitCutSplitSet;
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
const startWeighing = async (req, res) => {
    const { split_set_id, pl_order_id, pl_order_detail_id, type } = req.body;
    if (type == "hold") {
        console.log(type);
        return;
    }
    else if (type == "reset") {
        try {
            let data = await wait_cut_model_1.WaitCutModel.ResetCutSlitSet(Number(split_set_id), Number(pl_order_id), Number(pl_order_detail_id));
            const io = (0, socket_1.getIO)();
            io.of('/socket/wait-cut/split-cut-set').emit('queue_structure_changed', { success: true });
            await (0, socket_1.FnNextRoll)();
            return res.status(200).json({ success: data, message: 'บันทึกคำสั่งและสร้างรายการเซ็ตย่อยสำเร็จ' });
        }
        catch (error) {
            console.error("❌ [Controller Error] ระบบสั่งการติดขัด:", error);
            return res.status(500).json({ success: false, message: error.message || 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
        }
        return;
    }
    // ตรวจสอบความถูกต้องของข้อมูลเบื้องต้น (Validation) ก่อนลงแรงทำงาน
    if (!split_set_id || !pl_order_id || !pl_order_detail_id) {
        return res.status(400).json({ success: false, message: 'ข้อมูลไม่ครบถ้วนหรือจำนวนเซ็ตไม่ถูกต้อง' });
    }
    try {
        console.log(`📡 [Controller] รับคำสั่งเริ่มกระบวนการตัดงาน สำหรับใบงานย่อย ID: ${split_set_id}`);
        // 🚀 สั่งเรียกใช้งานฟังก์ชัน Model ที่กัปตันย้ายคำสั่งไปจัดเก็บไว้
        await wait_cut_model_1.WaitCutModel.createOrderWeighing(Number(split_set_id), Number(pl_order_id), Number(pl_order_detail_id));
        const io = (0, socket_1.getIO)();
        io.of('/socket/wait-cut/split-cut-set').emit('queue_structure_changed', { success: true });
        await (0, socket_1.FnNextRoll)();
        return res.status(200).json({ success: true, message: 'บันทึกคำสั่งและสร้างรายการเซ็ตย่อยสำเร็จ' });
    }
    catch (error) {
        console.error("❌ [Controller Error] ระบบสั่งการติดขัด:", error);
        return res.status(500).json({ success: false, message: error.message || 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
    }
};
exports.startWeighing = startWeighing;
const qcCloseReel = async (req, res) => {
    try {
        const queueData = await wait_cut_model_1.WaitCutModel.getQcCloseReel();
        res.render('wait-cut/index_qc_close_reel', { orders: queueData });
    }
    catch (error) {
        console.error('🔴 Controller พังจังหวะเรนเดอร์หน้าเว็บ:', error);
        res.status(500).send('เกิดข้อผิดพลาดในการโหลดหน้าเว็บครับกัปตัน');
    }
};
exports.qcCloseReel = qcCloseReel;
const saveRemarkController = async (req, res) => {
    try {
        // รับค่า items ที่เป็น Array [{ id: 101, remark: '...' }, ...] จาก req.body
        const { items } = req.body;
        // 🛡️ Validation ตรวจสอบความถูกต้องของ Payload
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "ไม่พบรายการข้อมูลที่ส่งมาบันทึก"
            });
        }
        // 🎯 กรองเฉพาะรายการที่มี id ส่งมาจริง
        const validItems = items.filter(item => item.id !== undefined && item.id !== null);
        if (validItems.length === 0) {
            return res.status(400).json({
                success: false,
                message: "รูปแบบข้อมูลไม่ถูกต้อง (ไม่พบ ID)"
            });
        }
        // 🎯 เรียก Model สั่งบันทึกลงตาราง pl_cut_split_set
        const isSuccess = await wait_cut_model_1.WaitCutModel.saveRemarks(validItems);
        if (isSuccess) {
            return res.json({
                success: true,
                message: `บันทึกหมายเหตุสำเร็จเรียบร้อย (${validItems.length} รายการ)`
            });
        }
        else {
            return res.status(400).json({
                success: false,
                message: "ไม่สามารถอัปเดตข้อมูลลงตาราง pl_cut_split_set ได้"
            });
        }
    }
    catch (error) {
        console.error("❌ เกิดข้อผิดพลาดใน Controller [saveRemarkController]:", error);
        return res.status(500).json({
            success: false,
            message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์",
            error: error.message
        });
    }
};
exports.saveRemarkController = saveRemarkController;
const getQcReelListController = async (req, res) => {
    try {
        const search = req.query.search ? String(req.query.search).trim() : '%';
        const data = await wait_cut_model_1.WaitCutModel.getReelList(search);
        return res.json({
            success: true,
            data: data
        });
    }
    catch (error) {
        console.error("❌ Controller Error [getQcReelListController]:", error);
        return res.status(500).json({
            success: false,
            message: "เกิดข้อผิดพลาดในการดึงข้อมูลรายการ Reel",
            error: error.message
        });
    }
};
exports.getQcReelListController = getQcReelListController;
const saveQcCloseReelController = async (req, res) => {
    try {
        const { splitSetId, reelId } = req.body;
        // ตรวจสอบค่าที่ส่งมา
        if (!splitSetId || !reelId) {
            return res.status(400).json({
                success: false,
                message: "ข้อมูลไม่ครบถ้วน กรุณาระบุ splitSetId และ reelId"
            });
        }
        // ยิงไปอัปเดต REEL_ID
        const result = await wait_cut_model_1.WaitCutModel.updateCloseReel(splitSetId, reelId);
        await (0, socket_1.FnNextQcCloseReel)();
        if (result.rowsAffected && result.rowsAffected > 0) {
            return res.json({
                success: true,
                message: "บันทึก REEL_ID เรียบร้อยแล้ว",
                data: {
                    splitSetId: splitSetId,
                    reelId: reelId
                }
            });
        }
        else {
            return res.status(404).json({
                success: false,
                message: `ไม่พบรายการ PL_CUT_SPLIT_SET ที่มี ID: ${splitSetId}`
            });
        }
    }
    catch (error) {
        console.error("❌ Controller Error [saveQcCloseReelController]:", error);
        return res.status(500).json({
            success: false,
            message: "เกิดข้อผิดพลาดในการบันทึกข้อมูล",
            error: error.message
        });
    }
};
exports.saveQcCloseReelController = saveQcCloseReelController;
