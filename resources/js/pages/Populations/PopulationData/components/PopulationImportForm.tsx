import { router, usePage } from '@inertiajs/react';
import React, { useEffect, useState } from 'react';
import { useXlsxFile } from '../hooks/useXlsxFile';
import { parseExcelPopulation } from '../utils/parseExcelPopulation';
import ImportReport from '@/pages/Populations/PopulationData/components/ImportReport';

const PopulationImportForm: React.FC = () => {
    const { rows, fileName, loading, handleFile } = useXlsxFile();
    const [submitting, setSubmitting] = useState(false);
    const [parsedData, setParsedData] = useState<any[]>([]);
    const [incompleteData, setIncompleteData] = useState<any[]>([]); // ข้อมูลที่ไม่สมบูรณ์

    // รับ props ที่ส่งมาจาก Controller ผ่าน Inertia::render
    const page: any = usePage().props;
    const [report, setReport] = useState<any | null>(page.reportData ?? null);

    useEffect(() => {
        setReport(page.reportData ?? null);
    }, [page.reportData]);

    // 🔥 เพิ่ม useEffect นี้เพื่อ parse ข้อมูลเมื่อโหลดไฟล์เสร็จ
    useEffect(() => {
        if (rows.length > 0 && !loading) {
            console.log('Raw data from Excel:', rows); // Debug
            const parsed = parseExcelPopulation(rows);
            console.log('Parsed data:', parsed); // Debug
            setParsedData(parsed);

            // ตรวจสอบข้อมูลที่ไม่สมบูรณ์
            const incomplete = checkIncompleteData(parsed);
            setIncompleteData(incomplete);
        }
    }, [rows, loading]); // ทำงานเมื่อ rows หรือ loading เปลี่ยนแปลง

    // ฟังก์ชันตรวจสอบข้อมูลที่ไม่สมบูรณ์
    const checkIncompleteData = (data: any[]) => {
        return data.map((row, index) => {
            const issues = [];

            if (!row.national_id) {
                issues.push('ไม่มีเลขบัตรประชาชน');
            }
            if (!row.first_name || row.first_name.includes('ไม่ระบุ') || row.first_name.includes('ชื่อ_')) {
                issues.push('ชื่อไม่สมบูรณ์');
            }
            if (!row.last_name || row.last_name.includes('ไม่ระบุ') || row.last_name.includes('นามสกุล_')) {
                issues.push('นามสกุลไม่สมบูรณ์');
            }

            if (!row.gender || row.gender === 'OTHER') {
                issues.push('เพศไม่สมบูรณ์');
            }
            if (!row.house_no) {
                issues.push('ไม่มีบ้านเลขที่');
            }
            // if (!row.phone || row.phone === '0000000000') {
            //     issues.push('เบอร์โทรไม่สมบูรณ์');
            // }

            return {
                ...row,
                index: index + 1,
                issues,
                hasIssues: issues.length > 0
            };
        }).filter(item => item.hasIssues);
    };

    const handleSubmit = async () => {
        if (parsedData.length === 0) {
            alert('ไม่มีข้อมูลที่จะนำเข้า');
            return;
        }

        // แจ้งเตือนถ้ามีข้อมูลที่ไม่สมบูรณ์
        if (incompleteData.length > 0) {
            const shouldProceed = confirm(
                `พบข้อมูลที่ไม่สมบูรณ์ ${incompleteData.length} รายการ\n` +
                'ต้องการนำเข้าข้อมูลต่อไปหรือไม่?'
            );
            if (!shouldProceed) {
                return;
            }
        }

        console.log('📤 ข้อมูลก่อนส่ง:', parsedData);
        console.log('📤 จำนวนข้อมูล:', parsedData.length);
        console.log('⚠️  ข้อมูลที่ไม่สมบูรณ์:', incompleteData);

        setSubmitting(true);

        try {
            const response = await new Promise((resolve, reject) => {
                router.post(
                    "/population/import",
                    {
                        rows: parsedData // ส่งข้อมูลทั้งหมด
                    },
                    {
                        preserveScroll: true,
                        onSuccess: (page) => {
                            console.log('✅ ส่งข้อมูลสำเร็จ:', page.props);
                            resolve(page.props);
                        },
                        onError: (error) => {
                            console.error('❌ ส่งข้อมูลล้มเหลว:', error);
                            reject(error);
                        },
                    }
                );
            }) as any;

            console.log('📨 Response จาก backend:', response);

            if (response.success) {
                console.log(`🎯 นำเข้าข้อมูลเสร็จสิ้น: ${response.imported_count} รายการ`);

                // แสดงรายงาน
                setReport(response.reportData);

                // รีโหลดหน้าเพื่อแสดงข้อมูลใหม่
                router.reload({ only: ["populations"] });
            } else {
                throw new Error(response.message || 'การนำเข้าข้อมูลล้มเหลว');
            }

        } catch (error) {
            console.error('❌ เกิดข้อผิดพลาดในการนำเข้า:', error);
            alert('เกิดข้อผิดพลาดในการนำเข้าข้อมูล: ' + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="p-6 bg-white border rounded-xl shadow-sm">
            <h2 className="text-lg font-bold mb-4">นำเข้าข้อมูลประชากร (Excel)</h2>

            <input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                        handleFile(e.target.files[0]);
                        setParsedData([]); // รีเซ็ตข้อมูลเก่าเมื่อเลือกไฟล์ใหม่
                        setReport(null); // รีเซ็ตรายงานเก่า
                    }
                }}
                className="block w-full text-sm text-gray-700
                file:mr-4 file:rounded-lg file:border-0
                file:bg-blue-600 file:px-4 file:py-2 file:text-white"
            />

            {fileName && (
                <p className="mt-2 text-xs text-gray-500">
                    ไฟล์: {fileName} ({rows.length} แถว)
                </p>
            )}

            {/* แสดงสถานะการโหลด */}
            {loading && (
                <p className="mt-4 text-sm text-gray-600">กำลังอ่านไฟล์...</p>
            )}

            {/* แจ้งเตือนข้อมูลที่ไม่สมบูรณ์ */}
            {!loading && incompleteData.length > 0 && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center mb-2">
                        <svg className="w-5 h-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <h3 className="font-medium text-yellow-800">
                            พบข้อมูลที่ไม่สมบูรณ์ {incompleteData.length} รายการ
                        </h3>
                    </div>

                    <div className="overflow-auto max-h-60 border border-yellow-300 rounded-lg">
                        <table className="min-w-full text-xs">
                            <thead className="bg-yellow-100">
                                <tr>
                                    <th className="px-2 py-1 border border-yellow-300">แถว</th>
                                    <th className="px-2 py-1 border border-yellow-300">เลขบัตร</th>
                                    <th className="px-2 py-1 border border-yellow-300">ชื่อ-สกุล</th>
                                    <th className="px-2 py-1 border border-yellow-300">ปัญหา</th>
                                </tr>
                            </thead>
                            <tbody>
                                {incompleteData.slice(0, 10).map((row, index) => (
                                    <tr key={index} className="border-t border-yellow-200 hover:bg-yellow-50">
                                        <td className="px-2 py-1 border border-yellow-200 text-center">{row.index}</td>
                                        <td className="px-2 py-1 border border-yellow-200 font-mono">
                                            {row.national_id || '-'}
                                        </td>
                                        <td className="px-2 py-1 border border-yellow-200">
                                            {row.first_name} {row.last_name}
                                        </td>
                                        <td className="px-2 py-1 border border-yellow-200">
                                            <div className="flex flex-wrap gap-1">
                                                {row.issues.map((issue: string, i: number) => (
                                                    <span
                                                        key={i}
                                                        className="px-1.5 py-0.5 bg-yellow-200 text-yellow-800 text-xs rounded"
                                                    >
                                                        {issue}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {incompleteData.length > 10 && (
                        <p className="text-xs text-yellow-600 mt-2">
                            แสดง 10 รายการแรกจากทั้งหมด {incompleteData.length} รายการที่ไม่สมบูรณ์
                        </p>
                    )}

                    <p className="text-sm text-yellow-700 mt-2">
                        ระบบจะยังคงนำเข้าข้อมูลทั้งหมด แต่ข้อมูลเหล่านี้อาจไม่สมบูรณ์
                    </p>
                </div>
            )}

            {/* แสดงข้อมูลที่อ่านได้ก่อนอัปโหลด */}
            {!loading && parsedData.length > 0 && (
                <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">ข้อมูลที่อ่านได้ (แสดง 10 แถวแรก):</h3>
                        <div className="flex gap-2 text-xs">
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
                                รวม {parsedData.length} รายการ
                            </span>
                            {incompleteData.length > 0 && (
                                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
                                    ไม่สมบูรณ์ {incompleteData.length} รายการ
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="overflow-auto max-h-60 border rounded-lg">
                        <table className="min-w-full text-xs">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-2 py-1 border">เลขบัตร</th>
                                    <th className="px-2 py-1 border">ชื่อ</th>
                                    <th className="px-2 py-1 border">นามสกุล</th>
                                    <th className="px-2 py-1 border">วันเกิด</th>
                                    <th className="px-2 py-1 border">เบอร์โทร</th>
                                    <th className="px-2 py-1 border">สถานะ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {parsedData.slice(0, 10).map((row, index) => {
                                    const isIncomplete = incompleteData.some(item => item.index === index + 1);
                                    return (
                                        <tr key={index} className={`border-t ${isIncomplete ? 'bg-yellow-50' : 'hover:bg-gray-50'}`}>
                                            <td className="px-2 py-1 border font-mono">{row.national_id || '-'}</td>
                                            <td className="px-2 py-1 border">{row.first_name || '-'}</td>
                                            <td className="px-2 py-1 border">{row.last_name || '-'}</td>
                                            <td className="px-2 py-1 border">{row.birthdate || '-'}</td>
                                            <td className="px-2 py-1 border">{row.phone || '-'}</td>
                                            <td className="px-2 py-1 border text-center">
                                                {isIncomplete ? (
                                                    <span className="px-1.5 py-0.5 bg-yellow-200 text-yellow-800 text-xs rounded">
                                                        ไม่สมบูรณ์
                                                    </span>
                                                ) : (
                                                    <span className="px-1.5 py-0.5 bg-green-200 text-green-800 text-xs rounded">
                                                        สมบูรณ์
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {parsedData.length > 10 && (
                        <p className="text-xs text-gray-500 mt-1">
                            แสดง 10 แถวแรกจากทั้งหมด {parsedData.length} แถว
                        </p>
                    )}

                    <button
                        className="mt-4 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg disabled:opacity-50"
                        onClick={handleSubmit}
                        disabled={submitting}
                    >
                        {submitting ? "กำลังนำเข้า..." : `นำเข้าข้อมูล ${parsedData.length} รายการ`}
                    </button>
                </div>
            )}

            {/* แสดงข้อความเมื่อโหลดเสร็จแต่ไม่มีข้อมูล */}
            {!loading && rows.length > 0 && parsedData.length === 0 && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                        อ่านไฟล์สำเร็จแต่ไม่พบข้อมูลประชากร
                    </p>
                    <p className="text-xs text-yellow-600 mt-1">
                        กรุณาตรวจสอบรูปแบบไฟล์และคอลัมน์ให้ถูกต้อง
                    </p>
                </div>
            )}

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
