import { Request, Response } from "express";
import { WaitCutModel } from "./wait-cut.model";
import { getIO, FnNextRoll, FnNextQcCloseReel, FnNextCutSplitSet } from "../../socket";
import { Common } from '../util/Common';

export const getWaitCutPage = async (req: Request, res: Response) => {
    try {
        const productionLineId = Number(req.session.user?.productionLineId);
        const queueData = await WaitCutModel.getAllWaitingAndWeighing(null, null, null, null, null, productionLineId);
        const statusList = await WaitCutModel.getAllCutStatuses();
        res.render("wait-cut/index", { orders: queueData, statusList });
    } catch (error) {
        console.error("🔴 Controller พังจังหวะเรนเดอร์หน้าเว็บ:", error);
        res.status(500).send("เกิดข้อผิดพลาดในการโหลดหน้าเว็บครับกัปตัน");
    }
};

export const getWaitCutSplitSet = async (req: Request, res: Response) => {
    try {
        const productionLineId = Number(req.session.user?.productionLineId);
        const queueData = await WaitCutModel.getSplitSetQueueData(null, productionLineId);
        const statusList = await WaitCutModel.getAllCutStatuses();
        res.render("wait-cut/index_splite_cut", { orders: queueData, statusList });
    } catch (error) {
        console.error("🔴 Controller พังจังหวะเรนเดอร์หน้าเว็บ:", error);
        res.status(500).send("เกิดข้อผิดพลาดในการโหลดหน้าเว็บครับกัปตัน");
    }
};

export const startProduction = async (req: Request, res: Response) => {
    const { orderId, orderDetailId, qty, type } = req.body;
    // 🎯 ดึง ID เครื่องจาก Session ของผู้ใช้งานปัจจุบัน
    const productionLineId:any = Number(req.session.user?.productionLineId);
    const staffId:any = req.session.user?.staff_id; 

    if (!orderId || !orderDetailId) {
        return res.status(400).json({ success: false, message: "ข้อมูลไม่ครบถ้วน (กรุณาระบุ orderId และ orderDetailId)" });
    }

    try {
        const io = getIO();
        // 🎯 Helper ยิง Event เฉพาะ Room ของเครื่องตัวเอง
        const targetRoom = productionLineId ? io.of("/socket/wait-cut").to(`machine_room_${productionLineId}`) : io.of("/socket/wait-cut");

        if (type && type === "success") {
            console.log(`📡 [Controller] รับคำสั่งบังคับเสร็จสิ้น สำหรับใบงานย่อย ID: ${orderDetailId}`);

            const result = await WaitCutModel.forceCompleteOrderDetail(orderDetailId, orderId, staffId);
            await FnNextCutSplitSet(productionLineId);

            // 🔊 Broadcast เฉพาะเครื่องตัวเอง!
            targetRoom.emit("queue_structure_changed", { success: true });

            return res.status(200).json({
                success: true,
                message: "บันทึกสถานะเสร็จสิ้นเรียบร้อยแล้ว",
                data: result,
            });
        } else if (type && type === "reset") {
            console.log(`📡 [Controller] รับคำสั่ง Reset สำหรับใบงานย่อย ID: ${orderDetailId}`);

            const result = await WaitCutModel.forceResetOrderDetail(orderDetailId, orderId, staffId);

            // 🔊 Broadcast เฉพาะเครื่องตัวเอง!
            targetRoom.emit("queue_structure_changed", { success: true });

            return res.status(200).json({
                success: true,
                message: "รีเซ็ตสถานะรายการเรียบร้อยแล้ว",
                data: result,
            });
        } else if (type && type === "hold") {
            console.log(`📡 [Controller] รับคำสั่ง HOLD สำหรับใบงานย่อย ID: ${orderDetailId}`);

            // 1. เรียกใช้ Model ในการ Hold ใบงาน
            const result = await WaitCutModel.holdOrderDetail(orderDetailId, orderId, staffId);

            // 2. จัดระเบียบคิวการตัดใหม่สำหรับเครื่องนี้ (เพื่อให้คิวถัดไปขยับขึ้นมา)
            await FnNextCutSplitSet(productionLineId);

            // 🔊 3. Broadcast แจ้งเตือนทุกเครื่องใน Room เดียวกัน ให้รีเฟรชตาราง
            targetRoom.emit("queue_structure_changed", { success: true });

            return res.status(200).json({
                success: true,
                message: "พักการดำเนินงาน (HOLD) เรียบร้อยแล้ว",
                data: result,
            });
        }else if (type && type === "unhold") {
        console.log(`📡 [Controller] รับคำสั่ง UNHOLD สำหรับใบงานย่อย ID: ${orderDetailId}`);

        // 1. เรียกใช้งาน Model ปลด Hold
        const result = await WaitCutModel.unholdOrderDetail(orderDetailId, orderId, staffId);

        // 2. จัดระเบียบคิวการตัดใหม่สำหรับเครื่องนี้
        await FnNextCutSplitSet(productionLineId);

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
        const createResult = await WaitCutModel.createOrderSplitSet(Number(orderId), Number(orderDetailId), Number(qty), staffId);
        await FnNextCutSplitSet(productionLineId);

        // 🔊 Broadcast เฉพาะเครื่องตัวเอง!
        targetRoom.emit("queue_structure_changed", { success: true });

        return res.status(200).json({
            success: true,
            message: "บันทึกคำสั่งและสร้างรายการเซ็ตย่อยสำเร็จ",
            data: createResult,
        });
    } catch (error: any) {
        console.error("❌ [Controller Error] ระบบสั่งการติดขัด:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์ในการดำเนินการ",
        });
    }
};

