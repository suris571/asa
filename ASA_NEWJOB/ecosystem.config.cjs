module.exports = {
  apps: [
    {
      name: 'asa-newjob',
      script: './server.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '2G',
      kill_timeout: 3000,

      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        TZ: 'Asia/Bangkok',
      },

      // 1. กำหนดตำแหน่งเก็บเฉพาะ Error Log
      error_file: './logs/err.log',

      // 2. ปิดการเก็บบันทึก Log ปกติ (console.log)
    //   out_file: '/dev/null',      // สำหรับ Linux / Ubuntu Server
      out_file: 'NUL',         // ใช้ตัวนี้แทนถ้า Server เป็น Windows

      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};