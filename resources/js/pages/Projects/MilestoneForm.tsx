import { useForm } from '@inertiajs/react';
import { useEffect } from 'react';
import Swal from 'sweetalert2';


export default function MilestoneForm({ mode = 'create', milestone = null, projectId, onClose = () => {} }) {
    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: '',
        description: '',
        due_date: '',
    });

    useEffect(() => {
        if (mode === 'edit' && milestone) {
            setData({
                name: milestone.name || '',
                description: milestone.description || '',
                due_date: milestone.due_date || '',
            });
            console.log('milestone:', milestone);
        } else {
            reset();
        }
    }, [mode, milestone]);

    const submit = (e) => {
        e.preventDefault();

        if (mode === 'create') {
            post(route('milestones.store', projectId), {
                onSuccess: () => {
                    Swal.fire({
                        position: 'center',
                        icon: 'success',
                        title: 'บันทึก Milestone สำเร็จ',
                        timer: 1500,
                        showConfirmButton: false,
                        customClass: {
                            popup: 'custom-swal',
                        },
                    });
                    reset();
                    onClose();
                },
            });
        } else {
            put(
                route('milestones.update', {
                    project: projectId,
                    milestone: milestone.id, // 👈 ต้องส่ง id ของ milestone
                }),
                {
                    onSuccess: () => {
                        Swal.fire({
                            position: 'center',
                            icon: 'success',
                            title: 'อัพเดท Milestone สำเร็จ',
                            timer: 1500,
                            showConfirmButton: false,
                            customClass: {
                                popup: 'custom-swal',
                            },
                        });
                        onClose();
                    },
                },
            );
        }
    };

    return (
        <form onSubmit={submit} className="mt-2 space-y-4 font-anuphan">
            {/* Name */}
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    ชื่อ Milestone <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    id="name"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    required
                    className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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

            {/* Due Date */}
            <div>
                <label htmlFor="due_date" className="block text-sm font-medium text-gray-700">
                    วันที่กำหนด <span className="text-red-500">*</span>
                </label>
                <input
                    type="date"
                    id="due_date"
                    value={data.due_date}
                    onChange={(e) => setData('due_date', e.target.value)}
                    required
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
