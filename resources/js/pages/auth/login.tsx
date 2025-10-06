import { Head, useForm } from '@inertiajs/react';
import { Eye, EyeOff, LoaderCircle, LogIn } from 'lucide-react';
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
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
            <Head title="Sign In - ISANPALM" />

            <div className="flex min-h-screen">
                {/* Left Side - Illustration */}
                <div className="hidden font-anuphan lg:flex lg:flex-1 lg:items-center lg:justify-center">
                    <img src="/images/logo R.png" alt="" className="flex w-64 items-center justify-center" />
                    <div className="max-w-md px-8 text-center text-white">
                        <h1 className="mb-3 text-5xl font-bold">
                            <span className="bg-gradient-to-r from-[#F59E0B] via-[#FFD700] to-[#CA8A04] bg-clip-text font-extrabold tracking-wide text-transparent">
                                ISANPALM
                            </span>
                        </h1>
                        <p className="text-lg leading-relaxed text-blue-100">
                            <span className="text-4xl font-bold">เป็นผุ้นำ</span> <span className="font-bold">ในการส่งเสริม</span>{' '}
                        </p>
                        <p className="text-lg leading-relaxed text-blue-100">เกษตรกรชาวสวนปาล์มน้ำมัน ที่ยังขาดโอกาส</p>
                        <p className="text-lg leading-relaxed text-blue-100">
                            ในพื้นที่ภาคอีสาน ให้มีรายได้ <span className="text-2xl font-bold">อย่างยั่งยืน</span>
                        </p>
                        {/* <div className="mt-8 grid grid-cols-2 gap-6 text-left">
                            <div className="flex items-center space-x-3">
                                <Shield className="h-6 w-6 text-blue-200" />
                                <span className="text-blue-100">Secure & Reliable</span>
                            </div>
                            <div className="flex items-center space-x-3">
                                <User className="h-6 w-6 text-blue-200" />
                                <span className="text-blue-100">User Friendly</span>
                            </div>
                        </div> */}
                    </div>
                </div>

                {/* Right Side - Login Form */}
                <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:bg-gradient-to-br lg:from-blue-600 lg:to-blue-900 lg:px-20 xl:px-24">
                    <div className="mx-auto w-full max-w-md">
                        {/* Mobile Logo */}
                        <div className="mb-8 flex justify-center lg:hidden">
                            <AppLogoIcon size="lg" variant="badge" />
                        </div>

                        <div className="rounded-2xl bg-white p-8 shadow-2xl">
                            <div className="mb-8 text-center">
                                <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
                                <p className="mt-2 text-gray-600">Sign in to continue to your dashboard</p>
                            </div>

                            <form onSubmit={submit} className="space-y-6">
                                {/* Email Field */}
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                                        Email Address
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="email"
                                            type="email"
                                            required
                                            autoFocus
                                            tabIndex={1}
                                            autoComplete="email"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            placeholder=""
                                            className="h-12 border-gray-300 pl-11 transition-all duration-200 focus:border-blue-500 focus:ring-blue-500 rounded-2xl"
                                            disabled={processing}
                                        />
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                                            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                                <div className="space-y-2">
                                    <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                                        Password
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            required
                                            tabIndex={2}
                                            autoComplete="current-password"
                                            value={data.password}
                                            onChange={(e) => setData('password', e.target.value)}
                                            placeholder=""
                                            className="h-12 border-gray-300 pr-12 pl-11 transition-all duration-200 focus:border-blue-500 focus:ring-blue-500 rounded-2xl"
                                            disabled={processing}
                                        />
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                                            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 transition-colors duration-200 hover:text-gray-600"
                                            onClick={() => setShowPassword(!showPassword)}
                                            tabIndex={3}
                                        >
                                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>
                                    <InputError message={errors.password} />
                                </div>

                                {/* Options Row */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <Checkbox
                                            id="remember"
                                            name="remember"
                                            checked={data.remember}
                                            onClick={() => setData('remember', !data.remember)}
                                            tabIndex={3}
                                            disabled={processing}
                                            className="data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600"
                                        />
                                        <Label htmlFor="remember" className="cursor-pointer text-sm text-gray-700">
                                            Remember me
                                        </Label>
                                    </div>
                                    {canResetPassword && (
                                        <TextLink
                                            href={route('password.request')}
                                            className="text-sm text-blue-600 transition-colors duration-200 hover:text-blue-700"
                                            tabIndex={5}
                                        >
                                            Forgot password?
                                        </TextLink>
                                    )}
                                </div>

                                {/* Submit Button */}
                                <Button
                                    type="submit"
                                    className="group relative h-12 w-full overflow-hidden bg-gradient-to-r from-blue-600 to-blue-700 font-semibold text-white shadow-lg transition-all duration-200 hover:from-blue-700 hover:to-blue-800 hover:shadow-xl rounded-3xl"
                                    tabIndex={4}
                                    disabled={processing}
                                    onMouseEnter={() => setIsHovered(true)}
                                    onMouseLeave={() => setIsHovered(false)}
                                >
                                    <div
                                        className={`bg-opacity-20 absolute inset-0 transform bg-gradient-to-r from-[#F59E0B] via-[#FFD700] to-[#CA8A04] ${isHovered ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300`}
                                    ></div>
                                    {processing ? (
                                        <>
                                            <LoaderCircle className="relative z-10 mr-2 h-5 w-5 animate-spin" />
                                            <span className="relative z-10">Signing In...</span>
                                        </>
                                    ) : (
                                        <>
                                            <LogIn className="relative z-10 mr-2 h-5 w-5" />
                                            <span className="relative z-10">Sign In</span>
                                        </>
                                    )}
                                </Button>
                            </form>

                            {/* Sign Up Link */}
                            <div className="mt-6 text-center">
                                <p className="text-sm text-gray-600">
                                    Don't have an account?{' '}
                                    <TextLink
                                        href={route('register')}
                                        className="font-medium text-blue-600 transition-colors duration-200 hover:text-blue-700"
                                        tabIndex={5}
                                    >
                                        Sign up now
                                    </TextLink>
                                </p>
                            </div>

                            {/* Status Message */}
                            {status && (
                                <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4">
                                    <div className="flex items-center text-green-700">
                                        <svg className="mr-2 h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path
                                                fillRule="evenodd"
                                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                        <span className="text-sm font-medium">{status}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="mt-8 text-center">
                            <div className="mb-3 flex justify-center">
                                <AppLogoIcon size="sm" variant="minimal" showText={false} />
                            </div>
                            <p className="text-xs text-gray-400">© 2025 ISANPALM. All rights reserved.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
