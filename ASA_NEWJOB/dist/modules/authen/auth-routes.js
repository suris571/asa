"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/auth-routes.ts
const express_1 = require("express");
require("express-session");
const router = (0, express_1.Router)();
// 👥 1. ถังข้อมูลพนักงานจำลอง (Mock DB) รอสลับพิกัดจริงของลูกค้าในอนาคต
const MOCK_USERS = [
    { username: 'admin1', password: 'password123', role: 'admin', name: 'หัวหน้ากะ (Admin)' },
    { username: 'op1', password: 'password123', role: 'operator', name: 'พนักงานคุมเครื่อง PM1' },
    { username: 'op2', password: 'password123', role: 'operator', name: 'พนักงานคุมเครื่อง PM2' }
];
// 🔓 หน้ากากหน้าจอ Login (GET: /login)
router.get('/login', (req, res) => {
    // ถ้าพนักงานล็อกอินค้างไว้อยู่แล้ว ให้ดีดไปหน้าทำคิวงานทันที ไม่ต้องกรอกซ้ำ
    if (req.session.user) {
        return res.redirect('/');
    }
    res.render('login/login', { error: null });
});
// 🔑 ตรวจจับรหัสผ่าน (POST: /login)
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    // ค้นหารายชื่อในตรรกะคลังแสงจำลองของเรา
    const user = MOCK_USERS.find(u => u.username === username && u.password === password);
    console.log(user);
    if (user) {
        // 🎯 หัวใจหลัก: ยัดสิทธิ์และชื่อลง Session คุกกี้จะถูกเซ็ตลงเครื่องคนงานออโต้ 1 ปี!
        req.session.user = {
            username: user.username,
            role: user.role,
            name: user.name
        };
        console.log(`🟢 ${user.name} เข้าสู่ระบบสำเร็จ (คุกกี้สแตนด์บาย 1 ปี)`);
        return res.status(200).json({
            "success": true,
            "redirectUrl": "/"
        });
    }
    else {
        console.log(`🔴 [AJAX] ล็อกอินล้มเหลว: ไอดีหรือรหัสผ่านผิดพลาด (Username: ${username})`);
        return res.status(401).json({
            success: false,
            error: '❌ รหัสผ่านไม่ถูกต้อง หรือไม่มีชื่อพนักงานท่านนี้ในระบบประจำกะ'
        });
    }
});
// 🚪 ปุ่มกดออกจากระบบ (GET: /logout) เผื่อซ่อมบำรุงเครื่อง
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err)
            console.error('ทำลายเซสชันพัง:', err);
        res.redirect('/login');
    });
});
exports.default = router;
