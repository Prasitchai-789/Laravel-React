/** วันเมื่อวาน (YYYY-MM-DD) */
export const getYesterdayDate = (): string => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split("T")[0];
};

/** ปรับ format วันที่ให้ input date ใช้ได้ */
export const formatDateForInput = (dateString: string): string => {
    if (!dateString) return getYesterdayDate();

    const d = new Date(dateString);
    if (isNaN(d.getTime())) return getYesterdayDate();

    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");

    return `${y}-${m}-${day}`;
};
