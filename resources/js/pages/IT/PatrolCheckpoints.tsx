import React, { useEffect, useState, useRef } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import axios from 'axios';
import {
    Edit2,
    MapPin,
    Plus,
    Save,
    Trash2,
    X,
} from 'lucide-react';
import Swal from 'sweetalert2';

interface Checkpoint {
    id: number;
    code: string;
    name: string;
    area?: string | null;
    radius_meters: number;
    latitude: number;
    longitude: number;
    is_active: boolean;
    description?: string | null;
}

const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'ฝ่ายสารสนเทศและเทคโนโลยี', href: '#' },
    { title: 'ตรวจพื้นที่ รปภ. QR', href: '/it/patrol' },
    { title: 'จัดการจุดตรวจ (Checkpoints)', href: '#' },
];

export default function PatrolCheckpoints() {
    const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
    const [loading, setLoading] = useState(true);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState<Partial<Checkpoint>>({
        code: '',
        name: '',
        area: '',
        radius_meters: 50,
        latitude: 0,
        longitude: 0,
        is_active: true,
        description: '',
    });

    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<any>(null);
    const markerRef = useRef<any>(null);
    const circleRef = useRef<any>(null);

    const fetchCheckpoints = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/patrol/admin/checkpoints');
            setCheckpoints(res.data.data ?? []);
        } catch (error) {
            console.error(error);
            Swal.fire('ข้อผิดพลาด', 'ไม่สามารถโหลดข้อมูลได้', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCheckpoints();
    }, []);

    const openCreateForm = () => {
        setEditingId(null);
        setFormData({
            code: `CP-${Math.floor(Date.now() / 1000)}`, // auto-generate default code
            name: '',
            area: '',
            radius_meters: 50,
            latitude: 15.0, // default TH center
            longitude: 100.0,
            is_active: true,
            description: '',
        });
        setIsFormOpen(true);
    };

    const openEditForm = (cp: Checkpoint) => {
        setEditingId(cp.id);
        setFormData({ ...cp });
        setIsFormOpen(true);
    };

    const closeForm = () => {
        setIsFormOpen(false);
        setEditingId(null);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                await axios.put(`/api/patrol/admin/checkpoints/${editingId}`, formData);
                Swal.fire('สำเร็จ', 'อัปเดตจุดตรวจเรียบร้อย', 'success');
            } else {
                await axios.post('/api/patrol/admin/checkpoints', formData);
                Swal.fire('สำเร็จ', 'สร้างจุดตรวจเรียบร้อย', 'success');
            }
            fetchCheckpoints();
            closeForm();
        } catch (error: any) {
            const msg = error.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึก';
            Swal.fire('ข้อผิดพลาด', msg, 'error');
        }
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: 'ยืนยันการลบ',
            text: 'คุณต้องการลบจุดตรวจนี้ใช่หรือไม่?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'ลบ',
            confirmButtonColor: '#ef4444',
            cancelButtonText: 'ยกเลิก',
        });

        if (result.isConfirmed) {
            try {
                await axios.delete(`/api/patrol/admin/checkpoints/${id}`);
                Swal.fire('ลบสำเร็จ', '', 'success');
                fetchCheckpoints();
            } catch (error) {
                Swal.fire('ข้อผิดพลาด', 'ไม่สามารถลบได้', 'error');
            }
        }
    };

    // Initialize map when form is opened
    useEffect(() => {
        if (!isFormOpen || !mapRef.current) return;

        let L: any;

        const initMap = async () => {
            if (!(window as any).L) {
                await new Promise<void>((resolve, reject) => {
                    const link = document.createElement('link');
                    link.rel = 'stylesheet';
                    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
                    document.head.appendChild(link);

                    const script = document.createElement('script');
                    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
                    script.onload = () => resolve();
                    script.onerror = reject;
                    document.head.appendChild(script);
                });
            }
            L = (window as any).L;

            if (!mapInstance.current) {
                mapInstance.current = L.map(mapRef.current).setView(
                    [formData.latitude || 15.0, formData.longitude || 100.0],
                    formData.latitude && formData.latitude !== 15.0 ? 17 : 6
                );
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    maxZoom: 19,
                }).addTo(mapInstance.current);

                // Add marker
                markerRef.current = L.marker([formData.latitude || 15.0, formData.longitude || 100.0], {
                    draggable: true,
                }).addTo(mapInstance.current);

                // Add circle for radius
                circleRef.current = L.circle([formData.latitude || 15.0, formData.longitude || 100.0], {
                    radius: formData.radius_meters || 50,
                    color: '#3b82f6',
                    fillOpacity: 0.2,
                }).addTo(mapInstance.current);

                // Events
                markerRef.current.on('dragend', function (e: any) {
                    const pos = markerRef.current.getLatLng();
                    updateGps(pos.lat, pos.lng);
                });

                mapInstance.current.on('click', function (e: any) {
                    markerRef.current.setLatLng(e.latlng);
                    updateGps(e.latlng.lat, e.latlng.lng);
                });
            } else {
                // Map exists, just update pos
                mapInstance.current.invalidateSize();
                const newPos = [formData.latitude || 15.0, formData.longitude || 100.0];
                mapInstance.current.setView(newPos, formData.latitude && formData.latitude !== 15.0 ? 17 : 6);
                markerRef.current.setLatLng(newPos);
                circleRef.current.setLatLng(newPos);
                circleRef.current.setRadius(formData.radius_meters || 50);
            }
        };

        const updateGps = (lat: number, lng: number) => {
            setFormData((prev) => ({ ...prev, latitude: lat, longitude: lng }));
            circleRef.current.setLatLng([lat, lng]);
        };

        initMap();

        return () => {
            // cleanup map on unmount if needed, but keeping it in ref is fine
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isFormOpen]); // re-run ONLY on open

    const handleRadiusChange = (val: number) => {
        setFormData({ ...formData, radius_meters: val });
        if (circleRef.current) {
            circleRef.current.setRadius(val);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="จัดการจุดตรวจ – ตรวจพื้นที่ รปภ." />

            <div className="min-h-screen bg-slate-50 p-4 font-anuphan text-slate-900 sm:p-6 lg:p-8">
                <div className="mx-auto max-w-7xl space-y-6">

                    {/* Header */}
                    <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
                        <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
                                <MapPin className="h-6 w-6" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black tracking-tight">ระบบจัดการจุดตรวจ (Checkpoints)</h1>
                                <p className="mt-1 text-sm text-slate-500">
                                    เพิ่ม ลบ แก้ไข จุดสแกน QR ภายในโรงงาน
                                </p>
                            </div>
                        </div>
                        {!isFormOpen && (
                            <button
                                type="button"
                                onClick={openCreateForm}
                                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-blue-500"
                            >
                                <Plus className="h-4 w-4" />
                                สร้างจุดตรวจใหม่
                            </button>
                        )}
                    </div>

                    {/* Form Section */}
                    {isFormOpen && (
                        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-md animate-in fade-in slide-in-from-top-4">
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-lg font-black text-slate-800">
                                    {editingId ? 'แก้ไขจุดตรวจ' : 'สร้างจุดตรวจใหม่'}
                                </h2>
                                <button onClick={closeForm} className="text-slate-400 hover:text-slate-600">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSave} className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                                {/* Left: Form Fields */}
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="mb-1 block text-sm font-bold text-slate-600">รหัส QR Code (Code)</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.code}
                                                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                                className="w-full rounded-lg border-slate-300 bg-slate-50 text-sm focus:border-blue-500 focus:ring-blue-500"
                                                placeholder="เช่น CP01"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-sm font-bold text-slate-600">ชื่อจุดตรวจ</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full rounded-lg border-slate-300 bg-slate-50 text-sm focus:border-blue-500 focus:ring-blue-500"
                                                placeholder="เช่น ประตูทางเข้า 1"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="mb-1 block text-sm font-bold text-slate-600">พื้นที่ (Area)</label>
                                            <input
                                                type="text"
                                                value={formData.area || ''}
                                                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                                                className="w-full rounded-lg border-slate-300 bg-slate-50 text-sm focus:border-blue-500 focus:ring-blue-500"
                                                placeholder="เช่น Zone A"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-sm font-bold text-slate-600">รัศมี (เมตร)</label>
                                            <input
                                                type="number"
                                                min="1"
                                                required
                                                value={formData.radius_meters}
                                                onChange={(e) => handleRadiusChange(Number(e.target.value))}
                                                className="w-full rounded-lg border-slate-300 bg-slate-50 text-sm focus:border-blue-500 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="mb-1 block text-sm font-bold text-slate-600">Latitude</label>
                                            <input
                                                type="number"
                                                step="any"
                                                required
                                                value={formData.latitude}
                                                onChange={(e) => setFormData({ ...formData, latitude: Number(e.target.value) })}
                                                className="w-full rounded-lg border-slate-300 bg-slate-50 text-sm focus:border-blue-500 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-sm font-bold text-slate-600">Longitude</label>
                                            <input
                                                type="number"
                                                step="any"
                                                required
                                                value={formData.longitude}
                                                onChange={(e) => setFormData({ ...formData, longitude: Number(e.target.value) })}
                                                className="w-full rounded-lg border-slate-300 bg-slate-50 text-sm focus:border-blue-500 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="mb-1 flex items-center gap-2 text-sm font-bold text-slate-600">
                                            <input
                                                type="checkbox"
                                                checked={formData.is_active}
                                                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            เปิดใช้งานจุดตรวจนี้
                                        </label>
                                    </div>
                                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                        <button
                                            type="button"
                                            onClick={closeForm}
                                            className="rounded-lg px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100"
                                        >
                                            ยกเลิก
                                        </button>
                                        <button
                                            type="submit"
                                            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2 text-sm font-black text-white hover:bg-emerald-500"
                                        >
                                            <Save className="h-4 w-4" />
                                            บันทึก
                                        </button>
                                    </div>
                                </div>

                                {/* Right: Map */}
                                <div>
                                    <label className="mb-1 block text-sm font-bold text-slate-600">เลือกตำแหน่งจากแผนที่ (คลิกหรือลากหมุด)</label>
                                    <div
                                        ref={mapRef}
                                        className="h-full min-h-[300px] w-full items-center justify-center rounded-xl border-2 border-slate-200 bg-slate-100 z-0"
                                    />
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Table Section */}
                    {!isFormOpen && (
                        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 font-black uppercase text-slate-500">
                                    <tr>
                                        <th className="px-5 py-4">QR Code</th>
                                        <th className="px-5 py-4">ชื่อจุดตรวจ</th>
                                        <th className="px-5 py-4 text-center">พิกัด / รัศมี</th>
                                        <th className="px-5 py-4 text-center">สถานะ</th>
                                        <th className="px-5 py-4 text-right">จัดการ</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={5} className="px-5 py-8 text-center text-slate-400">กำลังโหลด...</td>
                                        </tr>
                                    ) : checkpoints.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-5 py-8 text-center text-slate-400">ไม่มีข้อมูลจุดตรวจ</td>
                                        </tr>
                                    ) : (
                                        checkpoints.map((cp) => (
                                            <tr key={cp.id} className="hover:bg-slate-50">
                                                <td className="px-5 py-3 font-bold text-blue-600">{cp.code}</td>
                                                <td className="px-5 py-3">
                                                    <p className="font-bold text-slate-800">{cp.name}</p>
                                                    <p className="text-xs text-slate-500">{cp.area || '-'}</p>
                                                </td>
                                                <td className="px-5 py-3 text-center">
                                                    <p className="text-xs tracking-tighter text-slate-600">{cp.latitude.toFixed(5)}, {cp.longitude.toFixed(5)}</p>
                                                    <p className="text-xs font-bold text-indigo-600">{cp.radius_meters}m</p>
                                                </td>
                                                <td className="px-5 py-3 text-center">
                                                    {cp.is_active ? (
                                                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">เปิดใช้งาน</span>
                                                    ) : (
                                                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-500">ปิดใช้งาน</span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-3 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => openEditForm(cp)}
                                                            className="rounded bg-slate-100 p-1.5 text-slate-600 hover:bg-slate-200"
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(cp.id)}
                                                            className="rounded bg-rose-50 p-1.5 text-rose-600 hover:bg-rose-100"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                </div>
            </div>
            
            <style>{`
                /* Ensure Leaflet marker stays above map but below modal/dropdowns */
                .leaflet-container {
                    z-index: 10 !important;
                }
            `}</style>
        </AppLayout>
    );
}
