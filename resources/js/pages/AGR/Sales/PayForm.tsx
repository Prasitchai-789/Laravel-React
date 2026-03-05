import Button from '@/components/Buttons/Button';
import InputLabel from '@/components/Inputs/InputLabel';
import Select from '@/components/Inputs/Select';
import { router, useForm } from '@inertiajs/react';
import dayjs from 'dayjs';
import 'dayjs/locale/th';
import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import PayTable from './PayTable';

interface Customer {
    id: number;
    name: string;
    phone?: string;
}

interface Product {
    id: number;
    name: string;
    price?: number;
    store_id: number;
    stock?: number;
}

interface Location {
    id: number;
    location_name: string;
}

interface SaleItem {
    id: number;
    product_id: number;
    quantity: number;
    unit_price: number;
    line_total: number;
    paid_amount: number;
    payment_status: string;
}

interface Sale {
    id?: number;
    sale_date: string;
    customer: string;
    customer_id: number | string;
    product_id: number | string;
    quantity: string;
    price: string;
    deposit: string;
    shipping_cost: string;
    status: string;
    store_id: number | string;
    paid_amount: string;
    total_amount: string;
    deposit_percent: string;
    items?: SaleItem[];
}

interface Payment {
    id: number;
    paid_at: string;
    method: string;
    amount: number;
    new_payment: number;
    payment_slip?: string;
}

interface PayFormProps {
    mode?: 'create' | 'edit';
    sale?: Sale;
    payments?: Payment[];
    products?: Product[];
    customers?: Customer[];
    locations?: Location[];
    onClose: () => void;
}

interface ItemPaymentInput {
    sale_item_id: number;
    amount: string;
}

