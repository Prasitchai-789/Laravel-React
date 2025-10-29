import dayjs from 'dayjs';

/**
 * แปลงค่า number ให้อยู่ในรูปแบบ string ที่เหมาะสม
 */
export function formatNumber(value: number | string | null | undefined): string {
    if (value === null || value === undefined || value === '') return '0';

    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '0';

    return num.toString();
}

/**
 * แปลงค่า string เป็น number ที่ปลอดภัย
 */
export function parseNumber(value: string | number | null | undefined): string {
    if (value === null || value === undefined) return '0';

    const str = value.toString().trim();
    if (str === '') return '0';

    // อนุญาตให้มีทศนิยม
    const num = parseFloat(str);
    return isNaN(num) ? '0' : num.toString();
}

/**
 * แก้ปัญหา date format
 */
export function formatDateSafe(date: string | null | undefined): string {
    const d = dayjs(date);
    return d.isValid() ? d.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD');
}

/**
 * จัดรูปแบบเงิน
 */
export function formatCurrency(value: number | string): string {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '0.00';

    return num.toLocaleString('th-TH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}
