"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const wait_cut_model_1 = require("./../wait-cut/wait-cut.model");
const socket_1 = require("../../socket");
const router = (0, express_1.Router)();
/**
 * 📥 Public API: รับ Report ผลการตัดจาก Agent เครื่องตัด Yueli ($R01)
 * POST /api/slitter/report
 */
router.get('/slitter/reports', async (req, res) => {
    return res.status(200).json({
        success: true,
        message: "รับข้อมูลจาก Agent เรียบร้อยแล้ว",
        receivedData: {}
    });
});
router.post('/slitter/reports', async (req, res) => {
    try {
        console.log("📥 [Agent API] ได้รับ Request จากเครื่องตัด:", req.body);
        const { orderId, makeCnt, length, productionLineId } = req.body;
        let resCon = await wait_cut_model_1.WaitCutModel.updateFirstPendingSetCutLength(productionLineId, length, orderId);
        if (resCon.success) {
            await (0, socket_1.FnNextCutSplitSet)(productionLineId);
        }
        // 🟢 ตอบกลับ Agent ก่อนเพื่อยืนยันว่าได้รับ HTTP Request แล้ว
        return res.status(200).json({
            success: true,
            message: "รับข้อมูลจาก Agent เรียบร้อยแล้ว",
            receivedData: { orderId, length }
        });
    }
    catch (error) {
        console.error("❌ [Agent API Error]:", error);
        return res.status(500).json({
            success: false,
            message: "เกิดข้อผิดพลาดในการประมวลผล Agent API",
            error: error.message
        });
    }
});
exports.default = router;
