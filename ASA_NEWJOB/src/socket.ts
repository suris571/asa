import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HTTPServer } from "http";
import { WaitCutModel } from "./modules/wait-cut/wait-cut.model";
import { WeighingModel } from "./modules/weighing/weighing.model";
import crypto from "crypto";

// เก็บ Hash แยกตามเครื่องจักร (เช่น { 1: 'hash_xxx', 2: 'hash_yyy' })
let lastQueueHashes: { [key: number]: string } = {};

// ⏳ ฟังก์ชันหลังบ้าน คอยตรวจส่อง Oracle DB แยกตามเครื่องจักร
const startQueueMonitor = (waitCutNamespace: any) => {
    const MONITOR_INTERVAL = 30000;

    setInterval(async () => {
        try {
            // 1. เช็กก่อนว่ามีคนเปิดหน้าเว็บต่อ Socket อยู่ไหม
            const connectedSockets = await waitCutNamespace.fetchSockets();
            if (connectedSockets.length === 0) return;

            // 🎯 2. ดึงรายการ Room ทั้งหมดที่ขึ้นต้นด้วย 'machine_room_' มาสร้างเป็น Set ของ Machine ID ที่ใช้งานอยู่จริง
            const activeMachineIds = new Set<number>();

            for (const socket of connectedSockets) {
                // 🎯 ใช้ for...of อ่านจาก socket.rooms โดยตรง ไร้ปัญหา Type Error แน่นอนค่ะ
                for (const room of socket.rooms) {
                    if (room.startsWith("machine_room_")) {
                        const id = parseInt(room.replace("machine_room_", ""));
                        if (!isNaN(id)) activeMachineIds.add(id);
                    }
                }
            }

            // 🎯 3. วนลูปตรวจเฉพาะเครื่องที่มีคนเปิดหน้าจอทำงานอยู่จริงๆ (Dynamic 100%)
            for (const machineId of activeMachineIds) {
                const currentRawData = await WaitCutModel.getAllWaitingAndWeighing(null, null, null, null, null, machineId);

                const filteredDataForHash = currentRawData.map((item: any) => {
                    const { que, ...restOfData } = item;
                    return restOfData;
                });

                const currentHash = crypto.createHash("md5").update(JSON.stringify(filteredDataForHash)).digest("hex");

                if (currentHash !== lastQueueHashes[machineId]) {
                    console.log(`📢 [Backend Monitor] เครื่องตัด ID: ${machineId} มีข้อมูลเปลี่ยนแปลง! ยิงเตือนเฉพาะห้อง...`);

                    lastQueueHashes[machineId] = currentHash;

                    // ยิงแจ้งเตือนเฉพาะ Room ของเครื่องนั้นๆ
                    waitCutNamespace.to(`machine_room_${machineId}`).emit("queue_structure_changed", { success: true });
                }
            }
        } catch (error) {
            console.error("❌ เกิดข้อผิดพลาดในระบบ Monitor หลังบ้าน:", error);
        }
    }, MONITOR_INTERVAL);
};

function setupMachineRoom(socket: Socket, namespaceName: string): string | null {
    // 1. ดึง productionLineId จาก query (หรือ fallback ไปที่ auth)
    const productionLineId = (socket.handshake.query.productionLineId || socket.handshake.auth?.productionLineId) as string | null;

    if (productionLineId) {
        const roomName = `machine_room_${productionLineId}`;
        socket.join(roomName);
        console.log(`📌 [${namespaceName}] Socket ID: ${socket.id} เข้าสู่ Room: ${roomName}`); 
        return productionLineId;
    }

    console.warn(`⚠️ [${namespaceName}] Socket ID: ${socket.id} เชื่อมต่อโดยไม่มี productionLineId`);
    return null;
}

let io: SocketIOServer;

