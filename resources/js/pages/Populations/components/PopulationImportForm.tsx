import { router, usePage } from '@inertiajs/react';
import React, { useEffect, useState } from 'react';
import { useXlsxFile } from '../hooks/useXlsxFile';
import { parseExcelPopulation } from '../utils/parseExcelPopulation';
import ImportReport from '@/pages/Populations/components/ImportReport';

const PopulationImportForm: React.FC = () => {
    const { rows, fileName, loading, handleFile } = useXlsxFile();
    const [submitting, setSubmitting] = useState(false);

    // รับ props ที่ส่งมาจาก Controller ผ่าน Inertia::render
    const page: any = usePage().props;
    const [report, setReport] = useState<any | null>(page.reportData ?? null);

    useEffect(() => {
        setReport(page.reportData ?? null);
    }, [page.reportData]);

    const handleSubmit = () => {
        setSubmitting(true);

        const parsed = parseExcelPopulation(rows);

        router.post("/population/import",
            { rows: parsed },
            { preserveScroll: true }
        );
    };

    return (
        <div className="p-6 bg-white border rounded-xl shadow-sm">
            <h2 className="text-lg font-bold mb-4">นำเข้าข้อมูลประชากร (Excel)</h2>

            <input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => e.target.files && handleFile(e.target.files[0])}
                className="block w-full text-sm text-gray-700
                    file:mr-4 file:rounded-lg file:border-0
                    file:bg-blue-600 file:px-4 file:py-2 file:text-white"
            />

            {fileName && (
                <p className="mt-2 text-xs text-gray-500">
                    ไฟล์: {fileName} ({rows.length} แถว)
                </p>
            )}

            {!loading && rows.length > 0 && (
                <button
                    className="mt-4 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
                    onClick={handleSubmit}
                    disabled={submitting}
                >
                    {submitting ? "กำลังนำเข้า..." : "นำเข้าข้อมูล"}
                </button>
            )}

            {/* แสดงรายงาน */}
            {report && (
                <ImportReport
                    imported={report.imported}
                    skipped={report.skipped}
                    skippedRows={report.skipped_rows}
                    onClose={() => setReport(null)}
                />
            )}
        </div>
    );
};

export default PopulationImportForm;
