// src/models/wait-cut.model.ts
import { getConnection } from '../../database';
import oracledb from 'oracledb';

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
    id: 1, priority_seq: 1, order_no: '0065/2026', item: 1, grade: 'KA185', set_qty: 6,
    blade: [1855, 1855, null, null], size: [72, 72, null, null],
    finish_date: 'xx/xx/xxx', finish_time: 'xx:xx:xx', total_rolls: 12, current_set: 6, status: 'รอส่งงาน' 
  },
  { 
    id: 2, priority_seq: 2, order_no: '0065/2026', item: 2, grade: 'KA185', set_qty: 12,
    blade: [1960, 1755, null, null], size: [76, 68, null, null],
    finish_date: 'xx/xx/xxx', finish_time: 'xx:xx:xx', total_rolls: 24, current_set: 12, status: 'HOLD' 
  },
  { 
    id: 3, priority_seq: 3, order_no: '0065/2026', item: 3, grade: 'KA185', set_qty: 57,
    blade: [2055, 1655, null, null], size: [80, 64, null, null],
    finish_date: 'xx/xx/xxx', finish_time: 'xx:xx:xx', total_rolls: 12, current_set: 6, status: 'เสร็จสิ้น' 
  }
];

export class WaitCutModel {
  

static async getAllWaitingAndWeighing(status: any = null , order_no:string = '0350/2026'): Promise<any[]> {
  let conn;
  try {
    conn = await getConnection();

    // 1. ระบุชื่อคอลัมน์ที่ต้องการจาก View ให้ชัดเจน (เจาะจง ไม่ใช้ *)
    const query = `
      SELECT 
        order_no, order_item, qty, status,
        grade_name_1, grade_name_2, grade_name_3, grade_name_4,
        blad1, blad2, blad3, blad4,
        size_1, size_2, size_3, size_4,
        finish_date, finish_time
      FROM pl_order_view
      WHERE order_no = '${order_no}'
    `;

    // 2. บังคับให้ผลลัพธ์ออกมาเป็น Array ของ Object เพื่อให้ใช้ Key ในการ Loop ได้
    const result = await conn.execute<any>(query, [], {
      outFormat: oracledb.OUT_FORMAT_OBJECT 
    });

    const dataList: any[] = [];
    let i = 0;
    if (result.rows) {
      for (const row of result.rows) {
        i++;
        // Now you can loop or access directly by KEY!
        // ย้ำ: Oracle จะแปลงชื่อคอลัมน์เป็นตัวพิมพ์ใหญ่ (Uppercase) เสมอในระดับฐานข้อมูล
        dataList.push({
          number:i,
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
          finishTime: row.FINISH_TIME
        });
      }
    }

    return dataList;
  } catch (error) {
    console.error('🔴 Model พลั้งพลาดตอนดึงข้อมูลเจาะจงคอลัมน์:', error);
    throw error;
  } finally {
    if (conn) {
      await conn.close();
    }
  }
}

    static async getAllOrders(): Promise<WaitCutRow[]> {
      let a:WaitCutRow[]  = await this.getAllWaitingAndWeighing();
      return a
    }

    static async moveOrderUp(orderId: number): Promise<OrderQueue[]> {
        const index = mockOrdersDatabase.findIndex(o => o.id === orderId);
        if (index > 0) {
            const temp = mockOrdersDatabase[index];
            mockOrdersDatabase[index] = mockOrdersDatabase[index - 1];
            mockOrdersDatabase[index - 1] = temp;

            const tempSeq = mockOrdersDatabase[index].priority_seq;
            mockOrdersDatabase[index].priority_seq = mockOrdersDatabase[index - 1].priority_seq;
            mockOrdersDatabase[index - 1].priority_seq = tempSeq;
        }
        return mockOrdersDatabase;
    }

    static async moveOrderDown(orderId: number): Promise<OrderQueue[]> {
        const index = mockOrdersDatabase.findIndex(o => o.id === orderId);
        if (index !== -1 && index < mockOrdersDatabase.length - 1) {
            const temp = mockOrdersDatabase[index];
            mockOrdersDatabase[index] = mockOrdersDatabase[index + 1];
            mockOrdersDatabase[index + 1] = temp;

            const tempSeq = mockOrdersDatabase[index].priority_seq;
            mockOrdersDatabase[index].priority_seq = mockOrdersDatabase[index + 1].priority_seq;
            mockOrdersDatabase[index + 1].priority_seq = tempSeq;
        }
        return mockOrdersDatabase;
    }
}