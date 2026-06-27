// src/print-service.ts
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import PDFDocument from 'pdfkit';
import * as ptp from 'pdf-to-printer';
// ⚓ จัดการพิกัดไดเรกทอรีเนื่องจากเราใช้ ESM Module (NodeNext)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export class PrintService {
    /**
     * ⚓ หน้าที่: รับข้อมูลใบงาน สลักเป็นไฟล์ PDF รายงาน A4 และสั่งยิงพิมพ์ทันที
     */
    static async generateAndPrintA4(jobData) {
        // 1. ตั้งชื่อและกำหนดพิกัดวางไฟล์ PDF ชั่วคราว (สร้างโฟลเดอร์ temp รอก่อนได้เลยค่ะ)
        const tempDir = path.join(__dirname, '../temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        const outputPdfPath = path.join(tempDir, `report-${jobData.id || 'test'}.pdf`);
        // 2. เริ่มต้นวาดโครงสร้างเอกสาร PDF ขนาด A4 แนวตั้ง (Portrait)
        const doc = new PDFDocument({ size: 'A4', margin: 40 });
        const writeStream = fs.createWriteStream(outputPdfPath);
        doc.pipe(writeStream);
        // 🎨 [โซนดีไซน์หน้าตาเอกสาร A4]
        // หมายเหตุ: หน้างานจริงถ้าต้องการภาษาไทยแบบสมบูรณ์ กัปตันสามารถโหลดฟอนต์ .ttf มาฝังพิมพ์เพิ่มได้ค่ะ
        doc.fontSize(18).text('FACTORY WAIT-CUT REPORT', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(10).text(`พิมพ์เมื่อวันที่: ${new Date().toLocaleString('th-TH')}`, { align: 'right' });
        doc.text('------------------------------------------------------------------------------------------------------------------------');
        doc.moveDown();
        // ละเลงข้อมูลหลักที่ส่งมาจากหน้าจอเว็บ
        doc.fontSize(12).text(`ลำดับคิวงาน (Queue No): ${jobData.queue_no || '-'}`);
        doc.text(`เลขที่ใบสั่งผลิตหลัก (Job No): ${jobData.jobNo || '-'}`);
        doc.text(`รหัสม้วนย่อย (Roll No): ${jobData.rollNo || '-'}`);
        doc.text(`ชุดเซตที่: ${jobData.setIndex || '0'}   |   ลำดับม้วนในเซต: ${jobData.rollIndexInSet || '0'}`);
        doc.moveDown(0.5);
        doc.text('------------------------------------------------------------------------------------------------------------------------');
        doc.moveDown();
        // แสดงผลไฮไลท์ตัวเลขน้ำหนักสำคัญ
        doc.fontSize(14).text(`น้ำหนักเป้าหมาย (Target Weight): ${jobData.targetWeight || '-'} kg`);
        doc.fontSize(16).fillColor('blue').text(`น้ำหนักชั่งจริงจากเครื่องชั่ง (Actual Weight): ${jobData.actualWeight || '0'} kg`, { underline: true });
        doc.fillColor('black'); // รีเซ็ตสีกลับเป็นสีดำ
        doc.moveDown();
        doc.fontSize(12).text(`สถานะกระบวนการ: ${jobData.status || 'COMPLETED'}`);
        doc.moveDown(2);
        doc.text('ลงชื่อ............................................................ พนักงานหน้างาน', { align: 'right' });
        // สั่งปิดตารางวาดภาพและเซฟไฟล์ลงระบบดิสก์คอมพิวเตอร์
        doc.end();
        // 🔒 ล็อกรอให้ระบบบันทึกไฟล์ PDF ลงคอมจนเสร็จสมบูรณ์ร้อยเปอร์เซ็นต์ก่อน ค่อยส่งคำสั่งเข้าเครื่องพิมพ์
        await new Promise((resolve, reject) => {
            writeStream.on('finish', () => resolve());
            writeStream.on('error', (err) => reject(err));
        });
        console.log(`📄 สลักไฟล์ PDF ชั่วคราวสำเร็จที่: ${outputPdfPath}`);
        // 🚀 3. สั่งปืนใหญ่ยิงพิมพ์แบบเงียบ (Silent Print) ทะลุเข้าเครื่องพิมพ์หลักของ Windows
        try {
            console.log('🖨️ กำลังส่งข้อมูลเข้าคิวเครื่องพิมพ์ดีฟอลต์บนคอมพิวเตอร์...');
            await ptp.print(outputPdfPath, {
                // printer: "HP_LaserJet_Pro_M404", // ถ้าต้องการเจาะจงชื่อเครื่องพิมพ์ปลายทาง (ถ้ามีหลายเครื่อง) สามารถใส่ชื่อที่ตรงกับใน Control Panel ได้เลยค่ะ
                scale: "fit", // บังคับสเกลภาพให้พอดีกระดาษ A4 ไม่ให้ตกขอบ
            });
            console.log('🟢 เครื่องพิมพ์ปลายทางรับคำสั่ง และกำลังรีดกระดาษรายงาน A4 ออกมาแล้วค่ะกัปตัน!');
        }
        catch (printError) {
            console.error('🔴 ระบบคำสั่งเครื่องพิมพ์ล้มเหลว:', printError.message);
            throw printError;
        }
        finally {
            // ⚓ ล็อกเป้าหมาย: ไม่ว่าจะพิมพ์ผ่าน หรือ ปริ้นล่มสลาย 
            // ระบบจะหน่วงเวลา 10 วินาทีแล้วดักทำลายไฟล์ขยะทิ้งเสมอเพื่อเคลียร์พื้นที่เครื่องหน้างาน!
            setTimeout(() => {
                try {
                    if (fs.existsSync(outputPdfPath)) {
                        fs.unlinkSync(outputPdfPath);
                        console.log(`🗑️ [Cleanup] กำจัดไฟล์ขยะชั่วคราวออกเรียบร้อยแล้ว: report-${jobData.id || 'test'}.pdf`);
                    }
                }
                catch (unlinkError) {
                    console.error('🔴 ดักล้างไฟล์ชั่วคราวขัดข้อง:', unlinkError.message);
                }
            }, 10000);
        }
    }
}
//# sourceMappingURL=print-service.js.map