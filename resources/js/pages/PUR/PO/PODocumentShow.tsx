import 'dayjs/locale/th';
import { Calendar } from 'lucide-react';

interface POInvDetail {
    ListNo: number;
    GoodName: string;
    GoodQty2: string;
    GoodPrice2: string;
}

interface POHeader {
    POID: number;
    DocuNo: string;
    DocuDate: string;
    POVendorNo: string;
    DeptName?: string;
    AppvDocuNo?: string | null;
    Status?: 'approved' | 'pending' | 'rejected';
    poInv?: {
        glHeader?: {
            TotaAmnt?: number;
        };
        details?: POInvDetail[];
    };
}

interface PODocumentShowProps {
    document?: POHeader;
    onClose: () => void;
}

export default function PODocumentShow({ document, onClose }: PODocumentShowProps) {
    const totalAmount = document?.po?.total_amount || 0;

    const status = document?.po?.AppvDocuNo ? 'approved' : 'pending';
    const statusLabel = {
        approved: 'อนุมัติ',
        pending: 'รอดำเนินการ',
        rejected: 'ปฏิเสธ',
    }[status];

    const statusColor = {
        approved: 'bg-green-500',
        pending: 'bg-yellow-500',
        rejected: 'bg-red-500',
    }[status];

    return (
        <div className="">
            {/* Document Card */}
            <div className="overflow-hidden rounded-xl bg-white font-anuphan shadow-md transition-all duration-300 hover:shadow-xl">
                {/* Header */}
                <div className="rounded-t-xl border-b border-blue-100 bg-gradient-to-r from-blue-100 to-indigo-100 p-6">
                    <div className="flex items-center gap-4">
                        <div className="rounded-xl border border-blue-100 bg-white p-3 shadow-sm">
                            <Calendar className="text-blue-600" size={24} />
                        </div>
                        <div className="flex-1">
                            <h3 className="mb-1 text-xl font-bold text-blue-800">เลขที่เอกสาร: {document?.po?.POVendorNo}</h3>
                            <p className="font-medium text-blue-600">วันที่: {new Date(document?.po?.DocuDate || '').toLocaleDateString('th-TH')}</p>
                        </div>
                    </div>
                </div>

                {/* Document Details */}
                <div className="space-y-6 p-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                            <p className="mb-1 text-sm text-gray-500">เลขที่เอกสารการอนุมัติ</p>
                            <p className="font-medium text-gray-800">{document?.po?.AppvDocuNo || '-'}</p>
                        </div>
                        <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                            <p className="mb-1 text-sm text-gray-500">หน่วยงาน</p>
                            <p className="font-medium text-gray-800">{document?.po?.DeptName || '-'}</p>
                        </div>
                    </div>

                    {/* Status */}
                    <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                        <p className="mb-1 text-sm text-gray-500">สถานะ</p>
                        <div className="flex items-center gap-2">
                            <div className={`h-3 w-3 rounded-full ${statusColor}`} />
                            <p className="font-medium text-gray-800">{statusLabel}</p>
                            {document?.po?.AppvDocuNo && <p className="text-sm text-gray-500">({document?.po?.AppvDocuNo})</p>}
                        </div>
                    </div>

                    {/* Details Table */}
                    <div className="overflow-hidden rounded-lg border border-blue-100 bg-blue-50">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-blue-100">
                                    <tr>
                                        <th className="px-4 py-3 text-center text-xs font-bold text-blue-800 uppercase">ลำดับ</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-blue-800 uppercase">รายการ</th>
                                        <th className="px-4 py-3 text-right text-xs font-bold text-blue-800 uppercase">จำนวน</th>
                                        <th className="px-4 py-3 text-right text-xs font-bold text-blue-800 uppercase">ราคา</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {document?.po?.details.length > 0 ? (
                                        document?.po?.details.map((detail, index) => (
                                            <tr key={index} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 text-center text-blue-500">{detail.ListNo}</td>
                                                <td className="px-4 py-3 text-blue-500">{detail.GoodName}</td>
                                                <td className="px-4 py-3 text-right text-blue-500">
                                                    {detail.GoodQty2 ? parseFloat(detail.GoodQty2).toLocaleString('th-TH') : '0'}
                                                </td>
                                                <td className="px-4 py-3 text-right text-blue-500">
                                                    {detail.GoodPrice2
                                                        ? parseFloat(detail.GoodPrice2).toLocaleString('th-TH', { minimumFractionDigits: 0 })
                                                        : '0.00'}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                                                ไม่พบรายการสินค้า
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Total */}
                    <div className="rounded-lg border border-green-100 bg-gradient-to-r from-green-50 to-emerald-50 p-4">
                        <p className="mb-1 text-sm text-green-600">จำนวนเงินรวม</p>
                        <p className="text-2xl font-bold text-green-800">
                            {totalAmount
                                ? `฿ ${Number(totalAmount).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                : '-'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
