// 📦 โครงสร้างข้อมูลใบรับน้ำหนักลูกกระดาษ
import { getConnection } from "../../database";
import oracledb from "oracledb";

export interface WeighingRecord {
    roll_no: string;
    grade: string;
    version: string; // รุ่น
    size: string;
    weight: number;
    status: "PASS" | "HOLD";
    remark: string;
}

// 💾 คลังข้อมูลจำลองประวัติการชั่งน้ำหนักในแรม (In-Memory)

export class WeighingModel {
    // ดึงประวัติที่ชั่งน้ำหนักแล้วทั้งหมดมารายงานผล
    static async getNextWeighing(
        productionLineId?: string | number | null, 
        search: string | null = null, 
        type: string | null = null, 
        roll_no: string | null = null,
        startDate: string | null = null,
        endDate: string | null = null
    ): Promise<any> {
        let conn;

        try {
            conn = await getConnection();

            // 🎯 1. ดึงรายการ remark ย้อนหลัง 3 เดือนจาก pd_roll
            let remarksList: string[] = [];
            let holdCauseList: string[] = [];
            if(type != "history") {
                const remarkSql = `
                    SELECT REMARKS 
                    FROM pd_roll 
                    WHERE create_date >= ADD_MONTHS(SYSDATE, -1)
                    AND TRIM(REMARKS) IS NOT NULL
                    GROUP BY REMARKS
                    ORDER BY REMARKS ASC
                `;
                const remarkResult = await conn.execute(remarkSql, {}, {
                    outFormat: oracledb.OUT_FORMAT_OBJECT,
                });
                remarksList = (remarkResult.rows as any[])?.map(r => r.REMARKS) || [];

                // 🎯 2. ดึงรายการ hold_cause ย้อนหลัง 3 เดือนจาก pd_roll
                const holdCauseSql = `
                    SELECT DISTINCT hold_cause 
                    FROM pd_roll 
                    WHERE create_date >= ADD_MONTHS(SYSDATE, -1)
                    AND hold_cause IS NOT NULL 
                    AND TRIM(hold_cause) IS NOT NULL
                    ORDER BY hold_cause ASC
                `;
                const holdCauseResult = await conn.execute(holdCauseSql, {}, {
                    outFormat: oracledb.OUT_FORMAT_OBJECT,
                });
                 holdCauseList = (holdCauseResult.rows as any[])?.map(r => r.HOLD_CAUSE) || [];
            }
            

            // 🎯 3. Query หลัก (ตามเดิม)
            let baseSql = `
                SELECT 
                    id                  AS "id",
                    pl_order_id         AS "orderId",
                    pl_order_detail_id AS "orderDetailId",
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
                    part_date           AS "part_date",
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

            let whereClause = ``;
            const binds: any = {};

            // 1. เงื่อนไข Status
            if (!type) {
                whereClause += ` AND status IS NULL`;
            } else {
                whereClause += ` AND status IS NOT NULL`;
            }

            // 2. เงื่อนไข Line การผลิต
            if (productionLineId) {
                whereClause += ` AND pl_production_line_id = :productionLineId`;
                binds.productionLineId = productionLineId;
            }

            // 3. เงื่อนไขค้นหา
            const isSearchMode = search && search.trim() !== "";
            if (isSearchMode) {
                whereClause += ` AND UPPER(order_no) LIKE :search`;
                binds.search = `%${search.trim().toUpperCase()}%`;
            }

            const rollSearchMode = roll_no && roll_no.trim() !== "";
            if (rollSearchMode) {
                whereClause += ` AND UPPER(roll_no) LIKE :roll_no`;
                binds.roll_no = `%${roll_no.trim().toUpperCase()}%`;
            }

            // 4. เงื่อนไขวันที่
            if (startDate && startDate.trim() !== '') {
                whereClause += ` AND TRUNC(finish_at) >= TO_DATE(:startDate, 'DD/MM/YYYY')`;
                binds.startDate = startDate.trim();
            }

            if (endDate && endDate.trim() !== '') {
                whereClause += ` AND TRUNC(finish_at) <= TO_DATE(:endDate, 'DD/MM/YYYY')`;
                binds.endDate = endDate.trim();
            }

            // 5. เงื่อนไข ORDER BY
            let orderByClause = ``;
            if (type === "history") {
                whereClause += ` AND roll_no IS NOT NULL`;
                orderByClause = ` ORDER BY roll_no DESC`;
            } else {
                if (productionLineId == 162) { // PM2
                    orderByClause = ` ORDER BY queue_no ASC NULLS LAST, split_set_id ASC, roll DESC`;
                } else { // PM1
                    orderByClause = ` ORDER BY queue_no ASC NULLS LAST, split_set_id ASC, roll ASC`;
                }
            }

            // 6. ประกอบ SQL (หุ้ม Subquery สำหรับกรณีที่ต้องการดึงเฉพาะแถวแรก)
            let sql = ``;
            const isSingleRowMode = !isSearchMode && !type;

            if (isSingleRowMode) {
                // หุ้ม Subquery เพื่อให้ Order By ทำงานให้เสร็จก่อนตัด ROWNUM <= 1
                sql = `SELECT * FROM (
                    ${baseSql} ${whereClause} ${orderByClause}
                ) WHERE ROWNUM <= 1`;
            } else {
                sql = `${baseSql} ${whereClause} ${orderByClause}`;
            }

            console.log(sql)
            

            // console.log("SQL Query:", sql);
            const result = await conn.execute(sql, binds, {
                outFormat: oracledb.OUT_FORMAT_OBJECT,
            });

            const rows: any[] = result.rows || [];

            // 🎯 Helper Function สำหรับแปลงข้อมูล + ยัด List เข้าไป
            const processRowData = (row: any) => {
                if (!row) return row;

                if (row.createdAt) {
                    const dateObj = row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt);
                    if (!isNaN(dateObj.getTime())) {
                        row.createdAt = dateObj.toLocaleDateString("en-GB", {
                            timeZone: "Asia/Bangkok",
                        });
                    }
                }

                if (row.part_date) {
                    const dateObj = row.part_date instanceof Date ? row.part_date : new Date(row.part_date);
                    if (!isNaN(dateObj.getTime())) {
                        row.part_date = dateObj.toLocaleDateString("en-GB", {
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
            } else {
                return rows.length > 0 ? processRowData(rows[0]) : null;
            }

        } catch (error) {
            // console.error("❌ เกิดข้อผิดพลาดใน Model [getNextWeighing]:", error);
            throw error;
        } finally {
            if (conn) {
                try {
                    await conn.close();
                } catch (closeErr) {
                    // console.error("⚠️ ไม่สามารถปิด DB Connection ได้:", closeErr);
                }
            }
        }
    }

    static async updateWeighingResult(
        data: { 
            id: number | string; 
            weigh: number; 
            status: string; 
            remark: string | null;
            model: string | null;
            staffId?: number | string | null; // 🎯 รับ staffId ผ่าน object data
        }, 
        roll_no: string,
        staffId?: number | string | null // 🎯 หรือรับผ่านพารามิเตอร์แยก
    ): Promise<boolean> {
        let conn;
        try {
            conn = await getConnection();
            const currentStaffId = data.staffId || staffId;
            const formattedStaffId = currentStaffId ? Number(currentStaffId) : null;

            // 🔍 STEP 1: SELECT หา pl_order_detail_id และ split_set_id จาก pl_wait_weighing
            const checkSql = `
                SELECT pl_order_detail_id, split_set_id 
                FROM pl_wait_weighing 
                WHERE id = :id
            `;
            const checkResult: any = await conn.execute(checkSql, { id: data.id }, { outFormat: oracledb.OUT_FORMAT_OBJECT });

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
                    model = :model,
                    status = :status,
                    remark = :remark,
                    part = :part,
                    roll_no = :roll_no,
                    update_staff = :staffId,
                    update_date = SYSDATE
                WHERE id = :id
            `;

            const result = await conn.execute(
                updateWeighSql,
                {
                    weigh: data.weigh,
                    status: data.status,
                    remark: data.remark,
                    model: data.model,
                    part: WeighingModel.getCurrentShift(),
                    roll_no: roll_no,
                    staffId: formattedStaffId,
                    id: data.id,
                },
                { autoCommit: false }
            );

            const isSuccess: any = result.rowsAffected && result.rowsAffected > 0;

            if (isSuccess && orderDetailId) {
                // 🎯 STEP 3: อัปเดตจำนวนลูกย่อยสะสม COMPLETED_ROLL_QTY + 1 พร้อมบันทึกผู้แก้ไข
                const updateRollQtySql = `
                    UPDATE pl_order_detail
                    SET completed_roll_qty = NVL(completed_roll_qty, 0) + 1,
                        update_staff = :staffId,
                        update_date = SYSDATE
                    WHERE id = :orderDetailId
                `;
                await conn.execute(
                    updateRollQtySql, 
                    { orderDetailId, staffId: formattedStaffId }, 
                    { autoCommit: false }
                );

                // 🎯 STEP 4: เช็กว่าใน split_set_id นี้ มีลูกย่อยที่ยังชั่งไม่เสร็จเหลืออยู่อีกไหม?
                if (splitSetId) {
                    const checkRemainingSql = `
                        SELECT COUNT(*) AS REMAINING_COUNT
                        FROM pl_wait_weighing
                        WHERE split_set_id = :splitSetId
                        AND status IS NULL
                    `;
                    const remainResult: any = await conn.execute(checkRemainingSql, { splitSetId }, { outFormat: oracledb.OUT_FORMAT_OBJECT });
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
                        await conn.execute(
                            updateSetQtySql, 
                            { orderDetailId, staffId: formattedStaffId }, 
                            { autoCommit: false }
                        );
                    }
                }

                // 🔒 Commit ธุรกรรมทั้งหมดพร้อมกันแบบ Atomic Transaction
                await conn.commit();
            } else {
                await conn.rollback();
            }

            return isSuccess;
        } catch (error) {
            if (conn) await conn.rollback();
            // console.error("❌ เกิดข้อผิดพลาดใน Model [updateWeighingResult]:", error);
            throw error;
        } finally {
            if (conn) await conn.close();
        }
    }

    static async CheckResetSplitSet(id: number): Promise<any | null> {
        let conn;

        try {
            conn = await getConnection();

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
            const result = await conn.execute(
                sqlSelect,
                { id },
                {
                    outFormat: oracledb.OUT_FORMAT_OBJECT,
                },
            );

            // 2. ถ้าเจอข้อมูล (มีการชั่งน้ำหนักแล้ว) ให้ส่งออก false ทันที
            if (result.rows && result.rows.length > 0) {
                // console.log("reset ไม่ได้เจอข้อมูล");
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
        } catch (error) {
            // console.error("❌ เกิดข้อผิดพลาดใน Model [CheckResetSplitSet]:", error);
            throw error;
        } finally {
            if (conn) {
                try {
                    await conn.close();
                } catch (closeErr) {
                    // console.error("⚠️ ไม่สามารถปิด DB Connection ได้:", closeErr);
                }
            }
        }
    }
    
    static getCurrentShift = (dateObj: Date = new Date()): string => {
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

    static async GetWaitWeighingInfoById(id_pl_wait_weight: number | string): Promise<any | null> {
        let conn;
        try {
            conn = await getConnection();
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
            const result: any = await conn.execute(sql, { id_pl_wait_weight }, { outFormat: oracledb.OUT_FORMAT_OBJECT });

            if (result.rows && result.rows.length > 0) {
                return result.rows[0];
            }
            return null;
        } catch (error) {
            // console.error("❌ เกิดข้อผิดพลาดใน Model [GetWaitWeighingInfoById]:", error);
            throw error;
        } finally {
            if (conn) await conn.close();
        }
    }

    static async getMaxRollNo(productionLineId: number): Promise<string> {
    let conn;
    try {
        conn = await getConnection();

        let prefixFilter = '';
        let defaultStartNo = 1;

        if (Number(productionLineId) === 161) {
            // 🎯 กรองเฉพาะขึ้นต้นด้วย 1, มีความยาว 9 หลัก และเป็นตัวเลขล้วนเท่านั้น
            prefixFilter = "AND roll_no LIKE '1%' AND LENGTH(roll_no) = 9";
            defaultStartNo = 100000001; // ค่าเริ่มต้น 9 หลักสำหรับสาย 161
        } else if (Number(productionLineId) === 162) {
            // 🎯 กรองเฉพาะขึ้นต้นด้วย 2, มีความยาว 9 หลัก และเป็นตัวเลขล้วนเท่านั้น
            prefixFilter = "AND roll_no LIKE '2%' AND LENGTH(roll_no) = 9";
            defaultStartNo = 200000001; // ค่าเริ่มต้น 9 หลักสำหรับสาย 162
        }

        const sql = `
            SELECT NVL(
                MAX(TO_NUMBER(CASE WHEN REGEXP_LIKE(roll_no, '^[0-9]+$') THEN roll_no END)), 
                ${defaultStartNo - 1}
            ) + 1 AS NEXT_ROLL_NO
            FROM PD_ROLL
            WHERE 1=1 ${prefixFilter}
        `;

        const result: any = await conn.execute(sql, [], {
            outFormat: oracledb.OUT_FORMAT_OBJECT,
        });

        const nextRoll = result.rows[0]?.NEXT_ROLL_NO;
        return String(nextRoll || defaultStartNo);

    } catch (error) {
        console.error("❌ เกิดข้อผิดพลาดใน Model [getMaxRollNo]:", error);
        if (Number(productionLineId) === 161) return "";
        if (Number(productionLineId) === 162) return "";
        return "1";
    } finally {
        if (conn) await conn.close();
    }
}

    static async InsertPD_ROLL(data: {
        id_pl_wait_weight: number | string;
        weigh: number;
        status: string;
        remark: string | null;
        pl_order_id: number | string;
        staffId?: number | string;
        qc_reel_id: number | string;
        roll: string;
        diameter: string | null;
        hold_cause: string | null;
        createdAt: string;
        model: string;
        productionLineId: number
    }): Promise<{ id?: number; roll_no?: string ; status?: any; message?: any;} | null> {
        let conn;
        try {
            conn = await getConnection();

            // 🟢 1. ดึงข้อมูลอ้างอิงจาก pl_wait_weighing_view เพื่อเอา SPLIT_SET_ID และ PL_ORDER_DETAIL_ID
            const checkViewQuery = `
                SELECT v.split_set_id, v.pl_order_detail_id 
                FROM pl_wait_weighing_view v 
                WHERE v.id = :id_pl_wait_weight
            `;
            const viewRes: any = await conn.execute(
                checkViewQuery, 
                { id_pl_wait_weight: data.id_pl_wait_weight }, 
                { outFormat: oracledb.OUT_FORMAT_OBJECT }
            );
            
            if (!viewRes.rows || viewRes.rows.length === 0) {
                console.warn(`⚠️ ไม่พบข้อมูลใน pl_wait_weighing_view สำหรับ ID: ${data.id_pl_wait_weight}`);
                return null;
            }

            const waitData = viewRes.rows[0];

            // 🟢 2. เช็กซ้ำใน PD_ROLL ด้วย 3 คีย์: SPLIT_SET_ID, R_ROLL, PL_ORDER_DETAIL_ID
            const duplicateCheckQuery = `
                SELECT ID, ROLL_NO 
                FROM PD_ROLL 
                WHERE SPLIT_SET_ID = :split_set_id 
                AND R_ROLL = :roll 
                AND PL_ORDER_DETAIL_ID = :pl_order_detail_id
                AND ROWNUM = 1
            `;
            
            const dupRes: any = await conn.execute(
                duplicateCheckQuery, 
                { 
                    split_set_id: waitData.SPLIT_SET_ID, 
                    roll: data.roll,
                    pl_order_detail_id: waitData.PL_ORDER_DETAIL_ID
                }, 
                { outFormat: oracledb.OUT_FORMAT_OBJECT }
            );

            // 🛑 ถ้าพบข้อมูลซ้ำ ให้คืนค่าเดิมกลับทันที ไม่ทำการ Insert
            if (dupRes.rows && dupRes.rows.length > 0) {
                console.warn(`⚠️ ข้อมูลซ้ำ! มีใน PD_ROLL แล้ว (ID: ${dupRes.rows[0].ID}, ROLL_NO: ${dupRes.rows[0].ROLL_NO})`);
                return {
                    status:false,
                    message:"ไม่สามารถบันทึกซ้ำได้ ข้อมูลซ้ำ! มีใน PD_ROLL แล้ว"
                };
            }

            // 🟢 3. ดึง ID ล่าสุดจาก Sequence
            const seqResult: any = await conn.execute(
                `SELECT sq_pd_roll.nextval AS NEW_ID FROM DUAL`,
                [],
                { outFormat: oracledb.OUT_FORMAT_OBJECT }
            );
            const newPdRollId = seqResult.rows[0]?.NEW_ID;

            // 🟢 4. ดึง roll_no
            let roll_no = await WeighingModel.getMaxRollNo(data.productionLineId);
            if (!roll_no || String(roll_no).trim() === '') {
                console.error("❌ ไม่สามารถสร้างเลข Roll No ได้เนื่องจากข้อผิดพลาดใน Model");
                return null; 
            }

            // 🟢 5. บันทึกข้อมูลลง PD_ROLL
            const insertPDQuery = `
                INSERT INTO PD_ROLL (
                    ID, CREATE_DATE, CREATE_STAFF, PART, ROLL_FROM,
                    PL_ORDER_ID, PL_PRODUCTION_LINE_ID, QC_REEL_ID, ROLL_NO, ROLL_BARCODE,
                    ROLL_DATE, GRADE_ID, P_SIZE_ID, MODEL, WEIGHT,
                    DIAMETER, STATUS, STOCK_STATUS, REMARKS, PL_ORDER_DETAIL_ID,
                    RETURN_OLD_ROLL, R_ROLL, HOLD_CAUSE, PART_DATE, SPLIT_SET_ID, vat_type
                )
                SELECT
                    :newPdRollId, SYSDATE, :staffId, :part, 'จากการผลิต',
                    v.pl_order_id, v.pl_production_line_id, NVL(:qc_reel_id, 0), :roll_no, :roll_no_barcode,
                    SYSDATE, v.grade_id, v.size_id, :model, :weigh,
                    NVL(:diameter, 0), :status, 'No', :remark, v.pl_order_detail_id,
                    'N', :roll, :hold_cause, v.part_date, v.split_set_id,
                    DECODE(v.k, 'N', 'VAT', 'NOVAT')
                FROM pl_wait_weighing_view v
                WHERE v.id = :id_pl_wait_weight
            `;

            const bindVars: any = {
                newPdRollId: newPdRollId,
                id_pl_wait_weight: data.id_pl_wait_weight,
                weigh: data.weigh,
                status: data.status || "PASS",
                remark: data.remark || null,
                staffId: data.staffId,
                part: WeighingModel.getCurrentShift(),
                roll_no: roll_no,
                roll_no_barcode: roll_no,
                qc_reel_id: data.qc_reel_id || 0,
                roll: data.roll,
                diameter: data.diameter || null,
                model: data.model,
                hold_cause: data.hold_cause || null,
            };

            const result: any = await conn.execute(insertPDQuery, bindVars, { autoCommit: false });

            if (result.rowsAffected && result.rowsAffected > 0) {
                await conn.commit();
                return {
                    status:true,
                    message:"success",
                    id: newPdRollId,
                    roll_no: roll_no,
                };
            } else {
                await conn.rollback();
                return null;
            }
        } catch (error) {
            if (conn) await conn.rollback();
            throw error;
        } finally {
            if (conn) await conn.close();
        }
    }

    static async InsertPD_ROLL_QUALITY(data: {
        id_pl_wait_weight: number | string;
        pd_roll_id: number | string;
        staffId?: number | string;
        qcReelQualityId: number | string;
    }): Promise<boolean> {
        let conn;
        try {
            conn = await getConnection();
            let result;
            const formattedStaffId:any = data.staffId;

            // console.log("qcReelQualityId:", data.qcReelQualityId);
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

                result = await conn.execute(
                    insertFromQcSql, 
                    { 
                        pd_roll_id: data.pd_roll_id, 
                        qcReelQualityId: data.qcReelQualityId,
                        staffId: formattedStaffId
                    }, 
                    { autoCommit: false }
                );

                // เผื่อเคสมี qc_reel_quality_id ใน View แต่ไม่มีเรคคอร์ดใน qc_reel_quality จริงๆ
                if (result.rowsAffected === 0) {
                    result = await this.InsertDefaultNull(conn, data.pd_roll_id, formattedStaffId);
                }
            } else {
                // 🔴 CASE B: ไม่มี qc_reel_quality_id -> ยัด NULL ลงไปตรงๆ
                result = await this.InsertDefaultNull(conn, data.pd_roll_id, formattedStaffId);
            }

            const isSuccess = result.rowsAffected && result.rowsAffected > 0;

            if (isSuccess) {
                await conn.commit();
                return true;
            } else {
                await conn.rollback();
                return false;
            }
        } catch (error) {
            if (conn) await conn.rollback();
            // console.error("❌ เกิดข้อผิดพลาดใน Model [InsertPD_ROLL_QUALITY]:", error);
            throw error;
        } finally {
            if (conn) await conn.close();
        }
    }

    // 🎯 Helper function ย่อยสำหรับยัดค่า NULL / Default พร้อมส่ง staffId
    private static async InsertDefaultNull(conn: any, pd_roll_id: number | string, staffId: number | string | null): Promise<any> {
        const formattedStaffId = staffId;
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
        return await conn.execute(
            insertNullSql, 
            { 
                pd_roll_id, 
                staffId: formattedStaffId 
            }, 
            { autoCommit: false }
        );
    }
}
