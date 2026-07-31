// src/agent.ts
// pm2 startup
// pm2 unstartup
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { SerialService } from "./serial-service.js";
import { PrintService } from "./print-service.js";
import bwipjs from "bwip-js";
import { generateLabelPdf } from "./services/pdf-service.js";
import fs from "fs/promises";
// 1. ฟังก์ชันเสกบาร์โค้ดสากล
async function generateBarcode(text) {
    try {
        const pngBuffer = await bwipjs.toBuffer({
            bcid: "code128",
            text: text,
            scale: 3,
            height: 10,
            includetext: false,
        });
        return `data:image/png;base64,${pngBuffer.toString("base64")}`;
    }
    catch (err) {
        console.error("สร้างบาร์โค้ดล้มเหลว:", err);
        return "";
    }
}
const app = express();
// ⚓ 1. ปลดล็อก CORS เปิดสิทธิ์ให้เบราว์เซอร์หน้าเว็บหลักยิงข้ามพอร์ตมาคุยได้ไร้รอยต่อ
app.use(cors({
    origin: "*", // หรือใส่พิกัดเว็บหลักของกัปตัน เช่น 'http://localhost:3000' เพื่อความปลอดภัยสูงสุด
}));
app.use(express.json());
const httpServer = createServer(app);
// 📡 2. ประกาศตัวเปิดท่อ Socket.io Server ประจำเครื่องหน้างาน
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});
// ช่องทางดักฟังเมื่อหน้าเว็บ EJS ทำการต่อสายเชื่อมเน็ตเวิร์กเข้ามา
io.on("connection", (socket) => {
    console.log(`🔌 หน้าเว็บหลักสอยสายเข้ามาเชื่อมต่อจับน้ำหนักแล้ว ไอดี: ${socket.id}`);
    socket.on("disconnect", () => {
        console.log("❌ หน้าเว็บหลักตัดสายสัญญาณการดักจับน้ำหนักไปแล้ว");
    });
});
app.post("/preview-label", async (req, res) => {
    let mode = "view1";
    const { id, createdAt, part, // 'บ่าย'
    gradeName, // 'CA125'
    model, // 'FF'
    size, // '46'
    diameter, // '48'
    reelno, // '113001920'
    weight, // '29.06'
    status, // 'Pass'
    remark, // '852'
    roll_no, // 2
     } = req.body;
    // const {
    //     id,
    //     createdAt,
    //     part, // 'บ่าย'
    //     gradeName, // 'CA125'
    //     model, // 'FF'
    //     size, // '46'
    //     diameter, // '48'
    //     reelno, // '113001920'
    //     weight, // '29.06'
    //     status, // 'Pass'
    //     remark, // '852'
    //     roll_no, // 2
    // } = {"id":"254","createdAt":"31/07/2026","part":"บ่าย","gradeName":"CA125","model":"FF","size":"46","diameter":"48","reelno":"113001920","weight":"29.06","status":"Pass","remark":"852","roll_no":"0123456789"}
    let savedPdfPath;
    if (mode != "view") {
        try {
            // 1. เจนบาร์โค้ดสตริงก่อน
            const barcodeString = await generateBarcode(roll_no);
            // 2. สั่งผลิต PDF ลงดิสก์เครื่องจักรดื้อๆ เลยค่ะ
            savedPdfPath = await generateLabelPdf({
                rollNo: roll_no,
                grade: gradeName,
                size: size,
                weight: weight,
                diameter: diameter,
                date: createdAt,
                barcodeImg: barcodeString, // 👈 ยัดสตริงรูปภาพใส่ตัวแปรชื่อ barcodeImg
                status: status,
            });
            await PrintService.printPdfFile(savedPdfPath);
            try {
                await fs.unlink(savedPdfPath);
                console.log(`🗑️ [Cleanup] ลบไฟล์ชั่วคราวเรียบร้อย: ${savedPdfPath}`);
            }
            catch (removeErr) {
                // ดักจับไว้เพื่อไม่ให้กระทบ Flow หลัก กรณีไฟล์โดน lock หรือหาไม่เจอ
                console.warn(`⚠️ ไม่สามารถลบไฟล์ชั่วคราวได้ (${savedPdfPath}):`, removeErr);
            }
            // ตอบกลับบอกเว็บหลักพอร์ต 3000 ว่าเซฟไฟล์คาเครื่องเรียบร้อยแล้ว
            return res.status(200).json({
                success: true,
                message: `สร้างไฟล์สำเร็จที่พิกัด ${savedPdfPath}`,
            });
        }
        catch (err) {
            // 🟢 แนะนำให้หยอดบรรทัดนี้เพิ่ม เพื่อเก็บหลักฐานเวลาหน้างานมีปัญหาค่ะกัปตัน
            console.error("💥 บั๊กที่ท่อส่งพรีวิว:", err);
            return res.status(500).json({ success: false, error: "กระบวนการปั๊ม PDF ล่ม" });
        }
    }
    else {
        const rollNo = roll_no; // เลขม้วนจริงจาก Oracle
        // ⚓ 1. สั่งรันฟังก์ชันเสกบาร์โค้ด (อย่าลืม await เพราะมันเป็น async)
        const barcodeString = await generateBarcode(rollNo);
        res.render("./../views/label-preview.ejs", {
            rollNo: roll_no,
            grade: gradeName,
            size: size,
            weight: weight,
            diameter: diameter,
            date: createdAt,
            barcodeImg: barcodeString, // 👈 ยัดสตริงรูปภาพใส่ตัวแปรชื่อ barcodeImg
            status: status,
        });
    }
});
// 🚀 4. สั่งให้ Agent สแตนด์บายต้อนรับสาย Hardware ที่พอร์ต 4000
const AGENT_PORT = 4000;
httpServer
    .listen(AGENT_PORT, () => {
    console.log(`====== ⚙️ WEIGHT & PRINT AGENT IS RUNNING ======`);
    console.log(`🟢 โปรแกรมตัวเล็กพร้อมประจำการเงียบๆ ที่พอร์ต: ${AGENT_PORT}`);
    console.log(`===============================================`);
})
    .on("error", (err) => {
    if (err.code === "EADDRINUSE") {
        console.error(`🔴 พอร์ต ${AGENT_PORT} ถูกใช้งานอยู่แล้ว! กรุณาปิดโปรแกรมอื่นที่ใช้พอร์ตนี้ก่อนครับ`);
    }
    else {
        console.error(`🔴 เกิดข้อผิดพลาดกับ HTTP Server: ${err.message}`);
    }
    process.exit(1);
});
export { io }; // ส่งออกท่อส่งสัญญาณ Socket.io ให้โมดูลอื่นๆ ในโปรเจกต์สามารถใช้งานได้
SerialService.initialize(io, "COM1", 9600);
//# sourceMappingURL=agent.js.map