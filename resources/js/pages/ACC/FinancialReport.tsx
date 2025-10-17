import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import axios from 'axios';
import { Minus, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Account {
    AccCode: string;
    AccName: string;
    total_amount: number;
}

interface Category {
    category: string;
    accounts: { AccCode: string; AccName: string; Dr: number; Cr: number }[];
}

interface SaleMar {
    GoodID: number;
    total_goodnet: number;
}
interface SaleMarWin {
    GoodID: number;
}
interface SaleMarWinRe {
    GoodID: number;
    total_amount: number;
}
interface POInvWin {
    total_qty: number;
    total_amount: number;
}

export default function FinancialReport() {
    const getCurrentDate = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const getFirstDayOfCurrentYear = () => {
        const now = new Date();
        const year = now.getFullYear();
        return `${year}-01-01`;
    };
    const [startDate, setStartDate] = useState(getFirstDayOfCurrentYear());
    const [endDate, setEndDate] = useState(getCurrentDate());
    const [reportData, setReportData] = useState<Category[]>([]);
    const [salesDataWeb, setSalesDataWeb] = useState<SaleMar[]>([]);
    const [salesDataWinRe, setSalesDataWinRe] = useState<SaleMarWinRe[]>([]);
    const [POInvData, setPOInvData] = useState<POInvWin[]>([]);
    const [totalQty, setTotalQty] = useState(0);
    const [totalAmount, setTotalAmount] = useState(0);
    const [avgPrice, setAvgPrice] = useState(0);
    const [loading, setLoading] = useState(false);
    const [incomeData, setIncomeData] = useState<Category[]>([]);
    const [activeTab, setActiveTab] = useState('summary');
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');

    const incomeMap: { [key: string]: string } = {
        '411001': 'น้ำมัน',
        '412001': 'เมล็ดใน',
        '422001': 'กะลาปาล์ม (เพียว)',
        '422003': 'ทะลายปาล์ม',
        '422004': 'ใยปาล์ม',
        // '417000': 'รับคืนสินค้า',
    };

    const incomeGoodMap: { [key: string]: number } = {
        '411001': 2147, // น้ำมัน
        '412001': 2152, // เมล็ดใน
        '422001': 2151, // กะลาปาล์ม
        '422003': 2149, // ทะลายปาล์ม
        '422004': 2150, // ใยปาล์ม
    };

    const categoryMap: { [key: string]: string } = {
        '513001': 'ซื้อผลปาล์มทะลาย',
        '515101': 'เงินเดือน',
        '522001': 'เงินเดือน',
        '515103': 'เงินเดือน',
        '515102': 'เงินเดือน',
        '522003': 'เงินเดือน',
        '515104': 'เงินเดือน',
        '515202': 'ค่าใช้จ่ายส่วน โรงงาน',
        '150401': 'ค่าใช้จ่ายส่วน โรงงาน',
        '515201': 'ค่าใช้จ่ายส่วน โรงงาน',
        '150402': 'ค่าใช้จ่ายส่วน โรงงาน',
        '515212': 'ค่าใช้จ่ายส่วน โรงงาน',
        '515213': 'ค่าใช้จ่ายส่วน โรงงาน',
        '515302': 'ค่าใช้จ่ายส่วน โรงงาน',
        '515303': 'ค่าใช้จ่ายส่วน โรงงาน',
        '515305': 'ค่าใช้จ่ายส่วน โรงงาน',
        '515304': 'ค่าใช้จ่ายส่วน โรงงาน',
        '515401': 'ค่าใช้จ่ายส่วน โรงงาน',
        '515403': 'ค่าใช้จ่ายส่วน โรงงาน',
        '515404': 'ค่าใช้จ่ายส่วน โรงงาน',
        '523033': 'ค่าใช้จ่ายส่วน สำนักงาน',
        '521005': 'ค่าใช้จ่ายส่วน สำนักงาน',
        '523029': 'ค่าใช้จ่ายส่วน สำนักงาน',
        '523032': 'ค่าใช้จ่ายส่วน สำนักงาน',
        '523023': 'ค่าใช้จ่ายส่วน สำนักงาน',
        '523015': 'ค่าใช้จ่ายส่วน สำนักงาน',
        '515503': 'ค่าใช้จ่ายส่วน สำนักงาน',
        '524003': 'ค่าใช้จ่ายส่วน สำนักงาน',
        '150502': 'ค่าใช้จ่ายส่วน สำนักงาน',
        '524005': 'ค่าใช้จ่ายส่วน สำนักงาน',
        '150501': 'ค่าใช้จ่ายส่วน สำนักงาน',
        '524002': 'ค่าใช้จ่ายส่วน สำนักงาน',
        '524004': 'ค่าใช้จ่ายส่วน สำนักงาน',
        '523001': 'ค่าใช้จ่ายส่วน สำนักงาน',
        '523002': 'ค่าใช้จ่ายส่วน สำนักงาน',
        '523005': 'ค่าใช้จ่ายส่วน สำนักงาน',
        '515501': 'ค่าใช้จ่ายส่วน สำนักงาน',
        '522006': 'สวัสดิการ',
        '522009': 'สวัสดิการ',
        '522008': 'สวัสดิการ',
        '522007': 'สวัสดิการ',
        '522010': 'สวัสดิการ',
        '522011': 'สวัสดิการ',
        '522013': 'สวัสดิการ',
        '523031': 'ค่าบริการกุศล',
        '523006': 'ค่าใช้จ่ายในการเดินทาง',
        '523011': 'ค่าใช้จ่ายในการเดินทาง',
        '523007': 'ค่าใช้จ่ายในการเดินทาง',
        '523008': 'ค่าใช้จ่ายในการเดินทาง',
        '523010': 'ค่าใช้จ่ายในการเดินทาง',
        '523009': 'ค่าใช้จ่ายในการเดินทาง',
        '526002': 'ค่าประกันภัย',
        '526004': 'ค่าประกันภัย',
        '515208': 'ค่าประกันภัย',
        '524007': 'ค่าซ่อมแซมบำรุงรักษาและค่าภาษี - รถยนต์',
        '526003': 'ค่าซ่อมแซมบำรุงรักษาและค่าภาษี - รถยนต์',
        '527003': 'ค่าซ่อมแซมบำรุงรักษาและค่าภาษี - รถยนต์',
        '540001': 'ค่าบริการ ดอกเบี้ย',
        '523026': 'ค่าบริการ ดอกเบี้ย',
        '523019': 'ค่าบริการ ดอกเบี้ย',
        '523025': 'ค่าบริการ ดอกเบี้ย',
        '527008': 'ค่าบริการ ดอกเบี้ย',
        '527001': 'ค่าบริการ ดอกเบี้ย',
        '527006': 'ค่าบริการ ดอกเบี้ย',
        '527004': 'ค่าบริการ ดอกเบี้ย',
        '523030': 'ค่าบริการ ดอกเบี้ย',
        '523013': 'ค่าบริการ ดอกเบี้ย',
        '523022': 'ค่าบริการ ดอกเบี้ย',
        '53600-04': 'ค่าบริการ ดอกเบี้ย',
        '523014': 'ค่าบริการ ดอกเบี้ย',
        '515220': 'ค่าใช้จ่าย อื่นๆ',
        '159001': 'ค่าใช้จ่าย อื่นๆ',
        '521003': 'ค่าใช้จ่าย อื่นๆ',
        '523034': 'ค่าใช้จ่าย อื่นๆ',
    };

    useEffect(() => {
        if (startDate && endDate) {
            fetchData();
            fetchDataSalesWeb();
            fetchDataSalesWin();
            fetchDataPOInvWin();
        }
    }, [startDate, endDate]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/accounts/api', {
                params: { start_date: startDate, end_date: endDate },
            });

            const accounts: Account[] = response.data.data;
            const incomeAccounts = accounts
                .filter((acc) => Object.keys(incomeMap).includes(acc.AccCode))
                .sort((a, b) => b.total_amount - a.total_amount);
            const expenseAccounts = accounts
                .filter((acc) => !Object.keys(incomeMap).includes(acc.AccCode))
                .sort((a, b) => b.total_amount - a.total_amount);

            const groupAccounts = (arr: Account[], map: { [key: string]: string }) => {
                const grouped: { [key: string]: Category } = {};
                arr.forEach((acc) => {
                    const categoryName = map[acc.AccCode] || 'อื่นๆ';
                    if (!grouped[categoryName]) grouped[categoryName] = { category: categoryName, accounts: [] };
                    grouped[categoryName].accounts.push({
                        AccCode: acc.AccCode,
                        AccName: acc.AccName,
                        Dr: acc.total_amount > 0 ? acc.total_amount : 0,
                        Cr: acc.total_amount < 0 ? Math.abs(acc.total_amount) : 0,
                    });
                });
                Object.values(grouped).forEach((cat) => cat.accounts.sort((a, b) => b.Dr - a.Dr));
                return Object.values(grouped);
            };

            setIncomeData(groupAccounts(incomeAccounts, incomeMap));
            setReportData(groupAccounts(expenseAccounts, categoryMap));
        } catch (error) {
            console.error(error);
            alert('เกิดข้อผิดพลาดในการดึงข้อมูล');
        } finally {
            setLoading(false);
        }
    };

    const fetchDataSalesWeb = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/sales-mar/api', {
                params: { start_date: startDate, end_date: endDate },
            });
            const saleMar: SaleMar[] = response.data.data || [];
            setSalesDataWeb(saleMar);
        } catch (error) {
            console.error(error);
            alert('เกิดข้อผิดพลาดในการดึงข้อมูล');
        } finally {
            setLoading(false);
        }
    };
    const fetchDataSalesWin = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/sales-mar-win/api', {
                params: { start_date: startDate, end_date: endDate },
            });
            const saleMarWinRe: SaleMarWinRe[] = response.data.returns || [];
            setSalesDataWinRe(saleMarWinRe);
        } catch (error) {
            console.error(error);
            alert('เกิดข้อผิดพลาดในการดึงข้อมูล');
        } finally {
            setLoading(false);
        }
    };

    const fetchDataPOInvWin = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/poinv-win/api', {
                params: { start_date: startDate, end_date: endDate },
            });
            const POInvWin: POInvWin[] = response.data.data || [];

            // ใช้ POInvWin ที่เพิ่งดึงมา
            const totalQty = POInvWin.reduce((sum, item) => sum + (item.total_qty || 0), 0);
            const totalAmount = POInvWin.reduce((sum, item) => sum + (item.total_amount || 0), 0);
            const avgPrice = totalQty > 0 ? totalAmount / totalQty : 0;

            setPOInvData(POInvWin);
            setTotalQty(totalQty);
            setTotalAmount(totalAmount);
            setAvgPrice(avgPrice);
        } catch (error) {
            console.error(error);
            alert('เกิดข้อผิดพลาดในการดึงข้อมูล');
        } finally {
            setLoading(false);
        }
    };

    const sumColumn = (data: any[], field: string) => {
        if (!data || !Array.isArray(data)) return 0;

        return data.reduce((sum, item) => {
            const value = item[field] || 0;
            return sum + (isNaN(Number(value)) ? 0 : Number(value));
        }, 0);
    };

    const toggleCategory = (category: string) => {
        const newExpanded = new Set(expandedCategories);
        if (newExpanded.has(category)) {
            newExpanded.delete(category);
        } else {
            newExpanded.add(category);
        }
        setExpandedCategories(newExpanded);
    };
    

    // const netIncome = (totalIncomeCr - totalIncomeDr) - (totalExpenseDr - totalExpenseCr);
    const calculateSafeValue = (value: any): number => {
        const num = Number(value);
        return isNaN(num) ? 0 : num;
    };

    const totalIncomeDr = sumColumn(
        incomeData.flatMap((c) => c.accounts),
        'Dr',
    );
    const totalIncomeCr = sumColumn(
        incomeData.flatMap((c) => c.accounts),
        'Cr',
    );
    const totalExpenseDr = sumColumn(
        reportData.flatMap((c) => c.accounts),
        'Dr',
    );
    const totalExpenseCr = sumColumn(
        reportData.flatMap((c) => c.accounts),
        'Cr',
    );

    const netIncome = calculateSafeValue(totalIncomeDr - totalIncomeCr) - calculateSafeValue(totalExpenseDr - totalExpenseCr);

    const filteredReportData = reportData.filter(
        (cat) =>
            cat.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cat.accounts.some((acc) => acc.AccName.toLowerCase().includes(searchTerm.toLowerCase()) || acc.AccCode.includes(searchTerm)),
    );

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'รายงานการเงิน', href: '#' },
    ];

    const formatMoney = (amount: number) => {
        return amount.toLocaleString('th-TH', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    const formatMB = (amount: number) => {
        if (amount === null || amount === undefined || isNaN(amount)) {
            return '0.00';
        }
        return (amount / 1000000).toLocaleString('th-TH', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('th-TH', {
            style: 'currency',
            currency: 'THB',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const calculateFinancialMetrics = () => {
        const income = calculateSafeValue(totalIncomeDr - totalIncomeCr);
        const expense = calculateSafeValue(totalExpenseDr - totalExpenseCr);

        // คำนวณอัตราส่วน
        let ratio = 0;
        if (expense > 0) {
            ratio = income / expense;
        }

        // คำนวณเปอร์เซ็นต์ค่าใช้จ่าย
        let expensePercent = 0;
        if (income > 0) {
            expensePercent = (expense / income) * 100;
        }

        // กำหนดสี
        let barColorClass = 'to-green-600';
        if (expensePercent >= 90) barColorClass = 'to-red-500';
        else if (expensePercent >= 80) barColorClass = 'to-orange-500';
        else if (expensePercent >= 70) barColorClass = 'to-yellow-500';
        else if (expensePercent >= 60) barColorClass = 'to-green-500';

        return { ratio, expensePercent, barColorClass };
    };
    const { ratio, expensePercent, barColorClass } = calculateFinancialMetrics();
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 p-4 font-anuphan">
                <div className="mx-auto max-w-7xl">
                    {/* Header Section */}
                    <div className="mb-4 text-center">
                        <div className="inline-flex items-center gap-3 rounded-2xl bg-white/80 px-6 py-4 shadow-sm backdrop-blur-sm">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-700">
                                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                    />
                                </svg>
                            </div>
                            <div className="text-left">
                                <h1 className="text-3xl font-bold text-gray-900">รายงานการเงิน</h1>
                                <p className="text-gray-600">แสดงข้อมูลรายรับรายจ่ายตามช่วงวันที่ที่กำหนด</p>
                            </div>
                        </div>
                    </div>

                    {/* Date Selection Card */}
                    <div className="mb-6 rounded-2xl bg-white p-6 shadow-lg">
                        <div className="mb-4 flex items-center gap-2">
                            <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                            </svg>
                            <h2 className="text-lg font-semibold text-gray-900">เลือกช่วงวันที่</h2>
                        </div>
                        <div className="flex flex-wrap items-end gap-4">
                            <div className="min-w-[200px] flex-1">
                                <label className="mb-2 block text-sm font-medium text-gray-700">วันที่เริ่มต้น</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full rounded-xl border border-gray-300 px-4 py-3 transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-offset-1"
                                />
                            </div>
                            <div className="min-w-[200px] flex-1">
                                <label className="mb-2 block text-sm font-medium text-gray-700">ถึงวันที่</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full rounded-xl border border-gray-300 px-4 py-3 transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-offset-1"
                                />
                            </div>
                            <button
                                onClick={fetchData}
                                disabled={loading}
                                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 font-medium text-white shadow-lg transition-all transition-transform duration-200 duration-300 hover:scale-[1.02] hover:from-blue-700 hover:to-blue-800 hover:shadow-xl disabled:from-gray-400 disabled:to-gray-500 disabled:hover:shadow-lg"
                            >
                                {loading ? (
                                    <>
                                        <svg
                                            className="h-4 w-4 animate-spin text-white"
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                            ></path>
                                        </svg>
                                        กำลังโหลด...
                                    </>
                                ) : (
                                    <>
                                        <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                            />
                                        </svg>
                                        ค้นหาข้อมูล
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Tab Navigation */}
                    <div className="mb-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex space-x-1 rounded-xl bg-gray-100 p-1">
                                <button
                                    onClick={() => setActiveTab('summary')}
                                    className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
                                        activeTab === 'summary' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-700'
                                    }`}
                                >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                        />
                                    </svg>
                                    ภาพรวม
                                </button>
                                <button
                                    onClick={() => setActiveTab('details')}
                                    className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
                                        activeTab === 'details' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-700'
                                    }`}
                                >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                        />
                                    </svg>
                                    รายละเอียด
                                </button>
                            </div>

                            {activeTab === 'details' && (
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="ค้นหาหมวดหมู่หรือบัญชี..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full rounded-xl border border-gray-300 px-4 py-2 pr-4 pl-10 transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 sm:w-64"
                                    />
                                    <svg
                                        className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                        />
                                    </svg>
                                </div>
                            )}
                        </div>
                    </div>

                    {activeTab === 'summary' ? (
                        /* Summary View */
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                            {/* Income Card */}
                            <div className="overflow-hidden rounded-2xl bg-white shadow-lg lg:col-span-1">
                                <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
                                    <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                            />
                                        </svg>
                                        รายรับทั้งหมด
                                    </h3>
                                    <p className="mt-1 text-2xl font-bold text-white">{formatMB(totalIncomeDr - totalIncomeCr)} MB.</p>
                                </div>
                                <div className="p-4">
                                    <div className="space-y-3">
                                        {incomeData.map((cat) => {
                                            const goodId = Object.keys(incomeGoodMap).find((key) => incomeMap[key] === cat.category);
                                            const saleWeb = salesDataWeb.find((s) => Number(s.GoodID) === Number(incomeGoodMap[goodId ?? '']));
                                            const saleWinRe = salesDataWinRe.find((s) => Number(s.GoodID) === Number(incomeGoodMap[goodId ?? '']));

                                            const categoryAmount = calculateSafeValue(sumColumn(cat.accounts, 'Dr') - sumColumn(cat.accounts, 'Cr'));
                                            const returnAmount = calculateSafeValue(saleWinRe ? saleWinRe.total_amount : 0);
                                            const netAmount = categoryAmount - returnAmount;

                                            const totalGoodNet = saleWeb ? calculateSafeValue(saleWeb.total_goodnet) : 0;
                                            const avgPrice = totalGoodNet > 0 ? categoryAmount / totalGoodNet : 0;

                                            return (
                                                <div
                                                    key={cat.category}
                                                    className="rounded-lg border border-gray-100 p-3 transition-colors hover:bg-gray-50"
                                                >
                                                    <div className="flex justify-between">
                                                        <span className="text-sm font-medium text-gray-700">
                                                            {cat.category}
                                                            <span className="mt-1 text-xs text-blue-500">
                                                                {' ('} {totalGoodNet.toLocaleString('th-TH', { maximumFractionDigits: 0 })} Kg.{')'}
                                                            </span>
                                                        </span>
                                                        <span
                                                            className={`text-sm font-semibold ${netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}
                                                        >
                                                            {formatMB(netAmount)} MB.
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="mt-1 text-xs text-gray-500">
                                                            ราคาเฉลี่ย :{' '}
                                                            {avgPrice > 0
                                                                ? avgPrice.toLocaleString('th-TH', {
                                                                      minimumFractionDigits: 2,
                                                                      maximumFractionDigits: 2,
                                                                  })
                                                                : '-'}{' '}
                                                            บาท
                                                        </span>
                                                        {returnAmount > 0 && (
                                                            <span className="mt-1 text-xs text-gray-500">
                                                                ( {formatMB(categoryAmount)} MB. -
                                                                <span className="text-red-600"> ลดหนี้ {formatCurrency(returnAmount)} </span>)
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Expense Card */}
                            <div className="overflow-hidden rounded-2xl bg-white shadow-lg lg:col-span-1">
                                <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4">
                                    <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                                            />
                                        </svg>
                                        รายจ่ายทั้งหมด
                                    </h3>
                                    <p className="mt-1 text-2xl font-bold text-white">{formatMB(Number(totalExpenseDr - totalExpenseCr))} MB.</p>
                                </div>
                                <div className="p-4">
                                    <div className="space-y-3">
                                        {reportData.slice(0, 6).map((cat) => (
                                            <div
                                                key={cat.category}
                                                className="rounded-lg border border-gray-100 p-3 transition-colors hover:bg-gray-50"
                                            >
                                                <div className="flex justify-between">
                                                    <span className="text-sm font-medium text-gray-700">{cat.category}</span>
                                                    <span className="text-sm font-semibold text-red-600">
                                                        {formatMB(sumColumn(cat.accounts, 'Dr') - sumColumn(cat.accounts, 'Cr'))} MB.
                                                    </span>
                                                </div>
                                                <div className="mt-1 text-xs text-gray-500">{cat.accounts.length} บัญชี</div>
                                            </div>
                                        ))}
                                        {reportData.length > 6 && (
                                            <div className="text-center">
                                                <button onClick={() => setActiveTab('details')} className="text-sm text-blue-600 hover:text-blue-700">
                                                    ดูทั้งหมด {reportData.length} หมวดหมู่ →
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Summary Cards */}
                            <div className="space-y-6 lg:col-span-1">
                                <div className="rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="rounded-xl bg-white/20 p-2">
                                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                                />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-sm opacity-90">กำไร(ขาดทุน) สุทธิ</p>
                                            <p className={`text-2xl font-bold ${netIncome >= 0 ? 'text-white' : 'text-yellow-200'}`}>
                                                {formatMB(calculateSafeValue(netIncome))} MB.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="rounded-xl bg-white p-4 shadow-lg">
                                        <div className="flex items-center gap-2">
                                            <div className="rounded-lg bg-green-100 p-2">
                                                <Plus className="h-4 w-4 text-green-700" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">รายรับสุทธิ</p>
                                                <p className="text-sm font-semibold text-gray-900">
                                                    {formatMB(calculateSafeValue(totalIncomeDr - totalIncomeCr))} MB.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rounded-xl bg-white p-4 shadow-lg">
                                        <div className="flex items-center gap-2">
                                            <div className="rounded-lg bg-red-100 p-2">
                                                <Minus className="h-4 w-4 text-red-600" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">รายจ่ายสุทธิ</p>
                                                <p className="text-sm font-semibold text-gray-900">
                                                    {formatMB(calculateSafeValue(totalExpenseDr - totalExpenseCr))} MB.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-xl bg-white p-4 shadow-lg">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-700">อัตราส่วนรายรับต่อรายจ่าย</span>
                                        <span className={`text-sm font-bold ${ratio >= 1 ? 'text-green-600' : 'text-red-600'}`}>
                                            {ratio.toFixed(2)}:1
                                        </span>
                                    </div>
                                    <div className="mt-2 h-2 rounded-full bg-gray-200">
                                        <div
                                            className={`h-2 rounded-full bg-gradient-to-r from-green-500 ${barColorClass} transition-all duration-500`}
                                            style={{ width: `${Math.min(100, expensePercent)}%` }}
                                        ></div>
                                    </div>
                                </div>

                                <div className="rounded-2xl bg-gradient-to-br from-yellow-500 to-yellow-600 p-6 text-white shadow-lg">
                                    <div className="flex items-center gap-3">
                                        <div>
                                            <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
                                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                    />
                                                </svg>
                                                ซื้อผลปาล์มทะลาย
                                            </h3>
                                            <p className="text-2xl font-bold text-white">
                                                {calculateSafeValue(totalQty).toLocaleString('th-TH')} Kg.
                                            </p>
                                            <p className="text-sm">ราคาเฉลี่ย: {calculateSafeValue(avgPrice).toFixed(2)} บาท</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Details View */
                        <div className="space-y-2">
                            {/* Summary Bar */}
                            <div className="rounded-2xl bg-white p-6 shadow-lg">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    <div className="text-center">
                                        <p className="text-sm text-gray-500">รายรับทั้งหมด</p>
                                        <p className="text-2xl font-bold text-green-600">{formatMB(totalIncomeDr - totalIncomeCr)} MB.</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm text-gray-500">รายจ่ายทั้งหมด</p>
                                        <p className="text-2xl font-bold text-red-600">{formatMB(totalExpenseDr - totalExpenseCr)} MB.</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm text-gray-500">กำไร(ขาดทุน) สุทธิ</p>
                                        <p className={`text-2xl font-bold ${netIncome >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                                            {formatMB(netIncome)} MB.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {filteredReportData.map((category) => (
                                <div
                                    key={category.category}
                                    className="overflow-hidden rounded-2xl bg-white shadow-lg transition-transform duration-300 hover:scale-[1.02] hover:shadow-xl"
                                >
                                    <button
                                        onClick={() => toggleCategory(category.category)}
                                        className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-blue-50"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900">{category.category}</h3>
                                                <p className="text-sm text-gray-500">{category.accounts.length} บัญชี</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="text-sm font-semibold text-red-600">
                                                    {formatMoney(sumColumn(category.accounts, 'Dr') - sumColumn(category.accounts, 'Cr'))}
                                                </p>
                                                <p className="text-xs text-gray-500">รวมรายจ่าย</p>
                                            </div>
                                            <svg
                                                className={`h-5 w-5 transform text-gray-400 transition-transform duration-200 ${
                                                    expandedCategories.has(category.category) ? 'rotate-180' : ''
                                                }`}
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </button>

                                    {expandedCategories.has(category.category) && (
                                        <div className="border-t border-gray-200">
                                            <div className="">
                                                <table className="w-full">
                                                    <thead className="rounded-2xl bg-gray-50">
                                                        <tr>
                                                            <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                                                บัญชี
                                                            </th>
                                                            <th className="px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase">
                                                                เดบิต
                                                            </th>
                                                            <th className="px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase">
                                                                เครดิต
                                                            </th>
                                                            <th className="px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase">
                                                                สุทธิ
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-200">
                                                        {category.accounts.map((acc) => (
                                                            <tr key={acc.AccCode} className="transition-colors hover:bg-gray-50">
                                                                <td className="px-4 py-3">
                                                                    <div className="text-sm font-medium text-gray-900">{acc.AccName}</div>
                                                                    <div className="text-sm text-gray-500">{acc.AccCode}</div>
                                                                </td>
                                                                <td className="px-4 py-3 text-right text-sm text-gray-900">{formatMoney(acc.Dr)}</td>
                                                                <td className="px-4 py-3 text-right text-sm text-gray-900">{formatMoney(acc.Cr)}</td>
                                                                <td className="px-4 py-3 text-right text-sm font-semibold text-red-600">
                                                                    {formatMoney(acc.Dr - acc.Cr)}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                        <tr className="bg-gray-50 font-semibold">
                                                            <td className="px-4 py-3 text-sm text-gray-900">รวม</td>
                                                            <td className="px-4 py-3 text-right text-sm text-gray-900">
                                                                {formatMoney(sumColumn(category.accounts, 'Dr'))}
                                                            </td>
                                                            <td className="px-4 py-3 text-right text-sm text-gray-900">
                                                                {formatMoney(sumColumn(category.accounts, 'Cr'))}
                                                            </td>
                                                            <td className="px-4 py-3 text-right text-sm text-red-600">
                                                                {formatMoney(sumColumn(category.accounts, 'Dr') - sumColumn(category.accounts, 'Cr'))}
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
