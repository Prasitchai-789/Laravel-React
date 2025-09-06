import { useForm as inertiaUseForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { Search, Shield, Check, X } from 'lucide-react';

interface Props {
    permissions?: string[]; // ทั้งหมดที่มี
    role?: { id: number; name: string; permissions: { id: number; name: string }[] }; // สำหรับ edit
    onClose?: () => void;
    onSuccess?: () => void;
}

export default function UseForm({ permissions = [], role, onClose, onSuccess }: Props) {
    const { data, setData, post, put, errors, processing, reset } = inertiaUseForm({
        name: '',
        permissions: [] as string[],
    });

    const [searchTerm, setSearchTerm] = useState('');
    const [selectAll, setSelectAll] = useState(false);

    // โหลดข้อมูล role เก่าถ้ามี (edit)
    useEffect(() => {
        if (role) {
            // แปลง permissions เป็น string array
            const rolePermissionNames = role.permissions?.map(p => p.name) || [];
            setData({
                name: role.name,
                permissions: rolePermissionNames,
            });
            setSelectAll(rolePermissionNames.length === permissions.length && permissions.length > 0);
        } else {
            reset();
            setSelectAll(false);
        }
    }, [role, reset, setData, permissions]);

    // กรอง permissions ตามคำค้นหา
    const filteredPermissions = permissions.filter(permission =>
        permission.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // เลือกหรือยกเลิกทั้งหมด
    const toggleSelectAll = () => {
        if (selectAll) {
            setData('permissions', []);
            setSelectAll(false);
        } else {
            setData('permissions', [...permissions]);
            setSelectAll(true);
        }
    };

    const handleCheckboxChange = (permissionName: string, checked: boolean) => {
        if (checked) {
            setData('permissions', [...data.permissions, permissionName]);
        } else {
            setData('permissions', data.permissions.filter((name) => name !== permissionName));
        }

        // อัพเดตสถานะ selectAll
        if (checked && data.permissions.length + 1 === permissions.length) {
            setSelectAll(true);
        } else if (!checked && selectAll) {
            setSelectAll(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (role && role.id) {
            // edit
            put(route('roles.update', role.id), {
                onSuccess: () => {
                    Swal.fire({
                        position: 'top-end',
                        icon: 'success',
                        title: 'Role updated successfully',
                        showConfirmButton: false,
                        timer: 1500,
                    });
                    if (onSuccess) onSuccess();
                    if (onClose) onClose();
                },
            });
        } else {
            // create
            post(route('roles.store'), {
                onSuccess: () => {
                    Swal.fire({
                        position: 'top-end',
                        icon: 'success',
                        title: 'Role created successfully',
                        showConfirmButton: false,
                        timer: 1500,
                    });
                    reset();
                    if (onSuccess) onSuccess();
                    if (onClose) onClose();
                },
            });
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6  w-full font-anuphan">
            {/* Name Field */}
            <div className='font-anuphan'>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role Name <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    className="block w-full px-4 py-3 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-400 transition duration-200"
                    placeholder="Enter role name"
                />
                {errors.name && <p className="mt-2 text-sm text-red-500 flex items-center">
                    <X className="h-4 w-4 mr-1" /> {errors.name}
                </p>}
            </div>

            {/* Permissions Section */}
            <div>
                <div className="flex items-center justify-between mb-4 font-anuphan">
                    <label className="block text-sm font-medium text-gray-700">Permissions</label>
                    {permissions.length > 0 && (
                        <button
                            type="button"
                            onClick={toggleSelectAll}
                            className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors flex items-center"
                        >
                            {selectAll ? 'Deselect All' : 'Select All'}
                        </button>
                    )}
                </div>

                {/* Search Box */}
                {permissions.length > 5 && (
                    <div className="relative mb-4 font-anuphan">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-400 transition duration-200"
                            placeholder="Search permissions..."
                        />
                    </div>
                )}

                {/* Permissions List */}
                <div className="bg-gray-50 rounded-xl p-4 max-h-60 overflow-y-auto font-anuphan">
                    {filteredPermissions.length > 0 ? (
                        <div className="grid gap-3">
                            {filteredPermissions.map((permission) => (
                                <label
                                    key={permission}
                                    className="flex items-center p-3 rounded-lg bg-white shadow-sm hover:bg-indigo-50 transition-colors cursor-pointer border border-gray-200"
                                >
                                    <div className="flex items-center h-5">
                                        <input
                                            type="checkbox"
                                            checked={data.permissions.includes(permission)}
                                            onChange={(e) => handleCheckboxChange(permission, e.target.checked)}
                                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                        />
                                    </div>
                                    <div className="ml-3 flex items-center">
                                        <Shield className="h-4 w-4 text-indigo-500 mr-2" />
                                        <span className="text-sm font-medium text-gray-700">{permission}</span>
                                    </div>
                                </label>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-4">
                            <Search className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">No permissions found</p>
                        </div>
                    )}
                </div>

                {errors.permissions && (
                    <p className="mt-2 text-sm text-red-500 flex items-center">
                        <X className="h-4 w-4 mr-1" /> {errors.permissions}
                    </p>
                )}

                {/* Selected Count */}
                {permissions.length > 0 && (
                    <div className="mt-3 text-xs text-gray-500 flex justify-between">
                        <span>{data.permissions.length} of {permissions.length} permissions selected</span>
                        {searchTerm && (
                            <span>{filteredPermissions.length} results</span>
                        )}
                    </div>
                )}
            </div>

            {/* Buttons */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 font-anuphan">
                {onClose && (
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={processing}
                        className="px-5 py-2.5 border border-gray-300 rounded-3xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                        Cancel
                    </button>
                )}
                <button
                    type="submit"
                    disabled={processing || !data.name.trim()}
                    className="px-5 py-2.5 border border-transparent rounded-3xl text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 transition-all duration-200 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:transform-none disabled:cursor-not-allowed flex items-center"
                >
                    {processing ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            {role ? 'Updating...' : 'Creating...'}
                        </>
                    ) : (
                        <>
                            <Check className="h-4 w-4 mr-1" />
                            {role ? 'Update Role' : 'Create Role'}
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}
