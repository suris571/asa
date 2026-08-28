"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// =========================================================
// 📦 1. SECTION: IMPORTS (EXTERNAL PACKAGES)
// =========================================================
const express_1 = __importDefault(require("express"));
const auth_middleware_js_1 = require("./middleware/auth-middleware.js");
const path_1 = __importDefault(require("path"));
const http_1 = require("http");
const express_session_1 = __importDefault(require("express-session"));
// =========================================================
// 🔌 2. SECTION: IMPORTS (LOCAL APP MODULES)
// =========================================================
const socket_js_1 = require("./socket.js");
const database_js_1 = require("./database.js");
const auth_routes_js_1 = __importDefault(require("./modules/authen/auth-routes.js"));
const wait_cut_route_js_1 = __importDefault(require("./modules/wait-cut/wait-cut.route.js"));
const weighing_route_js_1 = __importDefault(require("./modules/weighing/weighing.route.js"));
const auth_model_js_1 = require("./modules/authen/auth.model.js");
const wait_cut_model_js_1 = require("./modules/wait-cut/wait-cut.model.js");
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const PORT = 3000;
// จุดชนวนเปิดท่อระบบจัดการ Socket.io
(0, socket_js_1.initSocket)(httpServer);
app.set('view engine', 'ejs');
app.set('views', path_1.default.join(__dirname, '../views'));
app.use(express_1.default.static(path_1.default.join(__dirname, '../public')));
app.use('/sweetalert2', express_1.default.static(path_1.default.join(__dirname, '../node_modules/sweetalert2/dist')));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, express_session_1.default)({
    secret: 'super-secret-key-wait-cut-factory',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365, // คุกกี้อมตะ 1 ปีเต็มประจำเครื่องจักร
        secure: false, // รองรับ http:// หน้างานโรงงาน
        httpOnly: true
    }
}));
app.use('/', auth_routes_js_1.default); // ท่อสำหรับหน้า /login และ /logout
app.use(auth_middleware_js_1.requireAuth);
app.use(async (req, res, next) => {
    try {
        const staffId = req.session.user?.staff_id;
        // 🛑 แก้บั๊ก: เช็กว่ามี staffId จริงๆ (เพราะถ้า staffId = 0 ใน JS จะโดนมองเป็น false)
        const hasStaffId = staffId !== undefined && staffId !== null;
        // 1. ดึงสิทธิ์สดใหม่จาก Oracle DB
        const rawPermissions = hasStaffId
            ? await auth_model_js_1.AuthModel.getPermissionsByStaffId(staffId)
            : [];
        // 🎯 แปลงสิทธิ์ทั้งหมดให้เป็น Number ป้องกันปัญหา DB คืนค่าเป็น String (เช่น "16800" -> 16800)
        const freshPermissions = rawPermissions.map((p) => Number(p));
        // 2. 🎯 กำหนดรายการสิทธิ์ที่ระบบนี้ยอมรับ (16800 - 16804)
        const validSystemPermissions = [16800, 16801, 16802, 16803, 16804];
        // 3. 🎯 เช็กว่ามี "อย่างน้อย 1 สิทธิ์" ตรงกับระบบนี้หรือไม่
        const hasAccess = freshPermissions.some((p) => validSystemPermissions.includes(p));
        // 🔍 LOG สิทธิ์ทั้งหมดเพื่อ Debug
        console.log(`--------------------------------------------------`);
        console.log(`🔍 [Permission Check] Staff ID: ${staffId}`);
        console.log(`   - สิทธิ์ทั้งหมดที่พนักงานคนนี้มีใน DB :`, freshPermissions);
        console.log(`   - สิทธิ์ที่ระบบนี้อนุญาตให้เข้าใช้งาน :`, validSystemPermissions);
        console.log(`   - ผลการตรวจสอบ (ขออย่างน้อย 1 สิทธิ์)  : ${hasAccess ? '✅ ผ่าน' : '❌ ไม่ผ่าน'}`);
        console.log(`--------------------------------------------------`);
        // 🛑 ถ้าไม่มีสิทธิ์เลยแม้แต่อันเดียว ให้ Redirect ไป Logout
        if (!hasAccess) {
            console.warn(`⚠️ Staff ID: ${staffId} ไม่มีสิทธิ์ใช้งานระบบนี้ -> Redirect ไป /auth/logout`);
            return res.redirect('/auth/logout');
        }
        // 4. ฝังลง res.locals สำหรับ EJS
        res.locals.data = {
            username: req.session.user?.name || "ไม่ระบุชื่อพนักงาน",
            role: req.session.user?.role,
            pm1_pending: 0,
            pm2_pending: 0,
            pm1_status: { 1: 0, 2: 0, 3: 0, 4: 0 },
            pm2_status: { 1: 0, 2: 0, 3: 0, 4: 0 },
            pm_select: req.session.user?.machineNo,
            pm_select_ID: req.session.user?.productionLineId,
            permissions: freshPermissions,
        };
        next();
    }
    catch (error) {
        console.error("❌ Middleware Permission Error:", error);
        next(error);
    }
});
// เส้นทางหลักของระบบโรงงาน
app.get('/', async (req, res) => {
    try {
        // 🎯 ดึงจำนวนรายการแยกตามสายการผลิต (161/162) และตาม cut_status_id (1-4)
        const pendingByLine = await wait_cut_model_js_1.WaitCutModel.countWaitingCutByProductionLine();
        // หาจำนวนของ line + status ที่ต้องการจากผลลัพธ์ที่ Group มาแล้ว
        const getCount = (lineId, statusId) => {
            const found = pendingByLine.find((item) => Number(item.pl_production_line_id) === lineId &&
                Number(item.cut_status_id) === statusId);
            return found ? Number(found.total) : 0;
        };
        // 🎯 คงค่าเดิม pm1_pending/pm2_pending ไว้ (นับเฉพาะ status = 1 รอตัด) เพื่อไม่ให้ EJS เดิมพัง
        res.locals.data.pm1_pending = getCount(161, 1);
        res.locals.data.pm2_pending = getCount(162, 1);
        // 🎯 เพิ่มรายละเอียดแยกตาม status ของแต่ละไลน์ (1=รอตัด, 2=รอตัด(split), 3=ตัดยังไม่ครบ, 4=HOLD)
        res.locals.data.pm1_status = {
            1: getCount(161, 1),
            2: getCount(161, 2),
            3: getCount(161, 3),
            4: getCount(161, 4),
        };
        res.locals.data.pm2_status = {
            1: getCount(162, 1),
            2: getCount(162, 2),
            3: getCount(162, 3),
            4: getCount(162, 4),
        };
    }
    catch (error) {
        console.error("❌ ดึงจำนวนรายการรอตัดไม่สำเร็จ:", error);
    }
    res.render('index');
});
app.use('/wait-cut', wait_cut_route_js_1.default);
app.use('/weighing', weighing_route_js_1.default);
// =========================================================
// ⚡ 9. SECTION: APPLICATION ENGINE (จุดสตาร์ตระบบเครื่องยนต์)
// =========================================================
async function startApplication() {
    try {
        console.log('🚀 กำลังสตาร์ตระบบหลังบ้านแบบไฮบริด...');
        // 1. เปิดสะพานเชื่อมต่อคลังท่อฐานข้อมูล (Database Pool) ครั้งเดียวตอนติดเครื่อง
        await (0, database_js_1.initializePool)();
        // 2. ทดสอบสายสัญญานเช็กการตอบสนองของ Oracle DB
        await (0, database_js_1.testDatabaseConnection)();
        // 3. เปิดพอร์ตรับงานอย่างเป็นทางการ (รันผ่าน IP 0.0.0.0 เพื่อให้คอมเครื่องอื่นยิงเข้าได้)
        httpServer.listen(PORT, '0.0.0.0', () => {
            console.log(`🟢 [Ready]: Server มัดใจระบบเสร็จสมบูรณ์ รันอยู่ที่พอร์ต ${PORT}`);
        });
    }
    catch (error) {
        console.error('💥 แอปพลิเคชันล่มสลายล้มเหลวตั้งแต่สตาร์ต:', error);
        process.exit(1); // สั่งดับเครื่องยนต์ระบบทันทีป้องกัน Data เสียหาย
    }
}
// ลุยสั่งเดินเครื่องยนต์!
startApplication();
