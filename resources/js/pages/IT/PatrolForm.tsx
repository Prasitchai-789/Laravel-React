import React, { useEffect, useRef, useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import axios from 'axios';
import {
    AlertTriangle,
    Camera,
    CheckCircle2,
    ChevronLeft,
    Image,
    Loader2,
    MapPin,
    Navigation,
    QrCode,
    Send,
    ShieldCheck,
    X,
} from 'lucide-react';

interface Checkpoint {
    id: number;
    code: string;
    name: string;
    area?: string | null;
    radius_meters: number;
    latitude: number;
    longitude: number;
}

interface SubmitResult {
    success: boolean;
    message: string;
    data: {
        status: string;
        distance_meters?: number | null;
        allowed_radius_meters?: number | null;
    };
}

const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'ฝ่ายสารสนเทศและเทคโนโลยี', href: '#' },
    { title: 'ตรวจพื้นที่ รปภ. QR', href: '/it/patrol' },
    { title: 'บันทึกการตรวจ', href: '#' },
];

export default function PatrolForm() {
    const { auth } = usePage<any>().props;
    const user = auth?.user;

    // Parse QR from URL
    const qrCode = new URLSearchParams(window.location.search).get('qr') ?? '';

    const [checkpoint, setCheckpoint] = useState<Checkpoint | null>(null);
    const [loadingCheckpoint, setLoadingCheckpoint] = useState(true);

    const [status, setStatus] = useState<'ok' | 'not_ok'>('ok');
    const [note, setNote] = useState('');
    const [images, setImages] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null);
    const [gpsLoading, setGpsLoading] = useState(false);
    const [gpsError, setGpsError] = useState<string | null>(null);

    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<SubmitResult | null>(null);
    const [submitError, setSubmitError] = useState<string | null>(null);

    // Load checkpoint info based on QR
    useEffect(() => {
        if (!qrCode) {
            setLoadingCheckpoint(false);
            return;
        }
        axios
            .get('/api/patrol/checkpoints')
            .then((res) => {
                const allCheckpoints: Checkpoint[] = res.data.data ?? [];
                // Try to match by code or by URL param
                const normalizedQr = qrCode.trim();
                const found =
                    allCheckpoints.find((c) => c.code === normalizedQr) ??
                    allCheckpoints.find((c) =>
                        normalizedQr.includes(c.code)
                    ) ??
                    null;
                setCheckpoint(found);
            })
            .catch(console.error)
            .finally(() => setLoadingCheckpoint(false));
    }, [qrCode]);

    // Auto-get GPS on mount
    useEffect(() => {
        getGPS();
    }, []);

    const getGPS = () => {
        setGpsLoading(true);
        setGpsError(null);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                setGpsLoading(false);
            },
            (err) => {
                setGpsError('ไม่สามารถดึง GPS ได้: ' + err.message);
                setGpsLoading(false);
            },
            { enableHighAccuracy: true, timeout: 15000 }
        );
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        if (files.length === 0) return;
        const newImages = [...images, ...files].slice(0, 4); // max 4 images
        setImages(newImages);
        const urls = newImages.map((f) => URL.createObjectURL(f));
        setPreviewUrls(urls);
    };

    const removeImage = (index: number) => {
        const newImages = images.filter((_, i) => i !== index);
        const newUrls = previewUrls.filter((_, i) => i !== index);
        setImages(newImages);
        setPreviewUrls(newUrls);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!gps) {
            setSubmitError('กรุณาดึงข้อมูล GPS ก่อนส่งข้อมูล');
            return;
        }
        if (!qrCode) {
            setSubmitError('ไม่พบรหัส QR Code');
            return;
        }

        setSubmitting(true);
        setSubmitError(null);

        try {
            const formData = new FormData();
            formData.append('qr_code', qrCode);
            formData.append('latitude', String(gps.lat));
            formData.append('longitude', String(gps.lng));
            formData.append('note', status === 'not_ok' ? note : '');
            
            if (user) {
                formData.append('guard_id', String(user.id));
                formData.append('guard_name', user.name);
            }

            images.forEach((img, i) => formData.append(`images[${i}]`, img));

            const res = await axios.post('/api/patrol/scan', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                validateStatus: () => true, // don't throw on 422
            });

            setResult({
                success: res.data.success ?? false,
                message: res.data.message ?? '',
                data: res.data.data ?? {},
            });
        } catch (err: any) {
            setSubmitError(err?.response?.data?.message ?? err?.message ?? 'เกิดข้อผิดพลาด');
        } finally {
            setSubmitting(false);
        }
    };

    // ---- Result Screen ----
    if (result) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="ผลการบันทึก – ตรวจพื้นที่ รปภ." />
                <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-4">
                    <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-800/70 p-8 text-center shadow-2xl backdrop-blur-md">
                        <div
                            className={`mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full ${
                                result.success ? 'bg-emerald-500' : 'bg-amber-500'
                            }`}
                        >
                            {result.success ? (
                                <ShieldCheck className="h-10 w-10 text-white" />
                            ) : (
                                <AlertTriangle className="h-10 w-10 text-white" />
                            )}
                        </div>
                        <h2
                            className={`text-2xl font-black ${
                                result.success ? 'text-emerald-400' : 'text-amber-400'
                            }`}
                        >
                            {result.success ? 'บันทึกสำเร็จ!' : 'บันทึกแล้ว (มีเตือน)'}
                        </h2>
                        <p className="mt-2 text-slate-300">{result.message}</p>

                        {result.data?.distance_meters != null && (
                            <div className="mt-4 rounded-lg bg-white/5 p-3 text-sm text-slate-400">
                                <span>ระยะห่าง: </span>
                                <span className="font-bold text-white">
                                    {Number(result.data.distance_meters).toFixed(1)} m
                                </span>
                                {result.data.allowed_radius_meters != null && (
                                    <span className="text-slate-500">
                                        {' '}/ {result.data.allowed_radius_meters} m
                                    </span>
                                )}
                            </div>
                        )}

                        <div className="mt-6 flex gap-3">
                            <button
                                type="button"
                                onClick={() => router.visit('/it/patrol/scan')}
                                className="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-black text-white hover:bg-blue-500"
                            >
                                สแกนต่อ
                            </button>
                            <button
                                type="button"
                                onClick={() => router.visit('/it/patrol')}
                                className="flex-1 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-bold text-slate-300 hover:bg-white/10"
                            >
                                Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="บันทึกการตรวจ – ตรวจพื้นที่ รปภ." />

            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-4 font-anuphan sm:p-6">
                <div className="mx-auto max-w-lg">

                    {/* Back button */}
                    <button
                        type="button"
                        onClick={() => router.visit('/it/patrol/scan')}
                        className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-400 transition hover:text-white"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        กลับไปสแกนใหม่
                    </button>

                    <form onSubmit={handleSubmit} className="space-y-4">

                        {/* QR Info + Checkpoint Header */}
                        <div className="rounded-2xl border border-white/10 bg-slate-800/60 p-5 shadow-xl backdrop-blur-md">
                            <div className="flex items-start gap-4">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-500/20 ring-2 ring-blue-400/20">
                                    <QrCode className="h-6 w-6 text-blue-400" />
                                </div>
                                <div className="min-w-0">
                                    {loadingCheckpoint ? (
                                        <div className="text-slate-400 text-sm">กำลังโหลดข้อมูลจุดตรวจ...</div>
                                    ) : checkpoint ? (
                                        <>
                                            <h2 className="text-xl font-black text-white">{checkpoint.name}</h2>
                                            <p className="text-sm text-slate-400">
                                                {checkpoint.area ?? 'ไม่ระบุพื้นที่'} · Radius {checkpoint.radius_meters} m
                                            </p>
                                            <span className="mt-1 inline-block rounded-md bg-blue-500/20 px-2 py-0.5 text-xs font-black text-blue-300">
                                                {checkpoint.code}
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <h2 className="text-base font-bold text-amber-400">ไม่พบจุดตรวจในระบบ</h2>
                                            <p className="mt-0.5 break-all text-xs text-slate-500">{qrCode || '(ไม่มี QR)'}</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* GPS */}
                        <div className="rounded-2xl border border-white/10 bg-slate-800/60 p-5 backdrop-blur-md">
                            <label className="mb-3 flex items-center gap-2 text-sm font-black text-slate-300">
                                <MapPin className="h-4 w-4 text-blue-400" />
                                ตำแหน่ง GPS
                            </label>
                            {gps ? (
                                <div className="flex items-center justify-between rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3">
                                    <div className="text-sm">
                                        <p className="font-bold text-emerald-400">
                                            {gps.lat.toFixed(6)}, {gps.lng.toFixed(6)}
                                        </p>
                                        <p className="text-xs text-emerald-600">ดึง GPS สำเร็จ</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={getGPS}
                                        className="rounded-lg bg-emerald-500/20 p-2 text-emerald-400 hover:bg-emerald-500/30"
                                    >
                                        <Navigation className="h-4 w-4" />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={getGPS}
                                    disabled={gpsLoading}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 py-3 text-sm font-bold text-blue-400 hover:bg-blue-500/20 disabled:opacity-60"
                                >
                                    {gpsLoading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Navigation className="h-4 w-4" />
                                    )}
                                    {gpsLoading ? 'กำลังดึง GPS...' : 'ดึงตำแหน่ง GPS'}
                                </button>
                            )}
                            {gpsError && (
                                <p className="mt-2 text-xs text-red-400">{gpsError}</p>
                            )}
                        </div>

                        {/* Status Radio */}
                        <div className="rounded-2xl border border-white/10 bg-slate-800/60 p-5 backdrop-blur-md">
                            <label className="mb-3 flex items-center gap-2 text-sm font-black text-slate-300">
                                <ShieldCheck className="h-4 w-4 text-blue-400" />
                                สถานะการตรวจ
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { value: 'ok', label: 'ปกติ', icon: CheckCircle2, color: 'emerald' },
                                    { value: 'not_ok', label: 'ไม่ปกติ', icon: AlertTriangle, color: 'amber' },
                                ].map(({ value, label, icon: Icon, color }) => (
                                    <label
                                        key={value}
                                        className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${
                                            status === value
                                                ? color === 'emerald'
                                                    ? 'border-emerald-500/50 bg-emerald-500/10'
                                                    : 'border-amber-500/50 bg-amber-500/10'
                                                : 'border-white/10 bg-white/5 hover:bg-white/10'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="status"
                                            value={value}
                                            checked={status === value}
                                            onChange={() => setStatus(value as 'ok' | 'not_ok')}
                                            className="sr-only"
                                        />
                                        <Icon
                                            className={`h-5 w-5 ${
                                                status === value
                                                    ? color === 'emerald'
                                                        ? 'text-emerald-400'
                                                        : 'text-amber-400'
                                                    : 'text-slate-500'
                                            }`}
                                        />
                                        <span
                                            className={`font-black ${
                                                status === value
                                                    ? color === 'emerald'
                                                        ? 'text-emerald-300'
                                                        : 'text-amber-300'
                                                    : 'text-slate-400'
                                            }`}
                                        >
                                            {label}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Note */}
                        {status === 'not_ok' && (
                            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 backdrop-blur-md">
                                <label className="mb-2 block text-sm font-black text-amber-300">
                                    รายละเอียด / สิ่งผิดปกติ <span className="text-amber-500">*</span>
                                </label>
                                <textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    required={status === 'not_ok'}
                                    rows={4}
                                    placeholder="อธิบายสิ่งที่พบ เช่น ไฟดับ, ประตูไม่ล็อก, พบบุคคลต้องสงสัย..."
                                    className="w-full rounded-xl border border-amber-500/20 bg-slate-900/60 p-3 text-sm text-slate-200 placeholder-slate-600 focus:border-amber-400/50 focus:outline-none"
                                />
                            </div>
                        )}

                        {/* Note visible always for optional */}
                        {status === 'ok' && (
                            <div className="rounded-2xl border border-white/10 bg-slate-800/60 p-5 backdrop-blur-md">
                                <label className="mb-2 block text-sm font-black text-slate-300">
                                    หมายเหตุ (ไม่บังคับ)
                                </label>
                                <textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    rows={2}
                                    placeholder="หมายเหตุเพิ่มเติม..."
                                    className="w-full rounded-xl border border-white/10 bg-slate-900/60 p-3 text-sm text-slate-200 placeholder-slate-600 focus:border-blue-400/50 focus:outline-none"
                                />
                            </div>
                        )}

                        {/* Image Upload */}
                        <div className="rounded-2xl border border-white/10 bg-slate-800/60 p-5 backdrop-blur-md">
                            <label className="mb-3 flex items-center gap-2 text-sm font-black text-slate-300">
                                <Camera className="h-4 w-4 text-blue-400" />
                                ถ่ายรูป (สูงสุด 4 ภาพ)
                            </label>

                            {previewUrls.length > 0 && (
                                <div className="mb-3 grid grid-cols-2 gap-2">
                                    {previewUrls.map((url, i) => (
                                        <div key={i} className="relative aspect-video overflow-hidden rounded-xl">
                                            <img src={url} alt="" className="h-full w-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => removeImage(i)}
                                                className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1 text-white hover:bg-red-600"
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {images.length < 4 && (
                                <>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        capture="environment"
                                        onChange={handleImageChange}
                                        className="hidden"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 py-4 text-sm font-bold text-slate-400 transition hover:border-blue-400/40 hover:text-blue-400"
                                    >
                                        <Image className="h-5 w-5" />
                                        เพิ่มรูปภาพ
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Error */}
                        {submitError && (
                            <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
                                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                                <span>{submitError}</span>
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={submitting || !gps || (!qrCode)}
                            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 py-4 text-base font-black text-white shadow-lg shadow-blue-500/20 transition hover:from-blue-500 hover:to-blue-400 active:scale-95 disabled:opacity-50"
                        >
                            {submitting ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <Send className="h-5 w-5" />
                            )}
                            {submitting ? 'กำลังบันทึก...' : 'บันทึกการตรวจ'}
                        </button>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
