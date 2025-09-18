import Button from '@/components/Buttons/Button';
import InputLabel from '@/components/Inputs/InputLabel';
import { router, useForm } from '@inertiajs/react';
import dayjs from 'dayjs';
import 'dayjs/locale/th';
import Swal from 'sweetalert2';

interface Production {
    id: number;
    date: string;
    production: string;
    note: string;
}
interface FerProductionFormProps {
    mode?: 'create' | 'edit';
    production?: Production;
    onClose: () => void;
}

export default function SaleForm({ mode = 'create', production, onClose }: FerProductionFormProps) {
    const { data, setData, post, put, reset, processing, errors } = useForm({
        date: production?.date || dayjs().format('YYYY-MM-DD'),
        production: production?.production || '',
        note: production?.note || '',
    });

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

    const formatDateForInput = (dateString: string) => {
            if (!dateString) return dayjs().format('YYYY-MM-DD'); // คืนค่าปัจจุบันหากไม่มีค่า
            return dayjs(dateString).format('YYYY-MM-DD');
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
            <div className="grid grid-cols-1 gap-6 md:grid-cols-1">
                <div className="space-y-4">
                    <InputLabel
                        label="วันที่"
                        name="date"
                        value={formatDateForInput(data.date)}
                        onChange={(e) => setData('date', e.target.value)}
                        required={true}
                        error={errors.date}
                        disabled={processing}
                        type="date"
                        className="font-anuphan"
                    />
                </div>

                <div className="space-y-4">
                    <InputLabel
                        label="วันที่"
                        name="date"
                        value={formatDateForInput(data.date)}
                        onChange={(e) => setData('date', e.target.value)}
                        required={true}
                        error={errors.date}
                        disabled={processing}
                        type="date"
                        className="font-anuphan"
                    />
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
