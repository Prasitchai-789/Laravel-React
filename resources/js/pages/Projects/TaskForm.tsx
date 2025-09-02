import { useForm } from '@inertiajs/react';
import { useEffect } from 'react';
import Swal from 'sweetalert2';

export default function TaskForm({ mode = 'create', task = null, projectId, onClose = () => {} }) {
    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: '',
        description: '',
        status: 'not_started',
        progress: 0,
        due_date: '',
    });

    useEffect(() => {
        if (mode === 'edit' && task) {
            setData({
                name: task.name || '',
                description: task.description || '',
                status: task.status || 'not_started',
                progress: task.progress || 0,
                due_date: task.due_date || '',
            });
        } else {
            reset();
        }
    }, [mode, task]);

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
    const submit = (e) => {
        e.preventDefault();

        if (mode === 'create') {
            post(route('tasks.store', { project: projectId }), {
                onSuccess: () => {
                    Toast.fire({
                        icon: 'success',
                        title: 'Signed in successfully',
                    });
                    reset();
                    onClose();
                },
            });
        } else {
            put(route('tasks.update', { project: projectId, task: task.id }), {
                onSuccess: () => {
                    Toast.fire({
                        icon: 'success',
                        title: 'อัพเดท Task สำเร็จ',
                    });
                    onClose();
                },
            });
        }
    };

    return (
        <form onSubmit={submit} className="mt-2 space-y-4 font-anuphan">
            {/* Name */}
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    ชื่อ Task <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    id="name"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    required
                    className="block w-full rounded-md border border-gray-300 px-4 py-2.5 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
            </div>

            {/* Description */}
            <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    รายละเอียด
                </label>
                <textarea
                    id="description"
                    value={data.description}
                    onChange={(e) => setData('description', e.target.value)}
                    className="block w-full rounded-md border border-gray-300 px-4 py-2.5 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                {errors.description && <p className="text-sm text-red-600">{errors.description}</p>}
            </div>

            {/* Status */}
            <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                    สถานะ
                </label>
                <select
                    id="status"
                    value={data.status}
                    onChange={(e) => setData('status', e.target.value)}
                    className="block w-full rounded-md border border-gray-300 px-4 py-2.5 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                    <option value="not_started">⏳ ยังไม่เริ่ม</option>
                    <option value="in_progress">🚧 กำลังดำเนินการ</option>
                    <option value="completed">✅ เสร็จสิ้น</option>
                </select>
                {errors.status && <p className="text-sm text-red-600">{errors.status}</p>}
            </div>

            {/* Progress */}
            <div>
                <label htmlFor="progress" className="block text-sm font-medium text-gray-700">
                    ความคืบหน้า (%)
                </label>
                <input
                    type="number"
                    id="progress"
                    min="0"
                    max="100"
                    value={data.progress}
                    onChange={(e) => setData('progress', e.target.value)}
                    className="block w-full rounded-md border border-gray-300 px-4 py-2.5 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                {errors.progress && <p className="text-sm text-red-600">{errors.progress}</p>}
            </div>

            {/* Due Date */}
            <div>
                <label htmlFor="due_date" className="block text-sm font-medium text-gray-700">
                    วันครบกำหนด
                </label>
                <input
                    type="date"
                    id="due_date"
                    value={data.due_date}
                    onChange={(e) => setData('due_date', e.target.value)}
                    className="block w-full rounded-md border border-gray-300 px-4 py-2.5 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                {errors.due_date && <p className="text-sm text-red-600">{errors.due_date}</p>}
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 border-t pt-4">
                <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={processing}
                    className="inline-flex justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                    {mode === 'create' ? 'Create' : 'Update'}
                </button>
            </div>
        </form>
    );
}
