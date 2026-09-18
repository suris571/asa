import oracledb from 'oracledb';
import dotenv from 'dotenv';


// สั่งให้ระบบโหลดค่าจากไฟล์ .env เข้ามาใช้งาน
dotenv.config();

// ❌ ลบ oracledb.initOracleClient(); ออกแล้ว เพื่อให้วิ่งเป็น Thin Mode ตาม Default
// oracledb.initOracleClient();
oracledb.initOracleClient({ libDir: 'C:\\oracle\\instantclient_12_2' });
let pool: oracledb.Pool;

// 1. สั่งสร้างกองกลาง (Pool) ค้างไว้ตอนแอปเปิดตัวครั้งแรกครั้งเดียว
export async function initializePool() {
  pool = await oracledb.createPool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectionString: process.env.DB_CONNECTION_STRING,
    poolMin: 1,
    poolMax: 4,
    poolIncrement: 1,
    connectTimeout: 60,
    queueMax: 500,

    // 🟢 แนะนำเพิ่ม 2 ค่านี่ค่ะ:
    poolPingInterval: 60, // เช็กสายล่วงหน้าก่อนแจกจ่าย connection ถ้าสายตายจะดึงสายใหม่ให้ทันที
    poolTimeout: 300,     // คืนค่าสายที่ไม่ได้ใช้งานลงให้เหลือ poolMin ทุกๆ 5 นาที
  });
  console.log('⚓ กองกลางท่อฐานข้อมูล (Connection Pool) พร้อมรบ!');
}

// 2. เวลาจะใช้งาน ดึงจาก Pool ออกมาใช้ พอเสร็จแล้วสั่ง .close() มันจะวิ่งกลับเข้ากองกลางทันที (ไม่ทำลายสายจริง)
export async function getConnection() {
  return await pool.getConnection();
}

// ฟังก์ชันสำหรับทดสอบสับสวิตช์เช็กสายสัญญาณ
export async function testDatabaseConnection() {
  let conn;
  try {
    conn = await getConnection();
    // ยิงคำสั่งทดสอบถามเวลาเครื่องระบบ Oracle
    const result = await conn.execute(`SELECT TO_CHAR(SYSDATE, 'YYYY-MM-DD HH24:MI:SS') FROM DUAL`);
    console.log('--- ⚓ สายสัญญาณฐานข้อมูลนิ่งสนิท 100% ---');
    console.log('⏰ เวลาปัจจุบันจาก Oracle DB:', result.rows?.[0]);
    console.log('-----------------------------------------');
  } catch (error) {
    console.error('❌ Connection Error:', error);
  } finally {
    if (conn) {
      try {
        await conn.close();
      } catch (err) {
        console.error(err);
      }
    }
  }
}