// src/slitter-service.ts
import net from 'net';
import { SlitterProtocol } from './slitter-protocol.js';
export class SlitterService {
    static socket = null;
    static isConnected = false;
    static ioInstance = null;
    static host = '127.0.0.1'; // IP ของเครื่องตัด (หรือ Mock Server ตอนทดสอบ)
    static port = 8000; // TCP Port ของเครื่องตัด
    // ตัวแปรรันเลข Message ID (00 - 99)
    static msgSeq = 0;
    // ตัวแปรเก็บ Queue หรือ Callback สำหรับจับคู่ Request -> Response
    static pendingCallbacks = new Map();
    /**
     * STEP 1: ฟังก์ชันรับค่าการตั้งค่าเบื้องต้น (เรียกใช้ตอนติดเครื่อง agent.ts)
     */
    static initialize(io) {
        this.ioInstance = io;
        console.log(`[SlitterService] กำหนดค่าเชื่อมต่อเครื่องตัด Yueli ที่ IP: ${this.host}:${this.port}`);
    }
    /**
     * STEP 2: ฟังก์ชันเปิดสายสัญญาณ TCP เชื่อมต่อกับเครื่องตัด (Persistent Connection)
     */
    static connect() {
        // ถ้าต่อติดอยู่แล้ว ไม่ต้องทำอะไรซ้ำ
        if (this.socket && this.isConnected)
            return;
        console.log(`[Slitter TCP] กำลังพยายามเชื่อมต่อสาย TCP ไปที่ ${this.host}:${this.port}...`);
        this.socket = new net.Socket();
        // 2.1 สื่อสารสำเร็จ (ต่อสายติด)
        this.socket.connect(this.port, this.host, () => {
            console.log(`🟢 [Slitter TCP Success] ต่อสายเข้าเครื่องตัด Yueli เรียบร้อยแล้ว!`);
            this.isConnected = true;
            // แจ้งบอกหน้าเว็บผ่าน Socket.io (พอร์ต 4000) ว่าต่อติดแล้ว
            if (this.ioInstance) {
                this.ioInstance.emit('slitter_connection_status', { connected: true, message: 'Connected to Slitter Machine' });
            }
        });
        // 2.2 ดักฟังข้อมูล (Data Response) ที่ยิงกลับมาจากเครื่องตัด
        this.socket.on('data', (data) => {
            const rawStr = data.toString('ascii');
            console.log(`📥 [Slitter TCP Input]:`, rawStr);
            // TODO: เดี๋ยวเราจะนำ Data ที่ได้ไปแปลง/แกะ Response ต่อไป
        });
        // 2.3 ดักจับ Error
        this.socket.on('error', (err) => {
            console.error(`🔴 [Slitter TCP Error]: ${err.message}`);
            this.isConnected = false;
        });
        // 2.4 ดักจับกรณีสายสัญญาณหลุด (Closed) -> ให้ลองเชื่อมต่อใหม่อัตโนมัติทุกๆ 5 วินาที
        this.socket.on('close', () => {
            console.warn(`⚠️ [Slitter TCP Closed] สายสัญญาณเครื่องตัดหลุด!`);
            this.isConnected = false;
            if (this.ioInstance) {
                this.ioInstance.emit('slitter_connection_status', {
                    connected: false,
                    message: 'Disconnected from Slitter Machine'
                });
            }
            // สั่ง Reconnect อัตโนมัติทุกๆ 5 วินาที โดยไม่แคร์ว่ามีคนเปิดหน้าเว็บอยู่ไหม
            setTimeout(() => {
                console.log(`🔄 [Slitter TCP] กำลังพยายามต่อสายเข้าเครื่องตัดใหม่อีกครั้ง...`);
                SlitterService.connect();
            }, 5000);
        });
    }
    /**
     * STEP 3: ฟังก์ชันส่งคำสั่ง ASCII Frame ออกไปหาเครื่องตัด และรอ Response
     */
    static sendFrame(frame, msgId, timeoutMs = 3000) {
        return new Promise((resolve, reject) => {
            if (!this.socket || !this.isConnected) {
                return reject(new Error('ไม่ได้ต่อสาย TCP กับเครื่องตัด (Connection Offline)'));
            }
            // ตั้งระบบ Timeout กันคำสั่งค้าง ถ้าเครื่องตัดไม่ตอบกลับภายใน 3 วินาที
            const timer = setTimeout(() => {
                this.pendingCallbacks.delete(msgId);
                reject(new Error(`Timeout: เครื่องตัดไม่ตอบกลับ Frame MsgID: ${msgId} ภายใน ${timeoutMs}ms`));
            }, timeoutMs);
            // เก็บ Callback รอคำตอบ
            this.pendingCallbacks.set(msgId, (response) => {
                clearTimeout(timer);
                resolve(response);
            });
            // ยิง Frame ออกสาย TCP
            console.log(`📤 [Slitter TCP Output]:`, frame);
            this.socket.write(frame);
        });
    }
    /**
     * Helper: สร้าง Message ID หมุนวน 00 ถึง 99
     */
    static getNextMsgId() {
        const id = this.msgSeq.toString().padStart(2, '0');
        this.msgSeq = (this.msgSeq + 1) % 100;
        return id;
    }
    /**
     * 🎯 4. ฟังก์ชัน setSpec (สั่งตั้งสเปกคิวงาน R04)
     * รับข้อมูล specData -> แปลงเป็น ASCII Frame -> ยิงผ่าน TCP -> รอรับ ACK P04 ตอบกลับ
     */
    static async setSpec(spec) {
        const msgId = this.getNextMsgId();
        // ประกอบ Frame ด้วย SlitterProtocol
        const frame = SlitterProtocol.buildR04Frame(msgId, spec);
        // ยิงคำสั่งและรอ ACK ภายใน 3000ms
        return await this.sendFrame(frame, msgId, 3000);
    }
    /**
     * 🎯 5. ฟังก์ชัน deleteOrder (สั่งลบคิวงาน R06)
     * รับ seqNo, orderId -> แปลงเป็น ASCII Frame -> ยิงผ่าน TCP -> รอรับ ACK P06 ตอบกลับ
     */
    static async deleteOrder(seqNo, orderId) {
        const msgId = this.getNextMsgId();
        // ประกอบ Frame ด้วย SlitterProtocol
        const frame = SlitterProtocol.buildR06Frame(msgId, seqNo, orderId);
        // ยิงคำสั่งและรอ ACK ภายใน 3000ms
        return await this.sendFrame(frame, msgId, 3000);
    }
}
//# sourceMappingURL=slitter-service.js.map