"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/auth-routes.ts
const express_1 = require("express");
const auth_model_1 = require("./auth.model");
require("express-session");
const router = (0, express_1.Router)();
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
    const user = await auth_model_1.AuthModel.validateStaff(username, password);
    console.log(user);
    if (user && user.permissions && (user.permissions.includes(16800) || user.permissions.includes(16801) || user.permissions.includes(16802) || user.permissions.includes(16803) || user.permissions.includes(16804))) {
        try {
            // 🎯 ดึง ID จริงจากตาราง PL_PRODUCTION_LINE โดยใช้ machineNo (เช่น 1 หรือ 2)
            const productionLineId = await auth_model_1.AuthModel.getProductionLineIdByNo(Number(machineNo));
            // 🎯 ยัดสิทธิ์, ชื่อ, และข้อมูลเครื่องจักรลง Session
            req.session.user = {
                username: username,
                role: "",
                name: `${user.first_name} ${user.last_name}`,
                staff_id: user?.id, // เพิ่ม staff_id ลงใน session
                machineNo: Number(machineNo),
                permissions: user.permissions,
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
            error: '❌ รหัสผ่านไม่ถูกต้องหรือชื่อผู้ใช้ไม่ถูกต้อง หรือคุณอาจะไม่มีสิทธิ์เข้าถึงระบบนี้'
        });
    }
});
exports.default = router;
