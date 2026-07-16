import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { WaitCutModel } from './modules/wait-cut/wait-cut.model';
import { WeighingModel } from './modules/weighing/weighing.model';

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
    waitCutNamespace.on('connection', (socket: Socket) => {
        console.log('🟢 พนักงานหน้างานเปิด [หน้ารอตัด] เชื่อมต่อเข้ามา ID:', socket.id);

        socket.on('request_move_up', async (orderId: number) => {
            console.log(`⚡️ หลังบ้านได้รับคำสั่งเลื่อนขึ้นของไอดี: ${orderId}`);
            try {
                const updatedQueue = await WaitCutModel.moveOrderUp(orderId);
                // 🎯 เปลี่ยนจาก io.emit เป็น waitCutNamespace.emit เพื่อให้เด้งเฉพาะหน้ารอตัด
                waitCutNamespace.emit('update_queue_table', updatedQueue);
            } catch (error) {
                console.error("เกิดข้อผิดพลาดในการสลับคิวขาขึ้น:", error);
            }
        });

        socket.on('request_move_down', async (orderId: number) => {
            console.log(`⚡️ หลังบ้านได้รับคำสั่งเลื่อนลงของไอดี: ${orderId}`);
            try {
                const updatedQueue = await WaitCutModel.moveOrderDown(orderId);
                // 🎯 เปลี่ยนจาก io.emit เป็น waitCutNamespace.emit เพื่อให้เด้งเฉพาะหน้ารอตัด
                waitCutNamespace.emit('update_queue_table', updatedQueue);
            } catch (error) {
                console.error("เกิดข้อผิดพลาดในการสลับคิวขาลง:", error);
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

    // 📢 เริ่มต้นตัวจำลองข้อมูลไหลเข้าออโต้ (ปรับให้ส่งเฉพาะในห้อง wait-cut)
    startQueueSimulation();

    return io;
};

/**
 * 📢 ฟังก์ชันจำลองการส่งข้อมูลใบงานใหม่ไหลเข้าตารางออโต้ ทุกๆ 10 วินาที
 */
function startQueueSimulation() {
    setInterval(async () => {
        if (!io) return;
        
        try {
            const currentQueue = await WaitCutModel.getAllOrders();
            
            currentQueue.push({
                    id: 1,
                    jobNo: 'JOB-001',
                    rollNo: 'R260621-01',
                    setIndex: 1,
                    rollIndexInSet: 1,
                    targetWeight: 50,
                    actualWeight: 2,
                    status: 'รอสั่งตัด',
                    queue_no: 1
            });
            
            io.of('/socket/wait-cut').emit('update_queue_table', currentQueue);
        } catch (error) {
            console.error("Simulation พัง:", error);
        }
    }, 10000);
}


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