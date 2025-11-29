import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { usePage } from '@inertiajs/react';
import CPORecordList from './CPORecordList';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Stock CPO', href: '#' },
];

export default function CPOIndex() {
    const { records, flash } = usePage().props as {
        records: any[];
        flash?: { success?: string; error?: string };
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="min-h-screen bg-gray-100">
                <CPORecordList flash={flash} />
            </div>
        </AppLayout>
    );
}
