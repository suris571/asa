


## 📘 คู่มือเชิงเทคนิคและเอกสารอธิบายการทำงานของระบบ (Operations & Developer Manual)

### 1. ภาพรวมของระบบ (System Overview)

ระบบนี้เป็น **ระบบควบคุมเครื่องชั่งน้ำหนักและจัดการคิวงานตัดกระดาษหน้างานโรงงาน (Wait-Cut & Paper Rewinder System)** พัฒนาด้วย **Node.js, TypeScript, Express, OracleDB และ Socket.IO** โดยมีหน้าที่หลักในการ:

1. จัดคิวและสั่งตัดลูกม้วนกระดาษ (Paper Reel Split & Cut Queue)


2. จัดการข้อมูลการสลับคิว สลับขนาดใบมีด (Knife & Size Swapping)


3. ชั่งน้ำหนักลูกกระดาษและออกเลขรันม้วน (PD Roll Generation & Weighing)


4. ปิดม้วน QC (QC Reel Closing) และพิมพ์บาร์โค้ด


5. แสดงผล Dashboard และอัปเดตข้อมูลหน้าจอแบบ Real-time ข้ามเครื่องจักร



---

### 2. สถาปัตยกรรมระบบ (Architecture & Data Flow)

* **Architecture Pattern:** MVC (Model-View-Controller) + Event-Driven Real-time WebSockets


* **Database Driver:** `oracledb` แบบ Thin Mode (ใช้ Connection Pooling เพิ่มประสิทธิภาพและความเสถียร)


* **Session & Auth:** `express-session` (ตั้งค่า Cookie อายุ 1 ปีสำหรับเครื่องจักรหน้างาน) ร่วมกับ Role & Permission-based Middleware


* **Real-time Engine:** Socket.IO แยกเป็น Namespaces และ Rooms ตามสายการผลิต (`machine_room_${productionLineId}`)



---

### 3. โครงสร้างมอดูลและการทำงาน (Module Breakdown)

#### 3.1 ระบบเชื่อมต่อฐานข้อมูล (`database.ts`)

* **`initializePool()`:** สร้าง Connection Pool สำหรับ Oracle DB กำหนดช่วง `poolMin: 1` ถึง `poolMax: 4` และตั้งค่า `poolPingInterval: 60` เพื่อตรวจสอบสายสัญญาณก่อนใช้งาน


* **`getConnection()`:** ดึง Connection สายตรงจาก Pool มาใช้งานและคืนสายเมื่อจบธุรกรรม



#### 3.2 ระบบเซิร์ฟเวอร์หลักและสิทธิ์การใช้งาน (`server.ts`, `middleware/auth-middleware.ts`)

* **Session Filter:** ล็อกอินและเก็บ Session เช่น `staff_id`, `machineNo`, `productionLineId`

* **Permission Middleware (`requireAuth`, `requirePermission`):** ตรวจสอบสิทธิ์ย่อยของพนักงาน เช่น:
* `16800` : Admin / สิทธิ์สูงสุด


* `16801` : รายการรอสั่งตัด


* `16802` : รายการรอสั่งตัดแยกเซต


* `16803` : QC ปิด Reel No.


* `16804` : รับน้ำหนักลูกกระดาษ





#### 3.3 ระบบการสื่อสาร Real-time (`socket.ts`)

ระบบเปิดการเชื่อมต่อผ่าน Socket.IO แยกตามการทำงาน 5 ห้อง (Namespaces):

1. **`/socket/wait-cut`:** จัดการคิวงานตัดหลัก สลับคิว (`swapQueue`)


2. **`/socket/weighing`:** ส่งสัญญาณเมื่อมีม้วนถัดไปพร้อมชั่งน้ำหนัก (`get_next_roll`)


3. **`/socket/wait-cut/split-cut-set`:** สลับขนาดใบมีด/สลับช่องแบบเรียลไทม์


4. **`/socket/wait-cut/qc-close-reel`:** แจ้งอัปเดตตารางปิด QC Reel


5. **`/socket/updateChart`:** มอนิเตอร์และส่งข้อมูลกราฟ Dashboard ทุกๆ 20 วินาที โดยตรวจเช็กด้วย Fingerprint (MD5 Hash) เพื่อประหยัด Resource



---

### 4. เจาะลึกกระบวนการทำงานหลัก (Core Workflows & Business Logic)

```
[ใบสั่งผลิตหลัก] ➔ [สร้าง Split Set] ➔ [ส่งคิวเข้าชั่งน้ำหนัก] ➔ [บันทึกน้ำหนัก/สร้าง PD_ROLL] ➔ [ปิด QC Reel]

```

#### A. ระบบจัดการคิวสั่งตัดและสลับคิว (`wait-cut.model.ts`, `wait-cut.controller.ts`)

