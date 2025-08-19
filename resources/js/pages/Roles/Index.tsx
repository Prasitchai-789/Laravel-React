
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head,Link, router } from '@inertiajs/react';
import { can } from '@/lib/can';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Roles',
        href: '/roles',
    },
];


export default function Index({ roles }) {

    function handleDelete(id) {
        if (confirm('Are you sure you want to delete this user?')) {
            router.delete(route('roles.destroy', id));
        }
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Roles" />

            <div className="p-4 sm:p-6">
                {can('roles.create') &&
                <Link href={route('roles.create')} className='px-3 py-1.5 text-xs font-medium rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2'>
                    Create
                </Link>
                }
                <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-lg overflow-hidden mt-2">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-300">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="py-3.5 pl-6 pr-3 text-left text-sm font-semibold text-gray-900">ID</th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Name</th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Permissions</th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {roles.map(({ id, name , permissions }) => (
                                    <tr key={id} className="hover:bg-gray-50 transition-colors duration-150">
                                        <td className="whitespace-nowrap py-4 pl-6 pr-3 text-sm font-medium text-gray-900">{id}</td>
                                        <td className="px-3 py-4 text-sm text-gray-600">{name}</td>
                                        <td className="px-3 py-4 text-sm text-gray-600">
                                            {permissions.map((permission) => (
                                                <span key={permission.id} className="bg-gray-100 text-gray-800 text-sx font-medium mr-2 px-2.5 py-0.5 rounded" className='bg-green-100 text-green-800 text-sx font-medium mr-2 px-2.5 py-0.5 rounded'>
                                                    {permission.name}
                                                </span>
                                            ))}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                            <div className="flex items-center space-x-2">
                                                <Link
                                                    href={route('roles.show',id)}
                                                    className="px-3 py-1.5 text-xs font-medium rounded-md bg-green-100 text-green-800 hover:bg-amber-200 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"

                                                >
                                                    Show
                                                </Link>
                                                <Link
                                                    href={route('roles.edit',id)}
                                                    className="px-3 py-1.5 text-xs font-medium rounded-md bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"

                                                >
                                                    Edit
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(id)}
                                                    className="px-3 py-1.5 text-xs font-medium rounded-md bg-red-100 text-red-800 hover:bg-red-200 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"

                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