export default function PayForm({ mode = 'create', sale, products, customers = [], locations, onClose, payments }: PayFormProps) {
    // สร้าง state สำหรับยอดชำระแต่ละ item
    const [itemPayments, setItemPayments] = useState<ItemPaymentInput[]>([]);

    const { data, setData, post, put, reset, processing, errors } = useForm({
        id: sale?.id || '',
        sale_date: sale?.sale_date || '',
        customer: sale?.customer || '',
        customer_id: sale?.customer_id || '',
        product_id: sale?.product_id || '',
        quantity: sale?.quantity || 0,
        price: sale?.price || '',
        deposit: sale?.deposit || '',
        status: sale?.status || '',
        store_id: sale?.store_id || '',
        paid_amount: sale?.paid_amount || '',
        new_payment: '',
        total_amount: sale?.total_amount || '',
        deposit_percent: sale?.deposit_percent || '',
        shipping_cost: sale?.shipping_cost || '',
        payment_slip: null,
        method: payments?.length > 0 ? payments[0].method : '1',
        item_payments: [] as { sale_item_id: number; amount: number }[],
    });

    // เริ่มต้น itemPayments จาก sale.items
    useEffect(() => {
        if (sale?.items && sale.items.length > 0) {
            setItemPayments(
                sale.items.map(item => ({
                    sale_item_id: item.id,
                    amount: '',
                }))
            );
        }
    }, [sale]);

    // คำนวณยอดรวมจาก itemPayments
    const totalNewPayment = itemPayments.reduce(
        (sum, ip) => sum + (parseFloat(ip.amount) || 0), 0
    );

    // คำนวณยอดคงค้าง
    const totalAmount = parseFloat(sale?.total_amount || '0');
    const currentPaid = parseFloat(sale?.paid_amount || '0');
    const totalPaid = currentPaid + totalNewPayment;
    const remainingBalance = Math.max(0, totalAmount - totalPaid);

    const updateItemPayment = (index: number, amount: string) => {
        setItemPayments(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], amount };
            return updated;
        });
    };

    const payItemFull = (index: number) => {
        if (!sale?.items) return;
        const item = sale.items[index];
        const remaining = Math.max(0, Number(item.line_total) - Number(item.paid_amount));
        updateItemPayment(index, remaining.toString());
    };

    const payAllFull = () => {
        if (!sale?.items) return;
        setItemPayments(
            sale.items.map(item => ({
                sale_item_id: item.id,
                amount: Math.max(0, Number(item.line_total) - Number(item.paid_amount)).toString(),
            }))
        );
    };

    const getCustomerName = (id: number) => {
        const customer = customers.find((c) => Number(c.id) === Number(id));
        return customer ? customer.name : `#${id}`;
    };

    const formatPhone = (phone: string | null | undefined): string => {
        if (!phone || typeof phone !== 'string') return '';
        const digits = phone.replace(/\D/g, '');
        if (digits.length === 0) return '';
        if (digits.length === 10) return digits.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
        if (digits.length === 9) return digits.replace(/(\d{2})(\d{3})(\d{4})/, '$1-$2-$3');
        return digits;
    };

    const getCustomerPhone = (id: number) => {
        const customer = customers.find((c) => Number(c.id) === Number(id));
        if (!customer) return `#${id}`;
        return formatPhone(customer.phone);
    };

    const getProductName = (id: number) => {
        const product = products?.find((p) => Number(p.id) === Number(id));
        return product ? product.name : `#${id}`;
    };

    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        customClass: { popup: 'custom-swal' },
        didOpen: (toast) => {
            toast.onmouseenter = Swal.stopTimer;
            toast.onmouseleave = Swal.resumeTimer;
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!sale?.id) return;

        const formData = new FormData();

        // แปลง item_payments เป็น array ที่ backend รับได้
        const validItemPayments = itemPayments
            .filter(ip => parseFloat(ip.amount) > 0)
            .map(ip => ({
                sale_item_id: ip.sale_item_id,
                amount: parseFloat(ip.amount),
            }));

        // ✅ ต้องส่ง fields ที่ backend ต้องการ (required)
        formData.append('sale_date', sale.sale_date || '');
        formData.append('invoice_no', (sale as any).invoice_no || '');
        formData.append('customer_id', String(sale.customer_id || ''));
        formData.append('status', sale.status || 'completed');
        formData.append('store_id', String(sale.store_id || ''));
        formData.append('shipping_cost', String(sale.shipping_cost || '0'));
        formData.append('total_amount', String(sale.total_amount || '0'));
        formData.append('paid_amount', totalPaid.toString());
        formData.append('deposit', remainingBalance.toString());
        formData.append('new_payment', totalNewPayment.toString());
        formData.append('method', data.method || '');

        // ✅ ส่ง items จาก sale.items เดิม (backend ต้องการ items required)
        if (sale.items && sale.items.length > 0) {
            sale.items.forEach((item, i) => {
                formData.append(`items[${i}][product_id]`, String(item.product_id));
                formData.append(`items[${i}][quantity]`, String(item.quantity));
                formData.append(`items[${i}][price]`, String(item.unit_price));
                formData.append(`items[${i}][custom_product_id]`, '');
            });
        }

        // Append item_payments as array
        validItemPayments.forEach((ip, i) => {
            formData.append(`item_payments[${i}][sale_item_id]`, ip.sale_item_id.toString());
            formData.append(`item_payments[${i}][amount]`, ip.amount.toString());
        });

        if (data.payment_slip instanceof File) {
            formData.append('payment_slip', data.payment_slip);
        }

        formData.append('_method', 'PUT');
        router.post(route('sales.update', sale.id), formData, {
            forceFormData: true,
            onSuccess: () => {
                Toast.fire({ icon: 'success', title: 'บันทึกการชำระเงินเรียบร้อย' });
                onClose();
            },
            onError: (errors) => {
                console.error('PayForm errors:', errors);
                Toast.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' });
            },
            preserveScroll: true,
        });
    };

    const paymentOptions = [
        { value: '', label: 'เลือกประเภทการชำระเงิน ...', disabled: true },
        { value: '1', label: 'เงินสด' },
        { value: '2', label: 'โอนเงิน' },
        { value: '3', label: 'บัตรเครดิต/เดบิต' },
        { value: '4', label: 'อื่นๆ' },
    ];

    return (
        <form onSubmit={handleSubmit} className="space-y-6 font-anuphan">
            <div className="grid grid-cols-1 gap-2">
                {/* ข้อมูลบิล */}
                <div className="rounded-xl border border-green-200 bg-white px-5 py-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <h3 className="flex items-center text-lg font-semibold text-gray-800">
                            <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
                            </svg>
                            ข้อมูลบิล
                        </h3>
                        <span className="text-sm font-medium text-gray-500">
                            {sale?.sale_date ? dayjs(sale.sale_date).format('DD/MM/YYYY') : '-'}
                        </span>
                    </div>

                    <div className="mt-2 grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-500">ลูกค้า</span>
                            <span className="text-lg font-medium text-blue-700">{getCustomerName(sale?.customer_id as number)}</span>
                            <span className="text-xs font-medium text-red-700">เบอร์: {getCustomerPhone(sale?.customer_id as number) || '-'}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-500">ยอดรวมบิล</span>
                            <span className="text-xl font-semibold text-green-600">
                                {totalAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท
                            </span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-500">ชำระแล้ว</span>
                            <span className="text-xl font-semibold text-blue-600">
                                {currentPaid.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท
                            </span>
                        </div>
                    </div>
                </div>

                {/* ตารางรายการสินค้า - ชำระแยกรายตัว */}
                <div className="rounded-xl border border-blue-200 bg-white px-5 py-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="flex items-center text-lg font-semibold text-gray-800">
                            💰 ชำระเงินแยกรายสินค้า
                        </h3>
                        <button
                            type="button"
                            onClick={payAllFull}
                            className="rounded-full bg-blue-100 px-4 py-1.5 text-sm font-medium text-blue-700 shadow-sm transition-colors hover:scale-105 hover:bg-blue-200"
                            disabled={remainingBalance <= 0}
                        >
                            จ่ายครบทุกรายการ
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200 text-left">
                                    <th className="px-3 py-2 font-medium text-gray-600">สินค้า</th>
                                    <th className="px-3 py-2 text-center font-medium text-gray-600">จำนวน</th>
                                    <th className="px-3 py-2 text-right font-medium text-gray-600">ยอดสินค้า</th>
                                    <th className="px-3 py-2 text-right font-medium text-gray-600">จ่ายแล้ว</th>
                                    <th className="px-3 py-2 text-right font-medium text-gray-600">ค้างชำระ</th>
                                    <th className="px-3 py-2 text-center font-medium text-gray-600">สถานะ</th>
                                    <th className="px-3 py-2 text-center font-medium text-gray-600 min-w-[180px]">ชำระเพิ่ม</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sale?.items && sale.items.map((item, index) => {
                                    const itemRemaining = Math.max(0, Number(item.line_total) - Number(item.paid_amount));
                                    const newPay = parseFloat(itemPayments[index]?.amount || '0');
                                    const statusMap: Record<string, { bg: string, text: string, label: string }> = {
                                        completed: { bg: 'bg-green-100', text: 'text-green-700', label: '✅ ครบ' },
                                        partial: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: '⚠️ บางส่วน' },
                                        pending: { bg: 'bg-red-100', text: 'text-red-700', label: '❌ ค้าง' },
                                    };
                                    const st = statusMap[item.payment_status] || statusMap.pending;

                                    return (
                                        <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                            <td className="px-3 py-3 font-medium text-gray-800">
                                                {getProductName(item.product_id)}
                                            </td>
                                            <td className="px-3 py-3 text-center text-gray-600">
                                                {Number(item.quantity).toLocaleString()}
                                            </td>
                                            <td className="px-3 py-3 text-right font-semibold text-gray-800">
                                                {Number(item.line_total).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-3 py-3 text-right font-semibold text-green-600">
                                                {Number(item.paid_amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-3 py-3 text-right font-semibold text-red-600">
                                                {itemRemaining.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-3 py-3 text-center">
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${st.bg} ${st.text}`}>
                                                    {st.label}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3">
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        max={itemRemaining}
                                                        placeholder="0"
                                                        value={itemPayments[index]?.amount || ''}
                                                        onChange={(e) => updateItemPayment(index, e.target.value)}
                                                        disabled={processing || itemRemaining <= 0}
                                                        className="w-24 rounded-lg border border-gray-300 px-2 py-1.5 text-right text-sm font-anuphan focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => payItemFull(index)}
                                                        disabled={itemRemaining <= 0}
                                                        className="whitespace-nowrap rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700 hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                    >
                                                        เต็ม
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* วิธีชำระเงิน + ไฟล์แนบ */}
                <div className="rounded-xl border border-yellow-200 bg-white px-5 py-3 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">รายละเอียดการชำระ</h3>
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                        <div>
                            <Select
                                label="ประเภทการชำระเงิน"
                                name="method"
                                value={data.method}
                                onChange={(e) => setData('method', e.target.value)}
                                options={paymentOptions}
                                required={false}
                                error={errors.method}
                                disabled={processing}
                                className="font-anuphan"
                            ></Select>
                        </div>
                        <div>
                            <InputLabel
                                label="แนบไฟล์หลักฐาน"
                                name="payment_slip"
                                type="file"
                                accept="image/*,.pdf"
                                onChange={(e) => setData({ ...data, payment_slip: e.target.files[0] })}
                                required={false}
                                error={errors.payment_slip}
                                disabled={processing}
                                className="font-anuphan"
                            />
                            <p className="mt-1 pl-2 text-xs text-gray-500">รองรับ รูปภาพ / PDF</p>
                        </div>
                    </div>
                </div>

                {/* สรุป */}
                <div className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-3 shadow-sm">
                    <h3 className="mb-2 flex items-center text-lg font-semibold text-gray-800">🧮 สรุปการชำระ</h3>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        <div className="rounded-lg border border-blue-100 bg-white p-3 shadow-sm">
                            <div className="flex items-center justify-between">
                                <span className="font-medium text-gray-600">ชำระครั้งนี้</span>
                                <div className="text-xl font-bold text-orange-600">
                                    {totalNewPayment.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                                    <span className="ml-1 text-sm">฿</span>
                                </div>
                            </div>
                        </div>
                        <div className="rounded-lg border border-blue-100 bg-white p-3 shadow-sm">
                            <div className="flex items-center justify-between">
                                <span className="font-medium text-gray-600">ชำระรวม</span>
                                <div className="text-xl font-bold text-blue-600">
                                    {totalPaid.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                                    <span className="ml-1 text-sm">฿</span>
                                </div>
                            </div>
                            <div className="mt-1 text-xs text-gray-500">
                                (เดิม {currentPaid.toLocaleString('th-TH')} ฿ + ใหม่ {totalNewPayment.toLocaleString('th-TH')} ฿)
                            </div>
                        </div>
                        <div className="rounded-lg border border-red-100 bg-white p-3 shadow-sm">
                            <div className="flex items-center justify-between">
                                <span className="font-medium text-gray-600">ยอดคงค้าง</span>
                                <div className="text-xl font-bold text-red-600">
                                    {remainingBalance.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                                    <span className="ml-1 text-sm">฿</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ประวัติชำระเงิน */}
                    <div className="mt-3">
                        <h4 className="text-md mb-1 flex items-center font-semibold text-gray-700">
                            💳 ประวัติการชำระเงิน
                        </h4>
                        {sale && (
                            <div className="overflow-hidden rounded-lg border border-gray-200">
                                <PayTable payments={payments || []} saleId={sale?.id || 0} />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3">
                <Button
                    type="button"
                    variant="secondary"
                    onClick={onClose}
                    disabled={processing}
                    className="rounded-full border border-gray-300 px-5 py-2.5 transition-colors hover:bg-gray-50"
                >
                    ยกเลิก
                </Button>
                <Button
                    type="submit"
                    variant="primary"
                    disabled={processing || totalNewPayment <= 0}
                    loading={processing}
                    className="rounded-full bg-green-600 px-5 py-2.5 text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                >
                    บันทึกการชำระ
                </Button>
            </div>
        </form>
    );
}
