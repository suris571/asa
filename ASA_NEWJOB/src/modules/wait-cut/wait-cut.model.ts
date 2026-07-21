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

    static async getAllCutStatuses(): Promise<any[]> {
        const query = `
            SELECT id, status_name, description 
            FROM cut_statuses 
            ORDER BY id ASC
        `;
        let conn; 
        try {
            conn = await getConnection();
            const result = await conn.execute(query, [], {
                outFormat: oracledb.OUT_FORMAT_OBJECT,
            });

            const dataList: any[] = [];
            
            if (result.rows) {
                for (const row of (result.rows as any[])) { 
                    dataList.push({
                        id: row.ID,                 
                        status: row.STATUS_NAME     
                    });
                }
            }
            return dataList;
            
        } catch (error) {
            console.error("❌ เกิดข้อผิดพลาดในการดึง Master Data สถานะสั่งตัด:", error);
            throw error;
        } finally {
            if (conn) {
                try {
                    await conn.close();
                } catch (closeError) {
                    console.error("⚠️ ไม่สามารถปิด Database Connection ได้:", closeError);
                }
            }
        }
    }

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
                    grade1_name,grade2_name,grade3_name,grade4_name,
                    blad1, blad2, blad3, blad4,
                    size_1, size_2, size_3, size_4,
                    finish_date, finish_time, diameter, queue_no, cut_status_id
                FROM pl_order_view
                WHERE STATUS = 'ส่งให้ Rewider'
            `;

            const bindParams: any = {};

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
                } else {
                    // เคสปกติ: 2=รอตัด, 3=ตัดไม่ครบ, 4=HOLD
                    query += ` AND cut_status_id = :cutStatusId `;
                    bindParams.cutStatusId = selectedStatus;
                }
            } else {
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
                outFormat: oracledb.OUT_FORMAT_OBJECT,
            });

            const dataList: any[] = [];
            let i = 0;
            if (result.rows) {
                for (const row of (result.rows as any[])) { 
                    i++;
                    dataList.push({
                        number: i,
                        pl_order_detail_id: row.PL_ORDER_DETAIL_ID,
                        pl_order_id: row.PL_ORDER_ID,
                        orderNo: row.ORDER_NO,
                        orderItem: row.ORDER_ITEM,
                        qty: row.QTY,
                        status: row.STATUS,
                        grade1: row.GRADE1_NAME,
                        grade2: row.GRADE2_NAME,
                        grade3: row.GRADE3_NAME,
                        grade4: row.GRADE4_NAME,
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


    /**
     * 🚀 ไม้ตายสั่งตัด: อัปเดตสถานะงานหลัก และกระจายแถวย่อยลงตารางสั่งตัดแยกเซ็ต
     * @param orderId รหัสออเดอร์หลัก
     * @param orderDetailId รหัสรายละเอียดออเดอร์
     * @param qty จำนวนเซ็ตที่ต้องการสร้าง
     */
    static async createOrderSplitSet(orderId: number, orderDetailId: number, qty: number): Promise<boolean> {
        let conn;

        try {
            conn = await getConnection();

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

        } catch (error) {
            if (conn) {
                try { await conn.rollback(); } catch (rbErr) { console.error("⚠️ Rollback ล้มเหลว:", rbErr); }
            }
            console.error("❌ เกิดข้อผิดพลาดในระดับ Model [createOrderSplitSet]:", error);
            throw error;
        } finally {
            if (conn) {
                try {
                    await conn.close();
                } catch (closeError) {
                    console.error("⚠️ ไม่สามารถปิด Database Connection ได้:", closeError);
                }
            }
        }
    }
    
    static async getSplitSetQueueData(orderNo?: string | null): Promise<any[]> {
        let conn;

        try {
            conn = await getConnection();

            // 🎯 Query ข้อมูลจาก View รวม 3 ตาราง
            let sql = `
                SELECT 
                    split_set_id        AS SPLIT_SET_ID,
                    pl_order_id         AS PL_ORDER_ID,
                    pl_order_detail_id  AS PL_ORDER_DETAIL_ID,
                    order_no            AS ORDER_NO,
                    order_item          AS ORDER_ITEM,
                    grade1_name         AS GRADE1_NAME,
                    grade2_name         AS GRADE2_NAME,
                    grade3_name         AS GRADE3_NAME,
                    grade4_name         AS GRADE4_NAME,
                    set_no              AS SET_NO,
                    blad1               AS BLAD1,
                    blad2               AS BLAD2,
                    blad3               AS BLAD3,
                    blad4               AS BLAD4,
                    size_1              AS SIZE_1,
                    size_2              AS SIZE_2,
                    size_3              AS SIZE_3,
                    size_4              AS SIZE_4,
                    cut_length          AS CUT_LENGTH,
                    split_status_id     AS CUT_STATUS_ID,
                    queue_no            AS QUEUE_NO,
                    order_item
                FROM pl_cut_split_set_view
                WHERE 1=1
                `;

            const binds: any = {};

            // 🔍 รับและกรองเฉพาะ orderNo ตัวเดียวตามคำสั่งกัปตัน
            if (orderNo && orderNo.trim() !== '') {
                sql += ` AND UPPER(order_no) LIKE :orderNo`;
                binds.orderNo = `%${orderNo.trim().toUpperCase()}%`;
            }

            // 🎯 จัดเรียงตามลำดับคิวหลัก และ ลำดับเซ็ตย่อย (1/6, 2/6, ...)
            sql += ` ORDER BY queue_no ASC, split_set_id ASC`;

            const result = await conn.execute(sql, binds, {
                outFormat: oracledb.OUT_FORMAT_OBJECT,
            });

            const dataList: any[] = [];
            let i = 0;
            if (result.rows) {
                for (const row of (result.rows as any[])) { 
                    i++;
                    dataList.push({
                        number: i,
                        order_no: row.ORDER_NO,
                        orderItem: row.ORDER_ITEM,
                        grade1: row.GRADE1_NAME,
                        grade2: row.GRADE2_NAME,
                        grade3: row.GRADE3_NAME,
                        grade4: row.GRADE4_NAME,
                        set: row.SET_NO,
                        blad1: row.BLAD1,
                        blad2: row.BLAD2,
                        blad3: row.BLAD3,
                        blad4: row.BLAD4,
                        size1: row.SIZE_1,
                        size2: row.SIZE_2,
                        size3: row.SIZE_3,
                        size4: row.SIZE_4,
                        lenght: row.CUT_LENGHT,
                        status: row.STATUS,
                        que: row.QUEUE_NO,
                        cut_status_id: row.CUT_STATUS_ID,
                        pl_order_id: row.PL_ORDER_ID,
                        pl_order_detail_id: row.PL_ORDER_DETAIL_ID,
                        split_set_id: row.SPLIT_SET_ID,
                    });
                }
            }
            console.log("============================================================================")
            return dataList;

        } catch (error) {
            console.error("❌ เกิดข้อผิดพลาดใน Model [getSplitSetQueueData]:", error);
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


    static async createOrderWeighing(split_set_id: number, pl_order_id: number, pl_order_detail_id: number): Promise<boolean> {
        let conn;

        try {
            conn = await getConnection();

            // 🔍 1. ดึงค่าใบมีด (over_size 1-4), ID ไซซ์ (size 1-4) และ ID เกรด (grade 1-4)
            const queryDetail = `
                SELECT 
                    over_size1 AS BLAD1, over_size2 AS BLAD2, over_size3 AS BLAD3, over_size4 AS BLAD4,
                    size1_id   AS SIZE1_ID, size2_id AS SIZE2_ID, size3_id AS SIZE3_ID, size4_id AS SIZE4_ID,
                    grade1_id  AS GRADE1_ID, grade2_id AS GRADE2_ID, grade3_id AS GRADE3_ID, grade4_id AS GRADE4_ID
                FROM pl_order_detail
                WHERE id = :pl_order_detail_id
            `;

            const result = await conn.execute(queryDetail, { pl_order_detail_id }, {
                outFormat: oracledb.OUT_FORMAT_OBJECT
            });

            if (!result.rows || result.rows.length === 0) {
                throw new Error(`ไม่พบข้อมูลรายละเอียดออเดอร์ ID: ${pl_order_detail_id}`);
            }

            const row: any = result.rows[0];

            // 📦 2. จัดกลุ่มคู่ข้อมูลประจำแต่ละลูก (เก็บเป็น ID ทั้งหมด)
            const rollsToInsert = [];

            if (Number(row.BLAD1) > 0) {
                rollsToInsert.push({ rollNo: 1, bladeSize: row.BLAD1, sizeId: row.SIZE1_ID, gradeId: row.GRADE1_ID });
            }
            if (Number(row.BLAD2) > 0) {
                rollsToInsert.push({ rollNo: 2, bladeSize: row.BLAD2, sizeId: row.SIZE2_ID, gradeId: row.GRADE2_ID });
            }
            if (Number(row.BLAD3) > 0) {
                rollsToInsert.push({ rollNo: 3, bladeSize: row.BLAD3, sizeId: row.SIZE3_ID, gradeId: row.GRADE3_ID });
            }
            if (Number(row.BLAD4) > 0) {
                rollsToInsert.push({ rollNo: 4, bladeSize: row.BLAD4, sizeId: row.SIZE4_ID, gradeId: row.GRADE4_ID });
            }

            // 🛡️ ดักเซฟตี้กรณีไม่มีค่าใบมีด
            if (rollsToInsert.length === 0) {
                rollsToInsert.push({ rollNo: 1, bladeSize: null, sizeId: null, gradeId: null });
            }

            // 🔒 3. Prepared Statement บันทึกข้อมูลลง pl_wait_weighing
            const insertQuery = `
                INSERT INTO pl_wait_weighing (
                    pl_order_id, 
                    pl_order_detail_id, 
                    split_set_id, 
                    roll_no,
                    blade_size, 
                    size_id, 
                    grade_id,
                    model, weigh, status, note
                ) VALUES (
                    :pl_order_id, 
                    :pl_order_detail_id, 
                    :split_set_id, 
                    :rollNo,
                    :bladeSize, 
                    :sizeId, 
                    :gradeId,
                    NULL, NULL, NULL, NULL
                )
            `; 

            // 🚀 4. วนลูป INSERT รายลูก
            for (const roll of rollsToInsert) {
                await conn.execute(insertQuery, { 
                    pl_order_id, 
                    pl_order_detail_id,
                    split_set_id,
                    rollNo: roll.rollNo,
                    bladeSize: roll.bladeSize,
                    sizeId: roll.sizeId,
                    gradeId: roll.gradeId
                });
            }

            await conn.commit();
            console.log(`✅ บันทึกคิวรอชั่งน้ำหนักสำเร็จ: แตกออกมาทั้งหมด ${rollsToInsert.length} ลูก (เก็บค่า grade_id & size_id)`);
            return true;

        } catch (error) {
            if (conn) {
                try { await conn.rollback(); } catch (rbErr) { console.error("⚠️ Rollback ล้มเหลว:", rbErr); }
            }
            console.error("❌ เกิดข้อผิดพลาดในระดับ Model [createOrderWeighing]:", error);
            throw error;
        } finally {
            if (conn) {
                try {
                    await conn.close();
                } catch (closeError) {
                    console.error("⚠️ ไม่สามารถปิด Database Connection ได้:", closeError);
                }
            }
        }
    }
}
