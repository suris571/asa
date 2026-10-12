// src/slitter/slitter-mock.ts
import net from 'net';

const PORT = 8000;
const HOST = '127.0.0.1';

const STX = '\x02'; // ASCII Start of Text
const ETX = '\x03'; // ASCII End of Text

// 1. สร้าง TCP Server จำลองเป็นตู้ PLC เครื่องตัด Yueli
const server = net.createServer((socket) => {
    console.log(`\n🤖 [Slitter Mock] Agent เชื่อมต่อสาย TCP เข้ามาแล้ว! (${socket.remoteAddress}:${socket.remotePort})`);

    // 2. ดักรับข้อมูล ASCII Frame ที่ยิงมาจาก Node.js Agent
    socket.on('data', (data: Buffer) => {
        const rawStr = data.toString('ascii');
        console.log(`📥 [Slitter Mock Received Raw]:`, rawStr);

        // ตัด STX (\x02) และ ETX (\x03) ออกเพื่อแกะข้อมูล
        const clean = rawStr.replace(/\x02|\x03/g, '').trim();
        if (clean.length < 5) return;

        const cmd = clean.substring(0, 3);   // รหัสคำสั่ง เช่น "R04"
        const msgId = clean.substring(3, 5); // เลข MsgID เช่น "00" - "99"

        // 3. ตรวจเช็กถ้าเป็นคำสั่ง R04 (สั่งตั้งสเปกงานตัด)
        if (cmd === 'R04') {
            const seqNo = clean.substring(5, 7);                  // ลำดับคิว (เช่น '02')
            const orderId = clean.substring(7, 22).trim();        // เลข OrderID/splitSetId
            const length = clean.substring(22, 30);               // ความยาวเมตร
            const makeCnt = clean.substring(30, 34);              // จำนวนม้วน

            console.log(`🤖 [Slitter Mock Processing R04]:`);
            console.log(`   ├─ MsgID: ${msgId}`);
            console.log(`   ├─ คิวช่องที่ (SeqNo): ${seqNo}`);
            console.log(`   ├─ Order ID (splitSetId): ${orderId}`);
            console.log(`   ├─ ความยาว: ${Number(length)} เมตร`);
            console.log(`   └─ จำนวนม้วน: ${Number(makeCnt)} ชุด`);

            // 4. จำลองตอบกลับ P04 + MsgID + 000 (000 = Success / สำเร็จ)
            const responseFrame = `${STX}P04${msgId}000${ETX}`;
            
            setTimeout(() => {
                socket.write(responseFrame);
                console.log(`📤 [Slitter Mock Sent Response P04]:`, responseFrame);
            }, 100); // หน่วงเวลาตอบกลับเล็กน้อย 100ms ให้สมจริง
        }
    });

    socket.on('close', () => {
        console.warn(`⚠️ [Slitter Mock] Agent ตัดสายการเชื่อมต่อ TCP ไปแล้ว`);
    });

    socket.on('error', (err) => {
        console.error(`🔴 [Slitter Mock Error]:`, err.message);
    });
});

// 5. สั่งเปิด Server ที่พอร์ต 8000
server.listen(PORT, HOST, () => {
    console.log(`===================================================`);
    console.log(`🤖 YUELI SLITTER MOCK SERVER RUNNING AT ${HOST}:${PORT}`);
    console.log(`===================================================`);
});