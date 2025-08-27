import { useForm } from '@inertiajs/react';
import Swal from 'sweetalert2';

interface Permission {
    id?: number | string;
    name?: string;
    guard_name?: string;
}

interface UseFormProps {
    mode: 'create' | 'edit';
    data?: Permission | null;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function UseForm({ mode, data, onClose, onSuccess }: UseFormProps) {
    const { data: formData, setData, post, put, processing, errors, reset } = useForm({
        name: data?.name || '',
        guard_name: data?.guard_name || 'web',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // สร้าง array ของ permissions ย่อย
        const permissionsPayload = ['view', 'create', 'edit', 'delete'].map(suffix => ({
            name: `${formData.name}.${suffix}`,
            guard_name: formData.guard_name,
        }));

        if (mode === 'create') {
            post(route('permissions.store'), {
                data: { permissions: permissionsPayload }, // ส่งเป็น array
                onSuccess: () => {
                    Swal.fire({
                        title: 'สำเร็จ!',
                        text: 'สร้าง Permission ทั้ง 4 ตัวเรียบร้อยแล้ว',
                        icon: 'success',
                        timer: 1500,
                        showConfirmButton: false
                    });
                    reset();
                    onSuccess?.();
                    onClose();
                },
            });
        } else if (mode === 'edit' && data?.id) {
            // สำหรับ edit สามารถปรับได้ตาม backend ว่าต้องแก้ทีละตัวหรือ overwrite 4 ตัว
            put(route('permissions.update', data.id), {
                data: { permissions: permissionsPayload },
                onSuccess: () => {
                    Swal.fire({
                        title: 'สำเร็จ!',
                        text: 'แก้ไข Permission ทั้ง 4 ตัวเรียบร้อยแล้ว',
                        icon: 'success',
                        timer: 1500,
                        showConfirmButton: false
                    });
                    onSuccess?.();
                    onClose();
                },
            });
        }
    };

    return (
        <div className="max-w-lg mx-auto p-6 bg-white rounded-xl shadow-lg transform transition-all font-anuphan">
            <div className="mb-6 border-b pb-4">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                    {mode === 'create' ? 'สร้าง Permission ใหม่' : 'แก้ไข Permission'}
                </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        ชื่อ Permission <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={e => setData('name', e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="เช่น: user, post"
                    />
                    {errors.name && <p className="text-red-600 mt-1">{errors.name}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Guard Name <span className="text-red-500 ml-1">*</span>
                    </label>
                    <select
                        value={formData.guard_name}
                        onChange={e => setData('guard_name', e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <option value="web">Web</option>
                        <option value="api">API</option>
                    </select>
                    {errors.guard_name && <p className="text-red-600 mt-1">{errors.guard_name}</p>}
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                    <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-lg border border-gray-300 bg-white">
                        ยกเลิก
                    </button>
                    <button type="submit" disabled={processing} className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white">
                        {mode === 'create' ? 'สร้าง' : 'บันทึก'}
                    </button>
                </div>
            </form>
        </div>
    );
}
