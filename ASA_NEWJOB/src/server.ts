// =========================================================
// 📦 1. SECTION: IMPORTS (EXTERNAL PACKAGES)
// =========================================================
import express from 'express';
import { Request, Response, NextFunction } from 'express';
import { requireAuth } from './middleware/auth-middleware.js';
import path from 'path';
import { createServer } from 'http';
import session from 'express-session';

// =========================================================
// 🔌 2. SECTION: IMPORTS (LOCAL APP MODULES)
// =========================================================
import { initSocket } from './socket.js'; 
import { initializePool, testDatabaseConnection } from './database.js';
import authRoutes from './modules/authen/auth-routes.js';
import waitCutRoutes from './modules/wait-cut/wait-cut.route.js';
import weighingRoutes from './modules/weighing/weighing.route.js';
import { AuthModel } from './modules/authen/auth.model.js';


const app = express();
const httpServer = createServer(app);
const PORT = 3000;

// จุดชนวนเปิดท่อระบบจัดการ Socket.io
initSocket(httpServer);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));
app.use(express.static(path.join(__dirname, '../public')));
app.use('/sweetalert2', express.static(path.join(__dirname, '../node_modules/sweetalert2/dist')));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: 'super-secret-key-wait-cut-factory',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    maxAge: 1000 * 60 * 60 * 24 * 365, // คุกกี้อมตะ 1 ปีเต็มประจำเครื่องจักร
    secure: false,                     // รองรับ http:// หน้างานโรงงาน
    httpOnly: true 
  }
}));

app.use('/', authRoutes); // ท่อสำหรับหน้า /login และ /logout

app.use(requireAuth); 

app.use(async (req: Request, res: Response, next: NextFunction) => {
    const staffId = req.session.user?.staff_id;
    
    // ดึงสิทธิ์สดใหม่จาก Oracle DB ณ วินาทีนั้นเลย
    const freshPermissions = staffId 
        ? await AuthModel.getPermissionsByStaffId(staffId) 
        : [];
    // ฝังลง res.locals เพื่อให้ทั้ง EJS และ Middleware เช็คสิทธิ์เห็นตรงกัน
    res.locals.data = {
        username: req.session.user?.name || "ไม่ระบุชื่อพนักงาน",
        role: req.session.user?.role,
        pm1_pending: 5,
        pm2_pending: 3,
        pm_select: req.session.user?.machineNo,
        pm_select_ID: req.session.user?.productionLineId,
        permissions: freshPermissions, // 👈 สิทธิ์ Real-time อัปเดตทันทีที่ DB เปลี่ยน
    };

    next();
});

// เส้นทางหลักของระบบโรงงาน
app.get('/', (req, res) => {
    res.render('index');
});

app.use('/wait-cut', waitCutRoutes);
app.use('/weighing', weighingRoutes);

// =========================================================
// ⚡ 9. SECTION: APPLICATION ENGINE (จุดสตาร์ตระบบเครื่องยนต์)
// =========================================================
async function startApplication() {
  try {
    console.log('🚀 กำลังสตาร์ตระบบหลังบ้านแบบไฮบริด...');

    // 1. เปิดสะพานเชื่อมต่อคลังท่อฐานข้อมูล (Database Pool) ครั้งเดียวตอนติดเครื่อง
    await initializePool();

    // 2. ทดสอบสายสัญญานเช็กการตอบสนองของ Oracle DB
    await testDatabaseConnection();

    // 3. เปิดพอร์ตรับงานอย่างเป็นทางการ (รันผ่าน IP 0.0.0.0 เพื่อให้คอมเครื่องอื่นยิงเข้าได้)
    httpServer.listen(PORT, '0.0.0.0', () => {
        console.log(`🟢 [Ready]: Server มัดใจระบบเสร็จสมบูรณ์ รันอยู่ที่พอร์ต ${PORT}`);
    });

  } catch (error) {
    console.error('💥 แอปพลิเคชันล่มสลายล้มเหลวตั้งแต่สตาร์ต:', error);
    process.exit(1); // สั่งดับเครื่องยนต์ระบบทันทีป้องกัน Data เสียหาย
  }
}

// ลุยสั่งเดินเครื่องยนต์!
startApplication();