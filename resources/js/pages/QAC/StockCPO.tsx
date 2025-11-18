import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { motion } from 'framer-motion';
import { Calendar, FlaskConical, Info, RefreshCw, Thermometer, TrendingUp } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Fertilizer Productions', href: '/fertilizer/productions' },
];

export default function StockCPO() {
    const [data, setData] = useState<any | null>(null);
    const [historicalData, setHistoricalData] = useState<any[]>([]);
    const [selectedDate, setSelectedDate] = useState(() => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return yesterday.toISOString().split('T')[0];
    });
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [productionData, setProductionData] = useState<any | null>(null);
    const [usingSampleData, setUsingSampleData] = useState(false);
    const [salesData, setSalesData] = useState<any | null>(null);
    const [previousDayData, setPreviousDayData] = useState<any | null>(null);

    // Format date for API (YYYY-MM-DD)
    const formatDateForAPI = (dateString: string) => {
        return dateString;
    };

    // Fetch production data for yield calculation (หาแถวตามวันที่จากทั้งหมด)
    const fetchProductionData = async (date: string) => {
        try {
            const formattedDate = formatDateForAPI(date);

            const response = await fetch(`/report/productions/api`);
            const result = await response.json();

            if (result.success && result.productions && result.productions.length > 0) {
                // หา record ตามวันที่
                const target = result.productions.find((p: any) => {
                    if (!p.Date) return false;
                    const prodDate = new Date(p.Date).toISOString().split('T')[0];
                    return prodDate === formattedDate;
                });

                if (target) {
                    setProductionData(target);
                    const qty = parseFloat(target.FFBGoodQty ?? 0);
                    return parseFloat(qty.toFixed(3));
                }
            }

            return parseFloat((0).toFixed(3));
        } catch (err) {
            console.error('Error fetching production data:', err);
            return parseFloat((0).toFixed(3));
        }
    };

    // Fetch sales data for GoodID=2147
    const fetchSalesData = async (date: string) => {
        try {
            const formattedDate = formatDateForAPI(date);
            const response = await fetch(`/report/sales/api?date=${formattedDate}&goodid=2147`);
            const result = await response.json();

            console.log('Sales API Response:', result);

            if (result.success && result.sales && result.sales.length > 0) {
                // สมมติใช้ตัวแรกของวันนั้น (หรือจะ sum อีกชั้นก็ได้)
                setSalesData(result.sales[0]);

                const net = parseFloat(result.sales[0].total_netwei ?? 0);
                const salesInTons = net / 1000; // kg → tons
                return parseFloat(salesInTons.toFixed(3));
            }

            return parseFloat((0).toFixed(3));
        } catch (err) {
            console.error('Error fetching sales data:', err);
            return parseFloat((0).toFixed(3));
        }
    };

    // Fetch previous day stock CPO data
    const fetchPreviousDayData = async (currentDate: string) => {
        try {
            const current = new Date(currentDate);
            const previousDay = new Date(current);
            previousDay.setDate(previousDay.getDate() - 1);
            const previousDateStr = previousDay.toISOString().split('T')[0];

            const response = await fetch(`/report/stock-cpo/date/${previousDateStr}`);
            const result = await response.json();

            if (result.success && result.stockCPO && result.stockCPO.length > 0) {
                setPreviousDayData(result.stockCPO[0]);
                return parseFloat(result.stockCPO[0].total_cpo ?? 0);
            }

            return parseFloat((0).toFixed(3));
        } catch (err) {
            console.error('Error fetching previous day data:', err);
            return parseFloat((0).toFixed(3));
        }
    };

    // Fetch historical data for chart
    const fetchHistoricalData = async () => {
        try {
            const response = await fetch('/report/stock-cpo/historical?days=7');
            const result = await response.json();

            if (result.success) {
                setHistoricalData(result.data || []);
                if (result.message && String(result.message).includes('sample data')) {
                    setUsingSampleData(true);
                }
            } else {
                console.error('Error fetching historical data:', result.message);
                setUsingSampleData(true);
            }
        } catch (err) {
            console.error('Error fetching historical data:', err);
            setUsingSampleData(true);
        }
    };

    // Fetch data for specific date
    const fetchDataByDate = async (date: string = selectedDate) => {
        try {
            setIsRefreshing(true);
            setError(null);
            setUsingSampleData(false);

            const formattedDate = formatDateForAPI(date);

            // ดึงข้อมูล CPO ตามวันที่
            const response = await fetch(`/report/stock-cpo/date/${formattedDate}`);
            const result = await response.json();

            if (result.success && result.stockCPO && result.stockCPO.length > 0) {
                const apiData = result.stockCPO[0];

                if (result.message && String(result.message).includes('sample data')) {
                    setUsingSampleData(true);
                }

                const productionDate = new Date(apiData.date).toISOString().split('T')[0];

                const ffbGoodQty = await fetchProductionData(productionDate);
                const salesInTons = await fetchSalesData(productionDate);
                const previousDayCPO = await fetchPreviousDayData(productionDate);

                transformData(apiData, ffbGoodQty, salesInTons, previousDayCPO);
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

    // Fetch latest data as fallback
    const fetchLatestData = async () => {
        try {
            const response = await fetch('/report/stock-cpo/api');
            const result = await response.json();

            if (result.success && result.stockCPO && result.stockCPO.length > 0) {
                const list = result.stockCPO;

                // เลือก record ล่าสุดจาก field date
                const apiData = list.reduce((latest: any | null, item: any) => {
                    if (!latest) return item;
                    const d1 = new Date(item.date);
                    const d2 = new Date(latest.date);
                    return d1 > d2 ? item : latest;
                }, null as any);

                if (result.message && String(result.message).includes('sample data')) {
                    setUsingSampleData(true);
                }

                const productionDate = new Date(apiData.date).toISOString().split('T')[0];
                const ffbGoodQty = await fetchProductionData(productionDate);
                const salesInTons = await fetchSalesData(productionDate);
                const previousDayCPO = await fetchPreviousDayData(productionDate);

                transformData(apiData, ffbGoodQty, salesInTons, previousDayCPO);

                const latestDate = new Date(apiData.date).toISOString().split('T')[0];
                setSelectedDate(latestDate);
            } else {
                setError(result.message || 'No data available');
            }
        } catch (err: any) {
            console.error(err);
            setError('Error fetching latest data: ' + err.message);
        }
    };

    const transformData = (
        apiData: any,
        ffbGoodQty: number = 0,
        salesInTons: number = 0,
        previousDayCPO: number = 0,
    ) => {
        const tank1Vol = parseFloat(apiData.tank1_cpo_volume ?? 0) || 0;
        const tank2Vol = parseFloat(apiData.tank2_cpo_volume ?? 0) || 0;
        const tank3Vol = parseFloat(apiData.tank3_cpo_volume ?? 0) || 0;
        const tank4Vol = parseFloat(apiData.tank4_cpo_volume ?? 0) || 0;

        const totalTankVolume = parseFloat((tank1Vol + tank2Vol + tank3Vol + tank4Vol).toFixed(3));

        const currentCPO = parseFloat(apiData.total_cpo ?? 0) || 0;

        // Calculate yield: ((total_cpo ล่าสุด - (total_cpo วันก่อน - ยอดขาย)) / ปาล์มเข้าผลิต) * 100
        let yieldValue = 0;
        const safeFFB = parseFloat(String(ffbGoodQty)) || 0;

        if (safeFFB > 0) {
            const numerator = currentCPO - (previousDayCPO - salesInTons);
            yieldValue = parseFloat(((numerator / safeFFB) * 100).toFixed(3));
        }

        const transformed = {
            date: new Date(apiData.date).toLocaleDateString('th-TH', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
            }),
            originalDate: apiData.date,
            totalCPO: parseFloat(parseFloat(apiData.total_cpo ?? 0).toFixed(3)),
            yield: yieldValue,
            totalTankVolume: totalTankVolume,
            ffbGoodQty: parseFloat(safeFFB.toFixed(3)),
            salesInTons: parseFloat(salesInTons.toFixed(3)),
            previousDayCPO: parseFloat(previousDayCPO.toFixed(3)),
            currentCPO: parseFloat(currentCPO.toFixed(3)),
            tanks: [
                {
                    id: 1,
                    temp: apiData.tank1_temperature,
                    tons: parseFloat((tank1Vol || 0).toFixed(3)),
                    ffa: apiData.tank1_ffa != null ? parseFloat(parseFloat(apiData.tank1_ffa).toFixed(3)) : null,
                    moisture:
                        apiData.tank1_moisture != null
                            ? parseFloat(parseFloat(apiData.tank1_moisture).toFixed(3))
                            : null,
                    dobi: apiData.tank1_dobi != null ? parseFloat(parseFloat(apiData.tank1_dobi).toFixed(3)) : null,
                },
                {
                    id: 2,
                    temp: apiData.tank2_temperature,
                    tons: parseFloat((tank2Vol || 0).toFixed(3)),
                    ffa_top:
                        apiData.tank2_top_ffa != null
                            ? parseFloat(parseFloat(apiData.tank2_top_ffa).toFixed(3))
                            : null,
                    ffa_bottom:
                        apiData.tank2_bottom_ffa != null
                            ? parseFloat(parseFloat(apiData.tank2_bottom_ffa).toFixed(3))
                            : null,
                    moisture_top:
                        apiData.tank2_top_moisture != null
                            ? parseFloat(parseFloat(apiData.tank2_top_moisture).toFixed(3))
                            : null,
                    moisture_bottom:
                        apiData.tank2_bottom_moisture != null
                            ? parseFloat(parseFloat(apiData.tank2_bottom_moisture).toFixed(3))
                            : null,
                    dobi_top:
                        apiData.tank2_top_dobi != null
                            ? parseFloat(parseFloat(apiData.tank2_top_dobi).toFixed(3))
                            : null,
                    dobi_bottom:
                        apiData.tank2_bottom_dobi != null
                            ? parseFloat(parseFloat(apiData.tank2_bottom_dobi).toFixed(3))
                            : null,
                },
                {
                    id: 3,
                    temp: apiData.tank3_temperature,
                    tons: parseFloat((tank3Vol || 0).toFixed(3)),
                    ffa_top:
                        apiData.tank3_top_ffa != null
                            ? parseFloat(parseFloat(apiData.tank3_top_ffa).toFixed(3))
                            : null,
                    ffa_bottom:
                        apiData.tank3_bottom_ffa != null
                            ? parseFloat(parseFloat(apiData.tank3_bottom_ffa).toFixed(3))
                            : null,
                    moisture_top:
                        apiData.tank3_top_moisture != null
                            ? parseFloat(parseFloat(apiData.tank3_top_moisture).toFixed(3))
                            : null,
                    moisture_bottom:
                        apiData.tank3_bottom_moisture != null
                            ? parseFloat(parseFloat(apiData.tank3_bottom_moisture).toFixed(3))
                            : null,
                    dobi_top:
                        apiData.tank3_top_dobi != null
                            ? parseFloat(parseFloat(apiData.tank3_top_dobi).toFixed(3))
                            : null,
                    dobi_bottom:
                        apiData.tank3_bottom_dobi != null
                            ? parseFloat(parseFloat(apiData.tank3_bottom_dobi).toFixed(3))
                            : null,
                },
                {
                    id: 4,
                    temp: apiData.tank4_temperature,
                    tons: parseFloat((tank4Vol || 0).toFixed(3)),
                    ffa_top:
                        apiData.tank4_top_ffa != null
                            ? parseFloat(parseFloat(apiData.tank4_top_ffa).toFixed(3))
                            : null,
                    ffa_bottom:
                        apiData.tank4_bottom_ffa != null
                            ? parseFloat(parseFloat(apiData.tank4_bottom_ffa).toFixed(3))
                            : null,
                    moisture_top:
                        apiData.tank4_top_moisture != null
                            ? parseFloat(parseFloat(apiData.tank4_top_moisture).toFixed(3))
                            : null,
                    moisture_bottom:
                        apiData.tank4_bottom_moisture != null
                            ? parseFloat(parseFloat(apiData.tank4_bottom_moisture).toFixed(3))
                            : null,
                    dobi_top:
                        apiData.tank4_top_dobi != null
                            ? parseFloat(parseFloat(apiData.tank4_top_dobi).toFixed(3))
                            : null,
                    dobi_bottom:
                        apiData.tank4_bottom_dobi != null
                            ? parseFloat(parseFloat(apiData.tank4_bottom_dobi).toFixed(3))
                            : null,
                },
            ],
            skim: parseFloat(parseFloat(apiData.skim ?? 0).toFixed(3)),
            mix: parseFloat(parseFloat(apiData.mix ?? 0).toFixed(3)),
            loopBack: parseFloat(parseFloat(apiData.loop_back ?? 0).toFixed(3)),
            undilute_1: parseFloat(parseFloat(apiData.undilute_1 ?? 0).toFixed(3)),
            undilute_2: parseFloat(parseFloat(apiData.undilute_2 ?? 0).toFixed(3)),
            setting: parseFloat(parseFloat(apiData.setting ?? 0).toFixed(3)),
            cleanOil: parseFloat(parseFloat(apiData.clean_oil ?? 0).toFixed(3)),
            ffa_cpo: parseFloat(parseFloat(apiData.ffa_cpo ?? 0).toFixed(3)),
            dobi_cpo: parseFloat(parseFloat(apiData.dobi_cpo ?? 0).toFixed(3)),
        };

        setData(transformed);
    };

    // Handle date change
    const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newDate = event.target.value;
        setSelectedDate(newDate);
        void fetchDataByDate(newDate);
    };

    // Handle refresh
    const handleRefresh = () => {
        void fetchDataByDate();
        void fetchHistoricalData();
    };

    // Fetch data on component mount
    useEffect(() => {
        void fetchDataByDate();
        void fetchHistoricalData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Calculate chart data
    const chartData = useMemo(() => {
        if (!historicalData || historicalData.length === 0) return [];

        const sortedData = [...historicalData].sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        );
        const maxValue = Math.max(...sortedData.map((d) => d.total_cpo || 0));

        return sortedData.map((item, index) => {
            const value = item.total_cpo || 0;
            const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;

            return {
                date: new Date(item.date).toLocaleDateString('th-TH', {
                    day: 'numeric',
                    month: 'short',
                }),
                fullDate: new Date(item.date).toLocaleDateString('th-TH', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                }),
                value: value,
                percentage: percentage,
                isToday: index === sortedData.length - 1,
            };
        });
    }, [historicalData]);

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
                    <button
                        onClick={handleRefresh}
                        className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                    >
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
                                <p className="mt-1 text-sm text-green-600">
                                    ปาล์มเข้าผลิต: {data.ffbGoodQty.toFixed(2)} Tons
                                </p>
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
                                className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 shadow-sm transition-shadow hover:shadow-md disabled:opacity-50"
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
                                <h2 className="text-lg font-semibold">Total CPO + Skim</h2>
                                <p className="mt-2 text-5xl font-bold">
                                    {(
                                        parseFloat(data.totalCPO || 0) +
                                        parseFloat(data.skim || 0)
                                    ).toFixed(3)}
                                </p>
                                <p className="mt-1 text-sm opacity-90">Tons</p>
                                <div className="mt-2 text-xs opacity-80">
                                    %FFA: {data.ffa_cpo} | DOBI: {data.dobi_cpo}
                                </div>
                                <div className="mt-1 text-xs opacity-70">
                                    CPO: {data.totalCPO} + Skim: {data.skim}
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
                                    <p className="text-4xl font-bold">{data.yield.toFixed(3)}</p>
                                </div>
                                <div className="mt-4 h-2 w-full rounded-full bg-white/20">
                                    <motion.div
                                        className="h-2 rounded-full bg-white"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min(data.yield, 25)}%` }}
                                        transition={{ delay: 0.5, duration: 1 }}
                                    ></motion.div>
                                </div>
                                <div className="mt-1 text-center text-xs opacity-70">
                                    ({data.currentCPO.toFixed(3)} - ({data.previousDayCPO.toFixed(3)} -{' '}
                                    {data.salesInTons.toFixed(3)})) ÷ {data.ffbGoodQty.toFixed(3)} × 100
                                </div>
                            </div>
                        </motion.div>

                        {/* Volume Chart Card */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            className="rounded-2xl border border-gray-100 bg-white p-6 shadow-lg"
                        >
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-gray-700">
                                    ปริมาณน้ำมันปาล์มดิบ 7 วันย้อนหลัง
                                </h2>
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
                                                const maxVal = Math.max(
                                                    ...chartData.map((d: any) => d.value),
                                                );
                                                const minVal = Math.min(
                                                    ...chartData.map((d: any) => d.value),
                                                );
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
                                                                className={`relative w-full max-w-10 rounded-t-lg transition-all duration-300 ${
                                                                    isToday
                                                                        ? 'bg-gradient-to-t from-blue-600 to-blue-500 shadow-lg'
                                                                        : isHighest
                                                                          ? 'bg-gradient-to-t from-green-500 to-green-400 shadow-md'
                                                                          : isLowest
                                                                            ? 'bg-gradient-to-t from-red-500 to-red-400 shadow-md'
                                                                            : 'bg-gradient-to-t from-blue-400 to-blue-300'
                                                                } group-hover:shadow-xl group-hover:brightness-110`}
                                                                style={{ height: `${barHeight}%` }}
                                                            >
                                                                <div
                                                                    className={`absolute -top-6 left-1/2 -translate-x-1/2 transform text-xs font-bold ${
                                                                        isToday || isHighest || isLowest
                                                                            ? 'text-gray-800 opacity-100'
                                                                            : 'text-gray-600 opacity-0 group-hover:opacity-100'
                                                                    } whitespace-nowrap transition-opacity duration-200`}
                                                                >
                                                                    {item.value.toFixed(1)}T
                                                                </div>
                                                            </motion.div>
                                                        </div>
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
                                        <span className="font-semibold text-gray-800">
                                            TANK {tank.id}
                                        </span>
                                    </div>
                                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                                        <Thermometer className="h-4 w-4 text-red-500" />
                                        <span>{tank.temp ? `${tank.temp}°C` : '-'}</span>
                                    </div>
                                </div>

                                <p className="mt-3 text-3xl font-bold text-blue-700">
                                    {tank.tons > 0 ? tank.tons.toFixed(3) : '0.000'}
                                </p>
                                <p className="mb-2 text-xs text-gray-500">Tons</p>

                                {/* Quality Data - Tank 1 */}
                                {tank.id === 1 && tank.ffa != null && (
                                    <div className="mt-2">
                                        <div className="grid grid-cols-3 gap-2 text-center text-xs font-medium">
                                            <div className="rounded-lg bg-red-50 p-2">
                                                <p className="text-gray-500">%FFA</p>
                                                <p className="font-bold text-red-600">
                                                    {tank.ffa ?? '-'}
                                                </p>
                                            </div>
                                            <div className="rounded-lg bg-blue-50 p-2">
                                                <p className="text-gray-500">%Moist</p>
                                                <p className="font-bold text-blue-600">
                                                    {tank.moisture ?? '-'}
                                                </p>
                                            </div>
                                            <div className="rounded-lg bg-green-50 p-2">
                                                <p className="text-gray-500">DOBI</p>
                                                <p className="font-bold text-green-600">
                                                    {tank.dobi ?? '-'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Quality Data - Tanks 2,3,4 */}
                                {(tank.id === 2 || tank.id === 3 || tank.id === 4) && (
                                    <div className="rounded-lg bg-gray-50 p-3">
                                        <div className="mb-1 grid grid-cols-4 gap-2 text-xs font-medium text-gray-600">
                                            <div></div>
                                            <div className="text-center">%FFA</div>
                                            <div className="text-center">%Moist</div>
                                            <div className="text-center">DOBI</div>
                                        </div>

                                        {/* Top Row */}
                                        <div className="mb-1 grid grid-cols-4 gap-2 text-xs">
                                            <div className="flex items-center font-medium text-gray-500">
                                                <div className="mr-2 h-2 w-2 rounded-full bg-blue-500"></div>
                                                บน
                                            </div>
                                            <div className="rounded bg-red-50 p-1 text-center">
                                                <span className="font-bold text-blue-700">
                                                    {tank.ffa_top ?? '-'}
                                                </span>
                                            </div>
                                            <div className="rounded bg-blue-50 p-1 text-center">
                                                <span className="font-bold text-blue-700">
                                                    {tank.moisture_top ?? '-'}
                                                </span>
                                            </div>
                                            <div className="rounded bg-green-50 p-1 text-center">
                                                <span className="font-bold text-blue-700">
                                                    {tank.dobi_top ?? '-'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Bottom Row */}
                                        <div className="grid grid-cols-4 gap-2 text-xs">
                                            <div className="flex items-center font-medium text-gray-500">
                                                <div className="mr-2 h-2 w-2 rounded-full bg-amber-500"></div>
                                                ล่าง
                                            </div>
                                            <div className="rounded bg-red-50 p-1 text-center">
                                                <span className="font-bold text-amber-700">
                                                    {tank.ffa_bottom ?? '-'}
                                                </span>
                                            </div>
                                            <div className="rounded bg-blue-50 p-1 text-center">
                                                <span className="font-bold text-amber-700">
                                                    {tank.moisture_bottom ?? '-'}
                                                </span>
                                            </div>
                                            <div className="rounded bg-green-50 p-1 text-center">
                                                <span className="font-bold text-amber-700">
                                                    {tank.dobi_bottom ?? '-'}
                                                </span>
                                            </div>
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
                                        {data.undilute_1 || '0'}{' '}
                                        <span className="text-xs font-normal text-gray-500">
                                            {' '}
                                            แผ่น
                                        </span>
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
                                        {data.undilute_2 || '0'}{' '}
                                        <span className="text-xs font-normal text-gray-500">
                                            {' '}
                                            แผ่น
                                        </span>
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
                                        {data.setting || '0'}{' '}
                                        <span className="text-xs font-normal text-gray-500">
                                            {' '}
                                            แผ่น
                                        </span>
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
                                        {data.cleanOil || '0'}{' '}
                                        <span className="text-xs font-normal text-gray-500">
                                            {' '}
                                            แผ่น
                                        </span>
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
                            <p className="text-3xl font-bold text-blue-700">
                                {data.skim.toFixed(3)}
                            </p>
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
                            <p className="text-3xl font-bold text-amber-700">
                                {data.mix.toFixed(3)}
                            </p>
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
                            <p className="text-3xl font-bold text-rose-700">
                                {data.loopBack.toFixed(3)}
                            </p>
                            <p className="mt-1 text-xs text-rose-600">CPO T1,2 → Crude Oil</p>
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </AppLayout>
    );
}
