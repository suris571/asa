"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeReel = exports.swapSplitSetSize = exports.saveQcCloseReelController = exports.getQcReelListController = exports.saveRemarkController = exports.qcCloseReel = exports.startWeighing = exports.startProduction = exports.getWaitCutSplitSet = exports.getWaitCutPage = void 0;
const wait_cut_model_1 = require("./wait-cut.model");
const socket_1 = require("../../socket");
const getWaitCutPage = async (req, res) => {
    try {
        const productionLineId = req.session.user?.productionLineId;
        const queueData = await wait_cut_model_1.WaitCutModel.getAllWaitingAndWeighing(null, null, null, null, null, productionLineId);
        const statusList = await wait_cut_model_1.WaitCutModel.getAllCutStatuses();
        res.render("wait-cut/index", { orders: queueData, statusList });
    }
    catch (error) {
        console.error("🔴 Controller พังจังหวะเรนเดอร์หน้าเว็บ:", error);
        res.status(500).send("เกิดข้อผิดพลาดในการโหลดหน้าเว็บครับกัปตัน");
    }
};
exports.getWaitCutPage = getWaitCutPage;
const getWaitCutSplitSet = async (req, res) => {
    try {
        const productionLineId = req.session.user?.productionLineId;
        const queueData = await wait_cut_model_1.WaitCutModel.getSplitSetQueueData(null, productionLineId);
        const statusList = await wait_cut_model_1.WaitCutModel.getAllCutStatuses();
        res.render("wait-cut/index_splite_cut", { orders: queueData, statusList });
    }
    catch (error) {
        console.error("🔴 Controller พังจังหวะเรนเดอร์หน้าเว็บ:", error);
        res.status(500).send("เกิดข้อผิดพลาดในการโหลดหน้าเว็บครับกัปตัน");
    }
};
exports.getWaitCutSplitSet = getWaitCutSplitSet;
const startProduction = async (req, res) => {
    const { orderId, orderDetailId, qty, type } = req.body;
    // 🎯 ดึง ID เครื่องจาก Session ของผู้ใช้งานปัจจุบัน
    const productionLineId = req.session.user?.productionLineId;
    if (!orderId || !orderDetailId) {
        return res.status(400).json({ success: false, message: "ข้อมูลไม่ครบถ้วน (กรุณาระบุ orderId และ orderDetailId)" });
    }
    try {
        const io = (0, socket_1.getIO)();
        // 🎯 Helper ยิง Event เฉพาะ Room ของเครื่องตัวเอง
        const targetRoom = productionLineId ? io.of("/socket/wait-cut").to(`machine_room_${productionLineId}`) : io.of("/socket/wait-cut");
        if (type && type === "success") {
            console.log(`📡 [Controller] รับคำสั่งบังคับเสร็จสิ้น สำหรับใบงานย่อย ID: ${orderDetailId}`);
            const result = await wait_cut_model_1.WaitCutModel.forceCompleteOrderDetail(orderDetailId, orderId);
            await (0, socket_1.FnNextCutSplitSet)(productionLineId);
            // 🔊 Broadcast เฉพาะเครื่องตัวเอง!
            targetRoom.emit("queue_structure_changed", { success: true });
            return res.status(200).json({
                success: true,
                message: "บันทึกสถานะเสร็จสิ้นเรียบร้อยแล้ว",
                data: result,
            });
        }
        else if (type && type === "reset") {
            console.log(`📡 [Controller] รับคำสั่ง Reset สำหรับใบงานย่อย ID: ${orderDetailId}`);
            const result = await wait_cut_model_1.WaitCutModel.forceResetOrderDetail(orderDetailId, orderId);
            // 🔊 Broadcast เฉพาะเครื่องตัวเอง!
            targetRoom.emit("queue_structure_changed", { success: true });
            return res.status(200).json({
                success: true,
                message: "รีเซ็ตสถานะรายการเรียบร้อยแล้ว",
                data: result,
            });
        }
        else if (type && type === "hold") {
            console.log(`📡 [Controller] รับคำสั่ง HOLD สำหรับใบงานย่อย ID: ${orderDetailId}`);
            // 1. เรียกใช้ Model ในการ Hold ใบงาน
            const result = await wait_cut_model_1.WaitCutModel.holdOrderDetail(orderDetailId, orderId);
            // 2. จัดระเบียบคิวการตัดใหม่สำหรับเครื่องนี้ (เพื่อให้คิวถัดไปขยับขึ้นมา)
            await (0, socket_1.FnNextCutSplitSet)(productionLineId);
            // 🔊 3. Broadcast แจ้งเตือนทุกเครื่องใน Room เดียวกัน ให้รีเฟรชตาราง
            targetRoom.emit("queue_structure_changed", { success: true });
            return res.status(200).json({
                success: true,
                message: "พักการดำเนินงาน (HOLD) เรียบร้อยแล้ว",
                data: result,
            });
        }
        else if (type && type === "unhold") {
            console.log(`📡 [Controller] รับคำสั่ง UNHOLD สำหรับใบงานย่อย ID: ${orderDetailId}`);
            // 1. เรียกใช้งาน Model ปลด Hold
            const result = await wait_cut_model_1.WaitCutModel.unholdOrderDetail(orderDetailId, orderId);
            // 2. จัดระเบียบคิวการตัดใหม่สำหรับเครื่องนี้
            await (0, socket_1.FnNextCutSplitSet)(productionLineId);
            // 🔊 3. Broadcast แจ้งเตือนทุกเครื่องใน Room เดียวกัน ให้รีเฟรชตาราง
            targetRoom.emit("queue_structure_changed", { success: true });
            return res.status(200).json({
                success: true,
                message: "ปลดการ HOLD เรียบร้อยแล้ว",
                data: result,
            });
        }
        if (!qty || isNaN(Number(qty)) || Number(qty) <= 0) {
            return res.status(400).json({ success: false, message: "จำนวนเซ็ตไม่ถูกต้อง" });
        }
        console.log(`📡 [Controller] รับคำสั่งเริ่มกระบวนการตัดงาน สำหรับใบงานย่อย ID: ${orderDetailId}`);
        let staffId = req.session.user?.staff_id; // ดึง staff_id จาก session หรือใช้ค่าเริ่มต้นเป็น 1
        const createResult = await wait_cut_model_1.WaitCutModel.createOrderSplitSet(Number(orderId), Number(orderDetailId), Number(qty), staffId);
        await (0, socket_1.FnNextCutSplitSet)(productionLineId);
        // 🔊 Broadcast เฉพาะเครื่องตัวเอง!
        targetRoom.emit("queue_structure_changed", { success: true });
        return res.status(200).json({
            success: true,
            message: "บันทึกคำสั่งและสร้างรายการเซ็ตย่อยสำเร็จ",
            data: createResult,
        });
    }
    catch (error) {
        console.error("❌ [Controller Error] ระบบสั่งการติดขัด:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์ในการดำเนินการ",
        });
    }
};
exports.startProduction = startProduction;
const startWeighing = async (req, res) => {
    const { split_set_id, pl_order_id, pl_order_detail_id, type, cut_length } = req.body;
    // 🎯 ดึง ID เครื่องจาก Session
    const productionLineId = req.session.user?.productionLineId;
    const io = (0, socket_1.getIO)();
    // 🎯 เตรียม Target Room สำหรับยิงไปหน้า Split Set เฉพาะเครื่อง
    const splitSetTargetRoom = productionLineId ? io.of("/socket/wait-cut/split-cut-set").to(`machine_room_${productionLineId}`) : io.of("/socket/wait-cut/split-cut-set");
    if (type == "hold") {
        try {
            let data = await wait_cut_model_1.WaitCutModel.holdCutSplitSet(Number(split_set_id), Number(pl_order_id), Number(pl_order_detail_id));
            await wait_cut_model_1.WaitCutModel.ManagerStatusPlOrderDetail(Number(pl_order_detail_id));
            // 🔊 ยิงเฉพาะเครื่อง
            splitSetTargetRoom.emit("queue_structure_changed", { success: true });
            await (0, socket_1.FnNextRoll)(productionLineId);
            return res.status(200).json({ success: data, message: "Hold สำเร็จ" });
        }
        catch (error) {
            console.error("❌ [Controller Error] ระบบสั่งการติดขัด:", error);
            return res.status(500).json({ success: false, message: error.message || "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
        }
    }
    else if (type == "reset") {
        try {
            let data = await wait_cut_model_1.WaitCutModel.ResetCutSlitSet(Number(split_set_id), Number(pl_order_id), Number(pl_order_detail_id));
            await wait_cut_model_1.WaitCutModel.ManagerStatusPlOrderDetail(Number(pl_order_detail_id));
            // 🔊 ยิงเฉพาะเครื่อง
            splitSetTargetRoom.emit("queue_structure_changed", { success: true });
            await (0, socket_1.FnNextRoll)(productionLineId);
            return res.status(200).json({ success: data, message: "Reset สำเร็จ" });
        }
        catch (error) {
            console.error("❌ [Controller Error] ระบบสั่งการติดขัด:", error);
            return res.status(500).json({ success: false, message: error.message || "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
        }
    }
    else if (type == "unhold") {
        try {
            let data = await wait_cut_model_1.WaitCutModel.unHoldCutSplitSet(Number(split_set_id), Number(pl_order_id), Number(pl_order_detail_id));
            await wait_cut_model_1.WaitCutModel.ManagerStatusPlOrderDetail(Number(pl_order_detail_id));
            // 🔊 ยิงเฉพาะเครื่อง
            splitSetTargetRoom.emit("queue_structure_changed", { success: true });
            await (0, socket_1.FnNextRoll)(productionLineId);
            return res.status(200).json({ success: data, message: "UnHold สำเร็จ" });
        }
        catch (error) {
            console.error("❌ [Controller Error] ระบบสั่งการติดขัด:", error);
            return res.status(500).json({ success: false, message: error.message || "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
        }
    }
    if (!split_set_id || !pl_order_id || !pl_order_detail_id) {
        return res.status(400).json({ success: false, message: "ข้อมูลไม่ครบถ้วนหรือจำนวนเซ็ตไม่ถูกต้อง" });
    }
    try {
        console.log(`📡 [Controller] รับคำสั่งเริ่มกระบวนการตัดงาน สำหรับใบงานย่อย ID: ${split_set_id}`);
        let staffId = req.session.user?.staff_id; // ดึง staff_id จาก session หรือใช้ค่าเริ่มต้นเป็น 1
        await wait_cut_model_1.WaitCutModel.createOrderWeighing(Number(split_set_id), Number(pl_order_id), Number(pl_order_detail_id), staffId, cut_length);
        await wait_cut_model_1.WaitCutModel.ManagerStatusPlOrderDetail(Number(pl_order_detail_id));
        // 🔊 ยิงเฉพาะเครื่อง
        splitSetTargetRoom.emit("queue_structure_changed", { success: true });
        await (0, socket_1.FnNextRoll)(productionLineId);
        return res.status(200).json({ success: true, message: "บันทึกคำสั่งและสร้างรายการเซ็ตย่อยสำเร็จ" });
    }
    catch (error) {
        console.error("❌ [Controller Error] ระบบสั่งการติดขัด:", error);
        return res.status(500).json({ success: false, message: error.message || "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
    }
};
exports.startWeighing = startWeighing;
const qcCloseReel = async (req, res) => {
    const productionLineId = req.session.user?.productionLineId; // ดึง ID เครื่องจาก Session ของผู้ใช้งานปัจจุบัน
    try {
        const queueData = await wait_cut_model_1.WaitCutModel.getQcCloseReel(null, null, null, productionLineId);
        res.render("wait-cut/index_qc_close_reel", {
            orders: queueData, // 👈 ใช้ชื่อคีย์ว่า orders
            productionLineId: productionLineId
        });
    }
    catch (error) {
        console.error("🔴 Controller พังจังหวะเรนเดอร์หน้าเว็บ:", error);
        res.status(500).send("เกิดข้อผิดพลาดในการโหลดหน้าเว็บครับกัปตัน");
    }
};
exports.qcCloseReel = qcCloseReel;
const saveRemarkController = async (req, res) => {
    try {
        const { items } = req.body;
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "ไม่พบรายการข้อมูลที่ส่งมาบันทึก",
            });
        }
        const validItems = items.filter((item) => item.id !== undefined && item.id !== null);
        if (validItems.length === 0) {
            return res.status(400).json({
                success: false,
                message: "รูปแบบข้อมูลไม่ถูกต้อง (ไม่พบ ID)",
            });
        }
        const isSuccess = await wait_cut_model_1.WaitCutModel.saveRemarks(validItems);
        if (isSuccess) {
            return res.json({
                success: true,
                message: `บันทึกหมายเหตุสำเร็จเรียบร้อย (${validItems.length} รายการ)`,
            });
        }
        else {
            return res.status(400).json({
                success: false,
                message: "ไม่สามารถอัปเดตข้อมูลลงตาราง pl_cut_split_set ได้",
            });
        }
    }
    catch (error) {
        console.error("❌ เกิดข้อผิดพลาดใน Controller [saveRemarkController]:", error);
        return res.status(500).json({
            success: false,
            message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์",
            error: error.message,
        });
    }
};
exports.saveRemarkController = saveRemarkController;
const getQcReelListController = async (req, res) => {
    const productionLineId = req.session.user?.productionLineId; // ดึง ID เครื่องจาก Session ของผู้ใช้งานปัจจุบัน
    try {
        const search = req.query.search ? String(req.query.search).trim() : "%";
        const data = await wait_cut_model_1.WaitCutModel.getReelList(search, productionLineId);
        return res.json({
            success: true,
            data: data,
        });
    }
    catch (error) {
        console.error("❌ Controller Error [getQcReelListController]:", error);
        return res.status(500).json({
            success: false,
            message: "เกิดข้อผิดพลาดในการดึงข้อมูลรายการ Reel",
            error: error.message,
        });
    }
};
exports.getQcReelListController = getQcReelListController;
const saveQcCloseReelController = async (req, res) => {
    try {
        const { splitSetId, reelId } = req.body;
        // 1. Validation เบื้องต้น
        if (!splitSetId || !reelId) {
            return res.status(400).json({
                success: false,
                message: "ข้อมูลไม่ครบถ้วน กรุณาระบุ splitSetId และ reelId",
            });
        }
        // 2. เรียกใช้งาน Model
        const result = await wait_cut_model_1.WaitCutModel.updateCloseReel(splitSetId, reelId);
        // 🛑 3. เช็กว่า Model ทำงานสำเร็จหรือไม่ (ถ้าโควตาไม่พอ หรือไม่พบ ID จะเด้งเข้าเงื่อนไขนี้)
        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: result.message, // ส่ง Message เตือนจาก Model (เช่น "โควตาคงเหลือไม่พอ...") ไปแสดงที่หน้า UI
            });
        }
        // 🟢 4. ถ้าผ่าน (สำเร็จ) ค่อยเรียกฟังก์ชันถัดไป
        await (0, socket_1.FnNextQcCloseReel)();
        return res.json({
            success: true,
            message: "บันทึก REEL_ID เรียบร้อยแล้ว",
            data: {
                splitSetId: splitSetId,
                reelId: reelId,
            },
        });
    }
    catch (error) {
        console.error("❌ Controller Error [saveQcCloseReelController]:", error);
        return res.status(500).json({
            success: false,
            message: "เกิดข้อผิดพลาดในการบันทึกข้อมูล",
            error: error.message,
        });
    }
};
exports.saveQcCloseReelController = saveQcCloseReelController;
const swapSplitSetSize = async (req, res) => {
    const { splitSetId, posA, posB } = req.body;
    const productionLineId = req.session.user?.productionLineId;
    try {
        // 1. สลับค่าใน DB
        await wait_cut_model_1.WaitCutModel.swapSplitSetSize(splitSetId, posA, posB);
        // 2. กระจายสัญญาณ Socket (หากไม่มี lineId ตัว FnNextCutSplitSet จะยิง Broadcast รวมให้อัตโนมัติ)
        await (0, socket_1.FnNextCutSplitSet)(productionLineId);
        // 3. ตอบกลับสถานะสำเร็จ
        return res.status(200).json({
            success: true,
            message: "สลับขนาดเรียบร้อยแล้ว"
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "เกิดข้อผิดพลาดในการสลับขนาด"
        });
    }
};
exports.swapSplitSetSize = swapSplitSetSize;
const closeReel = async (req, res) => {
    const { id, reelNo } = req.body;
    const staffId = req.session.user?.staff_id; // หรือ userId จาก session
    if (!id) {
        return res.status(400).json({
            success: false,
            message: "กรุณาระบุ ID ของ Reel"
        });
    }
    try {
        // 🎯 ยิงอัปเดตสถานะใน DB (เช่น ปรับ status = 0 หรือ 'CLOSED')
        await wait_cut_model_1.WaitCutModel.closeReelStatus(id, staffId);
        return res.status(200).json({
            success: true,
            message: "ปิด Reel เรียบร้อยแล้ว"
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "เกิดข้อผิดพลาดในการปิด Reel"
        });
    }
};
exports.closeReel = closeReel;
