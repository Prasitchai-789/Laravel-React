import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';

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

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50 to-amber-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <Head title="Register" />

                {/* Logo Section */}
                <div className="flex flex-col items-center mb-4">
                    <AppLogoIcon
                        size="login"
                        variant="badge"
                        orientation="vertical"
                        className="mb-0"
                    />
                    <h1 className="text-2xl font-bold text-gray-800 text-center">Create Your Account</h1>
                   
                </div>

                {/* Form Container */}
                <div className="bg-white rounded-3xl shadow-2xl p-8">
                    <form className="flex flex-col gap-6" onSubmit={submit}>
                        <div className="grid gap-5">
                            {/* Name Field */}
                            <div className="grid gap-2">
                                <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                                    Full Name
                                </Label>
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
                                    className="px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                                />
                                <InputError message={errors.name} className="mt-1" />
                            </div>

                            {/* Email Field */}
                            <div className="grid gap-2">
                                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                                    Email Address
                                </Label>
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
                                    className="px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                                />
                                <InputError message={errors.email} className="mt-1" />
                            </div>

                            {/* Password Field */}
                            <div className="grid gap-2">
                                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                                    Password
                                </Label>
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
                                    className="px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                                />
                                <InputError message={errors.password} className="mt-1" />
                            </div>

                            {/* Confirm Password Field */}
                            <div className="grid gap-2">
                                <Label htmlFor="password_confirmation" className="text-sm font-medium text-gray-700">
                                    Confirm Password
                                </Label>
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
                                    className="px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                                />
                                <InputError message={errors.password_confirmation} className="mt-1" />
                            </div>

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                className="mt-2 w-full py-3 rounded-2xl font-semibold text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                                tabIndex={5}
                                disabled={processing}
                            >
                                {processing ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <LoaderCircle className="h-4 w-4 animate-spin" />
                                        Creating Account...
                                    </div>
                                ) : (
                                    'Create Account'
                                )}
                            </Button>
                        </div>

                        {/* Login Link */}
                        <div className="text-center text-sm pt-4 border-t border-gray-200">
                            <span className="text-gray-600">Already have an account? </span>
                            <TextLink
                                href={route('login')}
                                tabIndex={6}
                                className="text-amber-600 hover:text-amber-700 font-medium"
                            >
                                Sign in here
                            </TextLink>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="mt-6 text-center">
                    <p className="text-xs text-gray-500">
                        © 2025 ISANPALM Thailand. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
}
