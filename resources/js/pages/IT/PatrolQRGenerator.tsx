import React, { useEffect, useState } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import { MapPin, Printer, QrCode } from 'lucide-react';

interface Checkpoint {
    id: number;
    code: string;
    name: string;
    area?: string | null;
    radius_meters: number;
}

const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'ฝ่ายสารสนเทศและเทคโนโลยี', href: '#' },
    { title: 'ตรวจพื้นที่ รปภ. QR', href: '/it/patrol' },
    { title: 'สร้าง QR Code จุดตรวจ', href: '#' },
];

export default function PatrolQRGenerator() {
    const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        axios.get('/api/patrol/checkpoints')
            .then((res) => {
                setCheckpoints(res.data.data ?? []);
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setError('ไม่สามารถโหลดข้อมูลจุดตรวจได้');
                setLoading(false);
            });
    }, []);

    const handlePrint = () => {
        window.print();
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="สร้าง QR Code จุดตรวจ – ตรวจพื้นที่ รปภ." />

            <div className="min-h-screen bg-slate-50 p-4 font-anuphan sm:p-6 lg:p-8 print:bg-white print:p-0">
                {/* ── Screen Only Header ── */}
                <div className="mx-auto max-w-7xl space-y-6 print:hidden">
                    <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
                        <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
                                <QrCode className="h-6 w-6" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black tracking-tight text-slate-800">
                                    พิมพ์ป้าย QR Code จุดตรวจ
                                </h1>
                                <p className="mt-1 text-sm text-slate-500">
                                    พิมพ์ป้าย QR Code เพื่อนำไปติดที่จุดตรวจจริง
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={handlePrint}
                                disabled={loading || checkpoints.length === 0}
                                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-50"
                            >
                                <Printer className="h-4 w-4" />
                                สั่งพิมพ์ / บันทึก PDF
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
                            {error}
                        </div>
                    )}

                    {loading && (
                        <div className="py-12 text-center text-slate-500">
                            กำลังโหลดข้อมูลจุดตรวจ...
                        </div>
                    )}
                </div>

                {/* ── Print Area ── */}
                {!loading && checkpoints.length > 0 && (
                    <div className="mx-auto mt-6 max-w-7xl print:m-0 print:block print:max-w-none">
                        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4 print:grid-cols-3 print:gap-4">
                            {checkpoints.map((cp) => {
                                // Full URL or just the code? 
                                // Since users might scan with normal camera app first, encoding full URL is better.
                                // Construct the URL where the form handles the param `qr`
                                const qrValue = `${window.location.origin}/it/patrol/form?qr=${encodeURIComponent(cp.code)}`;

                                return (
                                    <div
                                        key={cp.id}
                                        className="flex flex-col items-center break-inside-avoid rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-sm print:border-slate-300 print:shadow-none"
                                    >
                                        <div className="mb-4 text-center">
                                            <h2 className="text-lg font-black text-slate-900">{cp.name}</h2>
                                            {cp.area && (
                                                <p className="mt-1 flex items-center justify-center gap-1 text-sm font-semibold text-slate-500">
                                                    <MapPin className="h-3.5 w-3.5" />
                                                    {cp.area}
                                                </p>
                                            )}
                                        </div>

                                        <div className="rounded-xl border-4 border-slate-100 bg-white p-3">
                                            <QRCodeSVG
                                                value={qrValue}
                                                size={160}
                                                level="H"
                                                includeMargin={false}
                                            />
                                        </div>

                                        <p className="mt-4 rounded-md bg-slate-100 px-3 py-1 text-xs font-black text-slate-500">
                                            {cp.code}
                                        </p>
                                        
                                        <p className="mt-2 text-[10px] text-slate-400">
                                            ใช้แอป QR Guard Patrol เพื่อสแกน
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
            
            <style>{`
                @media print {
                    @page { margin: 10mm; size: A4; }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    nav, header { display: none !important; }
                }
            `}</style>
        </AppLayout>
    );
}
