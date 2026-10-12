// src/slitter/slitter-service.ts
import net from 'net';
import { Server } from 'socket.io';
import { SlitterProtocol, SlitterOrderSpec } from './slitter-protocol.js';

export class SlitterService {
    private static socket: net.Socket | null = null;
    private static isConnected: boolean = false;
    private static ioInstance: Server | null = null;

    private static host: string = '127.0.0.1';
    private static port: number = 8000;

    private static msgSeq: number = 0;
    private static pendingCallbacks: Map<string, (res: any) => void> = new Map();

    static initialize(io: Server): void {
        this.ioInstance = io;
        console.log(`[SlitterService] กำหนดค่าเชื่อมต่อเครื่องตัด Yueli ที่ IP: ${this.host}:${this.port}`);
    }

    static connect(): void {
        if (this.socket && this.isConnected) return;

        console.log(`[Slitter TCP] กำลังพยายามเชื่อมต่อสาย TCP ไปที่ ${this.host}:${this.port}...`);
        this.socket = new net.Socket();

        this.socket.connect(this.port, this.host, () => {
            console.log(`🟢 [Slitter TCP Success] ต่อสายเข้าเครื่องตัด Yueli เรียบร้อยแล้ว!`);
            this.isConnected = true;

            if (this.ioInstance) {
                this.ioInstance.emit('slitter_connection_status', { connected: true, message: 'Connected to Slitter Machine' });
            }
        });

        // 🟢 แก้ไขตรงนี้: ดักรับ Response แกะ Frame แล้วเรียก Callback ให้หลุดจาก Timeout!
        this.socket.on('data', (data: Buffer) => {
            const rawStr = data.toString('ascii');
            console.log(`📥 [Slitter TCP Input]:`, rawStr);

            // 1. แกะ ASCII Frame ด้วย SlitterProtocol
            const parsed = SlitterProtocol.parseResponse(rawStr);
            
            if (parsed) {
                console.log(`🧩 [Parsed Response]: Cmd=${parsed.cmd}, MsgID=${parsed.msgId}, Status=${parsed.status}`);

                // 2. หา Callback ที่นั่งรอด้วย MsgID เดียวกัน
                const callback = this.pendingCallbacks.get(parsed.msgId);
                if (callback) {
                    callback(parsed);                           // ส่งข้อมูลกลับไปที่ sendFrame (resolve)
                    this.pendingCallbacks.delete(parsed.msgId); // ล้าง Map เมื่อเสร็จสิ้น
                }
            }
        });

        this.socket.on('error', (err: any) => {
            console.error(`🔴 [Slitter TCP Error]: ${err.message}`);
            this.isConnected = false;
        });

        this.socket.on('close', () => {
            console.warn(`⚠️ [Slitter TCP Closed] สายสัญญาณเครื่องตัดหลุด!`);
            this.isConnected = false;

            if (this.ioInstance) {
                this.ioInstance.emit('slitter_connection_status', { 
                    connected: false, 
                    message: 'Disconnected from Slitter Machine' 
                });
            }

            setTimeout(() => {
                console.log(`🔄 [Slitter TCP] กำลังพยายามต่อสายเข้าเครื่องตัดใหม่อีกครั้ง...`);
                SlitterService.connect();
            }, 5000);
        });
    }

    static sendFrame(frame: string, msgId: string, timeoutMs: number = 3000): Promise<any> {
        return new Promise((resolve, reject) => {
            if (!this.socket || !this.isConnected) {
                return reject(new Error('ไม่ได้ต่อสาย TCP กับเครื่องตัด (Connection Offline)'));
            }

            const timer = setTimeout(() => {
                this.pendingCallbacks.delete(msgId);
                reject(new Error(`Timeout: เครื่องตัดไม่ตอบกลับ Frame MsgID: ${msgId} ภายใน ${timeoutMs}ms`));
            }, timeoutMs);

            this.pendingCallbacks.set(msgId, (response) => {
                clearTimeout(timer);
                resolve(response);
            });

            console.log(`📤 [Slitter TCP Output]:`, frame);
            this.socket.write(frame);
        });
    }

    private static getNextMsgId(): string {
        const id = this.msgSeq.toString().padStart(2, '0');
        this.msgSeq = (this.msgSeq + 1) % 100;
        return id;
    }

    static async setSpec(spec: SlitterOrderSpec): Promise<any> {
        const msgId = this.getNextMsgId();
        const frame = SlitterProtocol.buildR04Frame(msgId, spec);
        return await this.sendFrame(frame, msgId, 3000);
    }

    static async deleteOrder(seqNo: string, orderId: string): Promise<any> {
        const msgId = this.getNextMsgId();
        const frame = SlitterProtocol.buildR06Frame(msgId, seqNo, orderId);
        return await this.sendFrame(frame, msgId, 3000);
    }
}