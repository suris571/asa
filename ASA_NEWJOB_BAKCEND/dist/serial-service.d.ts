import { Server } from 'socket.io';
export declare class SerialService {
    private static port;
    private static parser;
    private static ioInstance;
    private static mockTimer;
    /**
     * ⚓ หน้าที่: เริ่มต้นเปิดพอร์ต โดยต้องส่งท่อ io ข้ามฝั่งมาให้รับช่วงต่อด้วย
     */
    static initialize(io: Server, portName?: string, baudRate?: number): void;
    /**
     * 🧪 ฟังก์ชันสลักเลขสุ่มวิ่งออโต้ ยิงเข้าหน้าเว็บเมื่อคอม Dev ไม่มีสายต่อจริง
     */
    private static startMockStream;
}
//# sourceMappingURL=serial-service.d.ts.map