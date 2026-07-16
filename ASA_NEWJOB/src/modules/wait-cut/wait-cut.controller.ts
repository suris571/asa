import { Request, Response } from 'express';
import { WaitCutModel } from './wait-cut.model';

export const getWaitCutPage = async (req: Request, res: Response) => {
    try {
      const queueData = await WaitCutModel.getAllWaitingAndWeighing();
      console.log(queueData[0])
      res.render('wait-cut/index', { orders: queueData});
    } catch (error) {
      console.error('🔴 Controller พังจังหวะเรนเดอร์หน้าเว็บ:', error);
      res.status(500).send('เกิดข้อผิดพลาดในการโหลดหน้าเว็บครับกัปตัน');
    }
};