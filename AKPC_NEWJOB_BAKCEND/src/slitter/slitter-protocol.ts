// src/slitter-protocol.ts

export const STX = '\x02'; // Start of Text
export const ETX = '\x03'; // End of Text

// โครงสร้างสเปกสั่งตัด
export interface SlitterOrderSpec {
  seqNo: string;        // '01' - '05'
  orderId: string;      // เช่น 'ORD202609001' (ความยาวไม่เกิน 15 ตัวอักษร)
  length: number;       // ความยาวเมตร (เช่น 3500)
  makeCnt: number;      // จำนวนม้วน (เช่น 5)
  blades: number[];     // ระยะใบมีด 10 ช่อง [W1, W2, ..., W10]
}

export class SlitterProtocol {

  /**
   * 1. สร้าง Frame ASCII สำหรับคำสั่ง R04 (Set Specification)
   * รูปแบบ: STX + "R04" + MsgID(2) + SeqNo(2) + OrderID(15) + Length(8) + MakeCnt(4) + Blades(50) + ETX
   */
  static buildR04Frame(msgId: string, spec: SlitterOrderSpec): string {
    const paddedMsgId = msgId.padStart(2, '0');
    const paddedSeq = spec.seqNo.padStart(2, '0');
    const paddedOrderId = spec.orderId.padEnd(15, ' ');
    const paddedLen = String(spec.length).padStart(8, '0');
    const paddedMakeCnt = String(spec.makeCnt).padStart(4, '0');

    // เติมระยะมีด 10 ช่อง ช่องละ 5 หลัก (เช่น 500 mm -> "00500")
    let bladeStr = '';
    for (let i = 0; i < 10; i++) {
      const w = spec.blades && spec.blades[i] ? spec.blades[i] : 0;
      bladeStr += String(w).padStart(5, '0');
    }

    const body = `R04${paddedMsgId}${paddedSeq}${paddedOrderId}${paddedLen}${paddedMakeCnt}${bladeStr}`;
    return `${STX}${body}${ETX}`;
  }

  /**
   * 2. สร้าง Frame ASCII สำหรับคำสั่ง R06 (Delete Order Queue)
   * รูปแบบ: STX + "R06" + MsgID(2) + SeqNo(2) + OrderID(15) + ETX
   */
  static buildR06Frame(msgId: string, seqNo: string, orderId: string): string {
    const paddedMsgId = msgId.padStart(2, '0');
    const paddedSeq = seqNo.padStart(2, '0');
    const paddedOrderId = orderId.padEnd(15, ' ');

    const body = `R06${paddedMsgId}${paddedSeq}${paddedOrderId}`;
    return `${STX}${body}${ETX}`;
  }

  /**
   * 3. สร้าง Frame ASCII สำหรับคำสั่ง R00 (Read Total Report Count)
   */
  static buildR00Frame(msgId: string): string {
    const paddedMsgId = msgId.padStart(2, '0');
    return `${STX}R00${paddedMsgId}${ETX}`;
  }

  /**
   * 4. สร้าง Frame ASCII สำหรับคำสั่ง R02 (Read Report Detail by Index)
   */
  static buildR02Frame(msgId: string, recordIndex: number): string {
    const paddedMsgId = msgId.padStart(2, '0');
    const paddedIndex = String(recordIndex).padStart(4, '0'); // 0001 - 0999
    return `${STX}R02${paddedMsgId}${paddedIndex}${ETX}`;
  }

  /**
   * 5. ฟังก์ชันแกะ Response จาก socket.on('data')
   * ตัด STX/ETX ออก แล้วทำหน้าที่เป็น "ตัวแยก Event"
   */
  static parseResponse(rawFrame: string) {
    // ตัด STX (\x02) และ ETX (\x03) ออก
    const clean = rawFrame.replace(/\x02|\x03/g, '').trim();
    if (clean.length < 5) return null;

    const cmd = clean.substring(0, 3);   // เช่น 'P04', 'P06', 'P00', 'P02', 'ERR'
    const msgId = clean.substring(3, 5); // '00' - '99'
    const payload = clean.substring(5);  // ข้อมูลส่วนที่เหลือ

    const isError = cmd === 'ERR' || payload.startsWith('ERR') || payload.startsWith('010');

    return {
      cmd,
      msgId,
      status: isError ? 'ERROR' : 'OK',
      errorCode: isError ? payload.substring(0, 3) : undefined,
      payload
    };
  }
}