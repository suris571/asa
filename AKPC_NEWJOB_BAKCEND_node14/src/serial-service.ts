const SerialPort = require('serialport');
const ReadlineParser = require('@serialport/parser-readline');
import { Server } from 'socket.io';

export class SerialService {
  private static port: any = null;
  private static parser: any = null;
  private static ioInstance: Server | null = null;
  private static mockTimer: NodeJS.Timeout | null = null;
  private static reconnectTimer: NodeJS.Timeout | null = null; // 🟢 ตัวแปรจับเวลาสำหรับ Auto-Reconnect

static initialize(io: Server, portName: string = 'COM1', baudRate: number = 2400): void {
    try {
      this.ioInstance = io;

      // 🟢 1. เคลียร์ Timer สำหรับการเชื่อมต่อใหม่ถ้ามีค้างอยู่
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }

      // 🟢 2. เคลียร์พอร์ตและ Parser ตัวเก่าทิ้งอย่างเด็ดขาด ป้องกันการ Emit เบิ้ล
      if (this.parser) {
        this.parser.removeAllListeners();
        this.parser = null;
      }

      if (this.port) {
        this.port.removeAllListeners();
        if (this.port.isOpen) {
          this.port.close();
        }
        this.port = null;
      }

      console.log(`[SerialPort] Connecting to port: ${portName} (BaudRate: ${baudRate}, DataBits: 7)...`);

      this.port = new SerialPort(
        portName, 
        { 
          baudRate: baudRate,
          dataBits: 7,
          stopBits: 1,
          parity: 'none'
        }, 
        (err: any) => {
          if (err) {
            const msg = err?.message || String(err);
            console.error(`[SerialPort Error] Cannot open ${portName}: ${msg}`);
            if (this.ioInstance) {
              this.ioInstance.emit('weight_stream', {
                weight: 0,
                stable: false,
                status: 'fail',
                message: `Cannot open ${portName}: ${msg}`
              });
            }

            // 🟢 สั่ง Reconnect เมื่อเปิดไม่ผ่าน พร้อมเคลียร์ค่า Timer
            console.log(`[SerialPort] Retrying to connect ${portName} in 5 seconds...`);
            if (!this.reconnectTimer) {
              this.reconnectTimer = setTimeout(() => {
                this.reconnectTimer = null; // รีเซ็ตก่อนเรียกใหม่
                SerialService.initialize(io, portName, baudRate);
              }, 5000);
            }

            return;
          }
          console.log(`[SerialPort Success] Connected to ${portName} successfully!`);
        }
      );

      this.parser = this.port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

      this.parser.on('data', (rawData: string) => {
        try {
          // console.log(`[SerialPort Stream] rawData: ${JSON.stringify(rawData)}`);
          
          const match: any = rawData.match(/[+|-]?\s*(\d+(?:\.\d*)?)\s*kg/i);
          
          if (match && this.ioInstance) {
            const currentWeight = Math.trunc(parseFloat(match[1]));

            if (!isNaN(currentWeight)) {
              const isStable = rawData.includes('\u0002S') || rawData.includes('S000G');

              console.log(`>>> [READY TO EMIT] Weight: ${currentWeight} kg | Stable: ${isStable}`);

              this.ioInstance.emit('weight_stream', {
                weight: currentWeight.toLocaleString('en-US'),
                stable: isStable,
                status: 'success',
                message: 'success'
              });
            }
          }
        } catch (error: any) {
          console.error('[SerialPort Stream Error]:', error.message);
        }
      });

      this.port.on('error', (err: any) => {
        const msg = err?.message || String(err);
        console.error(`[SerialPort Error] Runtime error: ${msg}`);
        if (this.ioInstance) {
          this.ioInstance.emit('weight_stream', {
            weight: 0,
            stable: false,
            status: 'fail',
            message: 'Serial Port runtime error: ' + msg
          });
        }
      });

      this.port.on('close', () => {
        console.warn(`[SerialPort Warning] Port was closed!`);
        if (this.ioInstance) {
          this.ioInstance.emit('weight_stream', {
            weight: 0,
            stable: false,
            status: 'fail',
            message: 'Serial Port was closed'
          });
        }

        // 🟢 สั่ง Reconnect เมื่อสายหลุด พร้อมเคลียร์ค่า Timer
        console.log(`[SerialPort] Will attempt to reconnect to ${portName} in 5 seconds...`);
        if (!this.reconnectTimer) {
          this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null; // รีเซ็ตก่อนเรียกใหม่
            SerialService.initialize(io, portName, baudRate);
          }, 5000);
        }
      });

    } catch (error: any) {
      console.error('[SerialPort System Error]:', error.message);
    }
  }

  private static startMockStream(): void {
    if (this.mockTimer) clearInterval(this.mockTimer);
    
    console.log(`[Mock Mode] Started mock weight stream...`);
    
    let simulatedWeight = 0;
    let isIncreasing = true;

    this.mockTimer = setInterval(() => {
      if (!this.ioInstance) return;

      if (isIncreasing) {
        simulatedWeight += Math.random() * 4.5;
        if (simulatedWeight >= 50.0) isIncreasing = false;
      } else {
        simulatedWeight -= Math.random() * 6.0;
        if (simulatedWeight <= 0) {
          simulatedWeight = 0;
          isIncreasing = true;
        }
      }

      const finalWeight = Math.trunc(simulatedWeight);

      this.ioInstance.emit('weight_stream', {
        weight: finalWeight,
        stable: finalWeight > 0 && Math.random() > 0.7,
        status: 'success',
        message: 'success'
      });
    }, 500);
  }
}