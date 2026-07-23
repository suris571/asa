"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIO = exports.broadcastNextRollToWeighingStation = exports.FnNextCutSplitSet = exports.FnNextRoll = exports.initSocket = void 0;
const socket_io_1 = require("socket.io");
const wait_cut_model_1 = require("./modules/wait-cut/wait-cut.model");
const weighing_model_1 = require("./modules/weighing/weighing.model");
const crypto_1 = __importDefault(require("crypto"));
let lastQueueHash = '';
// ⏳ ฟังก์ชันหลังบ้าน คอยตรวจส่อง Oracle DB (รันทำงานอัตโนมัติรอบเดียวสั่งการยาว)
const startQueueMonitor = (waitCutNamespace) => {
    const MONITOR_INTERVAL = 30000; // 🎯 วิ่งไปถามเบสทุก ๆ 30 วินาที (ปรับเพิ่ม/ลดได้ตามความเหมาะสม)
    setInterval(async () => {
        try {
            // เช็กก่อนว่ามีคนเปิดหน้าเว็บสแตนด์บายอยู่ใน Namespace ไหม (ถ้าไม่มีใครเปิดอยู่เลย ก็ไม่ต้อง Query ให้เปลืองแรง)
            const connectedSockets = await waitCutNamespace.fetchSockets();
            if (connectedSockets.length === 0)
                return;
            // 1. หลังบ้านทำหน้าที่เป็นตัวแทนหมู่บ้าน วิ่งไปดึงคิวงานทั้งหมดจาก Oracle
            const currentRawData = await wait_cut_model_1.WaitCutModel.getAllWaitingAndWeighing();
            // 2. 🎯 ไม้ตายตามสั่งกัปตัน: ลอกคราบข้อมูล กรองฟิลด์ที่มีท่อตัวเองอยู่แล้วออกไปก่อนทำ Hash
            // กรองเอา 'que' (เลขคิวสลับ) และ 'status' (สถานะงาน) ออกไป เพื่อป้องกันท่อยิงซ้ำซ้อน
            const filteredDataForHash = currentRawData.map((item) => {
                const { que, cut_status_id, ...restOfData } = item;
                return restOfData; // เหลือไว้เฉพาะข้อมูลเชิงโครงสร้าง เช่น orderNo, ITEM, ขนาดใบมีด
            });
            // 3. ทำ Hash จากข้อมูลที่กรองแล้ว
            const currentHash = crypto_1.default.createHash('md5').update(JSON.stringify(filteredDataForHash)).digest('hex');
            // 3. 🎯 จุดตัดตัดสินใจ: เปรียบเทียบกับลายนิ้วมือรอบที่แล้ว
            if (currentHash !== lastQueueHash) {
                console.log("📢 [Backend Monitor] ตรวจพบข้อมูลใน Oracle เปลี่ยนแปลง! กำลังส่งสัญญาณเตือนหน้าบ้าน...");
                // อัปเดตลายนิ้วมือล่าสุดเก็บไว้
                lastQueueHash = currentHash;
                // 🚀 ตะโกนบอกหน้าบ้านทุกคนทันทีว่า "ข้อมูลเปลี่ยนแล้วโว้ย!"
                waitCutNamespace.emit('queue_structure_changed', { success: true });
            }
            else {
                // ข้อมูลเหมือนเดิม นิ่งเงียบไว้ ถนอม Network Traffic
                console.log("💤 [Backend Monitor] ข้อมูลใน Oracle ยังเหมือนเดิม ไม่มีอะไรเปลี่ยนแปลง");
            }
        }
        catch (error) {
            console.error("❌ เกิดข้อผิดพลาดในระบบ Monitor หลังบ้าน:", error);
        }
    }, MONITOR_INTERVAL);
};
// ประกาศตัวแปรระดับ Global ภายในไฟล์นี้ เพื่อให้ฟังก์ชันข้างนอกเรียกส่งของได้
let io;
const initSocket = (httpServer) => {
    io = new socket_io_1.Server(httpServer, {
        cors: { origin: "*", methods: ["GET", "POST"] }
    });
    // ==========================================================================
    // 🪓 ห้องที่ 1: [/socket/wait-cut] สำหรับหน้ารอตัด (กั้นพื้นที่ให้โค้ดเดิม)
    // ==========================================================================
    const waitCutNamespace = io.of('/socket/wait-cut');
    startQueueMonitor(waitCutNamespace);
    waitCutNamespace.on('connection', (socket) => {
        console.log('🟢 พนักงานหน้างานเปิด [หน้ารอตัด] เชื่อมต่อเข้ามา ID:', socket.id);
        socket.on('get_filtered_queue', async (payload) => {
            try {
                const { status, orderNo, startDate, endDate } = payload;
                const data = await wait_cut_model_1.WaitCutModel.getAllWaitingAndWeighing(null, status, orderNo, startDate, endDate);
                socket.emit('update_queue_table', { success: true, data: data }); // 🎯 ใช้ชื่อท่อเดิมได้เลย
            }
            catch (error) {
                socket.emit('update_queue_table', { success: false, error: error.message });
            }
        });
        socket.on('swapQueue', async (data) => {
            const { orderId, current_que, aboveOrderId, above_que } = data;
            console.log(`⚡️ หลังบ้านรับคำสั่งเลื่อนคิว: ID ${orderId} ปะทะ ${aboveOrderId}`);
            try {
                await wait_cut_model_1.WaitCutModel.swapQueue(orderId, current_que, aboveOrderId, above_que);
                await (0, exports.FnNextCutSplitSet)();
                await (0, exports.FnNextRoll)();
                console.log("ddddddddddddddddddddddddddddddd");
                waitCutNamespace.emit('queue_structure_changed', { success: true });
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
    // ⚖️ ห้องที่ 2: [/socket/weighing] สำหรับหน้าชั่งน้ำหนัก (เปิดท่อปล่อยข้อมูล)
    // ==========================================================================
    const weighingNamespace = io.of('/socket/weighing');
    weighingNamespace.on('connection', async (socket) => {
        console.log('🟢 พนักงานหน้างานเปิด [หน้าชั่งน้ำหนัก] เชื่อมต่อเข้ามา ID:', socket.id);
        socket.on('get_next_roll', async () => {
            console.log('socket');
            (0, exports.FnNextRoll)();
        });
        socket.on('disconnect', () => {
            console.log('🔴 พนักงานปิดหน้าจอชั่งน้ำหนัก ID:', socket.id);
        });
    });
    // ==========================================================================
    // 🪓 ห้องที่ 3: [/socket/wait-cut/split-cut-set] สำหรับหน้ารอตัดแยก set
    // ==========================================================================
    const waitCutSplitSet = io.of('/socket/wait-cut/split-cut-set');
    waitCutSplitSet.on('connection', (socket) => {
        console.log('🟢 พนักงานหน้างานเปิด [หน้ารอตัด] เชื่อมต่อเข้ามา ID:', socket.id);
        socket.on('get_filtered_queue', async (payload) => {
            try {
                const { orderNo } = payload;
                const data = await wait_cut_model_1.WaitCutModel.getSplitSetQueueData(orderNo);
                socket.emit('update_queue_table', { success: true, data: data }); // 🎯 ใช้ชื่อท่อเดิมได้เลย
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
