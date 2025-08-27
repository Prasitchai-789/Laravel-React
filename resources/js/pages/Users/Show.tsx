import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Users',
        href: '/users',
    },
    {
        title: 'User Details',
        href: '',
    },
];

export default function Show({ user }) {
    return (          
            <div className="w-full font-['Anuphan',sans-serif]">
                {/* Main Content */}
                <div className="overflow-hidden rounded-2xl bg-white shadow-lg border border-gray-100">
                    {/* User Profile Header */}
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-6 text-white">
                        <div className="flex items-center space-x-4">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-2xl font-bold backdrop-blur-sm">
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold tracking-tight">{user.name}</h2>
                                <p className="text-indigo-100 text-sm opacity-90">{user.email}</p>
                                {user.employee_id && (
                                    <div className="mt-1 inline-flex items-center rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium backdrop-blur-sm">
                                        ID: {user.employee_id}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* User Details */}
                    <div className="px-6 py-6">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            {/* Basic Information */}
                            <div className="space-y-4 rounded-xl bg-gray-50 p-5">
                                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                    <svg className="mr-2 h-5 w-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    ข้อมูลพื้นฐาน
                                </h3>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                        <span className="text-gray-600 font-medium">ชื่อเต็ม</span>
                                        <span className="text-gray-900 font-semibold">{user.name}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                        <span className="text-gray-600 font-medium">อีเมล</span>
                                        <span className="text-gray-900 font-semibold">{user.email}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-gray-600 font-medium">รหัสพนักงาน</span>
                                        <span className={user.employee_id ? "text-gray-900 font-semibold" : "text-gray-400"}>
                                            {user.employee_id || 'ไม่ได้กำหนด'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Employee Information */}
                            <div className="space-y-4 rounded-xl bg-gray-50 p-5">
                                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                    <svg className="mr-2 h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    ข้อมูลพนักงาน
                                </h3>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                        <span className="text-gray-600 font-medium">ชื่อพนักงาน</span>
                                        <span className={user.webapp_emp?.EmpName ? "text-gray-900 font-semibold" : "text-gray-400"}>
                                            {user.webapp_emp?.EmpName || 'ไม่ได้เชื่อมโยง'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                        <span className="text-gray-600 font-medium">รหัสพนักงาน</span>
                                        <span className={user.webapp_emp?.EmpCode ? "text-gray-900 font-semibold" : "text-gray-400"}>
                                            {user.webapp_emp?.EmpCode || '-'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                        <span className="text-gray-600 font-medium">ตำแหน่ง</span>
                                        <span className={user.webapp_emp?.Position ? "text-gray-900 font-semibold" : "text-gray-400"}>
                                            {user.webapp_emp?.Position || '-'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-gray-600 font-medium">แผนก</span>
                                        <span className={user.webapp_emp?.DeptID ? "text-gray-900 font-semibold" : "text-gray-400"}>
                                            {user.webapp_emp?.DeptID || '-'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Contact Information */}
                            <div className="space-y-4 rounded-xl bg-gray-50 p-5">
                                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                    <svg className="mr-2 h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                    ข้อมูลติดต่อ
                                </h3>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                        <span className="text-gray-600 font-medium">อีเมลบริษัท</span>
                                        <span className={user.webapp_emp?.Email ? "text-gray-900 font-semibold" : "text-gray-400"}>
                                            {user.webapp_emp?.Email || '-'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-gray-600 font-medium">โทรศัพท์</span>
                                        <span className={user.webapp_emp?.Tel ? "text-gray-900 font-semibold" : "text-gray-400"}>
                                            {user.webapp_emp?.Tel || '-'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Address */}
                            <div className="space-y-4 rounded-xl bg-gray-50 p-5">
                                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                    <svg className="mr-2 h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    ที่อยู่
                                </h3>
                                <div className="text-sm">
                                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                                        <span className={user.webapp_emp?.Address ? "text-gray-900" : "text-gray-400 italic"}>
                                            {user.webapp_emp?.Address || 'ไม่มีข้อมูลที่อยู่'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Roles Section */}
                        <div className="mt-6 pt-6 border-t">
                            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                                <svg className="mr-2 h-5 w-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                                สิทธิ์ผู้ใช้
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {user.roles.length > 0 ? (
                                    user.roles.map((role) => (
                                        <span key={role.id} className="inline-flex items-center rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 px-3 py-1.5 text-sm font-medium text-indigo-800 shadow-sm">
                                            <svg className="mr-1.5 h-2 w-2 text-indigo-400" fill="currentColor" viewBox="0 0 8 8">
                                                <circle cx="4" cy="4" r="3" />
                                            </svg>
                                            {role.name}
                                        </span>
                                    ))
                                ) : (
                                    <div className="flex items-center text-gray-500 text-sm bg-gray-100 rounded-lg px-4 py-2">
                                        <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                        ยังไม่ได้กำหนดสิทธิ์ให้ผู้ใช้
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="border-t bg-gray-50 px-6 py-4 flex justify-end">
                        <Link
                            href={route('users.index')}
                            className="inline-flex items-center rounded-xl bg-gradient-to-r from-gray-600 to-gray-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:from-gray-700 hover:to-gray-800 hover:shadow-md"
                        >
                            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            กลับไปยังรายการผู้ใช้
                        </Link>
                    </div>
                </div>
            </div>
        
    );
}