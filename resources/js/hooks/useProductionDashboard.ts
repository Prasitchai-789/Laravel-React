import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Pusher from 'pusher-js';
import Swal from 'sweetalert2';

export interface ProductionData {
    carry: number;
    incoming: number;
    total_palm_kg: number;
    remaining_stock_kg: number;
    progress_palm: number;
    progress_stock: number;
    progress_basket: number;
    basket: number;
    start_time: string;
    working_hours: string;
    production_kg: number;
    avg_pickup: number;
    stock: number;
    yield: number;
    plant_oee?: number;
    trend: {
        dates: string[];
        palm_input: number[];
        production: number[];
        yield: number[];
    };
}

export interface CycleTimeKPIs {
    avg_cycle_time: number;
    efficiency: number;
    downtime_count: number;
    slow_count: number;
    latest_status: string;
    latest_diff: number;
}

export interface CycleTimeData {
    items: any[];
    kpis: CycleTimeKPIs;
}

interface UseProductionDashboardReturn {
    data: ProductionData | null;
    cycleTimeData: CycleTimeData | null;
    loading: boolean;
    lastUpdate: Date;
    refresh: () => void;
}

export function useProductionDashboard(): UseProductionDashboardReturn {
    const [data, setData] = useState<ProductionData | null>(null);
    const [cycleTimeData, setCycleTimeData] = useState<CycleTimeData | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState(new Date());

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [prodRes, cycleRes] = await Promise.all([
                axios.get('/api/dashboard/production'),
                axios.get('/api/dashboard/cycle-time'),
            ]);

            setData(prodRes.data);
            setCycleTimeData(cycleRes.data.data);
            setLastUpdate(new Date());

            // Realtime alerts based on cycle time status
            const latest = cycleRes.data.data.kpis;
            if (latest.latest_status === 'DOWNTIME') {
                Swal.fire({
                    icon: 'error',
                    title: 'ตรวจพบเครื่องหยุดทำงาน!',
                    text: `การผลิตหยุดนิ่งเป็นเวลา ${latest.latest_diff} วินาที`,
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 5000,
                });
            } else if (latest.latest_status === 'SLOW') {
                Swal.fire({
                    icon: 'warning',
                    title: 'ระบบทำงานช้าลง',
                    text: `รอบปัจจุบันใช้เวลา: ${latest.latest_diff} วินาที`,
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000,
                });
            }
        } catch (e) {
            console.error('Error fetching production data', e);
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: 'ไม่สามารถโหลดข้อมูลได้',
                toast: true,
                timer: 3000,
                showConfirmButton: false,
            });
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial fetch
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Pusher realtime listener
    useEffect(() => {
        const pusher = new Pusher('5e2e0382066d67e433a6', {
            cluster: 'ap1',
        });

        const channel = pusher.subscribe('notificationPickup');

        channel.bind('form-submit', (eventData: any) => {
            fetchData();
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: eventData.title || 'อัปเดตข้อมูลการผลิตแล้ว',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
                customClass: {
                    title: 'font-anuphan text-sm',
                },
            });
        });

        return () => {
            channel.unbind_all();
            pusher.unsubscribe('notificationPickup');
        };
    }, [fetchData]);

    return {
        data,
        cycleTimeData,
        loading,
        lastUpdate,
        refresh: fetchData,
    };
}