export const initSocket = (httpServer: HTTPServer): SocketIOServer => {
    io = new SocketIOServer(httpServer, {
        cors: { origin: "*", methods: ["GET", "POST"] },
    });

    // ==========================================================================
    // 🪓 ห้องที่ 1: [/socket/wait-cut]
    // ==========================================================================
    const waitCutNamespace = io.of("/socket/wait-cut");
    startQueueMonitor(waitCutNamespace);

    waitCutNamespace.on("connection", (socket: Socket) => {
        console.log("🟢 พนักงานเปิด [หน้ารอตัด] เชื่อมต่อเข้ามา ID:", socket.id);

        // 🎯 เรียกใช้ฟังก์ชันกลาง: ดึง ID เครื่อง และจับเข้า Room อัตโนมัติ
        const currentLineId = setupMachineRoom(socket, "/socket/wait-cut");
        // {startDate: null, endDate: null, status: 'ALL', orderNo: null, productionLineId: '161'}
        socket.on("get_filtered_queue", async (payload) => {
            try {
                // ใช้ currentLineId จาก connection หรือ payload ก็ได้
                const { status, orderNo, startDate, endDate, productionLineId } = payload;
                const targetLineId = productionLineId || currentLineId;
                console.log(`📌 [Socket] ดึงข้อมูลคิวรอตัด ${JSON.stringify(payload)}`);
                const data = await WaitCutModel.getAllWaitingAndWeighing(null, status, orderNo, startDate, endDate, targetLineId);

                socket.emit("update_queue_table", { success: true, data: data });
            } catch (error: any) {
                socket.emit("update_queue_table", { success: false, error: error.message });
            }
        });

        socket.on("swapQueue", async (data) => {
            const { orderId, current_que, aboveOrderId, above_que, productionLineId } = data;
            const targetLineId = productionLineId || currentLineId;

            try {
                await WaitCutModel.swapQueue(orderId, current_que, aboveOrderId, above_que);

                FnNextCutSplitSet(targetLineId);
                FnNextRoll(targetLineId);
                FnNextQcCloseReel(targetLineId);

                // 🎯 Broadcast แจ้งเตือนยิงเฉพาะ Room ของเครื่องนั้น
                const targetRoom = targetLineId ? waitCutNamespace.to(`machine_room_${targetLineId}`) : waitCutNamespace;
                targetRoom.emit("queue_structure_changed", { success: true });
            } catch (error) {
                console.error("เกิดข้อผิดพลาดในการสลับคิว:", error);
            }
        });

        socket.on("disconnect", () => {
            console.log("🔴 พนักงานปิดหน้ารอตัด ID:", socket.id);
        });
    });

    // ==========================================================================
    // ⚖️ ห้องที่ 2: [/socket/weighing]
    // ==========================================================================
    const weighingNamespace = io.of("/socket/weighing");
    weighingNamespace.on("connection", async (socket: Socket) => {
        console.log("🟢 พนักงานเปิด [หน้าชั่งน้ำหนัก] เชื่อมต่อเข้ามา ID:", socket.id);
        const currentLineId:any = setupMachineRoom(socket, "/socket/weighing");

        socket.on("get_next_roll", async () => {
            FnNextRoll(currentLineId);
        });

        socket.on("GetHistoryWeight", async (payload) => {
            const { rollNO , startDate, endDate } = payload;
            const productionLineId:any = currentLineId;
            const data = await WeighingModel.getNextWeighing(productionLineId, null, 'history', rollNO, startDate, endDate);
            socket.emit("update_history_table", { success: true, data: data });
        });

        socket.on("disconnect", () => {
            console.log("🔴 พนักงานปิดหน้าจอชั่งน้ำหนัก ID:", socket.id);
        });
    });

    // ==========================================================================
    // 🪓 ห้องที่ 3: [/socket/wait-cut/split-cut-set] (ปรับปรุงใหม่ตามที่สั่ง)
    // ==========================================================================
    const waitCutSplitSet = io.of("/socket/wait-cut/split-cut-set");

    waitCutSplitSet.on("connection", (socket: Socket) => {
        console.log("🟢 พนักงานเปิด [หน้ารอตัดแยก Set] เชื่อมต่อเข้ามา ID:", socket.id);

        // 🎯 เรียกใช้ฟังก์ชันกลางเช่นกัน
        const currentLineId = setupMachineRoom(socket, "/socket/wait-cut/split-cut-set");

        socket.on("get_filtered_queue", async (payload) => {
            try {
                const { orderNo, productionLineId , status , startDate, endDate } = payload;
                // ดึง lineId จาก payload หรือใช้ค่าที่ได้ตอนเชื่อมต่อ
                const targetLineId = productionLineId || currentLineId;
                console.log(`📌 [Socket] ดึงข้อมูลคิวรอตัดแยก Set ${JSON.stringify(payload)}`);
                // 🎯 เรียก Model ตัวใหม่ที่เราเพิ่ม pl_production_line_id เรียบร้อยแล้ว
                const data = await WaitCutModel.getSplitSetQueueData(orderNo, targetLineId, status, startDate, endDate);

                socket.emit("update_queue_table", { success: true, data: data });
            } catch (error: any) {
                socket.emit("update_queue_table", { success: false, error: error.message });
            }
        });

        socket.on("disconnect", () => {
            console.log("🔴 พนักงานปิดหน้ารอตัดแยก Set ID:", socket.id);
        });
    });

    // ==========================================================================
    // 🪓 ห้องที่ 4: [/socket/wait-cut/qc-close-reel]
    // ==========================================================================
    const waitCutCoseReel = io.of("/socket/wait-cut/qc-close-reel");
    waitCutCoseReel.on("connection", (socket: Socket) => {
        console.log("🟢 พนักงานเปิด [หน้า QC CLOSE REEL] เชื่อมต่อเข้ามา ID:", socket.id);
        const currentLineId = setupMachineRoom(socket, "/socket/wait-cut/qc-close-reel");
        socket.on("get_filtered_queue", async (payload) => {
            try {
                const { startDate, endDate , status, orderNo } = payload;
                console.log(`📌 [Socket] ดึงข้อมูลคิว QC CLOSE REEL ${JSON.stringify(payload)}`);
                const data = await WaitCutModel.getQcCloseReel(orderNo, startDate, endDate,currentLineId,status);

                socket.emit("update_queue_table", { success: true, data: data });
            } catch (error: any) {
                socket.emit("update_queue_table", { success: false, error: error.message });
            }
        });

        socket.on("disconnect", () => {
            console.log("🔴 พนักงานปิดหน้ารอตัด ID:", socket.id);
        });
    });

    return io;
};

