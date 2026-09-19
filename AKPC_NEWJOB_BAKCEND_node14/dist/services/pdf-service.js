"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateLabelPdf = void 0;
const puppeteer_1 = __importDefault(require("puppeteer"));
const ejs_1 = __importDefault(require("ejs"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
async function generateLabelPdf(data) {
    let browser;
    try {
        const outputDir = path_1.default.join(__dirname, '../../c_labels');
        if (!fs_1.default.existsSync(outputDir)) {
            fs_1.default.mkdirSync(outputDir, { recursive: true });
        }
        const templatePath = path_1.default.join(__dirname, '../../views/label-preview.ejs');
        const htmlContent = await ejs_1.default.renderFile(templatePath, data);
        process.env.ELECTRON_HIDE_INTERNAL_WINDOWS = "true";
        browser = await puppeteer_1.default.launch({
            headless: true,
            executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
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
        const pdfPath = path_1.default.join(outputDir, `LABEL_${data.rollNo}.pdf`);
        await page.pdf({
            path: pdfPath,
            format: 'A4',
            printBackground: true,
            pageRanges: '1',
            preferCSSPageSize: true,
            margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' }
        });
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
exports.generateLabelPdf = generateLabelPdf;
//# sourceMappingURL=pdf-service.js.map