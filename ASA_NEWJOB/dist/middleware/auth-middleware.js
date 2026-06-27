"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
function requireAuth(req, res, next) {
    // ตรรกะเด็ดขาด: ถ้าไม่มีตั๋วคุกกี้ฝังในแรมเบราว์เซอร์ ดีดกลับไปหน้าล็อกอินสถานเดียว!
    if (!req.session.user) {
        return res.redirect('/login');
    }
    next(); // มีตั๋วแล้ว ผ่านประตูไปทำคิวงานต่อได้!
}
