"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WaitCutModel = void 0;
// src/models/wait-cut.model.ts
const database_1 = require("../../database");
let mockOrdersDatabase = [
    {
        id: 1, priority_seq: 1, order_no: '0065/2026', item: 1, grade: 'KA185', set_qty: 6,
        blade: [1855, 1855, null, null], size: [72, 72, null, null],
        finish_date: 'xx/xx/xxx', finish_time: 'xx:xx:xx', total_rolls: 12, current_set: 6, status: 'รอส่งงาน'
    },
    {
        id: 2, priority_seq: 2, order_no: '0065/2026', item: 2, grade: 'KA185', set_qty: 12,
        blade: [1960, 1755, null, null], size: [76, 68, null, null],
        finish_date: 'xx/xx/xxx', finish_time: 'xx:xx:xx', total_rolls: 24, current_set: 12, status: 'HOLD'
    },
    {
        id: 3, priority_seq: 3, order_no: '0065/2026', item: 3, grade: 'KA185', set_qty: 57,
        blade: [2055, 1655, null, null], size: [80, 64, null, null],
        finish_date: 'xx/xx/xxx', finish_time: 'xx:xx:xx', total_rolls: 12, current_set: 6, status: 'เสร็จสิ้น'
    }
];
class WaitCutModel {
    // 🌟 ย้ายเข้ามาอยู่ในคลาสเพื่อความเป็นระบบสากล
    static async getAllWaitingAndWeighing() {
        let conn;
        try {
            conn = await (0, database_1.getConnection)();
            const query = `
          SELECT id, job_no, roll_no, set_index, roll_index_in_set, target_weight, actual_weight, status, queue_no
          FROM wait_cut
          WHERE status IN ('รอสั่งตัด', 'รอตัด' , 'ตัดไม่ครบ' , 'HOLD')
          ORDER BY queue_no ASC
        `;
            const result = await conn.execute(query);
            const dataList = [];
            if (result.rows) {
                for (const row of result.rows) {
                    dataList.push({
                        id: row[0],
                        jobNo: row[1],
                        rollNo: row[2],
                        setIndex: row[3],
                        rollIndexInSet: row[4],
                        targetWeight: row[5],
                        actualWeight: row[6],
                        status: row[7],
                        queue_no: row[8] // ล็อกพิกัดคิวลงออบเจกต์ส่งออก
                    });
                }
            }
            return dataList;
        }
        catch (error) {
            console.error('🔴 Model พลั้งพลาดตอนดึงข้อมูลรอบแรก:', error);
            throw error;
        }
        finally {
            if (conn) {
                await conn.close();
            }
        }
    }
    static async getAllOrders() {
        let a = await this.getAllWaitingAndWeighing();
        return a;
    }
    static async moveOrderUp(orderId) {
        const index = mockOrdersDatabase.findIndex(o => o.id === orderId);
        if (index > 0) {
            const temp = mockOrdersDatabase[index];
            mockOrdersDatabase[index] = mockOrdersDatabase[index - 1];
            mockOrdersDatabase[index - 1] = temp;
            const tempSeq = mockOrdersDatabase[index].priority_seq;
            mockOrdersDatabase[index].priority_seq = mockOrdersDatabase[index - 1].priority_seq;
            mockOrdersDatabase[index - 1].priority_seq = tempSeq;
        }
        return mockOrdersDatabase;
    }
    static async moveOrderDown(orderId) {
        const index = mockOrdersDatabase.findIndex(o => o.id === orderId);
        if (index !== -1 && index < mockOrdersDatabase.length - 1) {
            const temp = mockOrdersDatabase[index];
            mockOrdersDatabase[index] = mockOrdersDatabase[index + 1];
            mockOrdersDatabase[index + 1] = temp;
            const tempSeq = mockOrdersDatabase[index].priority_seq;
            mockOrdersDatabase[index].priority_seq = mockOrdersDatabase[index + 1].priority_seq;
            mockOrdersDatabase[index + 1].priority_seq = tempSeq;
        }
        return mockOrdersDatabase;
    }
}
exports.WaitCutModel = WaitCutModel;
