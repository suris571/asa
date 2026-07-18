"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIO = exports.broadcastNextRollToWeighingStation = exports.initSocket = void 0;
const socket_io_1 = require("socket.io");
const wait_cut_model_1 = require("./modules/wait-cut/wait-cut.model");
const weighing_model_1 = require("./modules/weighing/weighing.model");
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
        try {
            // 📡 ปล่อยของ: ดึงค่าม้วนล่าสุดมาพ่นออกท่อทันทีเมื่อพนักงานเปิดจอนี้ขึ้นมา
            // (คืนนี้เราจำลอง Object ตัวแปรส่งไปเทสก่อนค่ะ)
            const latestRoll = await weighing_model_1.WeighingModel.getLatestReadySubRoll();
            latestRoll.roll_no = latestRoll.roll_no + 1;
            if (latestRoll) {
                // ส่งตรงเจาะจงไปที่เบราว์เซอร์เครื่องที่เพิ่งต่อเข้ามาตัวเดียว
                socket.emit('next_roll_ready_for_weighing', latestRoll);
                console.log(`📡 [Socket ห้องชั่ง]: พ่นข้อมูลม้วนล่าสุด [${latestRoll.roll_no}] ไปรอที่หน้าฟอร์มแล้ว`);
            }
        }
        catch (err) {
            console.error('❌ เกิดข้อผิดพลาดในการดึงข้อมูลส่งให้หน้าชั่งน้ำหนัก:', err);
        }
        socket.on('disconnect', () => {
            console.log('🔴 พนักงานปิดหน้าจอชั่งน้ำหนัก ID:', socket.id);
        });
    });
    return io;
};
exports.initSocket = initSocket;
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
