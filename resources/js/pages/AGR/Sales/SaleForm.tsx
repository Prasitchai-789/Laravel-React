import InputLabel from '@/components/Inputs/InputLabel';
import Select from '@/components/Inputs/Select';
import { router, useForm } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import Swal from 'sweetalert2';

interface Customer {
    id: number;
    name: string;
    phone?: string;
}

interface Product {
    id: number;
    name: string;
}

interface Location {
    id: number;
    location_name: string;
}

interface Sale {
    id?: number;
    sale_date: string;
    customer: string;
    customer_id: string;
    product_id: string;
    quantity: string;
    deposit: string;
    status: string;
    store_id: string;
    total_amount: string;
    deposit_percent: string;
}

interface SaleFormProps {
    mode?: 'create' | 'edit';
    sale?: Sale; // รับข้อมูลการขายสำหรับโหมดแก้ไข
    products?: Product[];
    customers?: Customer[];
    locations?: Location[];
    onClose: () => void;
}

export default function SaleForm({ mode = 'create', sale, products, customers = [], locations, onClose }: SaleFormProps) {
    const { data, setData, post, put, reset, processing, errors } = useForm({
        id: sale?.id || '',
        sale_date: sale?.sale_date || '',
        customer: sale?.customer || '', // เก็บชื่อลูกค้า
        customer_id: sale?.customer_id || '', // เก็บ ID ลูกค้า
        product_id: sale?.product_id || '',
        quantity: sale?.quantity || '',
        deposit: sale?.deposit || '',
        status: sale?.status || '',
        store_id: sale?.store_id || '',
        total_amount: sale?.total_amount || '',
        deposit_percent: sale?.deposit_percent || '',
    });

    // State สำหรับ dropdown ลูกค้า
    const [customerSearch, setCustomerSearch] = useState(sale?.customer || '');
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

    // Refs สำหรับจัดการ dropdown
    const customerInputRef = useRef<HTMLInputElement>(null);
    const customerDropdownRef = useRef<HTMLDivElement>(null);

    // กรองลูกค้าตามคำค้นหา
    const filteredCustomers = customers.filter(
        (customer) =>
            customer.name.toLowerCase().includes(customerSearch.toLowerCase()) || (customer.phone && customer.phone.includes(customerSearch)),
    );

    // ปิด dropdown เมื่อคลิกนอกพื้นที่
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                customerDropdownRef.current &&
                !customerDropdownRef.current.contains(event.target as Node) &&
                customerInputRef.current &&
                !customerInputRef.current.contains(event.target as Node)
            ) {
                setShowCustomerDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // โหลดข้อมูลลูกค้าเมื่อเข้าสู่โหมดแก้ไข
    useEffect(() => {
        if (mode === 'edit' && sale && customers.length > 0) {
            // ค้นหาลูกค้าจาก customer_id
            const customer = customers.find((c) => c.id.toString() === sale.customer_id);
            if (customer) {
                setSelectedCustomer(customer);
                setCustomerSearch(customer.name);
            }
        }
    }, [mode, sale, customers]);

    // แปลง products -> options
    const productOptions = [
        { value: '', label: 'เลือกสินค้า ...', disabled: true },
        ...(products?.map((pro) => ({
            value: pro.id,
            label: pro.name,
        })) ?? []),
    ];

    // แปลง locations -> options
    const locationOptions = [
        { value: '', label: 'เลือกสถานที่ ...', disabled: true },
        ...(locations?.map((loc) => ({
            value: loc.id,
            label: loc.location_name,
        })) ?? []),
    ];

    const statusOptions = [
        { value: '', label: 'เลือกสถานะ ...', disabled: true },
        { value: 'pending', label: 'จอง' },
        { value: 'completed', label: 'รับแล้ว' },
        { value: 'cancelled', label: 'ยกเลิก' },
    ];

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

    // ฟังก์ชันเลือกลูกค้า
    const selectCustomer = (customer: Customer) => {
        setSelectedCustomer(customer);
        setData({
            ...data,
            customer: customer.name,
            customer_id: customer.id.toString(),
        });
        setCustomerSearch(customer.name);
        setShowCustomerDropdown(false);
    };

    // ฟังก์ชันล้างลูกค้าที่เลือก
    const clearCustomer = () => {
        setSelectedCustomer(null);
        setData({
            ...data,
            customer: '',
            customer_id: '',
        });
        setCustomerSearch('');
        setShowCustomerDropdown(true);
        if (customerInputRef.current) {
            customerInputRef.current.focus();
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (mode === 'create') {
            router.post(route('sales.store'), data, {
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
        } else if (mode === 'edit' && data.id) {
            router.put(route('sales.update', data.id), data, {
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
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <InputLabel
                    label="วันที่"
                    name="sale_date"
                    value={data.sale_date}
                    onChange={(e) => setData('sale_date', e.target.value)}
                    required={true}
                    error={errors.sale_date}
                    disabled={processing}
                    type="date"
                    className="font-anuphan"
                />

                {/* Dropdown สำหรับเลือกลูกค้า */}
                <div className="relative">
                    <label className="mb-2 block font-anuphan text-sm font-medium text-gray-700">
                        ชื่อลูกค้า <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <input
                            ref={customerInputRef}
                            type="text"
                            value={customerSearch}
                            onChange={(e) => setCustomerSearch(e.target.value)}
                            onFocus={() => setShowCustomerDropdown(true)}
                            className="block w-full rounded-lg border border-gray-300 px-4 py-3 font-anuphan shadow-sm transition duration-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                            placeholder="ค้นหาด้วยชื่อหรือเบอร์โทรลูกค้า..."
                            required
                        />
                        {data.customer_id && (
                            <button
                                type="button"
                                onClick={clearCustomer}
                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-red-500 transition-colors hover:text-red-700"
                            >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>

                    {showCustomerDropdown && filteredCustomers.length > 0 && (
                        <div
                            ref={customerDropdownRef}
                            className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white font-anuphan shadow-lg"
                        >
                            {filteredCustomers.map((customer) => (
                                <div
                                    key={customer.id}
                                    onClick={() => selectCustomer(customer)}
                                    className="cursor-pointer border-b border-gray-100 p-3 font-anuphan transition-colors last:border-b-0 hover:bg-gray-50"
                                >
                                    <div className="font-medium text-gray-900">{customer.name}</div>
                                    {customer.phone && <div className="text-sm text-gray-600">{customer.phone}</div>}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <Select
                    label="สินค้า"
                    name="product_id"
                    value={data.product_id}
                    onChange={(e) => setData('product_id', Number(e.target.value))}
                    options={productOptions}
                    required={true}
                    error={errors.product_id}
                    disabled={processing}
                    className="font-anuphan"
                />

                <Select
                    label="สถานที่สินค้า"
                    name="store_id"
                    value={data.store_id}
                    onChange={(e) => setData('store_id', Number(e.target.value))}
                    options={locationOptions}
                    required={true}
                    error={errors.store_id}
                    disabled={processing}
                    className="font-anuphan"
                />

                <InputLabel
                    label="จำนวน"
                    placeholder="จำนวน"
                    name="total_amount"
                    value={data.total_amount}
                    onChange={(e) => setData('total_amount', e.target.value)}
                    required={true}
                    error={errors.total_amount}
                    disabled={processing}
                    type="number"
                    className="font-anuphan"
                />

                <InputLabel
                    label="ราคาต่อหน่วย"
                    placeholder="ราคาต่อหน่วย"
                    name="deposit"
                    value={data.deposit}
                    onChange={(e) => setData('deposit', e.target.value)}
                    required={true}
                    error={errors.deposit}
                    disabled={processing}
                    type="number"
                    className="font-anuphan"
                />

                <InputLabel
                    label="มัดจำ (%)"
                    placeholder="มัดจำเป็นเปอร์เซ็นต์"
                    name="deposit_percent"
                    value={data.deposit_percent}
                    onChange={(e) => setData('deposit_percent', e.target.value)}
                    required={true}
                    error={errors.deposit_percent}
                    disabled={processing}
                    type="number"
                    min="0"
                    max="100"
                    className="font-anuphan"
                />

                <Select
                    label="สถานะ"
                    name="status"
                    value={data.status}
                    onChange={(e) => setData('status', e.target.value)}
                    options={statusOptions}
                    required={true}
                    error={errors.status}
                    disabled={processing}
                    className="font-anuphan"
                />
            </div>

            <hr className="my-8" />
            <button
                type="submit"
                disabled={processing}
                className="ml-auto flex items-center justify-center gap-2 rounded-3xl bg-green-600 px-6 py-2.5 text-white transition-colors hover:scale-102 hover:cursor-pointer hover:bg-green-700 hover:shadow-lg focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none"
            >
                <span className="font-anuphan">{mode === 'create' ? 'บันทึก' : 'แก้ไข'}</span>
            </button>
        </form>
    );
}
