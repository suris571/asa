// src/print-service.ts
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import PDFDocument from 'pdfkit';
import ptp from 'pdf-to-printer';

// ⚓ จัดการพิกัดไดเรกทอรีเนื่องจากเราใช้ ESM Module (NodeNext)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class PrintService {

  static async  printPdfFile(filePath: string) {
      try {
          // 🎯 สั่ง Print ไปยัง Default Printer ของเครื่อง
          await ptp.print(filePath,{
            silent: true
          });
          // await ptp.print(filePath, {
          //   printer: "Microsoft Print to PDF"
          // });
          console.log(`✅ สั่งพิมพ์ไฟล์ ${filePath} สำเร็จ!`);

          /* 💡 หรือถ้าต้องการระบุชื่อเครื่องพิมพ์เฉพาะเจาะจง:
          await ptp.print(filePath, {
              printer: "POS-58-Printer", // ใส่ชื่อเครื่องพิมพ์ตรงนี้
              copies: 1                 // จำนวนสำเนา
          });
          */
      } catch (error) {
          console.error("❌ เกิดข้อผิดพลาดในการสั่ง Print:", error);
      }
  }
}