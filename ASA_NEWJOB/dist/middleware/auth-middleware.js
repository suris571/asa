"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requirePermission = void 0;
exports.requireAuth = requireAuth;
function requireAuth(req, res, next) {
    // ตรรกะเด็ดขาด: ถ้าไม่มีตั๋วคุกกี้ฝังในแรมเบราว์เซอร์ ดีดกลับไปหน้าล็อกอินสถานเดียว!
    if (!req.session.user) {
        return res.redirect('/login');
    }
    next(); // มีตั๋วแล้ว ผ่านประตูไปทำคิวงานต่อได้!
}
const requirePermission = (permissionId) => {
    return (req, res, next) => {
        console.log("🔑 ตรวจสอบสิทธิ์ Permission ID:", permissionId);
        // 🟢 เปลี่ยนมาอ่านค่าสดจาก res.locals.data ที่ดึงจาก DB
        const userPermissions = res.locals.data?.permissions || [];
        console.log("📋 สิทธิ์สดปัจจุบันจาก DB:", userPermissions);
        // 🟢 เช็คสิทธิ์ตรง หรือเช็คสิทธิ์ Admin (168)
        const hasPermission = userPermissions.includes(permissionId) || userPermissions.includes(16800);
        console.log("ผลการตรวจสอบ:", hasPermission);
        if (hasPermission) {
            return next(); // ผ่านไปทำงานใน Controller ได้
        }
        // 🔴 กรณีไม่มีสิทธิ์
        if (req.xhr || req.headers.accept?.includes('json')) {
            return res.status(403).json({
                success: false,
                error: '❌ คุณไม่มีสิทธิ์ใช้งานฟังก์ชันนี้'
            });
        }
        return res.status(403).send(`
      <script>
        alert("คุณไม่มีสิทธิ์เข้าถึงหน้านี้");
        window.location.href = "/";
      </script>
    `);
    };
};
exports.requirePermission = requirePermission;
