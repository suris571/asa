import { Server } from "socket.io";

// 🟢 ใช้ require ผ่านการสร้าง custom require เพื่อรองรับทั้ง Node 14 และ Node 22
import { createRequire } from "module";
const customRequire = createRequire(__filename);

// 🟢 ประกาศเรียกใช้งานเพียงรอบเดียว
const SerialPort: any = customRequire("serialport");
const ReadlineParser: any = customRequire("@serialport/parser-readline");

export class SerialService {
    private static port: any = null;
    private static parser: any = null;
    private static ioInstance: Server | null = null;
    private static portName: string = "COM1";
    private static baudRate: number = 2400;

    private static retryTimer: NodeJS.Timeout | null = null;

    static initialize(io: Server, portName: string = "COM1", baudRate: number = 2400): void {
        this.ioInstance = io;
        this.portName = portName;
        this.baudRate = baudRate;
        console.log(`[SerialPort] Initialized parameters for ${this.portName} (Standby mode)`);
    }

    /**
     * 🟢 สั่งยกเลิก Loop การพยายามเชื่อมต่อ (Helper Function)
     */
    private static clearRetryTimer(): void {
        if (this.retryTimer) {
            clearTimeout(this.retryTimer);
            this.retryTimer = null;
        }
    }

    static openPort(): void {
        // ถ้าพอร์ตเปิดสำเร็จอยู่แล้ว ไม่ต้องทำอะไร
        if (this.port && this.port.isOpen) {
            console.log(`[SerialPort] ${this.portName} is already open.`);
            this.clearRetryTimer();
            return;
        }

        try {
            // เคลียร์ Listener และ Instance เก่าทิ้งก่อนลองเชื่อมต่อใหม่
            if (this.parser) {
                this.parser.removeAllListeners();
                this.parser = null;
            }
            if (this.port) {
                this.port.removeAllListeners();
                this.port = null;
            }

            console.log(`[SerialPort] Attempting to open port: ${this.portName}...`);

            this.port = new SerialPort(
                this.portName,
                {
                    baudRate: this.baudRate,
                    dataBits: 7,
                    stopBits: 1,
                    parity: "none",
                },
                (err: any) => {
                    if (err) {
                        const msg = err?.message || String(err);
                        console.error(`[SerialPort Error] Cannot open ${this.portName}: ${msg}`);

                        if (this.ioInstance) {
                            this.ioInstance.emit("weight_stream", {
                                weight: 0,
                                stable: false,
                                status: "fail",
                                message: `Cannot open ${this.portName}: ${msg} (Retrying...)`,
                            });
                        }

                        // 🟢 ตั้งเวลาพยายามเชื่อมต่อใหม่ทุกๆ 3 วินาที (ถ้ายังโดน VB ล็อกอยู่)
                        this.clearRetryTimer();
                        this.retryTimer = setTimeout(() => {
                            console.log(`[SerialPort] Retrying connection to ${this.portName}...`);
                            SerialService.openPort();
                        }, 3000);

                        return;
                    }

                    // 🟢 ถ้าเปิดสำเร็จ ให้ยกเลิก Timer การ Retry ทันที
                    this.clearRetryTimer();
                    console.log(`[SerialPort Success] Connected to ${this.portName} successfully!`);
                },
            );

            this.parser = this.port.pipe(new ReadlineParser({ delimiter: "\r\n" }));

            this.parser.on("data", (rawData: string) => {
                try {
                    const match: any = rawData.match(/[+|-]?\s*(\d+(?:\.\d*)?)\s*kg/i);

                    if (match && this.ioInstance) {
                        const currentWeight = Math.trunc(parseFloat(match[1]));

                        if (!isNaN(currentWeight)) {
                            const isStable = rawData.includes("\u0002S") || rawData.includes("S000G");

                            this.ioInstance.emit("weight_stream", {
                                weight: currentWeight.toLocaleString("en-US"),
                                stable: isStable,
                                status: "success",
                                message: "success",
                            });
                        }
                    }
                } catch (error: any) {
                    console.error("[SerialPort Stream Error]:", error.message);
                }
            });

            this.port.on("error", (err: any) => {
                const msg = err?.message || String(err);
                console.error(`[SerialPort Error] Runtime error: ${msg}`);
            });

            this.port.on("close", () => {
                console.warn(`[SerialPort Warning] Port ${this.portName} was closed!`);

                // 🟢 ถ้าหน้าเว็บยังเปิดค้างอยู่ ให้พยายามต่อใหม่ทุกๆ 3 วินาที
                // (แต่ถ้าปิดหน้าเว็บไปแล้ว closePort() จะไป clearRetryTimer() ให้เอง)
                if (this.ioInstance && this.ioInstance.engine.clientsCount > 0) {
                    this.clearRetryTimer();
                    this.retryTimer = setTimeout(() => {
                        console.log(`[SerialPort] Connection lost. Retrying ${this.portName}...`);
                        SerialService.openPort();
                    }, 3000);
                }
            });
        } catch (error: any) {
            console.error("[SerialPort System Error]:", error.message);

            // 🟢 เช็กด้วยว่าผู้ใช้งานยังเปิดหน้าเว็บอยู่อย่างน้อย 1 คนไหม ก่อนตั้ง Retry
            if (this.ioInstance && this.ioInstance.engine.clientsCount > 0) {
                this.clearRetryTimer();
                this.retryTimer = setTimeout(() => {
                    SerialService.openPort();
                }, 3000);
            }
        }
    }

    /**
     * 2. ฟังก์ชันสั่งปิด COM Port (พร้อมยกเลิกการ Retry ทั้งหมด)
     */
    static closePort(): void {
        this.clearRetryTimer();

        if (this.port) {
            console.log(`[SerialPort] Closing ${this.portName} to release port for legacy VB app...`);
            
            // 🟢 เก็บตัวแปรชั่วคราวแล้วล้างค่าหลักทันที เพื่อให้ openPort() ตัวถัดไปไม่ติดสับสน
            const targetPort = this.port;
            this.port = null;

            if (this.parser) {
                this.parser.removeAllListeners();
                this.parser = null;
            }

            if (targetPort.isOpen) {
                targetPort.removeAllListeners();
                targetPort.close((err: any) => {
                    if (err) {
                        console.error(`[SerialPort Error] Failed to close ${this.portName}:`, err.message);
                    } else {
                        console.log(`[SerialPort Success] Released ${this.portName} successfully!`);
                    }
                });
            }
        } else {
            console.log(`[SerialPort] Stopped connection attempts and released ${this.portName}.`);
        }
    }
}
