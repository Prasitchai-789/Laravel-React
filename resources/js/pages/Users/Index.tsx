import DeleteModal from '@/components/DeleteModal';
import ModalForm from '@/components/ModalForm';
import AppLayout from '@/layouts/app-layout';
import { can } from '@/lib/can';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import UseForm from './UseForm';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Users',
        href: '/users',
    },
    {
        title: 'Users',
        href: '/users',
    },
];

export default function Index({ users, roles }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [mode, setMode] = useState('create');
    const [selectedUser, setSelectedUser] = useState(null);

    // Delete modal state
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState(null);

    function openCreate() {
        setMode('create');
        setSelectedUser(null);
        setIsModalOpen(true);
    }

    function openEdit(user) {
        setMode('edit');
        setSelectedUser(user);
        setIsModalOpen(true);
    }

    // Delete modal functions
    const openDeleteModal = (id) => {
        setSelectedUserId(id);
        setIsDeleteModalOpen(true);
    };

    const closeDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setSelectedUserId(null);
    };

    const handleDelete = () => {
        if (selectedUserId) {
            router.delete(route('users.destroy', selectedUserId), {
                onSuccess: closeDeleteModal,
                preserveScroll: true,
            });
        }
    };
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Users" />

            <div className="mx-auto w-full px-4 py-6 sm:px-6 lg:px-8">
                <div className="mb-6 sm:flex sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl leading-tight font-bold text-gray-900">User Management</h1>
                        <p className="mt-1 text-sm text-gray-600">A list of all registered users including their details and permissions</p>
                    </div>
                    {can('users.create') && (
                        <div className="mt-4 sm:mt-0">
                            <button
                                onClick={openCreate}
                                className="inline-flex items-center rounded-md bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path
                                        fillRule="evenodd"
                                        d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                                Create User
                            </button>
                        </div>
                    )}
                </div>

                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-300">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="py-3.5 pr-3 pl-6 text-left text-sm font-semibold text-gray-900">
                                        ID
                                    </th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                        Name
                                    </th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                        Email
                                    </th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                        Roles
                                    </th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {users.map((u) => (
                                    <tr key={u.id} className="transition-colors duration-150 hover:bg-gray-50">
                                        <td className="py-4 pr-3 pl-6 text-sm font-medium whitespace-nowrap text-gray-900">{u.id}</td>
                                        <td className="px-3 py-4 text-sm text-gray-600">{u.name}</td>
                                        <td className="max-w-xs truncate px-3 py-4 text-sm text-gray-500 hover:max-w-none hover:whitespace-normal">
                                            {u.email}
                                        </td>
                                        <td className="px-3 py-4 text-sm text-gray-600">
                                            <div className="flex flex-wrap gap-2">
                                                {u.roles.map((role) => (
                                                    <span
                                                        key={role.id}
                                                        className="inline-flex items-center rounded-md bg-blue-100 px-2.5 py-1.5 text-xs font-medium text-blue-800"
                                                    >
                                                        {role.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-3 py-4 text-sm whitespace-nowrap text-gray-500">
                                            <div className="flex items-center space-x-2">
                                                <Link
                                                    href={route('users.show', u)}
                                                    className="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-1.5 text-xs font-medium text-gray-800 transition-colors hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:outline-none"
                                                >
                                                    View
                                                </Link>
                                                {can('users.edit') && (
                                                    <button
                                                        onClick={() => openEdit(u)}
                                                        className="inline-flex items-center rounded-md bg-amber-100 px-2.5 py-1.5 text-xs font-medium text-amber-800 transition-colors hover:bg-amber-200 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:outline-none"
                                                    >
                                                        Edit
                                                    </button>
                                                )}
                                                {can('users.delete') && (
                                                    <button
                                                        onClick={() => openDeleteModal(u)}
                                                        className="inline-flex items-center rounded-md bg-red-100 px-2.5 py-1.5 text-xs font-medium text-red-800 transition-colors hover:bg-red-200 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none"
                                                    >
                                                        Delete
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <DeleteModal isModalOpen={isDeleteModalOpen} onClose={closeDeleteModal} title="Delete User" onConfirm={handleDelete}>
                <p className="text-sm text-gray-500">Are you sure you want to delete this user? This action cannot be undone.</p>
            </DeleteModal>

            {/* Create Confirmation Modal */}
            <ModalForm isModalOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={mode === 'create' ? 'Create User' : 'Edit User'}>
                <UseForm mode={mode} user={selectedUser} roles={roles} onClose={() => setIsModalOpen(false)} />
            </ModalForm>
        </AppLayout>
    );
}
