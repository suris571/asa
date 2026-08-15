import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { SerialService } from "./serial-service";
import { PrintService } from "./print-service";

import bwipjs from "bwip-js";
import { generateLabelPdf } from "./services/pdf-service";
import fs from "fs/promises";

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
        console.error("[Barcode Error] Failed to generate barcode:", err);
        return "";
    }
}

const app = express();
app.use(express.static('public'));

app.use(
    cors({
        origin: "*",
    }),
);
app.use(express.json());

const httpServer = createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

io.on("connection", (socket) => {
    console.log(`[Socket] Web client connected, ID: ${socket.id}`);

    socket.on("disconnect", () => {
        console.log("[Socket] Web client disconnected");
    });
});

app.post("/preview-label", async (req, res) => {
    let mode = "view1";
    const {
        id,
        createdAt,
        part,
        gradeName,
        model,
        size,
        diameter,
        reelno,
        weight,
        status,
        remark,
        roll_no,
    }: any = req.body;

    let savedPdfPath;
    let res_status = "HOLD";
    if (status && status != "HOLD" && status != "Hold" && status != "hold") {
        res_status = "";
    }
    if (mode != "view") {
        try {
            const barcodeString = await generateBarcode(roll_no);
            savedPdfPath = await generateLabelPdf({
                rollNo: roll_no,
                grade: gradeName,
                size: size,
                weight: weight,
                diameter: diameter,
                date: createdAt,
                barcodeImg: barcodeString,
                status: res_status,
            });

            await PrintService.printPdfFile(savedPdfPath);

            try {
                await fs.unlink(savedPdfPath);
                console.log(`[Cleanup] Deleted temp file: ${savedPdfPath}`);
            } catch (removeErr) {
                console.warn(`[Cleanup Warning] Could not delete temp file (${savedPdfPath}):`, removeErr);
            }

            return res.status(200).json({
                success: true,
                message: `PDF generated successfully at ${savedPdfPath}`,
            });
        } catch (err) {
            console.error("[Label Error] Preview pipeline failed:", err);
            return res.status(500).json({ success: false, error: "PDF generation failed" });
        }
    } else {
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
    .on("error", (err: NodeJS.ErrnoException) => {
        if (err.code === "EADDRINUSE") {
            console.error(`[Server Error] Port ${AGENT_PORT} is already in use!`);
        } else {
            console.error(`[Server Error] HTTP Server error: ${err.message}`);
        }
        process.exit(1);
    });

export { io };
SerialService.initialize(io, "COM1", 9600);