* **`createOrderSplitSet`:** เมื่อสั่งตัด ระบบจะกระจายรายการย่อยลงตาราง `PL_CUT_SPLIT_SET` ตามจำนวนเซ็ตที่กำหนด และอัปเดตสถานะคิวงานหลักเป็น `2` (รอตัด), `3` (ตัดไม่ครบ) หรือ `5` (เสร็จสิ้น)


* **`swapQueue`:** ใช้ในการสลับลำดับคิวงานตัด (`QUEUE_NO`) ระหว่าง 2 แถวในตาราง `PL_ORDER_DETAIL` และยิง Broadcast สัญญาณ Socket ไปยังเครื่องที่เกี่ยวข้อง


* **`swapSplitSetSize`:** สลับขนาดและเกรดระหว่างคอลัมน์ (`posA` <-> `posB`) ด้วยคำสั่ง SQL `UPDATE` แบบใช้ Bind Parameters ตัวเดียว เพื่อความเร็วและความปลอดภัยของ Transaction



#### B. ระบบชั่งน้ำหนักและสร้างเลขม้วน (`weighing.model.ts`, `weighing.controller.ts`)

* **`getMaxRollNo`:** ค้นหาเลขรันม้วนถัดไปจากตาราง `PD_ROLL`
* สายผลิต 161 (PM1) -> ขึ้นต้นด้วย `1` ความยาว 9 หลัก (เช่น `100000001`)


* สายผลิต 162 (PM2) -> ขึ้นต้นด้วย `2` ความยาว 9 หลัก (เช่น `200000001`)


* กรองเฉพาะเลขล้วน `REGEXP_LIKE(roll_no, '^[0-9]+$')` และตัดตัวอักษรขยะ/ข้อความพิเศษเช่น `RX` ออกโดยอัตโนมัติ




* **`saveWeighingController` & `InsertPD_ROLL`:**
1. อ่านข้อมูลคิวชั่งจาก `PL_WAIT_WEIGHING_VIEW`

2. ดึง Primary Key ใหม่จาก Oracle Sequence `SQ_PD_ROLL.NEXTVAL`

3. บันทึกข้อมูลเข้าตาราง `PD_ROLL` และ `PD_ROLL_QUALITY` พร้อมกันแบบ **Atomic Transaction**

4. ยิงสั่งพิมพ์บาร์โค้ดผ่านบริการ Print Service Local (Port 4000)





#### C. ระบบปิดม้วน QC (`updateCloseReel`)

* ทำหน้าที่ผูก `QC_REEL_ID` เข้ากับรายการตัด `PL_CUT_SPLIT_SET` และ `PD_ROLL`

* มีระบบ Validation ตรวจสอบโควตาคงเหลือ (`remaining`) ของม้วน QC หากโควตาไม่พอ ระบบจะย้อนกลับ (Rollback) และส่งคำเตือนไปยังหน้าจอทันที



---

### 5. คำอธิบายตารางข้อมูลหลักที่เกี่ยวข้อง (Database Schema Context)

* **`PL_ORDER` / `PL_ORDER_DETAIL`:** ตารางใบสั่งผลิตหลักและรายการย่อย


* **`PL_CUT_SPLIT_SET`:** ตารางบันทึกชุดเซ็ตย่อยจากการสั่งตัด


* **`PL_WAIT_WEIGHING`:** ตารางพักคิวลูกม้วนกระดาษที่รอชั่งน้ำหนัก


* **`PD_ROLL` / `PD_ROLL_QUALITY`:** ตารางเก็บประวัติม้วนกระดาษที่ชั่งน้ำหนักเสร็จสิ้นพร้อมผลตรวจคุณภาพ


* **`QC_REEL` / `QC_REEL_QUALITY`:** ตารางเก็บข้อมูลม้วน QC มาตรฐาน



---

### 6. ข้อควรระวังและการดูแลรักษาระบบ (Operations Checklist)

1. **การตั้งค่าพอร์ตสื่อสาร:**
* Node.js Web App: Port `3000`

* Local Scale Agent & Barcode Printer: Port `4000`



2. **การสับเปลี่ยน Thin Mode บน Oracle DB:**
* โค้ดถูกตั้งค่าไว้เป็น **Thin Mode** ของ `oracledb` ทำให้ไม่ต้องติดตั้ง Oracle Instant Client บนเครื่อง Server




3. **การสั่งพิมพ์บาร์โค้ด:**
* หน้าจอ Frontend (`weighing/index.ejs`) จะส่งข้อมูลไปยัง `[http://127.0.0.1:4000/preview-label](http://127.0.0.1:4000/preview-label)` เพื่อสั่งพิมพ์บาร์โค้ดลงเครื่องพิมพ์สติ๊กเกอร์สเกลหน้างาน