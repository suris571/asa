import { Request, Response } from 'express';
import { WaitCutModel } from './wait-cut.model';
import { getIO , FnNextRoll , FnNextQcCloseReel } from '../../socket';

export const getWaitCutPage = async (req: Request, res: Response) => {
    try {
      const queueData = await WaitCutModel.getAllWaitingAndWeighing();
      const statusList = await WaitCutModel.getAllCutStatuses();
      res.render('wait-cut/index', { orders: queueData,statusList});
    } catch (error) {
      console.error('🔴 Controller พังจังหวะเรนเดอร์หน้าเว็บ:', error);
      res.status(500).send('เกิดข้อผิดพลาดในการโหลดหน้าเว็บครับกัปตัน');
    }
};

export const getWaitCutSplitSet = async (req: Request, res: Response) => {
    try {
      const queueData = await WaitCutModel.getSplitSetQueueData();
      const statusList = await WaitCutModel.getAllCutStatuses();
      res.render('wait-cut/index_splite_cut', { orders: queueData,statusList});
    } catch (error) {
      console.error('🔴 Controller พังจังหวะเรนเดอร์หน้าเว็บ:', error);
      res.status(500).send('เกิดข้อผิดพลาดในการโหลดหน้าเว็บครับกัปตัน');
    }
};



