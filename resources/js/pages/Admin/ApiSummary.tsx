import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Database, FileJson, LockKeyhole, Search, ServerCog } from 'lucide-react';
import { useMemo, useState } from 'react';

type ApiRoute = {
    methods: string[];
    uri: string;
    name: string;
    group: string;
    description: string;
    controller: string | null;
    action: string | null;
    parameters: string[];
    query_hints: string[];
    middleware: string[];
};

type Props = {
    apiRoutes: ApiRoute[];
    groups: string[];
    summary: {
        total: number;
        get: number;
        write: number;
    };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'สรุป API', href: '/admin/api-summary' },
];

const methodClass = (method: string) => {
    if (method === 'GET') return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
    if (method === 'POST') return 'bg-blue-50 text-blue-700 ring-blue-200';
    if (method === 'PUT' || method === 'PATCH') return 'bg-amber-50 text-amber-700 ring-amber-200';
    if (method === 'DELETE') return 'bg-rose-50 text-rose-700 ring-rose-200';
    return 'bg-slate-50 text-slate-700 ring-slate-200';
};

const displayValue = (values: string[]) => (values.length ? values.join(', ') : '-');

export default function ApiSummary({ apiRoutes, groups, summary }: Props) {
    const [search, setSearch] = useState('');
    const [selectedGroup, setSelectedGroup] = useState('all');

    const filteredRoutes = useMemo(() => {
        const keyword = search.trim().toLowerCase();

        return apiRoutes.filter((route) => {
            const matchesGroup = selectedGroup === 'all' || route.group === selectedGroup;
            const text = [
                route.uri,
                route.name,
                route.group,
                route.description,
                route.controller ?? '',
                route.action ?? '',
                route.methods.join(' '),
            ]
                .join(' ')
                .toLowerCase();

            return matchesGroup && (!keyword || text.includes(keyword));
        });
    }, [apiRoutes, search, selectedGroup]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="API Summary" />

            <div className="mx-auto w-full px-4 py-6 font-anuphan sm:px-6 lg:px-8">
                <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">สรุป API ในระบบ</h1>
                        <p className="mt-1 text-sm text-slate-600">รวมรายการ endpoint ที่เป็น API พร้อมคำอธิบายว่าแต่ละเส้นใช้ดึงหรือบันทึกข้อมูลอะไร</p>
                    </div>
                </div>

                <div className="mb-6 grid gap-4 md:grid-cols-3">
                    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-slate-100 p-2 text-slate-700">
                                <ServerCog className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-600">API ทั้งหมด</p>
                                <p className="text-2xl font-bold text-slate-900">{summary.total.toLocaleString('th-TH')}</p>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700">
                                <Database className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-600">เส้นสำหรับดึงข้อมูล</p>
                                <p className="text-2xl font-bold text-slate-900">{summary.get.toLocaleString('th-TH')}</p>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-blue-100 p-2 text-blue-700">
                                <FileJson className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-600">เส้นสำหรับบันทึก/แก้ไข</p>
                                <p className="text-2xl font-bold text-slate-900">{summary.write.toLocaleString('th-TH')}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="grid gap-3 md:grid-cols-5">
                        <div className="md:col-span-3">
                            <label className="mb-1 block text-xs font-medium text-slate-700">ค้นหา API</label>
                            <div className="relative">
                                <Search className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
                                <input
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    className="w-full rounded-lg border border-slate-300 py-2 pr-3 pl-9 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none"
                                    placeholder="ค้นหาจาก path, ชื่อ api, controller, คำอธิบาย"
                                />
                            </div>
                        </div>
                        <div className="md:col-span-2">
                            <label className="mb-1 block text-xs font-medium text-slate-700">กลุ่ม API</label>
                            <select
                                value={selectedGroup}
                                onChange={(event) => setSelectedGroup(event.target.value)}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none"
                            >
                                <option value="all">ทั้งหมด</option>
                                {groups.map((group) => (
                                    <option key={group} value={group}>
                                        {group}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex flex-col gap-2 border-b border-slate-200 px-4 py-3 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
                        <span>
                            แสดง {filteredRoutes.length.toLocaleString('th-TH')} จาก {apiRoutes.length.toLocaleString('th-TH')} เส้น
                        </span>
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                            <LockKeyhole className="h-3.5 w-3.5" />
                            แสดงเฉพาะ middleware auth/permission ที่เกี่ยวข้อง
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 text-sm">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Method</th>
                                    <th className="px-4 py-3 text-left font-semibold text-slate-700">ชื่อ API / Path</th>
                                    <th className="px-4 py-3 text-left font-semibold text-slate-700">ใช้ทำอะไร</th>
                                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Controller</th>
                                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Params</th>
                                    {/* <th className="px-4 py-3 text-left font-semibold text-slate-700">สิทธิ์</th> */}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {filteredRoutes.map((route) => (
                                    <tr key={`${route.methods.join('|')}-${route.uri}`} className="align-top hover:bg-slate-50">
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-1">
                                                {route.methods.map((method) => (
                                                    <span key={method} className={`rounded-full px-2 py-0.5 text-xs font-bold ring-1 ${methodClass(method)}`}>
                                                        {method}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-slate-900">{route.name}</div>
                                            <div className="mt-1 whitespace-nowrap font-mono text-xs text-blue-700">{route.uri}</div>
                                            <div className="mt-1 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{route.group}</div>
                                        </td>
                                        <td className="max-w-md px-4 py-3 text-slate-700">{route.description}</td>
                                        <td className="px-4 py-3">
                                            <div className="font-mono text-xs text-slate-700">{route.controller ?? '-'}</div>
                                            <div className="mt-1 font-mono text-xs text-slate-500">{route.action ?? '-'}</div>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-slate-600">
                                            <div>
                                                <span className="font-semibold text-slate-700">path:</span> {displayValue(route.parameters)}
                                            </div>
                                            <div className="mt-1">
                                                <span className="font-semibold text-slate-700">query:</span> {displayValue(route.query_hints)}
                                            </div>
                                        </td>
                                        {/* <td className="max-w-xs px-4 py-3 text-xs text-slate-600">{displayValue(route.middleware)}</td> */}
                                    </tr>
                                ))}
                                {filteredRoutes.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                                            ไม่พบ API ตามเงื่อนไขที่ค้นหา
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
