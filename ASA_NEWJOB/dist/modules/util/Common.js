"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Common = void 0;
class Common {
    /**
     * ฟังก์ชันแปลงตัวเลข/String ให้เป็นฟอร์แมตมีลูกน้ำ (Thousand Separator)
     * @param val ค่าตัวเลขหรือ String ที่ต้องการแปลง
     * @param decimals จำนวนตำแหน่งทศนิยม (Default = 0)
     */
    static formatNumber(val, decimals = 0) {
        if (val === null || val === undefined || val === '')
            return '';
        // แปลงให้เป็น Number (กรณีรับมาเป็น String)
        const num = Number(val);
        // ถ้าแปลงแล้วไม่ใช่ตัวเลข (NaN) ให้คืนค่าเดิมหรือ '-'
        if (isNaN(num))
            return '';
        // Format ใส่ลูกน้ำตามมาตรฐานไทย
        return new Intl.NumberFormat('th-TH', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(num);
    }
    static formatDateDDMMYYYY(date) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }
    ;
    static getCurrentShiftPartAndCreateAt = (dateObj = new Date()) => {
        // 1. คัดลอก Date Object เพื่อคำนวณ
        const workDate = new Date(dateObj);
        const currentHour = workDate.getHours();
        let shiftPart = "";
        // 🎯 1. ช่วงเวลา 08:00 ถึง 15:59 -> กะเช้า
        if (currentHour >= 8 && currentHour < 16) {
            shiftPart = "เช้า";
        }
        // 🎯 2. ช่วงเวลา 16:00 ถึง 23:59 -> กะบ่าย
        else if (currentHour >= 16 && currentHour < 24) {
            shiftPart = "บ่าย";
        }
        // 🎯 3. ช่วงเวลา 00:00 ถึง 07:59 -> กะดึก (วันที่ผลิตถอยกลับไป 1 วัน)
        else {
            shiftPart = "ดึก";
            workDate.setDate(workDate.getDate() - 1); // ถอยวันที่ลง 1 วัน (แต่ชั่วโมง/นาที/วินาที ยังเหมือนเดิม)
        }
        // 2. จัดฟอร์แมตวันที่ (YYYY-MM-DD)
        const year = workDate.getFullYear();
        const month = String(workDate.getMonth() + 1).padStart(2, '0');
        const day = String(workDate.getDate()).padStart(2, '0');
        // 3. จัดฟอร์แมตเวลาเดิม (HH:mm:ss)
        const hours = String(workDate.getHours()).padStart(2, '0');
        const minutes = String(workDate.getMinutes()).padStart(2, '0');
        const seconds = String(workDate.getSeconds()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;
        const formattedTimestamp = `${formattedDate} ${hours}:${minutes}:${seconds}`;
        return {
            date: formattedDate,
            part: shiftPart
        };
    };
}
exports.Common = Common;
