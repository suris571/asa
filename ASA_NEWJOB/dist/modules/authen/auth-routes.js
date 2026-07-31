"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/auth-routes.ts
const express_1 = require("express");
const auth_model_1 = require("./auth.model");
require("express-session");
const router = (0, express_1.Router)();
// 👥 1. ถังข้อมูลพนักงานจำลอง (Mock DB)
const MOCK_USERS = [
    { username: 'admin1', password: 'password123', role: 'admin', name: 'หัวหน้ากะ (Admin)' },
    { username: 'a', password: 'a', role: 'admin', name: 'หัวหน้ากะ (Admin)' },
    { username: 'op1', password: 'password123', role: 'operator', name: 'พนักงานคุมเครื่อง PM1' },
    { username: 'op2', password: 'password123', role: 'operator', name: 'พนักงานคุมเครื่อง PM2' }
];
// 🔓 หน้ากากหน้าจอ Login (GET: /login)
router.get('/login', (req, res) => {
    if (req.session.user) {
        return res.redirect('/');
    }
    res.render('login/login', { error: null });
});
router.get('/auth/logout', (req, res) => {
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
router.post('/login', async (req, res) => {
    const { username, password, machineNo } = req.body;
    // ค้นหารายชื่อในตรรกะคลังแสงจำลอง
    const user = MOCK_USERS.find(u => u.username === username && u.password === password);
    if (user) {
        try {
            // 🎯 ดึง ID จริงจากตาราง PL_PRODUCTION_LINE โดยใช้ machineNo (เช่น 1 หรือ 2)
            const productionLineId = await auth_model_1.AuthModel.getProductionLineIdByNo(Number(machineNo));
            // 🎯 ยัดสิทธิ์, ชื่อ, และข้อมูลเครื่องจักรลง Session
            req.session.user = {
                username: user.username,
                role: user.role,
                name: user.name,
                staff_id: 1, // เพิ่ม staff_id ลงใน session
                machineNo: Number(machineNo),
                productionLineId: productionLineId
            };
            return res.status(200).json({
                success: true,
                redirectUrl: "/"
            });
        }
        catch (dbError) {
            console.error("❌ เกิดข้อผิดพลาดในการดึงข้อมูลเครื่องจักร:", dbError);
            return res.status(500).json({
                success: false,
                error: dbError.message || 'เกิดข้อผิดพลาดภายในระบบในการดึงข้อมูลเครื่องจักร'
            });
        }
    }
    else {
        console.log(`🔴 [AJAX] ล็อกอินล้มเหลว: ไอดีหรือรหัสผ่านผิดพลาด (Username: ${username})`);
        return res.status(401).json({
            success: false,
            error: '❌ รหัสผ่านไม่ถูกต้องหรือชื่อผู้ใช้ไม่ถูกต้อง'
        });
    }
});
exports.default = router;
