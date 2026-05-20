import React from 'react';

export interface DocumentHeader {
    documentType: string;        // ประเภทเอกสาร
    documentName: string;        // ชื่อเอกสาร
    effectiveDate: string;       // วันที่บังคับใช้
    documentCode: string;        // รหัสเอกสาร
    revision: string;            // แก้ไขครั้งที่
}

interface DocumentHeaderTableProps {
    header: DocumentHeader;
    logoSrc?: string;
    companyName?: string;
    onHeaderChange?: (field: keyof DocumentHeader, value: string) => void;
    readOnly?: boolean;
}

/**
 * Reusable Document Header Table Component
 * สามารถปรับแต่งชื่อเอกสาร รหัส ประเภท วันที่ การแก้ไข ได้
 */
export default function DocumentHeaderTable({
    header,
    logoSrc = '/images/isp-touch-icon.png',
    companyName = 'บริษัท อีสานปาล์ม จำกัด',
    onHeaderChange,
    readOnly = false
}: DocumentHeaderTableProps) {

    const handleChange = (field: keyof DocumentHeader, value: string) => {
        if (!readOnly && onHeaderChange) {
            onHeaderChange(field, value);
        }
    };

    const InputField = ({ value, field }: { value: string; field: keyof DocumentHeader }) => {
        if (readOnly) {
            return <span>{value}</span>;
        }
        return (
            <input
                type="text"
                value={value}
                onChange={(e) => handleChange(field, e.target.value)}
                className="w-full border-b border-gray-300 bg-transparent focus:outline-none focus:border-blue-500 text-sm"
            />
        );
    };

    return (
        <table className="w-full border-collapse border border-black text-[12px] mb-4">
            <tbody>
                {/* Row 1 */}
                <tr>
                    <td rowSpan={3} className="w-[20%] border border-black p-2 text-center align-middle">
                        <div className="flex flex-col items-center gap-1">
                            <img src={logoSrc} alt="Company Logo" className="h-14 object-contain" />
                            <span className="text-[11px] font-black leading-tight uppercase">{companyName}</span>
                        </div>
                    </td>
                    <td className="w-[45%] px-3 py-1.5 font-bold">ประเภทเอกสาร :
                        <span className="ml-2 font-normal font-bold">
                            <InputField value={header.documentType} field="documentType" />
                        </span>
                    </td>
                    <td colSpan={2} className="px-3 py-1.5"></td>
                </tr>

                {/* Row 2 */}
                <tr>
                    <td className="border border-black px-3 py-1.5 font-bold uppercase">ชื่อเอกสาร :
                        <span className="ml-2 font-normal normal-case font-bold">
                            <InputField value={header.documentName} field="documentName" />
                        </span>
                    </td>
                    <td className="w-[35%] border border-black px-3 py-1.5 font-bold">วันที่บังคับใช้ :
                        <span className="ml-2 font-normal font-bold">
                            <InputField value={header.effectiveDate} field="effectiveDate" />
                        </span>
                    </td>
                </tr>

                {/* Row 3 */}
                <tr>
                    <td className="border border-black px-3 py-1.5 font-bold">รหัสเอกสาร :
                        <span className="ml-2 font-normal font-bold">
                            <InputField value={header.documentCode} field="documentCode" />
                        </span>
                    </td>
                    <td className="border border-black px-3 py-1.5 font-bold">แก้ไขครั้งที่ :
                        <span className="ml-2 font-normal font-bold">
                            <InputField value={header.revision} field="revision" />
                        </span>
                    </td>
                </tr>
            </tbody>
        </table>
    );
}
