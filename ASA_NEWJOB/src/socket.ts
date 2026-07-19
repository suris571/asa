import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { WaitCutModel } from './modules/wait-cut/wait-cut.model';
import { WeighingModel } from './modules/weighing/weighing.model';
import crypto from 'crypto';

let lastQueueHash = ''; 

// ⏳ ฟังก์ชันหลังบ้าน คอยตรวจส่อง Oracle DB (รันทำงานอัตโนมัติรอบเดียวสั่งการยาว)
const startQueueMonitor = (waitCutNamespace: any) => {
    const MONITOR_INTERVAL = 30000; // 🎯 วิ่งไปถามเบสทุก ๆ 30 วินาที (ปรับเพิ่ม/ลดได้ตามความเหมาะสม)

    setInterval(async () => {
        try {
            // เช็กก่อนว่ามีคนเปิดหน้าเว็บสแตนด์บายอยู่ใน Namespace ไหม (ถ้าไม่มีใครเปิดอยู่เลย ก็ไม่ต้อง Query ให้เปลืองแรง)
            const connectedSockets = await waitCutNamespace.fetchSockets();
            if (connectedSockets.length === 0) return;

            // 1. หลังบ้านทำหน้าที่เป็นตัวแทนหมู่บ้าน วิ่งไปดึงคิวงานทั้งหมดจาก Oracle
            const currentRawData = await WaitCutModel.getAllWaitingAndWeighing();
            
            // 2. 🎯 ไม้ตายตามสั่งกัปตัน: ลอกคราบข้อมูล กรองฟิลด์ที่มีท่อตัวเองอยู่แล้วออกไปก่อนทำ Hash
            // กรองเอา 'que' (เลขคิวสลับ) และ 'status' (สถานะงาน) ออกไป เพื่อป้องกันท่อยิงซ้ำซ้อน
            const filteredDataForHash = currentRawData.map((item: any) => {
                const { que, cut_status_id, ...restOfData } = item; 
                return restOfData; // เหลือไว้เฉพาะข้อมูลเชิงโครงสร้าง เช่น orderNo, ITEM, ขนาดใบมีด
            });

            // 3. ทำ Hash จากข้อมูลที่กรองแล้ว
            const currentHash = crypto.createHash('md5').update(JSON.stringify(filteredDataForHash)).digest('hex');

            // 3. 🎯 จุดตัดตัดสินใจ: เปรียบเทียบกับลายนิ้วมือรอบที่แล้ว
            if (currentHash !== lastQueueHash) {
                console.log("📢 [Backend Monitor] ตรวจพบข้อมูลใน Oracle เปลี่ยนแปลง! กำลังส่งสัญญาณเตือนหน้าบ้าน...");
                
                // อัปเดตลายนิ้วมือล่าสุดเก็บไว้
                lastQueueHash = currentHash;

                // 🚀 ตะโกนบอกหน้าบ้านทุกคนทันทีว่า "ข้อมูลเปลี่ยนแล้วโว้ย!"
                waitCutNamespace.emit('queue_structure_changed', { success: true });
            } else {
                // ข้อมูลเหมือนเดิม นิ่งเงียบไว้ ถนอม Network Traffic
                console.log("💤 [Backend Monitor] ข้อมูลใน Oracle ยังเหมือนเดิม ไม่มีอะไรเปลี่ยนแปลง");
            }

        } catch (error) {
            console.error("❌ เกิดข้อผิดพลาดในระบบ Monitor หลังบ้าน:", error);
        }
    }, MONITOR_INTERVAL);
};

// ประกาศตัวแปรระดับ Global ภายในไฟล์นี้ เพื่อให้ฟังก์ชันข้างนอกเรียกส่งของได้
let io: SocketIOServer;

