import Button from '@/components/Buttons/Button';
import InputLabel from '@/components/Inputs/InputLabel';
import Select from '@/components/Inputs/Select';
import { useForm } from '@inertiajs/react';
import dayjs from 'dayjs';
import 'dayjs/locale/th';
import { useEffect } from 'react';

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

                <Select
                    label="ลูกค้า"
                    name="customer_id"
                    value={data.customer_id}
                    onChange={(e) => setData('customer_id', e.target.value)}
                    options={[
                        { value: '', label: '-- เลือกลูกค้า --', disabled: true },
                        ...customers.map((c) => ({ value: c.id, label: c.name })),
                    ]}
                    error={errors.customer_id}
                    disabled={processing}
                    className="font-anuphan"
                />

                <Select
                    label="สินค้า"
                    name="product_id"
                    value={data.product_id}
                    onChange={(e) => setData('product_id', e.target.value)}
                    options={[
                        { value: '', label: '-- เลือกสินค้า --', disabled: true },
                        ...products.map((p) => ({ value: p.id, label: p.name })),
                    ]}
                    error={errors.product_id}
                    disabled={processing}
                    className="font-anuphan"
                />

                {/* ✅ จำนวน */}
                <InputLabel
                    label="จำนวน"
                    name="quantity"
                    value={data.quantity}
                    onChange={(e) => setData('quantity', e.target.value)}
                    error={errors.quantity}
                    disabled={processing}
                    type="number"
                    min={0}
                    step={0.50}
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
