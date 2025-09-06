import InputLabel from '@/components/Inputs/InputLabel';
import Select from '@/components/Inputs/Select';
import { useForm } from '@inertiajs/react';
import { useState } from 'react';

export default function SaleForm({ onClose }) {
    const { data, setData, post, processing, errors } = useForm({
        date: '',
        customer: '',
        product: '',
        quantity: '',
        price: '',
        status: '',
    });
    const [empName, setEmpName] = useState('');

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post('/sales', {
            onSuccess: () => {
                if (onClose) onClose();
            },
        });
    }
    const products = [
        { value: '', label: 'Select a product', disabled: true },
        { value: 'th', label: 'Thailand' },
        { value: 'us', label: 'United States' },
        { value: 'jp', label: 'Japan' },
    ];

    const status = [
        { value: '', label: 'เลือกสถานะ ...', disabled: true },
        { value: 'W', label: 'จอง' },
        { value: 'F', label: 'รับแล้ว' },
        { value: 'C', label: 'ยกเลิก' },
    ];

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <InputLabel
                    label="วันที่"
                    name="date"
                    value={data.date}
                    onChange={(e) => setData('date', e.target.value)}
                    required={true}
                    error={errors.date}
                    disabled={processing}
                    type="date"
                    className="font-anuphan"
                />

                <InputLabel
                    label="ชื่อลูกค้า"
                    placeholder="ชื่อลูกค้า"
                    name="customer"
                    value={data.customer}
                    onChange={(e) => setData('customer', e.target.value)}
                    required={true}
                    error={errors.customer}
                    disabled={processing}
                    type="text"
                    className="font-anuphan"
                />

                <Select
                    label="สินค้า"
                    name="product"
                    value={data.product}
                    onChange={(e) => setData('product', e.target.value)}
                    options={products}
                    required={true}
                    error={errors.product}
                    disabled={processing}
                    className="font-anuphan"
                />
                <Select
                    label="สถานที่สินค้า"
                    name="product"
                    value={data.product}
                    onChange={(e) => setData('product', e.target.value)}
                    options={products}
                    required={true}
                    error={errors.product}
                    disabled={processing}
                    className="font-anuphan"
                />
                <InputLabel
                    label="จำนวน"
                    placeholder="จำนวน"
                    name="quantity"
                    value={data.quantity}
                    onChange={(e) => setData('quantity', e.target.value)}
                    required={true}
                    error={errors.quantity}
                    disabled={processing}
                    type="number"
                    className="font-anuphan"
                />

                <InputLabel
                    label="ราคาต่อหน่วย"
                    placeholder="ราคาต่อหน่วย"
                    name="quantity"
                    value={data.quantity}
                    onChange={(e) => setData('quantity', e.target.value)}
                    required={true}
                    error={errors.quantity}
                    disabled={processing}
                    type="number"
                    className="font-anuphan"
                />

                <InputLabel
                    label="มัดจำ"
                    placeholder="มัดจำ"
                    name="price"
                    value={data.price}
                    onChange={(e) => setData('price', e.target.value)}
                    required={true}
                    error={errors.price}
                    disabled={processing}
                    type="number"
                    className="font-anuphan"
                />

                <Select
                    label="สถานะ"
                    name="status"
                    value={data.status}
                    onChange={(e) => setData('status', e.target.value)}
                    options={status}
                    required={true}
                    error={errors.status}
                    disabled={processing}
                    className="font-anuphan"
                />
            </div>
                <hr className='my-8'/>
            <button
                type="submit"
                disabled={processing}
                className="ml-auto flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-white transition-colors hover:scale-102 hover:cursor-pointer hover:bg-green-700 hover:shadow-lg focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none"
            >
                <span className="font-anuphan">บันทึก</span>
            </button>
        </form>
    );
}
