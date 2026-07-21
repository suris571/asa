"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WeighingModel = void 0;
// 📦 โครงสร้างข้อมูลใบรับน้ำหนักลูกกระดาษ
const database_1 = require("../../database");
const oracledb_1 = __importDefault(require("oracledb"));
// 💾 คลังข้อมูลจำลองประวัติการชั่งน้ำหนักในแรม (In-Memory)
class WeighingModel {
    // ดึงประวัติที่ชั่งน้ำหนักแล้วทั้งหมดมารายงานผล
    static async getNextWeighing() {
        let conn;
        try {
            conn = await (0, database_1.getConnection)();
            // 🎯 Query ดึงคิวถัดไปเพียง 1 รายการ จาก View ตัวใหม่ล่าสุด
            const sql = `
                SELECT 
                    id                  AS "id",
                    pl_order_id         AS "orderId",
                    pl_order_detail_id  AS "orderDetailId",
                    split_set_id        AS "splitSetId",
                    roll_no             AS "rollNo",
                    blad                AS "blad",
                    grade_name          AS "gradeName",
                    size_name           AS "sizeName",
                    model               AS "model",
                    weigh               AS "weigh",
                    weighing_status_id  AS "status",
                    note                AS "note",
                    created_at          AS "createdAt",
                    order_no            AS "orderNo",
                    order_item          AS "orderItem",
                    set_no              AS "setNo",
                    cut_length          AS "cutLength",
                    queue_no            AS "queueNo",
                    diameter            AS "diameter",
                    finish_at           AS "finish_at",
                    reel_no             AS "reel_no"
                FROM pl_wait_weighing_view
                WHERE weighing_status_id IS NULL
                ORDER BY queue_no ASC, order_no DESC            
                FETCH FIRST 1 ROWS ONLY
            `;
            const result = await conn.execute(sql, [], {
                outFormat: oracledb_1.default.OUT_FORMAT_OBJECT
            });
            // ถ้ามีรายการคิวค้างอยู่ ให้ส่งออก Object รายการแรกทันที
            if (result.rows && result.rows.length > 0) {
                return result.rows[0];
            }
            return null;
        }
        catch (error) {
            console.error("❌ เกิดข้อผิดพลาดใน Model [getNextWeighing]:", error);
            throw error;
        }
        finally {
            if (conn) {
                try {
                    await conn.close();
                }
                catch (closeErr) {
                    console.error("⚠️ ไม่สามารถปิด DB Connection ได้:", closeErr);
                }
            }
        }
    }
    static async updateWeighingResult(data) {
        let conn;
        try {
            conn = await (0, database_1.getConnection)();
            // 🎯 อัปเดตค่าน้ำหนัก สถานะ หมายเหตุ และเปลี่ยน weighing_status_id เป็นสถานะที่ชั่งเสร็จแล้ว
            const sql = `
                UPDATE pl_wait_weighing
                SET 
                    weigh = :weigh,
                    weighing_status_id = :status,
                    note = :note,
                    model = :model,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = :id
            `;
            const result = await conn.execute(sql, {
                weigh: data.weigh,
                status: data.status === 'PASS' ? 1 : 2, // ตัวอย่าง: 1 = PASS, 2 = HOLD
                note: data.note,
                model: data.model || null,
                id: data.id
            }, { autoCommit: false });
            return (result.rowsAffected && result.rowsAffected > 0) ? true : false;
        }
        catch (error) {
            console.error("❌ เกิดข้อผิดพลาดใน Model [updateWeighingResult]:", error);
            throw error;
        }
        finally {
            if (conn)
                await conn.close();
        }
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
