// src/agent.ts
// pm2 startup
// pm2 unstartup
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { SerialService } from './serial-service.js';
import { PrintService } from './print-service.js';

import bwipjs from 'bwip-js';
import pt from 'pdf-to-printer';
import { generateLabelPdf } from './services/pdf-service.js';

// 1. ฟังก์ชันเสกบาร์โค้ดสากล
async function generateBarcode(text:string) {
    try {
        const pngBuffer = await bwipjs.toBuffer({
            bcid: 'code128',
            text: text,
            scale: 3,
            height: 10,
            includetext: false
        });
        return `data:image/png;base64,${pngBuffer.toString('base64')}`;
    } catch (err) {
        console.error('สร้างบาร์โค้ดล้มเหลว:', err);
        return '';
    }
}

const app = express();

// ⚓ 1. ปลดล็อก CORS เปิดสิทธิ์ให้เบราว์เซอร์หน้าเว็บหลักยิงข้ามพอร์ตมาคุยได้ไร้รอยต่อ
app.use(cors({
  origin: '*', // หรือใส่พิกัดเว็บหลักของกัปตัน เช่น 'http://localhost:3000' เพื่อความปลอดภัยสูงสุด
}));
app.use(express.json());

const httpServer = createServer(app);

// 📡 2. ประกาศตัวเปิดท่อ Socket.io Server ประจำเครื่องหน้างาน
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// ช่องทางดักฟังเมื่อหน้าเว็บ EJS ทำการต่อสายเชื่อมเน็ตเวิร์กเข้ามา
io.on('connection', (socket) => {
  console.log(`🔌 หน้าเว็บหลักสอยสายเข้ามาเชื่อมต่อจับน้ำหนักแล้ว ไอดี: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log('❌ หน้าเว็บหลักตัดสายสัญญาณการดักจับน้ำหนักไปแล้ว');
  });
});

// 🖨️ 3. เปิดประตูรับ HTTP POST (เดี๋ยวเราจะเอาตรรกะสั่งพิมพ์ PDF/A4 มาฝังตรงนี้)
app.post('/api/print-report', async (req, res) => {
  try {
    const jobData = req.body;
    console.log('📥 ได้รับคำสั่งยิงพิมพ์รายงาน A4 พร้อม Payload ข้อมูล:', jobData);
    
    // 🚀 ปลุกกระบอกสูบสั่งวาดกระดาษและส่งออกเครื่องปริ้นเตอร์ทันที
    await PrintService.generateAndPrintA4(jobData);
    
    res.status(200).json({ success: true, message: 'Agent สั่งพิมพ์รายงาน A4 ออกเครื่องพิมพ์สำเร็จแล้วครับกัปตัน' });
  } catch (error: any) {
    console.error('🔴 ฝั่ง Agent พังจังหวะรับงานพิมพ์:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});


app.get('/preview-label', async (req, res) => {

  let mode = "view1";

  if(mode != "view"){
    try {
        // const { rollNo, grade, size, weight, diameter, date } = req.body;
        const rollNo = "226002624";
        const grade = "CF150F";
        const size = "84";
        const weight = "1,768";
        const diameter = "48";
        const date = "11/01/2026";
        
        // 1. เจนบาร์โค้ดสตริงก่อน
        const barcodeString = await generateBarcode(rollNo);

        // 2. สั่งผลิต PDF ลงดิสก์เครื่องจักรดื้อๆ เลยค่ะ
        const savedPdfPath = await generateLabelPdf({
            rollNo, grade, size, weight, diameter, date,
            barcodeImg: barcodeString
        });

        // await pt.print(savedPdfPath, {
        //     // 🛡️ คอนฟิกเสริมดักทางความเพี้ยน:
        //     // หากหน้างานต้องการล็อกชื่อเครื่องปริ้นต์เจาะจง ให้เปิดคอมเมนต์บรรทัดด้านล่างนี้แล้วใส่ชื่อลงไปค่ะ
        //     // printer: "ชื่อเครื่องพิมพ์_Asia_Kraft", 
            
        //     // สั่งให้พิมพ์ขนาดจริง ห้ามย่อ/ขยายสเกลตารางเด็ดขาด เพื่อความคมชัดของบาร์โค้ด
        //     scale: "fit" 
        // } as any);

        // ตอบกลับบอกเว็บหลักพอร์ต 3000 ว่าเซฟไฟล์คาเครื่องเรียบร้อยแล้ว
        return res.status(200).json({
            success: true,
            message: `สร้างไฟล์สำเร็จที่พิกัด ${savedPdfPath}`
        });
        
    } catch (err) {
      // 🟢 แนะนำให้หยอดบรรทัดนี้เพิ่ม เพื่อเก็บหลักฐานเวลาหน้างานมีปัญหาค่ะกัปตัน
      console.error("💥 บั๊กที่ท่อส่งพรีวิว:", err); 
      return res.status(500).json({ success: false, error: 'กระบวนการปั๊ม PDF ล่ม' });
    }
  }else{
    const rollNo = "226002624"; // เลขม้วนจริงจาก Oracle
      
      // ⚓ 1. สั่งรันฟังก์ชันเสกบาร์โค้ด (อย่าลืม await เพราะมันเป็น async)
      const barcodeString = await generateBarcode(rollNo);
      res.render('./../views/label-preview.ejs',{
          rollNo: rollNo,
          grade: 'CF150F',
          size: '84',
          weight: '1,768',
          diameter: '48',
          date: '11/01/2026',
          barcodeImg: barcodeString // 👈 ยัดสตริงรูปภาพใส่ตัวแปรชื่อ barcodeImg 
      });
  }
  

    
});

// 🚀 4. สั่งให้ Agent สแตนด์บายต้อนรับสาย Hardware ที่พอร์ต 4000
const AGENT_PORT = 4000;
httpServer.listen(AGENT_PORT, () => {
  console.log(`====== ⚙️ WEIGHT & PRINT AGENT IS RUNNING ======`);
  console.log(`🟢 โปรแกรมตัวเล็กพร้อมประจำการเงียบๆ ที่พอร์ต: ${AGENT_PORT}`);
  console.log(`===============================================`);
}).on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`🔴 พอร์ต ${AGENT_PORT} ถูกใช้งานอยู่แล้ว! กรุณาปิดโปรแกรมอื่นที่ใช้พอร์ตนี้ก่อนครับ`);
  } else {
    console.error(`🔴 เกิดข้อผิดพลาดกับ HTTP Server: ${err.message}`);
  }
  process.exit(1);
});

export { io }; // ส่งออกท่อส่งสัญญาณ Socket.io ให้โมดูลอื่นๆ ในโปรเจกต์สามารถใช้งานได้
SerialService.initialize(io, 'COM1', 9600);