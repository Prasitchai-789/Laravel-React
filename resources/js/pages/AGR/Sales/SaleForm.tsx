import Button from '@/components/Buttons/Button';
import InputLabel from '@/components/Inputs/InputLabel';
import Select from '@/components/Inputs/Select';
import { useForm } from '@inertiajs/react';
import dayjs from 'dayjs';
import 'dayjs/locale/th';
import Swal from 'sweetalert2';
// import { useEffect } from 'react';
import SaleProductSelect from './SaleProductSelect'
import CustomerSelect from './CustomerSelect'
import React, { useState, useEffect } from 'react';

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
};

export default function SaleForm({
    mode = 'create',
    sale,
    products,
    customers = [],
    locations,
    payments,
    onClose,
}: SaleFormProps) {
    const { data, setData, post, put, reset, processing, errors } = useForm({
        id: sale?.id || '',
        sale_date: formatDateSafe(sale?.sale_date), // ✅ ใช้ formatDateSafe
        customer: sale?.customer || '',
        customer_id: sale?.customer_id || '',
        product_id: sale?.product_id || '',
        quantity: sale?.quantity || 0,
        price: sale?.price || '',
        deposit: sale?.deposit || '',
        status: sale?.status || 'completed',
        store_id: sale?.store_id || '',
        paid_amount: sale?.paid_amount || '',
        total_amount: sale?.total_amount || '',
        deposit_percent: sale?.deposit_percent || '',
        shipping_cost: sale?.shipping_cost || 0,
        method: payments?.length > 0 ? payments[0].method : '1',
        payment_slip: null,
    });

    // กรองสินค้าตาม store_id ถ้ามี
    const filteredProducts = React.useMemo(() => {
        return products?.filter(
            (pro) => !data.store_id || Number(pro.store_id) === Number(data.store_id)
        ) ?? [];
    }, [products, data.store_id]);

    // ใช้ data.product_id ตรง ๆ เลย ไม่ต้องแยก state
    const selectedProductId = data.product_id;




    useEffect(() => {
        if (sale) {
            reset({
                ...sale,
                sale_date: formatDateSafe(sale.sale_date), // ✅ reset ให้เป็น YYYY-MM-DD
            });
        }
    }, [sale]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (mode === 'create') {
            post('/sales');
        } else {
            put(`/sales/${sale?.id}`);
        }
    };

    return (

        <form onSubmit={handleSubmit} className="space-y-6 font-anuphan">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <InputLabel
                    label="วันที่ขาย"
                    name="sale_date"
                    value={data.sale_date}
                    onChange={(e) => setData('sale_date', e.target.value)}
                    required={true}
                    error={errors.sale_date}
                    disabled={processing}
                    type="date"
                    className="font-anuphan"
                />

               

                <CustomerSelect
                    customers={customers}
                    value={data.customer_id}
                    onChange={(value: string) => setData('customer_id', value)}
                    placeholder="เลือกลูกค้า"
                    showSearch
                    showClear
                    label="ลูกค้า"
                    required
                    disabled={processing}
                />

                <SaleProductSelect
                    products={filteredProducts}
                    value={selectedProductId} // ใช้ data.product_id
                    onChange={(value: string) => {
                        setData('product_id', value);

                        // ดึงราคาสินค้าอัตโนมัติถ้ามี
                        const selected = filteredProducts.find(p => p.id.toString() === value);
                        if (selected?.price) {
                            setData('price', selected.price.toString());
                        }
                    }}
                    placeholder="เลือกสินค้าเกษตร"
                    showSearch
                    showClear
                    label="สินค้า"
                    required
                    disabled={processing}
                />

                {/* ✅ จำนวน */}

                <InputLabel
                    label="จำนวน"
                    name="quantity"
                    value={data.quantity}
                    onChange={(e) => {
                        const value = Number(e.target.value || 0);
                        const selected = filteredProducts.find(p => p.id.toString() === data.product_id);
                        const maxStock = selected?.stock ?? Infinity;

                        if (value > maxStock) {
                            Swal.fire({
                                icon: 'warning',
                                title: `จำนวนสูงสุดที่มีคือ ${maxStock}`,
                                customClass: { popup: 'custom-swal' },

                            });
                            // ตั้งค่าเป็น maxStock ทันทีและ return
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




                <InputLabel
                    label="ราคา"
                    name="price"
                    value={data.price}
                    onChange={(e) => setData('price', e.target.value)}
                    error={errors.price}
                    disabled={processing}
                    type="number"
                    min={0}
                    step={0.50}
                    className="font-anuphan"
                />
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-3 border-t border-gray-200 pt-6">
                <Button type="button" variant="secondary" onClick={onClose} disabled={processing}>
                    ยกเลิก
                </Button>
                <Button type="submit" variant="primary" disabled={processing}>
                    {mode === 'create' ? 'บันทึกข้อมูล' : 'อัปเดตข้อมูล'}
                </Button>
            </div>

            {/* Error Summary */}
            {Object.keys(errors).length > 0 && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                    <h4 className="mb-2 text-sm font-medium text-red-800">กรุณาตรวจสอบข้อมูลต่อไปนี้:</h4>
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
