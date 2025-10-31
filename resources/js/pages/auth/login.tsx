import { Head, useForm } from '@inertiajs/react';
import { Eye, EyeOff, LoaderCircle, LogIn, Shield, User, Star, Palette } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

import AppLogoIcon from '@/components/app-logo-icon';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type LoginForm = {
    email: string;
    password: string;
    remember: boolean;
};

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

export default function Login({ status, canResetPassword }: LoginProps) {
    const { data, setData, post, processing, errors, reset } = useForm<Required<LoginForm>>({
        email: '',
        password: '',
        remember: false,
    });

    const [showPassword, setShowPassword] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-00  from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-32 w-80 h-80 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full blur-3xl opacity-20 animate-pulse"></div>
                <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full blur-3xl opacity-20 animate-pulse delay-1000"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-green-400 to-cyan-500 rounded-full blur-3xl opacity-10 animate-bounce"></div>
            </div>

            <Head title="Sign In - ISANPALM" />

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
                                <span className="bg-gradient-to-r from-yellow-300 via-orange-300 to-yellow-400 bg-clip-text font-black tracking-wider text-transparent animate-gradient">
                                    ISANPALM
                                </span>
                            </h1>

                            <div className="space-y-4 text-lg leading-relaxed">
                                <p className="text-3xl font-bold text-white drop-shadow-lg">
                                    เป็น<span className="text-yellow-300">ผู้นำ</span>ในการส่งเสริม
                                </p>
                                <p className="text-xl font-semibold text-blue-100">
                                    เกษตรกรชาวสวนปาล์มน้ำมันที่ยังขาดโอกาส
                                </p>
                                <p className="text-xl font-semibold text-blue-100">
                                    ในพื้นที่ภาคอีสาน ให้มีรายได้{' '}
                                    <span className="text-3xl font-bold text-green-300 animate-pulse">อย่างยั่งยืน</span>
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
                                    <div className="p-2 bg-yellow-500/20 rounded-lg">
                                        <Star className="h-6 w-6 text-yellow-300" />
                                    </div>
                                    <span className="text-yellow-100 font-medium">คุณภาพสูง</span>
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

                {/* Right Side - Enhanced Login Form */}
                <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:bg-gradient-to-br lg:from-blue-700 lg:via-blue-600 lg:to-blue-900 lg:backdrop-blur-lg lg:px-20 xl:px-24 relative">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 bg-black/10 backdrop-blur-sm"></div>

                    <div className="mx-auto w-full max-w-md relative z-10">
                        {/* Mobile Logo */}
                        <div className="mb-8 flex justify-center lg:hidden">
                            <div className="relative">
                                {/* <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full blur-md"></div> */}
                                <AppLogoIcon size="lg" variant="badge" />
                            </div>
                        </div>

                        <div className="rounded-3xl bg-white/95 backdrop-blur-xl p-8 shadow-2xl border border-white/20">
                            {/* Header */}
                            <div className="mb-8 text-center">
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    Welcome Back
                                </h1>
                                <p className="mt-3 text-gray-600 text-lg">Sign in to continue to your dashboard</p>
                            </div>

                            <form onSubmit={submit} className="space-y-6">
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
                                            autoFocus
                                            tabIndex={1}
                                            autoComplete="email"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            placeholder="Enter your email"
                                            className="h-14 border-2 border-gray-200 pl-12 pr-4 transition-all duration-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-2xl group-hover:border-blue-300 bg-white/50"
                                            disabled={processing}
                                        />
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-4">
                                            <svg className="h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                                            type={showPassword ? 'text' : 'password'}
                                            required
                                            tabIndex={2}
                                            autoComplete="current-password"
                                            value={data.password}
                                            onChange={(e) => setData('password', e.target.value)}
                                            placeholder="Enter your password"
                                            className="h-14 border-2 border-gray-200 pr-12 pl-12 transition-all duration-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-2xl group-hover:border-blue-300 bg-white/50"
                                            disabled={processing}
                                        />
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-4">
                                            <svg className="h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                                />
                                            </svg>
                                        </div>
                                        <button
                                            type="button"
                                            className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 transition-all duration-200 hover:text-blue-600 hover:scale-110"
                                            onClick={() => setShowPassword(!showPassword)}
                                            tabIndex={3}
                                        >
                                            {showPassword ?
                                                <EyeOff className="h-5 w-5" /> :
                                                <Eye className="h-5 w-5" />
                                            }
                                        </button>
                                    </div>
                                    <InputError message={errors.password} />
                                </div>

                                {/* Options Row */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3 group cursor-pointer">
                                        <Checkbox
                                            id="remember"
                                            name="remember"
                                            checked={data.remember}
                                            onClick={() => setData('remember', !data.remember)}
                                            tabIndex={3}
                                            disabled={processing}
                                            className="data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600 transition-all duration-200 group-hover:border-blue-400"
                                        />
                                        <Label htmlFor="remember" className="cursor-pointer text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                                            Remember me
                                        </Label>
                                    </div>
                                    {canResetPassword && (
                                        <TextLink
                                            href={route('password.request')}
                                            className="text-sm font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent transition-all duration-200 hover:scale-105"
                                            tabIndex={5}
                                        >
                                            Forgot password?
                                        </TextLink>
                                    )}
                                </div>

                                {/* Submit Button */}
                                <Button
                                    type="submit"
                                    className="group relative h-14 w-full overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 font-bold text-white shadow-2xl transition-all duration-300 hover:shadow-3xl hover:scale-[1.02] rounded-3xl border-0"
                                    tabIndex={4}
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
                                            <span className="relative z-10 text-lg">Signing In...</span>
                                        </>
                                    ) : (
                                        <>
                                            <LogIn className="relative z-10 mr-3 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                                            <span className="relative z-10 text-lg">Sign In</span>
                                        </>
                                    )}
                                </Button>
                            </form>

                            {/* Sign Up Link */}
                            <div className="mt-8 text-center">
                                <p className="text-sm text-gray-600">
                                    Don't have an account?{' '}
                                    <TextLink
                                        href={route('register')}
                                        className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent transition-all duration-200 hover:scale-105"
                                        tabIndex={5}
                                    >
                                        Sign up now
                                    </TextLink>
                                </p>
                            </div>

                            {/* Status Message */}
                            {status && (
                                <div className="mt-6 rounded-2xl border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-4 backdrop-blur-sm">
                                    <div className="flex items-center text-green-700">
                                        <div className="mr-3 flex h-6 w-6 items-center justify-center rounded-full bg-green-100">
                                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path
                                                    fillRule="evenodd"
                                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                        </div>
                                        <span className="text-sm font-medium">{status}</span>
                                    </div>
                                </div>
                            )}
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
