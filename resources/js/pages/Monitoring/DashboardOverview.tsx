import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRealtimeDevices } from '@/hooks/useRealtimeDevices';
import AppLayout from '@/layouts/app-layout';
import { Activity, CheckCircle2, XCircle, Monitor } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DashboardOverview() {
    const [stats, setStats] = useState({ total: 0, online: 0, offline: 0 });

    const fetchStats = async () => {
        try {
            const res = await axios.get('/api/monitoring/dashboard/overview');
            setStats(res.data);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    useRealtimeDevices(() => {
        fetchStats();
    });

    const breadcrumbs = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Monitoring Overview', href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="p-6 bg-gray-50 min-h-screen">
                <div className="max-w-7xl mx-auto space-y-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="bg-blue-600 p-3 rounded-xl text-white shadow-lg">
                            <Activity className="w-6 h-6" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800 tracking-tight">System Status Overview</h1>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-blue-500 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-gray-500 font-semibold mb-1">Total Devices</h3>
                                    <p className="text-5xl font-extrabold text-gray-800">{stats.total}</p>
                                </div>
                                <Monitor className="w-12 h-12 text-blue-100" />
                            </div>
                        </motion.div>
                        
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-emerald-500 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-gray-500 font-semibold mb-1">Online Devices</h3>
                                    <p className="text-5xl font-extrabold text-emerald-600">{stats.online}</p>
                                </div>
                                <CheckCircle2 className="w-12 h-12 text-emerald-100" />
                            </div>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-rose-500 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-gray-500 font-semibold mb-1">Offline & Issues</h3>
                                    <p className="text-5xl font-extrabold text-rose-600">{stats.offline}</p>
                                </div>
                                <XCircle className="w-12 h-12 text-rose-100" />
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
