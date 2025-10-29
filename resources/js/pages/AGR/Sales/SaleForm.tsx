import Button from '@/components/Buttons/Button';
import InputLabel from '@/components/Inputs/InputLabel';
import { useForm } from '@inertiajs/react';
import dayjs from 'dayjs';
import 'dayjs/locale/th';
import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import CustomerSelect from './CustomerSelect';
import SaleProductSelect from './SaleProductSelect';

// ✅ utility ฟังก์ชัน แก้ปัญหา date format
function formatDateSafe(date: string | null | undefined) {
    const d = dayjs(date);
    return d.isValid() ? d.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD');
}

type SaleFormProps = {
    mode?: 'create' | 'edit';
    sale?: any;
    products: any[];
    customers?: any[];
    locations?: any[];
    payments?: any[];
    onClose: () => void;
    onSuccess?: () => void;
};

// ตัวเลือกประเภทการชำระเงิน
const paymentOptions = [
    { value: '', label: 'เลือกประเภทการชำระเงิน ...', disabled: true },
    { value: '1', label: 'เงินสด' },
    { value: '2', label: 'โอนเงิน' },
    { value: '3', label: 'บัตรเครดิต/เดบิต' },
    { value: '4', label: 'อื่นๆ' },
];

// ตัวเลือกสถานะการชำระเงิน
const paymentStatusOptions = [
    { value: 'completed', label: 'ชำระเต็มจำนวน', color: 'text-green-600 bg-green-100' },
    { value: 'partial', label: 'ชำระบางส่วน', color: 'text-orange-600 bg-orange-100' },
    { value: 'pending', label: 'ค้างชำระ', color: 'text-red-600 bg-red-100' },
];

