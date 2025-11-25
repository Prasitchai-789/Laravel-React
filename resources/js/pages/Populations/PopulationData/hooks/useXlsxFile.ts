import { useState } from "react";
import { parseXlsxFile } from "../utils/xlsxParser";

export const useXlsxFile = () => {
    const [rows, setRows] = useState<any[]>([]);
    const [fileName, setFileName] = useState("");
    const [loading, setLoading] = useState(false);

    const handleFile = async (file: File) => {
        setLoading(true);
        setFileName(file.name);

        const data = await parseXlsxFile(file);
        setRows(data);

        setLoading(false);
    };

    const reset = () => {
        setRows([]);
        setFileName("");
        setLoading(false);
    };

    return { rows, fileName, loading, handleFile, reset };
};
