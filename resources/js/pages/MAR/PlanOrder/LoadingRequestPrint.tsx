// @ts-nocheck
import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import DocumentReportLayout from '@/components/DocumentForm/DocumentReportLayout';
import DocumentHeaderTable, { DocumentHeader } from '@/components/DocumentForm/DocumentHeaderTable';

/**
 * Loading Request Print Page (ใบขอเข้าบรรทุก/เบิก)
 * สำหรับพิมพ์ใบขอเข้าบรรทุก
 */

interface SelectedOrder {
    id: number;
    SOPID: string;
    loading_request_number?: string;
    SOPDate: string;
    GoodName: string;
    NumberCar: string;
    DriverName: string;
    CustName: string;
    AmntLoad: string;
    NetWei: string;
}

interface Props {
    selectedOrders: SelectedOrder[];
}

export default function LoadingRequestPrint({ selectedOrders }: Props) {
    const [header, setHeader] = useState<DocumentHeader>({
        documentType: 'แบบฟอร์ม',
        documentName: 'ใบขอเข้าบรรทุก/เบิก',
        effectiveDate: '05-01-2569',
        documentCode: 'FM-MAR-59-0007',
        revision: '04'
    });

    const handleHeaderChange = (field: keyof DocumentHeader, value: string) => {
        setHeader(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const formatThaiDate = (dateString: string) => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return dateString; // fallback
            return date.toLocaleDateString('th-TH', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (e) {
            return dateString;
        }
    };

    return (
        <DocumentReportLayout
            title="ใบขอเข้าบรรทุก/เบิก"
            header={header}
            onHeaderChange={handleHeaderChange}
            readOnly={true}
            showPrintButton={true}
            showBackButton={true}
            onBack={() => window.close()}
        >
            <Head title="ใบขอเข้าบรรทุก/เบิก" />
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    .report-container table {
                        margin-bottom: 3.5mm !important;
                    }
                    .report-container td {
                        padding-top: 1.5mm !important;
                        padding-bottom: 1.5mm !important;
                    }
                    .report-container img {
                        height: 14mm !important;
                    }
                    .loading-request-print {
                        font-size: 12px !important;
                        line-height: 1.35 !important;
                    }
                    .lr-form {
                        font-size: 12px !important;
                        line-height: 1.35 !important;
                    }
                    .lr-products {
                        row-gap: 2mm !important;
                        margin-bottom: 4mm !important;
                    }
                    .lr-text-lines {
                        margin-bottom: 4mm !important;
                    }
                    .lr-text-lines > :not([hidden]) ~ :not([hidden]) {
                        margin-top: 3mm !important;
                    }
                    .lr-signatures {
                        row-gap: 4mm !important;
                    }
                    .lr-separator {
                        margin-top: 4.5mm !important;
                        margin-bottom: 4.5mm !important;
                    }
                    .lr-bottom-options {
                        margin-bottom: 4mm !important;
                    }
                    .lr-top-form .lr-top-header {
                        margin-bottom: 4.5mm !important;
                    }
                    .lr-top-form .lr-top-date {
                        margin-bottom: 3.5mm !important;
                    }
                    .lr-top-form .lr-products {
                        row-gap: 2.6mm !important;
                        margin-bottom: 5mm !important;
                    }
                    .lr-top-form .lr-text-lines {
                        margin-bottom: 5mm !important;
                    }
                    .lr-top-form .lr-text-lines > :not([hidden]) ~ :not([hidden]) {
                        margin-top: 3.8mm !important;
                    }
                    .lr-top-form .lr-signatures {
                        row-gap: 5mm !important;
                    }
                    .document-footer {
                        font-size: 8px !important;
                    }
                }
            ` }} />

            {/* Orders Form Loop */}
            <div className="loading-request-print w-full">
                {selectedOrders.map((order, index) => {
                    const getCheckedProduct = (name: string) => {
                        if (!name) return null;
                        const n = name.toLowerCase();
                        if (n.includes('cpo') || n.includes('ปาล์มดิบ')) return 'CPO';
                        if (n.includes('เมล็ด')) return 'PK';
                        if (n.includes('กรด')) return 'PAO';
                        if (n.includes('เพียว')) return 'ShellPure';
                        if (n.includes('จุก')) return 'ShellJuk';
                        if (n.includes('ทะลาย') || n.includes('สับ')) return 'EFB';
                        if (n.includes('ใย')) return 'Fiber';
                        return 'Other';
                    };

                    const prod = getCheckedProduct(order.GoodName);

                    const PrintCheckbox = ({ checked, label }: { checked: boolean; label: string }) => (
                        <div className="flex items-center gap-2">
                            <div className="w-[14px] h-[14px] border border-black flex items-center justify-center font-bold">
                                {checked && <span className="text-[12px] leading-none mb-[2px]">✓</span>}
                            </div>
                            <span>{label}</span>
                        </div>
                    );

                    return (
                        <div key={order.id} className={index > 0 ? 'print:break-before-page' : ''}>
                            {/* Top Form */}
                            <div className="lr-top-form lr-form relative text-[12px] text-black">
                                {/* Header area */}
                                <div className="lr-top-header flex justify-between items-start mb-3">
                                    <div className="space-y-1 mt-1">
                                        <PrintCheckbox checked={false} label="ปกติ" />
                                        <PrintCheckbox checked={false} label="เร่งด่วน" />
                                    </div>

                                    <div className="border border-black px-10 py-1 font-bold text-[14px] ml-20">
                                        ใบขอเข้าบรรทุกสินค้า
                                    </div>

                                    <div className="text-right mt-2">
                                        <span>( ส่วนที่ 1 ฝ่ายรักษาความปลอดภัย )</span>
                                    </div>
                                </div>

                                {/* Date and No */}
                                <div className="lr-top-date flex justify-between mb-2 px-2">
                                    <div>
                                        <span>วันที่</span>
                                        <span className="inline-block w-48 border-b border-dotted border-black text-center mx-2 text-blue-700 font-bold ">{formatThaiDate(order.SOPDate)}</span>
                                    </div>
                                    <div>
                                        <span>เลขที่</span>
                                        <span className="inline-block w-48 border-b border-dotted border-black text-center mx-2 text-blue-700 font-bold ">{order.loading_request_number || order.SOPID}</span>
                                    </div>
                                    <div>
                                    </div>
                                </div>

                                {/* Products Grid */}
                                <div className="lr-products grid grid-cols-2 gap-y-1.5 mb-3 px-16">
                                    <PrintCheckbox checked={prod === 'CPO'} label="น้ำมันปาล์มดิบ" />
                                    <PrintCheckbox checked={prod === 'PK'} label="เมล็ดในปาล์ม" />
                                    <PrintCheckbox checked={prod === 'PAO'} label="น้ำมันกรดสูง" />
                                    <PrintCheckbox checked={prod === 'ShellPure'} label="กะลา ( เพียว )" />
                                    <PrintCheckbox checked={prod === 'ShellJuk'} label="กะลา ( จุก )" />
                                    <PrintCheckbox checked={prod === 'EFB'} label="ทะลายปาล์มสับ" />
                                    <PrintCheckbox checked={prod === 'Fiber'} label="ใยปาล์ม" />
                                    <div className="flex items-center gap-2">
                                        <PrintCheckbox checked={prod === 'Other'} label="อื่นๆ" />
                                        <span className="inline-block flex-1 border-b border-dotted border-black mt-4">
                                            {prod === 'Other' ? order.GoodName : ''}
                                        </span>
                                    </div>
                                </div>

                                {/* Text lines */}
                                <div className="lr-text-lines space-y-2.5 mb-4 px-2">
                                    <div className="flex">
                                        <span className="whitespace-nowrap">ขออนุญาตให้รถหมายเลขทะเบียน</span>
                                        <span className="inline-block w-48 border-b border-dotted border-black text-center mx-2 font-bold text-blue-700">{order.NumberCar}</span>
                                        <span className="whitespace-nowrap">เข้าบรรทุก</span>
                                        <span className="inline-block flex-1 border-b border-dotted border-black ml-2 text-center"></span>
                                    </div>
                                    <div className="flex items-center">
                                        <span className="whitespace-nowrap">บริษัทขนส่ง</span>
                                        <span className="inline-block w-48 border-b border-dotted border-black text-center mx-2 font-bold text-blue-700 mt-4"></span>
                                        <span className="whitespace-nowrap">จำนวน</span>
                                        <span className="inline-block w-24 border-b border-dotted border-black text-center mx-2 font-bold text-blue-700 mt-4">{order.Quantity}</span>
                                        <span className="whitespace-nowrap">ตัน ชื่อพนักงานขับรถ</span>
                                        <span className="inline-block flex-1 border-b border-dotted border-black ml-2 text-center font-bold text-blue-700">{order.DriverName}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <span className="whitespace-nowrap">น้ำหนักจริง</span>
                                        <span className="inline-block w-40 border-b border-dotted border-black text-center mx-2 mt-4"></span>
                                        <span className="whitespace-nowrap">เวลารถเข้า</span>
                                        <span className="inline-block w-40 border-b border-dotted border-black text-center mx-2 mt-4"></span>
                                        <span className="whitespace-nowrap">เวลารถออก</span>
                                        <span className="inline-block flex-1 border-b border-dotted border-black ml-2 mt-4"></span>
                                    </div>
                                </div>

                                {/* Signatures */}
                                <div className="lr-signatures grid grid-cols-2 gap-y-4 text-center px-4">
                                    <div>
                                        <div className="mb-1.5">
                                            ลงชื่อ <span className="inline-block w-48 border-b border-dotted border-black mx-2 text-center">มะลิวัลย์</span> ผู้แจ้ง
                                        </div>
                                        <div className='-ml-8'>
                                            ตำแหน่ง (<span className="inline-block w-48 border-b border-dotted border-black mx-2 text-center">ฝ่ายขายและการตลาด</span> )
                                        </div>
                                    </div>
                                    <div>
                                        <div className="mb-1.5">
                                            ลงชื่อ <span className="inline-block w-48 border-b border-dotted border-black mx-2"></span> ผู้อนุมัติ
                                        </div>
                                        <div className='-ml-8'>
                                            ตำแหน่ง (<span className="inline-block w-48 border-b border-dotted border-black mx-2 text-center">ฝ่ายบัญชีและการเงิน</span> )
                                        </div>
                                    </div>

                                    <div>
                                        <div className="mb-1.5">
                                            ลงชื่อผู้อนุมัตินำรถเข้า <span className="inline-block w-48 border-b border-dotted border-black mx-2"></span>
                                        </div>
                                        <div className='ml-16'>
                                            ตำแหน่ง (<span className="inline-block w-48 border-b border-dotted border-black mx-2 text-center">รปภ.</span>)
                                        </div>
                                    </div>
                                    <div>
                                        <div className="mb-1.5">
                                            ลงชื่อผู้อนุมัตินำรถออก <span className="inline-block w-48 border-b border-dotted border-black mx-2"></span>
                                        </div>
                                        <div className='ml-16'>
                                            ตำแหน่ง (<span className="inline-block w-48 border-b border-dotted border-black mx-2 text-center">รปภ.</span>)
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Separator line */}
                            <div className="lr-separator my-5 border-b-1 border-dashed border-gray-400 print:border-black"></div>

                            {/* Bottom Form (ส่วนที่ 2) */}
                            <DocumentHeaderTable header={header} readOnly={true} />

                            <div className="lr-form relative text-[12px] text-black">
                                {/* Header area */}
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1 mt-1">
                                        <PrintCheckbox checked={false} label="ปกติ" />
                                        <PrintCheckbox checked={false} label="เร่งด่วน" />
                                    </div>

                                    <div className="border border-black px-16 py-1 font-bold text-[14px] ml-18">
                                        ใบเบิกสินค้า
                                    </div>

                                    <div className="text-right flex gap-8 items-start">
                                        <span className="mt-1">( ส่วนที่ 2 สำหรับคลังสินค้า )</span>
                                    </div>
                                </div>

                                <div className="lr-bottom-options flex justify-end items-end mb-4 mr-24">
                                    <div className="space-y-1 text-left">
                                        <PrintCheckbox checked={false} label="ฝ่ายผลิต" />
                                        <PrintCheckbox checked={false} label="ฝ่ายควบคุมคุณภาพ" />
                                    </div>
                                </div>
                                {/* Date and No */}
                                <div className="flex justify-between mb-2 px-2">
                                    <div>
                                        <span>วันที่</span>
                                        <span className="inline-block w-48 border-b border-dotted border-black text-center mx-2 text-blue-700 font-bold">{formatThaiDate(order.SOPDate)}</span>
                                    </div>
                                    <div>
                                        <span>เลขที่</span>
                                        <span className="inline-block w-48 border-b border-dotted border-black text-center mx-2 font-bold text-blue-700">{order.loading_request_number || order.SOPID}</span>
                                    </div>
                                    <div>
                                    </div>
                                </div>

                                {/* Products Grid */}
                                <div className="lr-products grid grid-cols-2 gap-y-1.5 mb-3 px-16">
                                    <PrintCheckbox checked={prod === 'CPO'} label="น้ำมันปาล์มดิบ" />
                                    <PrintCheckbox checked={prod === 'PK'} label="เมล็ดในปาล์ม" />
                                    <PrintCheckbox checked={prod === 'PAO'} label="น้ำมันกรดสูง" />
                                    <PrintCheckbox checked={prod === 'ShellPure'} label="กะลา ( เพียว )" />
                                    <PrintCheckbox checked={prod === 'ShellJuk'} label="กะลา ( จุก )" />
                                    <PrintCheckbox checked={prod === 'EFB'} label="ทะลายปาล์มสับ" />
                                    <PrintCheckbox checked={prod === 'Fiber'} label="ใยปาล์ม" />
                                    <div className="flex items-center gap-2">
                                        <PrintCheckbox checked={prod === 'Other'} label="อื่นๆ" />
                                        <span className="inline-block flex-1 border-b border-dotted border-black mt-4">
                                            {prod === 'Other' ? order.GoodName : ''}
                                        </span>
                                    </div>
                                </div>

                                {/* Text lines */}
                                <div className="grid grid-cols-2 gap-4 mb-4 px-2">
                                    <div className="space-y-2.5">
                                        <div className="flex">
                                            <span className="w-20">Lot No.</span>
                                            <span className="inline-block flex-1 border-b border-dotted border-black"></span>
                                        </div>
                                        <div className="flex">
                                            <span className="w-20">บริษัทขนส่ง</span>
                                            <span className="inline-block flex-1 border-b border-dotted border-black text-center font-bold truncate text-blue-700 mt-4"></span>
                                        </div>
                                    </div>
                                    <div className="space-y-2.5 px-12">
                                        <div className="flex items-center">
                                            <span className="w-12">จำนวน</span>
                                            <span className="inline-block flex-1 border-b border-dotted border-black text-center font-bold mx-2 mt-4 -ml-2">{order.GoodAmnt}</span>
                                            <span>ตัน</span>
                                        </div>
                                        <div className="flex">
                                            <span className="w-24">เวลาเบิกจ่าย</span>
                                            <span className="inline-block flex-1 border-b border-dotted border-black text-center -ml-6"></span>
                                        </div>
                                        <div className="flex">
                                            <span className="w-16">ทะเบียน</span>
                                            <span className="inline-block flex-1 border-b border-dotted border-black text-center font-bold text-blue-700 -ml-4">{order.NumberCar}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Signatures */}
                                <div className="flex flex-col items-end text-center mt-5 mr-18">
                                    <div className="mb-1.5">
                                        ลงชื่อผู้จ่ายสินค้า <span className="inline-block w-64 border-b border-dotted border-black mx-2"></span>
                                    </div>
                                    <div>
                                        ตำแหน่ง <span className="inline-block w-64 border-b border-dotted border-black mx-2"></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </DocumentReportLayout>
    );
}
