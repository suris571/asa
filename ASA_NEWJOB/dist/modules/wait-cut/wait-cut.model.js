"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WaitCutModel = void 0;
// src/models/wait-cut.model.ts
const database_1 = require("../../database");
const oracledb_1 = __importDefault(require("oracledb"));
let mockOrdersDatabase = [
    {
        id: 1,
        priority_seq: 1,
        order_no: "0065/2026",
        item: 1,
        grade: "KA185",
        set_qty: 6,
        blade: [1855, 1855, null, null],
        size: [72, 72, null, null],
        finish_date: "xx/xx/xxx",
        finish_time: "xx:xx:xx",
        total_rolls: 12,
        current_set: 6,
        status: "รอส่งงาน",
    },
    {
        id: 2,
        priority_seq: 2,
        order_no: "0065/2026",
        item: 2,
        grade: "KA185",
        set_qty: 12,
        blade: [1960, 1755, null, null],
        size: [76, 68, null, null],
        finish_date: "xx/xx/xxx",
        finish_time: "xx:xx:xx",
        total_rolls: 24,
        current_set: 12,
        status: "HOLD",
    },
    {
        id: 3,
        priority_seq: 3,
        order_no: "0065/2026",
        item: 3,
        grade: "KA185",
        set_qty: 57,
        blade: [2055, 1655, null, null],
        size: [80, 64, null, null],
        finish_date: "xx/xx/xxx",
        finish_time: "xx:xx:xx",
        total_rolls: 12,
        current_set: 6,
        status: "เสร็จสิ้น",
    },
];
class WaitCutModel {
    static async getAllWaitingAndWeighing(Conn = null, status = null, order_no = "0350/2026") {
        let conn;
        let isLocalConn = false; // 🎯 Flag สำคัญ: ตัวเช็กว่าท่อนี้เปิดขึ้นเองในฟังก์ชันนี้หรือไม่
        try {
            if (Conn) {
                conn = Conn; // ถ้ายืมท่อจากฟังก์ชันอื่นมา (isLocalConn จะเป็น false เหมือนเดิม)
            }
            else {
                conn = await (0, database_1.getConnection)();
                isLocalConn = true; // 🚨 เปิดท่อใหม่ซิง ๆ ในนี้ (ทำเครื่องหมายว่าต้องปิดเอง)
            }
            // 1. ระบุชื่อคอลัมน์ที่ต้องการจาก View ให้ชัดเจน (เจาะจง ไม่ใช้ *)
            const query = `
              SELECT 
                pl_order_id, pl_order_detail_id, order_no, order_item, qty, status,
                grade_name_1, grade_name_2, grade_name_3, grade_name_4,
                blad1, blad2, blad3, blad4,
                size_1, size_2, size_3, size_4,
                finish_date, finish_time, diameter, queue_no
              FROM pl_order_view
              WHERE order_no = :orderNo
              ORDER BY queue_no ASC
            `;
            // 2. บังคับให้ผลลัพธ์ออกมาเป็น Array ของ Object เพื่อให้ใช้ Key ในการ Loop ได้
            const result = await conn.execute(query, [order_no], {
                outFormat: oracledb_1.default.OUT_FORMAT_OBJECT,
            });
            const dataList = [];
            let i = 0;
            if (result.rows) {
                for (const row of result.rows) {
                    i++;
                    dataList.push({
                        number: i,
                        id: row.PL_ORDER_DETAIL_ID,
                        pl_order_id: row.PL_ORDER_ID,
                        orderNo: row.ORDER_NO,
                        orderItem: row.ORDER_ITEM,
                        qty: row.QTY,
                        status: row.STATUS,
                        grade1: row.GRADE_NAME_1,
                        grade2: row.GRADE_NAME_2,
                        grade3: row.GRADE_NAME_3,
                        grade4: row.GRADE_NAME_4,
                        blad1: row.BLAD1,
                        blad2: row.BLAD2,
                        blad3: row.BLAD3,
                        blad4: row.BLAD4,
                        size1: row.SIZE_1,
                        size2: row.SIZE_2,
                        size3: row.SIZE_3,
                        size4: row.SIZE_4,
                        finishDate: row.FINISH_DATE,
                        finishTime: row.FINISH_TIME,
                        diameter: row.DIAMETER,
                        que: row.QUEUE_NO,
                    });
                }
            }
            return dataList;
        }
        catch (error) {
            console.error("🔴 Model พลั้งพลาดตอนดึงข้อมูลเจาะจงคอลัมน์:", error);
            throw error;
        }
        finally {
            // 🚨 🔒 ปิดประตูบั๊ก NJS-003
            // จะสั่ง conn.close() เฉพาะตอนที่ฟังก์ชันนี้เป็นคนคิวรีเปิดท่อขึ้นมาเองเท่านั้น (isLocalConn === true)
            // ถ้าเป็นท่อที่ส่งต่อมาจาก moveOrderUp บล็อกนี้จะปล่อยผ่าน เพื่อให้ตัวแม่เป็นคนปิดในขั้นตอนสุดท้ายตัวคนเดียว
            if (conn && isLocalConn) {
                await conn.close();
            }
        }
    }
    static async getAllOrders() {
        let a = await this.getAllWaitingAndWeighing();
        return a;
    }
    static async swapQueue(orderId, que_now, targetOrderId, target_que) {
        let conn;
        try {
            // 1. เคลียร์ประเภทข้อมูลและดักจับ NaN ทันที ป้องกันเบสพัง
            const id = Number(orderId);
            const my_que = Number(que_now);
            const t_id = Number(targetOrderId);
            const t_que = Number(target_que);
            console.log(`🔍 [Backend Model - Swap Mode] เริ่มการสลับคิวคู่กรณี: ID ${id} (คิว ${my_que}) <-> ID ${t_id} (คิว ${t_que})`);
            if (isNaN(id) || isNaN(my_que) || isNaN(t_id) || isNaN(t_que)) {
                console.error("⚠️ [Error] พบข้อมูลไม่ใช่ตัวเลข (NaN Detected) ใน swapQueue");
                return { success: false, message: "Invalid format: NaN detected" };
            }
            conn = await (0, database_1.getConnection)();
            // 2. ลอจิกการอัปเดตสลับค่าคิว (Direct Swap) ในระดับ Database
            const updateCurrentRow = `
                UPDATE PL_ORDER_DETAIL 
                SET QUEUE_NO = :target_que 
                WHERE ID = :id
            `;
            await conn.execute(updateCurrentRow, { target_que: t_que, id: id });
            const updateTargetRow = `
                UPDATE PL_ORDER_DETAIL 
                SET QUEUE_NO = :my_que 
                WHERE ID = :target_id
            `;
            await conn.execute(updateTargetRow, { my_que: my_que, target_id: t_id });
            // 3. ทำการ Commit ข้อมูลให้บันทึกถาวรพร้อมกันแบบไร้รอยต่อ
            await conn.commit();
            console.log(`✅ สลับคิวใน Database สำเร็จ! (ID ${id} -> คิว ${t_que}) และ (ID ${t_id} -> คิว ${my_que})`);
            // 4. ดึงก้อนข้อมูลชุดใหม่ทั้งหมดหลังสลับคิว (ส่ง conn ตัวเดิมพ่วงไปเพื่อประสิทธิภาพและความปลอดภัย)
            const updatedRawData = await WaitCutModel.getAllWaitingAndWeighing(conn);
            return {
                success: true,
                data: updatedRawData,
            };
        }
        catch (error) {
            if (conn) {
                await conn.rollback();
            }
            console.error("🔴 เกิดข้อผิดพลาดในฟังก์ชัน swapQueue:", error);
            throw error;
        }
        finally {
            if (conn) {
                await conn.close();
            }
        }
    }
}
exports.WaitCutModel = WaitCutModel;
