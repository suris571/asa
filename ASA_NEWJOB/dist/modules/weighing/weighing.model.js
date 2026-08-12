"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WeighingModel = void 0;
// 📦 โครงสร้างข้อมูลใบรับน้ำหนักลูกกระดาษ
const database_1 = require("../../database");
const oracledb_1 = __importDefault(require("oracledb"));
// 💾 คลังข้อมูลจำลองประวัติการชั่งน้ำหนักในแรม (In-Memory)
class WeighingModel {
    // ดึงประวัติที่ชั่งน้ำหนักแล้วทั้งหมดมารายงานผล
    static async getNextWeighing(productionLineId, search = null, type = null, roll_no = null, startDate = null, endDate = null) {
        let conn;
        try {
            conn = await (0, database_1.getConnection)();
            // 🎯 1. ดึงรายการ remark ย้อนหลัง 3 เดือนจาก pd_roll
            let remarksList = [];
            let holdCauseList = [];
            if (type != "history") {
                const remarkSql = `
                    SELECT DISTINCT REMARKS 
                    FROM pd_roll 
                    WHERE create_date >= ADD_MONTHS(SYSDATE, -3)
                    AND REMARKS IS NOT NULL 
                    AND TRIM(REMARKS) IS NOT NULL
                    ORDER BY REMARKS ASC
                `;
                const remarkResult = await conn.execute(remarkSql, {}, {
                    outFormat: oracledb_1.default.OUT_FORMAT_OBJECT,
                });
                remarksList = remarkResult.rows?.map(r => r.REMARKS) || [];
                // 🎯 2. ดึงรายการ hold_cause ย้อนหลัง 3 เดือนจาก pd_roll
                const holdCauseSql = `
                    SELECT DISTINCT hold_cause 
                    FROM pd_roll 
                    WHERE create_date >= ADD_MONTHS(SYSDATE, -3)
                    AND hold_cause IS NOT NULL 
                    AND TRIM(hold_cause) IS NOT NULL
                    ORDER BY hold_cause ASC
                `;
                const holdCauseResult = await conn.execute(holdCauseSql, {}, {
                    outFormat: oracledb_1.default.OUT_FORMAT_OBJECT,
                });
                holdCauseList = holdCauseResult.rows?.map(r => r.HOLD_CAUSE) || [];
            }
            // 🎯 3. Query หลัก (ตามเดิม)
            let sql = `
                SELECT 
                    id                  AS "id",
                    pl_order_id         AS "orderId",
                    pl_order_detail_id  AS "orderDetailId",
                    split_set_id        AS "splitSetId",
                    part                AS "part",
                    roll                AS "roll",
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
                    already_done        AS "alreadyDone",
                    pl_production_line_id AS "productionLineId"
                FROM pl_wait_weighing_view
                WHERE 1 = 1
            `;
            if (!type) {
                sql += ` AND status IS NULL`;
            }
            else {
                sql += ` AND status IS NOT NULL`;
            }
            const binds = {};
            if (productionLineId) {
                sql += ` AND pl_production_line_id = :productionLineId`;
                binds.productionLineId = productionLineId;
            }
            const isSearchMode = search && search.trim() !== "";
            if (isSearchMode) {
                sql += ` AND UPPER(order_no) LIKE :search`;
                binds.search = `%${search.trim().toUpperCase()}%`;
            }
            const rollSearchMode = roll_no && roll_no.trim() !== "";
            if (rollSearchMode) {
                sql += ` AND UPPER(roll_no) LIKE :roll_no`;
                binds.roll_no = `%${roll_no.trim().toUpperCase()}%`;
            }
            if (!isSearchMode && !type) {
                sql += ` AND ROWNUM <= 1`;
            }
            if (startDate && startDate.trim() !== '') {
                sql += ` AND TRUNC(finish_at) >= TO_DATE(:startDate, 'DD/MM/YYYY')`;
                binds.startDate = startDate.trim();
            }
            if (endDate && endDate.trim() !== '') {
                sql += ` AND TRUNC(finish_at) <= TO_DATE(:endDate, 'DD/MM/YYYY')`;
                binds.endDate = endDate.trim();
            }
            if (type === "history") {
                sql += ` ORDER BY id DESC`;
            }
            else {
                sql += ` ORDER BY queue_no ASC NULLS LAST, set_no ASC, roll DESC`;
            }
            console.log("SQL Query:", sql);
            const result = await conn.execute(sql, binds, {
                outFormat: oracledb_1.default.OUT_FORMAT_OBJECT,
            });
            const rows = result.rows || [];
            // 🎯 Helper Function สำหรับแปลงข้อมูล + ยัด List เข้าไป
            const processRowData = (row) => {
                if (!row)
                    return row;
                if (row.createdAt) {
                    const dateObj = row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt);
                    if (!isNaN(dateObj.getTime())) {
                        row.createdAt = dateObj.toLocaleDateString("en-GB", {
                            timeZone: "Asia/Bangkok",
                        });
                    }
                }
                if (!row.part && !row.status) {
                    row.part = WeighingModel.getCurrentShift();
                }
                const total = Number(row.total || 0);
                const alreadyDone = Number(row.alreadyDone || 0);
                row.remaining = Math.max(0, total - alreadyDone);
                // 🎯 เพิ่ม remarks_list และ hold_cause_list ย้อนหลัง 3 เดือนลงในวัตถุ
                row.remarks_list = remarksList;
                row.hold_cause_list = holdCauseList;
                return row;
            };
            // 🎯 4. Return ข้อมูล
            if (isSearchMode || type === "history") {
                return rows.map((row) => processRowData(row));
            }
            else {
                return rows.length > 0 ? processRowData(rows[0]) : null;
            }
        }
        catch (error) {
            console.error("❌ เกิดข้อผิดพลาดใน Model [getNextWeighing]:", error);
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
    static async updateWeighingResult(data, roll_no, staffId // 🎯 หรือรับผ่านพารามิเตอร์แยก
    ) {
        let conn;
        try {
            conn = await (0, database_1.getConnection)();
            const currentStaffId = data.staffId || staffId;
            const formattedStaffId = currentStaffId ? Number(currentStaffId) : null;
            // 🔍 STEP 1: SELECT หา pl_order_detail_id และ split_set_id จาก pl_wait_weighing
            const checkSql = `
                SELECT pl_order_detail_id, split_set_id 
                FROM pl_wait_weighing 
                WHERE id = :id
            `;
            const checkResult = await conn.execute(checkSql, { id: data.id }, { outFormat: oracledb_1.default.OUT_FORMAT_OBJECT });
            if (!checkResult.rows || checkResult.rows.length === 0) {
                throw new Error(`ไม่พบรายการชั่งน้ำหนัก ID: ${data.id}`);
            }
            const orderDetailId = checkResult.rows[0].PL_ORDER_DETAIL_ID;
            const splitSetId = checkResult.rows[0].SPLIT_SET_ID;
            // 🎯 STEP 2: อัปเดตผลการชั่งน้ำหนักลงตาราง pl_wait_weighing พร้อมบันทึกผู้แก้ไขและเวลา
            const updateWeighSql = `
                UPDATE pl_wait_weighing
                SET 
                    weigh = :weigh,
                    status = :status,
                    remark = :remark,
                    part = :part,
                    roll_no = :roll_no,
                    update_staff = :staffId,
                    update_date = SYSDATE
                WHERE id = :id
            `;
            const result = await conn.execute(updateWeighSql, {
                weigh: data.weigh,
                status: data.status,
                remark: data.remark,
                part: WeighingModel.getCurrentShift(),
                roll_no: roll_no,
                staffId: formattedStaffId,
                id: data.id,
            }, { autoCommit: false });
            const isSuccess = result.rowsAffected && result.rowsAffected > 0;
            if (isSuccess && orderDetailId) {
                // 🎯 STEP 3: อัปเดตจำนวนลูกย่อยสะสม COMPLETED_ROLL_QTY + 1 พร้อมบันทึกผู้แก้ไข
                const updateRollQtySql = `
                    UPDATE pl_order_detail
                    SET completed_roll_qty = NVL(completed_roll_qty, 0) + 1,
                        update_staff = :staffId,
                        update_date = SYSDATE
                    WHERE id = :orderDetailId
                `;
                await conn.execute(updateRollQtySql, { orderDetailId, staffId: formattedStaffId }, { autoCommit: false });
                // 🎯 STEP 4: เช็กว่าใน split_set_id นี้ มีลูกย่อยที่ยังชั่งไม่เสร็จเหลืออยู่อีกไหม?
                if (splitSetId) {
                    const checkRemainingSql = `
                        SELECT COUNT(*) AS REMAINING_COUNT
                        FROM pl_wait_weighing
                        WHERE split_set_id = :splitSetId
                        AND status IS NULL
                    `;
                    const remainResult = await conn.execute(checkRemainingSql, { splitSetId }, { outFormat: oracledb_1.default.OUT_FORMAT_OBJECT });
                    const remainingCount = remainResult.rows[0]?.REMAINING_COUNT || 0;
                    // 💡 ถ้ารายการค้างชั่งในเซ็ตนี้เป็น 0 แล้ว = ชั่งครบทั้งเซ็ตแล้ว! -> บวก COMPLETED_SET_QTY + 1
                    if (remainingCount === 0) {
                        const updateSetQtySql = `
                            UPDATE pl_order_detail
                            SET completed_set_qty = NVL(completed_set_qty, 0) + 1,
                                update_staff = :staffId,
                                update_date = SYSDATE
                            WHERE id = :orderDetailId
                        `;
                        await conn.execute(updateSetQtySql, { orderDetailId, staffId: formattedStaffId }, { autoCommit: false });
                    }
                }
                // 🔒 Commit ธุรกรรมทั้งหมดพร้อมกันแบบ Atomic Transaction
                await conn.commit();
            }
            else {
                await conn.rollback();
            }
            return isSuccess;
        }
        catch (error) {
            if (conn)
                await conn.rollback();
            console.error("❌ เกิดข้อผิดพลาดใน Model [updateWeighingResult]:", error);
            throw error;
        }
        finally {
            if (conn)
                await conn.close();
        }
    }
    static async CheckResetSplitSet(id) {
        let conn;
        try {
            conn = await (0, database_1.getConnection)();
            // 🎯 Query ดึงคิวถัดไปเพียง 1 รายการ (ปรับให้ใช้ ROWNUM <= 1 สำหรับ Oracle 10g)
            const sqlSelect = `
            SELECT 
                id AS "id"
            FROM pl_wait_weighing_view
            WHERE split_set_id = :id
              AND weigh IS NOT NULL
              AND ROWNUM <= 1
        `;
            // 1. ค้นหาข้อมูล
            const result = await conn.execute(sqlSelect, { id }, {
                outFormat: oracledb_1.default.OUT_FORMAT_OBJECT,
            });
            // 2. ถ้าเจอข้อมูล (มีการชั่งน้ำหนักแล้ว) ให้ส่งออก false ทันที
            if (result.rows && result.rows.length > 0) {
                console.log("reset ไม่ได้เจอข้อมูล");
                return false;
            }
            // 3. ถ้าไม่เจอข้อมูล ให้ลบข้อมูลใน PL_WAIT_WEIGHING ของ split_set_id นี้
            const sqlDelete = `
            DELETE FROM pl_wait_weighing
            WHERE split_set_id = :id
        `;
            await conn.execute(sqlDelete, { id });
            // Commit transaction
            await conn.commit();
            return true;
        }
        catch (error) {
            console.error("❌ เกิดข้อผิดพลาดใน Model [CheckResetSplitSet]:", error);
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
    static async getMaxRollNo() {
        let conn;
        try {
            conn = await (0, database_1.getConnection)();
            // 💡 วิธีที่ 1: ปรับใช้ ROWNUM <= 1 แทน FETCH FIRST 1 ROWS ONLY
            const sql = `
            SELECT roll_no 
            FROM (
                SELECT roll_no 
                FROM PD_ROLL 
                WHERE roll_no IS NOT NULL 
                  AND REGEXP_LIKE(roll_no, '^[0-9]+$')
                ORDER BY TO_NUMBER(roll_no) DESC
            )
            WHERE ROWNUM <= 1
        `;
            const result = await conn.execute(sql, [], {
                outFormat: oracledb_1.default.OUT_FORMAT_OBJECT,
            });
            const rows = result.rows || [];
            if (rows.length > 0 && rows[0].ROLL_NO) {
                const currentMax = parseInt(rows[0].ROLL_NO, 10);
                return String(currentMax + 1); // 🎯 ดึงได้ปุ๊บ +1 แล้วส่งกลับ
            }
            // 🎯 ถ้าตารางยังไม่มีข้อมูล ให้เริ่มที่ '1'
            return "1";
        }
        catch (error) {
            console.error("❌ เกิดข้อผิดพลาดใน Model [getMaxRollNo]:", error);
            return "1";
        }
        finally {
            if (conn)
                await conn.close();
        }
    }
    static getCurrentShift = (dateObj = new Date()) => {
        // ดึงชั่วโมง (0 - 23) ตามโซนเวลาท้องถิ่น
        const currentHour = dateObj.getHours();
        // 🎯 1. ช่วงเวลา 08:00 ถึง 15:59 (8 ถึง 15) -> กะเช้า
        if (currentHour >= 8 && currentHour < 16) {
            return "เช้า"; // หรือใส่ 'กะเช้า' ตามที่ DB ต้องการ
        }
        // 🎯 2. ช่วงเวลา 16:00 ถึง 23:59 (16 ถึง 23) -> กะบ่าย
        if (currentHour >= 16 && currentHour < 24) {
            return "บ่าย"; // หรือใส่ 'กะบ่าย'
        }
        // 🎯 3. ช่วงเวลา 00:00 ถึง 07:59 (0 ถึง 7) -> กะดึก
        return "ดึก"; // หรือใส่ 'กะดึก'
    };
    static async GetWaitWeighingInfoById(id_pl_wait_weight) {
        let conn;
        try {
            conn = await (0, database_1.getConnection)();
            const sql = `
                SELECT 
                    id,
                    pl_order_id,
                    qc_reel_id,
                    qc_reel_quality_id,
                    roll
                FROM pl_wait_weighing_view 
                WHERE id = :id_pl_wait_weight
            `;
            const result = await conn.execute(sql, { id_pl_wait_weight }, { outFormat: oracledb_1.default.OUT_FORMAT_OBJECT });
            if (result.rows && result.rows.length > 0) {
                return result.rows[0];
            }
            return null;
        }
        catch (error) {
            console.error("❌ เกิดข้อผิดพลาดใน Model [GetWaitWeighingInfoById]:", error);
            throw error;
        }
        finally {
            if (conn)
                await conn.close();
        }
    }
    static async InsertPD_ROLL(data) {
        let conn;
        try {
            conn = await (0, database_1.getConnection)();
            let roll_no = await WeighingModel.getMaxRollNo(); // 🎯 ดึง roll_no ล่าสุด +1
            const insertPDQuery = `
                INSERT INTO PD_ROLL (
                    ID,
                    CREATE_DATE,
                    CREATE_STAFF,
                    PART,
                    ROLL_FROM,
                    PL_ORDER_ID,
                    PL_PRODUCTION_LINE_ID,
                    QC_REEL_ID,
                    ROLL_NO,
                    ROLL_NO_REF,
                    ROLL_BARCODE,
                    ROLL_DATE,
                    GRADE_ID,
                    P_SIZE_ID,
                    MODEL,
                    WEIGHT,
                    DIAMETER,
                    STATUS,
                    STOCK_STATUS,
                    REMARKS,
                    PL_ORDER_DETAIL_ID,
                    RETURN_OLD_ROLL,
                    R_ROLL,
                    HOLD_CAUSE,
                    SPLIT_SET_ID
                )
                SELECT
                    sq_pd_roll.nextval,
                    SYSDATE,                                    -- CREATE_DATE
                    NVL(:staffId, 1),                           -- CREATE_STAFF
                    :part,                                      -- PART
                    'จากการตัด Split',                           -- ROLL_FROM
                    v.pl_order_id,                              -- PL_ORDER_ID
                    v.pl_production_line_id,                    -- PL_PRODUCTION_LINE_ID
                    NVL(:qc_reel_id, 0),                        -- QC_REEL_ID
                    :roll_no,                                   -- ROLL_NO
                    :roll_no,                                   -- ROLL_NO
                    :roll_no,                                   -- ROLL_BARCODE
                    SYSDATE,                                    -- ROLL_DATE
                    v.grade_id,                                 -- GRADE_ID
                    v.size_id,                                  -- P_SIZE_ID
                    v.model,                                    -- MODEL
                    :weigh,                                     -- WEIGHT
                    NVL(:diameter, 0),                         -- DIAMETER
                    :status,                                    -- STATUS
                    'No',                                       -- STOCK_STATUS
                    :remark,                                    -- REMARKS
                    v.pl_order_detail_id,                       -- PL_ORDER_DETAIL_ID
                    'N',                                        -- RETURN_OLD_ROLL
                    :roll,                                      -- R_ROLL
                    :hold_cause,                                -- HOLD_CAUSE
                    v.split_set_id                              -- split_set_id
                FROM pl_wait_weighing_view v
                WHERE v.id = :id_pl_wait_weight
            `;
            const bindVars = {
                id_pl_wait_weight: data.id_pl_wait_weight,
                weigh: data.weigh,
                status: data.status || "PASS",
                remark: data.remark || null,
                staffId: data.staffId || 1,
                part: WeighingModel.getCurrentShift(),
                roll_no: roll_no,
                roll_no_ref: roll_no,
                roll_no_barcode: roll_no,
                qc_reel_id: data.qc_reel_id || 0,
                roll: data.roll,
                diameter: data.diameter || null,
                hold_cause: data.hold_cause || null,
            };
            const result = await conn.execute(insertPDQuery, bindVars, { autoCommit: false });
            const isSuccess = result.rowsAffected && result.rowsAffected > 0;
            if (isSuccess) {
                // 🎯 2. ดึง MAX(ID) โดยกรองตรงจาก pl_order_id ที่ส่งเข้ามาได้เลย!
                const getMaxIdSql = `
                    SELECT MAX(ID) AS NEW_ID 
                    FROM PD_ROLL 
                    WHERE PL_ORDER_ID = :pl_order_id
                `;
                const maxIdResult = await conn.execute(getMaxIdSql, { pl_order_id: data.pl_order_id }, { outFormat: oracledb_1.default.OUT_FORMAT_OBJECT });
                const newId = maxIdResult.rows[0]?.NEW_ID;
                await conn.commit();
                // 🎯 Return เป็น Object กลับไปใช้งานต่อ
                return {
                    id: newId,
                    roll_no: roll_no,
                };
            }
            else {
                await conn.rollback();
                return null;
            }
        }
        catch (error) {
            if (conn)
                await conn.rollback();
            console.error("❌ เกิดข้อผิดพลาดใน Model [InsertPD_ROLL]:", error);
            throw error;
        }
        finally {
            if (conn)
                await conn.close();
        }
    }
    static async InsertPD_ROLL_QUALITY(data) {
        let conn;
        try {
            conn = await (0, database_1.getConnection)();
            let result;
            const formattedStaffId = data.staffId ? Number(data.staffId) : -1;
            console.log("qcReelQualityId:", data.qcReelQualityId);
            if (data.qcReelQualityId) {
                // 🟢 CASE A: มี qc_reel_quality_id -> ดึงค่าวัดจาก qc_reel_quality มา Insert พร้อมบันทึก CREATE_STAFF
                const insertFromQcSql = `
                    INSERT INTO PD_ROLL_QUALITY (
                        ID,
                        CREATE_DATE,
                        CREATE_STAFF,
                        PD_ROLL_ID,
                        BASIS_WEIGHT,
                        BURSTING_STRENGTH,
                        RING_CRUSH,
                        CONCORA,
                        THICKNESS,
                        COBB,
                        MOISTURE_CONTENT,
                        CIE_LAB_L,
                        CIE_LAB_A,
                        CIE_LAB_B,
                        BOTTOM_SIDE,
                        INKJET,
                        REMARKS
                    )
                    SELECT 
                        SQ_PD_ROLL_QUALITY.NEXTVAL,
                        SYSDATE,
                        :staffId,
                        :pd_roll_id,
                        q.BASIS_WEIGHT,
                        q.BURSTING_STRENGHT,
                        q.RING_CRUSH,
                        q.CONCORA,
                        q.THICKNESS,
                        q.COBB,
                        q.MOISTURE_CONTENT,
                        q.CIE_LAB_L,
                        q.CIE_LAB_A,
                        q.CIE_LAB_B,
                        q.BOTTOM_SIDE,
                        q.INKJET,
                        q.REMARKS
                    FROM qc_reel_quality q
                    WHERE q.id = :qcReelQualityId
                `;
                result = await conn.execute(insertFromQcSql, {
                    pd_roll_id: data.pd_roll_id,
                    qcReelQualityId: data.qcReelQualityId,
                    staffId: formattedStaffId
                }, { autoCommit: false });
                // เผื่อเคสมี qc_reel_quality_id ใน View แต่ไม่มีเรคคอร์ดใน qc_reel_quality จริงๆ
                if (result.rowsAffected === 0) {
                    result = await this.InsertDefaultNull(conn, data.pd_roll_id, formattedStaffId);
                }
            }
            else {
                // 🔴 CASE B: ไม่มี qc_reel_quality_id -> ยัด NULL ลงไปตรงๆ
                result = await this.InsertDefaultNull(conn, data.pd_roll_id, formattedStaffId);
            }
            const isSuccess = result.rowsAffected && result.rowsAffected > 0;
            if (isSuccess) {
                await conn.commit();
                return true;
            }
            else {
                await conn.rollback();
                return false;
            }
        }
        catch (error) {
            if (conn)
                await conn.rollback();
            console.error("❌ เกิดข้อผิดพลาดใน Model [InsertPD_ROLL_QUALITY]:", error);
            throw error;
        }
        finally {
            if (conn)
                await conn.close();
        }
    }
    // 🎯 Helper function ย่อยสำหรับยัดค่า NULL / Default พร้อมส่ง staffId
    static async InsertDefaultNull(conn, pd_roll_id, staffId = -1) {
        const formattedStaffId = staffId ? Number(staffId) : -1;
        const insertNullSql = `
            INSERT INTO PD_ROLL_QUALITY (
                ID, CREATE_DATE, CREATE_STAFF, PD_ROLL_ID,
                BASIS_WEIGHT, BURSTING_STRENGTH, RING_CRUSH, CONCORA, THICKNESS,
                COBB, MOISTURE_CONTENT, CIE_LAB_L, CIE_LAB_A, CIE_LAB_B,
                BOTTOM_SIDE, INKJET, REMARKS
            ) VALUES (
                SQ_PD_ROLL_QUALITY.NEXTVAL, SYSDATE, :staffId, :pd_roll_id,
                NULL, NULL, NULL, NULL, NULL,
                NULL, NULL, NULL, NULL, NULL,
                NULL, NULL, NULL
            )
        `;
        return await conn.execute(insertNullSql, {
            pd_roll_id,
            staffId: formattedStaffId
        }, { autoCommit: false });
    }
}
exports.WeighingModel = WeighingModel;