export const initSocket = (httpServer: HTTPServer): SocketIOServer => {
    io = new SocketIOServer(httpServer, {
        cors: { origin: "*", methods: ["GET", "POST"] }
    });
    // ==========================================================================
    // 🪓 ห้องที่ 1: [/socket/wait-cut] สำหรับหน้ารอตัด (กั้นพื้นที่ให้โค้ดเดิม)
    // ==========================================================================
    const waitCutNamespace = io.of('/socket/wait-cut');
    startQueueMonitor(waitCutNamespace);
    waitCutNamespace.on('connection', (socket: Socket) => {
        console.log('🟢 พนักงานหน้างานเปิด [หน้ารอตัด] เชื่อมต่อเข้ามา ID:', socket.id);

        socket.on('get_filtered_queue', async (payload) => {
            try {
                const { status, orderNo, startDate, endDate } = payload;
                const data = await WaitCutModel.getAllWaitingAndWeighing(null, status, orderNo, startDate, endDate);
                
                socket.emit('update_queue_table', { success: true, data: data }); // 🎯 ใช้ชื่อท่อเดิมได้เลย
            } catch (error:any) {
                socket.emit('update_queue_table', { success: false, error: error.message });
            }
        });

        socket.on('swapQueue', async (data: { orderId: any, current_que: any, aboveOrderId: any, above_que: any }) => {
            const { orderId, current_que, aboveOrderId, above_que } = data;
            console.log(`⚡️ หลังบ้านรับคำสั่งเลื่อนคิว: ID ${orderId} ปะทะ ${aboveOrderId}`);
            try {
                await WaitCutModel.swapQueue(orderId, current_que, aboveOrderId, above_que);
                waitCutNamespace.emit('queue_structure_changed', { success: true });

            } catch (error) {
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
    weighingNamespace.on('connection', async (socket: Socket) => {
        console.log('🟢 พนักงานหน้างานเปิด [หน้าชั่งน้ำหนัก] เชื่อมต่อเข้ามา ID:', socket.id);

        try {
            // 📡 ปล่อยของ: ดึงค่าม้วนล่าสุดมาพ่นออกท่อทันทีเมื่อพนักงานเปิดจอนี้ขึ้นมา
            // (คืนนี้เราจำลอง Object ตัวแปรส่งไปเทสก่อนค่ะ)
            const latestRoll = await WeighingModel.getLatestReadySubRoll()
            latestRoll.roll_no = latestRoll.roll_no+1

            if (latestRoll) {
                // ส่งตรงเจาะจงไปที่เบราว์เซอร์เครื่องที่เพิ่งต่อเข้ามาตัวเดียว
                socket.emit('next_roll_ready_for_weighing', latestRoll);
                console.log(`📡 [Socket ห้องชั่ง]: พ่นข้อมูลม้วนล่าสุด [${latestRoll.roll_no}] ไปรอที่หน้าฟอร์มแล้ว`);
            }
        } catch (err) {
            console.error('❌ เกิดข้อผิดพลาดในการดึงข้อมูลส่งให้หน้าชั่งน้ำหนัก:', err);
        }

        socket.on('disconnect', () => {
            console.log('🔴 พนักงานปิดหน้าจอชั่งน้ำหนัก ID:', socket.id);
        });
    });

    return io;
};


export const broadcastNextRollToWeighingStation = (nextRollData: any): void => {
    if (!io) {
        console.error("⚠️ ไม่สามารถปล่อยสัญญาณได้เนื่องจากระบบ Socket ยังไม่ถูกเปิดใช้งานค่ะกัปตัน!");
        return;
    }

    console.log(`📢 [Socket]: เครื่องตัดส่งสัญญาณมา! กำลังยิงรหัส ${nextRollData.roll_no} เข้าห้องชั่งน้ำหนัก...`);
    
    // 🎯 เจาะจงพ่นข้อมูลอีเวนต์ 'next_roll_ready_for_weighing' เข้าไปเฉพาะในห้อง /socket/weighing เท่านั้น
    io.of('/socket/weighing').emit('next_roll_ready_for_weighing', nextRollData);
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