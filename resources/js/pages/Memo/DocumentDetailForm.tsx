import 'dayjs/locale/th';
import { Calendar } from 'lucide-react';

interface PDocumentFormData {
    document_no: string;
    date: string;
    description: string;
    category_id: number;
    amount: string | number;
    status: 'pending' | 'approved' | 'rejected';
    attachment_path: File | null;
    winspeed_ref_id: string | number;
}

interface DocumentFormProps {
    categories?: any[];
    mode?: 'create' | 'edit';
    document?: Partial<PDocumentFormData> & { id?: number };
    onClose: () => void;
}

export default function DocumentForm({ categories, onClose, mode = 'create', document }: DocumentFormProps) {
    const totalAmount = document?.winspeed_detail?.reduce((sum: number, detail: any) => {
        const qty = parseFloat(detail.GoodQty2) || 0;
        const price = parseFloat(detail.GoodPrice2) || 0;
        return sum + qty * price;
    }, 0);
    return (
        <div className="">
            {/* Document Card */}
            <div className="overflow-hidden rounded-xl border border-green-200 bg-white font-anuphan shadow-md transition-all duration-300 hover:shadow-xl">
                {/* Header with gradient */}
                <div className="rounded-t-xl border-b border-green-100 bg-gradient-to-r from-green-50 to-emerald-50 p-6">
                    <div className="flex items-center gap-4">
                        <div className="rounded-xl border border-green-100 bg-white p-3 shadow-sm">
                            <Calendar className="text-green-600" size={24} />
                        </div>
                        <div className="flex-1">
                            <h3 className="mb-1 text-xl font-bold text-green-800">เรื่อง {document?.memo_document?.description}</h3>
                            <p className="font-medium text-green-600">เลขที่เอกสาร : {document?.memo_document?.document_no}</p>
                        </div>
                    </div>
                </div>

                {/* Document Details */}
                <div className="space-y-6 p-6">
                    {/* Document Information Grid */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                            <p className="mb-1 text-sm text-gray-500">
                                เลขที่ PO <span className="text-sm text-red-600">(Win Speed)</span>
                            </p>
                            <p className="font-medium text-gray-800">{document?.winspeed_header?.DocuNo || '-'}</p>
                        </div>
                        <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                            <p className="mb-1 text-sm text-gray-500">หมวดค่าใช้จ่าย</p>
                            <p className="font-medium text-gray-800">{document?.memo_document?.category?.name || '-'}</p>
                        </div>
                    </div>

                    {/* Status with visual indicator */}
                    <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                        <p className="mb-1 text-sm text-gray-500">สถานะ</p>
                        <div className="flex items-center gap-2">
                            {(() => {
                                const appvDocuNo = document?.winspeed_header?.AppvDocuNo?.trim();
                                const isApproved = !!appvDocuNo;
                                const status = isApproved ? 'approved' : (document?.memo_document?.status ?? 'ไม่ระบุ');

                                // กำหนดสีตามสถานะ
                                const statusColor =
                                    {
                                        approved: 'bg-green-500',
                                        pending: 'bg-yellow-500',
                                        rejected: 'bg-red-500',
                                        draft: 'bg-gray-400',
                                        in_progress: 'bg-blue-500',
                                        default: 'bg-gray-500',
                                    }[status] || 'bg-gray-500';

                                // แปลสถานะเป็นภาษาไทย
                                const statusLabel =
                                    {
                                        approved: 'อนุมัติ',
                                        pending: 'รอดำเนินการ',
                                        rejected: 'ปฏิเสธ',
                                        draft: 'ร่าง',
                                        in_progress: 'กำลังดำเนินการ',
                                    }[status] || 'ไม่ระบุ';

                                return (
                                    <>
                                        <div className={`h-3 w-3 rounded-full ${statusColor}`}></div>
                                        <p className="font-medium text-gray-800">{statusLabel}</p>
                                        {/* แสดงเลขที่อนุมัติถ้ามี */}
                                        {isApproved && <p className="text-sm text-gray-500">({appvDocuNo})</p>}
                                    </>
                                );
                            })()}
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-lg border border-blue-100 bg-blue-50">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-blue-100">
                                    <tr>
                                        <th className="px-4 py-3 text-center text-xs font-bold tracking-wider text-blue-800 uppercase">ลำดับ</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold tracking-wider text-blue-800 uppercase">รายการ</th>
                                        <th className="px-4 py-3 text-right text-xs font-bold tracking-wider text-blue-800 uppercase">จำนวน</th>
                                        <th className="px-4 py-3 text-right text-xs font-bold tracking-wider text-blue-800 uppercase">ราคา</th>
                                    </tr>
                                </thead>
                                <tbody className="">
                                    {document?.winspeed_detail?.length > 0 ? (
                                        document?.winspeed_detail?.map((detail: any, index: number) => (
                                            <tr key={`${detail.id}-${index}`} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 text-center text-blue-500">{detail.ListNo}</td>
                                                <td className="px-4 py-3 text-blue-500">{detail.GoodName}</td>
                                                <td className="px-4 py-3 text-right text-blue-500">
                                                    {' '}
                                                    {detail.GoodQty2 ? `${parseFloat(detail.GoodQty2).toLocaleString()}` : '-'}
                                                </td>
                                                <td className="px-4 py-3 text-right text-blue-500">
                                                    {detail.GoodPrice2 ? `฿ ${parseFloat(detail.GoodPrice2).toLocaleString()}` : '-'}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                                                <div className="flex flex-col items-center justify-center">
                                                    <svg
                                                        className="mb-2 h-12 w-12 text-gray-300"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                        />
                                                    </svg>
                                                    <p>ไม่พบประวัติการชำระเงินสำหรับรหัสการขายนี้</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Amount with emphasis */}
                    <div className="rounded-lg border border-green-100 bg-gradient-to-r from-green-50 to-emerald-50 p-4">
                        <p className="mb-1 text-sm text-green-600">จำนวนเงิน</p>
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
