// src/models/wait-cut.model.ts
import { getConnection } from "../../database";
import oracledb from "oracledb";


export class AuthModel {
    private static DepartMent_id = 571; // กำหนดค่า department_id เป็น 571

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


    static async validateStaff(username: string, password: string): Promise<any | null> {
        let conn;
        try {
            conn = await getConnection();

            const sql = `
                SELECT 
                    id,
                    user_name,
                    first_name,
                    last_name,
                    department_id,
                    position_id,
                    status,
                    bar_code
                FROM staff
                WHERE user_name = :username
                AND passwd = :password
                AND department_id = :DepartMent_id
                AND status = 'ปกติ'
            `;

            const result: any = await conn.execute(
                sql,
                { 
                    username: username.trim(),
                    password: password.trim(),
                    DepartMent_id: this.DepartMent_id
                },
                { outFormat: oracledb.OUT_FORMAT_OBJECT }
            );

            // ถ้าไม่เจอพนักงาน ให้คืนค่า null
            if (!result.rows || result.rows.length === 0) {
                return null;
            }

            // คืนค่าข้อมูลพนักงานแถวแรก
            return result.rows[0];

        } catch (error) {
            console.error("❌ Model Error [validateStaff]:", error);
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
