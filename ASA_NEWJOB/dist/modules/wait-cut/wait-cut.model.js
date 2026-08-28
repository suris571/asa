"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WaitCutModel = void 0;
// src/models/wait-cut.model.ts
const database_1 = require("../../database");
const weighing_model_1 = require("./../weighing/weighing.model");
const Common_1 = require("../util/Common");
const oracledb_1 = __importDefault(require("oracledb"));
class WaitCutModel {
    static default_status = "ส่งให้ Rewinder";
    static last_status = 'ยกเลิก';
    static async getQueueFingerprint(productionLineId) {
        let conn;
        try {
            conn = await (0, database_1.getConnection)();
            // 🟢 ดึงข้อมูลระดับสถิติ ครอบคลุมทั้ง Insert ใหม่ (NULL) และ Update งานเดิม
            const sql = `
                SELECT 
                    COUNT(*) AS TOTAL_ROWS,
                    MAX(pl_order_detail_id) AS MAX_ID,
                    MAX(NVL(update_date, create_date)) AS LAST_ACTIVITY,
                    NVL(SUM(NVL(completed_set_qty, 0) + NVL(completed_roll_qty, 0)), 0) AS TOTAL_COMPLETED,
                    MAX(cut_status_id) AS LAST_STATUS
                FROM pl_order_view
                WHERE pl_production_line_id = :productionLineId
                AND status = :defaultStatus
                AND (cut_status_id IN (1, 2, 3, 4) OR cut_status_id IS NULL)
            `;
            const result = await conn.execute(sql, {
                productionLineId: Number(productionLineId),
                defaultStatus: WaitCutModel.default_status
            }, { outFormat: oracledb_1.default.OUT_FORMAT_OBJECT });
            const row = result.rows[0];
            // ถ้าไม่มีข้อมูลเลย ให้คืนค่า string ว่าง
            if (!row || row.TOTAL_ROWS === 0)
                return "EMPTY";
            // แปลงผลลัพธ์บรรทัดเดียวเป็น String รวมเพื่อเช็ก Hash
            return `${row.TOTAL_ROWS}-${row.MAX_ID}-${row.LAST_ACTIVITY}-${row.TOTAL_COMPLETED}-${row.LAST_STATUS}`;
        }
        catch (error) {
            return "";
        }
        finally {
            if (conn)
                await conn.close();
        }
    }
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
    static formatDateToDDMMYYYY(dateStr) {
        if (!dateStr)
            return '-';
        // ตัดเอาเฉพาะส่วนวันที่ (กรณีมี T หรือ เวลาติดมา)
        const cleanDate = dateStr.toString().split('T')[0].split(' ')[0]; // ได้ '2026-08-08'
        const parts = cleanDate.split('-'); // ['2026', '08', '08']
        if (parts.length === 3) {
            const [year, month, day] = parts;
            return `${day}/${month}/${year}`; // สลับเป็น '08/08/2026'
        }
        return dateStr; // ถ้าฟอร์แมตไม่เข้าพวก ให้คืนค่าเดิม
    }
    ;
    static async getAllWaitingAndWeighing(Conn = null, status = null, order_no = null, startDate = null, endDate = null, productionLineId = null // 🎯 ต่อท้ายสุดตรงนี้
    ) {
        let conn;
        let isLocalConn = false;
        console.log(productionLineId);
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
                    pl_production_line_id,COMPLETED_SET_QTY,COMPLETED_ROLL_QTY,is_force_finish
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
            if (status && typeof status === "string" && status.trim() !== "" && status !== "null" && status == "ALL") {
                query += ` AND cut_status_id IN (1, 2, 3, 4) `;
            }
            else if (status && typeof status === "string" && status.trim() !== "" && status !== "null") {
                const selectedStatus = parseInt(status.trim());
                if (selectedStatus === 1) {
                    query += ` AND (cut_status_id = 1) `;
                }
                else {
                    query += ` AND cut_status_id = :cutStatusId `;
                    bindParams.cutStatusId = selectedStatus;
                }
            }
            else if (!order_no && !startDate && !endDate) {
                // 💡 CASE DEFAULT: จะทำงาน "เฉพาะตอนที่ผู้ใช้เปิดหน้าเว็บมาครั้งแรก" (ไม่ได้เลือก Filter ใดๆ เลย)
                // ถึงจะกวาดเอาเฉพาะงานปัจจุบันที่รอทำหน้าเครื่อง Rewinder มาโชว์
                query += ` AND status = :status `;
                bindParams.status = WaitCutModel.default_status; //กำหนดค่า default status เป็น "ส่งให้ Rewinder"
                query += ` AND cut_status_id IN (null, 1, 2, 3, 4) `;
            }
            // ⚡ เงื่อนไขเดิม 3: วันที่เริ่มต้น
            if (startDate && typeof startDate === 'string') {
                // 🎯 แปลง :startDate ('08/08/2026') เป็น '2026-08-08' แล้วเทียบกับ finish_date ตรงๆ
                query += ` AND finish_date >= TO_CHAR(TO_DATE(:startDate, 'DD/MM/YYYY'), 'YYYY-MM-DD')`;
                bindParams.startDate = startDate.trim();
            }
            // ⚡ เงื่อนไขเดิม 4: วันที่สิ้นสุด`
            if (endDate && typeof endDate === 'string') {
                query += ` AND finish_date <= TO_CHAR(TO_DATE(:endDate, 'DD/MM/YYYY'), 'YYYY-MM-DD')`;
                bindParams.endDate = endDate.trim();
            }
            query += ` ORDER BY queue_no ASC`;
            console.log("🔍 [Model Query] SQL ที่ใช้ดึงข้อมูล Waiting & Weighing:", query);
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
                        blad1: Common_1.Common.formatNumber(row.BLAD1),
                        blad2: Common_1.Common.formatNumber(row.BLAD2),
                        blad3: Common_1.Common.formatNumber(row.BLAD3),
                        blad4: Common_1.Common.formatNumber(row.BLAD4),
                        size1: row.SIZE_1,
                        size2: row.SIZE_2,
                        size3: row.SIZE_3,
                        size4: row.SIZE_4,
                        // 🎯 แปลงฟอร์แมตวันที่ตรงนี้ก่อนยัดลง Array
                        finishDate: WaitCutModel.formatDateToDDMMYYYY(row.FINISH_DATE),
                        finishTime: row.FINISH_TIME,
                        diameter: row.DIAMETER,
                        que: row.QUEUE_NO,
                        cut_status_id: row.CUT_STATUS_ID,
                        pl_production_line_id: row.PL_PRODUCTION_LINE_ID,
                        completed_set_qty: row.COMPLETED_SET_QTY,
                        completed_roll_qty: row.COMPLETED_ROLL_QTY,
                        is_force_finish: row.IS_FORCE_FINISH,
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
    static async createOrderSplitSet(orderId, orderDetailId, qty, staff_id) {
        let conn;
        try {
            conn = await (0, database_1.getConnection)();
            // 🔍 ขั้นตอนที่ 1: เช็คก่อนว่ามีข้อมูลเซ็ตย่อยใน PL_CUT_SPLIT_SET แล้วหรือยัง
            const checkExistingQuery = `
                SELECT COUNT(*) AS COUNT_SETS
                FROM pl_cut_split_set
                WHERE pl_order_detail_id = :orderDetailId
            `;
            const checkResult = await conn.execute(checkExistingQuery, { orderDetailId });
            const existingCount = checkResult.rows[0]?.COUNT_SETS || checkResult.rows[0]?.[0] || 0;
            if (existingCount > 0) {
                // 🔄 CASE A: มีข้อมูลเดิมอยู่แล้ว -> อัปเดตรายการที่ถูก "บังคับเสร็จสิ้น" ให้กลับมาเป็นสถานะ 2 (รอตัด)
                // 🎯 เพิ่ม update_staff และ update_date
                const updateExistingQuery = `
                    UPDATE pl_cut_split_set
                    SET 
                        status = 2,
                        finish_at = NULL,
                        sub_status = NULL,
                        qc_reel_id = NULL,
                        update_staff = :staffId,
                        update_date = SYSDATE
                    WHERE pl_order_detail_id = :orderDetailId
                    AND sub_status = 'บังคับเสร็จสิ้น'
                `;
                await conn.execute(updateExistingQuery, {
                    orderDetailId,
                    staffId: staff_id ? Number(staff_id) : null
                });
            }
            else {
                // 🚀 CASE B: ยังไม่มีข้อมูลเดิม -> วนลูป INSERT เซ็ตย่อยใหม่ตามจำนวน qty
                // 🎯 เพิ่ม create_date = SYSDATE (และคอลัมน์ create_staff มีอยู่แล้ว)
                const insertSplitQuery = `
                    INSERT INTO pl_cut_split_set (
                        id, 
                        pl_order_id, 
                        pl_order_detail_id, 
                        set_no, 
                        cut_length, 
                        status, 
                        create_staff,
                        create_date,
                        size_id1, 
                        size_id2, 
                        size_id3, 
                        size_id4,
                        over_size1,
                        over_size2,
                        over_size3,
                        over_size4,
                        grade1_id,
                        grade2_id,
                        grade3_id,
                        grade4_id
                    ) 
                    SELECT 
                        sq_pl_cut_split_set.NEXTVAL, 
                        :orderId, 
                        :orderDetailId, 
                        :setNo, 
                        0, 
                        2, 
                        :staffId,
                        SYSDATE,
                        size1_id, 
                        size2_id, 
                        size3_id, 
                        size4_id,
                        over_size1,
                        over_size2,
                        over_size3,
                        over_size4,
                        grade1_id,
                        grade2_id,
                        grade3_id,
                        grade4_id
                    FROM pl_order_detail
                    WHERE id = :orderDetailId
                `;
                for (let i = 0; i < qty; i++) {
                    const currentSet = i + 1;
                    const setNoStr = `${currentSet}/${qty}`;
                    await conn.execute(insertSplitQuery, {
                        orderId,
                        orderDetailId,
                        setNo: setNoStr,
                        staffId: staff_id ? Number(staff_id) : null
                    });
                }
            }
            // 🎯 ขั้นตอนที่ 2: คำนวณหา ว่าทำเสร็จไปกี่เซ็ตแล้ว
            const checkStatusQuery = `
                SELECT 
                    COUNT(*) AS TOTAL_SETS,
                    COUNT(CASE WHEN status = 5 THEN 1 END) AS COMPLETED_SETS
                FROM pl_cut_split_set
                WHERE pl_order_detail_id = :orderDetailId
            `;
            const statusResult = await conn.execute(checkStatusQuery, { orderDetailId }, { outFormat: oracledb_1.default.OUT_FORMAT_OBJECT });
            const row = statusResult.rows[0];
            const totalSets = row?.TOTAL_SETS || 0;
            const completedSets = row?.COMPLETED_SETS || 0;
            let targetCutStatusId = 2; // Default = 2 (รอตัด)
            if (completedSets > 0 && completedSets < totalSets) {
                targetCutStatusId = 3; // "ตัดยังไม่ครบ"
            }
            else if (completedSets >= totalSets && totalSets > 0) {
                targetCutStatusId = 5; // ตัดเสร็จครบทุกเซ็ตแล้ว
            }
            else {
                targetCutStatusId = 2; // "รอตัด"
            }
            // 🔒 ขั้นตอนที่ 3: อัปเดตสถานะลงตารางหลัก pl_order_detail
            // 🎯 เพิ่ม update_staff และ update_date
            const updateDetailQuery = `
                UPDATE pl_order_detail 
                SET cut_status_id = :targetCutStatusId,
                    update_staff = :staffId,
                    update_date = SYSDATE
                WHERE id = :orderDetailId
            `;
            await conn.execute(updateDetailQuery, {
                targetCutStatusId,
                orderDetailId,
                staffId: staff_id ? Number(staff_id) : null
            });
            // ยืนยันกระบวนการ Transaction ทั้งหมด
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
    static async getSplitSetQueueData(orderNo, lineId, status, startDate, endDate) {
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
                    main_cut_status_id  AS MAIN_CUT_STATUS_ID,
                    pl_production_line_id AS PL_PRODUCTION_LINE_ID
                FROM pl_cut_split_set_view
                WHERE 1=1
            `;
            const binds = {};
            // 🔍 กรองตาม ID สายการผลิต/เครื่อง (pl_production_line_id)
            if (lineId) {
                sql += ` AND pl_production_line_id = :lineId `;
                binds.lineId = lineId;
            }
            // 🔍 กรอง Order No ตามเงื่อนไข
            if (orderNo && orderNo.trim() !== '') {
                sql += ` AND UPPER(order_no) LIKE :orderNo `;
                binds.orderNo = `%${orderNo.trim().toUpperCase()}%`;
                // sql += ` AND split_status_id IN (2, 4, 5) `;
            }
            else if (!status) {
                sql += ` AND split_status_id = 2 `;
            }
            // 🔍 กรองตามช่วงวันที่
            if (startDate && startDate.trim() !== '') {
                // 🎯 แก้จาก 'YYYY-MM-DD' เป็น 'DD/MM/YYYY'
                sql += ` AND TRUNC(finish_at) >= TO_DATE(:startDate, 'DD/MM/YYYY')`;
                binds.startDate = startDate.trim(); // เช่น "08/08/2026"
            }
            if (endDate && endDate.trim() !== '') {
                // 🎯 แก้จาก 'YYYY-MM-DD' เป็น 'DD/MM/YYYY'
                sql += ` AND TRUNC(finish_at) <= TO_DATE(:endDate, 'DD/MM/YYYY')`;
                binds.endDate = endDate.trim(); // เช่น "10/08/2026"
            }
            if (status && typeof status === "string" && status.trim()) {
                sql += ` AND split_status_id = :status `;
                binds.status = Number(status);
            }
            // 🎯 จัดเรียงตามลำดับคิวหลัก และ ลำดับเซ็ตย่อย
            sql += ` ORDER BY queue_no ASC, split_set_id ASC`;
            console.log("🔍 [Model Query] SQL ที่ใช้ดึงข้อมูล Split Set Queue:", sql);
            console.log("orderNo:", orderNo, "lineId:", lineId, "status:", status, "startDate:", startDate, "endDate:", endDate);
            const result = await conn.execute(sql, binds, {
                outFormat: oracledb_1.default.OUT_FORMAT_OBJECT,
            });
            const dataList = [];
            if (result.rows) {
                let i = 0;
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
                        blad1: Common_1.Common.formatNumber(row.BLAD1),
                        blad2: Common_1.Common.formatNumber(row.BLAD2),
                        blad3: Common_1.Common.formatNumber(row.BLAD3),
                        blad4: Common_1.Common.formatNumber(row.BLAD4),
                        size1: row.SIZE_1,
                        size2: row.SIZE_2,
                        size3: row.SIZE_3,
                        size4: row.SIZE_4,
                        lenght: row.CUT_LENGTH,
                        que: row.QUEUE_NO,
                        cut_status_id: row.CUT_STATUS_ID,
                        pl_order_id: row.PL_ORDER_ID,
                        pl_order_detail_id: row.PL_ORDER_DETAIL_ID,
                        split_set_id: row.SPLIT_SET_ID,
                        main_cut_status_id: row.MAIN_CUT_STATUS_ID,
                        pl_production_line_id: row.PL_PRODUCTION_LINE_ID
                    });
                }
            }
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
    static async createOrderWeighing(split_set_id, pl_order_id, pl_order_detail_id, staff_id, cut_length) {
        let conn;
        try {
            conn = await (0, database_1.getConnection)();
            const formattedStaffId = staff_id ? Number(staff_id) : null;
            // 🔍 1. เช็คสถานะปัจจุบัน (Status เดิม) ของ PL_CUT_SPLIT_SET ก่อนทำรายการ
            const checkCurrentStatusQuery = `
                SELECT status 
                FROM pl_cut_split_set 
                WHERE id = :split_set_id
            `;
            const currentStatusResult = await conn.execute(checkCurrentStatusQuery, { split_set_id }, { outFormat: oracledb_1.default.OUT_FORMAT_OBJECT });
            const previousStatus = currentStatusResult.rows?.[0]?.STATUS ? Number(currentStatusResult.rows[0].STATUS) : null;
            // 🔄 2. อัปเดตสถานะของ PL_CUT_SPLIT_SET เป็น 5 (เสร็จสิ้น) 
            // 🎯 เพิ่ม update_staff และ update_date = SYSDATE
            const updateStatusQuery = `
                UPDATE PL_CUT_SPLIT_SET
                SET status = 5,
                    finish_at = SYSDATE,
                    cut_length = :cut_length,
                    update_staff = :staffId,
                    update_date = SYSDATE
                WHERE id = :split_set_id
            `;
            await conn.execute(updateStatusQuery, {
                split_set_id,
                cut_length,
                staffId: formattedStaffId
            }, { autoCommit: false });
            console.log(`📌 [Model] อัปเดตสถานะ PL_CUT_SPLIT_SET ID: ${split_set_id} เป็น 5 เรียบร้อยแล้ว (สถานะเดิม: ${previousStatus})`);
            // 🎯 3. เงื่อนไขสำคัญ: ถ้าสถานะเดิมเท่ากับ 4 (HOLD) ให้ข้ามการสร้างคิวรอชั่งน้ำหนักทันที!
            if (previousStatus === 4 && false) {
                console.log(`⚠️ [Model] เซ็ต ID: ${split_set_id} มีสถานะเดิมเป็น HOLD (4) -> ปิดงานเป็นเสร็จสิ้นโดย "ไม่สร้างคิวรอชั่งน้ำหนัก"`);
            }
            else {
                // -------------------------------------------------------------
                // 📦 กรณีสถานะเดิมไม่ใช่ 4 (เช่น เป็น 2 - รอตัดปกติ) -> ทำการแตกคิวชั่งน้ำหนักตามเดิม
                // -------------------------------------------------------------
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
                // 🎯 เพิ่ม CREATE_DATE = SYSDATE
                const insertQuery = `
                    INSERT INTO pl_wait_weighing (
                        pl_order_id, 
                        pl_order_detail_id, 
                        split_set_id, 
                        roll,
                        blade_size, 
                        size_id, 
                        grade_id,
                        weigh, status, remark, CREATE_STAFF, CREATE_DATE
                    ) VALUES (
                        :pl_order_id, 
                        :pl_order_detail_id, 
                        :split_set_id, 
                        :rollNo,
                        :bladeSize, 
                        :sizeId, 
                        :gradeId,
                        NULL, NULL, NULL, :staffId, SYSDATE
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
                        gradeId: roll.gradeId,
                        staffId: formattedStaffId
                    }, { autoCommit: false });
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
    static async ResetCutSlitSet(split_set_id, pl_order_id, pl_order_detail_id, staff_id // 🎯 รับ staff_id เพิ่มเติม
    ) {
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
            const formattedStaffId = staff_id ? Number(staff_id) : null;
            // 🎯 UPDATE คืนค่าสถานะเป็น 2 พร้อมบันทึกผู้แก้ไขและเวลา
            const updateCurrentRow = `
                UPDATE PL_CUT_SPLIT_SET 
                SET status = 2,
                    finish_at = NULL,
                    cut_length = 0,
                    sub_status = NULL,
                    update_staff = :staffId,
                    update_date = SYSDATE
                WHERE ID = :id
            `;
            await conn.execute(updateCurrentRow, {
                id: split_set_id,
                staffId: formattedStaffId
            }, { autoCommit: false });
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
    static async getQcCloseReel(orderNo, startDate, endDate, productionLineId, status) {
        let conn;
        try {
            conn = await (0, database_1.getConnection)();
            // 🎯 1. ดึงรายการ remark ที่ไม่ซ้ำกัน ย้อนหลัง 3 เดือนจาก finish_at
            const remarkSql = `
                SELECT DISTINCT remark 
                FROM pl_cut_split_set_view 
                WHERE finish_at >= ADD_MONTHS(SYSDATE, -3)
                AND remark IS NOT NULL 
                AND TRIM(remark) IS NOT NULL
                ORDER BY remark ASC
            `;
            const remarkResult = await conn.execute(remarkSql, {}, {
                outFormat: oracledb_1.default.OUT_FORMAT_OBJECT,
            });
            // แปลงผลลัพธ์เป็น Array ของ String เช่น ["ผ่านเกณฑ์", "ชำรุด", "ขนาดไม่ได้มาตรฐาน"]
            const listRemark = remarkResult.rows?.map(r => r.REMARK) || [];
            // 🎯 2. Query ข้อมูลหลักตามเงื่อนไขเดิม
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
                    TO_CHAR(finish_at, 'DD/MM/YYYY') AS "DATE_STR",
                    TO_CHAR(finish_at, 'HH24:MI')    AS "TIME_STR"
                FROM pl_cut_split_set_view
                WHERE 1=1
                AND split_status_id = 5
                AND cut_length IS NOT NULL
                AND cut_length <> 0
            `;
            const binds = {};
            if (productionLineId && productionLineId !== "null") {
                sql += ` AND pl_production_line_id = :productionLineId`;
                binds.productionLineId = Number(productionLineId);
            }
            if (status && status !== null && status !== "null") {
                if (status === "open") {
                    sql += ` AND reel_no IS NULL`;
                }
                else if (status === "closed") {
                    sql += ` AND qc_reel_id IS NOT NULL`;
                }
            }
            else {
                sql += ` AND reel_no IS NULL`;
            }
            if (orderNo && orderNo.trim() !== '') {
                sql += ` AND UPPER(order_no) LIKE :orderNo`;
                binds.orderNo = `%${orderNo.trim().toUpperCase()}%`;
            }
            if (startDate && startDate.trim() !== '') {
                sql += ` AND TRUNC(finish_at) >= TO_DATE(:startDate, 'DD/MM/YYYY')`;
                binds.startDate = startDate.trim();
            }
            if (endDate && endDate.trim() !== '') {
                sql += ` AND TRUNC(finish_at) <= TO_DATE(:endDate, 'DD/MM/YYYY')`;
                binds.endDate = endDate.trim();
            }
            sql += ` ORDER BY queue_no ASC, split_set_id ASC`;
            console.log("🔍 [Model Query] SQL ที่ใช้ดึงข้อมูล QC Close Reel:", sql);
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
                        reel_no: row.REEL_NO,
                        grade1: row.GRADE1_NAME,
                        grade2: row.GRADE2_NAME,
                        grade3: row.GRADE3_NAME,
                        grade4: row.GRADE4_NAME,
                        set: row.SET_NO,
                        blad1: Common_1.Common.formatNumber(row.BLAD1),
                        blad2: Common_1.Common.formatNumber(row.BLAD2),
                        blad3: Common_1.Common.formatNumber(row.BLAD3),
                        blad4: Common_1.Common.formatNumber(row.BLAD4),
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
                        date: row.DATE_STR,
                        time: row.TIME_STR,
                        remark: row.REMARK,
                        list_remark: listRemark // 🎯 ยัด Array หมายเหตุย้อนหลัง 3 เดือนเข้าทุกวัตถุ
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
    static async getReelList(keyword, productionLineId) {
        let conn;
        try {
            conn = await (0, database_1.getConnection)();
            // 🧹 1. ทำความสะอาด Keyword
            const cleanKeyword = keyword ? String(keyword).trim() : '';
            // 🔍 2. เช็กว่ามีการส่ง keyword จริงๆ หรือไม่ (ไม่ใช่ค่าว่าง, %, 'null', 'undefined')
            const hasKeyword = cleanKeyword !== '' &&
                cleanKeyword !== '%' &&
                cleanKeyword !== 'null' &&
                cleanKeyword !== 'undefined';
            // 📝 3. ประกอบ Dynamic SQL
            let sql = `
                SELECT 
                    id,
                    reel_no,
                    grade,
                    date_str AS "date",
                    status,
                    dcs_reel_no,
                    target_roll_qty,
                    used_roll_qty
                FROM pl_qc_reel_view
                WHERE 1=1
            `;
            const bindVars = {};
            if (productionLineId) {
                sql += ` AND PL_PRODUCTION_LINE_ID = :productionLineId`;
                bindVars.productionLineId = productionLineId;
            }
            // 🎯 ถ้านับแล้วว่ามี Keyword ค่อยต่อ WHERE reel_no LIKE :search
            if (hasKeyword) {
                sql += ` AND UPPER(reel_no) LIKE UPPER(:search)`;
                bindVars.search = `%${cleanKeyword}%`;
            }
            // 📌 ใส่ ORDER BY เพื่อให้ผลลัพธ์เรียงลำดับอ่านง่ายเสมอ (ปรับตามคอลัมน์ที่ต้องการได้ค่ะ)
            sql += ` ORDER BY id DESC`;
            const result = await conn.execute(sql, bindVars, {
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
    static async updateCloseReel(splitSetId, reelId, staffId) {
        let conn;
        try {
            conn = await (0, database_1.getConnection)();
            const formattedStaffId = Number(staffId);
            // 🔍 1. ดึงโควตาคงเหลือ (remaining) จาก PL_QC_REEL_VIEW
            const reelViewSql = `
                SELECT reel_no, remaining 
                FROM pl_qc_reel_view 
                WHERE id = :reelId
            `;
            const reelResult = await conn.execute(reelViewSql, { reelId }, { outFormat: oracledb_1.default.OUT_FORMAT_OBJECT });
            if (!reelResult.rows || reelResult.rows.length === 0) {
                return {
                    success: false,
                    message: `ไม่พบข้อมูล QC Reel ID: ${reelId} หรือม้วนนี้โควตาเต็ม/ปิดงานไปแล้ว`
                };
            }
            const reelNo = reelResult.rows[0]?.REEL_NO;
            const remainingQty = reelResult.rows[0]?.REMAINING || 0;
            // 🔍 2. ดึงจำนวนม้วนที่ Set นี้ต้องใช้ (wait_weighing_qty) จาก PL_CUT_SPLIT_SET_VIEW
            const currentSetSql = `
                SELECT wait_weighing_qty 
                FROM pl_cut_split_set_view 
                WHERE split_set_id = :splitSetId
            `;
            const currentSetResult = await conn.execute(currentSetSql, { splitSetId }, { outFormat: oracledb_1.default.OUT_FORMAT_OBJECT });
            if (!currentSetResult.rows || currentSetResult.rows.length === 0) {
                return {
                    success: false,
                    message: `ไม่พบข้อมูล Set ID: ${splitSetId}`
                };
            }
            const requiredQty = currentSetResult.rows[0]?.WAIT_WEIGHING_QTY || 0;
            // 🛑 3. เปรียบเทียบโควตา
            if (requiredQty > remainingQty) {
                return {
                    success: false,
                    message: `ไม่สามารถเลือกม้วน QC (${reelNo}) ได้! โควตาคงเหลือไม่พอ (ม้วน QC เหลือตัดได้อีก ${remainingQty} ลูก แต่ Set นี้ต้องใช้ ${requiredQty} ลูก)`
                };
            }
            // 🟢 4. โควตาเพียงพอ -> UPDATE ตารางที่เกี่ยวข้องกัน
            // 4.1 อัปเดตผูก qc_reel_id ใน pd_roll
            const updatePdRollSql = `
                UPDATE pd_roll
                SET qc_reel_id = :reelId,
                    update_staff = :staffId,
                    update_date = SYSDATE
                WHERE split_set_id = :splitSetId
            `;
            const pdRollRes = await conn.execute(updatePdRollSql, { reelId, splitSetId, staffId: formattedStaffId }, { autoCommit: false });
            // 🟢 4.2 อัปเดต pd_roll_quality เฉพาะเมื่อมีรายการ pd_roll ถูกอัปเดตจริงๆ เท่านั้น
            if (pdRollRes.rowsAffected && pdRollRes.rowsAffected > 0) {
                const updatePdRollQualitySql = `
                    UPDATE pd_roll_quality pq
                    SET (
                        BASIS_WEIGHT, BURSTING_STRENGTH, RING_CRUSH, CONCORA, THICKNESS,
                        COBB, MOISTURE_CONTENT, CIE_LAB_L, CIE_LAB_A, CIE_LAB_B,
                        BOTTOM_SIDE, INKJET, REMARKS
                    ) = (
                        SELECT 
                            q.BASIS_WEIGHT, q.BURSTING_STRENGHT, q.RING_CRUSH, q.CONCORA, q.THICKNESS,
                            q.COBB, q.MOISTURE_CONTENT, q.CIE_LAB_L, q.CIE_LAB_A, q.CIE_LAB_B,
                            q.BOTTOM_SIDE, q.INKJET, q.REMARKS
                        FROM qc_reel_quality q
                        WHERE q.qc_reel_id = :reelId
                    ),
                    UPDATE_STAFF = :staffId,
                    UPDATE_DATE = SYSDATE
                    WHERE pq.pd_roll_id IN (
                        SELECT id 
                        FROM pd_roll 
                        WHERE split_set_id = :splitSetId
                    )
                `;
                await conn.execute(updatePdRollQualitySql, { reelId, splitSetId, staffId: formattedStaffId }, { autoCommit: false });
            }
            // 4.3 อัปเดตผูก qc_reel_id ลงใน pl_cut_split_set
            const updateSplitSetSql = `
                UPDATE pl_cut_split_set
                SET qc_reel_id = :reelId,
                    update_staff = :staffId,
                    update_date = SYSDATE
                WHERE id = :splitSetId
            `;
            const result = await conn.execute(updateSplitSetSql, { reelId, splitSetId, staffId: formattedStaffId }, { autoCommit: false });
            // 💾 4.4 Commit ทั้งหมด
            await conn.commit();
            return {
                success: true,
                rowsAffected: result.rowsAffected
            };
        }
        catch (error) {
            if (conn) {
                try {
                    await conn.rollback();
                }
                catch (rbErr) { }
            }
            console.error("❌ Model Error [updateCloseReel]:", error);
            throw error;
        }
        finally {
            if (conn)
                await conn.close();
        }
    }
    static async ManagerStatusPlOrderDetail(orderDetailId, staffId, // 🎯 รับ staffId
    orderId // 🎯 รับ orderId (Optional)
    ) {
        let conn;
        try {
            conn = await (0, database_1.getConnection)();
            const formattedStaffId = staffId ? Number(staffId) : null;
            // 🎯 Step 1: ดึง pl_order_id จาก pl_order_detail (กรณีไม่ได้ส่ง orderId มา)
            let currentOrderId = orderId;
            if (!currentOrderId) {
                const getOrderIdSql = `
                    SELECT pl_order_id 
                    FROM pl_order_detail 
                    WHERE id = :orderDetailId
                `;
                const orderResult = await conn.execute(getOrderIdSql, { orderDetailId }, { outFormat: oracledb_1.default.OUT_FORMAT_OBJECT });
                currentOrderId = orderResult.rows[0]?.PL_ORDER_ID || orderResult.rows[0]?.[0];
            }
            // 🎯 Step 2: นับจำนวน Set ทั้งหมด, Set ที่เสร็จแล้ว (status = 5), และ Set ที่เป็น status = 2
            const checkSql = `
                SELECT 
                    COUNT(*) AS TOTAL_SETS,
                    COUNT(CASE WHEN status = 5 THEN 1 END) AS COMPLETED_SETS,
                    COUNT(CASE WHEN status = 2 THEN 1 END) AS STATUS_2_SETS
                FROM pl_cut_split_set
                WHERE pl_order_detail_id = :orderDetailId
            `;
            const checkResult = await conn.execute(checkSql, { orderDetailId }, { outFormat: oracledb_1.default.OUT_FORMAT_OBJECT });
            const row = checkResult.rows[0];
            const totalSets = row?.TOTAL_SETS || 0;
            const completedSets = row?.COMPLETED_SETS || 0;
            const status2Sets = row?.STATUS_2_SETS || 0;
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
            // 🎯 Step 4: อัปเดต cut_status_id และ FINISH_DATE_TIME ลงตาราง PL_ORDER_DETAIL
            const updateDetailSql = `
                UPDATE pl_order_detail
                SET cut_status_id = :statusId,
                    FINISH_DATE_TIME = CASE WHEN :statusId = 5 THEN SYSDATE ELSE NULL END,
                    update_staff = :staffId,
                    update_date = SYSDATE
                WHERE id = :orderDetailId
            `;
            const updateResult = await conn.execute(updateDetailSql, {
                statusId: newCutStatusId,
                orderDetailId: orderDetailId,
                staffId: formattedStaffId
            }, { autoCommit: false });
            // 🎯 Step 5: ตรวจสอบตาราง PL_ORDER และจัดการสถานะ
            let orderUpdatedCount = 0;
            if (currentOrderId) {
                // 🔍 5.1 เช็กว่ายังมี pl_order_detail อื่นๆ ใน orderId นี้ที่ยังไม่เสร็จ (cut_status_id != 5) เหลืออยู่อีกหรือไม่?
                const checkRemainingDetailSql = `
                    SELECT COUNT(*) AS REMAINING_COUNT
                    FROM pl_order_detail
                    WHERE pl_order_id = :orderId
                    AND (cut_status_id != 5 OR cut_status_id IS NULL)
                `;
                const checkRemainingResult = await conn.execute(checkRemainingDetailSql, { orderId: currentOrderId }, { outFormat: oracledb_1.default.OUT_FORMAT_OBJECT });
                const remainingCount = checkRemainingResult.rows[0]?.REMAINING_COUNT || 0;
                if (Number(remainingCount) === 0) {
                    // 🟢 5.2 ถ้าไม่มีรายการค้างแล้ว (REMAINING_COUNT = 0) -> อัปเดต pl_order เป็น 'เสร็จสิ้น'
                    // 🟢 5.2 ถ้าไม่มีรายการค้างแล้ว (REMAINING_COUNT = 0) -> อัปเดต pl_order เป็น 'เสร็จสิ้น'
                    const updateOrderSql = `
                        UPDATE pl_order
                        SET 
                            status = :status,
                            FINISH_ORDER = SYSDATE,
                            UPDATE_STAFF = :staffId,
                            UPDATE_DATE = SYSDATE
                        WHERE id = :orderId
                    `;
                    // const updateOrderSql = `
                    //     UPDATE pl_order
                    //     SET 
                    //         FINISH_ORDER = SYSDATE,
                    //         UPDATE_STAFF = :staffId,
                    //         UPDATE_DATE = SYSDATE
                    //     WHERE id = :orderId
                    // `;
                    const orderResult = await conn.execute(updateOrderSql, {
                        orderId: currentOrderId,
                        staffId: formattedStaffId,
                        status: WaitCutModel.last_status || 'เสร็จสิ้น'
                    }, { autoCommit: false });
                    orderUpdatedCount = orderResult.rowsAffected || 0;
                }
                else {
                    // 🔴 5.3 ถ้ายึดตามเงื่อนไขที่ยังเหลือรายการไม่เสร็จ (REMAINING_COUNT > 0) -> ถอย status กลับเป็น default_status และล้างค่า FINISH_ORDER = NULL
                    const revertOrderSql = `
                        UPDATE pl_order
                        SET 
                            status = :status,
                            FINISH_ORDER = NULL,
                            UPDATE_STAFF = :staffId,
                            UPDATE_DATE = SYSDATE
                        WHERE id = :orderId
                    `;
                    const orderResult = await conn.execute(revertOrderSql, {
                        orderId: currentOrderId,
                        staffId: formattedStaffId,
                        status: WaitCutModel.default_status || 'ส่งให้ Rewinder'
                    }, { autoCommit: false });
                    orderUpdatedCount = orderResult.rowsAffected || 0;
                }
            }
            // 🔒 Commit ธุรกรรมทั้งหมดพร้อมกันแบบ Atomic Transaction
            await conn.commit();
            return {
                orderDetailId: orderDetailId,
                orderId: currentOrderId || null,
                totalSets: totalSets,
                completedSets: completedSets,
                status2Sets: status2Sets,
                updatedCutStatusId: newCutStatusId,
                detailRowsAffected: updateResult.rowsAffected,
                orderUpdatedCount: orderUpdatedCount
            };
        }
        catch (error) {
            if (conn) {
                try {
                    await conn.rollback();
                }
                catch (rbErr) { }
            }
            console.error("❌ Model Error [ManagerStatusPlOrderDetail]:", error);
            throw error;
        }
        finally {
            if (conn)
                await conn.close();
        }
    }
    static async forceCompleteOrderDetail(orderDetailId, orderId, staffId) {
        let conn;
        try {
            conn = await (0, database_1.getConnection)();
            const formattedStaffId = staffId;
            // 🎯 Step 1: อัปเดตทุก Set ใน PL_CUT_SPLIT_SET ที่ยังไม่เสร็จ
            const updateSetsSql = `
                UPDATE pl_cut_split_set
                SET 
                    status = 5,
                    sub_status = 'บังคับเสร็จสิ้น',
                    finish_at = SYSDATE,
                    update_staff = :staffId,
                    update_date = SYSDATE
                WHERE pl_order_detail_id = :orderDetailId
                AND (status != 5 OR status IS NULL)
            `;
            const setsResult = await conn.execute(updateSetsSql, {
                orderDetailId: orderDetailId,
                staffId: formattedStaffId
            }, { autoCommit: false });
            // 🎯 Step 2: อัปเดตสถานะใน PL_ORDER_DETAIL ให้ cut_status_id = 5 (เสร็จสิ้น)
            const updateDetailSql = `
                UPDATE pl_order_detail
                SET cut_status_id = 5,
                    FINISH_DATE_TIME = SYSDATE,
                    update_staff = :staffId,
                    update_date = SYSDATE
                WHERE id = :orderDetailId
            `;
            const detailResult = await conn.execute(updateDetailSql, { orderDetailId: orderDetailId, staffId: formattedStaffId }, { autoCommit: false });
            // 🎯 Step 3: อัปเดตตาราง PL_ORDER (เช็กว่ารายการย่อยทั้งหมดใน orderId นี้เสร็จสิ้นครบหมดหรือยัง)
            let orderUpdatedCount = 0;
            if (orderId) {
                // 🔍 3.1 เช็กว่ายังมี pl_order_detail อื่นๆ ใน orderId นี้ที่ยังไม่เสร็จ (cut_status_id != 5) เหลืออยู่อีกหรือไม่?
                const checkRemainingDetailSql = `
                    SELECT COUNT(*) AS REMAINING_COUNT
                    FROM pl_order_detail
                    WHERE pl_order_id = :orderId
                    AND (cut_status_id != 5 OR cut_status_id IS NULL)
                `;
                const checkResult = await conn.execute(checkRemainingDetailSql, { orderId: orderId }, { outFormat: oracledb_1.default.OUT_FORMAT_OBJECT });
                const remainingCount = checkResult.rows[0]?.REMAINING_COUNT || checkResult.rows[0]?.[0] || 0;
                // 🟢 3.2 ถ้าไม่มีรายการค้างแล้ว (REMAINING_COUNT = 0) -> ค่อยอัปเดต pl_order เป็น 'เสร็จสิ้น'
                if (Number(remainingCount) === 0) {
                    const updateOrderSql = `
                        UPDATE pl_order
                        SET 
                            status = :status,
                            FINISH_ORDER = SYSDATE,
                            UPDATE_STAFF = :staffId,
                            UPDATE_DATE = SYSDATE
                        WHERE id = :orderId
                    `;
                    const orderResult = await conn.execute(updateOrderSql, {
                        orderId: orderId,
                        staffId: formattedStaffId,
                        status: WaitCutModel.last_status
                    }, { autoCommit: false });
                    orderUpdatedCount = orderResult.rowsAffected || 0;
                }
                else {
                    console.log(`📌 [forceCompleteOrderDetail] orderId: ${orderId} ยังมีรายการย่อยค้างอยู่อีก ${remainingCount} รายการ -> ข้ามการอัปเดต pl_order`);
                }
            }
            // 🔒 Commit ธุรกรรมทั้งหมดลง Database พร้อมกันเมื่อทำครบทุก Step
            await conn.commit();
            return {
                orderDetailId: orderDetailId,
                orderId: orderId || null,
                setsUpdatedCount: setsResult.rowsAffected,
                detailUpdatedCount: detailResult.rowsAffected,
                orderUpdatedCount: orderUpdatedCount,
                message: "Successfully forced status to completed (5) and evaluated order completion"
            };
        }
        catch (error) {
            if (conn) {
                try {
                    await conn.rollback();
                }
                catch (rollbackErr) {
                    console.error("⚠️ Rollback Error:", rollbackErr);
                }
            }
            console.error("❌ Model Error [forceCompleteOrderDetail]:", error);
            throw error;
        }
        finally {
            if (conn)
                await conn.close();
        }
    }
    static async forceResetOrderDetail(orderDetailId, orderId, staffId) {
        let conn;
        try {
            conn = await (0, database_1.getConnection)();
            const formattedStaffId = staffId ? Number(staffId) : null;
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
            // 🎯 Step 2: ยกเลิกสถานะบังคับเสร็จสิ้นใน PL_CUT_SPLIT_SET (ถ้ามี)
            const resetSetsSql = `
                UPDATE pl_cut_split_set
                SET 
                    status = 1,
                    sub_status = NULL,
                    finish_at = NULL,
                    update_staff = :staffId,
                    update_date = SYSDATE
                WHERE pl_order_detail_id = :orderDetailId
                AND sub_status = 'บังคับเสร็จสิ้น'
            `;
            const setsResult = await conn.execute(resetSetsSql, { orderDetailId: orderDetailId, staffId: formattedStaffId }, { autoCommit: false });
            // 🎯 Step 3: อัปเดตสถานะใน PL_ORDER_DETAIL ให้ cut_status_id = 1
            const resetDetailSql = `
                UPDATE pl_order_detail
                SET cut_status_id = 1,
                    finish_date_time = NULL,
                    update_staff = :staffId,
                    update_date = SYSDATE
                WHERE id = :orderDetailId
            `;
            const detailResult = await conn.execute(resetDetailSql, { orderDetailId: orderDetailId, staffId: formattedStaffId }, { autoCommit: false });
            // 🎯 Step 4: อัปเดตสถานะตารางหลัก PL_ORDER ให้กลับมาเป็น 'ส่งให้ Rewinder' และถอยวันจบงาน
            let orderResetCount = 0;
            if (orderId) {
                const resetOrderSql = `
                    UPDATE pl_order
                    SET 
                        status = :status,
                        FINISH_ORDER = NULL,
                        UPDATE_STAFF = :staffId,
                        UPDATE_DATE = SYSDATE
                    WHERE id = :orderId
                `;
                const orderResult = await conn.execute(resetOrderSql, { orderId: orderId, staffId: formattedStaffId, status: WaitCutModel.default_status }, { autoCommit: false });
                orderResetCount = orderResult.rowsAffected || 0;
            }
            // 🔒 Commit ธุรกรรมทั้งหมดลง Database พร้อมกัน
            await conn.commit();
            return {
                orderDetailId: orderDetailId,
                orderId: orderId || null,
                setsResetCount: setsResult.rowsAffected,
                detailResetCount: detailResult.rowsAffected,
                orderResetCount: orderResetCount,
                message: "Successfully reset order detail status to 1 and reverted pl_order status"
            };
        }
        catch (error) {
            // 🛑 ถ้าระหว่างทางมี Error ให้สั่ง Rollback คืนค่าระบบทันที
            if (conn) {
                try {
                    await conn.rollback();
                }
                catch (rollbackErr) {
                    console.error("⚠️ Rollback Error:", rollbackErr);
                }
            }
            console.error("❌ Model Error [forceResetOrderDetail]:", error);
            throw error;
        }
        finally {
            if (conn)
                await conn.close();
        }
    }
    static async holdCutSplitSet(splitSetId, orderId, orderDetailId, staffId // 🎯 รับ staffId เพิ่มเติม
    ) {
        let conn;
        try {
            conn = await (0, database_1.getConnection)();
            const formattedStaffId = staffId ? Number(staffId) : null;
            // 🎯 UPDATE สถานะของรายการเซ็ตย่อยเป็น 4 (HOLD) พร้อมอัปเดตผู้แก้ไขและเวลา
            const updateSql = `
                UPDATE pl_cut_split_set
                SET status = 4,
                    update_staff = :staffId,
                    update_date = SYSDATE
                WHERE id = :splitSetId
                AND pl_order_id = :orderId
                AND pl_order_detail_id = :orderDetailId
            `;
            const result = await conn.execute(updateSql, {
                splitSetId: splitSetId,
                orderId: orderId,
                orderDetailId: orderDetailId,
                staffId: formattedStaffId
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
    static async unHoldCutSplitSet(splitSetId, orderId, orderDetailId, staffId) {
        let conn;
        try {
            conn = await (0, database_1.getConnection)();
            const formattedStaffId = staffId ? Number(staffId) : null;
            // 🎯 1. ตรวจสอบสถานะของใบสั่งตัดหลัก (PL_ORDER_DETAIL) ก่อน
            // สมมติว่าต้องการเช็คว่า cut_status_id ต้องไม่เท่ากับ 5 (หรือตามค่าสถานะ HOLD ของใบสั่งหลักคุณ)
            const checkMainOrderQuery = `
                    SELECT cut_status_id 
                    FROM pl_order_detail 
                    WHERE id = :orderDetailId
                `;
            const mainOrderResult = await conn.execute(checkMainOrderQuery, { orderDetailId: orderDetailId }, { outFormat: oracledb_1.default.OUT_FORMAT_OBJECT });
            const mainCutStatus = mainOrderResult.rows[0]?.CUT_STATUS_ID;
            // ถ้าใบสั่งตัดหลักอยู่ในสถานะ HOLD (เช่น เท่ากับ 5 หรือ 4 ตามโครงสร้างตารางคุณ) ให้ดีด Error ออกทันที
            if (mainCutStatus === 4) { // ปรับเลข 5 ให้ตรงกับสถานะ HOLD ของ PL_ORDER_DETAIL จริงในระบบ
                throw new Error(`ไม่สามารถปลด HOLD ได้ เนื่องจากใบสั่งตัดหลัก (Order Detail) อยู่ในสถานะ HOLD`);
            }
            // 🎯 2. UPDATE สถานะของรายการเซ็ตย่อยกลับเป็น 2 (รอตัด)
            const updateSql = `
                    UPDATE pl_cut_split_set
                    SET status = 2,
                        update_staff = :staffId,
                        update_date = SYSDATE
                    WHERE id = :splitSetId
                    AND status = 4
                `;
            const result = await conn.execute(updateSql, {
                splitSetId: splitSetId,
                staffId: formattedStaffId
            }, { autoCommit: true });
            // 🛡️ เช็คว่ามีแถวถูกอัปเดตหรือไม่
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
    static async holdOrderDetail(orderDetailId, orderId, staffId // 🎯 1. รับ staffId เพิ่มเติม
    ) {
        let conn;
        try {
            conn = await (0, database_1.getConnection)();
            const formattedStaffId = staffId;
            // 🔍 1. เช็กว่าใน PL_CUT_SPLIT_SET มีรายการที่ชั่งเสร็จสิ้นแล้ว (status = 5) หรือไม่?
            const checkFinishedSql = `
                SELECT COUNT(*) AS FINISHED_COUNT
                FROM pl_cut_split_set
                WHERE pl_order_detail_id = :orderDetailId
                AND status = 5
            `;
            const checkResult = await conn.execute(checkFinishedSql, { orderDetailId }, { outFormat: oracledb_1.default.OUT_FORMAT_OBJECT });
            const finishedCount = checkResult.rows[0]?.FINISHED_COUNT || 0;
            if (finishedCount === 0) {
                // 🎯 เคสที่ 1: ยังไม่มีรายการไหนเสร็จสิ้นเลย -> สั่ง DELETE ทั้งหมดใน PL_CUT_SPLIT_SET
                const deleteSplitSetSql = `
                    DELETE FROM pl_cut_split_set
                    WHERE pl_order_detail_id = :orderDetailId
                `;
                await conn.execute(deleteSplitSetSql, { orderDetailId }, { autoCommit: false });
                // สั่ง DELETE pl_wait_weighing ที่ผูกกันอยู่ย้อนหลัง
                const deleteWaitWeighingSql = `
                    DELETE FROM pl_wait_weighing
                    WHERE pl_order_detail_id = :orderDetailId
                    AND status IS NULL
                `;
                await conn.execute(deleteWaitWeighingSql, { orderDetailId }, { autoCommit: false });
            }
            else {
                // 🎯 เคสที่ 2: มีบางรายการเสร็จสิ้นไปแล้ว -> สั่ง UPDATE status = 4 พร้อมบันทึกผู้แก้ไขและเวลา
                const updateSplitSetSql = `
                    UPDATE pl_cut_split_set
                    SET status = 4,
                        update_staff = :staffId,
                        update_date = SYSDATE
                    WHERE pl_order_detail_id = :orderDetailId
                    AND status = 2
                `;
                await conn.execute(updateSplitSetSql, { orderDetailId, staffId: formattedStaffId }, { autoCommit: false });
            }
            // 🟢 2. อัปเดตสถานะใบงานย่อยหลัก PL_ORDER_DETAIL ให้เป็น status = 4 (Hold) พร้อมบันทึกผู้แก้ไขและเวลา
            const updateMainDetailSql = `
                UPDATE pl_order_detail
                SET cut_status_id = 4,
                    update_staff = :staffId,
                    update_date = SYSDATE
                WHERE id = :orderDetailId
            `;
            const result = await conn.execute(updateMainDetailSql, { orderDetailId, staffId: formattedStaffId }, { autoCommit: false });
            // 💾 Commit ทั้งหมด
            await conn.commit();
            return {
                success: true,
                finishedCount,
                rowsAffected: result.rowsAffected
            };
        }
        catch (error) {
            if (conn) {
                try {
                    await conn.rollback();
                }
                catch (rbErr) { }
            }
            console.error("❌ Model Error [holdOrderDetail]:", error);
            throw error;
        }
        finally {
            if (conn)
                await conn.close();
        }
    }
    static async unholdOrderDetail(orderDetailId, orderId, staffId // 🎯 1. รับ staffId เพิ่มเติม
    ) {
        let conn;
        try {
            conn = await (0, database_1.getConnection)();
            const formattedStaffId = staffId;
            // 🟢 1. คืนค่ารายการใน PL_CUT_SPLIT_SET ที่โดน HOLD (status = 4) ให้กลับมาเป็นรอตัด (status = 2) พร้อมบันทึกผู้แก้ไข
            const updateSplitSetSql = `
                UPDATE pl_cut_split_set
                SET status = 2,
                    update_staff = :staffId,
                    update_date = SYSDATE
                WHERE pl_order_detail_id = :orderDetailId
                AND status = 4
            `;
            await conn.execute(updateSplitSetSql, { orderDetailId, staffId: formattedStaffId }, { autoCommit: false });
            // 🟢 2. ปรับสถานะใบงานย่อยหลัก PL_ORDER_DETAIL กลับเป็น 1 (รอสั่งตัด) พร้อมบันทึกผู้แก้ไข
            const updateMainDetailSql = `
                UPDATE pl_order_detail
                SET cut_status_id = 1,
                    update_staff = :staffId,
                    update_date = SYSDATE
                WHERE id = :orderDetailId
            `;
            const result = await conn.execute(updateMainDetailSql, { orderDetailId, staffId: formattedStaffId }, { autoCommit: false });
            // 💾 Commit ทรานแซกชันพร้อมกันทั้งหมด
            await conn.commit();
            return {
                success: true,
                rowsAffected: result.rowsAffected
            };
        }
        catch (error) {
            if (conn) {
                try {
                    await conn.rollback();
                }
                catch (rbErr) { }
            }
            console.error("❌ Model Error [unholdOrderDetail]:", error);
            throw error;
        }
        finally {
            if (conn)
                await conn.close();
        }
    }
    static async swapSplitSetSize(splitSetId, posA, posB, staffId // 🎯 รับ staffId เพิ่มเติม
    ) {
        let conn;
        try {
            conn = await (0, database_1.getConnection)();
            const formattedStaffId = staffId ? Number(staffId) : null;
            // 🟢 1. SELECT ค่าสดล่าสุดจาก DB และล็อกแถวป้องกัน Race Condition
            const selectSql = `
                SELECT size_id1, size_id2, size_id3, size_id4,
                       over_size1, over_size2, over_size3, over_size4,
                       grade1_id, grade2_id, grade3_id, grade4_id
                FROM pl_cut_split_set
                WHERE id = :splitSetId
                FOR UPDATE
            `;
            const result = await conn.execute(selectSql, { splitSetId }, { outFormat: oracledb_1.default.OUT_FORMAT_OBJECT });
            const row = result.rows[0];
            if (!row)
                throw new Error("ไม่พบข้อมูลรายการเซ็ตย่อย");
            const sizeValA = row[`SIZE_ID${posA}`];
            const sizeValB = row[`SIZE_ID${posB}`];
            const overSizeValA = row[`OVER_SIZE${posA}`];
            const overSizeValB = row[`OVER_SIZE${posB}`];
            const gradeValA = row[`GRADE${posA}_ID`];
            const gradeValB = row[`GRADE${posB}_ID`];
            // 🟢 2. สลับตำแหน่งค่า SIZE, OVER_SIZE และ GRADE ใน DB พร้อมบันทึกผู้แก้ไขและเวลา
            const updateSql = `
                UPDATE pl_cut_split_set
                SET size_id${posA} = :sizeValB,
                    size_id${posB} = :sizeValA,
                    over_size${posA} = :overSizeValB,
                    over_size${posB} = :overSizeValA,
                    grade${posA}_id = :gradeValB,
                    grade${posB}_id = :gradeValA,
                    update_staff = :staffId,
                    update_date = SYSDATE
                WHERE id = :splitSetId
            `;
            await conn.execute(updateSql, {
                sizeValA,
                sizeValB,
                overSizeValA,
                overSizeValB,
                gradeValA,
                gradeValB,
                splitSetId,
                staffId: formattedStaffId
            }, { autoCommit: false });
            await conn.commit();
            return { success: true };
        }
        catch (error) {
            if (conn) {
                try {
                    await conn.rollback();
                }
                catch (rbErr) { }
            }
            console.error("❌ Model Error [swapSplitSetSize]:", error);
            throw error;
        }
        finally {
            if (conn)
                await conn.close();
        }
    }
    static async closeReelStatus(id, staffId) {
        let conn;
        try {
            conn = await (0, database_1.getConnection)();
            const formattedStaffId = staffId ? Number(staffId) : null;
            // 🎯 UPDATE ค่า QTY ของ QC_REEL ให้เท่ากับ PD_ROLL_USED_QTY ใน PL_QC_REEL_VIEW
            // พร้อมบันทึก UPDATE_STAFF และ UPDATE_DATE = SYSDATE
            const updateSql = `
                UPDATE qc_reel q
                SET q.roll_qty = (
                        SELECT v.pd_roll_used_qty
                        FROM pl_qc_reel_view v
                        WHERE v.id = q.id
                    ),
                    q.update_staff = :staffId,
                    q.update_date = SYSDATE
                WHERE q.id = :id
            `;
            const result = await conn.execute(updateSql, {
                id,
                staffId: formattedStaffId
            }, { autoCommit: false });
            if (result.rowsAffected === 0) {
                throw new Error(`ไม่พบข้อมูล QC_REEL สำหรับ ID: ${id}`);
            }
            await conn.commit();
            return { success: true, rowsAffected: result.rowsAffected };
        }
        catch (error) {
            if (conn) {
                try {
                    await conn.rollback();
                }
                catch (rbErr) { }
            }
            console.error("❌ Model Error [closeReelStatus]:", error);
            throw error;
        }
        finally {
            if (conn)
                await conn.close();
        }
    }
    // 🎯 นับจำนวนรายการแยกตามแต่ละ cut_status_id (1,2,3,4) และแยกตาม pl_production_line_id
    static async countWaitingCutByProductionLine() {
        let conn;
        try {
            conn = await (0, database_1.getConnection)();
            const sql = `
                SELECT 
                    pl_production_line_id AS PL_PRODUCTION_LINE_ID,
                    cut_status_id AS CUT_STATUS_ID,
                    COUNT(pl_order_detail_id) AS TOTAL
                FROM pl_order_view
                WHERE cut_status_id IN (1, 2, 3, 4)
                AND status = :defaultStatus
                GROUP BY pl_production_line_id, cut_status_id
            `;
            const result = await conn.execute(sql, { defaultStatus: WaitCutModel.default_status }, {
                outFormat: oracledb_1.default.OUT_FORMAT_OBJECT
            });
            const dataList = [];
            if (result.rows) {
                for (const row of result.rows) {
                    dataList.push({
                        pl_production_line_id: row.PL_PRODUCTION_LINE_ID,
                        cut_status_id: row.CUT_STATUS_ID,
                        total: row.TOTAL
                    });
                }
            }
            return dataList;
        }
        catch (error) {
            console.error("❌ Model Error [countWaitingCutByProductionLine]:", error);
            throw error;
        }
        finally {
            if (conn)
                await conn.close();
        }
    }
}
exports.WaitCutModel = WaitCutModel;
