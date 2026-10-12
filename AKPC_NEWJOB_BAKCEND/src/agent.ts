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
import { SlitterService } from "./slitter/slitter-service.js"; // 👈 1. Import เพิ่ม
import fs from "fs/promises";



// 1. ฟังก์ชันเสกบาร์โค้ดสากล
async function generateBarcode(text: string) {
    try {
        const pngBuffer = await bwipjs.toBuffer({
            bcid: "code128",
            text: text,
            scale: 3,
            height: 10,
            includetext: false,
        });
        return `data:image/png;base64,${pngBuffer.toString("base64")}`;
    } catch (err) {
        console.error("สร้างบาร์โค้ดล้มเหลว:", err);
        return "";
    }
}

const app = express();
app.use(express.static("public")); // ⚓ 0. เปิดสิทธิ์ให้หน้าเว็บหลักเข้าถึงไฟล์ EJS ได้

// ⚓ 1. ปลดล็อก CORS เปิดสิทธิ์ให้เบราว์เซอร์หน้าเว็บหลักยิงข้ามพอร์ตมาคุยได้ไร้รอยต่อ
app.use(
    cors({
        origin: "*", // หรือใส่พิกัดเว็บหลักของกัปตัน เช่น 'http://localhost:3000' เพื่อความปลอดภัยสูงสุด
    }),
);
app.use(express.json());

const httpServer = createServer(app);

app.get("/preview-label", async (req, res) => {
    let mode = "view";
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
    // }:any = req.body;
    const {
        id,
        createdAt,
        part, // 'บ่าย'
        gradeName, // 'CA125'
        model, // 'F'
        size, // '46'
        diameter, // '48'
        reelno, // '113001920'
        weight, // '29.06'
        status, // 'Pass'
        remark, // '852'
        roll_no, // 2
    } = {
        id: "254",
        createdAt: "31/07/2026",
        part: "บ่าย",
        gradeName: "CA125",
        model: "FF",
        size: "46",
        diameter: "48",
        reelno: "113001920",
        weight: "29.06",
        status: "Pass",
        remark: "852",
        roll_no: "0123456789",
    };

    let savedPdfPath;
    let res_status = "HOLD";
    if (status && status != "HOLD" && status != "Hold" && status != "hold") {
        res_status = "";
    }
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
                status: res_status,
                model: model,
            });

            await PrintService.printPdfFile(savedPdfPath);

            try {
                await fs.unlink(savedPdfPath);
                console.log(`🗑️ [Cleanup] ลบไฟล์ชั่วคราวเรียบร้อย: ${savedPdfPath}`);
            } catch (removeErr) {
                // ดักจับไว้เพื่อไม่ให้กระทบ Flow หลัก กรณีไฟล์โดน lock หรือหาไม่เจอ
                console.warn(`⚠️ ไม่สามารถลบไฟล์ชั่วคราวได้ (${savedPdfPath}):`, removeErr);
            }

            // ตอบกลับบอกเว็บหลักพอร์ต 3000 ว่าเซฟไฟล์คาเครื่องเรียบร้อยแล้ว
            return res.status(200).json({
                success: true,
                message: `สร้างไฟล์สำเร็จที่พิกัด ${savedPdfPath}`,
            });
        } catch (err) {
            // 🟢 แนะนำให้หยอดบรรทัดนี้เพิ่ม เพื่อเก็บหลักฐานเวลาหน้างานมีปัญหาค่ะกัปตัน
            console.error("💥 บั๊กที่ท่อส่งพรีวิว:", err);
            return res.status(500).json({ success: false, error: "กระบวนการปั๊ม PDF ล่ม" });
        }
    } else {
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
            status: res_status,
            model: model,
        });
    }
});

// 🚀 4. สั่งให้ Agent สแตนด์บายต้อนรับสาย Hardware ที่พอร์ต 4000
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

SerialService.initialize(io, "COM1", 9600);
SlitterService.initialize(io);
SlitterService.connect();

