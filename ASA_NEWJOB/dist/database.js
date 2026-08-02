"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializePool = initializePool;
exports.getConnection = getConnection;
exports.testDatabaseConnection = testDatabaseConnection;
const oracledb_1 = __importDefault(require("oracledb"));
const dotenv_1 = __importDefault(require("dotenv"));
// สั่งให้ระบบโหลดค่าจากไฟล์ .env เข้ามาใช้งาน
dotenv_1.default.config();
// ❌ ลบ oracledb.initOracleClient(); ออกแล้ว เพื่อให้วิ่งเป็น Thin Mode ตาม Default
// oracledb.initOracleClient();
// oracledb.initOracleClient({ libDir: 'C:\\oracle\\instantclient_11_2' });
let pool;
// 1. สั่งสร้างกองกลาง (Pool) ค้างไว้ตอนแอปเปิดตัวครั้งแรกครั้งเดียว
async function initializePool() {
    pool = await oracledb_1.default.createPool({
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        connectionString: process.env.DB_CONNECTION_STRING,
        poolMin: 1,
        poolMax: 4,
        poolIncrement: 1,
        // 💡 เพิ่ม 2 ออปชันนี้เพื่อป้องกันปัญหา Listener หนักใจ
        connectTimeout: 60, // ให้เวลาลองเชื่อมต่อสูงสุด 60 วินาที (ไม่ตัดสายทันทีที่เจอสะดุด)
        queueMax: 500 // ถ้าคิวยังเต็มให้รอในคิวก่อน อย่าเพิ่งพ่น Error ทันที
    });
    console.log('⚓ กองกลางท่อฐานข้อมูล (Connection Pool) พร้อมรบ!');
}
// 2. เวลาจะใช้งาน ดึงจาก Pool ออกมาใช้ พอเสร็จแล้วสั่ง .close() มันจะวิ่งกลับเข้ากองกลางทันที (ไม่ทำลายสายจริง)
async function getConnection() {
    return await pool.getConnection();
}
// ฟังก์ชันสำหรับทดสอบสับสวิตช์เช็กสายสัญญาณ
async function testDatabaseConnection() {
    let conn;
    try {
        conn = await getConnection();
        // ยิงคำสั่งทดสอบถามเวลาเครื่องระบบ Oracle
        const result = await conn.execute(`SELECT TO_CHAR(SYSDATE, 'YYYY-MM-DD HH24:MI:SS') FROM DUAL`);
        console.log('--- ⚓ สายสัญญาณฐานข้อมูลนิ่งสนิท 100% ---');
        console.log('⏰ เวลาปัจจุบันจาก Oracle DB:', result.rows?.[0]);
        console.log('-----------------------------------------');
    }
    catch (error) {
        console.error('❌ Connection Error:', error);
    }
    finally {
        if (conn) {
            try {
                await conn.close();
            }
            catch (err) {
                console.error(err);
            }
        }
    }
}
