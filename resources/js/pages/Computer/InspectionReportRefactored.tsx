import React from 'react';
import { Head } from '@inertiajs/react';
import DocumentReportLayout from '@/components/DocumentForm/DocumentReportLayout';
import { DocumentHeader } from '@/components/DocumentForm/DocumentHeaderTable';
import { Check } from 'lucide-react';

/**
 * Example: Refactored InspectionReport using DocumentReportLayout
 *
 * นี่คือตัวอย่างของการนำ DocumentReportLayout มาใช้กับ InspectionReport
 * สามารถปรับแต่งชื่อเอกสาร รหัส ประเภท วันที่ การแก้ไข ได้ง่ายๆ
 */

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

export default function InspectionReportRefactored({ inspection, topics }: Props) {
    // กำหนดค่าเริ่มต้น header
    const header: DocumentHeader = {
        documentType: 'แบบฟอร์ม',
        documentName: 'รายงานการตรวจสอบคอมพิวเตอร์',
        effectiveDate: '01-01-2569',
        documentCode: 'FM-IT-69-0001',
        revision: '01'
    };

    return (
        <DocumentReportLayout
            title={`Inspection Report - ${inspection.computer.code_com}`}
            header={header}
            readOnly={true}
        >
            <Head title={`Inspection Report - ${inspection.computer.code_com}`} />

            {/* Inspection Info Bar */}
            <div className="grid grid-cols-2 gap-4 mb-6 text-[13px]">
                <div className="space-y-1">
                    <div className="flex items-baseline gap-2">
                        <span className="font-bold text-slate-500 whitespace-nowrap">COMPUTER CODE:</span>
                        <span className="font-black text-blue-700 text-lg border-b border-blue-200 flex-1 leading-none pb-0.5">
                            {inspection.computer.code_com}
                        </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="font-bold text-slate-500 whitespace-nowrap">MODEL / SPEC:</span>
                        <span className="font-bold text-slate-800 border-b border-slate-100 flex-1">
                            {inspection.computer.model}
                        </span>
                    </div>
                </div>
                <div className="space-y-1">
                    <div className="flex items-baseline gap-2">
                        <span className="font-bold text-slate-500 whitespace-nowrap">INSPECTION DATE:</span>
                        <span className="font-bold text-slate-800 border-b border-slate-100 flex-1">
                            {inspection.inspection_date}
                        </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="font-bold text-slate-500 whitespace-nowrap">ASSET ID:</span>
                        <span className="font-bold text-slate-800 border-b border-slate-100 flex-1">
                            {inspection.computer.asset_id || '-'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Checklist Table */}
            <table className="w-full border-collapse border border-black text-[12px] mb-8">
                <thead>
                    <tr className="bg-slate-50">
                        <th className="border border-black p-2 w-10 text-center">ลำดับ</th>
                        <th className="border border-black p-2 text-left">รายการตรวจสอบ</th>
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
                                        {result?.status === 'normal' && (
                                            <span className="text-emerald-600 font-bold uppercase text-[10px]">Normal</span>
                                        )}
                                        {result?.status === 'abnormal' && (
                                            <span className="text-amber-600 font-bold uppercase text-[10px]">Abnormal</span>
                                        )}
                                        {result?.status === 'broken' && (
                                            <span className="text-rose-600 font-bold uppercase text-[10px]">Broken</span>
                                        )}
                                        {!result && <span className="text-slate-300">-</span>}
                                    </div>
                                </td>
                                <td className="border border-black p-1.5 text-center">
                                    <div className="flex items-center justify-center">
                                        <div className={`w-4 h-4 border border-black rounded-sm flex items-center justify-center ${
                                            result?.cleaning ? 'bg-slate-800' : ''
                                        }`}>
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

            {/* Remarks & Signature */}
            <div className="grid grid-cols-2 gap-8 mb-12">
                <div>
                    <h4 className="text-[12px] font-black underline mb-2 uppercase">สรุปผลการตรวจสอบ</h4>
                    <div className="min-h-[80px] p-3 border border-slate-200 rounded-lg italic text-[12px] text-slate-700 bg-slate-50/30">
                        {inspection.remark ? `"${inspection.remark}"` : "- ไม่มีหมายเหตุเพิ่มเติม -"}
                    </div>
                </div>
                <div className="flex flex-col justify-end">
                    <div className="flex flex-wrap gap-4 text-[10px] items-center justify-end">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></div> ปกติ
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 bg-amber-500 rounded-full"></div> ผิดปกติ
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 bg-rose-500 rounded-full"></div> ชำรุด
                        </div>
                    </div>
                </div>
            </div>

            {/* Signature Section */}
            <div className="mt-auto grid grid-cols-2 gap-12 text-[13px]">
                <div className="flex flex-col items-center">
                    <div className="w-full border-b border-dotted border-black mb-1 mt-8"></div>
                    <span className="font-bold">( {inspection.checked_by || '....................................................'} )</span>
                    <span className="text-[11px] font-bold mt-1 uppercase tracking-wider text-slate-500">
                        ผู้ตรวจสอบ (INSPECTOR)
                    </span>
                    <span className="text-[10px] mt-1 italic text-slate-400">
                        Date: {inspection.inspection_date}
                    </span>
                </div>

                <div className="flex flex-col items-center">
                    <div className="w-full border-b border-dotted border-black mb-1 mt-8"></div>
                    <span className="font-bold">( .................................................... )</span>
                    <span className="text-[11px] font-bold mt-1 uppercase tracking-wider text-slate-500">
                        ผู้รับทราบ (ACKNOWLEDGE)
                    </span>
                    <span className="text-[10px] mt-1 italic text-slate-400">
                        Date: ____/____/____
                    </span>
                </div>
            </div>
        </DocumentReportLayout>
    );
}