export const startProduction = async (req: Request, res: Response) => {
    const { orderId, orderDetailId, qty } = req.body;
    // ตรวจสอบความถูกต้องของข้อมูลเบื้องต้น (Validation) ก่อนลงแรงทำงาน
    if (!orderId || !orderDetailId || !qty || isNaN(Number(qty))) {
        return res.status(400).json({ success: false, message: 'ข้อมูลไม่ครบถ้วนหรือจำนวนเซ็ตไม่ถูกต้อง' });
    }

    try {
        console.log(`📡 [Controller] รับคำสั่งเริ่มกระบวนการตัดงาน สำหรับใบงานย่อย ID: ${orderDetailId}`);

        // 🚀 สั่งเรียกใช้งานฟังก์ชัน Model ที่กัปตันย้ายคำสั่งไปจัดเก็บไว้
        await WaitCutModel.createOrderSplitSet(Number(orderId), Number(orderDetailId), Number(qty));

        // 🔊 ขั้นตอนกระจายข่าว (Broadcast): ตะโกนบอกทุกสถานีเครื่องจักรที่เปิดหน้านี้อยู่ให้วาดตารางใหม่เรียลไทม์
        const io = getIO();
        io.of('/socket/wait-cut').emit('queue_structure_changed', { success: true });

        // ส่งสัญญาณตอบกลับ HTTP สำเร็จให้เครื่องตนเองรับทราบเพื่อปลดล็อกหน้าจอ
        return res.status(200).json({ success: true, message: 'บันทึกคำสั่งและสร้างรายการเซ็ตย่อยสำเร็จ' });

    } catch (error: any) {
        console.error("❌ [Controller Error] ระบบสั่งการติดขัด:", error);
        return res.status(500).json({ success: false, message: error.message || 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
    }
};

export const startWeighing = async (req: Request, res: Response) => {
    const { split_set_id, pl_order_id, pl_order_detail_id , type} = req.body;
    if(type == "hold"){
        console.log(type)
        return
    }else if(type == "reset"){
        try {
            let data = await WaitCutModel.ResetCutSlitSet(Number(split_set_id), Number(pl_order_id), Number(pl_order_detail_id));
            const io = getIO();
            io.of('/socket/wait-cut/split-cut-set').emit('queue_structure_changed', { success: true });
            await FnNextRoll()
            return res.status(200).json({ success: data, message: 'บันทึกคำสั่งและสร้างรายการเซ็ตย่อยสำเร็จ' });
        } catch (error: any) {
            console.error("❌ [Controller Error] ระบบสั่งการติดขัด:", error);
            return res.status(500).json({ success: false, message: error.message || 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
        }
        return
    }
    // ตรวจสอบความถูกต้องของข้อมูลเบื้องต้น (Validation) ก่อนลงแรงทำงาน
    if (!split_set_id || !pl_order_id || !pl_order_detail_id) {
        return res.status(400).json({ success: false, message: 'ข้อมูลไม่ครบถ้วนหรือจำนวนเซ็ตไม่ถูกต้อง' });
    }

    try {
        console.log(`📡 [Controller] รับคำสั่งเริ่มกระบวนการตัดงาน สำหรับใบงานย่อย ID: ${split_set_id}`);

        // 🚀 สั่งเรียกใช้งานฟังก์ชัน Model ที่กัปตันย้ายคำสั่งไปจัดเก็บไว้
        await WaitCutModel.createOrderWeighing(Number(split_set_id), Number(pl_order_id), Number(pl_order_detail_id));
        const io = getIO();
        io.of('/socket/wait-cut/split-cut-set').emit('queue_structure_changed', { success: true });
        await FnNextRoll()
        return res.status(200).json({ success: true, message: 'บันทึกคำสั่งและสร้างรายการเซ็ตย่อยสำเร็จ' });

    } catch (error: any) {
        console.error("❌ [Controller Error] ระบบสั่งการติดขัด:", error);
        return res.status(500).json({ success: false, message: error.message || 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
    }

    
};



export const qcCloseReel = async (req: Request, res: Response) => {
    try {
      const queueData = await WaitCutModel.getQcCloseReel();
      res.render('wait-cut/index_qc_close_reel', { orders: queueData});
    } catch (error) {
      console.error('🔴 Controller พังจังหวะเรนเดอร์หน้าเว็บ:', error);
      res.status(500).send('เกิดข้อผิดพลาดในการโหลดหน้าเว็บครับกัปตัน');
    }
};

export const saveRemarkController = async (req: Request, res: Response) => {
    try {
        // รับค่า items ที่เป็น Array [{ id: 101, remark: '...' }, ...] จาก req.body
        const { items } = req.body;

        // 🛡️ Validation ตรวจสอบความถูกต้องของ Payload
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "ไม่พบรายการข้อมูลที่ส่งมาบันทึก"
            });
        }

        // 🎯 กรองเฉพาะรายการที่มี id ส่งมาจริง
        const validItems = items.filter(item => item.id !== undefined && item.id !== null);

        if (validItems.length === 0) {
            return res.status(400).json({
                success: false,
                message: "รูปแบบข้อมูลไม่ถูกต้อง (ไม่พบ ID)"
            });
        }

        // 🎯 เรียก Model สั่งบันทึกลงตาราง pl_cut_split_set
        const isSuccess = await WaitCutModel.saveRemarks(validItems);

        if (isSuccess) {
            return res.json({
                success: true,
                message: `บันทึกหมายเหตุสำเร็จเรียบร้อย (${validItems.length} รายการ)`
            });
        } else {
            return res.status(400).json({
                success: false,
                message: "ไม่สามารถอัปเดตข้อมูลลงตาราง pl_cut_split_set ได้"
            });
        }

    } catch (error: any) {
        console.error("❌ เกิดข้อผิดพลาดใน Controller [saveRemarkController]:", error);
        return res.status(500).json({
            success: false,
            message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์",
            error: error.message
        });
    }
};

export const getQcReelListController = async (req: Request, res: Response) => {
    try {
        const search = req.query.search ? String(req.query.search).trim() : '%';

        const data = await WaitCutModel.getReelList(search);

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

export const saveQcCloseReelController = async (req: Request, res: Response) => {
    try {
        const { splitSetId, reelId } = req.body;

        // ตรวจสอบค่าที่ส่งมา
        if (!splitSetId || !reelId) {
            return res.status(400).json({
                success: false,
                message: "ข้อมูลไม่ครบถ้วน กรุณาระบุ splitSetId และ reelId"
            });
        }

        // ยิงไปอัปเดต REEL_ID
        const result = await WaitCutModel.updateCloseReel(splitSetId, reelId);
        await FnNextQcCloseReel()
        if (result.rowsAffected && result.rowsAffected > 0) {
            return res.json({
                success: true,
                message: "บันทึก REEL_ID เรียบร้อยแล้ว",
                data: {
                    splitSetId: splitSetId,
                    reelId: reelId
                }
            });
        } else {
            return res.status(404).json({
                success: false,
                message: `ไม่พบรายการ PL_CUT_SPLIT_SET ที่มี ID: ${splitSetId}`
            });
        }

    } catch (error: any) {
        console.error("❌ Controller Error [saveQcCloseReelController]:", error);
        return res.status(500).json({
            success: false,
            message: "เกิดข้อผิดพลาดในการบันทึกข้อมูล",
            error: error.message
        });
    }
};