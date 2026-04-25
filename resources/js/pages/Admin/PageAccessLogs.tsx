import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Activity, CalendarDays, Monitor, Search, Users } from 'lucide-react';
import { FormEvent, useState } from 'react';

type AccessUser = {
    id: number;
    name: string;
    email: string;
};

type PageAccessLog = {
    id: number;
    user_id: number | null;
    user_name: string | null;
    method: string;
    path: string;
    route_name: string | null;
    ip_address: string | null;
    user_agent: string | null;
    referer: string | null;
    status_code: number | null;
    accessed_at: string;
    user?: AccessUser | null;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type PaginatedLogs = {
    data: PageAccessLog[];
    links: PaginationLink[];
    from: number | null;
    to: number | null;
    total: number;
};

type Filters = {
    search?: string;
    user_id?: string;
    date_from?: string;
    date_to?: string;
};

type Props = {
    logs: PaginatedLogs;
    filters: Filters;
    users: AccessUser[];
    summary: {
        total: number;
        today: number;
        unique_users_today: number;
    };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'บันทึกการเข้าใช้งาน', href: '/admin/page-access-logs' },
];

const formatDateTime = (value: string) => {
    if (!value) return '-';
    return new Intl.DateTimeFormat('th-TH', {
        dateStyle: 'medium',
        timeStyle: 'medium',
    }).format(new Date(value));
};

const shortUserAgent = (agent?: string | null) => {
    if (!agent) return '-';
    if (agent.includes('Chrome')) return 'Chrome';
    if (agent.includes('Safari')) return 'Safari';
    if (agent.includes('Firefox')) return 'Firefox';
    if (agent.includes('Edg')) return 'Edge';
    return agent.slice(0, 64);
};

export default function PageAccessLogs({ logs, filters, users, summary }: Props) {
    const [form, setForm] = useState<Filters>({
        search: filters.search ?? '',
        user_id: filters.user_id ?? '',
        date_from: filters.date_from ?? '',
        date_to: filters.date_to ?? '',
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        router.get('/admin/page-access-logs', form, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const reset = () => {
        setForm({ search: '', user_id: '', date_from: '', date_to: '' });
        router.get('/admin/page-access-logs', {}, { preserveScroll: true, replace: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Page Access Logs" />

            <div className="mx-auto w-full px-4 py-6 font-anuphan sm:px-6 lg:px-8">
                <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">บันทึกการเข้าใช้งานหน้าเว็บ</h1>
                        <p className="mt-1 text-sm text-gray-600">ตรวจสอบผู้ใช้งาน เวลาเข้าใช้งาน หน้าเว็บ IP และอุปกรณ์ที่ใช้</p>
                    </div>
                </div>

                <div className="mb-6 grid gap-4 md:grid-cols-3">
                    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-blue-100 p-2 text-blue-700">
                                <Activity className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Log ทั้งหมด</p>
                                <p className="text-2xl font-bold text-gray-900">{summary.total.toLocaleString('th-TH')}</p>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700">
                                <CalendarDays className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">วันนี้</p>
                                <p className="text-2xl font-bold text-gray-900">{summary.today.toLocaleString('th-TH')}</p>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-violet-100 p-2 text-violet-700">
                                <Users className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">ผู้ใช้วันนี้</p>
                                <p className="text-2xl font-bold text-gray-900">{summary.unique_users_today.toLocaleString('th-TH')}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <form onSubmit={submit} className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="grid gap-3 md:grid-cols-5">
                        <div className="md:col-span-2">
                            <label className="mb-1 block text-xs font-medium text-gray-700">ค้นหา</label>
                            <div className="relative">
                                <Search className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-gray-400" />
                                <input
                                    value={form.search ?? ''}
                                    onChange={(e) => setForm((prev) => ({ ...prev, search: e.target.value }))}
                                    className="w-full rounded-lg border border-gray-300 py-2 pr-3 pl-9 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none"
                                    placeholder="ชื่อผู้ใช้, path, route, IP"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-700">ผู้ใช้</label>
                            <select
                                value={form.user_id ?? ''}
                                onChange={(e) => setForm((prev) => ({ ...prev, user_id: e.target.value }))}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none"
                            >
                                <option value="">ทั้งหมด</option>
                                {users.map((user) => (
                                    <option key={user.id} value={user.id}>
                                        {user.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-700">ตั้งแต่วันที่</label>
                            <input
                                type="date"
                                value={form.date_from ?? ''}
                                onChange={(e) => setForm((prev) => ({ ...prev, date_from: e.target.value }))}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-700">ถึงวันที่</label>
                            <input
                                type="date"
                                value={form.date_to ?? ''}
                                onChange={(e) => setForm((prev) => ({ ...prev, date_to: e.target.value }))}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none"
                            />
                        </div>
                    </div>
                    <div className="mt-4 flex justify-end gap-2">
                        <button type="button" onClick={reset} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                            ล้างตัวกรอง
                        </button>
                        <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
                            ค้นหา
                        </button>
                    </div>
                </form>

                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-200 px-4 py-3 text-sm text-gray-600">
                        แสดง {logs.from ?? 0}-{logs.to ?? 0} จาก {logs.total.toLocaleString('th-TH')} รายการ
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-700">เวลา</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-700">ผู้ใช้</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-700">หน้าเว็บ</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-700">IP</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-700">อุปกรณ์</th>
                                    <th className="px-4 py-3 text-right font-semibold text-gray-700">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {logs.data.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50">
                                        <td className="whitespace-nowrap px-4 py-3 text-gray-900">{formatDateTime(log.accessed_at)}</td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-gray-900">{log.user?.name ?? log.user_name ?? '-'}</div>
                                            <div className="text-xs text-gray-500">{log.user?.email ?? `User ID: ${log.user_id ?? '-'}`}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="max-w-xl truncate font-medium text-gray-900">{log.path}</div>
                                            <div className="text-xs text-gray-500">{log.route_name ?? '-'}</div>
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-gray-700">{log.ip_address ?? '-'}</td>
                                        <td className="px-4 py-3 text-gray-700">
                                            <div className="flex items-center gap-2">
                                                <Monitor className="h-4 w-4 text-gray-400" />
                                                <span>{shortUserAgent(log.user_agent)}</span>
                                            </div>
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-right">
                                            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                                {log.status_code ?? '-'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {logs.data.length === 0 && (
                        <div className="py-12 text-center text-sm text-gray-500">ยังไม่มีข้อมูล log ตามเงื่อนไขที่เลือก</div>
                    )}

                    <div className="flex flex-wrap items-center justify-end gap-2 border-t border-gray-200 px-4 py-3">
                        {logs.links.map((link, index) => (
                            link.url ? (
                                <Link
                                    key={`${link.label}-${index}`}
                                    href={link.url}
                                    preserveScroll
                                    className={`rounded-md px-3 py-1.5 text-sm ${
                                        link.active ? 'bg-blue-600 font-semibold text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ) : (
                                <span
                                    key={`${link.label}-${index}`}
                                    className="rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-400"
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            )
                        ))}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
