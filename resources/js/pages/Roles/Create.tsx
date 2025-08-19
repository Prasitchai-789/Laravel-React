
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head,Link, useForm } from '@inertiajs/react';
import { permission } from 'process';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Roles Create',
        href: '/roles',
    },
];

export default function Create({premissions}) {

    const { data, setData, post,  errors } = useForm({
        name: '',
        permissions: [],
    });

    function handleCheckboxChange(permissionName,checked) {
        if (checked) {
            setData('permissions', [...data.permissions, permissionName]);
        } else {
            setData('permissions', data.permissions.filter(name => name !== permissionName));
        }

    }

    function submit(e) {
        e.preventDefault();
        post(route('roles.store'));
    }
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Role Create" />

            <div className="p-4 sm:p-6 w-full mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">Create New Role</h1>
                    <Link
                        href={route('roles.index')}
                        className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                        Back to Roles
                    </Link>
                </div>

                <div className="bg-white shadow-sm rounded-lg overflow-hidden p-6 border border-gray-100  w-full">
                    <form onSubmit={submit} className="space-y-6">
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            {/* Name Field */}
                            <div className="sm:col-span-2">
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                    Name
                                    <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    name="name"
                                    className="block w-full px-4 py-2.5 rounded-lg border border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-400 transition duration-150"
                                    placeholder="Enter name"
                                />
                               {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
                            </div>

                            <div className='grid gap-2'>
                                <label htmlFor="permissions" className="block text-sm font-medium text-gray-700 mb-1">
                                    Permissions
                                </label>
                                {premissions.map((permission) => (
                                    <label key={permission} className="block text-sm font-medium text-gray-700">
                                        <input
                                        type="checkbox"
                                        value={permission}
                                        onChange={(e) => handleCheckboxChange(permission,e.target.checked)}
                                        id={permission}
                                        className="mr-2 leading-tight" />
                                        <span className='text-gray-700'>{permission}</span>
                                    </label>
                                ))}
                                {errors.permissions && <p className="mt-1 text-sm text-red-500">{errors.permissions}</p>}
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                            <Link
                                href={route('roles.index')}
                                type="button"
                                className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                className="px-6 py-2.5 border border-transparent rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition"
                            >
                                Create Role
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
