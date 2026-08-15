"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchweighinglist = exports.saveWeighingController = exports.getWeighingPage = void 0;
const weighing_model_1 = require("./weighing.model");
const socket_1 = require("../../socket");
const Common_1 = require("../util/Common");
const getWeighingPage = async (req, res) => {
    const productionLineId = Number(req.session.user?.productionLineId);
    try {
        console.time("⏱️ [TOTAL] Weighing Page Load");
        const today = new Date();
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(today.getDate() - 2);
        const startDate = Common_1.Common.formatDateDDMMYYYY(twoDaysAgo);
        const endDate = Common_1.Common.formatDateDDMMYYYY(today);
        // 🎯 ดึงแบบ Parallel พร้อมจับเวลา
        console.time("[TIME] 1. Fetching DB");
        let [getNextWeighing, historyWeighing] = await Promise.all([
            weighing_model_1.WeighingModel.getNextWeighing(productionLineId),
            weighing_model_1.WeighingModel.getNextWeighing(productionLineId, null, 'history', null, startDate, endDate)
        ]);
        console.timeEnd("[TIME] 1. Fetching DB");
        // let getNextWeighing: any[] = [];
        // let historyWeighing: any[] = [];
        console.time("[TIME] 2. Render EJS");
        res.render('weighing/index', {
            nextData: getNextWeighing,
            historyData: historyWeighing,
            productionLineId: productionLineId,
            startDate: startDate,
            endDate: endDate
        });
        console.timeEnd("[TIME] 2. Render EJS");
        console.timeEnd("[TOTAL] Weighing Page Load");
    }
    catch (error) {
        console.error("ระบบหน้าจอชั่งน้ำหนักขัดข้อง:", error);
        res.status(500).send("เกิดข้อผิดพลาดภายในระบบวิศวกรรม");
    }
};
exports.getWeighingPage = getWeighingPage;
const saveWeighingController = async (req, res) => {
    const totalStart = performance.now();
    console.log(`[PERF START] saveWeighingController execution initiated`);
    try {
        const { id, weight, status, remark, model, diameter, hold_cause } = req.body;
        const staffId = req.session.user?.staff_id;
        if (!id) {
            return res.status(400).json({ success: false, message: "ไม่พบ ID ของคิวชั่งน้ำหนัก" });
        }
        const cleanWeightString = String(weight ?? '0')
            .replace(/,/g, '')
            .split('.')[0]
            .trim();
        const formattedWeight = parseInt(cleanWeightString, 10) || 0;
        const payload = {
            id: Number(id),
            weigh: formattedWeight,
            status: status || 'PASS',
            remark: remark && remark.trim() !== '' ? remark.trim() : null,
            model: model && model.trim() !== '' ? model.trim() : null,
            staffId: staffId,
            diameter: diameter && diameter.trim() !== '' ? diameter.trim() : null,
            hold_cause: hold_cause && hold_cause.trim() !== '' ? hold_cause.trim() : null
        };
        // ⏱️ Step 1: Measure GetWaitWeighingInfoById
        const step1Start = performance.now();
        const waitWeighingInfo = await weighing_model_1.WeighingModel.GetWaitWeighingInfoById(payload.id);
        console.log(`[PERF] Step 1: GetWaitWeighingInfoById took ${(performance.now() - step1Start).toFixed(2)} ms`);
        if (!waitWeighingInfo) {
            return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลในระบบ' });
        }
        // ⏱️ Step 2: Measure InsertPD_ROLL
        const step2Start = performance.now();
        const insertPD_ROLL = await weighing_model_1.WeighingModel.InsertPD_ROLL({
            id_pl_wait_weight: payload.id,
            weigh: payload.weigh,
            status: payload.status,
            remark: payload.remark,
            pl_order_id: waitWeighingInfo.PL_ORDER_ID,
            staffId: payload.staffId,
            qc_reel_id: waitWeighingInfo.QC_REEL_ID,
            roll: waitWeighingInfo.ROLL,
            diameter: payload.diameter,
            hold_cause: payload.hold_cause,
        });
        console.log(`[PERF] Step 2: InsertPD_ROLL took ${(performance.now() - step2Start).toFixed(2)} ms`);
        // ⏱️ Step 3: Measure InsertPD_ROLL_QUALITY
        if (insertPD_ROLL?.id) {
            const step3Start = performance.now();
            await weighing_model_1.WeighingModel.InsertPD_ROLL_QUALITY({
                id_pl_wait_weight: payload.id,
                pd_roll_id: insertPD_ROLL.id,
                qcReelQualityId: waitWeighingInfo.QC_REEL_QUALITY_ID,
                staffId: staffId
            });
            console.log(`[PERF] Step 3: InsertPD_ROLL_QUALITY took ${(performance.now() - step3Start).toFixed(2)} ms`);
        }
        // ⏱️ Step 4: Measure updateWeighingResult
        const step4Start = performance.now();
        const isSuccess = await weighing_model_1.WeighingModel.updateWeighingResult(payload, insertPD_ROLL.roll_no, staffId);
        console.log(`[PERF] Step 4: updateWeighingResult took ${(performance.now() - step4Start).toFixed(2)} ms`);
        if (!isSuccess) {
            return res.status(400).json({ success: false, message: "ไม่สามารถอัปเดตข้อมูลใน Database ได้" });
        }
        const productionLineId = Number(req.session.user?.productionLineId);
        const io = (0, socket_1.getIO)();
        const targetRoom = productionLineId ? io.of("/socket/weighing").to(`machine_room_${productionLineId}`) : io.of("/socket/weighing");
        targetRoom.emit("historyUpdate", { success: true });
        // ⏱️ Total Execution Time
        const totalDuration = (performance.now() - totalStart).toFixed(2);
        console.log(`[PERF END] Total saveWeighingController duration: ${totalDuration} ms`);
        return res.json({
            success: true,
            roll_no: insertPD_ROLL.roll_no,
            message: "บันทึกข้อมูลน้ำหนักลง Database เรียบร้อยแล้ว"
        });
    }
    catch (error) {
        console.error("[PERF ERROR] Controller Save Error:", error);
        return res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดฝั่งเซิร์ฟเวอร์" });
    }
};
exports.saveWeighingController = saveWeighingController;
const fetchweighinglist = async (req, res) => {
    const productionLineId = Number(req.session.user?.productionLineId);
    try {
        const search = req.query.order_no ? String(req.query.order_no).trim() : '%';
        console.log(search);
        const data = await weighing_model_1.WeighingModel.getNextWeighing(productionLineId, search);
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
exports.fetchweighinglist = fetchweighinglist;
