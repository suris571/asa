import puppeteer from 'puppeteer';
import ejs from 'ejs';
import path from 'path';
import fs from 'fs';
// 🟢 1. Import ตัวช่วยแกะรอยพิกัดเพิ่มเติมเข้ามาค่ะ
import { fileURLToPath } from 'url';
// 🟢 2. เสกตัวแปร __filename และ __dirname ขึ้นมาใช้เองตามมาตรฐานสากลของ ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export async function generateLabelPdf(data) {
    let browser;
    try {
        const outputDir = path.join(__dirname, '../../c_labels');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        const templatePath = path.join(__dirname, '../../views/label-preview.ejs');
        const htmlContent = await ejs.renderFile(templatePath, data);
        console.log(`⏳ [Agent] กำลังติดเครื่องยนต์บราวเซอร์จำลองเพื่อเรนเดอร์ PDF...`);
        // 🎯 1. ซ่อน Window ของ Process ทั้งหมด
        process.env.ELECTRON_HIDE_INTERNAL_WINDOWS = "true";
        // 🎯 2. ปรับค่า puppeteer.launch ซ่อน Console / Command Window เบื้องหลัง
        browser = await puppeteer.launch({
            headless: 'shell', // 👈 เปลี่ยนจาก true เป็น 'shell' (โหมดประมวลผลเบื้องหลังเบาลงและไม่สร้าง GUI Window)
            // pipe: true,       // 👈 แนะนำให้ปิด pipe ไว้ก่อน เพราะ pipe บน Windows บางครั้งบังคับเปิด console
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--no-first-run',
                '--disable-extensions',
                '--hide-scrollbars',
                '--mute-audio',
                '--background-color=#ffffff'
            ]
        });
        const page = await browser.newPage();
        const htmlDataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`;
        await page.goto(htmlDataUrl, { waitUntil: 'networkidle0' });
        const pdfPath = path.join(outputDir, `LABEL_${data.rollNo}.pdf`);
        await page.pdf({
            path: pdfPath,
            format: 'A4',
            printBackground: true,
            margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' }
        });
        console.log(`✅ [Agent Success] เขียนไฟล์ PDF ลงเครื่องจักรสำเร็จ: ${pdfPath}`);
        return pdfPath;
    }
    catch (error) {
        console.error('💥 ระบบเซฟไฟล์ PDF ล้มเหลว:', error);
        throw error;
    }
    finally {
        if (browser) {
            await browser.close();
        }
    }
}
//# sourceMappingURL=pdf-service.js.map