export const FnNextRoll = async (productionLineId: string | number) => {
    try {
        // 🎯 ดึงข้อมูลม้วนถัดไปเฉพาะเครื่องนั้นๆ
        const data = await WeighingModel.getNextWeighing(productionLineId);
        console.log(`📦 [FnNextRoll] ดึงข้อมูลม้วนถัดไปสำเร็จ (Line: ${productionLineId || 'ALL'}):`, data);

        const io = getIO();
        if (io) {
            const weighingNamespace = io.of("/socket/weighing");
            
            // 🎯 ถ้าระบุเครื่อง ให้ยิงเฉพาะ Room เครื่องนั้น ถ้านี้ไม่มีให้ยิงทั้งหมด
            const targetRoom = productionLineId 
                ? weighingNamespace.to(`machine_room_${productionLineId}`) 
                : weighingNamespace;

            targetRoom.emit("queue_updated", { success: true, data: data });
            console.log(`📢 [Socket] อัปเดตข้อมูลม้วนถัดไป (Line: ${productionLineId || 'ALL'}) เรียบร้อย`);
        } else {
            console.warn("⚠️ [Socket Warning] ไม่พบตัวแปร io");
        }

        // 🎯 ส่งต่อ ID เครื่องไปให้ QC ด้วย
        await FnNextQcCloseReel();
    } catch (error: any) {
        console.error("❌ [FnNextRoll Error]:", error);

        const io = getIO();
        if (io) {
            const weighingNamespace = io.of("/socket/weighing");
            const targetRoom = productionLineId 
                ? weighingNamespace.to(`machine_room_${productionLineId}`) 
                : weighingNamespace;

            targetRoom.emit("queue_updated", { success: false, error: error.message });
        }
    }
};

