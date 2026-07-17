// src/models/wait-cut.model.ts
import { getConnection } from "../../database";
import oracledb from "oracledb";

// ⚓ 1. อัปเดตอินเตอร์เฟสให้รองรับ queue_no จากเบสจริง
export interface WaitCutRow {
    id?: number;
    jobNo: string;
    rollNo: string;
    setIndex: number;
    rollIndexInSet: number;
    targetWeight?: number;
    actualWeight?: number;
    status?: string;
    queue_no?: number; // เพิ่มเข้ามาเพื่อความแม่นยำทางประเภทข้อมูล
}

export interface OrderQueue {
    id: number;
    priority_seq: number;
    order_no: string;
    item: number;
    grade: string;
    set_qty: number;
    blade: (number | null)[];
    size: (number | null)[];
    finish_date: string;
    finish_time: string;
    total_rolls: number | string;
    current_set: number | string;
    status: string;
}

let mockOrdersDatabase: OrderQueue[] = [
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

export class WaitCutModel {
    static async getAllWaitingAndWeighing(status: any = null, order_no: string = "0350/2026"): Promise<any[]> {
        let conn;
        try {
            conn = await getConnection();

            // 1. ระบุชื่อคอลัมน์ที่ต้องการจาก View ให้ชัดเจน (เจาะจง ไม่ใช้ *)
            const query = `
              SELECT 
                pl_order_id,pl_order_detail_id,order_no, order_item, qty, status,
                grade_name_1, grade_name_2, grade_name_3, grade_name_4,
                blad1, blad2, blad3, blad4,
                size_1, size_2, size_3, size_4,
                finish_date, finish_time, diameter, queue_no
              FROM pl_order_view
              WHERE order_no = :orderNo
              ORDER BY queue_no ASC
            `;

            // 2. บังคับให้ผลลัพธ์ออกมาเป็น Array ของ Object เพื่อให้ใช้ Key ในการ Loop ได้
            const result = await conn.execute<any>(query, [order_no], {
                outFormat: oracledb.OUT_FORMAT_OBJECT,
            });

            const dataList: any[] = [];
            let i = 0;
            if (result.rows) {
                for (const row of result.rows) {
                    i++;
                    // Now you can loop or access directly by KEY!
                    // ย้ำ: Oracle จะแปลงชื่อคอลัมน์เป็นตัวพิมพ์ใหญ่ (Uppercase) เสมอในระดับฐานข้อมูล
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
        } catch (error) {
            console.error("🔴 Model พลั้งพลาดตอนดึงข้อมูลเจาะจงคอลัมน์:", error);
            throw error;
        } finally {
            if (conn) {
                await conn.close();
            }
        }
    }

    static async getAllOrders(): Promise<WaitCutRow[]> {
        let a: WaitCutRow[] = await this.getAllWaitingAndWeighing();
        return a;
    }

    static async moveOrderUp(orderId: number, que_now: number): Promise<any> {
        let conn;
        try {
            conn = await getConnection();

            // 🚨 กัปตันสั่งการ: ดักกรณีที่เป็นคิวที่ 1 อยู่แล้ว จะขยับขึ้นอีกไม่ได้
            if (que_now <= 1) {
                console.log("⚠️ งานนี้อยู่คิวแรกสุดแล้ว ไม่สามารถขยับขึ้นได้อีก");
                return { success: false, message: "Already at the top queue" };
            }

            const target_que = que_now - 1; // คิวเป้าหมายที่เราจะขยับขึ้นไปแทนที่

            // --- เริ่มต้นทำการอัปเดตสลับค่าคิว (Swap Logic) ---

            // 1. ผลักแถวบนสุด (คู่กรณี) ให้ถอยลงมาอยู่ที่คิวปัจจุบันของเราก่อน
            const updateUpperRow = `
                UPDATE PL_ORDER_DETAIL 
                SET QUEUE_NO = :que_now 
                WHERE QUEUE_NO = :target_que
            `;
            await conn.execute(updateUpperRow, { que_now: que_now, target_que: target_que });

            // 2. ดันตัวงานของเรา (orderId) ขึ้นไปเสียบแทนที่คิวบนนั้น
            const updateCurrentRow = `
                UPDATE PL_ORDER_DETAIL 
                SET QUEUE_NO = :target_que 
                WHERE ID = :orderId
            `;
            await conn.execute(updateCurrentRow, { target_que: target_que, orderId: orderId });

            // 3. ทำการ Commit ข้อมูลเพื่อให้การสลับคิวมีผลถาวรในฐานข้อมูลพร้อมกัน
            await conn.commit();

            console.log(`✅ ขยับ ID: ${orderId} ขึ้นไปคิวที่ ${target_que} สำเร็จ!`);
            return { success: true, swappedId: orderId, newQueue: target_que };
        } catch (error) {
            // หากเกิดข้อผิดพลาดกลางคัน ให้สั่ง Rollback เพื่อไม่ให้ระบบคิวพังหรือซ้ำซ้อนกัน
            if (conn) {
                await conn.rollback();
            }
            console.error("🔴 เกิดข้อผิดพลาดใน moveOrderUp:", error);
            throw error;
        } finally {
            if (conn) {
                await conn.close();
            }
        }
    }

    static async moveOrderDown(orderId: any, que_now: any): Promise<any> {
        let conn;
        try {
            // 🚨 เพิ่มจุดนี้: บังคับแปลงค่าที่รับเข้ามาให้เป็น Number เสมอ เพื่อตัดปัญหา NJS-105 (NaN)
            const id = Number(orderId);
            const current_que = Number(que_now);

            // ดักเช็กเผื่อหน้าบ้านส่งค่าพังๆ หรือ undefined หลุดมา
            if (isNaN(id) || isNaN(current_que)) {
                console.error("⚠️ [Error] ข้อมูลที่ส่งเข้ามาใน moveOrderUp ไม่ใช่ตัวเลข (NaN Detected!)");
                return { success: false, message: "Invalid data format: orderId or que_now is NaN" };
            }

            conn = await getConnection();

            // 🚨 กัปตันสั่งการ: ดักกรณีที่เป็นคิวที่ 1 อยู่แล้ว จะขยับขึ้นอีกไม่ได้
            if (current_que <= 1) {
                console.log("⚠️ งานนี้อยู่คิวแรกสุดแล้ว ไม่สามารถขยับขึ้นได้อีก");
                return { success: false, message: "Already at the top queue" };
            }

            const target_que = current_que - 1; // คิวเป้าหมายที่เราจะขยับขึ้นไปแทนที่

            // --- เริ่มต้นทำการอัปเดตสลับค่าคิว (Swap Logic) ---

            // 1. ผลักแถวบนสุด (คู่กรณี) ให้ถอยลงมาอยู่ที่คิวปัจจุบันของเราก่อน
            const updateUpperRow = `
                UPDATE PL_ORDER_DETAIL 
                SET QUEUE_NO = :current_que 
                WHERE QUEUE_NO = :target_que
            `;
            // ใช้ตัวแปรที่แปลงเป็น Number แล้วส่งเข้าไป
            await conn.execute(updateUpperRow, { current_que: current_que, target_que: target_que });

            // 2. ดันตัวงานของเรา (orderId) ขึ้นไปเสียบแทนที่คิวบนนั้น
            const updateCurrentRow = `
                UPDATE PL_ORDER_DETAIL 
                SET QUEUE_NO = :target_que 
                WHERE ID = :id
            `;
            // ใช้ตัวแปรที่แปลงเป็น Number แล้วส่งเข้าไป
            await conn.execute(updateCurrentRow, { target_que: target_que, id: id });

            // 3. ทำการ Commit ข้อมูลเพื่อให้การสลับคิวมีผลถาวรในฐานข้อมูลพร้อมกัน
            await conn.commit();

            console.log(`✅ ขยับ ID: ${id} ขึ้นไปคิวที่ ${target_que} สำเร็จ!`);
            return { success: true, swappedId: id, newQueue: target_que };
        } catch (error) {
            // หากเกิดข้อผิดพลาดกลางคัน ให้สั่ง Rollback เพื่อไม่ให้ระบบคิวพังหรือซ้ำซ้อนกัน
            if (conn) {
                await conn.rollback();
            }
            console.error("🔴 เกิดข้อผิดพลาดใน moveOrderUp:", error);
            throw error;
        } finally {
            if (conn) {
                await conn.close();
            }
        }
    }
}