export const startWeighing = async (req: Request, res: Response) => {
    const { split_set_id, pl_order_id, pl_order_detail_id, type , cut_length } = req.body;
    // 🎯 ดึง ID เครื่องจาก Session
    const productionLineId:any = Number(req.session.user?.productionLineId);
    const staffId:any = req.session.user?.staff_id; 
    const io = getIO();

    // 🎯 เตรียม Target Room สำหรับยิงไปหน้า Split Set เฉพาะเครื่อง
    const splitSetTargetRoom = productionLineId ? io.of("/socket/wait-cut/split-cut-set").to(`machine_room_${productionLineId}`) : io.of("/socket/wait-cut/split-cut-set");

    if (type == "hold") {
        try {
            let data = await WaitCutModel.holdCutSplitSet(Number(split_set_id), Number(pl_order_id), Number(pl_order_detail_id),staffId);
            await WaitCutModel.ManagerStatusPlOrderDetail(Number(pl_order_detail_id),staffId);

            // 🔊 ยิงเฉพาะเครื่อง
            splitSetTargetRoom.emit("queue_structure_changed", { success: true });

            await FnNextRoll(productionLineId);
            return res.status(200).json({ success: data, message: "Hold สำเร็จ" });
        } catch (error: any) {
            console.error("❌ [Controller Error] ระบบสั่งการติดขัด:", error);
            return res.status(500).json({ success: false, message: error.message || "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
        }
    } else if (type == "reset") {
        try {
            let data = await WaitCutModel.ResetCutSlitSet(Number(split_set_id), Number(pl_order_id), Number(pl_order_detail_id),staffId);
            await WaitCutModel.ManagerStatusPlOrderDetail(Number(pl_order_detail_id) ,staffId);

            // 🔊 ยิงเฉพาะเครื่อง
            splitSetTargetRoom.emit("queue_structure_changed", { success: true });

            await FnNextRoll(productionLineId);
            return res.status(200).json({ success: data, message: "Reset สำเร็จ" });
        } catch (error: any) {
            console.error("❌ [Controller Error] ระบบสั่งการติดขัด:", error);
            return res.status(500).json({ success: false, message: error.message || "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
        }
    } else if (type == "unhold") {
        try {
            let data = await WaitCutModel.unHoldCutSplitSet(Number(split_set_id), Number(pl_order_id), Number(pl_order_detail_id), staffId);
            await WaitCutModel.ManagerStatusPlOrderDetail(Number(pl_order_detail_id),staffId);

            // 🔊 ยิงเฉพาะเครื่อง
            splitSetTargetRoom.emit("queue_structure_changed", { success: true });

            await FnNextRoll(productionLineId);
            return res.status(200).json({ success: data, message: "UnHold สำเร็จ" });
        } catch (error: any) {
            console.error("❌ [Controller Error] ระบบสั่งการติดขัด:", error);
            return res.status(500).json({ success: false, message: error.message || "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
        }
    }

    if (!split_set_id || !pl_order_id || !pl_order_detail_id) {
        return res.status(400).json({ success: false, message: "ข้อมูลไม่ครบถ้วนหรือจำนวนเซ็ตไม่ถูกต้อง" });
    }

    try {
        console.log(`📡 [Controller] รับคำสั่งเริ่มกระบวนการตัดงาน สำหรับใบงานย่อย ID: ${split_set_id}`);
        await WaitCutModel.createOrderWeighing(Number(split_set_id), Number(pl_order_id), Number(pl_order_detail_id), staffId,cut_length);
        await WaitCutModel.ManagerStatusPlOrderDetail(Number(pl_order_detail_id));

        // 🔊 ยิงเฉพาะเครื่อง
        splitSetTargetRoom.emit("queue_structure_changed", { success: true });

        await FnNextRoll(productionLineId);
        return res.status(200).json({ success: true, message: "บันทึกคำสั่งและสร้างรายการเซ็ตย่อยสำเร็จ" });
    } catch (error: any) {
        console.error("❌ [Controller Error] ระบบสั่งการติดขัด:", error);
        return res.status(500).json({ success: false, message: error.message || "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
    }
};



export const qcCloseReel = async (req: Request, res: Response) => {
    const productionLineId: any = Number(req.session.user?.productionLineId);
    const staffId:any = req.session.user?.staff_id; 

    try {
        const today = new Date();
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(today.getDate() - 2);

        // 🎯 แปลงให้อยู่ในฟอร์แมต DD/MM/YYYY (ตรงกับ Model แล้ว)
        const startDate = Common.formatDateDDMMYYYY(twoDaysAgo); // ได้ผลลัพธ์เช่น "06/08/2026"
        const endDate = Common.formatDateDDMMYYYY(today);       // ได้ผลลัพธ์เช่น "08/08/2026"

        // ส่ง startDate และ endDate เข้า Model
        const queueData = await WaitCutModel.getQcCloseReel(null, startDate, endDate, productionLineId);

        res.render("wait-cut/index_qc_close_reel", { 
            orders: queueData,
            productionLineId: productionLineId,
            startDate: startDate,
            endDate: endDate
        });
    } catch (error) {
        console.error("🔴 Controller พังจังหวะเรนเดอร์หน้าเว็บ:", error);
        res.status(500).send("เกิดข้อผิดพลาดในการโหลดหน้าเว็บครับกัปตัน");
    }
};

export const saveRemarkController = async (req: Request, res: Response) => {
    try {
        const { items } = req.body;
        const staffId:any = req.session.user?.staff_id; 

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

        const isSuccess = await WaitCutModel.saveRemarks(validItems);

        if (isSuccess) {
            await FnNextQcCloseReel();
            return res.json({
                success: true,
                message: `บันทึกหมายเหตุสำเร็จเรียบร้อย (${validItems.length} รายการ)`,
            });
        } else {
            return res.status(400).json({
                success: false,
                message: "ไม่สามารถอัปเดตข้อมูลลงตาราง pl_cut_split_set ได้",
            });
        }
    } catch (error: any) {
        console.error("❌ เกิดข้อผิดพลาดใน Controller [saveRemarkController]:", error);
        return res.status(500).json({
            success: false,
            message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์",
            error: error.message,
        });
    }
};

export const getQcReelListController = async (req: Request, res: Response) => {
    const productionLineId: any = Number(req.session.user?.productionLineId); // ดึง ID เครื่องจาก Session ของผู้ใช้งานปัจจุบัน
    try {
        const search = req.query.search ? String(req.query.search).trim() : "%";

        const data = await WaitCutModel.getReelList(search,productionLineId);

        return res.json({
            success: true,
            data: data,
        });
    } catch (error: any) {
        console.error("❌ Controller Error [getQcReelListController]:", error);
        return res.status(500).json({
            success: false,
            message: "เกิดข้อผิดพลาดในการดึงข้อมูลรายการ Reel",
            error: error.message,
        });
    }
};

export const saveQcCloseReelController = async (req: Request, res: Response) => {
    try {
        const { splitSetId, reelId } = req.body;
        const staffId:any = req.session.user?.staff_id; 


        // 1. Validation เบื้องต้น
        if (!splitSetId || !reelId) {
            return res.status(400).json({
                success: false,
                message: "ข้อมูลไม่ครบถ้วน กรุณาระบุ splitSetId และ reelId",
            });
        }

        // 2. เรียกใช้งาน Model
        const result = await WaitCutModel.updateCloseReel(splitSetId, reelId, staffId);

        // 🛑 3. เช็กว่า Model ทำงานสำเร็จหรือไม่ (ถ้าโควตาไม่พอ หรือไม่พบ ID จะเด้งเข้าเงื่อนไขนี้)
        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: result.message, // ส่ง Message เตือนจาก Model (เช่น "โควตาคงเหลือไม่พอ...") ไปแสดงที่หน้า UI
            });
        }

        // 🟢 4. ถ้าผ่าน (สำเร็จ) ค่อยเรียกฟังก์ชันถัดไป
        await FnNextQcCloseReel();

        return res.json({
            success: true,
            message: "บันทึก REEL_ID เรียบร้อยแล้ว",
            data: {
                splitSetId: splitSetId,
                reelId: reelId,
            },
        });

    } catch (error: any) {
        console.error("❌ Controller Error [saveQcCloseReelController]:", error);
        return res.status(500).json({
            success: false,
            message: "เกิดข้อผิดพลาดในการบันทึกข้อมูล",
            error: error.message,
        });
    }
};


export const swapSplitSetSize = async (req: Request, res: Response) => {
    const { splitSetId, posA, posB } = req.body;
    const productionLineId: any = Number(req.session.user?.productionLineId);
    const staffId = req.session.user?.staff_id; // หรือ userId จาก session

    try {
        // 1. สลับค่าใน DB
        await WaitCutModel.swapSplitSetSize(splitSetId, posA, posB, staffId);

        // 2. กระจายสัญญาณ Socket (หากไม่มี lineId ตัว FnNextCutSplitSet จะยิง Broadcast รวมให้อัตโนมัติ)
        await FnNextCutSplitSet(productionLineId);

        // 3. ตอบกลับสถานะสำเร็จ
        return res.status(200).json({
            success: true,
            message: "สลับขนาดเรียบร้อยแล้ว"
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message || "เกิดข้อผิดพลาดในการสลับขนาด"
        });
    }
};

export const closeReel = async (req: Request, res: Response) => {
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
        await WaitCutModel.closeReelStatus(id, staffId);

        return res.status(200).json({
            success: true,
            message: "ปิด Reel เรียบร้อยแล้ว"
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message || "เกิดข้อผิดพลาดในการปิด Reel"
        });
    }
};