// src/models/wait-cut.model.ts
import { getConnection } from '../../database';

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
    
    // 🌟 ย้ายเข้ามาอยู่ในคลาสเพื่อความเป็นระบบสากล
    static async getAllWaitingAndWeighing(): Promise<WaitCutRow[]> {
      let conn;
      try {
        conn = await getConnection();

        const query = `
          SELECT id, job_no, roll_no, set_index, roll_index_in_set, target_weight, actual_weight, status, queue_no
          FROM c##factory_dev.wait_cut
          WHERE status IN ('รอสั่งตัด', 'รอตัด' , 'ตัดไม่ครบ' , 'HOLD')
          ORDER BY queue_no ASC
        `;

        const result = await conn.execute<any[]>(query);
        const dataList: WaitCutRow[] = [];

        if (result.rows) {
          for (const row of result.rows) {
            dataList.push({
              id: row[0],
              jobNo: row[1],
              rollNo: row[2],
              setIndex: row[3],
              rollIndexInSet: row[4],
              targetWeight: row[5],
              actualWeight: row[6],
              status: row[7],
              queue_no: row[8] // ล็อกพิกัดคิวลงออบเจกต์ส่งออก
            });
          }
        }

        return dataList;
      } catch (error) {
        console.error('🔴 Model พลั้งพลาดตอนดึงข้อมูลรอบแรก:', error);
        throw error;
      } finally {
        if (conn) {
          await conn.close();
        }
      }
    }

    static async getAllOrders(): Promise<OrderQueue[]> {
        return mockOrdersDatabase;
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