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

export class WaitCutModel {
    static async getAllWaitingAndWeighing(Conn: any = null, status: any = null, order_no: any = null, startDate: any = null, endDate: any = null): Promise<any[]> {
        let conn: any;
        let isLocalConn = false;

        try {
            if (Conn) {
                conn = Conn;
            } else {
                conn = await getConnection();
                isLocalConn = true;
            }

            // 🎯 [ดักจับหน้าประตู] ปริ้นต์ดูค่าที่ Model ได้รับจริง ๆ ก่อนประมวลผล
            console.log("🔍 [Model Receive Data] ค่าที่หลุดมาถึง Model:", { status, order_no, startDate, endDate });

            let query = `
            SELECT 
                pl_order_id, pl_order_detail_id, order_no, order_item, qty, status,
                grade_name_1,
                blad1, blad2, blad3, blad4,
                size_1, size_2, size_3, size_4,
                finish_date, finish_time, diameter, queue_no
            FROM pl_order_view
            WHERE 1=1
            `;

            const bindParams: any = {};

            if (order_no && typeof order_no === "string" && order_no.trim() !== "" && order_no !== "null") {
                query += ` AND order_no LIKE :orderNo `;
                bindParams.orderNo = `%${order_no.trim()}%`;
            }

            if (status && typeof status === "string" && status.trim() !== "" && status !== "null") {
                query += ` AND status = :status `;
                bindParams.status = status.trim();
            }

           const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

            // ⚡ เงื่อนไขที่ 3: วันที่เริ่มต้น (เอา TO_CHAR ออก ชนตรงๆ)
            if (startDate && typeof startDate === 'string' && dateRegex.test(startDate.trim())) {
                query += ` AND finish_date >= :startDate `;
                bindParams.startDate = startDate.trim();
            }

            // ⚡ เงื่อนไขที่ 4: วันที่สิ้นสุด (เอา TO_CHAR ออก ชนตรงๆ)
            if (endDate && typeof endDate === 'string' && dateRegex.test(endDate.trim())) {
                query += ` AND finish_date <= :endDate `;
                bindParams.endDate = endDate.trim();
            }

            query += ` ORDER BY queue_no ASC FETCH NEXT 50 ROWS ONLY `;

            // 🎯 [ดักจับก่อนยิง] ปริ้นต์ดู SQL และ bindParams สุดท้ายที่จะส่งให้ Oracle
            console.log("🚀 [Executing SQL]:", query);
            console.log("📦 [Bind Params]:", bindParams);

            const result = await conn.execute(query, bindParams, {
                outFormat: oracledb.OUT_FORMAT_OBJECT,
            });

            const dataList: any[] = [];
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
            console.log("============================================================================")
            return dataList;
        } catch (error) {
            console.error("🔴 Model พลั้งพลาดตอนดึงข้อมูลเจาะจงคอลัมน์:", error);
            throw error;
        } finally {
            if (conn && isLocalConn) {
                await conn.close();
            }
        }
    }

    static async getAllOrders(): Promise<WaitCutRow[]> {
        let a: WaitCutRow[] = await this.getAllWaitingAndWeighing();
        return a;
    }

    static async swapQueue(orderId: any, que_now: any, targetOrderId: any, target_que: any): Promise<any> {
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

            conn = await getConnection();

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
        } catch (error) {
            if (conn) {
                await conn.rollback();
            }
            console.error("🔴 เกิดข้อผิดพลาดในฟังก์ชัน swapQueue:", error);
            throw error;
        } finally {
            if (conn) {
                await conn.close();
            }
        }
    }
}
