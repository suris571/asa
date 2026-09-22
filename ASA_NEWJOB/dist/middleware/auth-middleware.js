"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requirePermission = void 0;
exports.requireAuth = requireAuth;
function requireAuth(req, res, next) {
    // ตรรกะเด็ดขาด: ถ้าไม่มีตั๋วคุกกี้ฝังในแรมเบราว์เซอร์ ดีดกลับไปหน้าล็อกอินสถานเดียว!
    if (!req.session.user) {
        // 🟢 1. ตรวจสอบว่าเป็น AJAX/Fetch Request หรือไม่
        const isAjax = req.xhr ||
            req.headers['x-requested-with'] === 'XMLHttpRequest' ||
            req.headers.accept?.includes('application/json') ||
            req.get('Content-Type') === 'application/json';
        if (isAjax) {
            // 🔴 ถ้ายิงมาจาก AJAX/Fetch -> ตอบกลับเป็น HTTP 401 Unauthorized พร้อม JSON
            return res.status(401).json({
                success: false,
                message: 'SESSION_EXPIRED_PLEASE_LOGIN',
                redirectUrl: '/login'
            });
        }
        // 🟢 2. ถ้าเป็นการกดเปลี่ยนหน้าเว็บปกติ -> Redirect ไปหน้า Login
        return res.redirect('/login');
    }
    next(); // มีตั๋วแล้ว ผ่านประตูไปทำคิวงานต่อได้!
}
const requirePermission = (permissionId) => {
    return (req, res, next) => {
        console.log("🔑 ตรวจสอบสิทธิ์ Permission ID:", permissionId);
        // 🟢 เปลี่ยนมาอ่านค่าสดจาก res.locals.data ที่ดึงจาก DB
        const userPermissions = res.locals.data?.permissions || [];
        // 🟢 เช็คสิทธิ์ตรง หรือเช็คสิทธิ์ Admin (168)
        const hasPermission = userPermissions.includes(permissionId) || userPermissions.includes(16800);
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
