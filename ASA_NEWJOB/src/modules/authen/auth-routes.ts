// src/routes/auth-routes.ts
import { Router, Request, Response } from 'express';
import { AuthModel } from './auth.model';
import 'express-session';

// 🎯 ขยายประเภทข้อมูล SessionData ให้รองรับ machineNo และ productionLineId
declare module 'express-session' {
  interface SessionData {
    user?: { 
      username: string; 
      role?: string; 
      name: string; 
      staff_id: number;          // เพิ่ม staff_id
      machineNo: number;         // เช่น 1 หรือ 2
      productionLineId: number;  // ID จริงจากตาราง PL_PRODUCTION_LINE
    };
  }
}

const router = Router();

// 🔓 หน้ากากหน้าจอ Login (GET: /login)
router.get('/login', (req: Request, res: Response) => {
  if (req.session.user) {
    return res.redirect('/');
  }
  res.render('login/login', { error: null });
});


router.get('/auth/logout', (req: Request, res: Response) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('❌ เกิดข้อผิดพลาดในการ Destroy Session:', err);
        }
        // ล้าง cookie และส่งกลับหน้า login
        res.clearCookie('connect.sid');
        res.redirect('/login');
    });
});

// 🔑 ตรวจจับรหัสผ่าน และเครื่องจักรที่เลือก (POST: /login)
router.post('/login', async (req: Request, res: Response) => {
  const { username, password, machineNo } = req.body;

  // ค้นหารายชื่อในตรรกะคลังแสงจำลอง
  const user = await AuthModel.validateStaff(username, password);
  if (user) { 
    try {
      // 🎯 ดึง ID จริงจากตาราง PL_PRODUCTION_LINE โดยใช้ machineNo (เช่น 1 หรือ 2)
      const productionLineId = await AuthModel.getProductionLineIdByNo(Number(machineNo));
      // 🎯 ยัดสิทธิ์, ชื่อ, และข้อมูลเครื่องจักรลง Session
      req.session.user = {
        username: username,
        role: "",
        name: `${user.FIRST_NAME} ${user.LAST_NAME}`,
        staff_id: user?.ID || 0, // เพิ่ม staff_id ลงใน session
        machineNo: Number(machineNo),
        productionLineId: productionLineId
      };

      return res.status(200).json({
        success: true,
        redirectUrl: "/"
      });

    } catch (dbError: any) {
      console.error("❌ เกิดข้อผิดพลาดในการดึงข้อมูลเครื่องจักร:", dbError);
      return res.status(500).json({ 
        success: false, 
        error: dbError.message || 'เกิดข้อผิดพลาดภายในระบบในการดึงข้อมูลเครื่องจักร' 
      });
    }

  } else {
    console.log(`🔴 [AJAX] ล็อกอินล้มเหลว: ไอดีหรือรหัสผ่านผิดพลาด (Username: ${username})`);
    return res.status(401).json({ 
      success: false, 
      error: '❌ รหัสผ่านไม่ถูกต้องหรือชื่อผู้ใช้ไม่ถูกต้อง' 
    });
  }
});

export default router;