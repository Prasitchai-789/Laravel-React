/** ปลอดภัย: แปลงเป็น number เสมอ */
export const toNumber = (value: any, defaultValue: number = 0): number => {
    if (value === null || value === undefined) return defaultValue;
    if (value === "") return defaultValue;

    const num = typeof value === "number" ? value : parseFloat(String(value));
    return isNaN(num) ? defaultValue : num;
};

/** ป้องกัน Floating point error เช่น 89.2900000002 */
export const safeRound = (value: any, digits: number = 3): number => {
    const n = toNumber(value);
    const factor = Math.pow(10, digits);
    return Math.round(n * factor) / factor;
};

export const safeSum = (...values: any[]): number => {
    const raw = values.reduce((s, v) => s + toNumber(v), 0);
    return safeRound(raw, 3);
};


/** แสดงผลทศนิยมแบบปลอดภัย */
export const toFixed = (value: any, digits: number = 3): string => {
    return safeRound(value, digits).toFixed(digits);
};

/** ใช้กับ input text (format only number + decimal) */
export const sanitizeNumberInput = (value: string, allowDecimal: boolean = true): string => {
    if (value == null) return "";
    let formatted = value.replace(/,/g, "").trim();
    formatted = formatted.replace(/[^\d.]/g, "");

    const parts = formatted.split(".");
    if (parts.length > 2) formatted = parts[0] + "." + parts.slice(1).join("");

    if (!allowDecimal) formatted = formatted.replace(/\./g, "");

    return formatted;
};
