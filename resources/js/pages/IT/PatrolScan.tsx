import React, { useEffect, useRef, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { AlertTriangle, Camera, QrCode, ShieldCheck, X } from 'lucide-react';

// html5-qrcode is loaded dynamically to avoid SSR issues
declare global {
    interface Window {
        Html5Qrcode: any;
        Html5QrcodeScanner: any;
    }
}

const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'ฝ่ายสารสนเทศและเทคโนโลยี', href: '#' },
    { title: 'ตรวจพื้นที่ รปภ. QR', href: '/it/patrol' },
    { title: 'สแกน QR', href: '#' },
];

export default function PatrolScan() {
    const scannerRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [scanning, setScanning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [scanned, setScanned] = useState<string | null>(null);
    const [loadingLib, setLoadingLib] = useState(true);

    // Dynamically load html5-qrcode library
    useEffect(() => {
        if (typeof window !== 'undefined' && !window.Html5Qrcode) {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js';
            script.async = true;
            script.onload = () => setLoadingLib(false);
            script.onerror = () => setError('ไม่สามารถโหลด QR library ได้');
            document.head.appendChild(script);
        } else if (window.Html5Qrcode) {
            setLoadingLib(false);
        }
        return () => {
            stopScanner();
        };
    }, []);

    const startScanner = async () => {
        if (!window.Html5Qrcode) {
            setError('ยังโหลด QR library ไม่เสร็จ กรุณารอสักครู่');
            return;
        }
        setError(null);
        setScanning(true);

        try {
            const scanner = new window.Html5Qrcode('qr-reader');
            scannerRef.current = scanner;

            const cameras = await window.Html5Qrcode.getCameras();
            if (!cameras || cameras.length === 0) {
                setError('ไม่พบกล้องในอุปกรณ์');
                setScanning(false);
                return;
            }

            // prefer back camera
            const backCamera = cameras.find((c: any) =>
                /back|rear|environment/i.test(c.label)
            ) ?? cameras[cameras.length - 1];

            await scanner.start(
                backCamera.id,
                {
                    fps: 10,
                    qrbox: { width: 260, height: 260 },
                    aspectRatio: 1.0,
                },
                (decodedText: string) => {
                    handleScanSuccess(decodedText);
                },
                () => {
                    // silent scan failure
                }
            );
        } catch (err: any) {
            console.error('Camera error:', err);
            setError(
                err?.message?.includes('Permission')
                    ? 'กรุณาอนุญาตการเข้าถึงกล้อง'
                    : 'ไม่สามารถเปิดกล้องได้: ' + (err?.message ?? '')
            );
            setScanning(false);
        }
    };

    const stopScanner = async () => {
        if (scannerRef.current) {
            try {
                await scannerRef.current.stop();
                scannerRef.current.clear();
            } catch {
                // ignore
            }
            scannerRef.current = null;
        }
        setScanning(false);
    };

    const handleScanSuccess = async (decodedText: string) => {
        if (scanned) return; // prevent double-fire
        setScanned(decodedText);
        await stopScanner();

        // Redirect to patrol form with the QR code value
        router.visit(`/it/patrol/form?qr=${encodeURIComponent(decodedText)}`, {
            replace: false,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="สแกน QR – ตรวจพื้นที่ รปภ." />

            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-4 font-anuphan sm:p-6">
                <div className="mx-auto max-w-lg space-y-6">

                    {/* Header */}
                    <div className="text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/20 ring-2 ring-blue-400/30">
                            <QrCode className="h-8 w-8 text-blue-400" />
                        </div>
                        <h1 className="text-2xl font-black text-white">QR Guard Patrol</h1>
                        <p className="mt-1 text-sm text-slate-400">สแกน QR Code ที่จุดตรวจเพื่อบันทึกการตรวจพื้นที่</p>
                    </div>

                    {/* Scanner Viewfinder */}
                    <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-800/60 shadow-2xl backdrop-blur-md">

                        {/* Camera area */}
                        <div className="relative bg-black" style={{ minHeight: 320 }}>
                            {!scanning && !scanned && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                                    <Camera className="h-16 w-16 text-slate-600" />
                                    <p className="text-sm font-semibold text-slate-500">กดปุ่มด้านล่างเพื่อเปิดกล้อง</p>
                                </div>
                            )}

                            {scanned && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-emerald-900/80">
                                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500">
                                        <ShieldCheck className="h-10 w-10 text-white" />
                                    </div>
                                    <p className="text-lg font-black text-white">สแกนสำเร็จ!</p>
                                    <p className="max-w-xs break-all px-4 text-center text-xs text-emerald-200">{scanned}</p>
                                    <p className="text-xs text-emerald-300">กำลังเปิดฟอร์มบันทึก...</p>
                                </div>
                            )}

                            {/* html5-qrcode mounts here */}
                            <div
                                id="qr-reader"
                                ref={containerRef}
                                className="w-full"
                                style={{ display: scanning ? 'block' : 'none' }}
                            />

                            {/* Scanning overlay */}
                            {scanning && (
                                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                    <div className="relative h-64 w-64">
                                        {/* Corner brackets */}
                                        {[
                                            'top-0 left-0 border-t-4 border-l-4 rounded-tl-lg',
                                            'top-0 right-0 border-t-4 border-r-4 rounded-tr-lg',
                                            'bottom-0 left-0 border-b-4 border-l-4 rounded-bl-lg',
                                            'bottom-0 right-0 border-b-4 border-r-4 rounded-br-lg',
                                        ].map((cls, i) => (
                                            <div
                                                key={i}
                                                className={`absolute h-10 w-10 border-blue-400 ${cls}`}
                                            />
                                        ))}
                                        {/* Scan line animation */}
                                        <div className="animate-scan absolute left-0 right-0 h-0.5 bg-blue-400 opacity-80 shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Controls */}
                        <div className="p-5 space-y-3">
                            {error && (
                                <div className="flex items-start gap-2 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
                                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            {!scanning ? (
                                <button
                                    type="button"
                                    disabled={loadingLib || !!scanned}
                                    onClick={startScanner}
                                    className="w-full rounded-xl bg-blue-600 px-6 py-4 text-base font-black text-white shadow-lg transition hover:bg-blue-500 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loadingLib ? 'กำลังโหลด...' : '📷  เปิดกล้องสแกน QR'}
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={stopScanner}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600/80 px-6 py-4 text-base font-black text-white transition hover:bg-red-600"
                                >
                                    <X className="h-5 w-5" />
                                    หยุดสแกน
                                </button>
                            )}

                            <a
                                href="/it/patrol"
                                className="block w-full rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-center text-sm font-bold text-slate-300 transition hover:bg-white/10"
                            >
                                ← กลับไปหน้า Dashboard
                            </a>
                        </div>
                    </div>

                    {/* Instructions */}
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-400">
                        <p className="mb-2 font-bold text-slate-300">วิธีใช้งาน</p>
                        <ol className="list-decimal list-inside space-y-1">
                            <li>กดปุ่ม "เปิดกล้องสแกน QR"</li>
                            <li>อนุญาตการเข้าถึงกล้องเมื่อระบบถาม</li>
                            <li>นำกล้องไปจ่อที่ QR Code ของจุดตรวจ</li>
                            <li>ระบบจะพาไปหน้ากรอกรายละเอียดโดยอัตโนมัติ</li>
                        </ol>
                    </div>
                </div>
            </div>

            <style>{`
                #qr-reader video { width: 100% !important; }
                #qr-reader__dashboard { display: none !important; }
                #qr-reader img { display: none !important; }
                @keyframes scan {
                    0% { top: 10%; }
                    50% { top: 85%; }
                    100% { top: 10%; }
                }
                .animate-scan { animation: scan 2.5s ease-in-out infinite; }
            `}</style>
        </AppLayout>
    );
}
