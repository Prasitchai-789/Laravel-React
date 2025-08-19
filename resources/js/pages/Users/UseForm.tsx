import { router, useForm } from '@inertiajs/react';
import { useEffect } from 'react';
import Swal from 'sweetalert2';

export default function UserForm({ mode = 'create', user = null, roles = [], onClose = () => {}, userRoles }) {
    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        roles: [],
    });

    useEffect(() => {
        if (mode === 'edit' && user) {
            const userRoleNames = user.roles.map((r) => r.name);
            setData({
                name: user.name || '',
                email: user.email || '',
                password: '',
                roles: userRoleNames,
            });
        } else {
            reset();
        }
    }, [mode, user]);
    function handleCheckboxChange(roleName, checked) {
        if (checked) {
            setData('roles', [...data.roles, roleName]);
        } else {
            setData(
                'roles',
                data.roles.filter((name) => name !== roleName),
            );
        }
    }

    const submit = (e) => {
        e.preventDefault();
        if (mode === 'create') {
            post(route('users.store'), {
                onSuccess: () => {
                    Swal.fire({
                        position: 'top-end',
                        icon: 'success',
                        title: 'บันทึกข้อมูลสำเร็จ',
                        showConfirmButton: false,
                        timer: 1500,
                        customClass: {
                            popup: 'custom-swal',
                        },
                    });
                    reset();
                    onClose();
                    router.get(route('users.index'));
                },
            });
        } else {
            put(route('users.update', user.id), {
                onSuccess: () => {
                    Swal.fire({
                        position: 'center',
                        icon: 'success',
                        title: 'อัพเดทข้อมูลสำเร็จ',
                        showConfirmButton: false,
                        timer: 1500,
                        customClass: {
                            popup: 'custom-swal',
                        },
                    });
                    onClose();
                    router.get(route('users.index'));
                },
            });
        }
    };

    return (
        <form onSubmit={submit} className="mt-2 space-y-4">
            {/* Name Field */}
            <div className="sm:col-span-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Full Name <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    id="name"
                    name="name"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    required
                    className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Enter your full name"
                />
                {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
            </div>

            {/* Email Field */}
            <div className="sm:col-span-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email Address <span className="text-red-500">*</span>
                </label>
                <input
                    type="email"
                    id="email"
                    name="email"
                    value={data.email}
                    onChange={(e) => setData('email', e.target.value)}
                    required
                    className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Enter your email address"
                />
                {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
            </div>

            {/* Password Field */}
            <div className="sm:col-span-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password {mode === 'create' && <span className="text-red-500">*</span>}
                </label>
                <input
                    type="password"
                    id="password"
                    name="password"
                    value={data.password}
                    onChange={(e) => setData('password', e.target.value)}
                    required={mode === 'create'}
                    minLength={8}
                    className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder={mode === 'edit' ? 'Leave blank to keep current password' : ''}
                />
                {errors.password && <p className="text-sm text-red-600">{errors.password}</p>}
                <p className="mt-1 text-xs text-gray-500">Minimum 8 characters</p>
            </div>

            {/* Roles */}
            <div>
                <label className="mb-1 block text-sm font-medium">Roles</label>
                <div className="space-y-1">
                    {roles.map((role) => (
                        <label key={role.id} className="flex items-center text-sm">
                            <input
                                type="checkbox"
                                value={role.name}
                                checked={data.roles.includes(role.name)}
                                onChange={(e) => handleCheckboxChange(role.name, e.target.checked)}
                                className="mr-2"
                            />
                            <span>{role.name}</span>
                        </label>
                    ))}
                </div>
                {errors.roles && <p className="mt-1 text-sm text-red-500">{errors.roles}</p>}
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 border-t pt-4">
                <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={processing}
                    className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                >
                    {mode === 'create' ? 'Create' : 'Update'}
                </button>
            </div>
        </form>
    );
}
