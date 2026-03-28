import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRealtimeDevices } from '@/hooks/useRealtimeDevices';
import { router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Server, Wifi, WifiOff, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DeviceList() {
    const [devices, setDevices] = useState<any[]>([]);

    useEffect(() => {
        axios.get('/api/monitoring/devices').then(res => setDevices(res.data));
    }, []);

    useRealtimeDevices((updatedDevice) => {
        setDevices(prev => prev.map(d => 
            d.id === updatedDevice.id 
                ? { ...d, status: updatedDevice.status, last_seen: updatedDevice.last_seen } 
                : d
        ));
    });

    const breadcrumbs = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Device List', href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="p-6 bg-gray-50 min-h-screen">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-600 p-3 rounded-xl text-white shadow-lg">
                                <Server className="w-5 h-5" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Registered Devices</h2>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-gray-50/50 text-gray-500 font-semibold border-b border-gray-100">
                                        <th className="p-4 pl-6 text-sm rounded-tl-2xl">Device Name</th>
                                        <th className="p-4 text-sm">IP Address</th>
                                        <th className="p-4 text-sm">Mac Address</th>
                                        <th className="p-4 text-sm">Status</th>
                                        <th className="p-4 text-sm">Last Seen</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {devices.map((device, idx) => (
                                        <motion.tr 
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            key={device.id} 
                                            onClick={() => router.visit(`/monitoring/devices/${device.id}`)}
                                            className="hover:bg-blue-50/30 cursor-pointer transition-colors group"
                                        >
                                            <td className="p-4 pl-6 font-bold text-gray-800 border-none group-hover:text-blue-600 transition-colors">
                                                {device.name}
                                            </td>
                                            <td className="p-4 text-gray-500 text-sm font-mono border-none">{device.ip_address || '-'}</td>
                                            <td className="p-4 text-gray-400 text-xs font-mono border-none">{device.mac_address}</td>
                                            <td className="p-4 border-none">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs rounded-full font-bold shadow-sm ${
                                                    device.status === 'online' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                                }`}>
                                                    {device.status === 'online' ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                                                    {device.status.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="p-4 text-sm text-gray-500 border-none">
                                                <div className="flex items-center gap-1.5">
                                                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                                                    {device.last_seen ? new Date(device.last_seen).toLocaleString() : 'Never'}
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                    {devices.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="p-8 text-center text-gray-400">
                                                No devices found in the network.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
