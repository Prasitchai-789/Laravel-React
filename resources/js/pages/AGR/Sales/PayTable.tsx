import dayjs from 'dayjs';
import 'dayjs/locale/th'; // ภาษาไทย

interface Payment {
    id: number;
    sale_id: number;
    paid_at: string;
    method: string;
    amount: number;
    note?: string;
    status?: string;
    new_payment?: number;
    payment_slip?: string;
}

interface PayTableProps {
    payments: Payment[];
    saleId: number;
}

export default function PayTable({ payments = [], saleId }: PayTableProps) {
    // กรองการชำระเงินที่ตรงกับ sale_id
    const filteredPayments = payments.filter((payment) => payment.sale_id.toString() === saleId.toString());

    // ฟังก์ชันแปลงวันที่
    const formatDate = (dateString: string) => {
        return dayjs(dateString).locale('th').format('DD/MM/YYYY');
    };

    const getPaymentMethodText = (method: number) => {
        const paymentMethods = {
            1: 'เงินสด',
            2: 'โอนเงิน',
            3: 'บัตรเครดิต/เดบิต',
            4: 'อื่นๆ',
        };

        return paymentMethods[method as keyof typeof paymentMethods] || `วิธีที่ ${method}`;
    };

    return (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            {/* ตาราง */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-700 uppercase">วันที่ชำระ</th>
                            <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-700 uppercase">วิธีชำระ</th>
                            <th className="px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-700 uppercase">จำนวนเงิน</th>
                            <th className="px-4 py-3 text-center text-xs font-medium tracking-wider text-gray-700 uppercase">หลักฐานการชำระเงิน</th>
                        </tr>
                    </thead>
                    <tbody className="">
                        {filteredPayments.length > 0 ? (
                            filteredPayments.map((payment) => (
                                <tr key={payment.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-gray-600">{formatDate(payment.paid_at)}</td>
                                    <td className="px-4 py-3 text-gray-600">{getPaymentMethodText(payment.method)}</td>
                                    <td className="px-4 py-3 text-right font-medium text-green-600">
                                        {payment.new_payment !== null
                                            ? Number(payment.new_payment).toLocaleString('th-TH', {
                                                  minimumFractionDigits: 2,
                                                  maximumFractionDigits: 2,
                                              })
                                            : ''}
                                        {payment.new_payment !== null && <span className="ml-1 text-sm">฿</span>}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600 text-center justify-center items-center">
                                        {payment.payment_slip ? (
                                            <a
                                                href={`/storage/${payment.payment_slip}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 underline "
                                            >
                                                ดูไฟล์
                                            </a>
                                        ) : (
                                            '-'
                                        )}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                                    <div className="flex flex-col items-center justify-center">
                                        <svg className="mb-2 h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    );
}
