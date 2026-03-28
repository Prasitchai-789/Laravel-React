import { useState } from 'react';
import axios from 'axios';
import AppLayout from '@/layouts/app-layout';
import { ClipboardCheck, CheckCircle2, AlertTriangle, Hammer, Sparkles } from 'lucide-react';

const STATUS_OPTIONS = [
    { value: 'normal', label: 'ปกติ (Normal)', icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-emerald-700 bg-emerald-100 hover:bg-emerald-200 border-emerald-200', activeRing: 'ring-emerald-500' },
    { value: 'issue', label: 'พบปัญหา (Issue)', icon: <AlertTriangle className="w-4 h-4" />, color: 'text-amber-700 bg-amber-100 hover:bg-amber-200 border-amber-200', activeRing: 'ring-amber-500' },
    { value: 'broken', label: 'ชำรุด (Broken)', icon: <Hammer className="w-4 h-4" />, color: 'text-rose-700 bg-rose-100 hover:bg-rose-200 border-rose-200', activeRing: 'ring-rose-500' },
    { value: 'cleaned', label: 'ทำความสะอาด', icon: <Sparkles className="w-4 h-4" />, color: 'text-blue-700 bg-blue-100 hover:bg-blue-200 border-blue-200', activeRing: 'ring-blue-500' },
];

export default function ChecklistPage({ deviceId, deviceName, items }: { deviceId: number, deviceName: string, items: any[] }) {
    const [responses, setResponses] = useState<any>({});
    const [checkedBy, setCheckedBy] = useState('');

    const handleSubmit = async () => {
        if (!checkedBy) {
            alert('กรุณากรอกชื่อผู้ตรวจเช็ค');
            return;
        }

        const payload = {
            device_id: deviceId,
            checked_by: checkedBy,
            items: Object.entries(responses).map(([id, data]: any) => ({
                id,
                status: data.status,
                note: data.note
            }))
        };

        try {
            await axios.post('/api/monitoring/checklist/submit', payload);
            alert('บันทึกข้อมูลสำเร็จ!');
            window.location.reload();
        } catch (e) {
            alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
        }
    };

    const breadcrumbs = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Device Logic', href: '/monitoring/devices' },
        { title: 'Maintenance Checklist', href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="p-6 bg-gray-50 min-h-screen">
                <div className="max-w-4xl mx-auto space-y-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="bg-blue-600 p-3 rounded-xl text-white shadow-lg">
                            <ClipboardCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Preventive Maintenance Checklist</h2>
                            <p className="text-gray-500">Device: <span className="font-bold text-blue-600">{deviceName}</span></p>
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        {items?.map((item: any) => (
                            <div key={item.id} className="bg-white p-5 border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                                <p className="font-bold text-gray-800 mb-4 text-lg">{item.title}</p>
                                
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {STATUS_OPTIONS.map(opt => {
                                        const isSelected = responses[item.id]?.status === opt.value;
                                        return (
                                            <label key={opt.value} className={`flex items-center justify-center gap-2 p-3 rounded-xl cursor-pointer border transition-all ${isSelected ? `ring-2 ${opt.activeRing} shadow-sm bg-white` : 'border-gray-100 bg-gray-50 hover:bg-gray-100'}`}>
                                                <input 
                                                    type="radio" 
                                                    name={`status-${item.id}`} 
                                                    value={opt.value}
                                                    onChange={(e) => setResponses({
                                                        ...responses,
                                                        [item.id]: { ...responses[item.id], status: e.target.value }
                                                    })}
                                                    className="sr-only"
                                                />
                                                <div className={`p-1.5 rounded-full ${opt.color}`}>
                                                    {opt.icon}
                                                </div>
                                                <span className={`text-sm font-bold ${isSelected ? 'text-gray-900' : 'text-gray-600'}`}>
                                                    {opt.label}
                                                </span>
                                            </label>
                                        );
                                    })}
                                </div>
                                
                                {responses[item.id]?.status && responses[item.id].status !== 'normal' && (
                                    <div className="mt-3 animate-in fade-in slide-in-from-top-2">
                                        <input 
                                            type="text" 
                                            placeholder="ระบุหมายเหตุ/รายละเอียด (หากมี)" 
                                            onChange={(e) => setResponses({
                                                ...responses,
                                                [item.id]: { ...responses[item.id], note: e.target.value }
                                            })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                        
                        {(!items || items.length === 0) && (
                            <div className="bg-white p-8 border border-gray-100 rounded-2xl shadow-sm text-center text-gray-400">
                                ไม่มีหัวข้อตรวจเช็คสำหรับอุปกรณ์นี้
                            </div>
                        )}
                    </div>

                    <div className="bg-white p-6 border border-gray-100 rounded-2xl shadow-sm space-y-4">
                        <label className="block text-sm font-bold text-gray-700">ผู้ตรวจเช็ค (Inspector Name)</label>
                        <input 
                            type="text" 
                            placeholder="กรอกชื่อผู้ตรวจเช็ค..." 
                            value={checkedBy}
                            onChange={(e) => setCheckedBy(e.target.value)}
                            className="w-full p-3 font-semibold text-gray-800 border-2 border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                        />

                        <button onClick={handleSubmit} className="w-full mt-4 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 text-white font-bold rounded-xl hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                            <CheckCircle2 className="w-5 h-5" />
                            Submit Check Record
                        </button>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
