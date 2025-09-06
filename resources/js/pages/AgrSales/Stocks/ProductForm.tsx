import InputLabel from '@/components/Inputs/InputLabel';
import Select from '@/components/Inputs/Select';
import { useForm } from '@inertiajs/react';
import Swal from 'sweetalert2';

export default function ProductForm({ mode = 'create', locations = [], onClose = () => {} }) {
    const { data, setData, post, put, processing, errors, reset } = useForm({
        sku: '',
        name: '',
        category: '',
        price: '',
        stock: '',
        notes: '',
        store: '',
    });
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        customClass: {
            popup: 'custom-swal',
        },
        didOpen: (toast) => {
            toast.onmouseenter = Swal.stopTimer;
            toast.onmouseleave = Swal.resumeTimer;
        },
    });
    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (mode === 'create') {
            console.log(data);
            post('/stock-agr-product', {
                onSuccess: () => {
                    Toast.fire({
                        icon: 'success',
                        title: 'Project created successfully',
                    });
                    reset();
                    onClose();
                },
            });
        } else {
            put(`/projects/${project.id}`, {
                onSuccess: () => {
                    Toast.fire({
                        icon: 'success',
                        title: 'Project updated successfully',
                    });
                    onClose();
                },
            });
        }
    }

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
            <button
                type="submit"
                disabled={processing}
                className="ml-auto flex items-center justify-center gap-2 rounded-3xl bg-blue-600 px-6 py-2.5 text-white transition-colors hover:scale-102 hover:cursor-pointer hover:bg-indigo-700 hover:shadow-lg focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:outline-none"
            >
                <span className="font-anuphan">{mode === 'create' ? 'Create' : 'Update'}</span>

            </button>
        </form>
    );
}
