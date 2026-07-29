"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIO = exports.broadcastNextRollToWeighingStation = exports.FnNextQcCloseReel = exports.FnNextCutSplitSet = exports.FnNextRoll = exports.initSocket = void 0;
const socket_io_1 = require("socket.io");
const wait_cut_model_1 = require("./modules/wait-cut/wait-cut.model");
const weighing_model_1 = require("./modules/weighing/weighing.model");
const crypto_1 = __importDefault(require("crypto"));
// เก็บ Hash แยกตามเครื่องจักร (เช่น { 1: 'hash_xxx', 2: 'hash_yyy' })
let lastQueueHashes = {};
// ⏳ ฟังก์ชันหลังบ้าน คอยตรวจส่อง Oracle DB แยกตามเครื่องจักร
const startQueueMonitor = (waitCutNamespace) => {
    const MONITOR_INTERVAL = 30000;
    setInterval(async () => {
        try {
            // 1. เช็กก่อนว่ามีคนเปิดหน้าเว็บต่อ Socket อยู่ไหม
            const connectedSockets = await waitCutNamespace.fetchSockets();
            if (connectedSockets.length === 0)
                return;
            // 🎯 2. ดึงรายการ Room ทั้งหมดที่ขึ้นต้นด้วย 'machine_room_' มาสร้างเป็น Set ของ Machine ID ที่ใช้งานอยู่จริง
            const activeMachineIds = new Set();
            for (const socket of connectedSockets) {
                // 🎯 ใช้ for...of อ่านจาก socket.rooms โดยตรง ไร้ปัญหา Type Error แน่นอนค่ะ
                for (const room of socket.rooms) {
                    if (room.startsWith('machine_room_')) {
                        const id = parseInt(room.replace('machine_room_', ''));
                        if (!isNaN(id))
                            activeMachineIds.add(id);
                    }
                }
            }
            // 🎯 3. วนลูปตรวจเฉพาะเครื่องที่มีคนเปิดหน้าจอทำงานอยู่จริงๆ (Dynamic 100%)
            for (const machineId of activeMachineIds) {
                const currentRawData = await wait_cut_model_1.WaitCutModel.getAllWaitingAndWeighing(null, null, null, null, null, machineId);
                const filteredDataForHash = currentRawData.map((item) => {
                    const { que, ...restOfData } = item;
                    return restOfData;
                });
                const currentHash = crypto_1.default.createHash('md5').update(JSON.stringify(filteredDataForHash)).digest('hex');
                if (currentHash !== lastQueueHashes[machineId]) {
                    console.log(`📢 [Backend Monitor] เครื่องตัด ID: ${machineId} มีข้อมูลเปลี่ยนแปลง! ยิงเตือนเฉพาะห้อง...`);
                    lastQueueHashes[machineId] = currentHash;
                    // ยิงแจ้งเตือนเฉพาะ Room ของเครื่องนั้นๆ
                    waitCutNamespace.to(`machine_room_${machineId}`).emit('queue_structure_changed', { success: true });
                }
            }
        }
        catch (error) {
            console.error("❌ เกิดข้อผิดพลาดในระบบ Monitor หลังบ้าน:", error);
        }
    }, MONITOR_INTERVAL);
};
let io;
const initSocket = (httpServer) => {
    io = new socket_io_1.Server(httpServer, {
        cors: { origin: "*", methods: ["GET", "POST"] }
    });
    // ==========================================================================
    // 🪓 ห้องที่ 1: [/socket/wait-cut]
    // ==========================================================================
    const waitCutNamespace = io.of('/socket/wait-cut');
    startQueueMonitor(waitCutNamespace);
    waitCutNamespace.on('connection', (socket) => {
        console.log('🟢 พนักงานเปิด [หน้ารอตัด] เชื่อมต่อเข้ามา ID:', socket.id);
        // 🎯 1. เมื่อเชื่อมต่อเข้ามา ให้จัด Socket เข้า Room ตามเครื่องจักรที่ส่งมาตอน Handshake หรือ Payload
        const clientProductionLineId = socket.handshake.query.productionLineId;
        if (clientProductionLineId) {
            socket.join(`machine_room_${clientProductionLineId}`);
            console.log(`📌 Socket ID: ${socket.id} เข้าสู่ Room: machine_room_${clientProductionLineId}`);
        }
        socket.on('get_filtered_queue', async (payload) => {
            try {
                // 🎯 2. รับ productionLineId เพิ่มมาจาก Payload หน้าบ้าน
                const { status, orderNo, startDate, endDate, productionLineId } = payload;
                // ส่งต่อไปยัง Parameter ตัวที่ 6 ของ Model
                const data = await wait_cut_model_1.WaitCutModel.getAllWaitingAndWeighing(null, status, orderNo, startDate, endDate, productionLineId // 👈 ยัดใส่ตำแหน่งที่ 6 ตรงนี้!
                );
                socket.emit('update_queue_table', { success: true, data: data });
            }
            catch (error) {
                socket.emit('update_queue_table', { success: false, error: error.message });
            }
        });
        socket.on('swapQueue', async (data) => {
            const { orderId, current_que, aboveOrderId, above_que, productionLineId } = data;
            console.log(`⚡️ หลังบ้านรับคำสั่งเลื่อนคิว: ID ${orderId} ปะทะ ${aboveOrderId}`);
            try {
                await wait_cut_model_1.WaitCutModel.swapQueue(orderId, current_que, aboveOrderId, above_que);
                await (0, exports.FnNextCutSplitSet)();
                await (0, exports.FnNextRoll)();
                await (0, exports.FnNextQcCloseReel)();
                // ยิงแจ้งเตือนกลับเฉพาะเครื่องตัวเอง
                if (productionLineId) {
                    waitCutNamespace.to(`machine_room_${productionLineId}`).emit('queue_structure_changed', { success: true });
                }
                else {
                    waitCutNamespace.emit('queue_structure_changed', { success: true });
                }
            }
            catch (error) {
                console.error("เกิดข้อผิดพลาดในการสลับคิว:", error);
            }
        });
        socket.on('disconnect', () => {
            console.log('🔴 พนักงานปิดหน้ารอตัด ID:', socket.id);
        });
    });
    // ==========================================================================
    // ⚖️ ห้องที่ 2: [/socket/weighing]
    // ==========================================================================
    const weighingNamespace = io.of('/socket/weighing');
    weighingNamespace.on('connection', async (socket) => {
        console.log('🟢 พนักงานเปิด [หน้าชั่งน้ำหนัก] เชื่อมต่อเข้ามา ID:', socket.id);
        socket.on('get_next_roll', async () => {
            (0, exports.FnNextRoll)();
        });
        socket.on('disconnect', () => {
            console.log('🔴 พนักงานปิดหน้าจอชั่งน้ำหนัก ID:', socket.id);
        });
    });
    // ==========================================================================
    // 🪓 ห้องที่ 3: [/socket/wait-cut/split-cut-set]
    // ==========================================================================
    const waitCutSplitSet = io.of('/socket/wait-cut/split-cut-set');
    waitCutSplitSet.on('connection', (socket) => {
        console.log('🟢 พนักงานเปิด [หน้ารอตัดแยก Set] เชื่อมต่อเข้ามา ID:', socket.id);
        socket.on('get_filtered_queue', async (payload) => {
            try {
                const { orderNo } = payload;
                const data = await wait_cut_model_1.WaitCutModel.getSplitSetQueueData(orderNo);
                socket.emit('update_queue_table', { success: true, data: data });
            }
            catch (error) {
                socket.emit('update_queue_table', { success: false, error: error.message });
            }
        });
        socket.on('disconnect', () => {
            console.log('🔴 พนักงานปิดหน้ารอตัด ID:', socket.id);
        });
    });
    // ==========================================================================
    // 🪓 ห้องที่ 4: [/socket/wait-cut/qc-close-reel]
    // ==========================================================================
    const waitCutCoseReel = io.of('/socket/wait-cut/qc-close-reel');
    waitCutCoseReel.on('connection', (socket) => {
        console.log('🟢 พนักงานเปิด [หน้า QC CLOSE REEL] เชื่อมต่อเข้ามา ID:', socket.id);
        socket.on('get_filtered_queue', async (payload) => {
            try {
                const { startDate, endDate } = payload;
                const data = await wait_cut_model_1.WaitCutModel.getQcCloseReel(null, startDate, endDate);
                socket.emit('update_queue_table', { success: true, data: data });
            }
            catch (error) {
                socket.emit('update_queue_table', { success: false, error: error.message });
            }
        });
        socket.on('disconnect', () => {
            console.log('🔴 พนักงานปิดหน้ารอตัด ID:', socket.id);
        });
    });
    return io;
};
exports.initSocket = initSocket;
const FnNextRoll = async () => {
    try {
        const data = await weighing_model_1.WeighingModel.getNextWeighing();
        console.log("📦 [FnNextRoll] ดึงข้อมูลม้วนถัดไปสำเร็จ:", data);
        const io = (0, exports.getIO)();
        if (io) {
            // 🎯 ยิงหาทุกคนที่ต่ออยู่ในท่อ /socket/weighing โดยตรง
            io.of('/socket/weighing').emit('queue_updated', { success: true, data: data });
            console.log('📢 [Socket] อัปเดตข้อมูลม้วนถัดไปให้พนักงานทุกคนเรียบร้อย');
        }
        else {
            console.warn('⚠️ [Socket Warning] ไม่พบตัวแปร io');
        }
        await (0, exports.FnNextQcCloseReel)();
    }
    catch (error) {
        console.error("❌ [FnNextRoll Error]:", error);
        const io = (0, exports.getIO)();
        if (io) {
            io.of('/socket/weighing').emit('queue_updated', { success: false, error: error.message });
        }
    }
};
exports.FnNextRoll = FnNextRoll;
const FnNextCutSplitSet = async () => {
    try {
        const io = (0, exports.getIO)();
        if (io) {
            // 🎯 ยิงหาทุกคนที่ต่ออยู่ในท่อ /socket/weighing โดยตรง
            io.of('/socket/wait-cut/split-cut-set').emit('queue_structure_changed', { success: true });
            console.log('📢 [Socket] อัปเดตข้อมูลม้วนถัดไปให้พนักงานทุกคนเรียบร้อย');
        }
        else {
            console.warn('⚠️ [Socket Warning] ไม่พบตัวแปร io');
        }
    }
    catch (error) {
        console.error("❌ [FnNextRoll Error]:", error);
        const io = (0, exports.getIO)();
        if (io) {
            io.of('/socket/weighing').emit('queue_updated', { success: false, error: error.message });
        }
    }
};
exports.FnNextCutSplitSet = FnNextCutSplitSet;
const FnNextQcCloseReel = async () => {
    try {
        const io = (0, exports.getIO)();
        if (io) {
            // 🎯 ยิงหาทุกคนที่ต่ออยู่ในท่อ /socket/weighing โดยตรง
            io.of('/socket/wait-cut/qc-close-reel').emit('queue_structure_changed', { success: true });
            console.log('📢 [Socket] อัปเดตข้อมูลม้วนถัดไปให้พนักงานทุกคนเรียบร้อย');
        }
        else {
            console.warn('⚠️ [Socket Warning] ไม่พบตัวแปร io');
        }
    }
    catch (error) {
        console.error("❌ [FnNextRoll Error]:", error);
        const io = (0, exports.getIO)();
        if (io) {
            io.of('/socket/weighing').emit('queue_updated', { success: false, error: error.message });
        }
    }
};
exports.FnNextQcCloseReel = FnNextQcCloseReel;
const broadcastNextRollToWeighingStation = (nextRollData) => {
    if (!io) {
        console.error("⚠️ ไม่สามารถปล่อยสัญญาณได้เนื่องจากระบบ Socket ยังไม่ถูกเปิดใช้งานค่ะกัปตัน!");
        return;
    }
    console.log(`📢 [Socket]: เครื่องตัดส่งสัญญาณมา! กำลังยิงรหัส ${nextRollData.roll_no} เข้าห้องชั่งน้ำหนัก...`);
    // 🎯 เจาะจงพ่นข้อมูลอีเวนต์ 'next_roll_ready_for_weighing' เข้าไปเฉพาะในห้อง /socket/weighing เท่านั้น
    io.of('/socket/weighing').emit('next_roll_ready_for_weighing', nextRollData);
};
exports.broadcastNextRollToWeighingStation = broadcastNextRollToWeighingStation;
/**
 * 📣 ฟังก์ชันแชร์ให้ Controller อื่นๆ เรียกใช้ เพื่อส่งข้อมูลเรียลไทม์ข้ามสายงาน
 */
const getIO = () => {
    if (!io) {
        throw new Error("ต้องสั่งรัน initSocket ก่อนดึงอินสแตนซ์ไปใช้งานค่ะกัปตัน!");
    }
    return io;
};
exports.getIO = getIO;
