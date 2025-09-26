import InputLabel from '@/components/Inputs/InputLabel';
import Textarea from '@/components/Inputs/Textarea';
import { useForm } from '@inertiajs/react';
import Swal from 'sweetalert2';

export default function LocationForm({ mode = 'create', project = null, onClose = () => {} }) {
    const { data, setData, post, put, processing, errors , reset } = useForm({
        location_name: '',
        note: '',
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
            post('/stock-agr', {
                onSuccess: () => {
                    Toast.fire({
                        icon: 'success',
                        title: 'Created successfully',
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
                        title: 'Updated successfully',
                    });
                    onClose();
                },
            });
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-1">
                <InputLabel
                    label="ชื่อสถานที่"
                    placeholder="ชื่อสถานที่"
                    name="location_name"
                    value={data.location_name}
                    onChange={(e) => setData('location_name', e.target.value)}
                    required={true}
                    error={errors.location_name}
                    disabled={processing}
                    type="text"
                    className="font-anuphan"
                />

                <Textarea
                    label="รายละเอียด"
                    name="note"
                    value={data.note}
                    onChange={(e) => setData('note', e.target.value)}
                    required={false}
                    error={errors.note}
                    disabled={processing}
                    rows={3}
                    className="font-anuphan"
                />
            </div>
            <hr className="my-8" />
            <button
                type="submit"
                disabled={processing}
                className="ml-auto flex items-center justify-center gap-2 rounded-3xl bg-green-600 px-6 py-2.5 text-white transition-colors hover:scale-102 hover:cursor-pointer hover:bg-green-700 hover:shadow-lg focus:ring-2 focus:ring-blue-200 focus:ring-offset-2 focus:outline-none"
            >
                <span className="font-anuphan">{mode === 'create' ? 'บันทึก' : 'อัพเดท'}</span>
            </button>
        </form>
    );
}
