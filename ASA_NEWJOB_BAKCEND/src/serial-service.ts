// src/serial-service.ts
import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import { Server } from 'socket.io'; // ดึงเฉพาะประเภท (Type) มาจากคลังหลัก

export class SerialService {
  private static port: SerialPort | null = null;
  private static parser: ReadlineParser | null = null;
  private static ioInstance: Server | null = null; // 📦 สร้างกล่องเก็บสายสัญญาณไว้ในคลาสตัวเอง
  private static mockTimer: NodeJS.Timeout | null = null; // กล่องจองเวลาลูปจำลอง

  /**
   * ⚓ หน้าที่: เริ่มต้นเปิดพอร์ต โดยต้องส่งท่อ io ข้ามฝั่งมาให้รับช่วงต่อด้วย
   */
  static initialize(io: Server, portName: string = 'COM1', baudRate: number = 9600): void {
    try {
      this.ioInstance = io; // ยัดท่อส่งข้อมูลใส่มือเซอร์วิส
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

      this.port.open((err) => {
        if (err) {
          console.error(`🔴 แผนกฮาร์ดแวร์ฟ้อง: ไม่สามารถเชื่อมต่อกับ ${portName} ได้! - ${err.message}`);
          this.startMockStream();
          return;
        }
        console.log(`🟢 เชื่อมต่อทางกายภาพกับสาย ${portName} สำเร็จแล้วครับกัปตัน!`);
      });

      // 🧠 จังหวะจับสัญญาณน้ำหนักพ่นออกนอกฝั่ง
      this.parser.on('data', (rawData: string) => {
        try {
          console.log(`⚖️ [COM1 สตรีมมิ่ง] rawdata: ${JSON.stringify(rawData)}`); // แสดงข้อมูลดิบที่ได้รับจากเครื่องชั่งเพื่อการดีบัก
          const match = rawData.match(/[-+]?[0-9]*\.?[0-9]+/);
          
          if (match && this.ioInstance) {
            const currentWeight = parseFloat(match[0]);
            console.log(`⚖️ [COM1 สตรีมมิ่ง] น้ำหนักปัจจุบัน: ${currentWeight} kg`);

            // 📡 ใช้กล่องที่เราถือไว้ ยิงสตรีมน้ำหนักออกไปหาหน้าเว็บได้เลยโดยไม่ง้อไฟล์แอปตัวแม่แล้วค่ะ
            this.ioInstance.emit('weight_stream', {
              weight: currentWeight,
              stable: rawData.includes('ST'),
              status:"success",
              message:"success"
            });
          }
        } catch (error: any) {
          console.error('🔴 ข้อผิดพลาดขณะประมวลผลข้อมูลจาก Serial Port:', error.message);
        }
      });

      // 🛡️ ดักจับ error จากสาย serial ขณะรัน เช่น ดึงสาย USB ออกกะทันหัน
      this.port.on('error', (err) => {
        console.error(`🔴 Serial Port เกิด error ขณะรัน: ${err.message}`);
        if (this.ioInstance) {
          this.ioInstance.emit('weight_stream', {
            status: 'fail',
            message: 'Serial Port ไม่สามารถเชื่อมต่อได้: ' + err.message
          });
        }
      });

      // 🔌 ดักจับเหตุการณ์ port ถูกปิด เช่น ดึงสายออก → สลับไป Mock Mode อัตโนมัติ
      this.port.on('close', () => {
        console.warn(`⚠️ Serial Port ถูกปิดกะทันหัน กำลังสลับไป Mock Mode...`);
        if (this.ioInstance) {
          this.ioInstance.emit('weight_stream', {
            status: 'fail',
            message: 'Serial Port ถูกปิดกะทันหัน'
          });
        }
      });

    } catch (error: any) {
      console.error('🔴 ระบบจัดเตรียม Serial Port พังเสียหาย:', error.message);
    }
  }

  /**
   * 🧪 ฟังก์ชันสลักเลขสุ่มวิ่งออโต้ ยิงเข้าหน้าเว็บเมื่อคอม Dev ไม่มีสายต่อจริง
   */
  private static startMockStream(): void {
    if (this.mockTimer) clearInterval(this.mockTimer);
    
    console.log(`📡 [Mock Mode] ระบบจำลองสายสตรีมเครื่องชั่งเปิดฉากทำงานแล้ว พ่นข้อมูลที่พอร์ต 4000...`);
    
    let simulatedWeight = 0.0;
    let isIncreasing = true;

    this.mockTimer = setInterval(() => {
      if (!this.ioInstance) return;

      // ตรรกะแกล้งทำเป็นคนยกของมาวาง น้ำหนักค่อยๆ ไต่ขึ้น-ลง
      if (isIncreasing) {
        simulatedWeight += Math.random() * 4.5; // ค่อยๆ เพิ่มทีละนิด
        if (simulatedWeight >= 50.0) isIncreasing = false; // ตันที่ 50 โลแล้วค่อยๆ ยกออก
      } else {
        simulatedWeight -= Math.random() * 6.0;
        if (simulatedWeight <= 0) {
          simulatedWeight = 0;
          isIncreasing = true; // เคลียร์ศูนย์แล้วเริ่มชั่งม้วนถัดไป
        }
      }

      const finalWeight = parseFloat(simulatedWeight.toFixed(2));
      // console.log(`🤖 [Mock ส่งออก] ตัวเลขจำลองหน้าร้าน: ${finalWeight} kg`);

      // พ่นออกท่อ Socket ชื่อเดียวกันเป๊ะๆ เพื่อให้หน้าเว็บแยกไม่ออกว่านี่คือของจริงหรือของปลอม!
      this.ioInstance.emit('weight_stream', {
        weight: finalWeight,
        stable: finalWeight > 0 && Math.random() > 0.7 // สุ่มสถานะนิ่งนิ่ง
      });
    }, 5000); // พ่นรัวๆ ทุก 0.5 วินาทีสะใจสายสตรีม
  }
}