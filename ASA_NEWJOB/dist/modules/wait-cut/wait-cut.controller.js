"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWaitCutPage = void 0;
const wait_cut_model_1 = require("./wait-cut.model");
const getWaitCutPage = async (req, res) => {
    try {
        const queueData = await wait_cut_model_1.WaitCutModel.getAllWaitingAndWeighing();
        console.log(queueData[0]);
        res.render('wait-cut/index', { orders: queueData });
    }
    catch (error) {
        console.error('🔴 Controller พังจังหวะเรนเดอร์หน้าเว็บ:', error);
        res.status(500).send('เกิดข้อผิดพลาดในการโหลดหน้าเว็บครับกัปตัน');
    }
};
exports.getWaitCutPage = getWaitCutPage;
