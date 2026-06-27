"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWeighingPage = void 0;
const weighing_model_1 = require("./weighing.model");
const getWeighingPage = async (req, res) => {
    try {
        // สั่ง await รอรับประวัติการชั่งน้ำหนักย้อนหลังดักทาง SQL
        const historyData = await weighing_model_1.WeighingModel.getHistory();
        // เรนเดอร์หน้าจอ ejs พร้อมสกัดข้อมูลพ่นลงตาราง
        res.render('weighing/index', { history: historyData });
    }
    catch (error) {
        console.error("ระบบหน้าจอชั่งน้ำหนักขัดข้อง:", error);
        res.status(500).send("เกิดข้อผิดพลาดภายในระบบวิศวกรรม");
    }
};
exports.getWeighingPage = getWeighingPage;
