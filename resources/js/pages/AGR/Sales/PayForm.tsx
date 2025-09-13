import Button from '@/components/Buttons/Button';
import InputLabel from '@/components/Inputs/InputLabel';
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

interface Sale {
    id?: number;
    sale_date: string;
    customer: string;
    customer_id: number | string; // ← ปรับ
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
}

interface Payment {
    id: number;
    paid_at: string;
    method: number;
    amount: number;
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

export default function PayForm({ mode = 'create', sale, products, customers = [], locations, onClose, payments }: PayFormProps) {
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
        paid_amount: sale?.paid_amount || '', // ยอดชำระเดิม
        new_payment: '', // ยอดชำระใหม่ที่เพิ่ม
        total_amount: sale?.total_amount || '',
        deposit_percent: sale?.deposit_percent || '',
        shipping_cost: sale?.shipping_cost || '',
    });

    // State สำหรับจัดการยอดคงค้าง
    const [remainingBalance, setRemainingBalance] = useState(0);
    const [totalPaid, setTotalPaid] = useState(0);

    // คำนวณยอดคงค้างเมื่อโหลด component หรือเมื่อมีการเปลี่ยนแปลง
    useEffect(() => {
        if (sale) {
            const currentPaid = parseFloat(sale.paid_amount || '0');
            const total = parseFloat(sale.total_amount || '0');
            const newPayment = parseFloat(data.new_payment || '0');

            // คำนวณยอดชำระรวม (เดิม + ใหม่)
            const updatedTotalPaid = currentPaid + newPayment;

            // คำนวณยอดคงค้าง
            const updatedRemainingBalance = Math.max(0, total - updatedTotalPaid);

            setTotalPaid(updatedTotalPaid);
            setRemainingBalance(updatedRemainingBalance);

            // อัปเดต deposit ด้วยยอดคงค้างใหม่
            setData('deposit', updatedRemainingBalance.toString());
        }
    }, [data.new_payment, sale]);

    // เมื่อกดปุ่มชำระเต็มจำนวน
    const handleFullPayment = () => {
        setData('new_payment', remainingBalance.toString());
    };

    const getCustomerName = (id: number) => {
        const customer = customers.find((c) => c.id === id);
        return customer ? customer.name : `#${id}`;
    };

    const formatPhone = (phone: string) => {
        const digits = phone.replace(/\D/g, ''); // เอาเฉพาะตัวเลข
        return digits.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
    };

    const getCustomerPhone = (id: number) => {
        const customer = customers.find((c) => c.id === id);
        if (!customer) return `#${id}`;

        return formatPhone(customer.phone);
    };

    // ฟังก์ชันช่วยหาชื่อสินค้า
    const getProductName = (id: number) => {
        const product = products.find((p) => p.id === id);
        return product ? product.name : `#${id}`;
    };

    // ... (other functions and useEffect remain mostly the same) ...

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

        // เตรียมข้อมูลสำหรับส่ง - รวมยอดชำระเดิมและใหม่
        const submitData = {
            ...data,
            paid_amount: totalPaid.toString(), // ส่งยอดชำระรวมไป
            deposit: remainingBalance.toString(), // ส่งยอดคงค้างใหม่ไป
        };

        if (mode === 'create') {
            router.post(route('sales.store'), submitData, {
                onSuccess: () => {
                    Toast.fire({ icon: 'success', title: 'สร้างการขายเรียบร้อยแล้ว' });
                    reset();
                    onClose();
                },
                onError: () => {
                    Toast.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' });
                },
                preserveScroll: true,
            });
        } else if (mode === 'pay' && data.id) {
            router.put(route('sales.update', data.id), submitData, {
                onSuccess: () => {
                    Toast.fire({ icon: 'success', title: 'อัปเดตการขายเรียบร้อยแล้ว' });
                    onClose();
                },
                onError: () => {
                    Toast.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' });
                },
                preserveScroll: true,
            });
        }
    };
    return (
        <form onSubmit={handleSubmit} className="space-y-6 font-anuphan">
            <div className="grid grid-cols-1 gap-2">
                {/* Product Information Section */}
                <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
                    <h3 className="flex items-center text-lg font-semibold text-gray-800">
                        <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                            <path
                                fillRule="evenodd"
                                d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z"
                                clipRule="evenodd"
                            />
                        </svg>
                        ข้อมูลการขายสินค้า
                    </h3>
                    <span className="text-sm font-medium text-gray-500">
                        วันที่รายการ {sale.sale_date ? dayjs(sale.sale_date).format('DD/MM/YYYY') : '-'}
                    </span>

                    <div className="mt-2 grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-500">ชื่อลูกค้า</span>
                            <span className="text-lg font-medium text-blue-700">{getCustomerName(sale.customer_id)}</span>
                            <span className="text-xs font-medium text-red-700">เบอร์ติดต่อ {getCustomerPhone(sale.customer_id)}</span>
                        </div>

                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-500">สินค้า</span>
                            <span className="text-lg font-medium text-blue-700">{getProductName(sale.product_id)}</span>
                        </div>

                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-500">จำนวนสินค้า</span>
                            <span className="text-xl font-semibold text-blue-700">{sale.quantity}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-500">ยอดเงิน</span>
                            <span className="text-xl font-semibold text-green-600">
                                {parseFloat(sale?.total_amount || '0').toLocaleString('th-TH')} บาท
                            </span>
                        </div>
                    </div>
                </div>

                {/* Payment Input Section */}
                <div className="rounded-xl border border-gray-200 bg-white px-5 py-3 shadow-sm">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="mb-1 flex flex-col">
                            <h3 className="text-lg font-semibold text-gray-800">การชำระเงินเพิ่มเติม</h3>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                        <div>
                            <InputLabel
                                // label="ยอดชำระเพิ่ม"
                                placeholder="0"
                                name="new_payment"
                                value={data.new_payment}
                                onChange={(e) => setData('new_payment', e.target.value)}
                                required={false}
                                error={errors.paid_amount}
                                disabled={processing}
                                type="number"
                                min="0"
                                step="1"
                                className="font-anuphan"
                            />
                            <p className="mt-1.5 pl-2 text-xs text-gray-500">กรุณากรอกยอดชำระเพิ่มเป็นจำนวนเต็ม</p>
                        </div>

                        <div className="flex items-center justify-center">
                            <button
                                type="button"
                                onClick={handleFullPayment}
                                className="rounded-full bg-blue-100 px-4 py-2.5 text-sm font-medium text-blue-700 shadow-sm transition-colors hover:scale-105 hover:bg-blue-200 disabled:cursor-not-allowed disabled:opacity-50"
                                disabled={remainingBalance <= 0}
                            >
                                ชำระเต็มจำนวน
                            </button>
                        </div>
                    </div>
                </div>

                {/* Summary Section */}
                <div className="rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 px-5 py-3 shadow-sm">
                    <h3 className="mb-1 flex items-center text-lg font-semibold text-gray-800">
                        <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                            <path
                                fillRule="evenodd"
                                d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                            />
                        </svg>
                        สรุปรายการ
                    </h3>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {/* Total Paid Card */}
                        <div className="rounded-lg border border-blue-100 bg-white p-4 shadow-sm">
                            <div className="flex items-center justify-between">
                                <span className="font-medium text-gray-600">ชำระแล้วรวม</span>
                                <div className="text-xl font-bold text-blue-600">
                                    {totalPaid.toLocaleString('th-TH', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })}
                                    <span className="ml-1 text-sm">฿</span>
                                </div>
                            </div>
                            <div className="mt-1 text-xs text-gray-500">
                                (เดิม {parseFloat(sale?.paid_amount || '0').toLocaleString('th-TH')} ฿ + ใหม่{' '}
                                {parseFloat(data.new_payment || '0').toLocaleString('th-TH')} ฿)
                            </div>
                        </div>

                        {/* Remaining Balance Card */}
                        <div className="rounded-lg border border-red-100 bg-white p-4 shadow-sm">
                            <div className="flex items-center justify-between">
                                <span className="font-medium text-gray-600">ยอดคงค้าง</span>
                                <div className="text-xl font-bold text-red-600">
                                    {remainingBalance.toLocaleString('th-TH', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })}
                                    <span className="ml-1 text-sm">฿</span>
                                </div>
                            </div>
                        </div>

                        <div className="col-span-2">
                            <h4 className="text-md mb-1 flex items-center font-semibold text-gray-700">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="mr-2 h-4 w-4 text-green-600"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                >
                                    <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                                    <path
                                        fillRule="evenodd"
                                        d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                                ประวัติการชำระเงิน
                            </h4>

                            {sale && (
                                <div className="overflow-hidden rounded-lg border border-gray-200">
                                    <PayTable payments={payments || []} saleId={sale?.id || 0} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>


            {/* Action Buttons */}
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
                    disabled={processing || parseFloat(data.new_payment || '0') <= 0}
                    loading={processing}
                    className="rounded-full bg-green-600 px-5 py-2.5 text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                >
                    บันทึกการชำระ
                </Button>
            </div>
        </form>
    );
}
