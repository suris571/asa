import { Server } from 'socket.io';
export declare class SerialService {
    private static port;
    private static parser;
    private static ioInstance;
    private static mockTimer;
    static initialize(io: Server, portName?: string, baudRate?: number): void;
    private static startMockStream;
}
//# sourceMappingURL=serial-service.d.ts.map