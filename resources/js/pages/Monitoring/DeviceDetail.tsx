import { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import AppLayout from '@/layouts/app-layout';
import { Cpu, Server, Clock, Wifi, WifiOff } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DeviceDetail({ deviceId }: { deviceId: number }) {
    const [device, setDevice] = useState<any>(null);

    useEffect(() => {
        axios.get(`/api/monitoring/devices/${deviceId}`).then(res => setDevice(res.data));
    }, [deviceId]);

    if (!device) return <AppLayout breadcrumbs={[]}><div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div></AppLayout>;

    const breadcrumbs = [
        { title: 'Monitoring Overview', href: '/monitoring/dashboard' },
        { title: 'Device List', href: '/monitoring/devices' },
        { title: device.name, href: '#' },
    ];

    const chartData = [...(device.metrics || [])].reverse().map(m => ({
        time: new Date(m.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        cpu: parseFloat(m.cpu_usage),
        ram: parseFloat(m.ram_usage),
        disk: parseFloat(m.disk_usage)
    }));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="p-6 bg-gray-50 min-h-screen">
                <div className="max-w-7xl mx-auto space-y-6">
                    
                    {/* Header Card */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="bg-gradient-to-br from-indigo-500 to-blue-600 p-3.5 rounded-2xl text-white shadow-lg">
                                <Server className="w-8 h-8" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-extrabold text-gray-800">{device.name}</h1>
                                <p className="text-gray-500 text-sm flex items-center gap-2 mt-1">
                                    <span className="font-mono bg-gray-100 px-2 rounded-md">{device.mac_address}</span>
                                    <span>•</span>
                                    <span>{device.ip_address}</span>
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 text-sm rounded-full font-bold shadow-sm ${
                                device.status === 'online' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-rose-100 text-rose-700 border border-rose-200'
                            }`}>
                                {device.status === 'online' ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                                {device.status.toUpperCase()}
                            </span>
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-3 py-1 rounded-full border border-gray-200">
                                <Clock className="w-3.5 h-3.5" />
                                {device.last_seen ? new Date(device.last_seen).toLocaleString() : 'Never seen'}
                            </div>
                        </div>
                    </motion.div>

                    {/* Metrics Graph */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <Cpu className="w-5 h-5 text-gray-500" />
                                <h2 className="text-lg font-bold text-gray-800">Resource Utilization Over Time</h2>
                            </div>
                        </div>
                        
                        <div className="h-[400px] w-full">
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                        <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} />
                                        <Tooltip 
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                        />
                                        <Line type="monotone" dataKey="cpu" stroke="#EF4444" name="CPU (%)" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                                        <Line type="monotone" dataKey="ram" stroke="#3B82F6" name="RAM (%)" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                                        <Line type="monotone" dataKey="disk" stroke="#10B981" name="Disk (%)" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-400">
                                    No metrics reported yet.
                                </div>
                            )}
                        </div>
                    </motion.div>

                </div>
            </div>
        </AppLayout>
    );
}
