// ecosystem.config.cjs
// PM2 Config สำหรับรัน Weight & Print Agent บนเครื่องหน้างาน
// วิธีใช้งาน:
//   1. npm run build          ← compile TypeScript → dist/
//   2. npm install -g pm2     ← ติดตั้ง PM2 ครั้งเดียว
//   3. pm2 start ecosystem.config.cjs
//   4. pm2 save               ← บันทึก process list
//   5. pm2 startup            ← ตั้ง auto start ตอน Windows บูต (ทำตาม command ที่มันบอก)

module.exports = {
  apps: [
    {
      name: 'weight-agent',         // ชื่อ process ใน PM2
      script: './dist/agent.js',    // ไฟล์หลังจาก build แล้ว
      
      // 🔁 Auto Restart Settings
      watch: false,                 // ไม่ต้อง watch file เพราะเป็น production
      autorestart: true,            // restart อัตโนมัติถ้า crash
      max_restarts: 10,             // restart ได้สูงสุด 10 ครั้ง ถ้าเกินแสดงว่ามีปัญหาใหญ่
      min_uptime: '5s',             // ต้องรันอยู่อย่างน้อย 5 วิ ถึงจะนับว่า start สำเร็จ
      restart_delay: 3000,          // รอ 3 วิก่อน restart ป้องกัน restart loop เร็วเกินไป

      // 📋 Log Settings
      out_file: './logs/agent-out.log',   // log ปกติ
      error_file: './logs/agent-err.log', // log error
      log_date_format: 'YYYY-MM-DD HH:mm:ss', // format วันที่ใน log

      // 🌍 Environment
      env: {
        NODE_ENV: 'production',
      }
    }
  ]
};
