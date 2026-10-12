export declare const STX = "\u0002";
export declare const ETX = "\u0003";
export interface SlitterOrderSpec {
    seqNo: string;
    orderId: string;
    length: number;
    makeCnt: number;
    blades: number[];
}
export declare class SlitterProtocol {
    /**
     * 1. สร้าง Frame ASCII สำหรับคำสั่ง R04 (Set Specification)
     * รูปแบบ: STX + "R04" + MsgID(2) + SeqNo(2) + OrderID(15) + Length(8) + MakeCnt(4) + Blades(50) + ETX
     */
    static buildR04Frame(msgId: string, spec: SlitterOrderSpec): string;
    /**
     * 2. สร้าง Frame ASCII สำหรับคำสั่ง R06 (Delete Order Queue)
     * รูปแบบ: STX + "R06" + MsgID(2) + SeqNo(2) + OrderID(15) + ETX
     */
    static buildR06Frame(msgId: string, seqNo: string, orderId: string): string;
    /**
     * 3. สร้าง Frame ASCII สำหรับคำสั่ง R00 (Read Total Report Count)
     */
    static buildR00Frame(msgId: string): string;
    /**
     * 4. สร้าง Frame ASCII สำหรับคำสั่ง R02 (Read Report Detail by Index)
     */
    static buildR02Frame(msgId: string, recordIndex: number): string;
    /**
     * 5. ฟังก์ชันแกะ Response จาก socket.on('data')
     * ตัด STX/ETX ออก แล้วทำหน้าที่เป็น "ตัวแยก Event"
     */
    static parseResponse(rawFrame: string): {
        cmd: string;
        msgId: string;
        status: string;
        errorCode: string | undefined;
        payload: string;
    } | null;
}
//# sourceMappingURL=slitter-protocol.d.ts.map