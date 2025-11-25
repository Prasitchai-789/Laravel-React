export function parseExcelPopulation(rows: any[]): any[] {
    console.log("🔍 ข้อมูลดิบจาก Excel:", rows);

    if (rows.length === 0) {
        console.log("❌ ไม่มีข้อมูลในไฟล์");
        return [];
    }

    // แสดงคอลัมน์ทั้งหมดสำหรับ debugging
    console.log("📋 คอลัมน์ทั้งหมด:", Object.keys(rows[0]));

    // แปลงทุกแถวโดยตรง
    const result = rows.map((row, index) => {
        // สร้างข้อมูลพื้นฐานจากคอลัมน์ต่างๆ
        const person = {
            national_id: row["เลขบัตรประชาชน"] ||
                        row["เลขประจำตัวประชาชน"] ||
                        row["บัตรประชาชน"] ||
                        row["id"] ||
                        row["ID"] ||
                        `AUTO_${index + 1}`,

            prefix: row["คำนำหน้า"] || row["title"] || "นาย",

            first_name: row["ชื่อ"] ||
                       row["first_name"] ||
                       row["name"] ||
                       `ชื่อ_${index + 1}`,

            last_name: row["นามสกุล"] ||
                      row["last_name"] ||
                      row["surname"] ||
                      `นามสกุล_${index + 1}`,

            birthdate: convertThaiDate(
                row["วันเดือนปีเกิด"] ||
                row["วันเกิด"] ||
                row["birthdate"]
            ) || "2000-01-01",

            gender: row["เพศ"] || row["gender"] || "M",

            house_no: row["บ้านเลขที่"] || row["house_no"] || "1",

            village_no: parseInt(row["หมู่ที่"] || row["หมู่"] || row["village_no"] || "1") || 1,

            village_name: row["ชื่อหมู่บ้าน"] || row["หมู่บ้าน"] || row["village_name"] || "หมู่บ้าน",

            subdistrict_name: cleanCity(row["ตำบล"] || row["subdistrict"] || "ตำบล"),

            district_name: cleanCity(row["อำเภอ"] || row["district"] || "อำเภอ"),

            province_name: cleanCity(row["จังหวัด"] || row["province"] || "จังหวัด"),

            religion: row["ศาสนา"] || row["religion"] || "พุทธ",

            age_at_import: parseInt(row["อายุ"] || row["age"] || "25") || 25,

            phone: row["เบอร์โทร"] || row["phone"] || "0000000000",
        };

        console.log(`✅ แปลงแถวที่ ${index}:`, person);
        return person;
    });

    console.log(`🎯 แปลงข้อมูลเสร็จสิ้น: ${result.length} รายการ`);
    return result;
}

const convertThaiDate = (value: any): string | null => {
    if (!value) return null;

    // ถ้าเป็น Date object
    if (value instanceof Date) {
        return value.toISOString().split('T')[0];
    }

    // ถ้าเป็น string ให้ลองแปลง
    const str = String(value).trim();
    if (str.includes('/')) {
        const parts = str.split('/');
        if (parts.length === 3) {
            const day = parts[0];
            const month = parts[1];
            const year = parts[2];
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
    }

    return null;
};

const cleanCity = (v: any): string => {
    if (!v) return "ไม่ระบุ";
    return String(v)
        .replace("ตำบล", "")
        .replace("อำเภอ", "")
        .replace("จังหวัด", "")
        .replace("แขวง", "")
        .replace("เขต", "")
        .trim() || "ไม่ระบุ";
};