// 2. ทดลองยิงเฉพาะคำสั่งเซตสเปก R04 คำสั่งเดียวก่อน
setTimeout(async () => {
    console.log('\n🚀 [TEST] --- เริ่มทดสอบยิงคำสั่ง R04 (Set Spec) ---');

    const mockPayload = {
        seqNo: '02',
        orderId: '1052',       // ID ของ pl_cut_split_set
        length: 3500,          // ความยาว 3,500 เมตร
        makeCnt: 5,            // จำนวน 5 ชุด
        blades: [500, 500, 1000, 0, 0, 0, 0, 0, 0, 0] // ระยะมีด W1 - W10
    };

    try {
        console.log('🧪 กำลังส่งคำสั่ง R04 ออกไปหาเครื่องตัด...');
        const result = await SlitterService.setSpec(mockPayload);
        console.log('✅ [SUCCESS] เครื่องตัดตอบ ACK P04 กลับมาสำเร็จ!:', result);
    } catch (err: any) {
        console.error('❌ [FAILED] เกิดข้อผิดพลาด:', err.message);
    }
}, 2000);

// ช่องทางดักฟังเมื่อหน้าเว็บ EJS ทำการต่อสายเชื่อมเน็ตเวิร์กเข้ามา
io.on("connection", (socket) => {
    const clientCount = io.engine.clientsCount;
    console.log(`🔌 [Socket] Web client connected, ID: ${socket.id} | Active clients: ${clientCount}`);

    if (clientCount > 0) {
        SerialService.openPort();
    }

// =========================================================
    // ✂️ SECTION: SLITTER MACHINE EVENTS (เครื่องตัด YUELI)
    // =========================================================

    /**
     * 1. ดักรับคำสั่งเซตสเปกคิวงานตัด (R04) จากหน้าเว็บ
     * Payload: { seqNo, splitSetId, length, makeCnt, blades }
     */
    socket.on("slitter_set_spec", async (payload: any, ackCallback?: (res: any) => void) => {
        try {
            console.log("📩 [Agent Received slitter_set_spec]:", payload);

            // ใช้ splitSetId จากหน้าเว็บ เป็น orderId สื่อสารกับเครื่องตัดได้เลย
            const specData = {
                seqNo: payload.seqNo,                      // '02' - '05'
                orderId: String(payload.splitSetId),       // เช่น '1052'
                length: Number(payload.length || 0),
                makeCnt: Number(payload.makeCnt || 0),
                blades: payload.blades || []               // Array [w1..w10]
            };

            // ยิงส่งเข้า SlitterService ไปออกสาย TCP พอร์ต 8000
            const result = await SlitterService.setSpec(specData);

            // ตอบ Confirm ผลลัพธ์กลับไปหาหน้าเว็บ
            if (ackCallback) {
                ackCallback({ success: true, data: result });
            }
        } catch (error: any) {
            console.error("❌ [Agent Error - slitter_set_spec]:", error.message);
            if (ackCallback) {
                ackCallback({ success: false, error: error.message });
            }
        }
    });

    socket.on("disconnect", () => {
        const remainingClients = io.engine.clientsCount;
        // console.log(`❌ [Socket] Web client disconnected, ID: ${socket.id} | Remaining clients: ${remainingClients}`);

        // สั่งปิด COM1 คืนพอร์ตทันทีเมื่อคนใช้งานเหลือ 0
        if (remainingClients === 0) {
            SerialService.closePort();
        }
    });
});

const AGENT_PORT = 4000;
httpServer
    .listen(AGENT_PORT, () => {
        console.log(`====== ⚙️ WEIGHT & PRINT AGENT IS RUNNING ======`);
        console.log(`🟢 โปรแกรมตัวเล็กพร้อมประจำการเงียบๆ ที่พอร์ต: ${AGENT_PORT}`);
        console.log(`===============================================`);
    })
    .on("error", (err: NodeJS.ErrnoException) => {
        if (err.code === "EADDRINUSE") {
            console.error(`🔴 พอร์ต ${AGENT_PORT} ถูกใช้งานอยู่แล้ว! กรุณาปิดโปรแกรมอื่นที่ใช้พอร์ตนี้ก่อนครับ`);
        } else {
            console.error(`🔴 เกิดข้อผิดพลาดกับ HTTP Server: ${err.message}`);
        }
        process.exit(1);
    });

export { io }; // ส่งออกท่อส่งสัญญาณ Socket.io ให้โมดูลอื่นๆ ในโปรเจกต์สามารถใช้งานได้






process.on("uncaughtException", (err) => {
    console.error("💥 [Global Guard] Uncaught Exception Detected:", err.message);
});

process.on("unhandledRejection", (reason, promise) => {
    console.error("💥 [Global Guard] Unhandled Rejection at:", promise, "reason:", reason);
});