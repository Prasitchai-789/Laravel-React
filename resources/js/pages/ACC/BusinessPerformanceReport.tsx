import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import axios from 'axios';
import {
    AlertTriangle,
    ArrowDownRight,
    ArrowUpRight,
    BadgeDollarSign,
    BarChart3,
    Factory,
    Package,
    RefreshCw,
    Scale,
    TrendingDown,
    TrendingUp,
    Wallet,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
    Area,
    Bar,
    BarChart,
    CartesianGrid,
    ComposedChart,
    Legend,
    Line,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

interface AccountRow {
    AccCode: string;
    AccName?: string;
    total_amount: number;
}

interface FinancialAccountCategory {
    acc_code: string;
    category: string;
    type: 'expense' | 'other';
    is_active: boolean;
}

interface ProductRow {
    good_id: number;
    good_name: string;
    net_sales: number;
    total_weight: number;
    average_price: number;
}

interface PurchaseRow {
    total_qty: number;
    total_amount: number;
}

interface StockItem {
    name?: string;
    total_value_mb?: number;
    stock_qty?: number;
    unit?: string;
}

interface TrendRow {
    month: string;
    sales: number;
    expense: number;
    profit: number;
}

const incomeMap: Record<string, string> = {
    '411001': 'น้ำมัน',
    '412001': 'เมล็ดใน',
    '422001': 'กะลาปาล์ม',
    '422003': 'ทะลาย/ทะลายสับ',
    '422004': 'ใยปาล์ม',
};

const fallbackCategoryMap: Record<string, string> = {
    '513001': 'ซื้อผลปาล์มทะลาย',
    '515101': 'เงินเดือน ค่าแรงเหมา สวัสดิการ',
    '522001': 'เงินเดือน ค่าแรงเหมา สวัสดิการ',
    '515103': 'เงินเดือน ค่าแรงเหมา สวัสดิการ',
    '515102': 'เงินเดือน ค่าแรงเหมา สวัสดิการ',
    '522003': 'เงินเดือน ค่าแรงเหมา สวัสดิการ',
    '515104': 'เงินเดือน ค่าแรงเหมา สวัสดิการ',
    '522006': 'เงินเดือน ค่าแรงเหมา สวัสดิการ',
    '522009': 'เงินเดือน ค่าแรงเหมา สวัสดิการ',
    '522008': 'เงินเดือน ค่าแรงเหมา สวัสดิการ',
    '522007': 'เงินเดือน ค่าแรงเหมา สวัสดิการ',
    '522010': 'เงินเดือน ค่าแรงเหมา สวัสดิการ',
    '522011': 'เงินเดือน ค่าแรงเหมา สวัสดิการ',
    '522013': 'เงินเดือน ค่าแรงเหมา สวัสดิการ',
    '515202': 'โรงงาน',
    '150401': 'โรงงาน',
    '515201': 'โรงงาน',
    '150402': 'โรงงาน',
    '515212': 'โรงงาน',
    '515213': 'โรงงาน',
    '515302': 'โรงงาน',
    '515303': 'โรงงาน',
    '515305': 'โรงงาน',
    '515304': 'โรงงาน',
    '515401': 'โรงงาน',
    '515403': 'โรงงาน',
    '515404': 'โรงงาน',
    '523033': 'สำนักงาน',
    '521005': 'สำนักงาน',
    '523029': 'สำนักงาน',
    '523032': 'สำนักงาน',
    '523023': 'สำนักงาน',
    '523015': 'สำนักงาน',
    '515503': 'สำนักงาน',
    '524003': 'สำนักงาน',
    '150502': 'สำนักงาน',
    '524005': 'สำนักงาน',
    '150501': 'สำนักงาน',
    '524002': 'สำนักงาน',
    '524004': 'สำนักงาน',
    '523001': 'สำนักงาน',
    '523002': 'สำนักงาน',
    '523005': 'สำนักงาน',
    '515501': 'สำนักงาน',
    '523006': 'ค่าเดินทาง',
    '523011': 'ค่าเดินทาง',
    '523007': 'ค่าเดินทาง',
    '523008': 'ค่าเดินทาง',
    '523010': 'ค่าเดินทาง',
    '523009': 'ค่าเดินทาง',
    '526002': 'ประกันภัย',
    '526004': 'ประกันภัย',
    '515208': 'ประกันภัย',
    '524007': 'ซ่อมบำรุง/ภาษีรถยนต์',
    '526003': 'ซ่อมบำรุง/ภาษีรถยนต์',
    '527003': 'ซ่อมบำรุง/ภาษีรถยนต์',
    '540001': 'ดอกเบี้ยและค่าบริการ',
    '523026': 'ดอกเบี้ยและค่าบริการ',
    '523019': 'ดอกเบี้ยและค่าบริการ',
    '523025': 'ดอกเบี้ยและค่าบริการ',
    '527008': 'ดอกเบี้ยและค่าบริการ',
    '527001': 'ดอกเบี้ยและค่าบริการ',
    '527006': 'ดอกเบี้ยและค่าบริการ',
    '527004': 'ดอกเบี้ยและค่าบริการ',
    '523030': 'ดอกเบี้ยและค่าบริการ',
    '523013': 'ดอกเบี้ยและค่าบริการ',
    '523022': 'ดอกเบี้ยและค่าบริการ',
    '53600-04': 'ดอกเบี้ยและค่าบริการ',
    '523014': 'ดอกเบี้ยและค่าบริการ',
    '523031': 'ค่าบริจาค/ค่าธรรมเนียม',
    '515220': 'อื่นๆ',
    '159001': 'อื่นๆ',
    '521003': 'อื่นๆ',
    '523034': 'อื่นๆ',
};

const stockCoreKeys = ['cpo', 'pkn', 'shell', 'efb_fiber'];

const normalizeRows = <T,>(value: unknown): T[] => {
    if (Array.isArray(value)) return value as T[];
    if (value && typeof value === 'object') {
        return Object.values(value as Record<string, unknown>).filter((item) => item && typeof item === 'object') as T[];
    }
    return [];
};

const readRows = <T,>(payload: unknown, keys: string[]): T[] => {
    if (Array.isArray(payload)) return payload as T[];
    if (!payload || typeof payload !== 'object') return [];
    const data = payload as Record<string, unknown>;
    for (const key of keys) {
        const rows = normalizeRows<T>(data[key]);
        if (rows.length > 0) return rows;
    }
    return [];
};

const safeNumber = (value: unknown) => {
    const number = Number(value ?? 0);
    return Number.isFinite(number) ? number : 0;
};

const parseDate = (date: string) => {
    const [year, month, day] = date.split('-').map(Number);
    return new Date(year, month - 1, day);
};

const formatDateInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const monthLabel = (date: Date) => {
    const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    return `${months[date.getMonth()]} ${String(date.getFullYear() + 543).slice(-2)}`;
};

const buildMonthRanges = (start: string, end: string) => {
    const startValue = parseDate(start);
    const endValue = parseDate(end);
    const ranges: { label: string; start: string; end: string }[] = [];
    const cursor = new Date(startValue.getFullYear(), startValue.getMonth(), 1);

    while (cursor <= endValue) {
        const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
        const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
        ranges.push({
            label: monthLabel(cursor),
            start: formatDateInput(monthStart < startValue ? startValue : monthStart),
            end: formatDateInput(monthEnd > endValue ? endValue : monthEnd),
        });
        cursor.setMonth(cursor.getMonth() + 1);
    }

    return ranges;
};

const getMonthEndDate = (date: string) => {
    const value = parseDate(date);
    return formatDateInput(new Date(value.getFullYear(), value.getMonth() + 1, 0));
};

const getPreviousMonthRange = (date: string) => {
    const value = parseDate(date);
    const start = new Date(value.getFullYear(), value.getMonth() - 1, 1);
    const end = new Date(value.getFullYear(), value.getMonth(), 0);
    return { start: formatDateInput(start), end: formatDateInput(end) };
};

const formatNumber = (value: number, digits = 2) =>
    safeNumber(value).toLocaleString('th-TH', {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
    });

const formatPercent = (value: number) => `${value >= 0 ? '+' : ''}${formatNumber(value, 1)}%`;

const comparePercent = (current: number, previous: number) => {
    if (!previous) return 0;
    return ((current - previous) / Math.abs(previous)) * 100;
};

export default function BusinessPerformanceReport() {
    const today = new Date();
    const [startDate, setStartDate] = useState(`${today.getFullYear()}-01-01`);
    const [endDate, setEndDate] = useState(formatDateInput(today));
    const [loading, setLoading] = useState(false);
    const [trendRows, setTrendRows] = useState<TrendRow[]>([]);
    const [expenseRows, setExpenseRows] = useState<{ category: string; amount: number }[]>([]);
    const [productRows, setProductRows] = useState<ProductRow[]>([]);
    const [stockRows, setStockRows] = useState<{ name: string; valueMb: number; stockQty: number; unit: string }[]>([]);
    const [metrics, setMetrics] = useState({
        salesMb: 0,
        expenseMb: 0,
        profitMb: 0,
        purchaseMb: 0,
        purchaseQty: 0,
        avgPurchasePrice: 0,
        stockMb: 0,
        prevSalesMb: 0,
        prevExpenseMb: 0,
        prevProfitMb: 0,
    });

    const activeExpenseMap = async () => {
        try {
            const response = await axios.get('/api/financial/account-categories');
            const categories = readRows<FinancialAccountCategory>(response.data, ['data'])
                .filter((item) => item.is_active && item.acc_code && item.category)
                .reduce<Record<string, string>>((map, item) => {
                    map[String(item.acc_code).trim()] = String(item.category).trim();
                    return map;
                }, {});
            return Object.keys(categories).length > 0 ? categories : fallbackCategoryMap;
        } catch (error) {
            console.warn('Load account category mapping failed:', error);
            return fallbackCategoryMap;
        }
    };

    const calculateAccountSummary = (rows: AccountRow[], expenseMap: Record<string, string>) => {
        const incomeCodes = new Set(Object.keys(incomeMap));
        const sales = rows.filter((row) => incomeCodes.has(row.AccCode)).reduce((sum, row) => sum + safeNumber(row.total_amount), 0);
        const expense = rows.filter((row) => !incomeCodes.has(row.AccCode)).reduce((sum, row) => sum + safeNumber(row.total_amount), 0);
        const groupedExpenses = rows
            .filter((row) => !incomeCodes.has(row.AccCode))
            .reduce<Record<string, number>>((map, row) => {
                const category = expenseMap[row.AccCode] || 'อื่นๆ';
                map[category] = (map[category] || 0) + safeNumber(row.total_amount);
                return map;
            }, {});

        return {
            sales,
            expense,
            expenses: Object.entries(groupedExpenses)
                .map(([category, amount]) => ({ category, amount }))
                .filter((row) => row.amount !== 0)
                .sort((a, b) => b.amount - a.amount),
        };
    };

    const fetchReport = async () => {
        setLoading(true);
        try {
            const expenseMap = await activeExpenseMap();
            const accountCodes = Array.from(new Set([...Object.keys(incomeMap), ...Object.keys(expenseMap)]));
            const monthRanges = buildMonthRanges(startDate, endDate);
            const previousMonth = getPreviousMonthRange(endDate);

            const [accountRes, purchaseRes, salesRes, previousAccountRes, stockRes, ...monthlyResponses] = await Promise.all([
                axios.get('/accounts/api', { params: { start_date: startDate, end_date: endDate, account_codes: accountCodes } }),
                axios.get('/poinv-win-summary/api', { params: { start_date: startDate, end_date: endDate } }),
                axios.get('/sales-mar-win/api', { params: { start_date: startDate, end_date: endDate } }),
                axios.get('/accounts/api', { params: { start_date: previousMonth.start, end_date: previousMonth.end, account_codes: accountCodes } }),
                axios.get('/api/stock/valuation-summary', { params: { date: getMonthEndDate(endDate) } }),
                ...monthRanges.map((range) =>
                    axios.get('/accounts/api', { params: { start_date: range.start, end_date: range.end, account_codes: accountCodes } }),
                ),
            ]);

            const accountRows = readRows<AccountRow>(accountRes.data, ['data']);
            const previousAccountRows = readRows<AccountRow>(previousAccountRes.data, ['data']);
            const summary = calculateAccountSummary(accountRows, expenseMap);
            const previousSummary = calculateAccountSummary(previousAccountRows, expenseMap);

            const purchaseRows = readRows<PurchaseRow>(purchaseRes.data, ['data']);
            const purchaseQty = purchaseRows.reduce((sum, row) => sum + safeNumber(row.total_qty), 0);
            const purchaseAmount = purchaseRows.reduce((sum, row) => sum + safeNumber(row.total_amount), 0);

            const products = readRows<ProductRow>(salesRes.data.data ?? salesRes.data, ['products', 'data'])
                .map((row) => ({
                    good_id: Number(row.good_id ?? row.good_id),
                    good_name: row.good_name || 'สินค้า',
                    net_sales: safeNumber(row.net_sales ?? row.total_amount),
                    total_weight: safeNumber(row.total_weight),
                    average_price: safeNumber(row.average_price),
                }))
                .filter((row) => row.net_sales !== 0)
                .sort((a, b) => b.net_sales - a.net_sales);

            const stockItems = ((stockRes.data?.items || {}) as Record<string, StockItem>);
            const stock = stockCoreKeys
                .map((key) => ({
                    name: stockItems[key]?.name || key.toUpperCase(),
                    valueMb: safeNumber(stockItems[key]?.total_value_mb),
                    stockQty: safeNumber(stockItems[key]?.stock_qty),
                    unit: stockItems[key]?.unit || '',
                }))
                .filter((row) => row.valueMb !== 0 || row.stockQty !== 0);

            setTrendRows(
                monthlyResponses.map((response, index) => {
                    const rows = readRows<AccountRow>(response.data, ['data']);
                    const monthSummary = calculateAccountSummary(rows, expenseMap);
                    const sales = monthSummary.sales / 1000000;
                    const expense = monthSummary.expense / 1000000;

                    return {
                        month: monthRanges[index]?.label || '',
                        sales,
                        expense,
                        profit: sales - expense,
                    };
                }),
            );
            setExpenseRows(summary.expenses);
            setProductRows(products);
            setStockRows(stock);
            setMetrics({
                salesMb: summary.sales / 1000000,
                expenseMb: summary.expense / 1000000,
                profitMb: (summary.sales - summary.expense) / 1000000,
                purchaseMb: purchaseAmount / 1000000,
                purchaseQty,
                avgPurchasePrice: purchaseQty > 0 ? purchaseAmount / purchaseQty : 0,
                stockMb: stock.reduce((sum, row) => sum + row.valueMb, 0),
                prevSalesMb: previousSummary.sales / 1000000,
                prevExpenseMb: previousSummary.expense / 1000000,
                prevProfitMb: (previousSummary.sales - previousSummary.expense) / 1000000,
            });
        } catch (error) {
            console.error('Business performance fetch failed:', error);
            alert('โหลดข้อมูล Business Performance ไม่สำเร็จ');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, []);

    const expenseRatio = metrics.salesMb > 0 ? (metrics.expenseMb / metrics.salesMb) * 100 : 0;
    const grossSpreadMb = metrics.salesMb - metrics.purchaseMb;
    const grossSpreadRatio = metrics.salesMb > 0 ? (grossSpreadMb / metrics.salesMb) * 100 : 0;
    const salesChange = comparePercent(metrics.salesMb, metrics.prevSalesMb);
    const expenseChange = comparePercent(metrics.expenseMb, metrics.prevExpenseMb);
    const profitChange = comparePercent(metrics.profitMb, metrics.prevProfitMb);

    const alerts = useMemo(() => {
        const rows: { title: string; detail: string; tone: 'good' | 'warn' | 'bad' }[] = [];
        if (metrics.profitMb < 0) {
            rows.push({ title: 'กำไรสุทธิติดลบ', detail: `ขาดทุน ${formatNumber(Math.abs(metrics.profitMb), 2)} MB`, tone: 'bad' });
        }
        if (expenseRatio >= 85) {
            rows.push({ title: 'ค่าใช้จ่ายสูงเมื่อเทียบกับรายได้', detail: `ค่าใช้จ่ายคิดเป็น ${formatNumber(expenseRatio, 1)}% ของรายได้`, tone: 'warn' });
        }
        if (expenseChange > 20) {
            rows.push({ title: 'ค่าใช้จ่ายเพิ่มเร็ว', detail: `เพิ่มจากเดือนก่อน ${formatPercent(expenseChange)}`, tone: 'warn' });
        }
        if (salesChange < -10) {
            rows.push({ title: 'ยอดขายลดลง', detail: `ลดจากเดือนก่อน ${formatPercent(salesChange)}`, tone: 'bad' });
        }
        if (metrics.stockMb > metrics.salesMb * 0.5 && metrics.salesMb > 0) {
            rows.push({ title: 'มูลค่าสต๊อกสูง', detail: `สต๊อกคิดเป็น ${formatNumber((metrics.stockMb / metrics.salesMb) * 100, 1)}% ของยอดขาย`, tone: 'warn' });
        }
        if (rows.length === 0) {
            rows.push({ title: 'ภาพรวมอยู่ในเกณฑ์ปกติ', detail: 'ยังไม่พบสัญญาณผิดปกติจากตัวชี้วัดหลัก', tone: 'good' });
        }
        return rows;
    }, [expenseChange, expenseRatio, metrics.profitMb, metrics.salesMb, metrics.stockMb, salesChange]);

    const topExpense = expenseRows[0];
    const topProduct = productRows[0];
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Business Performance', href: '/accounts/business-performance' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="min-h-screen bg-slate-50 p-4 font-anuphan">
                <div className="mx-auto max-w-7xl space-y-5">
                    <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <p className="text-sm font-semibold text-blue-700">Business Performance</p>
                            <h1 className="text-2xl font-bold text-slate-950">รายงานประกอบการตัดสินใจธุรกิจ</h1>
                            <p className="mt-1 text-sm text-slate-500">รายได้ ค่าใช้จ่าย กำไร ต้นทุนรับซื้อ และมูลค่าสต๊อก</p>
                        </div>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                            <label className="text-sm font-medium text-slate-600">
                                จากวันที่
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(event) => setStartDate(event.target.value)}
                                    className="mt-1 block rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                />
                            </label>
                            <label className="text-sm font-medium text-slate-600">
                                ถึงวันที่
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(event) => setEndDate(event.target.value)}
                                    className="mt-1 block rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                />
                            </label>
                            <button
                                type="button"
                                onClick={fetchReport}
                                disabled={loading}
                                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:bg-slate-400"
                            >
                                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                                อัปเดต
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
                        <KpiCard title="รายได้รวม" value={metrics.salesMb} suffix="MB" change={salesChange} icon={BadgeDollarSign} tone="green" />
                        <KpiCard title="ค่าใช้จ่ายรวม" value={metrics.expenseMb} suffix="MB" change={expenseChange} icon={Wallet} tone="red" />
                        <KpiCard title="กำไรสุทธิ" value={metrics.profitMb} suffix="MB" change={profitChange} icon={TrendingUp} tone={metrics.profitMb >= 0 ? 'blue' : 'red'} />
                        <KpiCard title="ต้นทุนรับซื้อ" value={metrics.purchaseMb} suffix="MB" subText={`ราคาเฉลี่ย ${formatNumber(metrics.avgPurchasePrice, 2)}`} icon={Factory} tone="amber" />
                        <KpiCard title="มูลค่าสต๊อก" value={metrics.stockMb} suffix="MB" subText="ณ สิ้นเดือนที่เลือก" icon={Package} tone="slate" />
                    </div>

                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
                            <div className="mb-4 flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-950">แนวโน้มรายได้ ค่าใช้จ่าย และกำไร</h2>
                                    <p className="text-sm text-slate-500">หน่วย: ล้านบาท</p>
                                </div>
                                <BarChart3 className="h-5 w-5 text-blue-700" />
                            </div>
                            <div className="h-[340px] min-h-[340px] min-w-0">
                                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                                    <ComposedChart data={trendRows} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                                        <YAxis tick={{ fontSize: 12 }} />
                                        <Tooltip formatter={(value) => `${formatNumber(Number(value), 2)} MB`} />
                                        <Legend />
                                        <Area type="monotone" dataKey="sales" name="รายได้" fill="#16a34a" fillOpacity={0.14} stroke="#16a34a" strokeWidth={2} />
                                        <Line type="monotone" dataKey="expense" name="ค่าใช้จ่าย" stroke="#dc2626" strokeWidth={2.5} dot={false} />
                                        <Bar dataKey="profit" name="กำไรสุทธิ" fill="#2563eb" radius={[4, 4, 0, 0]} />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-lg font-bold text-slate-950">สัญญาณที่ควรดู</h2>
                                <AlertTriangle className="h-5 w-5 text-amber-600" />
                            </div>
                            <div className="space-y-3">
                                {alerts.map((alert) => (
                                    <div
                                        key={alert.title}
                                        className={`rounded-lg border px-4 py-3 ${
                                            alert.tone === 'good'
                                                ? 'border-emerald-200 bg-emerald-50'
                                                : alert.tone === 'bad'
                                                  ? 'border-red-200 bg-red-50'
                                                  : 'border-amber-200 bg-amber-50'
                                        }`}
                                    >
                                        <p className="font-semibold text-slate-900">{alert.title}</p>
                                        <p className="mt-1 text-sm text-slate-600">{alert.detail}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                        <InsightCard title="Expense Ratio" value={`${formatNumber(expenseRatio, 1)}%`} detail="ค่าใช้จ่ายเทียบกับรายได้" icon={Scale} />
                        <InsightCard title="Spread หลังรับซื้อ" value={`${formatNumber(grossSpreadMb, 2)} MB`} detail={`${formatNumber(grossSpreadRatio, 1)}% ของยอดขาย`} icon={TrendingUp} />
                        <InsightCard
                            title="ตัวขับเคลื่อนหลัก"
                            value={topProduct?.good_name || '-'}
                            detail={topProduct ? `${formatNumber(topProduct.net_sales / 1000000, 2)} MB` : 'ยังไม่มีข้อมูลขาย'}
                            icon={ArrowUpRight}
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                        <Section title="รายได้แยกตามสินค้า" subtitle="มูลค่า ปริมาณ และราคาเฉลี่ย">
                            <DataTable
                                headers={['สินค้า', 'ยอดขาย MB', 'ปริมาณ', 'ราคาเฉลี่ย']}
                                rows={productRows.map((row) => [
                                    row.good_name,
                                    formatNumber(row.net_sales / 1000000, 2),
                                    formatNumber(row.total_weight, 2),
                                    formatNumber(row.average_price, 2),
                                ])}
                            />
                        </Section>

                        <Section title="ค่าใช้จ่ายแยกหมวด" subtitle={topExpense ? `หมวดสูงสุด: ${topExpense.category}` : 'ยังไม่มีข้อมูล'}>
                            <div className="mb-4 h-[220px] min-h-[220px] min-w-0">
                                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                                    <BarChart data={expenseRows.slice(0, 7)} layout="vertical" margin={{ top: 0, right: 10, left: 40, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                        <XAxis type="number" tick={{ fontSize: 12 }} tickFormatter={(value) => formatNumber(Number(value) / 1000000, 0)} />
                                        <YAxis dataKey="category" type="category" tick={{ fontSize: 12 }} width={110} />
                                        <Tooltip formatter={(value) => `${formatNumber(Number(value) / 1000000, 2)} MB`} />
                                        <Bar dataKey="amount" fill="#dc2626" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <DataTable
                                headers={['หมวด', 'ยอดเงิน MB', '% ค่าใช้จ่าย']}
                                rows={expenseRows.slice(0, 8).map((row) => [
                                    row.category,
                                    formatNumber(row.amount / 1000000, 2),
                                    metrics.expenseMb > 0 ? `${formatNumber((row.amount / 1000000 / metrics.expenseMb) * 100, 1)}%` : '0.0%',
                                ])}
                            />
                        </Section>
                    </div>

                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                        <Section title="สต๊อกสินค้า ณ สิ้นเดือน" subtitle={`รวม ${formatNumber(metrics.stockMb, 2)} MB`}>
                            <DataTable
                                headers={['สินค้า', 'มูลค่า MB', 'คงเหลือ', 'หน่วย']}
                                rows={stockRows.map((row) => [row.name, formatNumber(row.valueMb, 2), formatNumber(row.stockQty, 2), row.unit])}
                            />
                        </Section>

                        <Section title="ข้อสรุปเพื่อการตัดสินใจ" subtitle="ตัวชี้วัดที่ควรติดตามต่อ">
                            <div className="grid gap-3">
                                <DecisionLine label="ยอดขายเทียบเดือนก่อน" value={formatPercent(salesChange)} negative={salesChange < 0} />
                                <DecisionLine label="ค่าใช้จ่ายเทียบเดือนก่อน" value={formatPercent(expenseChange)} negative={expenseChange > 0} />
                                <DecisionLine label="กำไรเทียบเดือนก่อน" value={formatPercent(profitChange)} negative={profitChange < 0} />
                                <DecisionLine label="ปริมาณรับซื้อผลปาล์ม" value={formatNumber(metrics.purchaseQty, 2)} />
                            </div>
                        </Section>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function KpiCard({
    title,
    value,
    suffix,
    change,
    subText,
    icon: Icon,
    tone,
}: {
    title: string;
    value: number;
    suffix: string;
    change?: number;
    subText?: string;
    icon: React.ElementType;
    tone: 'green' | 'red' | 'blue' | 'amber' | 'slate';
}) {
    const colors = {
        green: 'bg-emerald-50 text-emerald-700',
        red: 'bg-red-50 text-red-700',
        blue: 'bg-blue-50 text-blue-700',
        amber: 'bg-amber-50 text-amber-700',
        slate: 'bg-slate-100 text-slate-700',
    };

    return (
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-500">{title}</p>
                <span className={`rounded-lg p-2 ${colors[tone]}`}>
                    <Icon className="h-4 w-4" />
                </span>
            </div>
            <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold tabular-nums text-slate-950">{formatNumber(value, 2)}</span>
                <span className="text-sm font-semibold text-slate-500">{suffix}</span>
            </div>
            <div className="mt-2 text-sm text-slate-500">
                {change !== undefined ? (
                    <span className={`inline-flex items-center gap-1 font-semibold ${change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {change >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                        {formatPercent(change)}
                    </span>
                ) : (
                    subText
                )}
            </div>
        </div>
    );
}

function InsightCard({ title, value, detail, icon: Icon }: { title: string; value: string; detail: string; icon: React.ElementType }) {
    return (
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
                <span className="rounded-lg bg-blue-50 p-2 text-blue-700">
                    <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-500">{title}</p>
                    <p className="truncate text-xl font-bold text-slate-950">{value}</p>
                    <p className="text-sm text-slate-500">{detail}</p>
                </div>
            </div>
        </div>
    );
}

function Section({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
    return (
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4">
                <h2 className="text-lg font-bold text-slate-950">{title}</h2>
                <p className="text-sm text-slate-500">{subtitle}</p>
            </div>
            {children}
        </div>
    );
}

function DataTable({ headers, rows }: { headers: string[]; rows: (string | number)[][] }) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
                <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                        {headers.map((header) => (
                            <th key={header} className="px-3 py-2 text-left font-semibold text-slate-600">
                                {header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.length === 0 ? (
                        <tr>
                            <td colSpan={headers.length} className="px-3 py-8 text-center text-slate-400">
                                ไม่มีข้อมูล
                            </td>
                        </tr>
                    ) : (
                        rows.map((row, rowIndex) => (
                            <tr key={`${row[0]}-${rowIndex}`} className="border-b border-slate-100">
                                {row.map((cell, cellIndex) => (
                                    <td key={`${cell}-${cellIndex}`} className={`px-3 py-2 ${cellIndex > 0 ? 'text-right tabular-nums' : 'text-slate-700'}`}>
                                        {cell}
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}

function DecisionLine({ label, value, negative = false }: { label: string; value: string; negative?: boolean }) {
    return (
        <div className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3">
            <span className="text-sm font-medium text-slate-600">{label}</span>
            <span className={`inline-flex items-center gap-1 font-bold ${negative ? 'text-red-600' : 'text-emerald-600'}`}>
                {negative ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
                {value}
            </span>
        </div>
    );
}
