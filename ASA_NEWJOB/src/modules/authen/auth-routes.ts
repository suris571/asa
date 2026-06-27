// src/routes/auth-routes.ts
import { Router, Request, Response } from 'express';
import 'express-session';
declare module 'express-session' {
  interface SessionData {
    user?: { username: string; role: 'admin' | 'operator'; name: string; };
  }
}

const router = Router();

// 👥 1. ถังข้อมูลพนักงานจำลอง (Mock DB) รอสลับพิกัดจริงของลูกค้าในอนาคต
const MOCK_USERS = [
  { username: 'admin1', password: 'password123', role: 'admin', name: 'หัวหน้ากะ (Admin)' },
  { username: 'op1', password: 'password123', role: 'operator', name: 'พนักงานคุมเครื่อง PM1' },
  { username: 'op2', password: 'password123', role: 'operator', name: 'พนักงานคุมเครื่อง PM2' }
];

// 🔓 หน้ากากหน้าจอ Login (GET: /login)
router.get('/login', (req: Request, res: Response) => {
  // ถ้าพนักงานล็อกอินค้างไว้อยู่แล้ว ให้ดีดไปหน้าทำคิวงานทันที ไม่ต้องกรอกซ้ำ
  if (req.session.user) {
    return res.redirect('/');
  }
  res.render('login/login', { error: null });
});

// 🔑 ตรวจจับรหัสผ่าน (POST: /login)
router.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;

  // ค้นหารายชื่อในตรรกะคลังแสงจำลองของเรา
  const user = MOCK_USERS.find(u => u.username === username && u.password === password);
  console.log(user)
  if (user) { 
    // 🎯 หัวใจหลัก: ยัดสิทธิ์และชื่อลง Session คุกกี้จะถูกเซ็ตลงเครื่องคนงานออโต้ 1 ปี!
    req.session.user = {
      username: user.username,
      role: user.role as 'admin' | 'operator',
      name: user.name
    };
    console.log(`🟢 ${user.name} เข้าสู่ระบบสำเร็จ (คุกกี้สแตนด์บาย 1 ปี)`);
    return res.status(200).json({
      "success": true,
      "redirectUrl": "/"
    })
  } else {
   console.log(`🔴 [AJAX] ล็อกอินล้มเหลว: ไอดีหรือรหัสผ่านผิดพลาด (Username: ${username})`);
    return res.status(401).json({ 
      success: false, 
      error: '❌ รหัสผ่านไม่ถูกต้อง หรือไม่มีชื่อพนักงานท่านนี้ในระบบประจำกะ' 
    });
  }
});

// 🚪 ปุ่มกดออกจากระบบ (GET: /logout) เผื่อซ่อมบำรุงเครื่อง
router.get('/logout', (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) console.error('ทำลายเซสชันพัง:', err);
    res.redirect('/login');
  });
});

export default router;