export default function SaleForm({ mode = 'create', sale, products, customers = [], locations, payments, onClose, onSuccess }: SaleFormProps) {
    const [showPaymentDetails, setShowPaymentDetails] = useState(false);

    const { data, setData, post, put, reset, processing, errors } = useForm({
        id: sale?.id || '',
        sale_date: formatDateSafe(sale?.sale_date),
        customer: sale?.customer || '',
        customer_id: sale?.customer_id || '',
        product_id: sale?.product_id || '',
        quantity: sale?.quantity || 0,
        price: sale?.price || '',
        deposit: sale?.deposit || '',
        status: sale?.status || 'completed',
        store_id: sale?.store_id || '',
        paid_amount: sale?.paid_amount || 0,
        total_amount: sale?.total_amount || '',
        deposit_percent: sale?.deposit_percent || '',
        shipping_cost: sale?.shipping_cost || 0,
        method: sale?.method || '',
        payment_slip: null,
        note: sale?.note || '',
        payment_status: sale?.payment_status || 'completed', // ✅ เพิ่มสถานะการชำระเงิน
    });

    // กรองสินค้าตาม store_id ถ้ามี
    const filteredProducts = React.useMemo(() => {
        return products?.filter((pro) => !data.store_id || Number(pro.store_id) === Number(data.store_id)) ?? [];
    }, [products, data.store_id]);

    // คำนวณยอดรวมอัตโนมัติ
    const calculatedTotal = React.useMemo(() => {
        const quantity = Number(data.quantity) || 0;
        const price = Number(data.price) || 0;
        const shipping = Number(data.shipping_cost) || 0;
        return quantity * price + shipping;
    }, [data.quantity, data.price, data.shipping_cost]);

    // คำนวณยอดค้างชำระ
    const pendingAmount = React.useMemo(() => {
        const total = calculatedTotal;
        const paid = Number(data.paid_amount) || 0;
        return Math.max(0, total - paid);
    }, [calculatedTotal, data.paid_amount]);

    // ตรวจสอบว่าต้องแสดงส่วนการชำระเงินหรือไม่
    const shouldShowPaymentDetails = React.useMemo(() => {
        return data.payment_status !== 'completed' || showPaymentDetails;
    }, [data.payment_status, showPaymentDetails]);

    useEffect(() => {
        if (sale) {
            reset({
                ...sale,
                sale_date: formatDateSafe(sale.sale_date),
                paid_amount: sale.paid_amount || 0,
                payment_status: sale.payment_status || 'completed',
            });
            // แสดงรายละเอียดการชำระเงินถ้ามีการชำระบางส่วนหรือค้างชำระ
            if (sale.payment_status === 'partial' || sale.payment_status === 'pending') {
                setShowPaymentDetails(true);
            }
        }
    }, [sale]);

    // อัพเดทยอดรวมเมื่อข้อมูลเปลี่ยน
    useEffect(() => {
        setData('total_amount', calculatedTotal.toString());

        // ถ้าชำระเต็มจำนวน ให้ตั้งค่า paid_amount = total_amount
        if (data.payment_status === 'completed') {
            setData('paid_amount', calculatedTotal.toString());
        }
    }, [calculatedTotal, data.payment_status]);

    const handlePaymentStatusChange = (status: string) => {
        setData('payment_status', status);

        switch (status) {
            case 'completed':
                setData('paid_amount', calculatedTotal.toString());
                setShowPaymentDetails(false);
                break;
            case 'partial':
                setShowPaymentDetails(true);
                // ถ้ายังไม่มีค่าที่ชำระ ให้ตั้งเป็น 0
                if (!data.paid_amount || data.paid_amount === calculatedTotal) {
                    setData('paid_amount', '0');
                }
                break;
            case 'pending':
                setData('paid_amount', '0');
                setShowPaymentDetails(true);
                break;
        }
    };

    const handlePaidAmountChange = (value: string) => {
        const paid = Number(value) || 0;
        const total = calculatedTotal;

        setData('paid_amount', value);

        // อัพเดทสถานะอัตโนมัติตามจำนวนที่ชำระ
        if (paid >= total) {
            setData('payment_status', 'completed');
        } else if (paid > 0) {
            setData('payment_status', 'partial');
        } else {
            setData('payment_status', 'pending');
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // ตรวจสอบว่ามีการเลือกวิธีการชำระเงินหรือไม่
        if (!data.method) {
            Swal.fire({
                icon: 'warning',
                title: 'กรุณาเลือกประเภทการชำระเงิน',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                customClass: {
                    popup: 'custom-swal font-anuphan',
                    title: 'font-anuphan text-orange-800',
                },
            });
            return;
        }

        // ตรวจสอบจำนวนที่ชำระไม่เกินยอดรวม
        if (Number(data.paid_amount) > calculatedTotal) {
            Swal.fire({
                icon: 'warning',
                title: 'จำนวนที่ชำระต้องไม่เกินยอดรวม',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                customClass: {
                    popup: 'custom-swal font-anuphan',
                    title: 'font-anuphan text-orange-800',
                },
            });
            return;
        }

        if (mode === 'create') {
            post('/sales', {
                onSuccess: () => {
                    Swal.fire({
                        icon: 'success',
                        title: 'บันทึกเรียบร้อยแล้ว',
                        toast: true,
                        position: 'top-end',
                        showConfirmButton: false,
                        timer: 3000,
                        customClass: {
                            popup: 'custom-swal font-anuphan',
                            title: 'font-anuphan text-green-800',
                            htmlContainer: 'font-anuphan text-green-600',
                        },
                    });
                    reset();
                    onClose?.();
                    onSuccess?.();
                },
                onError: () => {
                    Swal.fire({
                        icon: 'error',
                        title: 'เกิดข้อผิดพลาด',
                        text: 'กรุณาตรวจสอบข้อมูลอีกครั้ง',
                        toast: true,
                        position: 'top-end',
                        showConfirmButton: false,
                        timer: 3000,
                        customClass: {
                            popup: 'custom-swal font-anuphan',
                            title: 'font-anuphan text-red-800',
                            htmlContainer: 'font-anuphan text-red-500',
                        },
                    });
                },
            });
        } else {
            put(`/sales/${sale?.id}`, {
                onSuccess: () => {
                    Swal.fire({
                        icon: 'success',
                        title: 'อัปเดตเรียบร้อยแล้ว',
                        toast: true,
                        position: 'top-end',
                        showConfirmButton: false,
                        timer: 3000,
                        customClass: {
                            popup: 'custom-swal font-anuphan',
                            title: 'font-anuphan text-green-800',
                            htmlContainer: 'font-anuphan text-green-600',
                        },
                    });
                    reset();
                    onClose?.();
                    onSuccess?.();
                },
                onError: () => {
                    Swal.fire({
                        icon: 'error',
                        title: 'เกิดข้อผิดพลาด',
                        text: 'กรุณาตรวจสอบข้อมูลอีกครั้ง',
                        toast: true,
                        position: 'top-end',
                        showConfirmButton: false,
                        timer: 3000,
                        customClass: {
                            popup: 'custom-swal font-anuphan',
                            title: 'font-anuphan text-red-800',
                            htmlContainer: 'font-anuphan text-red-500',
                        },
                    });
                },
            });
        }
    };

    const getPaymentMethodIcon = (method: string) => {
        switch (method) {
            case '1':
                return '💵';
            case '2':
                return '🏦';
            case '3':
                return '💳';
            case '4':
                return '📝';
            default:
                return '💰';
        }
    };

    const getPaymentStatusIcon = (status: string) => {
        switch (status) {
            case 'completed':
                return '✅';
            case 'partial':
                return '🟡';
            case 'pending':
                return '❌';
            default:
                return '❓';
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 font-anuphan">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* วันที่ขาย */}
                <div className="space-y-2">
                    <InputLabel
                        label={
                            <div className="flex items-center gap-2">
                                <span className="text-lg">📅</span>
                                <span>วันที่ขาย</span>
                                <span className="text-red-500">*</span>
                            </div>
                        }
                        name="sale_date"
                        value={data.sale_date}
                        onChange={(e) => setData('sale_date', e.target.value)}
                        error={errors.sale_date}
                        disabled={processing}
                        type="date"
                        className="font-anuphan"
                    />
                </div>

                {/* ลูกค้า */}
                <div className="space-y-2">
                    <CustomerSelect
                        customers={customers}
                        value={data.customer_id}
                        onChange={(value: string) => setData('customer_id', value)}
                        placeholder="เลือกลูกค้า"
                        showSearch
                        showClear
                        label={
                            <div className="flex items-center gap-2">
                                <span className="text-lg">👤</span>
                                <span>ลูกค้า</span>
                                <span className="text-red-500">*</span>
                            </div>
                        }
                        disabled={processing}
                    />
                </div>

                {/* สินค้า */}
                <div className="space-y-2">
                    <SaleProductSelect
                        products={filteredProducts}
                        value={data.product_id}
                        onChange={(value: string) => {
                            setData('product_id', value);
                            const selected = filteredProducts.find((p) => p.id.toString() === value);
                            if (selected?.price) {
                                setData('price', selected.price.toString());
                            }
                        }}
                        placeholder="เลือกสินค้าเกษตร"
                        showSearch
                        showClear
                        label={
                            <div className="flex items-center gap-2">
                                <span className="text-lg">🌱</span>
                                <span>สินค้า</span>
                                <span className="text-red-500">*</span>
                            </div>
                        }
                        disabled={processing}
                    />
                </div>

                {/* จำนวน */}
                <div className="space-y-2">
                    <InputLabel
                        label={
                            <div className="flex items-center gap-2">
                                <span className="text-lg">📦</span>
                                <span>จำนวน</span>
                                <span className="text-red-500">*</span>
                            </div>
                        }
                        name="quantity"
                        value={data.quantity}
                        onChange={(e) => {
                            const value = Number(e.target.value || 0);
                            const selected = filteredProducts.find((p) => p.id.toString() === data.product_id);
                            const maxStock = selected?.stock ?? Infinity;

                            if (value > maxStock) {
                                Swal.fire({
                                    icon: 'warning',
                                    title: `จำนวนสูงสุดที่มีคือ ${maxStock}`,
                                    customClass: { popup: 'custom-swal' },
                                });
                                setData('quantity', maxStock.toString());
                                return;
                            }

                            setData('quantity', value.toString());
                        }}
                        error={errors.quantity}
                        disabled={processing}
                        type="number"
                        min={0}
                        step={0.5}
                        className="font-anuphan"
                    />
                </div>

                {/* ราคา */}
                <div className="space-y-2">
                    <InputLabel
                        label={
                            <div className="flex items-center gap-2">
                                <span className="text-lg">💰</span>
                                <span>ราคาต่อหน่วย</span>
                            </div>
                        }
                        name="price"
                        value={data.price}
                        onChange={(e) => setData('price', e.target.value)}
                        error={errors.price}
                        disabled={processing}
                        type="number"
                        min={0}
                        step={0.5}
                        className="font-anuphan"
                    />
                </div>

                {/* ค่าขนส่ง */}
                <div className="space-y-2">
                    <InputLabel
                        label={
                            <div className="flex items-center gap-2">
                                <span className="text-lg">🚚</span>
                                <span>ค่าขนส่ง</span>
                            </div>
                        }
                        name="shipping_cost"
                        value={data.shipping_cost}
                        onChange={(e) => setData('shipping_cost', e.target.value)}
                        error={errors.shipping_cost}
                        disabled={processing}
                        type="number"
                        min={0}
                        step={0.5}
                        className="font-anuphan"
                    />
                </div>

                {/* ประเภทการชำระเงิน */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                        <div className="mb-2 flex items-center gap-2">
                            <span className="text-lg">💳</span>
                            <span>ประเภทการชำระเงิน</span>
                            <span className="text-red-500">*</span>
                        </div>
                    </label>
                    <div className="relative">
                        <select
                            name="method"
                            value={data.method}
                            onChange={(e) => setData('method', e.target.value)}
                            disabled={processing}
                            className={`w-full appearance-none rounded-xl border-0 bg-gradient-to-br from-gray-50 to-white px-4 py-3 pr-12 font-anuphan shadow-sm transition-all duration-200 focus:ring-1 focus:ring-blue-500 focus:ring-offset-1 focus:outline-none ${
                                errors.method ? 'ring-2 ring-red-300' : 'ring-1 ring-gray-300'
                            } ${processing ? 'cursor-not-allowed text-gray-400' : 'cursor-pointer text-gray-900 hover:shadow-md'}`}
                        >
                            {paymentOptions.map((option) => (
                                <option
                                    key={option.value}
                                    value={option.value}
                                    disabled={option.disabled}
                                    className={`font-anuphan ${option.disabled ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-900'}`}
                                >
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        {/* Custom dropdown arrow with animation */}
                        <div
                            className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 ${
                                processing ? 'text-gray-400' : 'text-blue-500'
                            }`}
                        >
                            <div className="rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 p-1">
                                <svg className="h-4 w-4 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                    </div>
                    {errors.method && (
                        <p className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                            <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            {errors.method}
                        </p>
                    )}
                </div>

                {/* สถานะการชำระเงิน */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                        <div className="mb-2 flex items-center gap-2">
                            <span className="text-lg">📊</span>
                            <span>สถานะการชำระเงิน</span>
                            <span className="text-red-500">*</span>
                        </div>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                        {paymentStatusOptions.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => handlePaymentStatusChange(option.value)}
                                disabled={processing}
                                className={`rounded-lg border p-3 text-center transition-all ${
                                    data.payment_status === option.value
                                        ? `${option.color} border-2 border-current font-bold`
                                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                } ${processing ? 'cursor-not-allowed opacity-50' : ''}`}
                            >
                                <div className="text-sm font-medium">
                                    {getPaymentStatusIcon(option.value)} {option.label}
                                </div>
                            </button>
                        ))}
                    </div>
                    {errors.payment_status && <p className="text-sm text-red-600">{errors.payment_status}</p>}
                </div>
            </div>

            {/* รายละเอียดการชำระเงิน (แสดงเมื่อไม่ชำระเต็มจำนวน) */}
            {shouldShowPaymentDetails && (
                <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
                    <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-orange-800">
                        <span>💸</span>
                        รายละเอียดการชำระเงิน
                    </h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <InputLabel
                                label={
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">💰</span>
                                        <span>จำนวนที่ชำระแล้ว</span>
                                    </div>
                                }
                                name="paid_amount"
                                value={data.paid_amount}
                                onChange={(e) => handlePaidAmountChange(e.target.value)}
                                error={errors.paid_amount}
                                disabled={processing}
                                type="number"
                                min={0}
                                max={calculatedTotal}
                                step={0.5}
                                className="font-anuphan"
                            />
                            <p className="text-xs text-orange-600">จำนวนที่ชำระแล้วต้องไม่เกินยอดรวม {calculatedTotal.toLocaleString()} บาท</p>
                        </div>

                        <div className="rounded-lg bg-white p-4">
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">ยอดรวม:</span>
                                    <span className="font-semibold">{calculatedTotal.toLocaleString()} บาท</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">ชำระแล้ว:</span>
                                    <span className="font-semibold text-green-600">{Number(data.paid_amount || 0).toLocaleString()} บาท</span>
                                </div>
                                <div className="flex justify-between border-t border-gray-200 pt-2">
                                    <span className="font-medium text-gray-800">ค้างชำระ:</span>
                                    <span className={`font-bold ${pendingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        {pendingAmount.toLocaleString()} บาท
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Summary Card */}
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-blue-800">
                    <span>🧮</span>
                    สรุปยอดขาย
                </h3>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div className="rounded-lg bg-white p-3 shadow-sm">
                        <p className="text-sm text-gray-600">จำนวนสินค้า</p>
                        <p className="text-lg font-bold text-blue-600">{data.quantity || 0} ต้น</p>
                    </div>
                    <div className="rounded-lg bg-white p-3 shadow-sm">
                        <p className="text-sm text-gray-600">ราคารวม</p>
                        <p className="text-lg font-bold text-green-600">
                            {((Number(data.quantity) || 0) * (Number(data.price) || 0)).toLocaleString()} บาท
                        </p>
                    </div>
                    <div className="rounded-lg bg-white p-3 shadow-sm">
                        <p className="text-sm text-gray-600">ยอดรวมทั้งสิ้น</p>
                        <p className="text-xl font-bold text-purple-600">{calculatedTotal.toLocaleString()} บาท</p>
                    </div>
                </div>

                {/* สถานะการชำระเงินสรุป */}
                <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                    {data.method && (
                        <div className="flex items-center gap-3 rounded-lg bg-white p-3">
                            <span className="text-2xl">{getPaymentMethodIcon(data.method)}</span>
                            <div>
                                <p className="text-sm text-gray-600">วิธีการชำระเงิน</p>
                                <p className="font-semibold text-gray-800">{paymentOptions.find((opt) => opt.value === data.method)?.label}</p>
                            </div>
                        </div>
                    )}

                    <div
                        className={`flex items-center gap-3 rounded-lg p-3 ${
                            data.payment_status === 'completed' ? 'bg-green-100' : data.payment_status === 'partial' ? 'bg-orange-100' : 'bg-red-100'
                        }`}
                    >
                        <span className="text-2xl">{getPaymentStatusIcon(data.payment_status)}</span>
                        <div>
                            <p className="text-sm text-gray-600">สถานะการชำระเงิน</p>
                            <p
                                className={`font-semibold ${
                                    data.payment_status === 'completed'
                                        ? 'text-green-800'
                                        : data.payment_status === 'partial'
                                          ? 'text-orange-800'
                                          : 'text-red-800'
                                }`}
                            >
                                {paymentStatusOptions.find((opt) => opt.value === data.payment_status)?.label}
                                {pendingAmount > 0 && ` (ค้างชำระ ${pendingAmount.toLocaleString()} บาท)`}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* หมายเหตุ */}
            <div className="space-y-2">
                <InputLabel
                    label={
                        <div className="flex items-center gap-2">
                            <span className="text-lg">📝</span>
                            <span>หมายเหตุ</span>
                        </div>
                    }
                    name="note"
                    value={data.note}
                    onChange={(e) => setData('note', e.target.value)}
                    error={errors.note}
                    disabled={processing}
                    type="text"
                    placeholder="บันทึกหมายเหตุเพิ่มเติม (ถ้ามี)"
                    className="font-anuphan"
                />
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-3 border-t border-gray-200 pt-6">
                <Button type="button" variant="secondary" onClick={onClose} disabled={processing} className="flex items-center gap-2">
                    <span>❌</span>
                    ยกเลิก
                </Button>
                <Button type="submit" variant="primary" disabled={processing} className="flex items-center gap-2">
                    {processing ? (
                        <>
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                            กำลังบันทึก...
                        </>
                    ) : (
                        <>
                            <span>{mode === 'create' ? '💾' : '✏️'}</span>
                            {mode === 'create' ? 'บันทึกข้อมูล' : 'อัปเดตข้อมูล'}
                        </>
                    )}
                </Button>
            </div>

            {/* Error Summary */}
            {Object.keys(errors).length > 0 && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                    <div className="mb-2 flex items-center gap-2">
                        <span className="text-lg">⚠️</span>
                        <h4 className="text-sm font-medium text-red-800">กรุณาตรวจสอบข้อมูลต่อไปนี้:</h4>
                    </div>
                    <ul className="list-inside list-disc space-y-1 text-sm text-red-600">
                        {Object.entries(errors).map(([field, error]) => (
                            <li key={field}>{error as string}</li>
                        ))}
                    </ul>
                </div>
            )}
        </form>
    );
}
