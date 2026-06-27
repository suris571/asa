"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WeighingModel = void 0;
// 💾 คลังข้อมูลจำลองประวัติการชั่งน้ำหนักในแรม (In-Memory)
let mockWeighingDatabase = [
    { roll_no: 'R260601-01', grade: 'KA185', version: 'รุ่น A', size: '72 นิ้ว', weight: 450.5, status: 'PASS', remark: '' },
    { roll_no: 'R260601-02', grade: 'KA185', version: 'รุ่น A', size: '72 นิ้ว', weight: 452.0, status: 'PASS', remark: '' },
    { roll_no: 'R260601-03', grade: 'KA185', version: 'รุ่น B', size: '76 นิ้ว', weight: 480.2, status: 'HOLD', remark: 'กระดาษยับช่วงท้ายม้วน' }
];
class WeighingModel {
    // ดึงประวัติที่ชั่งน้ำหนักแล้วทั้งหมดมารายงานผล
    static async getHistory() {
        return mockWeighingDatabase;
    }
    // บันทึกน้ำหนักม้วนใหม่ลงกล่องคลังสินค้า
    static async saveRecord(newRecord) {
        // ใช้ท่า Pass by Reference หย่อนของใหม่ลงฐานข้อมูลแรมตรงๆ 
        mockWeighingDatabase.push(newRecord);
        return mockWeighingDatabase;
    }
    static async getLatestReadySubRoll() {
        return {
            order_no: '0066/2026',
            roll_no: 'R260618-01', // รหัสลูกม้วนย่อยตัวแรกที่เพิ่งคลอด
            grade: 'KA185',
            version: 'รุ่น ASSSf',
            size: '72 นิ้ว',
            diameter: 1200
        };
    }
}
exports.WeighingModel = WeighingModel;
