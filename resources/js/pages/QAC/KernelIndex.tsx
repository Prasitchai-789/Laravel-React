import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { usePage } from '@inertiajs/react';
import SiloRecordList from './components/SiloRecordList';


const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Kernel', href: '#' },
];

export default function KernelIndex() {
    const { records, flash } = usePage().props as {
        records: any[];
        flash?: { success?: string; error?: string };
    };
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="min-h-screen bg-gray-100">
                <SiloRecordList flash={flash} />
            </div>


        </AppLayout>
    );
}
