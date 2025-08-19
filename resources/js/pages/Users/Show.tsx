
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head,Link, useForm } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'User Show',
        href: '/users',
    },
];

export default function Show({ user }) {

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="User Show" />

            <div className="p-4 sm:p-6 max-w-2xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">Create New User</h1>
                    <Link
                        href={route('users.index')}
                        className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                        Back to Users
                    </Link>
                </div>

                <div className="">
                    <p><strong>Name: </strong> {user.name}</p>
                    <p><strong>Email: </strong> {user.email}</p>
                </div>
            </div>
        </AppLayout>
    );
}
