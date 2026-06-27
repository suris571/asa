"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// =========================================================
// 📦 1. SECTION: IMPORTS (EXTERNAL PACKAGES)
// =========================================================
const express_1 = __importDefault(require("express"));
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
const auth_middleware_js_1 = require("./middleware/auth-middleware.js");
// =========================================================
// 🚀 3. SECTION: CORE SETUP & PARAMETERS
// =========================================================
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const PORT = 3000;
// จุดชนวนเปิดท่อระบบจัดการ Socket.io
(0, socket_js_1.initSocket)(httpServer);
// =========================================================
// ⚙️ 4. SECTION: EXPRESS CONFIGURATIONS & STATIC
// =========================================================
app.set('view engine', 'ejs');
app.set('views', path_1.default.join(__dirname, '../views'));
app.use(express_1.default.static(path_1.default.join(__dirname, '../public')));
// =========================================================
// 🛡️ 5. SECTION: GLOBAL MIDDLEWARES (PARSERS & SESSION)
// =========================================================
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
// =========================================================
// 🔓 6. SECTION: PUBLIC ROUTES (ห้ามติดล็อกเด็ดขาด)
// =========================================================
app.use('/', auth_routes_js_1.default); // ท่อสำหรับหน้า /login และ /logout
// =========================================================
// 🚧 7. SECTION: GLOBAL SECURITY GATE (แผงกั้นความปลอดภัย)
// =========================================================
// บังคับว่าหลังจากบรรทัดนี้ไป... ทุก Request ต้องมีตั๋วคุกกี้ 1 ปีติดตัวมาเท่านั้น!
app.use(auth_middleware_js_1.requireAuth);
// =========================================================
// 🔒 8. SECTION: PROTECTED ROUTES (โซนปลอดภัย โดนล็อกออโต้)
// =========================================================
// ฟีดข้อมูลโปรไฟล์พนักงานขึ้นหน้าสเปกบอร์ด EJS (ใช้ข้อมูลจาก Session ของจริง)
app.use((req, res, next) => {
    res.locals.data = {
        username: req.session.user?.name || "ไม่ระบุชื่อพนักงาน",
        role: req.session.user?.role === 'admin' ? "หัวหน้าผู้ควบคุมงาน" : "พนักงานหน้างาน",
        pm1_pending: 5, // สถิติรอชุบชีวิตคิวรีจาก Oracle จริงในอนาคต
        pm2_pending: 3
    };
    next();
});
// เส้นทางหลักของระบบโรงงาน
app.get('/', (req, res) => {
    res.render('index');
});
app.use('/wait-cut', wait_cut_route_js_1.default); // ระบบคิวงานตัด
app.use('/weighing', weighing_route_js_1.default); // ระบบเครื่องชั่งและพิมพ์บาร์โค้ด A4
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
