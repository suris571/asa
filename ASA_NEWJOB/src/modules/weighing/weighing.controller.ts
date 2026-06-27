import { Request, Response } from 'express';
import { WeighingModel } from './weighing.model';

export const getWeighingPage = async (req: Request, res: Response) => {
    try {
        // สั่ง await รอรับประวัติการชั่งน้ำหนักย้อนหลังดักทาง SQL
        const historyData = await WeighingModel.getHistory();
        
        // เรนเดอร์หน้าจอ ejs พร้อมสกัดข้อมูลพ่นลงตาราง
        res.render('weighing/index', { history: historyData });
    } catch (error) {
        console.error("ระบบหน้าจอชั่งน้ำหนักขัดข้อง:", error);
        res.status(500).send("เกิดข้อผิดพลาดภายในระบบวิศวกรรม");
    }
};