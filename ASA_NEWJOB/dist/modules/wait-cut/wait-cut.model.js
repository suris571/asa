"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WaitCutModel = void 0;
// src/models/wait-cut.model.ts
const database_1 = require("../../database");
const weighing_model_1 = require("./../weighing/weighing.model");
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
    static async getAllWaitingAndWeighing(Conn = null, status = null, order_no = null, startDate = null, endDate = null, productionLineId = null // 🎯 ต่อท้ายสุดตรงนี้
    ) {
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
            console.log("🔍 [Model Receive Data] ค่าที่หลุดมาถึง Model:", { status, order_no, startDate, endDate, productionLineId });
            let query = `
                SELECT 
                    pl_order_id, pl_order_detail_id, order_no, order_item, qty, status,
                    grade1_name, grade2_name, grade3_name, grade4_name,
                    blad1, blad2, blad3, blad4,
                    size_1, size_2, size_3, size_4,
                    finish_date, finish_time, diameter, queue_no, cut_status_id,
                    pl_production_line_id
                FROM pl_order_view
                WHERE 1 = 1
            `;
            const bindParams = {};
            // 🎯 เช็คเพิ่มเฉพาะเมื่อมีการส่ง productionLineId เข้ามา
            if (productionLineId && productionLineId !== "null") {
                query += ` AND pl_production_line_id = :productionLineId `;
                bindParams.productionLineId = Number(productionLineId);
            }
            // ⚡ เงื่อนไขเดิม 1: ค้นหาด้วยเลขที่ใบสั่งผลิต
            if (order_no && typeof order_no === "string" && order_no.trim() !== "" && order_no !== "null") {
                query += ` AND order_no LIKE :orderNo `;
                bindParams.orderNo = `%${order_no.trim()}%`;
            }
            // ⚡ เงื่อนไขเดิม 2: ค้นหาด้วยสถานะระบบใหม่
            if (status && typeof status === "string" && status.trim() !== "" && status !== "null") {
                const selectedStatus = parseInt(status.trim());
                if (selectedStatus === 1) {
                    query += ` AND (cut_status_id = 1 OR cut_status_id IS NULL) `;
                }
                else {
                    query += ` AND cut_status_id = :cutStatusId `;
                    bindParams.cutStatusId = selectedStatus;
                }
            }
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            // ⚡ เงื่อนไขเดิม 3: วันที่เริ่มต้น
            if (startDate && typeof startDate === 'string' && dateRegex.test(startDate.trim())) {
                query += ` AND finish_date >= :startDate `;
                bindParams.startDate = startDate.trim();
            }
            // ⚡ เงื่อนไขเดิม 4: วันที่สิ้นสุด
            if (endDate && typeof endDate === 'string' && dateRegex.test(endDate.trim())) {
                query += ` AND finish_date <= :endDate `;
                bindParams.endDate = endDate.trim();
            }
            if (!order_no && !status && !startDate && !endDate) {
                query += ` AND STATUS = 'ส่งให้ Rewider' `;
                query += ` AND (cut_status_id IS NULL OR cut_status_id IN (1, 2, 3, 4)) `;
            }
            query += ` ORDER BY queue_no ASC`;
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
                        pl_production_line_id: row.PL_PRODUCTION_LINE_ID
                    });
                }
            }
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
            // 🔍 ขั้นตอนที่ 2: เช็คก่อนว่ามีข้อมูลเซ็ตย่อยใน PL_CUT_SPLIT_SET แล้วหรือยัง
            const checkExistingQuery = `
                SELECT COUNT(*) AS COUNT_SETS
                FROM pl_cut_split_set
                WHERE pl_order_detail_id = :orderDetailId
            `;
            const checkResult = await conn.execute(checkExistingQuery, { orderDetailId });
            const existingCount = checkResult.rows[0]?.COUNT_SETS || checkResult.rows[0]?.[0] || 0;
            if (existingCount > 0) {
                // 🔄 CASE A: มีข้อมูลเดิมอยู่แล้ว -> อัปเดตรายการที่ถูก "บังคับเสร็จสิ้น" ให้กลับมาเป็นสถานะ 2 (รอตัด)
                const updateExistingQuery = `
                    UPDATE pl_cut_split_set
                    SET 
                        status = 2,
                        finish_at = NULL,
                        sub_status = NULL,
                        reel_id = NULL
                    WHERE pl_order_detail_id = :orderDetailId
                    AND sub_status = 'บังคับเสร็จสิ้น'
                `;
                await conn.execute(updateExistingQuery, { orderDetailId });
            }
            else {
                // 🚀 CASE B: ยังไม่มีข้อมูลเดิม (สั่งตัดครั้งแรก) -> วนลูป INSERT เซ็ตย่อยใหม่ตามจำนวน qty
                const insertSplitQuery = `
                    INSERT INTO pl_cut_split_set (pl_order_id, pl_order_detail_id, set_no, cut_length, status)
                    VALUES (:orderId, :orderDetailId, :setNo, 0, 2)
                `;
                for (let i = 0; i < qty; i++) {
                    const currentSet = i + 1;
                    const setNoStr = `${currentSet}/${qty}`;
                    await conn.execute(insertSplitQuery, {
                        orderId,
                        orderDetailId,
                        setNo: setNoStr
                    });
                }
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
    static async getSplitSetQueueData(orderNo) {
        let conn;
        try {
            conn = await (0, database_1.getConnection)();
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
            const binds = {};
            // 🔍 รับและกรองเฉพาะ orderNo ตัวเดียวตามคำสั่งกัปตัน
            if (orderNo && orderNo.trim() !== '') {
                sql += ` AND UPPER(order_no) LIKE :orderNo`;
                binds.orderNo = `%${orderNo.trim().toUpperCase()}%`;
                sql += ` AND split_status_id IN (2, 4, 5) `;
            }
            else {
                sql += ` AND split_status_id = 2`;
            }
            // 🎯 จัดเรียงตามลำดับคิวหลัก และ ลำดับเซ็ตย่อย (1/6, 2/6, ...)
            sql += ` ORDER BY queue_no ASC, split_set_id ASC`;
            const result = await conn.execute(sql, binds, {
                outFormat: oracledb_1.default.OUT_FORMAT_OBJECT,
            });
            const dataList = [];
            let i = 0;
            if (result.rows) {
                for (const row of result.rows) {
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
            console.log("============================================================================");
            return dataList;
        }
        catch (error) {
            console.error("❌ เกิดข้อผิดพลาดใน Model [getSplitSetQueueData]:", error);
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
    static async createOrderWeighing(split_set_id, pl_order_id, pl_order_detail_id) {
        let conn;
        try {
            conn = await (0, database_1.getConnection)();
            // 🔍 1. เช็คสถานะปัจจุบัน (Status เดิม) ของ PL_CUT_SPLIT_SET ก่อนทำรายการ
            const checkCurrentStatusQuery = `
                SELECT status 
                FROM pl_cut_split_set 
                WHERE id = :split_set_id
            `;
            const currentStatusResult = await conn.execute(checkCurrentStatusQuery, { split_set_id }, { outFormat: oracledb_1.default.OUT_FORMAT_OBJECT });
            const previousStatus = currentStatusResult.rows?.[0]?.STATUS ? Number(currentStatusResult.rows[0].STATUS) : null;
            // 🔄 2. อัปเดตสถานะของ PL_CUT_SPLIT_SET เป็น 5 (เสร็จสิ้น) 
            const updateStatusQuery = `
                UPDATE PL_CUT_SPLIT_SET 
                SET status = 5,
                    finish_at = SYSDATE 
                WHERE id = :split_set_id
            `;
            await conn.execute(updateStatusQuery, { split_set_id });
            console.log(`📌 [Model] อัปเดตสถานะ PL_CUT_SPLIT_SET ID: ${split_set_id} เป็น 5 เรียบร้อยแล้ว (สถานะเดิม: ${previousStatus})`);
            // 🎯 3. เงื่อนไขสำคัญ: ถ้าสถานะเดิมเท่ากับ 4 (HOLD) ให้ข้ามการสร้างคิวรอชั่งน้ำหนักทันที!
            if (previousStatus === 4) {
                console.log(`⚠️ [Model] เซ็ต ID: ${split_set_id} มีสถานะเดิมเป็น HOLD (4) -> ปิดงานเป็นเสร็จสิ้นโดย "ไม่สร้างคิวรอชั่งน้ำหนัก"`);
            }
            else {
                // -------------------------------------------------------------
                // 📦 กรณีสถานะเดิมไม่ใช่ 4 (เช่น เป็น 2 - รอตัดปกติ) -> ทำการแตกคิวชั่งน้ำหนักตามเดิม
                // -------------------------------------------------------------
                // 🔍 ดึงค่าใบมีด (over_size 1-4), ID ไซซ์ (size 1-4) และ ID เกรด (grade 1-4)
                const queryDetail = `
                    SELECT 
                        over_size1 AS BLAD1, over_size2 AS BLAD2, over_size3 AS BLAD3, over_size4 AS BLAD4,
                        size1_id   AS SIZE1_ID, size2_id AS SIZE2_ID, size3_id AS SIZE3_ID, size4_id AS SIZE4_ID,
                        grade1_id  AS GRADE1_ID, grade2_id AS GRADE2_ID, grade3_id AS GRADE3_ID, grade4_id AS GRADE4_ID
                    FROM pl_order_detail
                    WHERE id = :pl_order_detail_id
                `;
                const result = await conn.execute(queryDetail, { pl_order_detail_id }, {
                    outFormat: oracledb_1.default.OUT_FORMAT_OBJECT
                });
                if (!result.rows || result.rows.length === 0) {
                    throw new Error(`ไม่พบข้อมูลรายละเอียดออเดอร์ ID: ${pl_order_detail_id}`);
                }
                const row = result.rows[0];
                const rollsToInsert = [];
                if (Number(row.BLAD1) > 0)
                    rollsToInsert.push({ rollNo: 1, bladeSize: row.BLAD1, sizeId: row.SIZE1_ID, gradeId: row.GRADE1_ID });
                if (Number(row.BLAD2) > 0)
                    rollsToInsert.push({ rollNo: 2, bladeSize: row.BLAD2, sizeId: row.SIZE2_ID, gradeId: row.GRADE2_ID });
                if (Number(row.BLAD3) > 0)
                    rollsToInsert.push({ rollNo: 3, bladeSize: row.BLAD3, sizeId: row.SIZE3_ID, gradeId: row.GRADE3_ID });
                if (Number(row.BLAD4) > 0)
                    rollsToInsert.push({ rollNo: 4, bladeSize: row.BLAD4, sizeId: row.SIZE4_ID, gradeId: row.GRADE4_ID });
                if (rollsToInsert.length === 0) {
                    rollsToInsert.push({ rollNo: 1, bladeSize: null, sizeId: null, gradeId: null });
                }
                // 🔒 Prepared Statement บันทึกข้อมูลลง pl_wait_weighing
                const insertQuery = `
                    INSERT INTO pl_wait_weighing (
                        pl_order_id, 
                        pl_order_detail_id, 
                        split_set_id, 
                        roll_no,
                        blade_size, 
                        size_id, 
                        grade_id,
                        weigh, status, remark
                    ) VALUES (
                        :pl_order_id, 
                        :pl_order_detail_id, 
                        :split_set_id, 
                        :rollNo,
                        :bladeSize, 
                        :sizeId, 
                        :gradeId,
                        NULL, NULL, NULL
                    )
                `;
                // 🚀 วนลูป INSERT รายลูก
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
                console.log(`✅ บันทึกคิวรอชั่งน้ำหนักสำเร็จ: แตกออกมาทั้งหมด ${rollsToInsert.length} ลูก`);
            }
            // 💾 Commit กระบวนการทั้งหมดลง Database
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
            console.error("❌ เกิดข้อผิดพลาดในระดับ Model [createOrderWeighing]:", error);
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
    static async ResetCutSlitSet(split_set_id, pl_order_id, pl_order_detail_id) {
        // 1. ตรวจสอบเงื่อนไขเบื้องต้นก่อนดึง Connection
        const canReset = await weighing_model_1.WeighingModel.CheckResetSplitSet(split_set_id);
        // ถ้าไม่อนุญาตให้ Reset (เช่น data เป็น false / null) ให้รีเทิร์นออกไปได้เลย ไม่ต้องต่อ DB
        if (!canReset) {
            console.log(`⚠️ [Model] ไม่สามารถ Reset ได้สำหรับ split_set_id: ${split_set_id}`);
            return false;
        }
        let conn;
        try {
            conn = await (0, database_1.getConnection)();
            const updateCurrentRow = `
                UPDATE PL_CUT_SPLIT_SET 
                SET status = 2,finish_at = NULL
                WHERE ID = :id
            `;
            await conn.execute(updateCurrentRow, { id: split_set_id });
            await conn.commit();
            console.log(`✅ [Model] Reset สถานะ PL_CUT_SPLIT_SET ID: ${split_set_id} เป็น 2 สำเร็จ`);
            return true;
        }
        catch (error) {
            // 🚨 ถ้าระหว่างการ Update เกิดข้อผิดพลาด ให้สั่ง Rollback ทันที
            if (conn) {
                try {
                    await conn.rollback();
                }
                catch (rbErr) {
                    console.error("⚠️ Rollback ล้มเหลว:", rbErr);
                }
            }
            console.error("❌ เกิดข้อผิดพลาดในระดับ Model [ResetCutSlitSet]:", error);
            throw error; // ส่ง Error ให้ Controller ไปจัดการต่อ
        }
        finally {
            // 🔒 คืน/ปิด Connection เสมอไม่ว่าจะสำเร็จหรือเกิด Error
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
    static async getQcCloseReel(orderNo, startDate, endDate) {
        let conn;
        try {
            conn = await (0, database_1.getConnection)();
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
                    reel_no,
                    remark,
                    finish_at,
                    TO_CHAR(finish_at, 'DD/MM/YYYY') AS "date",
                    TO_CHAR(finish_at, 'HH24:MI')    AS "time"
                FROM pl_cut_split_set_view
                WHERE 1=1
                AND split_status_id = 5
            `;
            console.log(sql);
            const binds = {};
            // 🔍 1. กรอง orderNo
            if (orderNo && orderNo.trim() !== '') {
                sql += ` AND UPPER(order_no) LIKE :orderNo`;
                binds.orderNo = `%${orderNo.trim().toUpperCase()}%`;
            }
            // 📅 2. กรองช่วงวันที่ finish_at (รองรับทั้งส่งคู่ หรือส่งแค่วันใดวันหนึ่ง)
            if (startDate && startDate.trim() !== '') {
                sql += ` AND TRUNC(finish_at) >= TO_DATE(:startDate, 'YYYY-MM-DD')`;
                binds.startDate = startDate.trim();
            }
            if (endDate && endDate.trim() !== '') {
                sql += ` AND TRUNC(finish_at) <= TO_DATE(:endDate, 'YYYY-MM-DD')`;
                binds.endDate = endDate.trim();
            }
            if (!endDate && !startDate) {
                sql += ` AND reel_no is null`;
            }
            // 🎯 จัดเรียงตามลำดับคิวหลัก และ ลำดับเซ็ตย่อย
            sql += ` ORDER BY queue_no ASC, split_set_id ASC`;
            const result = await conn.execute(sql, binds, {
                outFormat: oracledb_1.default.OUT_FORMAT_OBJECT,
            });
            const dataList = [];
            let i = 0;
            if (result.rows) {
                for (const row of result.rows) {
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
                        lenght: row.CUT_LENGTH,
                        status: row.STATUS,
                        que: row.QUEUE_NO,
                        cut_status_id: row.CUT_STATUS_ID,
                        pl_order_id: row.PL_ORDER_ID,
                        pl_order_detail_id: row.PL_ORDER_DETAIL_ID,
                        split_set_id: row.SPLIT_SET_ID,
                        date: row.date,
                        time: row.time,
                        remark: row.REMARK
                    });
                }
            }
            return dataList;
        }
        catch (error) {
            console.error("❌ เกิดข้อผิดพลาดใน Model [getQcCloseReel]:", error);
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
    static async saveRemarks(items) {
        let conn;
        try {
            conn = await (0, database_1.getConnection)();
            // SQL Update สำหรับตาราง pl_cut_split_set
            const sql = `
                UPDATE pl_cut_split_set
                SET 
                    remark = :remark
                WHERE id = :id
            `;
            // 🎯 แปลงข้อมูลที่ส่งมาให้อยู่ในฟอร์ม Binds สำหรับ executeMany
            const bindDefs = items.map(item => ({
                id: item.id,
                remark: item.remark ? item.remark.trim() : null
            }));
            // 🎯 สั่ง Update ทุกรายการรวดเดียวแบบ Batch
            const result = await conn.executeMany(sql, bindDefs, { autoCommit: false });
            // เช็กว่ามีแถวที่ได้รับผลกระทบจากการ UPDATE หรือไม่
            if (result.rowsAffected && result.rowsAffected > 0) {
                await conn.commit(); // 🔒 Commit การบันทึกทั้งหมด
                return true;
            }
            else {
                await conn.rollback();
                return false;
            }
        }
        catch (error) {
            if (conn)
                await conn.rollback(); // 🛡️ ยกเลิกหากเกิด Error
            console.error("❌ เกิดข้อผิดพลาดใน Model [CutSplitSetModel.saveRemarks]:", error);
            throw error;
        }
        finally {
            if (conn)
                await conn.close();
        }
    }
    static async getReelList(keyword) {
        let conn;
        try {
            conn = await (0, database_1.getConnection)();
            // จัดการรูปแบบคำค้นหา
            let cleanKeyword = keyword ? String(keyword).trim() : '';
            // ถ้าส่งมาเป็น '%' หรือว่างเปล่า ให้ค้นหาทั้งหมด
            let searchVal = '%';
            if (cleanKeyword && cleanKeyword !== '%' && cleanKeyword !== 'null' && cleanKeyword !== 'undefined') {
                searchVal = `%${cleanKeyword}%`;
            }
            const sql = `
                SELECT 
                    id,
                    reel_no,
                    grade,
                    date_str AS "date",
                    status,
                    dcs_reel_no
                FROM pl_qc_reel_view
                WHERE reel_no LIKE :search
            `;
            const result = await conn.execute(sql, { search: searchVal }, {
                outFormat: oracledb_1.default.OUT_FORMAT_OBJECT
            });
            return result.rows || [];
        }
        catch (error) {
            console.error("❌ Model Error [getReelList]:", error);
            throw error;
        }
        finally {
            if (conn)
                await conn.close();
        }
    }
    static async updateCloseReel(splitSetId, reelId) {
        let conn;
        try {
            conn = await (0, database_1.getConnection)();
            // 🎯 UPDATE คอลัมน์ REEL_ID โดยตรง
            const updateSql = `
                UPDATE pl_cut_split_set
                SET reel_id = :reelId
                WHERE id = :splitSetId
            `;
            const result = await conn.execute(updateSql, {
                reelId: reelId,
                splitSetId: splitSetId
            }, { autoCommit: true } // Commit ธุรกรรมลง Database ทันที
            );
            return {
                rowsAffected: result.rowsAffected
            };
        }
        catch (error) {
            console.error("❌ Model Error [updateCloseReel]:", error);
            throw error;
        }
        finally {
            if (conn)
                await conn.close();
        }
    }
    static async ManagerStatusPlOrderDetail(orderDetailId) {
        let conn;
        try {
            conn = await (0, database_1.getConnection)();
            // 🎯 Step 2: นับจำนวน Set ทั้งหมด, Set ที่เสร็จแล้ว (status = 5), และ Set ที่เป็น status = 2
            const checkSql = `
                SELECT 
                    COUNT(*) AS TOTAL_SETS,
                    COUNT(CASE WHEN status = 5 THEN 1 END) AS COMPLETED_SETS,
                    COUNT(CASE WHEN status = 2 THEN 1 END) AS STATUS_2_SETS
                FROM pl_cut_split_set
                WHERE pl_order_detail_id = :orderDetailId
            `;
            const checkResult = await conn.execute(checkSql, { orderDetailId });
            const row = checkResult.rows[0];
            const totalSets = row?.TOTAL_SETS || row?.[0] || 0;
            const completedSets = row?.COMPLETED_SETS || row?.[1] || 0;
            const status2Sets = row?.STATUS_2_SETS || row?.[2] || 0;
            // 🎯 Step 3: คำนวณ cut_status_id
            let newCutStatusId = 3; // Default = 3 (ตัดยังไม่ครบ / อยู่ระหว่างทำ)
            if (totalSets > 0) {
                if (completedSets >= totalSets) {
                    newCutStatusId = 5; // ทำครบหมดทุก Set แล้ว
                }
                else if (status2Sets >= totalSets) {
                    newCutStatusId = 2; // ทั้งหมด 4 Set ยังคงเป็น status = 2 อยู่
                }
            }
            // 🎯 Step 4: อัปเดต cut_status_id ลงตาราง PL_ORDER_DETAIL
            const updateDetailSql = `
                UPDATE pl_order_detail
                SET cut_status_id = :statusId
                WHERE id = :orderDetailId
            `;
            const updateResult = await conn.execute(updateDetailSql, {
                statusId: newCutStatusId,
                orderDetailId: orderDetailId
            }, { autoCommit: true } // Commit ธุรกรรมทั้งหมดลง Database
            );
            return {
                orderDetailId: orderDetailId,
                totalSets: totalSets,
                completedSets: completedSets,
                status2Sets: status2Sets,
                updatedCutStatusId: newCutStatusId,
                rowsAffected: updateResult.rowsAffected
            };
        }
        catch (error) {
            console.error("❌ Model Error [updateSetAndCutStatus]:", error);
            throw error;
        }
        finally {
            if (conn)
                await conn.close();
        }
    }
    static async forceCompleteOrderDetail(orderDetailId, orderId) {
        let conn;
        try {
            conn = await (0, database_1.getConnection)();
            // 🎯 Step 1: อัปเดตทุก Set ใน PL_CUT_SPLIT_SET ที่ยังไม่เสร็จ (status != 5) 
            // ให้เป็น status = 5 และ sub_status = 'บังคับเสร็จสิ้น'
            const updateSetsSql = `
                UPDATE pl_cut_split_set
                SET 
                    status = 5,
                    sub_status = 'บังคับเสร็จสิ้น',
                    finish_at = SYSDATE
                WHERE pl_order_detail_id = :orderDetailId
                AND (status != 5 OR status IS NULL)
            `;
            const setsResult = await conn.execute(updateSetsSql, { orderDetailId: orderDetailId }, { autoCommit: false } // ยังไม่ commit รอทำ step ถัดไปให้ครบก่อน
            );
            // 🎯 Step 2: อัปเดตสถานะใน PL_ORDER_DETAIL ให้ cut_status_id = 5 (เสร็จสิ้น)
            const updateDetailSql = `
                UPDATE pl_order_detail
                SET cut_status_id = 5,
                FINISH_DATE_TIME = SYSDATE
                WHERE id = :orderDetailId
            `;
            const detailResult = await conn.execute(updateDetailSql, { orderDetailId: orderDetailId }, { autoCommit: true } // Commit ธุรกรรมทั้งหมดลง Database ทันที
            );
            return {
                orderDetailId: orderDetailId,
                orderId: orderId || null,
                setsUpdatedCount: setsResult.rowsAffected,
                detailUpdatedCount: detailResult.rowsAffected,
                message: "Successfully forced status to completed (5)"
            };
        }
        catch (error) {
            console.error("❌ Model Error [forceCompleteOrderDetail]:", error);
            throw error;
        }
        finally {
            if (conn)
                await conn.close();
        }
    }
    static async forceResetOrderDetail(orderDetailId, orderId) {
        let conn;
        try {
            conn = await (0, database_1.getConnection)();
            // 🎯 Step 1: ตรวจสอบสถานะปัจจุบันของ PL_ORDER_DETAIL ว่าเป็น 5 (เสร็จสิ้น) จริงหรือไม่
            const checkStatusSql = `
                SELECT cut_status_id 
                FROM pl_order_detail 
                WHERE id = :orderDetailId
            `;
            const checkResult = await conn.execute(checkStatusSql, { orderDetailId });
            const currentCutStatus = checkResult.rows[0]?.CUT_STATUS_ID || checkResult.rows[0]?.[0];
            // ถ้าสถานะไม่ได้เป็น 5 ให้โยน Error ออกไปทันที
            if (parseInt(currentCutStatus) !== 5) {
                throw new Error(`ไม่สามารถ Reset ได้ เนื่องจากรายการนี้ไม่อยู่ในสถานะเสร็จสิ้น`);
            }
            // 🎯 Step 3: อัปเดตสถานะใน PL_ORDER_DETAIL ให้ cut_status_id = 1 (หรือ NULL)
            const resetDetailSql = `
                UPDATE pl_order_detail
                SET cut_status_id = 1,
                finish_date_time = NULL
                WHERE id = :orderDetailId
            `;
            const detailResult = await conn.execute(resetDetailSql, { orderDetailId: orderDetailId }, { autoCommit: true } // Commit ธุรกรรมทั้งหมด
            );
            return {
                orderDetailId: orderDetailId,
                orderId: orderId || null,
                detailResetCount: detailResult.rowsAffected,
                message: "Successfully reset order detail status to 1"
            };
        }
        catch (error) {
            console.error("❌ Model Error [forceResetOrderDetail]:", error);
            throw error;
        }
        finally {
            if (conn)
                await conn.close();
        }
    }
    static async holdCutSplitSet(splitSetId, orderId, orderDetailId) {
        let conn;
        try {
            conn = await (0, database_1.getConnection)();
            // 🎯 UPDATE สถานะของรายการเซ็ตย่อยเป็น 4 (HOLD)
            const updateSql = `
                UPDATE pl_cut_split_set
                SET status = 4
                WHERE id = :splitSetId
                AND pl_order_id = :orderId
                AND pl_order_detail_id = :orderDetailId
            `;
            const result = await conn.execute(updateSql, {
                splitSetId: splitSetId,
                orderId: orderId,
                orderDetailId: orderDetailId
            }, { autoCommit: true } // Commit ธุรกรรมลง Database ทันที
            );
            // เช็คว่ามีแถวถูกอัปเดตจริงหรือไม่
            if (result.rowsAffected === 0) {
                throw new Error(`ไม่พบรายการเซ็ตย่อย ID: ${splitSetId} ที่ต้องการ HOLD`);
            }
            return {
                splitSetId: splitSetId,
                orderId: orderId,
                orderDetailId: orderDetailId,
                rowsAffected: result.rowsAffected,
                message: "Successfully updated set status to HOLD (4)"
            };
        }
        catch (error) {
            console.error("❌ Model Error [holdCutSplitSet]:", error);
            throw error;
        }
        finally {
            if (conn)
                await conn.close();
        }
    }
    static async unHoldCutSplitSet(splitSetId, orderId, orderDetailId) {
        let conn;
        try {
            conn = await (0, database_1.getConnection)();
            // 🎯 UPDATE สถานะของรายการเซ็ตย่อยกลับเป็น 2 (รอตัด) 
            // โดยดักเงื่อนไขว่าจะต้องเป็นแถวที่มี status = 4 (HOLD) เท่านั้น
            const updateSql = `
                UPDATE pl_cut_split_set
                SET status = 2
                WHERE id = :splitSetId
                AND status = 4
            `;
            const result = await conn.execute(updateSql, {
                splitSetId: splitSetId
            }, { autoCommit: true } // Commit ธุรกรรมลง Database ทันที
            );
            // 🛡️ เช็คว่ามีแถวถูกอัปเดตหรือไม่ (ถ้าไม่มีแสดงว่าไม่อยู่ในสถานะ HOLD หรือหาไม่พบ)
            if (result.rowsAffected === 0) {
                throw new Error(`ไม่สามารถปลด HOLD ได้ เนื่องจากรายการนี้ไม่อยู่ในสถานะ HOLD (status != 4) หรือไม่พบข้อมูล`);
            }
            return {
                splitSetId: splitSetId,
                orderId: orderId,
                orderDetailId: orderDetailId,
                rowsAffected: result.rowsAffected,
                message: "Successfully unheld set status back to waiting (2)"
            };
        }
        catch (error) {
            console.error("❌ Model Error [unHoldCutSplitSet]:", error);
            throw error;
        }
        finally {
            if (conn)
                await conn.close();
        }
    }
}
exports.WaitCutModel = WaitCutModel;
