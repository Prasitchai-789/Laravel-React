import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { can } from '@/lib/can';
import { useState } from 'react';
import Swal from 'sweetalert2';
import ModalForm from '@/components/ModalForm';
import UseForm from './UseForm';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Roles', href: '/roles' },
];

export default function Index({ roles, rolesPermissions }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editRole, setEditRole] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Filter roles based on search term
    const filteredRoles = roles.filter(role =>
        role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        role.permissions.some(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Calculate total permissions (unique permissions across all roles)
    const allPermissions = roles.flatMap(role => role.permissions);
    const uniquePermissions = [...new Set(allPermissions.map(p => p.id))];
    const totalPermissions = uniquePermissions.length;

    // ก่อน return
    const canEdit = can('roles.edit');
    const canDelete = can('roles.delete');
    const showActions = canEdit || canDelete;

    function handleDelete(id, name) {
        Swal.fire({
            title: `Are you sure?`,
            text: `Do you really want to delete the role "${name}"? This action cannot be undone.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel',
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(route('roles.destroy', id), {
                    onSuccess: () => {
                        Swal.fire({
                            title: 'Deleted!',
                            text: `Role "${name}" has been deleted successfully.`,
                            icon: 'success',
                            timer: 2000,
                            showConfirmButton: false,
                        });
                    },
                });
            }
        });
    }

    function openEditModal(role) {
        setEditRole(role);
        setIsModalOpen(true);
    }

    function closeModal() {
        setIsModalOpen(false);
        setEditRole(null);
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Role Management" />

            <div className="mx-auto w-full px-4 py-8 sm:px-6 lg:px-8 font-anuphan">
                {/* Header Section */}
                <div className="mb-4">
                    <h1 className="text-3xl font-bold text-gray-900">Role Management</h1>
                    <p className="mt-2 text-gray-600">
                        Manage user roles and their permissions in the system
                    </p>
                </div>

                {/* Search and Create Button in the same row */}
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between font-anuphan">
                    <div className="relative w-full sm:max-w-xs">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Search roles or permissions..."
                            className="block w-full rounded-xl border-0 bg-white py-3 pl-10 pr-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {can('roles.create') && (
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center justify-center rounded-3xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-3 text-sm font-medium text-white shadow-lg transition-all hover:from-indigo-700 hover:to-purple-700 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
                        >
                            <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                            </svg>
                            Create Role
                        </button>
                     )}
                </div>

                {/* Stats Section */}
                <div className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-2 font-anuphan">
                    <div className="rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 p-4 shadow-sm">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 rounded-lg bg-indigo-100 p-2">
                                <svg className="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 9V5a3 3 0 016 0v4M5 9h14a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2v-7a2 2 0 012-2z"></path>
                                </svg>
                            </div>
                            <div className="ml-4">
                                <h3 className="text-sm font-medium text-gray-700">Total Roles</h3>
                                <p className="text-2xl font-bold text-gray-900">{roles.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 p-4 shadow-sm">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 rounded-lg bg-green-100 p-2">
                                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                                </svg>
                            </div>
                            <div className="ml-4">
                                <h3 className="text-sm font-medium text-gray-700">Total Permissions</h3>
                                <p className="text-2xl font-bold text-gray-900">{totalPermissions}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Roles Table */}
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg font-anuphan">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Role
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Permissions
                                    </th>
                                    {showActions && (
                                        <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                            Actions
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {filteredRoles.length > 0 ? (
                                    filteredRoles.map(({ id, name, permissions }) => (
                                        <tr key={id} className="transition-all hover:bg-gray-50/80">
                                            <td className="whitespace-nowrap px-6 py-5">
                                                <div className="flex items-center">
                                                    <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center shadow-sm">
                                                        <svg className="h-5 w-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 9V5a3 3 0 016 0v4M5 9h14a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2v-7a2 2 0 012-2z"></path>
                                                        </svg>
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-base font-semibold text-gray-900">{name}</div>
                                                        <div className="text-sm text-gray-500">ID: {id}</div>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-6 py-5">
                                                <div className="flex flex-wrap gap-2">
                                                    {permissions.length > 0 ? (
                                                        permissions.map((permission) => (
                                                            <span
                                                                key={permission.id}
                                                                className="inline-flex items-center rounded-full bg-gradient-to-r from-green-100 to-emerald-100 px-3 py-1 text-xs font-medium text-green-800 shadow-sm"
                                                            >
                                                                {permission.name}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-sm text-gray-400 italic">No permissions assigned</span>
                                                    )}
                                                </div>
                                            </td>

                                            {showActions && (
                                                <td className="whitespace-nowrap px-6 py-5">
                                                    <div className="flex items-center space-x-3">
                                                        {canEdit && (
                                                            <button
                                                                onClick={() => openEditModal({ id, name, permissions })}
                                                                className="inline-flex items-center rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50 px-4 py-2.5 text-sm font-medium text-blue-700 transition-all hover:from-blue-100 hover:to-cyan-100 hover:shadow-sm"
                                                            >
                                                                <svg className="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                                                </svg>
                                                                Edit
                                                            </button>
                                                        )}
                                                        {canDelete && (
                                                            <button
                                                                onClick={() => handleDelete(id, name)}
                                                                className="inline-flex items-center rounded-xl bg-gradient-to-r from-red-50 to-pink-50 px-4 py-2.5 text-sm font-medium text-red-700 transition-all hover:from-red-100 hover:to-pink-100 hover:shadow-sm"
                                                            >
                                                                <svg className="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                                                </svg>
                                                                Delete
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={showActions ? 3 : 2} className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center justify-center text-gray-400">
                                                <svg className="h-16 w-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                                </svg>
                                                <p className="text-lg font-medium">No roles found</p>
                                                <p className="mt-1 text-sm">
                                                    {searchTerm ? 'Try adjusting your search term' : 'Get started by creating your first role'}
                                                </p>
                                                {!searchTerm && can('roles.create') && (
                                                    <button
                                                        onClick={() => setIsModalOpen(true)}
                                                        className="mt-4 inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-indigo-700"
                                                    >
                                                        Create Your First Role
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Create/Edit Role Modal */}
            <ModalForm
                isModalOpen={isModalOpen}
                onClose={closeModal}
                title={editRole ? 'Edit Role' : 'Create Role'}
                size="max-w-lg"
            >
                <UseForm
                    permissions={rolesPermissions}
                    role={editRole}
                    onClose={closeModal}
                    onSuccess={() => {
                        closeModal();
                        router.reload({ only: ['roles'] });
                        Swal.fire({
                            icon: 'success',
                            title: editRole ? 'Role updated successfully!' : 'Role created successfully!',
                            timer: 2000,
                            showConfirmButton: false,
                        });
                    }}
                />
            </ModalForm>
        </AppLayout>
    );
}
