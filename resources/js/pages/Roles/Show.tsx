import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Roles Show',
        href: '/roles',
    },
];

export default function show({ role,  permissions }) {

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Role Show" />

            <div className="mx-auto w-full p-4 sm:p-6">
                <div className="mb-6 flex items-center justify-between">
                    <Link
                        href={route('roles.index')}
                        className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 transition-all hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path
                                fillRule="evenodd"
                                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                                clipRule="evenodd"
                            />
                        </svg>
                        Back to Roles
                    </Link>
                </div>

                <div>
                    <p>
                        <strong>Name: </strong> {role.name}
                    </p>
                    <p>
                        <strong>Permissions: </strong>
                    </p>
                    {permissions.map((permission) => (
                        <span className="text-sx mr-2 rounded bg-green-100 px-2.5 py-0.5 font-medium text-green-800">{permission}</span>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}
