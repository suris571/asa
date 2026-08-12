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

        // 1. Query ตรวจสอบข้อมูลพนักงาน
        const staffSql = `
            SELECT 
                id AS "id",
                user_name AS "user_name",
                first_name AS "first_name",
                last_name AS "last_name",
                department_id AS "department_id",
                position_id AS "position_id",
                status AS "status",
                bar_code AS "bar_code"
            FROM staff
            WHERE user_name = :username
            AND passwd = :password
            AND department_id = :DepartMent_id
            AND status = 'ปกติ'
        `;

        const result: any = await conn.execute(
            staffSql,
            { 
                username: username.trim(),
                password: password.trim(),
                DepartMent_id: this.DepartMent_id
            },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        // ถ้าไม่เจอข้อมูลพนักงาน ให้คืนค่า null
        if (!result.rows || result.rows.length === 0) {
            return null;
        }

        const staffData = result.rows[0];

        // 2. Query ดึงรายการสิทธิ์ทั้งหมดของพนักงานท่านนี้จาก STAFF_PERMISSION
        const permSql = `
            SELECT permission_id AS "permission_id"
            FROM staff_permission
            WHERE staff_id = :staff_id
        `;

        const permResult: any = await conn.execute(
            permSql,
            { staff_id: staffData.id },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        // ดึงสิทธิ์ออกมาทำเป็น Array ของเลข ID
        const permissions: number[] = permResult.rows 
            ? permResult.rows.map((row: any) => row.permission_id) 
            : [];

        // 🛑 ถ้าไม่มีสิทธิ์เข้าใช้งานเลยสักอย่าง ให้ตัดสิทธิ์คืนค่า null (ล็อกอินไม่ได้)
        if (permissions.length === 0) {
            console.warn(`⚠️ พนักงาน ID: ${staffData.id} (${username}) ไม่มีสิทธิ์การใช้งานในระบบ`);
            return null;
        }

        // 3. คืนค่าข้อมูลพนักงานพร้อมแนบ Array ของ permissions ไปด้วย
        return {
            ...staffData,
            permissions // ได้ผลลัพธ์เป็น [168, 16801, 16802, ...]
        };

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

static async getPermissionsByStaffId(staffId: number): Promise<number[]> {
    let conn;
    try {
        conn = await getConnection();
        const sql = `
            SELECT permission_id AS "permission_id" 
            FROM staff_permission 
            WHERE staff_id = :staff_id
        `;
        const result: any = await conn.execute(
            sql, 
            { staff_id: staffId }, 
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        return result.rows 
            ? result.rows.map((row: any) => Number(Number(row.permission_id).toFixed(2))) 
            : [];
    } catch (error) {
        console.error("❌ Error fetching permissions:", error);
        return [];
    } finally {
        if (conn) await conn.close();
    }
}
}
