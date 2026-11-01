import { Router, Request, Response } from 'express';
import { WaitCutModel } from "./../wait-cut/wait-cut.model";
import { getIO, FnNextRoll, FnNextQcCloseReel, FnNextCutSplitSet } from "../../socket";

const router = Router();

/**
 * 📥 Public API: รับ Report ผลการตัดจาก Agent เครื่องตัด Yueli ($R01)
 * POST /api/slitter/report
 */

router.post('/slitter/reports', async (req: Request, res: Response) => {
    try {
        // console.log("📥 [Agent API] ได้รับ Request จากเครื่องตัด:", req.body);

        // ดึงข้อมูลที่ส่งมาจาก Agent
        const { orderId, makeCnt, length, productionLineId } = req.body;

        let resCon = await WaitCutModel.updateFirstPendingSetCutLength(productionLineId,length,orderId);
        if(resCon.success){
            await FnNextCutSplitSet(productionLineId);
        }

        // 🟢 ตอบกลับ Agent ก่อนเพื่อยืนยันว่าได้รับ HTTP Request แล้ว
        return res.status(200).json({
            success: true,
            message: "รับข้อมูลจาก Agent เรียบร้อยแล้ว",
            receivedData: { orderId, length }
        });

    } catch (error: any) {
        console.error("❌ [Agent API Error]:", error);
        return res.status(500).json({
            success: false,
            message: "เกิดข้อผิดพลาดในการประมวลผล Agent API",
            error: error.message
        });
    }
});

export default router;