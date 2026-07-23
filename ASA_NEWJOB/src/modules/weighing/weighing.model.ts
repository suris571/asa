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
    static async getNextWeighing(): Promise<any | null> {
        let conn;

        try {
            conn = await getConnection();

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
                    remark              AS "remark",
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
                ORDER BY queue_no ASC, set_no ASC, roll_no DESC            
                FETCH FIRST 1 ROWS ONLY
            `;

            const result = await conn.execute(sql, [], {
                outFormat: oracledb.OUT_FORMAT_OBJECT
            });

            // ถ้ามีรายการคิวค้างอยู่ ให้ส่งออก Object รายการแรกทันที
            if (result.rows && result.rows.length > 0) {
                const row:any = result.rows[0];

                if (row.createdAt) {
                    // 🎯 เช็กว่าเป็น Date Object หรือยัง ถ้าใช่ให้แปลงเป็น DD/MM/YYYY ได้ทันที
                    const dateObj = row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt);
                    
                    // 🎯 ตรวจสอบความถูกต้อง ป้องกันกรณีเป็น Invalid Date
                    if (!isNaN(dateObj.getTime())) {
                        // 'en-GB' จะได้ ฟอร์แมต DD/MM/YYYY เช่น 22/07/2026
                        row.createdAt = dateObj.toLocaleDateString('en-GB', {
                            timeZone: 'Asia/Bangkok' // 🔒 ล็อก Timezone ประเทศไทย ป้องกันปัญหา Server ตั้งเป็น UTC
                        });
                    }
                }
                return row;
            }

            return null;

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
        model?: string | null
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
                    model = :model
                WHERE id = :id
            `;

            const result = await conn.execute(sql, {
                weigh: data.weigh,
                status: data.status,
                remark: data.remark,
                model: data.model || null,
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