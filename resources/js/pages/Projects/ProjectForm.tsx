import { useForm } from '@inertiajs/react';
import { useEffect } from 'react';
import Swal from 'sweetalert2';


export default function ProjectForm({ mode = 'create', project = null, onClose = () => {} }) {
    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: '',
        description: '',
        status: 'not_started',
    });

    useEffect(() => {
        console.log('mode:', mode, 'project:', project);
        if (mode === 'edit' && project) {
            setData({
                name: project.name || '',
                description: project.description || '',
                status: project.status || '',
            });
        } else {
            reset();
        }
    }, [mode, project]);

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
            console.log(data);
            post('/projects', {
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
    };

    return (
        <form onSubmit={submit} className="mt-2 space-y-4 font-anuphan">
            {/* Name */}
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    ชื่อ Project <span className="text-red-500">*</span>
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

            {/* Actions */}
            <div className="flex justify-end space-x-3 border-t pt-4">
                <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex justify-center rounded-3xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={processing}
                    className="inline-flex justify-center rounded-3xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                    {mode === 'create' ? 'Create' : 'Update'}
                </button>
            </div>
        </form>
    );
}
