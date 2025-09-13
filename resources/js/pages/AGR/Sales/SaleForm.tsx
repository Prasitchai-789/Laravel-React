import Button from '@/components/Buttons/Button';
import InputLabel from '@/components/Inputs/InputLabel';
import Select from '@/components/Inputs/Select';
import { router, useForm } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import Swal from 'sweetalert2';
import SaleProductSelect from './SaleProductSelect';

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

interface SaleFormProps {
    mode?: 'create' | 'edit';
    sale?: Sale;
    products?: Product[];
    customers?: Customer[];
    locations?: Location[];
    onClose: () => void;
}

export default function SaleForm({ mode = 'create', sale, products, customers = [], locations, onClose }: SaleFormProps) {
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
        total_amount: sale?.total_amount || '',
        deposit_percent: sale?.deposit_percent || '',
        shipping_cost: sale?.shipping_cost || 0,
    });
    // State สำหรับ dropdown ลูกค้า
    const [customerSearch, setCustomerSearch] = useState(sale?.customer || '');
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

    // Refs สำหรับจัดการ dropdown
    const customerInputRef = useRef<HTMLInputElement>(null);
    const customerDropdownRef = useRef<HTMLDivElement>(null);

    const [selectedProduct, setSelectedProduct] = useState<string>(data.product_id?.toString() || '');

    // กรองลูกค้าตามคำค้นหา
    const filteredCustomers = customers.filter(
        (customer) =>
            customer.name.toLowerCase().includes(customerSearch.toLowerCase()) || (customer.phone && customer.phone.includes(customerSearch)),
    );

    // ฟังก์ชันคำนวณยอดรวมและมัดจำอัตโนมัติ
    const calculateTotals = () => {
        const quantity = parseFloat(data.quantity) || 0;
        const price = parseFloat(data.price) || 0;
        const paidAmount = parseFloat(data.paid_amount) || 0;
        const shippingCost = parseFloat(data.shipping_cost) || 0;

        // คำนวณยอดรวม
        const totalAmount = quantity * price + shippingCost;

        // คำนวณมัดจำ
        const deposit = totalAmount - paidAmount;

        // อัปเดตข้อมูล
        setData({
            ...data,
            total_amount: totalAmount > 0 ? totalAmount.toString() : '',
            deposit: deposit > 0 ? deposit.toString() : '',
        });
    };

    // คำนวณอัตโนมัติเมื่อ quantity, price, หรือ deposit_percent เปลี่ยน
    useEffect(() => {
        calculateTotals();
    }, [data.quantity, data.price, data.paid_amount, data.shipping_cost]);

    useEffect(() => {
        if (data.product_id) {
            setSelectedProduct(data.product_id.toString());
        }
    }, [data.product_id]);

    // ฟังก์ชันเมื่อเลือกสินค้า (ดึงราคาสินค้าอัตโนมัติ)
    const handleProductChange = (productId: string) => {
        setData('product_id', productId);

        // ดึงราคาสินค้าอัตโนมัติถ้ามี
        if (productId && products) {
            const selectedProduct = products.find((p) => p.id.toString() === productId);
            if (selectedProduct && selectedProduct.price) {
                setData('price', selectedProduct.price.toString());
            }
        }
    };

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
            const customer = customers.find((c) => c.id.toString() === sale.customer_id);
            if (customer) {
                setSelectedCustomer(customer);
                setCustomerSearch(customer.name);
            }
        }
    }, [mode, sale, customers]);

    // อัปเดตการค้นหาลูกค้าเมื่อ customer_id เปลี่ยน
    useEffect(() => {
        if (customerSearch === '' && data.customer_id && customers.length > 0) {
            const customer = customers.find((c) => c.id.toString() === data.customer_id);
            if (customer) {
                setCustomerSearch(customer.name);
            }
        }
    }, [customerSearch, data.customer_id, customers]);

    useEffect(() => {
        if (data.customer_id && customers.length > 0) {
            const selectedCustomer = customers.find((c) => c.id === data.customer_id);
            if (selectedCustomer) {
                setCustomerSearch(selectedCustomer.name); // set ชื่อเข้า input
            }
        }
    }, [data.customer_id, customers]);
    const formatDateForInput = (dateString: string) => {
        if (!dateString) return '';

        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;

        return date.toISOString().split('T')[0];
    };

    // ฟิลเตอร์สินค้า ตาม store ที่เลือก
    const filteredProducts = products?.filter((pro) => pro.store_id === Number(data.store_id)) ?? [];

    // สร้าง options สำหรับสินค้า
    const productOptions = [
        { value: '', label: 'เลือกสินค้า ...', disabled: true },
        ...filteredProducts.map((pro) => ({
            value: pro.id.toString(),
            label: pro.name,
        })),
    ];

    // เมื่อเลือก Store ให้ reset product_id ด้วย
    const handleStoreChange = (value: string) => {
        setData('store_id', value);
        setData('product_id', '');
    };

    // แปลง locations -> options
    const locationOptions = [
        { value: '', label: 'เลือกสถานที่ ...', disabled: true },
        ...(locations?.map((loc) => ({
            value: loc.id.toString(),
            label: loc.location_name,
        })) ?? []),
    ];

    const statusOptions = [
        { value: '', label: 'เลือกสถานะ ...', disabled: true },
        { value: 'reserved', label: 'จอง' },
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
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* ข้อมูลพื้นฐาน */}
                <div className="space-y-4">
                    <InputLabel
                        label="วันที่"
                        name="sale_date"
                        value={formatDateForInput(data.sale_date)}
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
                </div>

                {/* ข้อมูลสินค้า */}
                <div className="space-y-4">
                    <Select
                        label="สถานที่สินค้า"
                        name="store_id"
                        value={data.store_id}
                        onChange={(e) => handleStoreChange(e.target.value)}
                        options={locationOptions}
                        required
                        error={errors.store_id}
                        disabled={processing}
                        className="font-anuphan"
                    />


                    <SaleProductSelect
                        label="สินค้า"
                        products={filteredProducts}
                        value={selectedProduct}
                        onChange={(value: string) => {
                            setSelectedProduct(value);
                            setData('product_id', value);

                            // ดึงราคาสินค้าอัตโนมัติถ้ามี
                            const selected = products?.find((p) => p.id.toString() === value);
                            if (selected?.price) {
                                setData('price', selected.price.toString());
                            }
                        }}
                        placeholder="เลือกสินค้าเกษตร"
                        showSearch={true}
                        showClear={true}
                        required
                        disabled={processing || !data.store_id}
                        className="min-w-[200px] font-anuphan"
                    />
                </div>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {/* ข้อมูลราคาและจำนวน */}
                <InputLabel
                    label="จำนวน"
                    placeholder="0"
                    name="quantity"
                    value={data.quantity ?? ''}
                    onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        // ดึง stock ของสินค้าที่เลือก
                        const selectedProduct = products?.find((p) => p.id.toString() === data.product_id.toString());
                        const stock = selectedProduct?.stock || 0;

                        if (value > stock) {
                            // แสดงแจ้งเตือน
                            Swal.fire({
                                title: `<span class="font-anuphan text-red-600 text-2xl font-bold">จำนวนสินค้าคงเหลือ ${stock} ชิ้น</span>`,
                                icon: 'warning',
                                draggable: true,
                                showConfirmButton: true,
                                confirmButtonText: 'ตกลง',
                                buttonsStyling: false,
                                customClass: {
                                    confirmButton: 'bg-blue-500 hover:bg-blue-600 text-white font-anuphan px-6 py-2 rounded rounded-full', // ปุ่ม
                                },
                            });

                            setData('quantity', stock.toString()); // กำหนดเป็น stock สูงสุด
                        } else {
                            setData('quantity', value.toString());
                        }
                    }}
                    required={true}
                    error={errors.quantity}
                    disabled={processing}
                    type="number"
                    min="0"
                    step="1"
                    className="font-anuphan"
                />

                <InputLabel
                    label="ราคาต่อหน่วย"
                    placeholder="0.00"
                    name="price"
                    value={data.price}
                    onChange={(e) => setData('price', e.target.value)}
                    required={true}
                    error={errors.price}
                    disabled={processing}
                    type="number"
                    min="0"
                    step="0.01"
                    className="font-anuphan"
                />
                <InputLabel
                    label="ค่าขนส่ง"
                    placeholder="0.00"
                    name="shipping_cost"
                    value={data.shipping_cost ?? ''}
                    onChange={(e) => setData('shipping_cost', e.target.value)}
                    required={true}
                    error={errors.shipping_cost}
                    disabled={processing}
                    type="number"
                    min="0"
                    step="0.01"
                    className="font-anuphan"
                />
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* ข้อมูลมัดจำและสถานะ */}
                <InputLabel
                    label="ยอดชำระ/เงินมัดจำ"
                    placeholder="0"
                    name="paid_amount"
                    value={data.paid_amount}
                    onChange={(e) => setData('paid_amount', e.target.value)}
                    required={false}
                    error={errors.paid_amount}
                    disabled={processing}
                    type="number"
                    min="0"
                    max="100"
                    step="1"
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
                {/* แสดงยอดรวมและมัดจำ */}
                <div className="md:col-span-2">
                    <div className="rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2">
                        <h3 className="mb-2 font-anuphan text-lg font-semibold text-gray-800">สรุปรายการ</h3>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div className="rounded-lg bg-white px-4 py-2 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <span className="font-anuphan font-medium text-gray-600">ยอดรวม</span>
                                    <div className="font-anuphan text-2xl font-bold text-green-600">
                                        {parseFloat(data.total_amount || '0').toLocaleString('th-TH', {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        })}
                                        <span className="ml-1 text-sm">฿</span>
                                    </div>
                                </div>
                                <div className="mt-1 font-anuphan text-xs text-gray-500">
                                    จำนวน {data.quantity || 0} ชิ้น × ราคาชิ้นละ {parseFloat(data.price || '0').toLocaleString('th-TH')} ฿
                                </div>
                            </div>

                            <div className="rounded-lg bg-white px-4 py-2 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <span className="font-anuphan font-medium text-gray-600">ยอดคงค้าง</span>
                                    <div className="font-anuphan text-2xl font-bold text-red-600">
                                        {parseFloat(data.deposit || '0').toLocaleString('th-TH', {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        })}
                                        <span className="ml-1 text-sm">฿</span>
                                    </div>
                                </div>
                                <div className="mt-1 font-anuphan text-xs text-gray-500">
                                    {' '}
                                    ยอดรวม {parseFloat(data.total_amount || '0').toLocaleString('th-TH')} ฿ - ชำระเงินแล้ว{' '}
                                    {parseFloat(data.paid_amount || '0').toLocaleString('th-TH')} ฿
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <hr className="my-4" />
            <div className="flex justify-end gap-2 font-anuphan">
                <Button type="button" variant="secondary" onClick={onClose} disabled={processing}>
                    ยกเลิก
                </Button>
                <Button type="submit" variant="primary" disabled={processing} loading={processing}>
                    {mode === 'create' ? 'บันทึก' : 'อัปเดต'}
                </Button>
            </div>
        </form>
    );
}
