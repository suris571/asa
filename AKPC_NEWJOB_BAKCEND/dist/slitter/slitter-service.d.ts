import { Server } from 'socket.io';
import { SlitterOrderSpec } from './slitter-protocol.js';
export declare class SlitterService {
    private static socket;
    private static isConnected;
    private static ioInstance;
    private static host;
    private static port;
    private static msgSeq;
    private static pendingCallbacks;
    /**
     * STEP 1: ฟังก์ชันรับค่าการตั้งค่าเบื้องต้น (เรียกใช้ตอนติดเครื่อง agent.ts)
     */
    static initialize(io: Server): void;
    /**
     * STEP 2: ฟังก์ชันเปิดสายสัญญาณ TCP เชื่อมต่อกับเครื่องตัด (Persistent Connection)
     */
    static connect(): void;
    /**
     * STEP 3: ฟังก์ชันส่งคำสั่ง ASCII Frame ออกไปหาเครื่องตัด และรอ Response
     */
    static sendFrame(frame: string, msgId: string, timeoutMs?: number): Promise<any>;
    /**
     * Helper: สร้าง Message ID หมุนวน 00 ถึง 99
     */
    private static getNextMsgId;
    /**
     * 🎯 4. ฟังก์ชัน setSpec (สั่งตั้งสเปกคิวงาน R04)
     * รับข้อมูล specData -> แปลงเป็น ASCII Frame -> ยิงผ่าน TCP -> รอรับ ACK P04 ตอบกลับ
     */
    static setSpec(spec: SlitterOrderSpec): Promise<any>;
    /**
     * 🎯 5. ฟังก์ชัน deleteOrder (สั่งลบคิวงาน R06)
     * รับ seqNo, orderId -> แปลงเป็น ASCII Frame -> ยิงผ่าน TCP -> รอรับ ACK P06 ตอบกลับ
     */
    static deleteOrder(seqNo: string, orderId: string): Promise<any>;
}
//# sourceMappingURL=slitter-service.d.ts.map