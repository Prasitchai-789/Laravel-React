import React from 'react';
import { Head } from '@inertiajs/react';
import { Printer, ChevronLeft, Check, X, AlertTriangle } from 'lucide-react';

interface Topic {
    id: number;
    title: string;
    order: number;
}

interface Inspection {
    id: number;
    computer_id: number;
    inspection_date: string;
    data: Array<{
        topic_id: number;
        topic_title: string;
        status: 'normal' | 'abnormal' | 'broken';
        cleaning: boolean;
        remark: string;
    }>;
    remark: string | null;
    checked_by: string | null;
    computer: {
        id: number;
        code_com: string;
        model: string;
        asset_id: string | null;
        office: number | null;
    };
}

interface Props {
    inspection: Inspection;
    topics: Topic[];
}

export default function InspectionReport({ inspection, topics }: Props) {
    const handlePrint = () => {
        window.print();
    };

    const handleBack = () => {
        window.history.back();
    };

    return (
        <div className="min-h-screen bg-slate-100 font-anuphan print:bg-white p-4 md:p-8">
            <Head title={`Inspection Report - ${inspection.computer.code_com}`} />

            {/* Control Bar - Hidden on print */}
            <div className="max-w-[800px] mx-auto mb-6 flex items-center justify-between bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-white print:hidden">
                <button 
                    onClick={handleBack}
                    className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-xl transition-all font-bold"
                >
                    <ChevronLeft className="w-4 h-4" />
                    <span>กลับไปหน้าแผน</span>
                </button>
                
                <button 
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 font-bold"
                >
                    <Printer className="w-4 h-4" />
                    <span>พิมพ์รายงาน (PDF)</span>
                </button>
            </div>

            {/* Report Container */}
            <div className="report-container bg-white mx-auto shadow-2xl relative print:shadow-none print:w-full print:mx-0">
                <style dangerouslySetInnerHTML={{ __html: `
                    @media screen {
                        .report-container {
                            width: 210mm;
                            min-height: 297mm;
                            padding: 15mm;
                        }
                    }
                    @media print {
                        @page {
                            size: A4;
                            margin: 10mm;
                        }
                        body {
                            margin: 0;
                            -webkit-print-color-adjust: exact;
                        }
                        .print-hidden {
                            display: none !important;
                        }
                        nav, aside, header, footer {
                            display: none !important;
                        }
                        .report-container {
                            width: 100% !important;
                            max-width: 100% !important;
                            margin: 0 !important;
                            padding: 0 !important;
                            box-shadow: none !important;
                        }
                    }
                ` }} />

                {/* Header Table (Mill Daily Style) */}
                <table className="w-full border-collapse border border-black text-[12px] mb-6">
                    <tbody>
                        <tr>
                            <td rowSpan={3} className="w-[20%] border border-black p-2 text-center align-middle">
                                <div className="flex flex-col items-center gap-1">
                                    <img src="/images/isp-touch-icon.png" alt="ISP Logo" className="h-14 object-contain" />
                                    <span className="text-[11px] font-black leading-tight uppercase">บริษัท อีสานปาล์ม จำกัด</span>
                                </div>
                            </td>
                            <td className="w-[45%] px-3 py-1.5 font-bold">ประเภทเอกสาร : แบบฟอร์ม</td>
                            <td colSpan={2} className="px-3 py-1.5"></td>
                        </tr>
                        <tr>
                            <td className="border border-black px-3 py-1.5 font-bold uppercase">ชื่อเอกสาร : รายงานการตรวจสอบคอมพิวเตอร์</td>
                            <td className="w-[35%] border border-black px-3 py-1.5 font-bold">วันที่บังคับใช้ : 01-01-2569</td>
                        </tr>
                        <tr>
                            <td className="border border-black px-3 py-1.5 font-bold">รหัสเอกสาร : FM-IT-69-0001</td>
                            <td className="border border-black px-3 py-1.5 font-bold">แก้ไขครั้งที่ : 01</td>
                        </tr>
                    </tbody>
                </table>

                {/* Inspection Info Bar */}
                <div className="grid grid-cols-2 gap-4 mb-6 text-[13px]">
                    <div className="space-y-1">
                        <div className="flex items-baseline gap-2">
                            <span className="font-bold text-slate-500 whitespace-nowrap">COMPUTER CODE:</span>
                            <span className="font-black text-blue-700 text-lg border-b border-blue-200 flex-1 leading-none pb-0.5">{inspection.computer.code_com}</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="font-bold text-slate-500 whitespace-nowrap">MODEL / SPEC:</span>
                            <span className="font-bold text-slate-800 border-b border-slate-100 flex-1">{inspection.computer.model}</span>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-baseline gap-2">
                            <span className="font-bold text-slate-500 whitespace-nowrap">INSPECTION DATE:</span>
                            <span className="font-bold text-slate-800 border-b border-slate-100 flex-1">{inspection.inspection_date}</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="font-bold text-slate-500 whitespace-nowrap">ASSET ID:</span>
                            <span className="font-bold text-slate-800 border-b border-slate-100 flex-1">{inspection.computer.asset_id || '-'}</span>
                        </div>
                    </div>
                </div>

                {/* Checklist Table */}
                <table className="w-full border-collapse border border-black text-[12px] mb-8">
                    <thead>
                        <tr className="bg-slate-50">
                            <th className="border border-black p-2 w-10 text-center">ลำดับ</th>
                            <th className="border border-black p-2 text-left">รายการตรวจสอบ (Checklist 19 รายการ)</th>
                            <th className="border border-black p-2 w-24 text-center">สถานะ</th>
                            <th className="border border-black p-2 w-20 text-center">ทำความสะอาด</th>
                            <th className="border border-black p-2 w-48 text-left">หมายเหตุ / พบปัญหา</th>
                        </tr>
                    </thead>
                    <tbody>
                        {topics.map((topic, index) => {
                            const result = inspection.data.find(d => d.topic_id === topic.id);
                            return (
                                <tr key={topic.id}>
                                    <td className="border border-black p-1.5 text-center">{index + 1}</td>
                                    <td className="border border-black p-1.5">{topic.title}</td>
                                    <td className="border border-black p-1.5 text-center">
                                        <div className="flex items-center justify-center gap-1.5">
                                            {result?.status === 'normal' && <span className="text-emerald-600 font-bold uppercase text-[10px]">Normal</span>}
                                            {result?.status === 'abnormal' && <span className="text-amber-600 font-bold uppercase text-[10px]">Abnormal</span>}
                                            {result?.status === 'broken' && <span className="text-rose-600 font-bold uppercase text-[10px]">Broken</span>}
                                            {!result && <span className="text-slate-300">-</span>}
                                        </div>
                                    </td>
                                    <td className="border border-black p-1.5 text-center">
                                        <div className="flex items-center justify-center">
                                            <div className={`w-4 h-4 border border-black rounded-sm flex items-center justify-center ${result?.cleaning ? 'bg-slate-800' : ''}`}>
                                                {result?.cleaning && <Check className="w-3 h-3 text-white" />}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="border border-black p-1.5 text-[11px] italic text-slate-600">
                                        {result?.remark || '-'}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {/* Remarks & Photos Placeholder */}
                <div className="grid grid-cols-2 gap-8 mb-12">
                    <div>
                        <h4 className="text-[12px] font-black underline mb-2 uppercase">สรุปผลการตรวจสอบ / ข้อเสนอแนะ (General Remarks)</h4>
                        <div className="min-h-[80px] p-3 border border-slate-200 rounded-lg italic text-[12px] text-slate-700 bg-slate-50/30">
                            {inspection.remark ? `"${inspection.remark}"` : "- ไม่มีหมายเหตุเพิ่มเติม -"}
                        </div>
                    </div>
                    <div className="flex flex-col justify-end">
                         {/* Status Legend if needed */}
                         <div className="flex flex-wrap gap-4 text-[10px] items-center justify-end">
                            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></div> ปกติ (Normal)</div>
                            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-amber-500 rounded-full"></div> ผิดปกติ (Abnormal)</div>
                            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-rose-500 rounded-full"></div> ชำรุด (Broken)</div>
                         </div>
                    </div>
                </div>

                {/* Signature Section */}
                <div className="mt-auto grid grid-cols-2 gap-12 text-[13px]">
                    {/* Inspector */}
                    <div className="flex flex-col items-center">
                        <div className="w-full border-b border-dotted border-black mb-1 mt-8"></div>
                        <span className="font-bold">( {inspection.checked_by || '....................................................'} )</span>
                        <span className="text-[11px] font-bold mt-1 uppercase tracking-wider text-slate-500">ผู้ตรวจสอบ (INSPECTOR)</span>
                        <span className="text-[10px] mt-1 italic text-slate-400">Date: {inspection.inspection_date}</span>
                    </div>

                    {/* Acknowledge */}
                    <div className="flex flex-col items-center">
                        <div className="w-full border-b border-dotted border-black mb-1 mt-8"></div>
                        <span className="font-bold">( .................................................... )</span>
                        <span className="text-[11px] font-bold mt-1 uppercase tracking-wider text-slate-500">ผู้รับทราบ (ACKNOWLEDGE)</span>
                        <span className="text-[10px] mt-1 italic text-slate-400">Date: ____/____/____</span>
                    </div>
                </div>

                {/* Footer Info */}
                <div className="absolute bottom-4 left-0 right-0 flex justify-between px-8 text-[9px] text-slate-400">
                    <span>พิมพ์เมื่อ: {new Date().toLocaleString('th-TH')}</span>
                    <div className="flex gap-4">
                        <span>หน้า 1/1</span>
                        <span>FM-IT-69-0001 - Rev.01</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
