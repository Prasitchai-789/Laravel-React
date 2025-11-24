import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { motion } from 'framer-motion';
import { Calendar, FlaskConical, Info, RefreshCw, Thermometer, TrendingUp } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

// =========================
// Safe Number Helpers
// =========================
const safeNum = (value: any) => {
    const n = parseFloat(value);
    return isNaN(n) ? 0 : n;
};

const safeFixed = (value: any, digits: number = 3) => {
    const n = safeNum(value);
    return n.toFixed(digits);
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Dashbaord Stock CPO', href: '#' },
];

export default function StockCPO() {
    const [data, setData] = useState<any | null>(null);
    const [historicalData, setHistoricalData] = useState<any[]>([]);
    const [selectedDate, setSelectedDate] = useState<string>(''); // จะให้ fetchLatestData เป็นคนกำหนดให้
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [productionData, setProductionData] = useState<any | null>(null);
    const [usingSampleData, setUsingSampleData] = useState(false);
    const [salesData, setSalesData] = useState<any | null>(null);
    const [previousDayData, setPreviousDayData] = useState<any | null>(null);

    const normalizeDate = (input: any): string | null => {
        if (!input) return null;

        // ถ้าเป็น Date object
        if (input instanceof Date) {
            if (isNaN(input.getTime())) return null;
            // ใช้ local date -> en-CA = YYYY-MM-DD
            return input.toLocaleDateString('en-CA');
        }

        if (typeof input === 'string') {
            const raw = input.trim();
            if (!raw) return null;

            // กรณีเป็น ISO หรือขึ้นต้นด้วย YYYY-MM-DD
            const isoMatch = raw.match(/^(\d{4}-\d{2}-\d{2})/);
            if (isoMatch) {
                return isoMatch[1]; // ตัดแค่ส่วน YYYY-MM-DD
            }

            // กรณี Non-ISO จาก WinSpeed เช่น "Nov 15 2025 12:00:00:AM"
            // แก้ :AM / :PM ให้เป็น format ที่ JS อ่านง่ายขึ้น
            const cleaned = raw.replace(':AM', ' AM').replace(':PM', ' PM');
            const d = new Date(cleaned);
            if (!isNaN(d.getTime())) {
                return d.toLocaleDateString('en-CA'); // YYYY-MM-DD ตาม local
            }
        }

        return null;
    };

    /**
     * รับค่าทุกแบบ แล้วคืน Date object (local) หรือ null
     * ใช้กับการแสดงผลแบบ locale (th-TH)
     */
    const safeDate = (value: any): Date | null => {
        const norm = normalizeDate(value);
        if (!norm) return null;
        const [y, m, d] = norm.split('-').map((v) => parseInt(v, 10));
        if (!y || !m || !d) return null;
        // new Date(year, monthIndex, day) = local time, ไม่มี timezone shift
        const dt = new Date(y, m - 1, d);
        return isNaN(dt.getTime()) ? null : dt;
    };

    const safeParse = (value: any) => {
        if (value === null || value === undefined || value === '' || value === ' ') return null;
        const n = parseFloat(value);
        return isNaN(n) ? null : n;
    };

    const safeTon = (value: any) => {
        const n = safeParse(value);
        return n === null ? 0 : parseFloat(n.toFixed(3));
    };

    const formatDateForAPI = (dateString: string) => {
        // ตอนนี้เราใช้ 'YYYY-MM-DD' อยู่แล้วจาก normalizeDate
        return dateString;
    };

    // ============================
    // Fetch Production Data
    // ============================
    const fetchProductionData = async (date: string) => {
        try {
            const formattedDate = formatDateForAPI(date);

            const response = await fetch(`/report/productions/api`);
            const result = await response.json();

            if (result.success && Array.isArray(result.productions)) {
                const target = result.productions.find((p: any) => {
                    const prodDate = safeDate(p.Date);
                    if (!prodDate) return false;
                    const prodNorm = normalizeDate(prodDate);
                    return prodNorm === formattedDate;
                });

                if (target) {
                    setProductionData(target);
                    return safeTon(target.FFBGoodQty ?? 0);
                }
            }
            return 0;
        } catch (err) {
            console.error('Error fetching production data:', err);
            return 0;
        }
    };

    // ============================
    // Fetch Sales Data
    // ============================
    const fetchSalesData = async (date: string) => {
        try {
            const formattedDate = formatDateForAPI(date);
            const response = await fetch(`/report/sales/api?date=${formattedDate}&goodid=2147`);
            const result = await response.json();

            if (result.success && Array.isArray(result.sales) && result.sales.length > 0) {
                setSalesData(result.sales[0]);
                const net = safeParse(result.sales[0].total_netwei ?? 0) ?? 0;
                return safeTon(net / 1000);
            }

            return 0;
        } catch (err) {
            console.error('Error fetching sales data:', err);
            return 0;
        }
    };

    // ============================
    // Fetch Previous Day Stock
    // ============================
    const formatDateLocal = (date: Date) => {
        return date.toLocaleDateString('en-CA'); // YYYY-MM-DD
    };

    const fetchPreviousDayData = async (currentDate: string) => {
        try {
            const d = safeDate(currentDate);
            if (!d) return 0;

            const prev = new Date(d);
            prev.setDate(prev.getDate() - 1);

            const previousDateStr = formatDateLocal(prev);
            const response = await fetch(`/report/stock-cpo/date/${previousDateStr}`);
            const result = await response.json();

            if (result.success && Array.isArray(result.stockCPO) && result.stockCPO.length > 0) {
                setPreviousDayData(result.stockCPO[0]);
                return safeTon(result.stockCPO[0].total_cpo ?? 0);
            }

            return 0;
        } catch (err) {
            console.error('Error fetching previous day data:', err);
            return 0;
        }
    };

    // ============================
    // Fetch Historical Chart Data
    // ============================
    const fetchHistoricalData = async () => {
        try {
            const response = await fetch('/report/stock-cpo/historical?days=7');
            const result = await response.json();

            if (result.success) {
                setHistoricalData(result.data || []);
                if (String(result.message).includes('sample data')) {
                    setUsingSampleData(true);
                }
            } else {
                setUsingSampleData(true);
            }
        } catch (err) {
            console.error('Error fetch historical:', err);
            setUsingSampleData(true);
        }
    };

    // ============================
    // Summary & Yield
    // ============================
    const computeYield = (summary: any) => {
        const currentCPO = parseFloat(summary.total_cpo ?? 0);
        const previousDayCPO = parseFloat(summary.previous_total_cpo ?? 0);
        const salesTons = parseFloat(summary.sales_tons ?? 0);
        const ffbGoodQty = parseFloat(summary.ffb_good_qty ?? 0);
        const skim = parseFloat(summary.skim ?? 0);

        if (ffbGoodQty <= 0) return 0;

        const numerator = currentCPO - (previousDayCPO - salesTons);
        const yieldPercent = ((numerator - skim) / ffbGoodQty) * 100;

        return parseFloat(yieldPercent.toFixed(3));
    };

    const fetchSummary = async (date: string) => {
        try {
            const formattedDate = formatDateForAPI(date);

            const res = await fetch(`/report/stock-cpo/summary?date=${formattedDate}`);
            const result = await res.json();

            if (!result.success) {
                console.warn('⚠ Summary API returned no success:', result.message);
                return null;
            }

            // คำนวณ Yield
            const yieldPercent = computeYield(result);

            // ⭐ ไม่แตะ field `date` เพื่อไม่ให้ทับค่าแสดงผลแบบ th-TH
            const summaryData = {
                summaryDate: result.date, // เก็บแยกหากจะใช้ตรวจสอบ
                totalCPO: result.total_cpo ?? 0,
                previousDayCPO: result.previous_total_cpo ?? 0,
                salesInTons: result.sales_tons ?? 0,
                ffbGoodQty: result.ffb_good_qty ?? 0,
                yield: yieldPercent,
            };

            setData((prev: any) => (prev ? { ...prev, ...summaryData } : prev));

            return summaryData;
        } catch (err) {
            console.error('❌ Error in fetchSummary:', err);
            return null;
        }
    };

    // ============================
    // Transform Data (คำนวณและ map field UI)
    // ============================
    const transformData = (apiData: any, ffbGoodQty: number = 0, salesInTons: number = 0, previousDayCPO: number = 0) => {
        // apiData.date อาจเป็น Non-ISO → normalize ก่อน
        const normalized = normalizeDate(apiData.date);
        const validDate = normalized ? safeDate(normalized) : safeDate(apiData.date);

        const t1 = safeTon(apiData.tank1_cpo_volume);
        const t2 = safeTon(apiData.tank2_cpo_volume);
        const t3 = safeTon(apiData.tank3_cpo_volume);
        const t4 = safeTon(apiData.tank4_cpo_volume);

        const totalTankVolume = safeTon(t1 + t2 + t3 + t4);
        const currentCPO = safeTon(apiData.total_cpo);

        // ใช้ค่า yield จาก state ถ้ามี (จะถูกอัพเดตจาก fetchSummary ตามหลัง)
        const yieldValue = data?.yield !== undefined ? data.yield : 0;

        const tankData = [
            {
                id: 1,
                temp: apiData.tank1_temperature,
                tons: t1,
                ffa: safeParse(apiData.tank1_ffa),
                moisture: safeParse(apiData.tank1_moisture),
                dobi: safeParse(apiData.tank1_dobi),
            },
            {
                id: 2,
                temp: apiData.tank2_temperature,
                tons: t2,
                ffa_top: safeParse(apiData.tank2_top_ffa),
                ffa_bottom: safeParse(apiData.tank2_bottom_ffa),
                moisture_top: safeParse(apiData.tank2_top_moisture),
                moisture_bottom: safeParse(apiData.tank2_bottom_moisture),
                dobi_top: safeParse(apiData.tank2_top_dobi),
                dobi_bottom: safeParse(apiData.tank2_bottom_dobi),
            },
            {
                id: 3,
                temp: apiData.tank3_temperature,
                tons: t3,
                ffa_top: safeParse(apiData.tank3_top_ffa),
                ffa_bottom: safeParse(apiData.tank3_bottom_ffa),
                moisture_top: safeParse(apiData.tank3_top_moisture),
                moisture_bottom: safeParse(apiData.tank3_bottom_moisture),
                dobi_top: safeParse(apiData.tank3_top_dobi),
                dobi_bottom: safeParse(apiData.tank3_bottom_dobi),
            },
            {
                id: 4,
                temp: apiData.tank4_temperature,
                tons: t4,
                ffa_top: safeParse(apiData.tank4_top_ffa),
                ffa_bottom: safeParse(apiData.tank4_bottom_ffa),
                moisture_top: safeParse(apiData.tank4_top_moisture),
                moisture_bottom: safeParse(apiData.tank4_bottom_moisture),
                dobi_top: safeParse(apiData.tank4_top_dobi),
                dobi_bottom: safeParse(apiData.tank4_bottom_dobi),
            },
        ];

        setData({
            date: validDate
                ? validDate.toLocaleDateString('th-TH', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                  })
                : '-',
            originalDate: apiData.date,
            normalizedDate: normalized || null, // เก็บไว้เผื่อ debug
            totalCPO: currentCPO,
            yield: yieldValue,
            totalTankVolume,
            ffbGoodQty,
            salesInTons,
            previousDayCPO,
            currentCPO,
            tanks: tankData,
            skim: safeTon(apiData.skim),
            mix: safeTon(apiData.mix),
            loopBack: safeTon(apiData.loop_back),
            undilute_1: safeTon(apiData.undilute_1),
            undilute_2: safeTon(apiData.undilute_2),
            setting: safeTon(apiData.setting),
            cleanOil: safeTon(apiData.clean_oil),
            ffa_cpo: safeTon(apiData.ffa_cpo),
            dobi_cpo: safeTon(apiData.dobi_cpo),
        });
    };

    // ============================
    // Fetch Main Data by Date
    // ============================
    const fetchDataByDate = async (rawDate?: string) => {
        try {
            setIsRefreshing(true);
            setError(null);
            setUsingSampleData(false);

            let date = rawDate ?? selectedDate;

            if (!date || date.trim() === '') {
                console.warn('⚠ fetchDataByDate: date is EMPTY → เรียก fetchLatestData()');
                await fetchLatestData();
                return;
            }

            const normalized = normalizeDate(date);
            if (!normalized) {
                console.warn('🚫 fetchDataByDate: IGNORE call because date invalid:', date);
                return;
            }

            const formattedDate = formatDateForAPI(normalized);
            const response = await fetch(`/report/stock-cpo/date/${formattedDate}`);
            const result = await response.json();

            if (result.success && Array.isArray(result.stockCPO) && result.stockCPO.length > 0) {
                const apiData = result.stockCPO[0];

                if (String(result.message).includes('sample data')) {
                    setUsingSampleData(true);
                }

                const productionDate = normalizeDate(apiData.date) ?? formattedDate;
                console.log('📌 fetchDataByDate() ใช้ productionDate =', productionDate);

                const ffbGood = await fetchProductionData(productionDate);
                const salesTons = await fetchSalesData(productionDate);
                const prevCPO = await fetchPreviousDayData(productionDate);

                // แปลงข้อมูลหลัก
                transformData(apiData, ffbGood, salesTons, prevCPO);

                // สรุปค่า + yield
                await fetchSummary(productionDate);
            } else {
                await fetchLatestData();
            }
        } catch (err: any) {
            console.error(err);
            setError('Error fetching data: ' + err.message);
            await fetchLatestData();
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    // ============================
    // Fetch Latest
    // ============================
    const fetchLatestData = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch('/report/stock-cpo/api');
            const result = await response.json();

            if (!result.success || !Array.isArray(result.stockCPO) || result.stockCPO.length === 0) {
                setError('ไม่พบข้อมูลล่าสุด');
                return;
            }

            const list = result.stockCPO;

            // เลือกวันที่ล่าสุดจากฐานข้อมูล (รองรับ Non-ISO)
            const latest = list.reduce((acc: any | null, cur: any) => {
                if (!acc) return cur;
                const dCur = safeDate(cur.date);
                const dAcc = safeDate(acc.date);
                if (!dAcc) return cur;
                if (!dCur) return acc;
                return dCur > dAcc ? cur : acc;
            }, null as any);

            if (!latest) {
                setError('ไม่สามารถเลือกวันที่ล่าสุดได้');
                return;
            }

            const latestDateNorm = normalizeDate(latest.date);
            if (!latestDateNorm) {
                console.error('❌ latest.date แปลง normalizeDate ไม่ได้:', latest.date);
                setError('รูปแบบวันที่ล่าสุดไม่ถูกต้อง');
                return;
            }

            // ตั้ง selectedDate ให้เป็น YYYY-MM-DD
            setSelectedDate(latestDateNorm);

            // โหลดข้อมูลประกอบ
            const ffb = await fetchProductionData(latestDateNorm);
            const sales = await fetchSalesData(latestDateNorm);
            const prev = await fetchPreviousDayData(latestDateNorm);

            // แปลงข้อมูลหลัก
            transformData(latest, ffb, sales, prev);

            // Summary + Yield
            await fetchSummary(latestDateNorm);
        } catch (err: any) {
            console.error(err);
            setError('Error fetching latest data: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    // ============================
    // Handlers
    // ============================
    const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newDate = event.target.value; // YYYY-MM-DD จาก date input
        setSelectedDate(newDate);
        console.log('📅 DatePicker changed →', newDate);
        void fetchDataByDate(newDate);
    };

    const handleRefresh = () => {
        void fetchDataByDate(selectedDate);
        void fetchHistoricalData();
    };

    // ============================
    // Init Effect
    // ============================
    useEffect(() => {
        const init = async () => {
            await fetchLatestData(); // ให้ฐานข้อมูลเป็นตัวกำหนดวันที่ล่าสุด
            await fetchHistoricalData(); // กราฟย้อนหลัง
        };
        void init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ============================
    // Chart processing
    // ============================
    const chartData = useMemo(() => {
        if (!historicalData || historicalData.length === 0) return [];

        const sorted = [...historicalData].sort((a, b) => (safeDate(a.date)?.getTime() || 0) - (safeDate(b.date)?.getTime() || 0));

        const maxValue = Math.max(...sorted.map((d) => d.total_cpo || 0));

        return sorted.map((item: any, index: number) => {
            const value = item.total_cpo || 0;
            const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;

            const d = safeDate(item.date);

            return {
                date: d ? d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }) : '-',
                fullDate: d
                    ? d.toLocaleDateString('th-TH', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                      })
                    : '-',
                value,
                percentage,
                isToday: index === sorted.length - 1,
            };
        });
    }, [historicalData]);

    // ============================
    // Render
    // ============================
    if (loading) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <div className="flex h-64 items-center justify-center">
                    <div className="text-lg">กำลังโหลดข้อมูล...</div>
                </div>
            </AppLayout>
        );
    }

    if (error) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <div className="flex h-64 flex-col items-center justify-center space-y-4">
                    <div className="text-lg text-red-500">{error}</div>
                    <button onClick={handleRefresh} className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
                        ลองใหม่
                    </button>
                </div>
            </AppLayout>
        );
    }

    if (!data) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <div className="flex h-64 items-center justify-center">
                    <div className="text-lg">ไม่พบข้อมูล</div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 font-anuphan md:p-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mx-auto max-w-6xl space-y-2"
                >
                    {/* Header */}
                    <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
                        <div>
                            <h1 className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-3xl font-bold text-gray-800 text-transparent">
                                Stock CPO
                            </h1>
                            <p className="mt-2 flex items-center gap-2 text-gray-600">
                                <span>ข้อมูลอัพเดตล่าสุด</span>
                                <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                                    {data.date}
                                </span>
                                {usingSampleData && (
                                    <span className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-800">
                                        ข้อมูลตัวอย่าง
                                    </span>
                                )}
                            </p>
                            {data.ffbGoodQty > 0 && (
                                <p className="mt-1 text-sm text-green-600">ปาล์มเข้าผลิต: {safeFixed(data.ffbGoodQty, 2)} Tons</p>
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Date Picker */}
                            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 shadow-sm">
                                <Calendar className="h-4 w-4 text-gray-500" />
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={handleDateChange}
                                    className="bg-transparent text-sm focus:outline-none"
                                    max={new Date().toISOString().split('T')[0]}
                                />
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleRefresh}
                                disabled={isRefreshing}
                                className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm shadow-sm transition-shadow hover:shadow-md disabled:opacity-50"
                            >
                                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                                <span>{isRefreshing ? 'กำลังอัพเดต...' : 'รีเฟรชข้อมูล'}</span>
                            </motion.button>
                        </div>
                    </div>

                    {/* Total + Yield + Chart */}
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                        {/* Total CPO Card */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 p-6 text-white shadow-lg"
                        >
                            <div className="absolute top-0 right-0 h-24 w-24 translate-x-12 -translate-y-12 rounded-full bg-white/10"></div>
                            <div className="absolute bottom-0 left-0 h-16 w-16 -translate-x-8 translate-y-8 rounded-full bg-white/10"></div>

                            <div className="relative z-10">
                                <h2 className="text-lg font-semibold">Total CPO</h2>
                                <p className="mt-2 text-5xl font-bold">{safeFixed(data.totalCPO, 3)}</p>

                                <p className="mt-1 text-sm opacity-90">Tons</p>
                                <div className="mt-2 text-xs opacity-80">
                                   %FFA: {safeFixed(data.ffa_cpo, 2)} | DOBI: {safeFixed(data.dobi_cpo, 2)}
                                </div>
                            </div>
                        </motion.div>

                        {/* Yield Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-green-500 p-6 text-white shadow-lg"
                        >
                            <div className="absolute top-0 right-0 h-20 w-20 translate-x-10 -translate-y-10 rounded-full bg-white/10"></div>

                            <div className="relative z-10 flex h-full flex-col items-center justify-center">
                                <h2 className="text-lg font-semibold">% Yield</h2>
                                <div className="mt-3 flex items-center justify-center space-x-3">
                                    <TrendingUp className="h-8 w-8 text-white" />
                                    <p className="text-4xl font-bold">{data.yield !== undefined ? safeFixed(data.yield, 2) : '0.00'}</p>
                                </div>
                                <div className="mt-4 h-2 w-full rounded-full bg-white/20">
                                    <motion.div
                                        className="h-2 rounded-full bg-white"
                                        initial={{ width: 0 }}
                                        animate={{
                                            width: `${Math.min(data.yield !== undefined ? data.yield : 0, 18)}%`,
                                        }}
                                        transition={{ delay: 0.5, duration: 1 }}
                                    ></motion.div>
                                </div>
                                {/* <div className="mt-1 text-center text-xs opacity-70">
                                    ({data.currentCPO.toFixed(3)} - ({data.previousDayCPO.toFixed(3)} -{' '}
                                    {data.salesInTons.toFixed(3)})) ÷ {data.ffbGoodQty.toFixed(3)} × 100
                                </div> */}
                            </div>
                        </motion.div>

                        {/* Volume Chart Card */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            className="rounded-2xl border border-gray-100 bg-white p-2 shadow-lg"
                        >
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-gray-700">ปริมาณน้ำมันปาล์มดิบ 7 วันย้อนหลัง</h2>

                                {usingSampleData && (
                                    <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
                                        ข้อมูลตัวอย่าง
                                    </span>
                                )}
                            </div>

                            {historicalData.length > 0 ? (
                                <div className="space-y-2">
                                    <div className="relative">
                                        <div className="flex h-32 items-end justify-between">
                                            {chartData.map((item: any, i: number) => {
                                                const barHeight = Math.max(item.percentage * 0.8, 12);

                                                const isToday = i === chartData.length - 1;
                                                const maxVal = Math.max(...chartData.map((d: any) => d.value));
                                                const minVal = Math.min(...chartData.map((d: any) => d.value));

                                                const isHighest = item.value === maxVal;
                                                const isLowest = item.value === minVal;

                                                return (
                                                    <div key={i} className="flex flex-1 flex-col items-center">
                                                        <div className="group relative flex h-32 w-full items-end">
                                                            <motion.div
                                                                initial={{ height: 0 }}
                                                                animate={{ height: `${barHeight}%` }}
                                                                transition={{
                                                                    delay: 0.3 + i * 0.1,
                                                                    duration: 0.8,
                                                                    type: 'spring',
                                                                    stiffness: 60,
                                                                }}
                                                                className={`relative w-full rounded-t-lg transition-all duration-300 ${
                                                                    isToday
                                                                        ? 'bg-gradient-to-t from-blue-600 to-blue-400 shadow-lg'
                                                                        : isHighest
                                                                          ? 'bg-gradient-to-t from-green-500 to-green-300 shadow-lg'
                                                                          : isLowest
                                                                            ? 'bg-gradient-to-t from-red-500 to-red-300 shadow-md'
                                                                            : 'bg-gradient-to-t from-blue-300 to-blue-200'
                                                                } group-hover:shadow-xl group-hover:brightness-110`}
                                                            >
                                                                <div
                                                                    className={`absolute -top-6 left-1/2 -translate-x-1/2 transform text-xs font-bold ${
                                                                        isToday || isHighest || isLowest
                                                                            ? 'text-gray-800 opacity-100'
                                                                            : 'text-gray-600 opacity-0 group-hover:opacity-100'
                                                                    } whitespace-nowrap transition-opacity duration-200`}
                                                                >
                                                                    {safeFixed(item.value, 1)}T
                                                                </div>
                                                            </motion.div>
                                                        </div>

                                                        <p className="mt-1 text-xs text-gray-600">{item.date}</p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex h-32 flex-col items-center justify-center space-y-3 text-gray-500">
                                    <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
                                    <div className="text-sm">กำลังโหลดข้อมูลกราฟ...</div>
                                    <div className="text-xs text-gray-400">รอสักครู่</div>
                                </div>
                            )}
                        </motion.div>
                    </div>

                    {/* Tanks Section */}
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                        {data.tanks.map((tank: any, index: number) => (
                            <motion.div
                                key={tank.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.1 * index }}
                                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                                className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm transition-all duration-300"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <div className="rounded-lg bg-blue-100 p-2">
                                            <FlaskConical className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <span className="font-semibold text-gray-800">TANK {tank.id}</span>
                                    </div>
                                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                                        <Thermometer className="h-4 w-4 text-red-500" />
                                        <span>{tank.temp ? `${tank.temp}°C` : '-'}</span>
                                    </div>
                                </div>

                                <p className="mt-3 text-3xl font-bold text-blue-700">{tank.tons > 0 ? safeFixed(tank.tons, 3) : '0.000'}</p>
                                <p className="mb-2 text-xs text-gray-500">Tons</p>

                                {/* Quality Data - Tank 1 */}
                                {tank.id === 1 && (
                                    <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs font-medium">
                                        <div className="rounded-lg bg-red-50 p-2">
                                            <p className="text-gray-500">%FFA</p>
                                            <p className="font-bold text-red-600">{tank.ffa ?? '-'}</p>
                                        </div>
                                        <div className="rounded-lg bg-blue-50 p-2">
                                            <p className="text-gray-500">%Moist</p>
                                            <p className="font-bold text-blue-600">{tank.moisture ?? '-'}</p>
                                        </div>
                                        <div className="rounded-lg bg-green-50 p-2">
                                            <p className="text-gray-500">DOBI</p>
                                            <p className="font-bold text-green-600">{tank.dobi ?? '-'}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Quality Data - Tanks 2,3,4 */}
                                {tank.id !== 1 && (
                                    <div className="rounded-lg bg-gray-50 p-3 text-xs font-medium">
                                        <div className="mb-1 grid grid-cols-4 gap-2 text-gray-600">
                                            <div></div>
                                            <div className="text-center">%FFA</div>
                                            <div className="text-center">%Moist</div>
                                            <div className="text-center">DOBI</div>
                                        </div>

                                        {/* Top */}
                                        <div className="mb-1 grid grid-cols-4 gap-2">
                                            <div className="flex items-center text-gray-500">
                                                <div className="mr-2 h-2 w-2 rounded-full bg-blue-500"></div>
                                                บน
                                            </div>
                                            <div className="rounded bg-red-50 p-1 text-center">{tank.ffa_top ?? '-'}</div>
                                            <div className="rounded bg-blue-50 p-1 text-center">{tank.moisture_top ?? '-'}</div>
                                            <div className="rounded bg-green-50 p-1 text-center">{tank.dobi_top ?? '-'}</div>
                                        </div>

                                        {/* Bottom */}
                                        <div className="grid grid-cols-4 gap-2">
                                            <div className="flex items-center text-gray-500">
                                                <div className="mr-2 h-2 w-2 rounded-full bg-amber-500"></div>
                                                ล่าง
                                            </div>
                                            <div className="rounded bg-red-50 p-1 text-center">{tank.ffa_bottom ?? '-'}</div>
                                            <div className="rounded bg-blue-50 p-1 text-center">{tank.moisture_bottom ?? '-'}</div>
                                            <div className="rounded bg-green-50 p-1 text-center">{tank.dobi_bottom ?? '-'}</div>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>

                    {/* Parameters Section */}
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
                        {/* Undilute & Settings Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            whileHover={{ scale: 1.02 }}
                            className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-cyan-50 p-2 shadow-sm"
                        >
                            <div className="mb-1 grid grid-cols-2 gap-1 bg-gray-50 p-1 text-xs">
                                <div className="flex items-center font-bold text-gray-500">
                                    <div className="mr-2 h-2 w-2 rounded-full bg-blue-500"></div>
                                    Undilute 1
                                </div>
                                <div className="rounded p-1 text-center">
                                    <span className="font-bold text-blue-700">
                                        {safeFixed(data.undilute_1, 0)} <span className="text-xs font-normal text-gray-500"> แผ่น</span>
                                    </span>
                                </div>
                            </div>
                            <div className="mb-1 grid grid-cols-2 gap-2 bg-gray-50 p-1 text-xs">
                                <div className="flex items-center font-bold text-gray-500">
                                    <div className="mr-2 h-2 w-2 rounded-full bg-blue-500"></div>
                                    Undilute 2
                                </div>
                                <div className="rounded p-1 text-center">
                                    <span className="font-bold text-blue-700">
                                        {safeFixed(data.undilute_2, 0)}
 <span className="text-xs font-normal text-gray-500"> แผ่น</span>
                                    </span>
                                </div>
                            </div>
                            <div className="mb-1 grid grid-cols-2 gap-2 bg-gray-50 p-1 text-xs">
                                <div className="flex items-center font-bold text-gray-500">
                                    <div className="mr-2 h-2 w-2 rounded-full bg-blue-500"></div>
                                    Setting
                                </div>
                                <div className="rounded p-1 text-center">
                                    <span className="font-bold text-blue-700">
                                        {safeFixed(data.setting, 0)}
 <span className="text-xs font-normal text-gray-500"> แผ่น</span>
                                    </span>
                                </div>
                            </div>
                            <div className="mb-1 grid grid-cols-2 gap-2 bg-gray-50 p-1 text-xs">
                                <div className="flex items-center font-bold text-gray-500">
                                    <div className="mr-2 h-2 w-2 rounded-full bg-blue-500"></div>
                                    Clean Oil
                                </div>
                                <div className="rounded p-1 text-center">
                                    <span className="font-bold text-blue-700">
                                        {safeFixed(data.cleanOil, 0)}
 <span className="text-xs font-normal text-gray-500"> แผ่น</span>
                                    </span>
                                </div>
                            </div>
                        </motion.div>

                        {/* Skim Tank */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            whileHover={{ scale: 1.02 }}
                            className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-cyan-50 p-5 shadow-sm"
                        >
                            <div className="mb-2 flex items-center justify-between">
                                <p className="font-semibold text-gray-700">Skim</p>
                                <Info className="h-4 w-4 text-blue-500" />
                            </div>
                            <p className="text-3xl font-bold text-blue-700">{safeFixed(data.skim, 3)}</p>

                            <p className="mt-1 text-xs text-gray-500">Skim CS → CPO T1</p>
                        </motion.div>

                        {/* Mix */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            whileHover={{ scale: 1.02 }}
                            className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 to-yellow-50 p-5 shadow-sm"
                        >
                            <div className="mb-2 flex items-center justify-between">
                                <p className="font-semibold text-gray-700">Mix</p>
                                <Info className="h-4 w-4 text-amber-500" />
                            </div>
                            <p className="text-3xl font-bold text-amber-700">{safeFixed(data.mix, 3)}</p>

                            <p className="mt-1 text-xs text-gray-500">Mix T1 → T2</p>
                        </motion.div>

                        {/* Loop Back */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7 }}
                            whileHover={{ scale: 1.02 }}
                            className="rounded-2xl border border-rose-100 bg-gradient-to-br from-rose-50 to-red-50 p-5 shadow-sm"
                        >
                            <div className="mb-2 flex items-center justify-between">
                                <p className="font-semibold text-gray-700">Loop Back</p>
                                <Info className="h-4 w-4 text-rose-500" />
                            </div>
                            <p className="text-3xl font-bold text-rose-700">{safeFixed(data.loopBack, 3)}</p>

                            <p className="mt-1 text-xs text-rose-600">CPO T1,2 → Crude Oil</p>
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </AppLayout>
    );
}
