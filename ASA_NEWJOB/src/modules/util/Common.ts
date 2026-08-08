export class Common {
/**
 * ฟังก์ชันแปลงตัวเลข/String ให้เป็นฟอร์แมตมีลูกน้ำ (Thousand Separator)
 * @param val ค่าตัวเลขหรือ String ที่ต้องการแปลง
 * @param decimals จำนวนตำแหน่งทศนิยม (Default = 0)
 */
    public static formatNumber(val: number | string | null | undefined, decimals: number = 0): string { 
        if (val === null || val === undefined || val === '') return '-';

        // แปลงให้เป็น Number (กรณีรับมาเป็น String)
        const num = Number(val);

        // ถ้าแปลงแล้วไม่ใช่ตัวเลข (NaN) ให้คืนค่าเดิมหรือ '-'
        if (isNaN(num)) return '-';

        // Format ใส่ลูกน้ำตามมาตรฐานไทย
        return new Intl.NumberFormat('th-TH', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(num);
    }

    public static formatDateDDMMYYYY(date: Date): string {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };
}