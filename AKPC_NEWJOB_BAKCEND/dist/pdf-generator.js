const ejs = require('ejs');
const puppeteer = require('puppeteer');
const bwipjs = require('bwip-js');
const path = require('path');
const fs = require('fs');
// 1. ฟังก์ชันเสกบาร์โค้ดสากล
async function generateBarcode(text) {
    try {
        const pngBuffer = await bwipjs.toBuffer({
            bcid: 'code128',
            text: text,
            scale: 3,
            height: 10,
            includetext: false
        });
        return `data:image/png;base64,${pngBuffer.toString('base64')}`;
    }
    catch (err) {
        console.error('สร้างบาร์โค้ดล้มเหลว:', err);
        return '';
    }
}
// 2. กลไกหลัก: รับข้อมูลดิบ -> ยัดใส่ EJS -> วาดเป็น PDF ลงเครื่อง
async function createLabelPdf(labelData) {
    let browser;
    try {
        console.log('⏳ กำลังเตรียมเครื่องพิมพ์ PDF...');
        // สร้างโฟลเดอร์เก็บไฟล์ถ้ายังไม่มี
        const outputDir = path.join(__dirname, 'output_labels');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir);
        }
        // แปลงเลขม้วนให้เป็นรูปบาร์โค้ด Base64
        const barcodeBase64 = await generateBarcode(labelData.rollNo);
        // แนบรูปบาร์โค้ดเข้าไปใน Data ที่จะส่งให้ EJS
        const templateData = { ...labelData, barcodeImage: barcodeBase64 };
        // อ่านไฟล์หน้ากาก EJS (เอาไฟล์ label-preview.ejs มาไว้ใน Agent ด้วย)
        const templatePath = path.join(__dirname, 'views', 'label-template.ejs');
        const htmlContent = await ejs.renderFile(templatePath, templateData);
        // เปิดบราวเซอร์ไร้หัว (Headless) เพื่อแปลง HTML เป็น PDF
        browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();
        // โหลด HTML ลงไป
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        // สั่งถ่ายทอดพลังลงไฟล์ PDF (ล็อกไซส์ A4)
        const outputPath = path.join(outputDir, `LABEL_${labelData.rollNo}.pdf`);
        await page.pdf({
            path: outputPath,
            format: 'A4',
            printBackground: true, // บังคับให้ปริ้นต์สีพื้นหลังและเส้นกรอบด้วย
            margin: { top: '0', right: '0', bottom: '0', left: '0' }
        });
        console.log(`✅ สร้างใบ Label สำเร็จ: ${outputPath}`);
        return outputPath;
    }
    catch (error) {
        console.error('💥 เกิดข้อผิดพลาดในการสร้าง PDF:', error);
    }
    finally {
        if (browser)
            await browser.close(); // ปิดเครื่องยนต์เสมอ
    }
}
export {};
// ==========================================
// 🧪 ตัวอย่างการสั่งรันจาก Agent
// ==========================================
/*
createLabelPdf({
    grade: 'CF150F',
    size: '84',
    weight: '1,768',
    diameter: '48',
    date: '11/01/2026',
    rollNo: '226002624'
});
*/ 
//# sourceMappingURL=pdf-generator.js.map