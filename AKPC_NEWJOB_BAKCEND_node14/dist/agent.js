"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const serial_service_1 = require("./serial-service");
const print_service_1 = require("./print-service");
const bwip_js_1 = __importDefault(require("bwip-js"));
const pdf_service_1 = require("./services/pdf-service");
const promises_1 = __importDefault(require("fs/promises"));
async function generateBarcode(text) {
    try {
        const pngBuffer = await bwip_js_1.default.toBuffer({
            bcid: "code128",
            text: text,
            scale: 3,
            height: 10,
            includetext: false,
        });
        return `data:image/png;base64,${pngBuffer.toString("base64")}`;
    }
    catch (err) {
        console.error("[Barcode Error] Failed to generate barcode:", err);
        return "";
    }
}
const app = (0, express_1.default)();
// 🟢 1. ดักส่ง Header ปลดล็อก Private Network Access ให้ Chrome (แก้เรื่อง more-private address space 'local')
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Private-Network", "true"); // 👈 ตัวสำคัญสำหรับ Chrome PNA
    res.header("Access-Control-Allow-Headers", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    if (req.method === "OPTIONS") {
        return res.sendStatus(204);
    }
    next();
});
app.use(express_1.default.static('public'));
app.use((0, cors_1.default)({
    origin: "*",
    methods: ["GET", "POST"],
}));
app.use(express_1.default.json());
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});
exports.io = io;
io.on("connection", (socket) => {
    console.log(`[Socket] Web client connected, ID: ${socket.id}`);
    socket.on("disconnect", () => {
        console.log("[Socket] Web client disconnected");
    });
});
app.post("/preview-label", async (req, res) => {
    let mode = "view1";
    const { id, createdAt, part, gradeName, model, size, diameter, reelno, weight, status, remark, roll_no, } = req.body;
    let savedPdfPath;
    let res_status = "HOLD";
    if (status && status != "HOLD" && status != "Hold" && status != "hold") {
        res_status = "";
    }
    if (mode != "view") {
        try {
            const barcodeString = await generateBarcode(roll_no);
            savedPdfPath = await (0, pdf_service_1.generateLabelPdf)({
                rollNo: roll_no,
                grade: gradeName,
                size: size,
                weight: weight,
                diameter: diameter,
                date: createdAt,
                barcodeImg: barcodeString,
                status: res_status,
            });
            await print_service_1.PrintService.printPdfFile(savedPdfPath);
            try {
                await promises_1.default.unlink(savedPdfPath);
                console.log(`[Cleanup] Deleted temp file: ${savedPdfPath}`);
            }
            catch (removeErr) {
                console.warn(`[Cleanup Warning] Could not delete temp file (${savedPdfPath}):`, removeErr);
            }
            return res.status(200).json({
                success: true,
                message: `PDF generated successfully at ${savedPdfPath}`,
            });
        }
        catch (err) {
            console.error("[Label Error] Preview pipeline failed:", err);
            return res.status(500).json({ success: false, error: "PDF generation failed" });
        }
    }
    else {
        const rollNo = roll_no;
        const barcodeString = await generateBarcode(rollNo);
        res.render("./../views/label-preview.ejs", {
            rollNo: roll_no,
            grade: gradeName,
            size: size,
            weight: weight,
            diameter: diameter,
            date: createdAt,
            barcodeImg: barcodeString,
            status: res_status,
        });
    }
});
const AGENT_PORT = 4000;
httpServer
    .listen(AGENT_PORT, () => {
    console.log("===============================================");
    console.log("====== WEIGHT & PRINT AGENT IS RUNNING ======");
    console.log("Agent listening on port: 4000");
    console.log("===============================================");
})
    .on("error", (err) => {
    if (err.code === "EADDRINUSE") {
        console.error(`[Server Error] Port ${AGENT_PORT} is already in use!`);
    }
    else {
        console.error(`[Server Error] HTTP Server error: ${err.message}`);
    }
    process.exit(1);
});
serial_service_1.SerialService.initialize(io, "COM1", 2400);
//# sourceMappingURL=agent.js.map