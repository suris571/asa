import { Request, Response } from 'express';
import { WeighingModel } from './weighing.model';
import { getIO, FnNextRoll, FnNextQcCloseReel, FnNextCutSplitSet } from "../../socket";

export const getWeighingPage = async (req: Request, res: Response) => {
    const productionLineId = req.session.user?.productionLineId;
    try {
        // สั่ง await รอรับประวัติการชั่งน้ำหนักย้อนหลังดักทาง SQL
        const getNextWeighing = await WeighingModel.getNextWeighing(productionLineId);
        const historyWeighing = await WeighingModel.getNextWeighing(productionLineId, null ,'history');
        // เรนเดอร์หน้าจอ ejs พร้อมสกัดข้อมูลพ่นลงตาราง
        res.render('weighing/index', {nextData:getNextWeighing, historyData: historyWeighing});
    } catch (error) {
        console.error("ระบบหน้าจอชั่งน้ำหนักขัดข้อง:", error);
        res.status(500).send("เกิดข้อผิดพลาดภายในระบบวิศวกรรม");
    }
};


export const saveWeighingController = async (req: Request, res: Response) => {
    try {
        const { id, weight, status, remark, model } = req.body;
        let staffId = req.session.user?.staff_id || 1; // ดึง staff_id จาก session หรือใช้ค่าเริ่มต้นเป็น 1

        if (!id) {
            return res.status(400).json({ success: false, message: "ไม่พบ ID ของคิวชั่งน้ำหนัก" });
        }

        // 1. ทำความสะอาดข้อมูล
        const payload = {
            id: Number(id),
            weigh: parseFloat(weight) || 0,
            status: status || 'PASS',
            remark: remark && remark.trim() !== '' ? remark.trim() : null,
            model: model && model.trim() !== '' ? model.trim() : null,
            staffId: staffId,
        };

        const waitWeighingInfo: any = await WeighingModel.GetWaitWeighingInfoById(payload.id);
        if (!waitWeighingInfo) {
            return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลในระบบ' });
        }
        // 2. เรียก Model สั่ง อัปเดตลง Database
        const insertPD_ROLL: any = await WeighingModel.InsertPD_ROLL({
            id_pl_wait_weight: payload.id,
            weigh: payload.weigh,
            status: payload.status,
            remark: payload.remark,
            pl_order_id:waitWeighingInfo.PL_ORDER_ID,
            staffId: payload.staffId,
            qc_reel_id: waitWeighingInfo.QC_REEL_ID,
            roll: waitWeighingInfo.ROLL,
        });
        if(insertPD_ROLL?.id) {
            await WeighingModel.InsertPD_ROLL_QUALITY({
                id_pl_wait_weight: payload.id,
                pd_roll_id: insertPD_ROLL.id,
                qcReelQualityId: waitWeighingInfo.QC_REEL_QUALITY_ID,
                staffId: staffId
            });
        }

        const isSuccess = await WeighingModel.updateWeighingResult(payload,insertPD_ROLL.roll_no);
        // const isSuccess =   false; // เปลี่ยนเป็น false เพื่อทดสอบการตอบกลับเมื่อไม่สำเร็จ

        if (!isSuccess) {
            return res.status(400).json({ success: false, message: "ไม่สามารถอัปเดตข้อมูลใน Database ได้" });
        }
        const productionLineId:any = req.session.user?.productionLineId;
        const io = getIO();
        // 🎯 Helper ยิง Event เฉพาะ Room ของเครื่องตัวเอง
        const targetRoom = productionLineId ? io.of("/socket/weighing").to(`machine_room_${productionLineId}`) : io.of("/socket/weighing");
        targetRoom.emit("historyUpdate", { success: true });
        // 3. ตอบกลับหน้าบ้าน
        return res.json({
            success: true,
            roll_no: insertPD_ROLL.roll_no,
            message: "บันทึกข้อมูลน้ำหนักลง Database เรียบร้อยแล้ว"
        });

    } catch (error: any) {
        console.error("❌ Controller Save Error:", error);
        return res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดฝั่งเซิร์ฟเวอร์" });
    }
};


export const fetchweighinglist = async (req: Request, res: Response) => {
    const productionLineId = req.session.user?.productionLineId;
    try {
        const search = req.query.order_no ? String(req.query.order_no).trim() : '%';

        console.log(search)

        const data =  await WeighingModel.getNextWeighing(productionLineId,search);

        return res.json({
            success: true,
            data: data
        });

    } catch (error: any) {
        console.error("❌ Controller Error [getQcReelListController]:", error);
        return res.status(500).json({
            success: false,
            message: "เกิดข้อผิดพลาดในการดึงข้อมูลรายการ Reel",
            error: error.message
        });
    }
};