"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WaitCutModel = void 0;
// src/models/wait-cut.model.ts
const database_1 = require("../../database");
const oracledb_1 = __importDefault(require("oracledb"));
class WaitCutModel {
    static async getAllCutStatuses() {
        const query = `
            SELECT id, status_name, description 
            FROM cut_statuses 
            ORDER BY id ASC
        `;
        let conn;
        try {
            conn = await (0, database_1.getConnection)();
            const result = await conn.execute(query, [], {
                outFormat: oracledb_1.default.OUT_FORMAT_OBJECT,
            });
            const dataList = [];
            if (result.rows) {
                for (const row of result.rows) {
                    dataList.push({
                        id: row.ID,
                        status: row.STATUS_NAME
                    });
                }
            }
            return dataList;
        }
        catch (error) {
            console.error("❌ เกิดข้อผิดพลาดในการดึง Master Data สถานะสั่งตัด:", error);
            throw error;
        }
        finally {
            if (conn) {
                try {
                    await conn.close();
                }
                catch (closeError) {
                    console.error("⚠️ ไม่สามารถปิด Database Connection ได้:", closeError);
                }
            }
        }
    }
    static async getAllWaitingAndWeighing(Conn = null, status = null, order_no = null, startDate = null, endDate = null) {
        let conn;
        let isLocalConn = false;
        try {
            if (Conn) {
                conn = Conn;
            }
            else {
                conn = await (0, database_1.getConnection)();
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
                    finish_date, finish_time, diameter, queue_no, cut_status_id
                FROM pl_order_view
                WHERE STATUS = 'ส่งให้ Rewider'
            `;
            const bindParams = {};
            // ⚡ เงื่อนไขที่ 1: ค้นหาด้วยเลขที่ใบสั่งผลิต (เหมือนเดิม)
            if (order_no && typeof order_no === "string" && order_no.trim() !== "" && order_no !== "null") {
                query += ` AND order_no LIKE :orderNo `;
                bindParams.orderNo = `%${order_no.trim()}%`;
            }
            // ⚡ เงื่อนไขที่ 2: ค้นหาด้วยสถานะระบบใหม่ (แก้ไขให้ถูกต้องตามลอจิก)
            if (status && typeof status === "string" && status.trim() !== "" && status !== "null") {
                const selectedStatus = parseInt(status.trim());
                if (selectedStatus === 1) {
                    // 🎯 เคสพิเศษ: ถาเลือก "รอสั่งตัด" ให้ดึงทั้งไอดีที่เป็น 1 และค่าที่เป็น NULL (ข้อมูลใหม่)
                    query += ` AND (cut_status_id = 1 OR cut_status_id IS NULL) `;
                }
                else {
                    // เคสปกติ: 2=รอตัด, 3=ตัดไม่ครบ, 4=HOLD
                    query += ` AND cut_status_id = :cutStatusId `;
                    bindParams.cutStatusId = selectedStatus;
                }
            }
            else {
                // 🎯 เคสทั่วไป: ถ้าหน้าบ้านไม่ได้เลือกฟิลเตอร์สถานะอะไรเลย ให้ดึงคิวงานที่ยังไม่เสร็จทั้งหมดขึ้นมา (1, 2, 3, 4 และ NULL)
                query += ` AND (cut_status_id IS NULL OR cut_status_id IN (1, 2, 3, 4)) `;
            }
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            // ⚡ เงื่อนไขที่ 3: วันที่เริ่มต้น (ชนตรง ๆ ตามแบบกัปตัน)
            if (startDate && typeof startDate === 'string' && dateRegex.test(startDate.trim())) {
                query += ` AND finish_date >= :startDate `;
                bindParams.startDate = startDate.trim();
            }
            // ⚡ เงื่อนไขที่ 4: วันที่สิ้นสุด (ชนตรง ๆ ตามแบบกัปตัน)
            if (endDate && typeof endDate === 'string' && dateRegex.test(endDate.trim())) {
                query += ` AND finish_date <= :endDate `;
                bindParams.endDate = endDate.trim();
            }
            // จัดเรียงตามลำดับคิวงาน
            query += ` ORDER BY queue_no ASC`;
            // 🎯 [ดักจับก่อนยิง] ปริ้นต์ดู SQL และ bindParams สุดท้ายที่จะส่งให้ Oracle
            // console.log("🚀 [Executing SQL]:", query);
            // console.log("📦 [Bind Params]:", bindParams);
            const result = await conn.execute(query, bindParams, {
                outFormat: oracledb_1.default.OUT_FORMAT_OBJECT,
            });
            const dataList = [];
            let i = 0;
            if (result.rows) {
                for (const row of result.rows) {
                    i++;
                    dataList.push({
                        number: i,
                        pl_order_detail_id: row.PL_ORDER_DETAIL_ID,
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
                        cut_status_id: row.CUT_STATUS_ID,
                    });
                }
            }
            console.log("============================================================================");
            return dataList;
        }
        catch (error) {
            console.error("🔴 Model พลั้งพลาดตอนดึงข้อมูลเจาะจงคอลัมน์:", error);
            throw error;
        }
        finally {
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
    /**
     * 🚀 ไม้ตายสั่งตัด: อัปเดตสถานะงานหลัก และกระจายแถวย่อยลงตารางสั่งตัดแยกเซ็ต
     * @param orderId รหัสออเดอร์หลัก
     * @param orderDetailId รหัสรายละเอียดออเดอร์
     * @param qty จำนวนเซ็ตที่ต้องการสร้าง
     */
    static async createOrderSplitSet(orderId, orderDetailId, qty) {
        let conn;
        try {
            conn = await (0, database_1.getConnection)();
            // 🔒 ขั้นตอนที่ 1: อัปเดตสถานะใบสั่งผลิตในตารางหลักให้เป็น "รอตัด (ID = 2)"
            const updateDetailQuery = `
                UPDATE pl_order_detail 
                SET cut_status_id = 2 
                WHERE id = :orderDetailId
            `;
            await conn.execute(updateDetailQuery, { orderDetailId });
            // 🔒 ขั้นตอนที่ 2: เตรียม Query สำหรับกระจายชุดย่อย (เพิ่มฟิลด์ set_no เข้าไปในคำสั่ง SQL)
            const insertSplitQuery = `
                INSERT INTO pl_cut_split_set (pl_order_id, pl_order_detail_id, set_no, cut_length, status)
                VALUES (:orderId, :orderDetailId, :setNo, 0, 1)
            `;
            // 🚀 วนลูปยัดข้อมูลลงฐานข้อมูลตามจำนวนเซ็ต พร้อมคำนวณค่า String เศษส่วน
            for (let i = 0; i < qty; i++) {
                const currentSet = i + 1; // ลำดับที่กำลังรัน (เริ่มจาก 1)
                const setNoStr = `${currentSet}/${qty}`; // ผลลัพธ์จะได้เป็น '1/6', '2/6', '3/6' ตามลำดับ
                // ยิงคำสั่งเซฟลง Oracle DB ทีละแถวพร้อมกันในมัดเดียว
                await conn.execute(insertSplitQuery, {
                    orderId,
                    orderDetailId,
                    setNo: setNoStr // 🎯 ส่ง String เศษส่วนเข้าไปเก็บในฐานข้อมูลโดยตรง
                });
            }
            // ยืนยันกระบวนการ Transaction ทั้งหมด (Atomic Commit)
            await conn.commit();
            return true;
        }
        catch (error) {
            if (conn) {
                try {
                    await conn.rollback();
                }
                catch (rbErr) {
                    console.error("⚠️ Rollback ล้มเหลว:", rbErr);
                }
            }
            console.error("❌ เกิดข้อผิดพลาดในระดับ Model [createOrderSplitSet]:", error);
            throw error;
        }
        finally {
            if (conn) {
                try {
                    await conn.close();
                }
                catch (closeError) {
                    console.error("⚠️ ไม่สามารถปิด Database Connection ได้:", closeError);
                }
            }
        }
    }
}
exports.WaitCutModel = WaitCutModel;
