// utils/formatPhoneNumber.ts
export const PhoneNumber = (phone: string | undefined): string => {
    if (!phone) return 'ไม่ระบุ';

    // ลบเครื่องหมายที่ไม่ใช่ตัวเลขทั้งหมด
    const cleaned = phone.replace(/\D/g, '');

    // จัดรูปแบบตามรูปแบบ 123-456-7899
    if (cleaned.length === 10) {
        return `${cleaned.substring(0, 3)}-${cleaned.substring(3, 6)}-${cleaned.substring(6)}`;
    }

    // รองรับรูปแบบอื่นๆ
    if (cleaned.length === 9) {
        return `${cleaned.substring(0, 2)}-${cleaned.substring(2, 5)}-${cleaned.substring(5)}`;
    }

    // หากไม่ตรงกับรูปแบบที่กำหนด ให้คืนค่าเดิม
    return phone;
};
