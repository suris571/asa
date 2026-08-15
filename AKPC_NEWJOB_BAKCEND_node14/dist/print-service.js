"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrintService = void 0;
const pdf_to_printer_1 = __importDefault(require("pdf-to-printer"));
// ⚓ จัดการพิกัดไดเรกทอรีเนื่องจากเราใช้ ESM Module (NodeNext)
class PrintService {
    static async printPdfFile(filePath) {
        try {
            // 🎯 สั่ง Print ไปยัง Default Printer ของเครื่อง
            await pdf_to_printer_1.default.print(filePath, { silent: true });
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
        }
        catch (error) {
            console.error("❌ เกิดข้อผิดพลาดในการสั่ง Print:", error);
        }
    }
}
exports.PrintService = PrintService;
//# sourceMappingURL=print-service.js.map