/**
 * 🪓 อัปเดตคิวแยก Set (แยกตามเครื่อง)
 */
export const FnNextCutSplitSet = async (productionLineId: string | number) => {
    try {
        const io = getIO();
        if (io) {
            const splitSetNamespace = io.of("/socket/wait-cut/split-cut-set");

            // 🎯 ยิงเฉพาะ Room เครื่องนั้น
            const targetRoom = productionLineId 
                ? splitSetNamespace.to(`machine_room_${productionLineId}`) 
                : splitSetNamespace;

            targetRoom.emit("queue_structure_changed", { success: true });
            console.log(`📢 [Socket] อัปเดตคิวแยก Set (Line: ${productionLineId || 'ALL'}) เรียบร้อย`);
        } else {
            console.warn("⚠️ [Socket Warning] ไม่พบตัวแปร io");
        }
    } catch (error: any) {
        console.error("❌ [FnNextCutSplitSet Error]:", error);

        const io = getIO();
        if (io) {
            const splitSetNamespace = io.of("/socket/wait-cut/split-cut-set");
            const targetRoom = productionLineId 
                ? splitSetNamespace.to(`machine_room_${productionLineId}`) 
                : splitSetNamespace;

            targetRoom.emit("queue_structure_changed", { success: false, error: error.message });
        }
    }
};

export const FnNextQcCloseReel = async (productionLineId?: string | number) => {
    try {
        const io = getIO();
        if (io) {
            // 🎯 ยิงหาทุกคนที่ต่ออยู่ในท่อ /socket/weighing โดยตรง
            const qcCloseReelNamespace = io.of("/socket/wait-cut/qc-close-reel");
            const targetRoom = productionLineId 
                ? qcCloseReelNamespace.to(`machine_room_${productionLineId}`) 
                : qcCloseReelNamespace;
            targetRoom.emit("queue_structure_changed", { success: true });
            console.log("📢 [Socket] อัปเดตข้อมูลม้วนถัดไปให้พนักงานทุกคนเรียบร้อย");
        } else {
            console.warn("⚠️ [Socket Warning] ไม่พบตัวแปร io");
        }
    } catch (error: any) {
        console.error("❌ [FnNextQcCloseReel Error]:", error);

        const io = getIO();
        if (io) {
            const qcCloseReelNamespace = io.of("/socket/wait-cut/qc-close-reel");
            const targetRoom = productionLineId 
                ? qcCloseReelNamespace.to(`machine_room_${productionLineId}`) 
                : qcCloseReelNamespace;
            targetRoom.emit("queue_structure_changed", { success: false, error: error.message });
        }
    }
};

export const broadcastNextRollToWeighingStation = (nextRollData: any): void => {
    if (!io) {
        console.error("⚠️ ไม่สามารถปล่อยสัญญาณได้เนื่องจากระบบ Socket ยังไม่ถูกเปิดใช้งานค่ะกัปตัน!");
        return;
    }

    console.log(`📢 [Socket]: เครื่องตัดส่งสัญญาณมา! กำลังยิงรหัส ${nextRollData.roll_no} เข้าห้องชั่งน้ำหนัก...`);

    // 🎯 เจาะจงพ่นข้อมูลอีเวนต์ 'next_roll_ready_for_weighing' เข้าไปเฉพาะในห้อง /socket/weighing เท่านั้น
    io.of("/socket/weighing").emit("next_roll_ready_for_weighing", nextRollData);
};

/**
 * 📣 ฟังก์ชันแชร์ให้ Controller อื่นๆ เรียกใช้ เพื่อส่งข้อมูลเรียลไทม์ข้ามสายงาน
 */
export const getIO = (): SocketIOServer => {
    if (!io) {
        throw new Error("ต้องสั่งรัน initSocket ก่อนดึงอินสแตนซ์ไปใช้งานค่ะกัปตัน!");
    }
    return io;
};
