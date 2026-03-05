import Button from '@/components/Buttons/Button';
import InputLabel from '@/components/Inputs/InputLabel';
import { useForm } from '@inertiajs/react';
import dayjs from 'dayjs';
import 'dayjs/locale/th';
import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import CustomerSelect from './CustomerSelect';
import SaleProductSelect from './SaleProductSelect';
import { formatNumber, parseNumber, formatDateSafe } from './utils/formatters';

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

type SaleItem = {
    id?: number;
    product_id: string;
    custom_product_id: string; // The new extra product ID tracking
    quantity: string;
    price: string;
};

type SaleFormProps = {
    mode?: 'create' | 'edit';
    sale?: any;
    products: any[];
    customers?: any[];
    locations?: any[];
    payments?: any[];
    next_reference?: string;
    onClose: () => void;
    onSuccess?: () => void;
    itemIndex?: number | null;
};

export default function SaleForm({ mode = 'create', sale, products, customers = [], locations, payments, next_reference, onClose, onSuccess, itemIndex }: SaleFormProps) {
    const [showPaymentDetails, setShowPaymentDetails] = useState(false);

    // Initial items based on whether it's edit or create
    const initialItems: SaleItem[] = sale?.items && sale.items.length > 0
        ? sale.items.map((item: any) => ({
            id: item.id,
            product_id: item.product_id?.toString() || '',
            custom_product_id: item.custom_product_id?.toString() || next_reference || '',
            quantity: parseNumber(item.quantity?.toString() || '0'),
            price: parseNumber(item.unit_price?.toString() || item.price?.toString() || '0'),
        }))
        : sale?.product_id
            ? [{ product_id: sale.product_id.toString(), custom_product_id: sale.custom_product_id?.toString() || next_reference || '', quantity: parseNumber(sale.quantity?.toString() || '0'), price: parseNumber(sale.price?.toString() || '0') }]
            : [{ product_id: '', custom_product_id: next_reference || '', quantity: '0', price: '' }];

    const { data, setData, post, put, reset, processing, errors, clearErrors, transform } = useForm({
        id: sale?.id || '',
        invoice_no: sale?.invoice_no || '',
        sale_date: formatDateSafe(sale?.sale_date),
        customer_id: sale?.customer_id?.toString() || '',
        items: initialItems,
        deposit: sale?.deposit ? parseNumber(sale.deposit) : '',
        status: sale?.status || 'completed',
        store_id: sale?.store_id || '',
        paid_amount: sale?.paid_amount ? parseNumber(sale.paid_amount) : '0',
        total_amount: sale?.total_amount ? parseNumber(sale.total_amount) : '',
        deposit_percent: sale?.deposit_percent ? parseNumber(sale.deposit_percent) : '',
        shipping_cost: sale?.shipping_cost ? parseNumber(sale.shipping_cost) : '0',
        method: sale?.method || '',
        payment_slip: null,
        note: sale?.note || '',
        payment_status: sale?.payment_status || 'completed',
    });

    // กรองสินค้าตาม store_id ถ้ามี
    const filteredProducts = React.useMemo(() => {
        return products?.filter((pro) => !data.store_id || Number(pro.store_id) === Number(data.store_id)) ?? [];
    }, [products, data.store_id]);

    // คำนวณยอดรวมอัตโนมัติตากรายการสินค้าทั้งหมด
    const itemsTotal = React.useMemo(() => {
        return data.items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.price) || 0), 0);
    }, [data.items]);

    const totalQuantity = React.useMemo(() => {
        return data.items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    }, [data.items]);

    // คำนวณยอดเฉพาะสินค้าที่เลือก (ถ้ามี itemIndex)
    const selectedItemTotal = React.useMemo(() => {
        if (itemIndex === null || itemIndex === undefined || !data.items[itemIndex]) return null;
        const item = data.items[itemIndex];
        return (Number(item.quantity) || 0) * (Number(item.price) || 0);
    }, [data.items, itemIndex]);

    const selectedItemQuantity = React.useMemo(() => {
        if (itemIndex === null || itemIndex === undefined || !data.items[itemIndex]) return null;
        return Number(data.items[itemIndex].quantity) || 0;
    }, [data.items, itemIndex]);

    const calculatedTotal = React.useMemo(() => {
        const shipping = Number(data.shipping_cost) || 0;
        return itemsTotal + shipping;
    }, [itemsTotal, data.shipping_cost]);

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

    // แสดงแจ้งเตือนเมื่อมี Validation Error จาก Backend
    useEffect(() => {
        if (Object.keys(errors).length > 0) {
            console.error('Backend validation errors:', errors);
            const errorMessages = Object.values(errors).join('\\n');
            Swal.fire({
                icon: 'error',
                title: 'ข้อมูลไม่ถูกต้อง',
                text: errorMessages,
                customClass: { popup: 'custom-swal font-anuphan' }
            });
        }
    }, [errors]);

    useEffect(() => {
        if (sale) {
            const parsedItems: SaleItem[] = sale?.items && sale.items.length > 0
                ? sale.items.map((item: any) => ({
                    id: item.id,
                    product_id: item.product_id?.toString() || '',
                    custom_product_id: item.custom_product_id?.toString() || '',
                    quantity: parseNumber(item.quantity?.toString() || '0'),
                    price: parseNumber(item.unit_price?.toString() || item.price?.toString() || '0'),
                }))
                : sale?.product_id
                    ? [{ product_id: sale.product_id.toString(), custom_product_id: sale.custom_product_id?.toString() || '', quantity: parseNumber(sale.quantity?.toString() || '0'), price: parseNumber(sale.price?.toString() || '0') }]
                    : [{ product_id: '', custom_product_id: '', quantity: '0', price: '' }];

            reset({
                ...sale,
                invoice_no: sale.invoice_no || '',
                sale_date: formatDateSafe(sale.sale_date),
                customer_id: sale.customer_id?.toString() || '',
                items: parsedItems,
                paid_amount: sale.paid_amount ? parseNumber(sale.paid_amount) : '0',
                shipping_cost: sale.shipping_cost ? parseNumber(sale.shipping_cost) : '0',
                total_amount: sale.total_amount ? parseNumber(sale.total_amount) : '0',
                deposit: sale.deposit ? parseNumber(sale.deposit) : '0',
                payment_status: sale.payment_status || 'completed',
                method: sale.method || '',
                note: sale.note || '',
            });

            if (sale.payment_status === 'partial' || sale.payment_status === 'pending') {
                setShowPaymentDetails(true);
            }
        } else if (mode === 'create') {
            // เมื่อเปิดหน้าสร้างใหม่ ให้ล้างข้อมูลเดิมทิ้ง และใส่เลขที่เอกสารถัดไป
            reset();
            if (next_reference) {
                setData('invoice_no', next_reference);
            }
            setShowPaymentDetails(false);
        }
    }, [sale, mode, next_reference]);

    // ซิงค์ custom_product_id กับ invoice_no อัตโนมัติในโหมดสร้างใหม่
    useEffect(() => {
        if (mode === 'create' && data.invoice_no) {
            const newItems = data.items.map(item => ({
                ...item,
                custom_product_id: data.invoice_no
            }));

            // ตรวจสอบว่าเปลี่ยนจริงๆ ไหมเพื่อป้องกัน infinite loop
            const isChanged = data.items.some(item => item.custom_product_id !== data.invoice_no);
            if (isChanged) {
                setData('items', newItems);
            }
        }
    }, [data.invoice_no, mode]);

    // อัพเดทยอดรวมเมื่อข้อมูลเปลี่ยน
    useEffect(() => {
        setData('total_amount', formatNumber(calculatedTotal));

        if (data.payment_status === 'completed') {
            setData('paid_amount', formatNumber(calculatedTotal));
        }
    }, [calculatedTotal, data.payment_status]);

    const handlePaymentStatusChange = (status: string) => {
        setData('payment_status', status);

        switch (status) {
            case 'completed':
                setData('paid_amount', formatNumber(calculatedTotal));
                setShowPaymentDetails(false);
                break;
            case 'partial':
                setShowPaymentDetails(true);
                if (!data.paid_amount || Number(data.paid_amount) === calculatedTotal) {
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

        if (paid >= total) {
            setData('payment_status', 'completed');
        } else if (paid > 0) {
            setData('payment_status', 'partial');
        } else {
            setData('payment_status', 'pending');
        }
    };

    const handleItemChange = (index: number, field: keyof SaleItem, value: string) => {
        const newItems = [...data.items];

        if (field === 'quantity' || field === 'price') {
            if (value === '' || /^\d*\.?\d*$/.test(value)) {
                newItems[index] = { ...newItems[index], [field]: value };
            }
        } else if (field === 'product_id') {
            newItems[index] = { ...newItems[index], [field]: value };
            const selected = filteredProducts.find(p => p.id.toString() === value || p.sku === value);
            if (selected && selected.price) {
                newItems[index].price = formatNumber(selected.price);
                clearErrors(`items.${index}.product_id` as any);
            }
        } else {
            // General case for fields like custom_product_id
            newItems[index] = { ...newItems[index], [field]: value };
        }

        setData('items', newItems);
    };

    const addItem = () => {
        const firstItem = data.items[0];
        setData('items', [
            ...data.items,
            {
                product_id: firstItem?.product_id || '',
                custom_product_id: firstItem?.custom_product_id || next_reference || '',
                quantity: '0',
                price: firstItem?.price || ''
            }
        ]);
    };

    const removeItem = (index: number) => {
        if (data.items.length > 1) {
            const newItems = [...data.items];
            newItems.splice(index, 1);
            setData('items', newItems);
        }
    };

    const handleNumberChange = (field: string, value: string) => {
        // อนุญาตให้ใส่ทศนิยมได้
        if (value === '' || /^\d*\.?\d*$/.test(value)) {
            setData(field as any, value);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validate items
        const invalidItems = data.items.filter(item => !item.product_id || Number(item.quantity) <= 0);
        if (invalidItems.length > 0) {
            Swal.fire({
                icon: 'warning',
                title: 'กรุณากรอกรหัสสินค้าและจำนวนให้ครบถ้วนทุกรายการ',
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

        const submitData = {
            ...data,
            items: data.items.map(item => ({
                product_id: item.product_id,
                custom_product_id: item.custom_product_id,
                quantity: Number(item.quantity) || 0,
                price: Number(item.price) || 0,
            })),
            paid_amount: Number(data.paid_amount) || 0,
            shipping_cost: Number(data.shipping_cost) || 0,
            total_amount: calculatedTotal,
            quantity: totalQuantity, // สำหรับ backward compatibility
            price: itemsTotal,       // สำหรับ backward compatibility
            product_id: data.items[0]?.product_id || '', // สำหรับ backward compatibility
            // ✅ คำนวณยอดชำระเงินใหม่
            new_payment: mode === 'edit'
                ? Math.max(0, (Number(data.paid_amount) || 0) - (Number(sale?.paid_amount) || 0))
                : (Number(data.paid_amount) || 0),
        };

        // @ts-ignore
        transform((_data: any) => submitData);

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
            });
        }
    };

    const getPaymentMethodIcon = (method: string) => {
        switch (method) {
            case '1': return '💵';
            case '2': return '🏦';
            case '3': return '💳';
            case '4': return '📝';
            default: return '💰';
        }
    };

    const getPaymentStatusIcon = (status: string) => {
        switch (status) {
            case 'completed': return '✅';
            case 'partial': return '🟡';
            case 'pending': return '❌';
            default: return '❓';
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 font-anuphan">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
                        error={errors.sale_date as string}
                        disabled={processing}
                        type="date"
                        className="font-anuphan"
                    />
                </div>

                {/* เลขที่เอกสาร */}
                <div className="space-y-2">
                    <InputLabel
                        label={
                            <div className="flex items-center gap-2">
                                <span className="text-lg">📄</span>
                                <span>เลขที่เอกสาร (Invoice No.)</span>
                                <span className="text-red-500">*</span>
                            </div>
                        }
                        name="invoice_no"
                        value={data.invoice_no}
                        onChange={(e) => setData('invoice_no', e.target.value)}
                        error={errors.invoice_no as string}
                        disabled={processing}
                        type="text"
                        placeholder="เช่น 6903-0001"
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
                        label="ลูกค้า *"
                        disabled={processing}
                    />
                </div>

                {/* รายการสินค้า (Multiple Items Support) */}
                <div className="md:col-span-2 rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                            <span>🌱</span>
                            รายการสินค้าที่ขาย
                            {itemIndex !== null && itemIndex !== undefined && (
                                <span className="ml-2 text-sm font-normal text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                                    (เฉพาะรายการที่เลือก)
                                </span>
                            )}
                        </h3>
                        {(itemIndex === null || itemIndex === undefined) && (
                            <Button type="button" variant="primary" onClick={addItem} disabled={processing} className="px-3 py-1 text-sm">
                                + เพิ่มรายการสินค้า
                            </Button>
                        )}
                    </div>

                    <div className="space-y-4">
                        {data.items.map((item, index) => {
                            // ถ้ามีการระบุ itemIndex ให้แสดงเฉพาะรายการนั้น
                            if (itemIndex !== null && itemIndex !== undefined && index !== itemIndex) return null;

                            const productError = (errors as any)[`items.${index}.product_id`];
                            const quantityError = (errors as any)[`items.${index}.quantity`];
                            const priceError = (errors as any)[`items.${index}.price`];
                            return (
                                <div key={index} className="flex flex-col sm:flex-row items-start sm:items-end gap-3 p-4 bg-white border border-gray-200 rounded-lg shadow-sm relative">
                                    {(itemIndex === null || itemIndex === undefined) && data.items.length > 1 && (
                                        <button type="button" onClick={() => removeItem(index)} className="absolute top-2 right-2 text-red-500 hover:text-red-700 bg-red-50 rounded-full w-8 h-8 flex items-center justify-center">
                                            ❌
                                        </button>
                                    )}

                                    {/* ตัวเลือกสินค้าจาก Dropdown */}
                                    <div className="w-full sm:flex-1 space-y-1">
                                        <SaleProductSelect
                                            products={filteredProducts}
                                            value={item.product_id}
                                            onChange={(value: string) => {
                                                const newItems = [...data.items];
                                                const selected = filteredProducts.find((p) => p.id.toString() === value || p.sku === value);
                                                const newPrice = selected?.price ? formatNumber(selected.price) : '';

                                                // อัปเดตรายการที่เลือก
                                                newItems[index] = { ...newItems[index], product_id: value, price: newPrice };

                                                // ถ้าเปลี่ยนที่รายการแรก ให้ไล่อัปเดตรายการอื่นให้เหมือนกันตามที่ user บอกว่า "product_id เป็นอันเดียวกัน"
                                                if (index === 0) {
                                                    for (let i = 1; i < newItems.length; i++) {
                                                        newItems[i] = { ...newItems[i], product_id: value, price: newPrice };
                                                    }
                                                }
                                                setData('items', newItems);
                                            }}
                                            placeholder="เลือกสินค้า (ชื่อ)"
                                            showSearch
                                            showClear
                                            label="อ้างอิงสินค้า"
                                            disabled={processing}
                                        />
                                    </div>

                                    {/* กล่องใส่ Product ID ตัวใหม่ (อ้างอิง) */}
                                    <div className="w-full sm:w-2/5 md:w-1/4 space-y-1">
                                        <InputLabel
                                            label="อ้างอิง (Product ID)"
                                            name={`item-custom-product-id-${index}`}
                                            value={item.custom_product_id}
                                            onChange={(e) => handleItemChange(index, 'custom_product_id', e.target.value)}
                                            disabled={processing}
                                            type="text"
                                            placeholder="ใส่ Product ID (อ้างอิง)"
                                            className="font-anuphan"
                                        />
                                    </div>

                                    <div className="w-full sm:w-1/4 md:w-1/6 space-y-1">
                                        <InputLabel
                                            label="จำนวน"
                                            name={`item-qty-${index}`}
                                            value={item.quantity}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                handleItemChange(index, 'quantity', value);
                                            }}
                                            disabled={processing}
                                            type="number"
                                            min={0}
                                            step={0.5}
                                            error={quantityError}
                                            className="font-anuphan"
                                        />
                                    </div>

                                    <div className="w-full sm:w-1/4 md:w-1/6 space-y-1">
                                        <InputLabel
                                            label="ราคาต่อหน่วย"
                                            name={`item-price-${index}`}
                                            value={item.price}
                                            onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                                            disabled={processing}
                                            type="number"
                                            min={0}
                                            step={0.5}
                                            error={priceError}
                                            className="font-anuphan"
                                        />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
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
                        value={data.shipping_cost as unknown as string}
                        onChange={(e) => handleNumberChange('shipping_cost', e.target.value)}
                        error={errors.shipping_cost as string}
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
                            className={`w-full appearance-none rounded-xl border-0 bg-gradient-to-br from-gray-50 to-white px-4 py-3 pr-12 font-anuphan shadow-sm transition-all duration-200 focus:ring-1 focus:ring-blue-500 focus:ring-offset-1 focus:outline-none ${errors.method ? 'ring-2 ring-red-300' : 'ring-1 ring-gray-300'
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
                        <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 ${processing ? 'text-gray-400' : 'text-blue-500'}`}>
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
                                className={`rounded-lg border p-3 text-center transition-all ${data.payment_status === option.value
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

            {/* รายละเอียดการชำระเงิน */}
            {
                shouldShowPaymentDetails && (
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
                                    value={data.paid_amount as unknown as string}
                                    onChange={(e) => handlePaidAmountChange(e.target.value)}
                                    error={errors.paid_amount as string}
                                    disabled={processing}
                                    type="number"
                                    min={0}
                                    max={calculatedTotal.toString()}
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
                )
            }

            {/* Summary Card */}
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-blue-800">
                    <span>🧮</span>
                    สรุปยอดขาย
                </h3>

                {/* แสดงยอดรายสินค้าที่เลือก (ถ้าแก้ไขเฉพาะรายการ) */}
                {selectedItemTotal !== null && (
                    <div className="mb-3 rounded-lg border border-blue-300 bg-gradient-to-r from-blue-50 to-indigo-50 p-3">
                        <p className="text-sm font-medium text-blue-700 mb-1">🌿 ยอดรายการนี้</p>
                        <div className="flex items-center gap-4">
                            <div>
                                <span className="text-sm text-gray-500">จำนวน</span>
                                <p className="text-lg font-bold text-blue-600">{selectedItemQuantity} หน่วย</p>
                            </div>
                            <div>
                                <span className="text-sm text-gray-500">ยอดสินค้า</span>
                                <p className="text-xl font-bold text-green-600">{formatNumber(selectedItemTotal)} บาท</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* ยอดรวมทั้งบิล */}
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div className="rounded-lg bg-white p-3 shadow-sm">
                        <p className="text-sm text-gray-600">จำนวนสินค้ารวม{selectedItemTotal !== null ? ' (ทั้งบิล)' : ''}</p>
                        <p className="text-lg font-bold text-blue-600">{totalQuantity} หน่วย</p>
                    </div>
                    <div className="rounded-lg bg-white p-3 shadow-sm">
                        <p className="text-sm text-gray-600">ราคาสินค้ารวม{selectedItemTotal !== null ? ' (ทั้งบิล)' : ''}</p>
                        <p className="text-lg font-bold text-green-600">
                            {formatNumber(itemsTotal)} บาท
                        </p>
                    </div>
                    <div className="rounded-lg bg-white p-3 shadow-sm">
                        <p className="text-sm text-gray-600">ยอดรวมทั้งสิ้น{selectedItemTotal !== null ? ' (ทั้งบิล)' : ''}</p>
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
                        className={`flex items-center gap-3 rounded-lg p-3 ${data.payment_status === 'completed' ? 'bg-green-100' : data.payment_status === 'partial' ? 'bg-orange-100' : 'bg-red-100'
                            }`}
                    >
                        <span className="text-2xl">{getPaymentStatusIcon(data.payment_status)}</span>
                        <div>
                            <p className="text-sm text-gray-600">สถานะการชำระเงิน</p>
                            <p
                                className={`font-semibold ${data.payment_status === 'completed'
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
                    error={errors.note as string}
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
                <Button type="submit" variant="primary" disabled={processing} className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 border-0">
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
            {
                Object.keys(errors).length > 0 && (
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
                )
            }
        </form >
    );
}
