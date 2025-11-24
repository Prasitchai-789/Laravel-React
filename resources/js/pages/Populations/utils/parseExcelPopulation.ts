import * as XLSX from "xlsx";

const thaiMonths: Record<string, number> = {
    "มกราคม": 1, "กุมภาพันธ์": 2, "มีนาคม": 3, "เมษายน": 4,
    "พฤษภาคม": 5, "มิถุนายน": 6, "กรกฎาคม": 7, "สิงหาคม": 8,
    "กันยายน": 9, "ตุลาคม": 10, "พฤศจิกายน": 11, "ธันวาคม": 12
};

const convertThaiDate = (value: any): string | null => {
    if (!value) return null;

    if (value instanceof Date) {
        const y = value.getFullYear();
        const m = String(value.getMonth() + 1).padStart(2, "0");
        const d = String(value.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
    }

    const s = String(value).trim();
    const parts = s.split(" ");

    if (parts.length === 3) {
        const day = parseInt(parts[0]);
        const month = thaiMonths[parts[1]] ?? null;
        const year = parseInt(parts[2]) - 543;

        if (!day || !month || !year) return null;

        return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }

    return null;
};

const cleanCity = (v: any): string | null => {
    if (!v) return null;
    return String(v)
        .replace("ตำบล", "")
        .replace("อำเภอ", "")
        .replace("จังหวัด", "")
        .replace("แขวง", "")
        .replace("เขต", "")
        .trim();
};

export function parseExcelPopulation(rows: any[]): any[] {
    const people: any[] = [];

    const cleanId = (v: any) => v ? String(v).replace(/\s+/g, "") : null;

    const extractNumber = (v: any) => {
        if (!v) return null;
        const n = parseInt(String(v).replace(/[^0-9]/g, ""));
        return isNaN(n) ? null : n;
    };

    rows.forEach((row: any) => {
        if (!row["ชื่อ"] && !row["นามสกุล"]) return;

        people.push({
            national_id: cleanId(row["เลขบัตรประชาชน"]),
            prefix: row["คำนำหน้า"] ?? null,
            first_name: row["ชื่อ"] ?? null,
            last_name: row["นามสกุล"] ?? null,

            birthdate: convertThaiDate(row["วันเดือนปีเกิด"]),
            gender: row["เพศ"],

            house_no: row["บ้านเลขที่"] ?? null,
            village_no: extractNumber(row["หมู่ที่"]),
            village_name: row["ชื่อหมู่บ้าน"] ?? null,

            subdistrict_name: cleanCity(row["ตำบล"]),
            district_name: cleanCity(row["อำเภอ"]),
            province_name: cleanCity(row["จังหวัด"]),

            religion: row["ศาสนา"] ?? null,
            age_at_import: extractNumber(row["อายุ"] ?? row[" อายุ "]),
            phone: row["เบอร์โทร"] ?? null,
        });
    });

    return people;
}
