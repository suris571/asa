import puppeteer from 'puppeteer';
import ejs from 'ejs';
import path from 'path';
import fs from 'fs';

interface LabelData {
  grade: string;
  size: string;
  weight: string;
  diameter: string;
  date: string;
  rollNo: string;
  barcodeImg: string;
  status: string;
}

export async function generateLabelPdf(data: LabelData): Promise<string> {
  let browser;
  try {
    const outputDir = path.join(__dirname, '../../c_labels');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const templatePath = path.join(__dirname, '../../views/label-preview.ejs');
    const htmlContent = await ejs.renderFile(templatePath, data);

    console.log(`⏳ [Agent] กำลังติดเครื่องยนต์บราวเซอร์จำลองเพื่อเรนเดอร์ PDF...`);

    process.env.ELECTRON_HIDE_INTERNAL_WINDOWS = "true"; 

    browser = await puppeteer.launch({
      headless: true, // 👈 ปรับเป็น boolean true สำหรับ Puppeteer v13
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

  } catch (error) {
    console.error('💥 ระบบเซฟไฟล์ PDF ล้มเหลว:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}