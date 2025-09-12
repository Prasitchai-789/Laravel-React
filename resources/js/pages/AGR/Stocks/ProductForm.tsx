import Button from '@/components/Buttons/Button';
import InputLabel from '@/components/Inputs/InputLabel';
import Select from '@/components/Inputs/Select';
import { router, useForm } from '@inertiajs/react';
import { useEffect } from 'react';
import Swal from 'sweetalert2';

interface ProductFormProps {
    onClose: () => void;
    onSuccess: () => void;
    product?: {
        id: number;
        sku: string;
        name: string;
        category: string;
        price: string;
        stock: string;
        notes: string;
        store: string;
    };
    location?: {
        location_name: string;
    } | null;
    mode?: 'create' | 'edit';
}
export default function ProductForm({ onClose, onSuccess, product, locations, mode = 'create' }: ProductFormProps) {
    const { data, setData, post, put, processing, errors, reset } = useForm({
        sku: product?.sku ?? '',
        name: product?.name ?? '',
        category: product?.category ?? '',
        price: product?.price ?? '',
        stock: product?.stock ?? '',
        notes: product?.notes ?? '',
        store: product?.store ?? '',
        location: location?.location_name ?? '',
    });

    useEffect(() => {
        if (product) {
            setData({
                sku: product.sku || '',
                name: product.name || '',
                category: product.category || '',
                price: product.price || '',
                stock: product.stock || '',
                notes: product.notes || '',
                store: product.store || '',
                location: location?.location_name || '',
            });
        }
    }, [product]);

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

        if (mode === 'create') {
            router.post(route('products.store'), data, {
                onSuccess: () => {
                    Toast.fire({ icon: 'success', title: 'บันทึกสินค้าเรียบร้อยแล้ว' });
                    onSuccess();
                    reset();
                },
                onError: () => {
                    Toast.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' });
                },
                preserveScroll: true,
            });
        } else if (mode === 'edit' && product) {
            router.put(route('products.update', product.id), data, {
                onSuccess: () => {
                    Toast.fire({ icon: 'success', title: 'อัปเดตสินค้าเรียบร้อยแล้ว' });
                    onSuccess();
                },
                onError: () => {
                    Toast.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' });
                },
                preserveScroll: true,
            });
        }
    };

    const locationOptions = [
        { value: '', label: 'เลือกสถานที่ ...', disabled: true },
        ...(locations?.map((loc) => ({
            value: loc.id,
            label: loc.location_name,
        })) ?? []),
    ];

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-1">
                <InputLabel
                    label="รหัสสินค้า"
                    placeholder="รหัสสินค้า"
                    name="sku"
                    value={data.sku}
                    onChange={(e) => setData('sku', e.target.value)}
                    required={true}
                    error={errors.sku}
                    disabled={processing}
                    type="text"
                    className="font-anuphan"
                />
                <InputLabel
                    label="ชื่อสินค้า"
                    placeholder="ชื่อสินค้า"
                    name="name"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    required={true}
                    error={errors.name}
                    disabled={processing}
                    type="text"
                    className="font-anuphan"
                />
                <Select
                    label="สถานที่สินค้า"
                    name="store"
                    value={data.store}
                    onChange={(e) => setData('store', e.target.value)}
                    options={locationOptions}
                    required={true}
                    error={errors.store}
                    disabled={processing}
                    className="font-anuphan"
                />
                {mode === 'create' && (
                    <InputLabel
                        label="จำนวน"
                        placeholder="จำนวน"
                        name="stock"
                        value={data.stock}
                        onChange={(e) => setData('stock', e.target.value)}
                        required={true}
                        error={errors.stock}
                        disabled={processing}
                        type="number"
                        className="font-anuphan"
                    />
                )}
                <InputLabel
                    label="ราคาต่อหน่วย"
                    placeholder="ราคาต่อหน่วย"
                    name="price"
                    value={data.price}
                    onChange={(e) => setData('price', e.target.value)}
                    required={true}
                    error={errors.price}
                    disabled={processing}
                    type="number"
                    className="font-anuphan"
                />
            </div>
            <hr className="my-8" />
            <div className="flex justify-end gap-2 font-anuphan">
                <Button type="button" variant="secondary" onClick={onClose}>
                    ยกเลิก
                </Button>
                <Button type="submit" variant="primary" disabled={processing}>
                    {mode === 'create' ? 'บันทึก' : 'อัปเดต'}
                </Button>
            </div>
        </form>
    );
}
