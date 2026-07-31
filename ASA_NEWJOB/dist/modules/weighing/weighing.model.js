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
    static async getNextWeighing(productionLineId, search = null, type = null, roll_no = null) {
        let conn;
        try {
            conn = await (0, database_1.getConnection)();
            // 🎯 1. Query ดึงคิว
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
                sql += ` AND  (status IS NULL OR TRIM(status) = '')`;
            }
            else {
                sql += ` AND status IS NOT NULL`;
            }
            const binds = {};
            // 🔍 2. เช็กและกรองตาม ID เครื่อง (pl_production_line_id)
            if (productionLineId) {
                sql += ` AND pl_production_line_id = :productionLineId`;
                binds.productionLineId = productionLineId;
            }
            const isSearchMode = search && search.trim() !== "";
            // 🔍 3. เช็ก search parameter และต่อเงื่อนไข LIKE order_no
            if (isSearchMode) {
                sql += ` AND UPPER(order_no) LIKE :search`;
                binds.search = `%${search.trim().toUpperCase()}%`;
            }
            const rollSearchMode = roll_no && roll_no.trim() !== "";
            // 🔍 3. เช็ก search parameter และต่อเงื่อนไข LIKE roll_no
            if (rollSearchMode) {
                sql += ` AND UPPER(roll_no) LIKE :roll_no`;
                binds.roll_no = `%${roll_no.trim().toUpperCase()}%`;
            }
            // 🎯 4. จัดเรียงคิว
            sql += ` ORDER BY queue_no ASC NULLS LAST, set_no ASC, roll DESC`;
            // ถ้าไม่ได้ค้นหา ให้จำกัดเอาแค่ 1 รายการของเครื่องนั้นๆ
            if (!isSearchMode && !type) {
                sql += ` FETCH FIRST 1 ROWS ONLY`;
            }
            console.log("SQL Query:", sql);
            const result = await conn.execute(sql, binds, {
                outFormat: oracledb_1.default.OUT_FORMAT_OBJECT,
            });
            const rows = result.rows || [];
            // 🎯 Helper Function สำหรับแปลงวันที่ + คำนวณ remaining
            const processRowData = (row) => {
                if (!row)
                    return row;
                // 📅 1. จัด Format วันที่
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
                // 🧮 2. คำนวณ remaining = total - alreadyDone
                const total = Number(row.total || 0);
                const alreadyDone = Number(row.alreadyDone || 0);
                // ป้องกันติดลบ (ถ้ามี) ให้สลับเป็น 0 ต่ำสุด
                row.remaining = Math.max(0, total - alreadyDone);
                return row;
            };
            // 🎯 5. เงื่อนไขการ Return ข้อมูล
            if (isSearchMode || type === 'history') {
                // 🟢 กรณีมี ค้นหา (search): แปลงข้อมูลทุกแถว แล้ว Return เป็น Array
                return rows.map((row) => processRowData(row));
            }
            else {
                // 🟢 กรณีไม่ได้ค้นหา: แปลงข้อมูลเฉพาะแถวแรก แล้ว Return เป็น Object (หรือ null)
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
    static async updateWeighingResult(data, roll_no) {
        let conn;
        try {
            conn = await (0, database_1.getConnection)();
            const sql = `
                UPDATE pl_wait_weighing
                SET 
                    weigh = :weigh,
                    status = :status,
                    remark = :remark,
                    part = :part,
                    roll_no = :roll_no
                WHERE id = :id
            `;
            const result = await conn.execute(sql, {
                weigh: data.weigh,
                status: data.status,
                remark: data.remark,
                part: WeighingModel.getCurrentShift(), // ดึงกะการทำงานปัจจุบัน
                roll_no: roll_no,
                id: data.id,
            }, { autoCommit: false });
            const isSuccess = result.rowsAffected && result.rowsAffected > 0 ? true : false;
            // 🎯 บันทึกผลลง Database ถาวรเมื่อ Update สำเร็จ
            if (isSuccess) {
                await conn.commit();
            }
            else {
                await conn.rollback();
            }
            return isSuccess;
        }
        catch (error) {
            // 🎯 ถ้ามี Error ให้ Rollback ทันที
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
                outFormat: oracledb_1.default.OUT_FORMAT_OBJECT,
            });
            // 2. ถ้าเจอข้อมูล ให้ส่งออกแถวแรกทันที
            if (result.rows && result.rows.length > 0) {
                console.log("reset ไม่ได้เจอข้อมูล");
                return false;
            }
            console.log(result);
            // 3. 🚨 ถ้าไม่เจอข้อมูล (แสดงว่าไม่มีม้วนไหนที่มีค่าน้ำหนักเลย) ให้สั่งลบข้อมูลใน PL_WAIT_WEIGHING ทั้งหมดของ split_set_id นี้
            const sqlDelete = `
                DELETE FROM pl_wait_weighing
                WHERE split_set_id = :id
            `;
            await conn.execute(sqlDelete, { id });
            // 💡 อย่าลืม commit หากฟังก์ชันนี้จัดการ transaction เอง
            await conn.commit();
            return true;
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
    static async getMaxRollNo() {
        let conn;
        try {
            conn = await (0, database_1.getConnection)();
            // 🎯 ดึง roll_no ทั้งหมด หรือดึงเฉพาะอันที่เป็นตัวเลขมาหาค่าสูงสุด
            const sql = `
                SELECT roll_no 
                FROM PD_ROLL 
                WHERE roll_no IS NOT NULL 
                AND REGEXP_LIKE(roll_no, '^[0-9]+$')
                ORDER BY TO_NUMBER(roll_no) DESC
                FETCH FIRST 1 ROWS ONLY
            `;
            const result = await conn.execute(sql, [], {
                outFormat: oracledb_1.default.OUT_FORMAT_OBJECT
            });
            const rows = result.rows || [];
            if (rows.length > 0 && rows[0].ROLL_NO) {
                const currentMax = parseInt(rows[0].ROLL_NO, 10);
                return String(currentMax + 1); // 🎯 ดึงได้ปุ๊บ +1 แล้วแปลงกลับเป็น String
            }
            // 🎯 ถ้าตารางยังไม่มีข้อมูล ให้เริ่มที่ '1' (หรือเลขเริ่มต้นของโรงงาน เช่น '100001')
            return '1';
        }
        catch (error) {
            console.error("❌ เกิดข้อผิดพลาดใน Model [getMaxRollNo]:", error);
            // Fallback ป้องกันระบบล่ม
            return '1';
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
            return 'เช้า'; // หรือใส่ 'กะเช้า' ตามที่ DB ต้องการ
        }
        // 🎯 2. ช่วงเวลา 16:00 ถึง 23:59 (16 ถึง 23) -> กะบ่าย
        if (currentHour >= 16 && currentHour < 24) {
            return 'บ่าย'; // หรือใส่ 'กะบ่าย'
        }
        // 🎯 3. ช่วงเวลา 00:00 ถึง 07:59 (0 ถึง 7) -> กะดึก
        return 'ดึก'; // หรือใส่ 'กะดึก'
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
                    CREATE_DATE,
                    CREATE_STAFF,
                    PART,
                    ROLL_FROM,
                    PL_ORDER_ID,
                    PL_PRODUCTION_LINE_ID,
                    QC_REEL_ID,
                    ROLL_NO,
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
                    R_ROLL
                )
                SELECT 
                    SYSDATE,                                    -- CREATE_DATE
                    NVL(:staffId, 1),                           -- CREATE_STAFF
                    :part,                                      -- PART
                    'จากการตัด Split',                           -- ROLL_FROM
                    v.pl_order_id,                              -- PL_ORDER_ID
                    v.pl_production_line_id,                    -- PL_PRODUCTION_LINE_ID
                    NVL(:qc_reel_id, 0),                        -- QC_REEL_ID
                    :roll_no,                                   -- ROLL_NO
                    :roll_no,                                   -- ROLL_BARCODE
                    SYSDATE,                                    -- ROLL_DATE
                    v.grade_id,                                 -- GRADE_ID
                    v.size_id,                                  -- P_SIZE_ID
                    v.model,                                    -- MODEL
                    :weigh,                                     -- WEIGHT
                    NVL(v.diameter, 0),                         -- DIAMETER
                    :status,                                    -- STATUS
                    'No',                                       -- STOCK_STATUS
                    :remark,                                    -- REMARKS
                    v.pl_order_detail_id,                       -- PL_ORDER_DETAIL_ID
                    'N',                                        -- RETURN_OLD_ROLL
                    :roll                                       -- R_ROLL
                FROM pl_wait_weighing_view v
                WHERE v.id = :id_pl_wait_weight
            `;
            const bindVars = {
                id_pl_wait_weight: data.id_pl_wait_weight,
                weigh: data.weigh,
                status: data.status || 'PASS',
                remark: data.remark || null,
                staffId: data.staffId || 1,
                part: WeighingModel.getCurrentShift(),
                roll_no: roll_no,
                qc_reel_id: data.qc_reel_id || 0,
                roll: data.roll
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
                    roll_no: roll_no
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
            // 🎯 Step 2: เช็ก IF
            if (data.qcReelQualityId) {
                // 🟢 CASE A: มี qc_reel_quality_id -> ดึงค่าวัดจาก qc_reel_quality มา Insert
                const insertFromQcSql = `
                    INSERT INTO PD_ROLL_QUALITY (
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
                        SYSDATE,
                        -1,
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
                    WHERE q.id = :qcReelQualityId   -- 🎯 แก้ไข: เปลี่ยนจาก q.qc_reel_quality_id เป็น q.id (หรือ q.qc_reel_id ตามโครงสร้างจริง)
                `;
                result = await conn.execute(insertFromQcSql, { pd_roll_id: data.pd_roll_id, qcReelQualityId: data.qcReelQualityId }, { autoCommit: false });
                // เผื่อเคสมี qc_reel_quality_id ใน View แต่ไม่มีเรคคอร์ดใน qc_reel_quality จริงๆ
                if (result.rowsAffected === 0) {
                    result = await this.InsertDefaultNull(conn, data.pd_roll_id);
                }
            }
            else {
                // 🔴 CASE B: ไม่มี qc_reel_quality_id -> ยัด NULL ลงไปตรงๆ
                result = await this.InsertDefaultNull(conn, data.pd_roll_id);
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
    // 🎯 Helper function ย่อยสำหรับยัดค่า NULL / Default
    static async InsertDefaultNull(conn, pd_roll_id) {
        const insertNullSql = `
            INSERT INTO PD_ROLL_QUALITY (
                CREATE_DATE, CREATE_STAFF, PD_ROLL_ID,
                BASIS_WEIGHT, BURSTING_STRENGTH, RING_CRUSH, CONCORA, THICKNESS,
                COBB, MOISTURE_CONTENT, CIE_LAB_L, CIE_LAB_A, CIE_LAB_B,
                BOTTOM_SIDE, INKJET, REMARKS
            ) VALUES (
                SYSDATE, -1, :pd_roll_id,
                NULL, NULL, NULL, NULL, NULL,
                NULL, NULL, NULL, NULL, NULL,
                NULL, NULL, NULL
            )
        `;
        return await conn.execute(insertNullSql, { pd_roll_id }, { autoCommit: false });
    }
}
exports.WeighingModel = WeighingModel;
