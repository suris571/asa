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
            return '-';
        // แปลงให้เป็น Number (กรณีรับมาเป็น String)
        const num = Number(val);
        // ถ้าแปลงแล้วไม่ใช่ตัวเลข (NaN) ให้คืนค่าเดิมหรือ '-'
        if (isNaN(num))
            return '-';
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
}
exports.Common = Common;
