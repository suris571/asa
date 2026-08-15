import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
const commonBaudRates = [9600, 4800, 19200, 2400, 115200];
let currentIndex = 0;
function testNextBaudRate() {
    if (currentIndex >= commonBaudRates.length) {
        console.log('❌ สแกนครบทุกค่าแล้ว ไม่พบการตอบรับที่ถูกต้อง');
        return;
    }
    const baudRate = commonBaudRates[currentIndex];
    console.log(`🔍 กำลังทดสอบ Baud Rate: ${baudRate}...`);
    const port = new SerialPort({ path: 'COM1', baudRate, autoOpen: false });
    const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));
    port.open((err) => {
        if (err) {
            console.error(`ไม่สามารถเปิดพอร์ตที่ ${baudRate}ได้: ${err.message}`);
            currentIndex++;
            testNextBaudRate();
            return;
        }
        // ดักรอฟังข้อมูล 3 วินาที
        const timer = setTimeout(() => {
            console.log(`⏳ ค่า ${baudRate} ไม่มีข้อมูลตอบกลับ หรือเปิดไม่ถูกต้อง ปิดพอร์ตย้ายไปตัวถัดไป...`);
            port.close(() => {
                currentIndex++;
                testNextBaudRate();
            });
        }, 3000);
        parser.once('data', (rawData) => {
            clearTimeout(timer);
            console.log(`🎉 เจอแล้ว! ค่า Baud Rate ที่ถูกต้องน่าจะเป็น: ${baudRate}`);
            console.log(`📦 ตัวอย่างข้อมูลที่อ่านได้: ${JSON.stringify(rawData)}`);
            port.close();
        });
    });
}
// เริ่มสแกน
testNextBaudRate();
//# sourceMappingURL=test.js.map