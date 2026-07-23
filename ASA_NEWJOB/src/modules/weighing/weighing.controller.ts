import { Request, Response } from 'express';
import { WeighingModel } from './weighing.model';

export const getWeighingPage = async (req: Request, res: Response) => {
    try {
        // สั่ง await รอรับประวัติการชั่งน้ำหนักย้อนหลังดักทาง SQL
        const getNextWeighing = await WeighingModel.getNextWeighing();
        // เรนเดอร์หน้าจอ ejs พร้อมสกัดข้อมูลพ่นลงตาราง
        res.render('weighing/index', {nextData:getNextWeighing});
    } catch (error) {
        console.error("ระบบหน้าจอชั่งน้ำหนักขัดข้อง:", error);
        res.status(500).send("เกิดข้อผิดพลาดภายในระบบวิศวกรรม");
    }
};


export const saveWeighingController = async (req: Request, res: Response) => {
    try {
        const { id, weight, status, remark, model } = req.body;

        if (!id) {
            return res.status(400).json({ success: false, message: "ไม่พบ ID ของคิวชั่งน้ำหนัก" });
        }

        // 1. ทำความสะอาดข้อมูล
        const payload = {
            id: Number(id),
            weigh: parseFloat(weight) || 0,
            status: status || 'PASS',
            remark: remark && remark.trim() !== '' ? remark.trim() : null,
            model: model && model.trim() !== '' ? model.trim() : null
        };

        // 2. เรียก Model สั่ง อัปเดตลง Database
        const isSuccess = await WeighingModel.updateWeighingResult(payload);

        if (!isSuccess) {
            return res.status(400).json({ success: false, message: "ไม่สามารถอัปเดตข้อมูลใน Database ได้" });
        }

        // 3. ตอบกลับหน้าบ้าน
        return res.json({
            success: true,
            message: "บันทึกข้อมูลน้ำหนักลง Database เรียบร้อยแล้ว"
        });

    } catch (error: any) {
        console.error("❌ Controller Save Error:", error);
        return res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดฝั่งเซิร์ฟเวอร์" });
    }
};