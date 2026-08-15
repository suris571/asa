import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
export class SerialService {
    static port = null;
    static parser = null;
    static ioInstance = null;
    static mockTimer = null;
    static initialize(io, portName = 'COM1', baudRate = 9600) {
        try {
            this.ioInstance = io;
            // 🎯 1. เคลียร์พอร์ตและ Event Listener เดิมทิ้งก่อนเพื่อป้องกันบั๊กยิงข้อมูลซ้ำ
            if (this.port) {
                if (this.port.isOpen) {
                    this.port.close();
                }
                this.port.removeAllListeners();
            }
            console.log(`🔌 กำลังพยายามเปิดท่อฮาร์ดแวร์เพื่อดักฟังพอร์ต: ${portName}...`);
            this.port = new SerialPort({
                path: portName,
                baudRate: baudRate,
                dataBits: 8,
                stopBits: 1,
                parity: 'none',
                autoOpen: false
            });
            this.parser = this.port.pipe(new ReadlineParser({ delimiter: '\r\n' }));
            // 🎯 2. จัดการ Open Port พร้อมแจ้งเตือนฝั่ง Client เมื่อเปิดไม่ผ่าน
            this.port.open((err) => {
                if (err) {
                    console.error(`🔴 แผนกฮาร์ดแวร์ฟ้อง: ไม่สามารถเชื่อมต่อกับ ${portName} ได้! - ${err.message}`);
                    if (this.ioInstance) {
                        this.ioInstance.emit('weight_stream', {
                            status: 'fail',
                            message: `ไม่สามารถเชื่อมต่อกับ ${portName} ได้: ${err.message}`
                        });
                    }
                    return;
                }
                console.log(`🟢 เชื่อมต่อทางกายภาพกับสาย ${portName} สำเร็จแล้ว!`);
            });
            // 🧠 3. จับสัญญาณน้ำหนัก + ป้องกันค่า NaN
            this.parser.on('data', (rawData) => {
                try {
                    console.log(`⚖️ [${portName} สตรีมมิ่ง] rawdata: ${JSON.stringify(rawData)}`);
                    // Regex ปรับปรุงใหม่ให้รัดกุม ป้องกันการหลุด match เฉพาะเครื่องหมาย
                    const match = rawData.match(/[-+]?\d+(\.\d+)?/);
                    if (match && this.ioInstance) {
                        const currentWeight = parseFloat(match[0]);
                        // ดักเช็ก !isNaN ป้องกันขยะข้อมูล
                        if (!isNaN(currentWeight)) {
                            console.log(`⚖️ [${portName} สตรีมมิ่ง] น้ำหนักปัจจุบัน: ${currentWeight} kg`);
                            this.ioInstance.emit('weight_stream', {
                                weight: currentWeight,
                                stable: rawData.includes('ST'), // เช็กสถานะนิ่งของเครื่องชั่ง
                                status: 'success',
                                message: 'success'
                            });
                        }
                    }
                }
                catch (error) {
                    console.error('🔴 ข้อผิดพลาดขณะประมวลผลข้อมูลจาก Serial Port:', error.message);
                }
            });
            // 🛡️ 4. ดักจับ Error ขณะรัน
            this.port.on('error', (err) => {
                console.error(`🔴 Serial Port เกิด error ขณะรัน: ${err.message}`);
                if (this.ioInstance) {
                    this.ioInstance.emit('weight_stream', {
                        status: 'fail',
                        message: 'Serial Port ไม่สามารถเชื่อมต่อได้: ' + err.message
                    });
                }
            });
            // 🔌 5. ดักจับเหตุการณ์ Port ถือว่าโดนปิด
            this.port.on('close', () => {
                console.warn(`⚠️ Serial Port ถูกปิดกะทันหัน`);
                if (this.ioInstance) {
                    this.ioInstance.emit('weight_stream', {
                        status: 'fail',
                        message: 'Serial Port ถูกปิดกะทันหัน'
                    });
                }
            });
        }
        catch (error) {
            console.error('🔴 ระบบจัดเตรียม Serial Port พังเสียหาย:', error.message);
        }
    }
    /**
     * 🧪 ฟังก์ชันสลักเลขสุ่มวิ่งออโต้ ยิงเข้าหน้าเว็บเมื่อคอม Dev ไม่มีสายต่อจริง
     */
    static startMockStream() {
        if (this.mockTimer)
            clearInterval(this.mockTimer);
        console.log(`📡 [Mock Mode] ระบบจำลองสายสตรีมเครื่องชั่งเปิดฉากทำงานแล้ว พ่นข้อมูลที่พอร์ต 4000...`);
        let simulatedWeight = 10000;
        let isIncreasing = true;
        this.mockTimer = setInterval(() => {
            if (!this.ioInstance)
                return;
            // ตรรกะแกล้งทำเป็นคนยกของมาวาง น้ำหนักค่อยๆ ไต่ขึ้น-ลง
            if (isIncreasing) {
                simulatedWeight += Math.random() * 4.5; // ค่อยๆ เพิ่มทีละนิด
                if (simulatedWeight >= 50.0)
                    isIncreasing = false; // ตันที่ 50 โลแล้วค่อยๆ ยกออก
            }
            else {
                simulatedWeight -= Math.random() * 6.0;
                if (simulatedWeight <= 0) {
                    simulatedWeight = 0;
                    isIncreasing = true; // เคลียร์ศูนย์แล้วเริ่มชั่งม้วนถัดไป
                }
            }
            const finalWeight = parseFloat(simulatedWeight.toFixed(2));
            // console.log(`🤖 [Mock ส่งออก] ตัวเลขจำลองหน้าร้าน: ${finalWeight} kg`);
            let finalWeight1 = Math.trunc(finalWeight).toLocaleString('en-US');
            // พ่นออกท่อ Socket ชื่อเดียวกันเป๊ะๆ เพื่อให้หน้าเว็บแยกไม่ออกว่านี่คือของจริงหรือของปลอม!
            this.ioInstance.emit('weight_stream', {
                weight: finalWeight1,
                stable: finalWeight > 0 && Math.random() > 0.7 // สุ่มสถานะนิ่งนิ่ง
            });
        }, 5000); // พ่นรัวๆ ทุก 0.5 วินาทีสะใจสายสตรีม
    }
}
//# sourceMappingURL=serial-service.js.map