// src/models/wait-cut.model.ts
import { getConnection } from "../../database";
import oracledb from "oracledb";

export class AuthModel {

    static async getProductionLineIdByNo(productionLineNo: number | string): Promise<number> {
    let conn;
    try {
        conn = await getConnection();

        // 🎯 Query หา ID จากตาราง PL_PRODUCTION_LINE โดยใช้เลขเครื่องจักรเป็นเงื่อนไข
        const sql = `
            SELECT id 
            FROM pl_production_line 
            WHERE production_line = :lineNo
        `;

        const result: any = await conn.execute(
            sql,
            { lineNo: productionLineNo },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        // 🛡️ เช็คว่ามีข้อมูลเครื่องจักรนี้ในระบบหรือไม่
        if (!result.rows || result.rows.length === 0) {
            throw new Error(`ไม่พบข้อมูลเครื่องจักรในตาราง PL_PRODUCTION_LINE สำหรับหมายเลข: ${productionLineNo}`);
        }

        // ดึงค่า ID ออกมา (รองรับการคืนค่าของ OracleDB ทั้งแบบ Object และ Array)
        const lineId = result.rows[0]?.ID || result.rows[0]?.id || result.rows[0]?.[0];

        return Number(lineId);

    } catch (error) {
        console.error("❌ Model Error [getProductionLineIdByNo]:", error);
        throw error;
    } finally {
        if (conn) {
            try {
                await conn.close();
            } catch (closeErr) {
                console.error("⚠️ ไม่สามารถปิด DB Connection ได้:", closeErr);
            }
        }
    }
}
}
