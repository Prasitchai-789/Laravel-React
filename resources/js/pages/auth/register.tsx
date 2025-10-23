import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle, UserPlus, Shield, User, Star, Palette } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLogoIcon from '@/components/app-logo-icon';

type RegisterForm = {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
};

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm<Required<RegisterForm>>({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const [isHovered, setIsHovered] = useState(false);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br  from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-32 w-80 h-80 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full blur-3xl opacity-20 animate-pulse"></div>
                <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full blur-3xl opacity-20 animate-pulse delay-1000"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-green-400 to-cyan-500 rounded-full blur-3xl opacity-10 animate-bounce"></div>
            </div>

            <Head title="Create Account - ISANPALM" />

            <div className="flex min-h-screen relative z-10">
                {/* Left Side - Enhanced Illustration */}
                <div className="hidden font-anuphan lg:flex lg:flex-1 lg:items-center lg:justify-center lg:relative">
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-sm"></div>
                    <div className="relative z-10 flex flex-col items-center justify-center text-center text-white px-8">
                        {/* Animated Logo */}
                        <div className="relative mb-8">
                            <div className="absolute inset-0 bg-gradient-to-r from-yellow-200 to-orange-300 rounded-full blur-lg opacity-20 animate-ping"></div>
                            <img
                                src="/images/logo R.png"
                                alt="ISANPALM Logo"
                                className="relative w-72 h-72 object-contain drop-shadow-2xl animate-float"
                            />
                        </div>

                        <div className="max-w-2xl">
                            <h1 className="mb-6 text-6xl font-bold">
                                <span className="bg-gradient-to-r from-amber-300 via-orange-300 to-yellow-400 bg-clip-text font-black tracking-wider text-transparent animate-gradient">
                                    ISANPALM
                                </span>
                            </h1>

                            <div className="space-y-4 text-lg leading-relaxed">
                                <p className="text-3xl font-bold text-white drop-shadow-lg">
                                    <span className="text-amber-300">เริ่มต้นการเดินทาง</span>กับเรา
                                </p>
                                <p className="text-xl font-semibold text-blue-100">
                                    สร้างบัญชีเพื่อเข้าสู่ระบบการจัดการ
                                </p>
                                <p className="text-xl font-semibold text-blue-100">
                                    เอกสารและข้อมูล<span className="text-3xl font-bold text-green-300 animate-pulse"> ของบริษัท</span>
                                </p>
                            </div>

                            {/* Feature Cards */}
                            <div className="mt-12 grid grid-cols-2 gap-6 text-left">
                                <div className="flex items-center space-x-4 p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 hover:bg-white/20 transition-all duration-300">
                                    <div className="p-2 bg-green-500/20 rounded-lg">
                                        <Shield className="h-6 w-6 text-green-300" />
                                    </div>
                                    <span className="text-green-100 font-medium">ปลอดภัย & เชื่อถือได้</span>
                                </div>
                                <div className="flex items-center space-x-4 p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 hover:bg-white/20 transition-all duration-300">
                                    <div className="p-2 bg-blue-500/20 rounded-lg">
                                        <User className="h-6 w-6 text-blue-300" />
                                    </div>
                                    <span className="text-blue-100 font-medium">ใช้งานง่าย</span>
                                </div>
                                <div className="flex items-center space-x-4 p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 hover:bg-white/20 transition-all duration-300">
                                    <div className="p-2 bg-amber-500/20 rounded-lg">
                                        <Star className="h-6 w-6 text-amber-300" />
                                    </div>
                                    <span className="text-amber-100 font-medium">คุณภาพสูง</span>
                                </div>
                                <div className="flex items-center space-x-4 p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 hover:bg-white/20 transition-all duration-300">
                                    <div className="p-2 bg-purple-500/20 rounded-lg">
                                        <Palette className="h-6 w-6 text-purple-300" />
                                    </div>
                                    <span className="text-purple-100 font-medium">ทันสมัย</span>
                                </div>
                                 <p className=" text-sm text-gray-400">Designed by : ฝ่ายเทคโนโลยีสารสนเทศ |<span className="text-yellow-500"> ISANPALM</span> </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side - Enhanced Register Form */}
                <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:bg-gradient-to-br lg:from-blue-700 lg:via-blue-600 lg:to-blue-900 lg:backdrop-blur-lg lg:px-20 xl:px-24 relative">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 bg-black/10 backdrop-blur-sm"></div>

                    <div className="mx-auto w-full max-w-md relative z-10">
                        {/* Mobile Logo */}
                        <div className="mb-8 flex justify-center lg:hidden">
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full blur-md"></div>
                                <AppLogoIcon size="lg" variant="badge" />
                            </div>
                        </div>

                        <div className="rounded-3xl bg-white/95 backdrop-blur-xl p-8 shadow-2xl border border-white/20">
                            {/* Header */}
                            <div className="mb-8 text-center">
                                <h1 className="text-3xl font-bold bg-gradient-to-r  from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    Create Account
                                </h1>
                                <p className="mt-3 text-gray-600 text-lg">Join ISANPALM community today</p>
                            </div>

                            <form onSubmit={submit} className="space-y-6">
                                {/* Name Field */}
                                <div className="space-y-3">
                                    <Label htmlFor="name" className="text-sm font-semibold text-gray-700">
                                        Full Name
                                    </Label>
                                    <div className="relative group">
                                        <Input
                                            id="name"
                                            type="text"
                                            required
                                            autoFocus
                                            tabIndex={1}
                                            autoComplete="name"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            disabled={processing}
                                            placeholder="Enter your full name"
                                            className="h-14 border-2 border-gray-200 pl-12 pr-4 transition-all duration-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 rounded-2xl group-hover:border-amber-300 bg-white/50"
                                        />
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-4">
                                            <User className="h-5 w-5 text-gray-400 group-hover:text-amber-500 transition-colors" />
                                        </div>
                                    </div>
                                    <InputError message={errors.name} />
                                </div>

                                {/* Email Field */}
                                <div className="space-y-3">
                                    <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                                        Email Address
                                    </Label>
                                    <div className="relative group">
                                        <Input
                                            id="email"
                                            type="email"
                                            required
                                            tabIndex={2}
                                            autoComplete="email"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            disabled={processing}
                                            placeholder="email@example.com"
                                            className="h-14 border-2 border-gray-200 pl-12 pr-4 transition-all duration-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 rounded-2xl group-hover:border-amber-300 bg-white/50"
                                        />
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-4">
                                            <svg className="h-5 w-5 text-gray-400 group-hover:text-amber-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                                                />
                                            </svg>
                                        </div>
                                    </div>
                                    <InputError message={errors.email} />
                                </div>

                                {/* Password Field */}
                                <div className="space-y-3">
                                    <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                                        Password
                                    </Label>
                                    <div className="relative group">
                                        <Input
                                            id="password"
                                            type="password"
                                            required
                                            tabIndex={3}
                                            autoComplete="new-password"
                                            value={data.password}
                                            onChange={(e) => setData('password', e.target.value)}
                                            disabled={processing}
                                            placeholder="Create a strong password"
                                            className="h-14 border-2 border-gray-200 pl-12 pr-4 transition-all duration-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 rounded-2xl group-hover:border-amber-300 bg-white/50"
                                        />
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-4">
                                            <svg className="h-5 w-5 text-gray-400 group-hover:text-amber-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                                />
                                            </svg>
                                        </div>
                                    </div>
                                    <InputError message={errors.password} />
                                </div>

                                {/* Confirm Password Field */}
                                <div className="space-y-3">
                                    <Label htmlFor="password_confirmation" className="text-sm font-semibold text-gray-700">
                                        Confirm Password
                                    </Label>
                                    <div className="relative group">
                                        <Input
                                            id="password_confirmation"
                                            type="password"
                                            required
                                            tabIndex={4}
                                            autoComplete="new-password"
                                            value={data.password_confirmation}
                                            onChange={(e) => setData('password_confirmation', e.target.value)}
                                            disabled={processing}
                                            placeholder="Confirm your password"
                                            className="h-14 border-2 border-gray-200 pl-12 pr-4 transition-all duration-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 rounded-2xl group-hover:border-amber-300 bg-white/50"
                                        />
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-4">
                                            <Shield className="h-5 w-5 text-gray-400 group-hover:text-amber-500 transition-colors" />
                                        </div>
                                    </div>
                                    <InputError message={errors.password_confirmation} />
                                </div>

                                {/* Submit Button */}
                                <Button
                                    type="submit"
                                    className="group relative h-14 w-full overflow-hidden bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 font-bold text-white shadow-2xl transition-all duration-300 hover:shadow-3xl hover:scale-[1.02] rounded-3xl border-0"
                                    tabIndex={5}
                                    disabled={processing}
                                    onMouseEnter={() => setIsHovered(true)}
                                    onMouseLeave={() => setIsHovered(false)}
                                >
                                    {/* Animated Background */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-700 transition-all duration-300 group-hover:from-blue-700 group-hover:via-blue-600/90 group-hover:to-blue-900"></div>
                                    {/* Shine Effect */}
                                    <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 transition-all duration-1000 ${isHovered ? 'translate-x-full' : '-translate-x-full'}`}></div>

                                    {processing ? (
                                        <>
                                            <LoaderCircle className="relative z-10 mr-3 h-5 w-5 animate-spin" />
                                            <span className="relative z-10 text-lg">Creating Account...</span>
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus className="relative z-10 mr-3 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                                            <span className="relative z-10 text-lg">Create Account</span>
                                        </>
                                    )}
                                </Button>
                            </form>

                            {/* Login Link */}
                            <div className="mt-8 text-center pt-4 border-t border-gray-200">
                                <p className="text-sm text-gray-600">
                                    Already have an account?{' '}
                                    <TextLink
                                        href={route('login')}
                                        className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent transition-all duration-200 hover:scale-105"
                                        tabIndex={6}
                                    >
                                        Sign in here
                                    </TextLink>
                                </p>
                            </div>
                        </div>

                        {/* Enhanced Footer */}
                        <div className="mt-8 text-center">
                            <div className="mb-4 flex justify-center">
                                <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-2 border border-white/20">
                                    <AppLogoIcon size="sm" variant="minimal" showText={false} />
                                    <span className="text-sm font-semibold text-white">ISANPALM</span>
                                </div>
                            </div>
                            <p className="text-xs text-white/80">© 2025 ISANPALM. All rights reserved.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
