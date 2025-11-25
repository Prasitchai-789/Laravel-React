import React from "react";

interface Props {
    imported: number;
    skipped: number;
    skippedRows: any[];
    onClose: () => void;
}

const ImportReport: React.FC<Props> = ({ imported, skipped, skippedRows, onClose }) => {
    return (
        <div className="mt-6 rounded-xl border bg-gray-50 p-4 shadow">
            <div className="flex justify-between">
                <h3 className="text-lg font-bold">รายงานการนำเข้าข้อมูล</h3>
                <button onClick={onClose} className="text-red-600 text-sm font-semibold">
                    ปิด
                </button>
            </div>

            <p className="mt-2">✔ นำเข้าสำเร็จ: {imported} รายการ</p>
            <p className="text-red-600 font-semibold">✘ ไม่สำเร็จ: {skipped} รายการ</p>

            {skippedRows.length > 0 && (
                <div className="mt-4 overflow-auto max-h-96 border bg-white rounded-lg">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-200">
                            <tr>
                                <th className="p-2">แถว</th>
                                <th className="p-2">สาเหตุ</th>
                                <th className="p-2">เลขบัตร</th>
                                <th className="p-2">ชื่อ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {skippedRows.map((r, i) => (
                                <tr key={i} className="border-t">
                                    <td className="p-2">{r.row}</td>
                                    <td className="p-2 text-red-600">{r.cause}</td>
                                    <td className="p-2">{r.data?.national_id}</td>
                                    <td className="p-2">
                                        {r.data?.first_name} {r.data?.last_name}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default ImportReport;
