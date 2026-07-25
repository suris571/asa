// 📦 โครงสร้างข้อมูลใบรับน้ำหนักลูกกระดาษ
import { getConnection } from "../../database";
import oracledb from "oracledb";

export interface WeighingRecord {
    roll_no: string;
    grade: string;
    version: string; // รุ่น
    size: string;
    weight: number;
    status: 'PASS' | 'HOLD';
    remark: string;
}

// 💾 คลังข้อมูลจำลองประวัติการชั่งน้ำหนักในแรม (In-Memory)

export class WeighingModel {
    // ดึงประวัติที่ชั่งน้ำหนักแล้วทั้งหมดมารายงานผล
    static async getNextWeighing(search: string | null = null): Promise<any> {
        let conn;

        try {
            conn = await getConnection();

            // 🎯 1. Query ดึงคิว
            let sql = `
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
                    status              AS "status",
                    remark              AS "remark",
                    created_at          AS "createdAt",
                    order_no            AS "orderNo",
                    order_item          AS "orderItem",
                    set_no              AS "setNo",
                    cut_length          AS "cutLength",
                    queue_no            AS "queueNo",
                    diameter            AS "diameter",
                    finish_at           AS "finish_at",
                    reel_no             AS "reel_no",
                    total               AS "total",
                    already_done        AS "alreadyDone"
                FROM pl_wait_weighing_view
                WHERE (status IS NULL OR TRIM(status) = '')
            `;

            const binds: any = {};
            const isSearchMode = search && search.trim() !== '';

            // 🔍 2. เช็ก search parameter และต่อเงื่อนไข LIKE order_no
            if (isSearchMode) {
                sql += ` AND UPPER(order_no) LIKE :search`;
                binds.search = `%${search.trim().toUpperCase()}%`;
            }

            // 🎯 3. จัดเรียงคิว
            sql += ` ORDER BY queue_no ASC NULLS LAST, set_no ASC, roll_no DESC`;

            // ถ้าไม่ได้ค้นหา ให้จำกัดเอาแค่ 1 รายการ
            if (!isSearchMode) {
                sql += ` FETCH FIRST 1 ROWS ONLY`;
            }

            const result = await conn.execute(sql, binds, {
                outFormat: oracledb.OUT_FORMAT_OBJECT
            });

            const rows: any[] = result.rows || [];

            // 🎯 Helper Function สำหรับแปลงวันที่ + คำนวณ remaining
            const processRowData = (row: any) => {
                if (!row) return row;

                // 📅 1. จัด Format วันที่
                if (row.createdAt) {
                    const dateObj = row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt);
                    if (!isNaN(dateObj.getTime())) {
                        row.createdAt = dateObj.toLocaleDateString('en-GB', {
                            timeZone: 'Asia/Bangkok'
                        });
                    }
                }

                // 🧮 2. คำนวณ remaining = total - alreadyDone
                const total = Number(row.total || 0);
                const alreadyDone = Number(row.alreadyDone || 0);
                
                // ป้องกันติดลบ (ถ้ามี) ให้สลับเป็น 0 ต่ำสุด
                row.remaining = Math.max(0, total - alreadyDone);

                return row;
            };

            // 🎯 4. เงื่อนไขการ Return ข้อมูล
            if (isSearchMode) {
                // 🟢 กรณีมี ค้นหา (search): แปลงข้อมูลทุกแถว แล้ว Return เป็น Array
                return rows.map(row => processRowData(row));
            } else {
                // 🟢 กรณีไม่ได้ค้นหา: แปลงข้อมูลเฉพาะแถวแรก แล้ว Return เป็น Object (หรือ null)
                return rows.length > 0 ? processRowData(rows[0]) : null;
            }

        } catch (error) {
            console.error("❌ เกิดข้อผิดพลาดใน Model [getNextWeighing]:", error);
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

    static async updateWeighingResult(data: {
        id: number | string,
        weigh: number,
        status: string,
        remark: string | null,
    }): Promise<boolean> {
        let conn;
        try {
            conn = await getConnection();

            const sql = `
                UPDATE pl_wait_weighing
                SET 
                    weigh = :weigh,
                    status = :status,
                    remark = :remark,
                WHERE id = :id
            `;

            const result = await conn.execute(sql, {
                weigh: data.weigh,
                status: data.status,
                remark: data.remark,
                id: data.id
            }, { autoCommit: false });

            const isSuccess = (result.rowsAffected && result.rowsAffected > 0) ? true : false;

            // 🎯 บันทึกผลลง Database ถาวรเมื่อ Update สำเร็จ
            if (isSuccess) {
                await conn.commit();
            } else {
                await conn.rollback();
            }

            return isSuccess;

        } catch (error) {
            // 🎯 ถ้ามี Error ให้ Rollback ทันที
            if (conn) await conn.rollback();
            console.error("❌ เกิดข้อผิดพลาดใน Model [updateWeighingResult]:", error);
            throw error;
        } finally {
            if (conn) await conn.close();
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

    static async CheckResetSplitSet(id:number): Promise<any | null> {
        let conn;

        try {
            conn = await getConnection();

            // 🎯 Query ดึงคิวถัดไปเพียง 1 รายการ จาก View ตัวใหม่ล่าสุด
            const sqlSelect = `
                SELECT 
                    id AS "id"
                FROM pl_wait_weighing_view
                WHERE split_set_id = :id
                AND weigh IS NOT NULL
                FETCH FIRST 1 ROWS ONLY
            `;

            // 1. ค้นหาข้อมูล (ใช้ Object { id } ให้ตรงกับ :id ใน SQL)
            const result = await conn.execute(sqlSelect, { id }, {
                outFormat: oracledb.OUT_FORMAT_OBJECT
            });

            // 2. ถ้าเจอข้อมูล ให้ส่งออกแถวแรกทันที
            if (result.rows && result.rows.length > 0) {
                console.log("reset ไม่ได้เจอข้อมูล")
                return false;
            }
            console.log(result)

            // 3. 🚨 ถ้าไม่เจอข้อมูล (แสดงว่าไม่มีม้วนไหนที่มีค่าน้ำหนักเลย) ให้สั่งลบข้อมูลใน PL_WAIT_WEIGHING ทั้งหมดของ split_set_id นี้
            const sqlDelete = `
                DELETE FROM pl_wait_weighing
                WHERE split_set_id = :id
            `;

            await conn.execute(sqlDelete, { id });

            // 💡 อย่าลืม commit หากฟังก์ชันนี้จัดการ transaction เอง
            await conn.commit();


            return true;

        } catch (error) {
            console.error("❌ เกิดข้อผิดพลาดใน Model [getNextWeighing]:", error);
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