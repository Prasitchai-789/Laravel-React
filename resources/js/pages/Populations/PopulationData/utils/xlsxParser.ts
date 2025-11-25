import * as XLSX from "xlsx";

export interface RawExcelRow {
    [key: string]: any;
}

export const parseXlsxFile = async (file: File): Promise<RawExcelRow[]> => {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];

    return XLSX.utils.sheet_to_json(worksheet, {
        defval: null,
        raw: false,
    });
};
