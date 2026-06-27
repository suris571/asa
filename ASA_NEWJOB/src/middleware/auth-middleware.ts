import { Request, Response, NextFunction } from 'express';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  // ตรรกะเด็ดขาด: ถ้าไม่มีตั๋วคุกกี้ฝังในแรมเบราว์เซอร์ ดีดกลับไปหน้าล็อกอินสถานเดียว!
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next(); // มีตั๋วแล้ว ผ่านประตูไปทำคิวงานต่อได้!
}