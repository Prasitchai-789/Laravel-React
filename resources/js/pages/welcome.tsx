import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;

    return (
        <>
            <Head title="Welcome">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
            </Head>
            <div className="flex min-h-screen flex-col items-center bg-gradient-to-br from-[#F0F8FF] via-[#E6F3FF] to-[#F5F9FF] p-6 font-anuphan text-[#1E3A8A] lg:justify-center lg:p-8 dark:from-[#0F172A] dark:via-[#1E293B] dark:to-[#334155]">
                <header className="mb-2 w-full max-w-[335px] text-sm not-has-[nav]:hidden lg:max-w-4xl">
                    <nav className="flex items-center justify-end gap-4">
                        {auth.user ? (
                            <Link
                                href={route('dashboard')}
                                className="inline-block rounded-lg border border-[#3B82F6] px-5 py-2 text-sm leading-normal text-[#1E3A8A] transition-all hover:border-[#2563EB] hover:bg-[#DBEAFE] dark:border-[#60A5FA] dark:text-[#EFF6FF] dark:hover:border-[#93C5FD] dark:hover:bg-[#1E3A8A]"
                            >
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={route('login')}
                                    className="inline-block rounded-lg border border-transparent px-5 py-2 text-sm leading-normal text-[#1E3A8A] transition-all hover:border-[#3B82F6] hover:bg-[#DBEAFE] dark:text-[#EFF6FF] dark:hover:border-[#60A5FA] dark:hover:bg-[#1E3A8A]"
                                >
                                    Log in
                                </Link>
                                <Link
                                    href={route('register')}
                                    className="inline-block rounded-lg bg-gradient-to-r from-[#F59E0B] to-[#EAB308] px-5 py-2 text-sm leading-normal text-white shadow-md transition-all hover:from-[#D97706] hover:to-[#CA8A04]"
                                >
                                    Register
                                </Link>
                            </>
                        )}
                    </nav>
                </header>
                <div className="flex w-full items-center justify-center opacity-100 transition-opacity duration-750 lg:grow starting:opacity-0">
                    <main className="flex w-full max-w-[335px] flex-col items-center lg:max-w-4xl">
                        {/* Hero Section with Icon */}
                        <div className="mb-4 flex flex-col items-center text-center">
                            <div className="mb-2 flex h-24 w-24 items-center justify-center overflow-hidden">
                                <img
                                    src="/images/logo R.png" // 🔹 เปลี่ยน path ตามรูปของคุณ
                                    alt="logo"
                                    className="h-20 w-15 object-cover"
                                />
                            </div>

                            <h1 className=" text-3xl font-bold">
                                <span className="bg-gradient-to-r from-[#1E3A8A] to-[#1368ad] bg-clip-text text-transparent">Welcome to</span>{' '}
                                <span className="bg-gradient-to-r from-[#F59E0B] via-[#FFD700] to-[#CA8A04] bg-clip-text font-extrabold tracking-wide text-transparent">
                                    ISANPALM
                                </span>
                            </h1>
                            <p className="max-w-md text-lg text-[#475569] dark:text-[#CBD5E1]">
                                <span className="text-[#198a0f]">ทำงานอย่างมีความสุข</span> สนุกกับการทำงาน
                            </p>
                        </div>

                        {/* ส่วน Products Section */}
                        <div className ="w-full text-center">
                            <div className="">
                                <span className="bg-gradient-to-r from-[#F59E0B] via-[#FFD700] to-[#CA8A04] bg-clip-text text-3xl font-extrabold tracking-wide text-transparent">
                                    Our Products
                                </span>
                                <p className=" text-gray-600">ผลิตภัณฑ์คุณภาพจากโรงงานปาล์มน้ำมัน</p>

                                {/* Grid ของสินค้า */}
                                <div className="mt-2 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                                    {/* Card 1 */}
                                    <div className="overflow-hidden rounded-2xl shadow-lg transition hover:scale-105 hover:shadow-xl bg-white">
                                        <img src="/images/products/PalmOil.png" alt="Palm Oil" className="h-48 w-full object-cover" />
                                        <div className="p-5 text-left">
                                            <h3 className="bg-gradient-to-r from-[#F59E0B] via-[#FFD700] to-[#CA8A04] bg-clip-text text-lg font-extrabold tracking-wide text-transparent">น้ำมันปาล์มดิบ</h3>
                                            <p className="mt-2 text-sm text-gray-600">น้ำมันปาล์มคุณภาพสูง สกัดจากผลปาล์มสดใหม่</p>
                                        </div>
                                    </div>

                                    {/* Card 2 */}
                                    <div className="overflow-hidden rounded-2xl shadow-lg transition hover:scale-105 hover:shadow-xl bg-white">
                                        <img src="/images/products/Kernel.jpg" alt="Kernel" className="h-48 w-full object-cover" />
                                        <div className="p-5 text-left">
                                            <h3 className="bg-gradient-to-r from-[#F59E0B] via-[#FFD700] to-[#CA8A04] bg-clip-text text-lg font-extrabold tracking-wide text-transparent">เมล็ดในปาล์มอบแห้ง</h3>
                                            <p className="mt-2 text-sm text-gray-600">ผ่านการกลั่นให้ใส เหมาะกับการปรุงอาหาร</p>
                                        </div>
                                    </div>

                                    {/* Card 3 */}
                                    <div className="overflow-hidden rounded-2xl shadow-lg transition hover:scale-105 hover:shadow-xl bg-white">
                                        <img src="/images/products/PalmShell.jpg" alt="Biomass" className="h-48 w-full object-cover" />
                                        <div className="p-5 text-left">
                                            <h3 className="bg-gradient-to-r from-[#F59E0B] via-[#FFD700] to-[#CA8A04] bg-clip-text text-lg font-extrabold tracking-wide text-transparent">กะลาปาล์ม (เพียว)</h3>
                                            <p className="mt-2 text-sm text-gray-600">ผลิตภัณฑ์พลอยได้จากโรงงาน ใช้ผลิตพลังงานสะอาด</p>
                                        </div>
                                    </div>
                                    {/* Card 4 */}
                                    <div className="overflow-hidden rounded-2xl shadow-lg transition hover:scale-105 hover:shadow-xl bg-white">
                                        <img src="/images/products/Fiber.png" alt="Biomass" className="h-48 w-full object-cover" />
                                        <div className="p-5 text-left">
                                            <h3 className="bg-gradient-to-r from-[#F59E0B] via-[#FFD700] to-[#CA8A04] bg-clip-text text-lg font-extrabold tracking-wide text-transparent">ทะลายปาล์มสับ</h3>
                                            <p className="mt-2 text-sm text-gray-600">ผลิตภัณฑ์พลอยได้จากโรงงาน ใช้ผลิตพลังงานสะอาด</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Quick Stats */}
                        <div className="mt-4 grid w-full grid-cols-2 gap-6 lg:grid-cols-4">
                            <div className="group relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-white to-blue-50 p-6 text-center shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl dark:border-gray-700 dark:from-gray-800 dark:to-gray-900">
                                <div className="absolute -top-4 -right-4 h-16 w-16 rounded-full bg-gradient-to-br from-yellow-400 to-blue-500 opacity-10 transition-opacity group-hover:opacity-20"></div>
                                <div className="relative z-10">
                                    <div className="mb-3 flex justify-center">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-400 to-blue-500 shadow-md">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white">
                                                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" />
                                                <circle cx="8.5" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
                                                <path d="M20 8v6M23 11h-6" stroke="currentColor" strokeWidth="2" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="mb-2 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-3xl font-bold text-transparent dark:from-blue-400 dark:to-blue-200">
                                        10K+
                                    </div>
                                    <div className="text-sm font-medium text-gray-600 dark:text-gray-300">เกษตรกรในเครือ</div>
                                    <div className="mt-2 text-xs text-blue-500 opacity-0 transition-opacity group-hover:opacity-100 dark:text-blue-400">
                                        และยังคงเติบโต
                                    </div>
                                </div>
                            </div>

                            <div className="group relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-white to-blue-50 p-6 text-center shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl dark:border-gray-700 dark:from-gray-800 dark:to-gray-900">
                                <div className="absolute -top-4 -right-4 h-16 w-16 rounded-full bg-gradient-to-br from-yellow-400 to-blue-500 opacity-10 transition-opacity group-hover:opacity-20"></div>
                                <div className="relative z-10">
                                    <div className="mb-3 flex justify-center">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-400 to-blue-500 shadow-md">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white">
                                                <path
                                                    d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="mb-2 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-3xl font-bold text-transparent dark:from-blue-400 dark:to-blue-200">
                                        500+
                                    </div>
                                    <div className="text-sm font-medium text-gray-600 dark:text-gray-300">โครงการปาล์ม</div>
                                    <div className="mt-2 text-xs text-blue-500 opacity-0 transition-opacity group-hover:opacity-100 dark:text-blue-400">
                                        ทั่วภาคอีสาน
                                    </div>
                                </div>
                            </div>

                            <div className="group relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-white to-blue-50 p-6 text-center shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl dark:border-gray-700 dark:from-gray-800 dark:to-gray-900">
                                <div className="absolute -top-4 -right-4 h-16 w-16 rounded-full bg-gradient-to-br from-yellow-400 to-blue-500 opacity-10 transition-opacity group-hover:opacity-20"></div>
                                <div className="relative z-10">
                                    <div className="mb-3 flex justify-center">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-400 to-blue-500 shadow-md">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white">
                                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="mb-2 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-3xl font-bold text-transparent dark:from-blue-400 dark:to-blue-200">
                                        99.9%
                                    </div>
                                    <div className="text-sm font-medium text-gray-600 dark:text-gray-300">ความสำเร็จ</div>
                                    <div className="mt-2 text-xs text-blue-500 opacity-0 transition-opacity group-hover:opacity-100 dark:text-blue-400">
                                        โครงการประสบความสำเร็จ
                                    </div>
                                </div>
                            </div>

                            <div className="group relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-white to-blue-50 p-6 text-center shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl dark:border-gray-700 dark:from-gray-800 dark:to-gray-900">
                                <div className="absolute -top-4 -right-4 h-16 w-16 rounded-full bg-gradient-to-br from-yellow-400 to-blue-500 opacity-10 transition-opacity group-hover:opacity-20"></div>
                                <div className="relative z-10">
                                    <div className="mb-3 flex justify-center">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-400 to-blue-500 shadow-md">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white">
                                                <path
                                                    d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="mb-2 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-3xl font-bold text-transparent dark:from-blue-400 dark:to-blue-200">
                                        24/7
                                    </div>
                                    <div className="text-sm font-medium text-gray-600 dark:text-gray-300">สนับสนุน</div>
                                    <div className="mt-2 text-xs text-blue-500 opacity-0 transition-opacity group-hover:opacity-100 dark:text-blue-400">
                                        ให้คำปรึกษาตลอดเวลา
                                    </div>
                                </div>
                            </div>
                        </div>


                        {/* Content Cards */}
                        <div className="mt-10 grid w-full gap-6 lg:grid-cols-2">
                            {/* Getting Started Card */}
                            <div className="rounded-2xl border border-[#E0F2FE] bg-white p-8 shadow-[0_4px_20px_rgba(59,130,246,0.1)] transition-all hover:shadow-[0_8px_30px_rgba(59,130,246,0.15)] dark:border-[#334155] dark:bg-[#1E293B]">
                                <h2 className="mb-4 text-xl font-semibold text-[#1E40AF] dark:text-[#E0F2FE]">เริ่มต้นใช้งาน</h2>
                                <p className="mb-6 text-[#475569] dark:text-[#CBD5E1]">ระบบจัดการสวนปาล์มน้ำมันครบวงจรสำหรับเกษตรกรยุคใหม่</p>

                                <div className="space-y-4">
                                    <div className="flex items-start gap-4">
                                        <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-[#F59E0B] to-[#3B82F6] shadow-md">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-white">
                                                <path
                                                    d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2Z"
                                                    fill="currentColor"
                                                />
                                                <path
                                                    d="M21 9V11C21 13.8 19.2 16 16.5 16H7.5C4.8 16 3 13.8 3 11V9C3 6.2 4.8 4 7.5 4H16.5C19.2 4 21 6.2 21 9Z"
                                                    stroke="currentColor"
                                                    strokeWidth="1.5"
                                                />
                                                <path d="M7 20H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                                <path d="M12 16V20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-[#1E40AF] dark:text-[#E0F2FE]">คู่มือการปลูกปาล์มน้ำมัน</h3>
                                            <p className="text-sm text-[#475569] dark:text-[#CBD5E1]">
                                                เรียนรู้เทคนิคการปลูกและดูแลปาล์มน้ำมันอย่างมืออาชีพ
                                            </p>
                                            <a
                                                href="/tutorials/palm-cultivation"
                                                className="mt-1 inline-flex items-center space-x-1 text-sm font-medium text-[#3B82F6] underline underline-offset-4 transition-colors hover:text-[#2563EB] dark:text-[#60A5FA] dark:hover:text-[#93C5FD]"
                                            >
                                                <span>ศึกษาคู่มือ</span>
                                                <svg
                                                    width={12}
                                                    height={12}
                                                    viewBox="0 0 12 12"
                                                    fill="none"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-3 w-3"
                                                >
                                                    <path d="M9.25 8.35V3.35H4.25M2.5 9.6L9 3.00001" stroke="currentColor" strokeLinecap="square" />
                                                </svg>
                                            </a>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-[#F59E0B] to-[#3B82F6] shadow-md">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-white">
                                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.5" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-[#1E40AF] dark:text-[#E0F2FE]">การจัดการสวนปาล์ม</h3>
                                            <p className="text-sm text-[#475569] dark:text-[#CBD5E1]">
                                                เทคนิคการจัดการสวนปาล์มน้ำมันเพื่อผลผลิตสูงสุด
                                            </p>
                                            <a
                                                href="/tutorials/palm-plantation"
                                                className="mt-1 inline-flex items-center space-x-1 text-sm font-medium text-[#3B82F6] underline underline-offset-4 transition-colors hover:text-[#2563EB] dark:text-[#60A5FA] dark:hover:text-[#93C5FD]"
                                            >
                                                <span>เรียนรู้เพิ่มเติม</span>
                                                <svg
                                                    width={12}
                                                    height={12}
                                                    viewBox="0 0 12 12"
                                                    fill="none"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-3 w-3"
                                                >
                                                    <path d="M9.25 8.35V3.35H4.25M2.5 9.6L9 3.00001" stroke="currentColor" strokeLinecap="square" />
                                                </svg>
                                            </a>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-[#F59E0B] to-[#3B82F6] shadow-md">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-white">
                                                <path
                                                    d="M8 12h8M12 16V8M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10z"
                                                    stroke="currentColor"
                                                    strokeWidth="1.5"
                                                />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-[#1E40AF] dark:text-[#E0F2FE]">การเก็บเกี่ยวผลผลิต</h3>
                                            <p className="text-sm text-[#475569] dark:text-[#CBD5E1]">
                                                วิธีการเก็บเกี่ยวปาล์มน้ำมันที่ถูกต้องและมีประสิทธิภาพ
                                            </p>
                                            <a
                                                href="/tutorials/harvesting"
                                                className="mt-1 inline-flex items-center space-x-1 text-sm font-medium text-[#3B82F6] underline underline-offset-4 transition-colors hover:text-[#2563EB] dark:text-[#60A5FA] dark:hover:text-[#93C5FD]"
                                            >
                                                <span>ดูวิธีการเก็บเกี่ยว</span>
                                                <svg
                                                    width={12}
                                                    height={12}
                                                    viewBox="0 0 12 12"
                                                    fill="none"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-3 w-3"
                                                >
                                                    <path d="M9.25 8.35V3.35H4.25M2.5 9.6L9 3.00001" stroke="currentColor" strokeLinecap="square" />
                                                </svg>
                                            </a>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 border-t border-[#E0F2FE] pt-6 dark:border-[#334155]">
                                    <a
                                        href="/dashboard"
                                        className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#3B82F6] to-[#1D4ED8] px-5 py-2.5 text-sm font-medium text-white shadow-md transition-all hover:from-[#2563EB] hover:to-[#1E40AF]"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                            <polyline points="9 22 9 12 15 12 15 22" />
                                        </svg>
                                        เข้าสู่ระบบจัดการสวน
                                    </a>
                                </div>
                            </div>

                            {/* Features & Ecosystem Card */}
                            <div className="rounded-2xl bg-gradient-to-br from-[#1E40AF] to-[#3B82F6] p-8 text-white">
                                <h2 className="mb-4 text-xl font-semibold">บริษัทในเครือ</h2>
                                <p className="mb-6 text-[#E0F2FE]">กลุ่มธุรกิจปาล์มน้ำมันครบวงจรแห่งภาคอีสาน</p>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 rounded-lg bg-white/10 p-3 backdrop-blur-sm transition-all hover:bg-white/15">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F59E0B]/20">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-[#F59E0B]">
                                                <path
                                                    d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="font-medium">บริษัท อีสานพัฒนาอุตสาหกรรมปาล์ม จำกัด</h3>
                                            <p className="text-sm text-[#E0F2FE]">โรงงานสกัดน้ำมันปาล์มและแปรรูป</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 rounded-lg bg-white/10 p-3 backdrop-blur-sm transition-all hover:bg-white/15">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F59E0B]/20">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-[#F59E0B]">
                                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="font-medium">บริษัท มั่นสกล การเกษตร จำกัด</h3>
                                            <p className="text-sm text-[#E0F2FE]">ปลูกและดูแลสวนปาล์มน้ำมันคุณภาพสูง</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 rounded-lg bg-white/10 p-3 backdrop-blur-sm transition-all hover:bg-white/15">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F59E0B]/20">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-[#F59E0B]">
                                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                                                <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="font-medium">อินฟินิทตี้</h3>
                                            <p className="text-sm text-[#E0F2FE]">เทคโนโลยีและนวัตกรรมการเกษตร</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 border-t border-white/20 pt-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="font-medium">ผลผลิตต่อปี</h4>
                                            <p className="text-sm text-[#E0F2FE]">10,000+ ตัน</p>
                                        </div>
                                        <div>
                                            <h4 className="font-medium">พื้นที่ปลูก</h4>
                                            <p className="text-sm text-[#E0F2FE]">5,000+ ไร่</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Additional Progress Stats */}
                        <div className="mt-8 grid w-full grid-cols-1 gap-6 lg:grid-cols-3">
                            <div className="rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-lg">
                                <div className="mb-4 flex items-center justify-between">
                                    <div className="text-sm font-medium">พื้นที่ปลูกทั้งหมด</div>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-blue-200">
                                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2" />
                                        <polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" strokeWidth="2" />
                                    </svg>
                                </div>
                                <div className="mb-2 text-2xl font-bold">5,000+ ไร่</div>
                                <div className="h-2 w-full rounded-full bg-blue-400">
                                    <div className="h-2 w-4/5 rounded-full bg-white"></div>
                                </div>
                                <div className="mt-2 text-xs text-blue-200">เพิ่มขึ้น 15% จากปีที่แล้ว</div>
                            </div>

                            <div className="rounded-2xl bg-gradient-to-br from-yellow-500 to-yellow-600 p-6 text-white shadow-lg">
                                <div className="mb-4 flex items-center justify-between">
                                    <div className="text-sm font-medium">ผลผลิตต่อปี</div>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-yellow-200">
                                        <path
                                            d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                        />
                                    </svg>
                                </div>
                                <div className="mb-2 text-2xl font-bold">10,000+ ตัน</div>
                                <div className="h-2 w-full rounded-full bg-yellow-400">
                                    <div className="h-2 w-3/4 rounded-full bg-white"></div>
                                </div>
                                <div className="mt-2 text-xs text-yellow-200">เพิ่มขึ้น 20% จากปีที่แล้ว</div>
                            </div>

                            <div className="rounded-2xl bg-gradient-to-br from-green-500 to-green-600 p-6 text-white shadow-lg">
                                <div className="mb-4 flex items-center justify-between">
                                    <div className="text-sm font-medium">ความพึงพอใจ</div>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-green-200">
                                        <path
                                            d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                        />
                                    </svg>
                                </div>
                                <div className="mb-2 text-2xl font-bold">98%</div>
                                <div className="h-2 w-full rounded-full bg-green-400">
                                    <div className="h-2 w-11/12 rounded-full bg-white"></div>
                                </div>
                                <div className="mt-2 text-xs text-green-200">จากเกษตรกรในเครือ</div>
                            </div>
                        </div>



                    </main>
                </div>
                <footer className="mt-12 text-center text-sm text-[#475569] dark:text-[#CBD5E1]">
                    <p>ISANPALM - Building amazing experiences together</p>
                </footer>
            </div>
        </>
    );
}
