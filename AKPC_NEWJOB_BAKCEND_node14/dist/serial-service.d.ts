import { Server } from "socket.io";
export declare class SerialService {
    private static port;
    private static parser;
    private static ioInstance;
    private static portName;
    private static baudRate;
    private static retryTimer;
    static initialize(io: Server, portName?: string, baudRate?: number): void;
    /**
     * 🟢 สั่งยกเลิก Loop การพยายามเชื่อมต่อ (Helper Function)
     */
    private static clearRetryTimer;
    static openPort(): void;
    /**
     * 2. ฟังก์ชันสั่งปิด COM Port (พร้อมยกเลิกการ Retry ทั้งหมด)
     */
    static closePort(): void;
}
//# sourceMappingURL=serial-service.d.ts.map