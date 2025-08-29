import DeleteModal from '@/components/DeleteModal';
import ModalForm from '@/components/ModalForm';
import AppLayout from '@/layouts/app-layout';
import { can } from '@/lib/can';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import UseForm from './UseForm';
import Show from './Show';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Users', href: '/users' },
];

interface Employee {
    EmpID: string | number;
    EmpName: string;
    EmpCode: string;
    Position: string;
    DeptID: string;
    Tel: string;
    Email: string;
    Address: string;
}

interface User {
    id: number;
    name: string;
    email: string;
    employee_id?: string | number | null;
    roles: Array<{ id: number | string; name: string }>;
    webapp_emp?: Employee;
}

interface Role {
    id: number | string;
    name: string;
}

interface Props {
    roles: Role[];
    users: User[];
    employees?: Employee[];
    userRoles?: any[];
    allEmployees?: Employee[];
}

export default function Index({ roles, users, employees = [], userRoles = [], allEmployees = [] }: Props) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [mode, setMode] = useState('create');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedUserForView, setSelectedUserForView] = useState<User | null>(null);

    useEffect(() => {
        console.log('Users data:', users);
        console.log('All Employees data:', allEmployees);
    }, [users, allEmployees]);

    function openCreate() {
        setMode('create');
        setSelectedUser(null);
        setIsModalOpen(true);
    }

    function openView(user: User) {
        setSelectedUserForView(user);
        setIsViewModalOpen(true);
    }

    function openEdit(user: User) {
        setMode('edit');
        setSelectedUser(user);
        setIsModalOpen(true);
    }

    const openDeleteModal = (user: User) => {
        setSelectedUserId(user.id);
        setIsDeleteModalOpen(true);
    };

    const closeDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setSelectedUserId(null);
    };

    const handleDelete = () => {
        if (selectedUserId) {
            router.delete(route('users.destroy', selectedUserId), {
                onSuccess: () => {
                    closeDeleteModal();
                    router.reload({ only: ['users'] });
                },
                preserveScroll: true,
            });
        }
    };

    const reloadUsers = () => {
        router.reload({ only: ['users'] });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="User Management" />

            {/* Root wrapper ใช้ฟอนต์ Anuphan */}
            <div className="mx-auto w-full px-4 py-6 sm:px-6 lg:px-8 font-sans" style={{ fontFamily: 'var(--font-anuphan)' }}>
                {/* Header Section */}
                <div className="mb-6 sm:flex sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                        <p className="mt-1 text-sm text-gray-600">
                            Manage all registered users and their permissions
                        </p>
                    </div>
                    <div className="mt-4 flex items-center space-x-3 sm:mt-0">
                        {can('users.create') && (
                            <button
                                onClick={openCreate}
                                className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
                            >
                                <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                </svg>
                                Create User
                            </button>
                        )}
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {/** Total Users **/}
                    <div className="rounded-lg bg-white p-4 shadow-sm border border-gray-200">
                        <div className="flex items-center">
                            <div className="rounded-lg bg-indigo-100 p-2">
                                <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <h3 className="text-sm font-medium text-gray-600">Total Users</h3>
                                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                            </div>
                        </div>
                    </div>
                    {/** Linked Employees **/}
                    <div className="rounded-lg bg-white p-4 shadow-sm border border-gray-200">
                        <div className="flex items-center">
                            <div className="rounded-lg bg-green-100 p-2">
                                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 11.955 0 0112 2.944a11.955 11.955 11.955 0 01-8.618 3.04A12.02 12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <h3 className="text-sm font-medium text-gray-600">Linked Employees</h3>
                                <p className="text-2xl font-bold text-gray-900">{users.filter(u => u.employee_id).length}</p>
                            </div>
                        </div>
                    </div>
                    {/** Available Roles **/}
                    <div className="rounded-lg bg-white p-4 shadow-sm border border-gray-200">
                        <div className="flex items-center">
                            <div className="rounded-lg bg-blue-100 p-2">
                                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <h3 className="text-sm font-medium text-gray-600">Available Roles</h3>
                                <p className="text-2xl font-bold text-gray-900">{roles.length}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Users Table */}
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">User</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Employee Info</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Roles</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {users.map((user) => (
                                    <tr key={user.id} className="transition-colors hover:bg-gray-50">
                                        {/* User */}
                                        <td className="whitespace-nowrap px-6 py-4">
                                            <div className="flex items-center">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100">
                                                    <span className="font-medium text-indigo-800">{user.name.charAt(0).toUpperCase()}</span>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                                    <div className="text-sm text-gray-500">{user.email}</div>
                                                    <div className="text-xs text-gray-400">ID: {user.id}</div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Employee Info */}
                                        <td className="whitespace-nowrap px-6 py-4">
                                            {user.webapp_emp ? (
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">{user.webapp_emp.EmpName}</div>
                                                    <div className="text-sm text-gray-500">{user.webapp_emp.EmpCode} • {user.webapp_emp.Position}</div>
                                                    <div className="text-xs text-gray-400">Emp ID • {user.employee_id}</div>
                                                </div>
                                            ) : (
                                                <div className="text-sm text-gray-400">Not linked to employee</div>
                                            )}
                                        </td>

                                        {/* Roles */}
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {user.roles.length > 0 ? user.roles.map(role => (
                                                    <span key={role.id} className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">{role.name}</span>
                                                )) : <span className="text-xs text-gray-400">No roles</span>}
                                            </div>
                                        </td>

                                        {/* Actions */}
                                        <td className="whitespace-nowrap px-6 py-4">
                                            <div className="flex items-center space-x-2">
                                                <button onClick={() => openView(user)} className="inline-flex items-center rounded-md bg-indigo-100 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-200 transition-colors">
                                                    View
                                                </button>
                                                {can('users.edit') && <button onClick={() => openEdit(user)} className="inline-flex items-center rounded-md bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-200 transition-colors">Edit</button>}
                                                {can('users.delete') && <button onClick={() => openDeleteModal(user)} className="inline-flex items-center rounded-md bg-red-100 px-3 py-1.5 text-xs font-medium text-red-800 hover:bg-red-200 transition-colors">Delete</button>}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {users.length === 0 && (
                    <div className="mt-8 text-center text-gray-400">
                        <h3 className="text-sm font-medium">No users found</h3>
                        <p className="mt-1 text-sm">Get started by creating a new user.</p>
                        {can('users.create') && <button onClick={openCreate} className="mt-6 inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">Create User</button>}
                    </div>
                )}
            </div>

            {/* Delete Modal */}
            <DeleteModal
                isModalOpen={isDeleteModalOpen}
                onClose={closeDeleteModal}
                title="Delete User"
                onConfirm={handleDelete}
            >
                <p className="text-sm text-gray-500">Are you sure you want to delete this user? This action cannot be undone.</p>
            </DeleteModal>

            {/* Create/Edit Modal */}
            <ModalForm
                isModalOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={mode === 'create' ? 'Create New User' : 'Edit User'}
                size="max-w-4xl"
            >
                <UseForm
                    mode={mode}
                    user={selectedUser}
                    roles={roles}
                    employees={allEmployees}
                    onClose={() => setIsModalOpen(false)}
                    userRoles={userRoles}
                    currentEmployee={selectedUser?.webapp_emp || null}
                />
            </ModalForm>

            {/* View Modal */}
            <ModalForm
                isModalOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                title={`User Details: ${selectedUserForView?.name || ''}`}
                size="max-w-3xl"
            >
                {selectedUserForView && <Show user={selectedUserForView} />}
            </ModalForm>
        </AppLayout>
    );
}
