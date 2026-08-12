import { Request, Response } from 'express';
import { WeighingModel } from './weighing.model';
import { getIO, FnNextRoll, FnNextQcCloseReel, FnNextCutSplitSet } from "../../socket";
import { Common } from '../util/Common';

export const getWeighingPage = async (req: Request, res: Response) => {
    const productionLineId = Number(req.session.user?.productionLineId);
    try {
        const today = new Date();
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(today.getDate() - 2);

        // 🎯 แปลงให้อยู่ในฟอร์แมต DD/MM/YYYY (ตรงกับ Model แล้ว)
        const startDate = Common.formatDateDDMMYYYY(twoDaysAgo); // ได้ผลลัพธ์เช่น "06/08/2026"
        const endDate = Common.formatDateDDMMYYYY(today);       // ได้ผลลัพธ์เช่น "08/08/2026"
        // สั่ง await รอรับประวัติการชั่งน้ำหนักย้อนหลังดักทาง SQL
        const getNextWeighing = await WeighingModel.getNextWeighing(productionLineId);
        const historyWeighing = await WeighingModel.getNextWeighing(productionLineId, null ,'history',null,startDate,endDate);
        console.log("🚀 ประวัติการชั่งน้ำหนักย้อนหลัง 2 วัน:", historyWeighing);
        // เรนเดอร์หน้าจอ ejs พร้อมสกัดข้อมูลพ่นลงตาราง
        res.render('weighing/index', {
            nextData:getNextWeighing, 
            historyData: historyWeighing,
            productionLineId: productionLineId,
            startDate: startDate,
            endDate: endDate
        });
    } catch (error) {
        console.error("ระบบหน้าจอชั่งน้ำหนักขัดข้อง:", error);
        res.status(500).send("เกิดข้อผิดพลาดภายในระบบวิศวกรรม");
    }
};


export const saveWeighingController = async (req: Request, res: Response) => {
    try {
        const { id, weight, status, remark, model ,diameter,hold_cause} = req.body;
        let staffId = req.session.user?.staff_id || 1; // ดึง staff_id จาก session หรือใช้ค่าเริ่มต้นเป็น 1

        if (!id) {
            return res.status(400).json({ success: false, message: "ไม่พบ ID ของคิวชั่งน้ำหนัก" });
        }

        // 🎯 1. ทำความสะอาดค่า weight: ลบลูกน้ำออก -> ลบจุดทศนิยมและตัวเลขหลังจุดออก -> แปลงเป็น Integer
        const cleanWeightString = String(weight ?? '0')
            .replace(/,/g, '')       // ลบเครื่องหมายลูกน้ำ , ออกทั้งหมด (เช่น "15,369.59" -> "15369.59")
            .split('.')[0]           // เอาเฉพาะข้อความส่วนหน้าจุดทศนิยม (เช่น "15369.59" -> "15369")
            .trim();

        const formattedWeight = parseInt(cleanWeightString, 10) || 0; // แปลงเป็น Number ชนิด Integer

        // 2. จัดทำชุดข้อมูล Payload
        const payload = {
            id: Number(id),
            weigh: formattedWeight, // ได้ค่าเป็น 15369 (Integer) แน่นอน
            status: status || 'PASS',
            remark: remark && remark.trim() !== '' ? remark.trim() : null,
            model: model && model.trim() !== '' ? model.trim() : null,
            staffId: staffId,
            diameter: diameter && diameter.trim() !== '' ? diameter.trim() : null,
            hold_cause: hold_cause && hold_cause.trim() !== '' ? hold_cause.trim() : null
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
            diameter: payload.diameter,
            hold_cause: payload.hold_cause,
        });
        if(insertPD_ROLL?.id) {
            await WeighingModel.InsertPD_ROLL_QUALITY({
                id_pl_wait_weight: payload.id,
                pd_roll_id: insertPD_ROLL.id,
                qcReelQualityId: waitWeighingInfo.QC_REEL_QUALITY_ID,
                staffId: staffId
            });
        }

        const isSuccess = await WeighingModel.updateWeighingResult(payload,insertPD_ROLL.roll_no,staffId);
        // const isSuccess =   false; // เปลี่ยนเป็น false เพื่อทดสอบการตอบกลับเมื่อไม่สำเร็จ

        if (!isSuccess) {
            return res.status(400).json({ success: false, message: "ไม่สามารถอัปเดตข้อมูลใน Database ได้" });
        }
        const productionLineId:any = Number(req.session.user?.productionLineId);
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
    const productionLineId = Number(req.session.user?.productionLineId);
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