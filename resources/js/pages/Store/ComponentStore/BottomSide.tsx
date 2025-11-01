import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Department {
    name: string;
    code: string;
    items: number;
}

interface CategoryStat {
    category: string;
    totalItems: number;
    lowStock?: number;
    outOfStock?: number;
}

interface BudgetItem {
    category: string;
    amount: number;
    quantity: number;
}

interface OrderItem {
    id: string;
    category?: string;
    amount?: number;
    quantity?: number;
}

interface BottomSideProps {
    timeRange?: string;
    selectedDate?: string | null;
    dateRange?: { start: string; end: string } | null;
    dateMode?: string;
    departments?: Department[];
}

const BottomSide: React.FC<BottomSideProps> = ({
    timeRange = 'month',
    selectedDate = null,
    dateRange = null,
    dateMode = 'month',
    departments = []
}) => {
    const [departmentList, setDepartmentList] = useState<any[]>([]);
    const [loadingDepartments, setLoadingDepartments] = useState(false);
    const [loading, setLoading] = useState(false);
    const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([]);
    const [orders, setOrders] = useState<OrderItem[]>([]);
    const [budget, setBudget] = useState<BudgetItem[]>([]);
    const [totalAmount, setTotalAmount] = useState(0);

    const goodCodeCategories: Record<string, string> = {
        'ST-EL': 'อุปกรณ์ไฟฟ้า',
        'ST-FP': 'อะไหล่ท่อ',
        'ST-SM': 'อะไหล่',
        'ST-EQ': 'วัสดุสิ้นเปลือง',
        'P-TS-AG001': 'ทั่วไป',
    };

    // ฟังก์ชันแปลง พ.ศ. -> ค.ศ. สำหรับ selectedDate/dateRange
    const toCE = (input: string | Date): string => {
        if (input instanceof Date) {
            return input.toISOString().slice(0, 10); // YYYY-MM-DD
        }

        if (typeof input === 'string') {
            if (input.includes('/')) {
                const [day, month, year] = input.split('/');
                const yearCE = String(Number(year) - 543);
                const dd = day.padStart(2, '0');
                const mm = month.padStart(2, '0');
                return `${yearCE}-${mm}-${dd}`;
            } else {
                return input; // ถ้าเป็น YYYY-MM-DD อยู่แล้ว
            }
        }

        throw new Error('Invalid date input');
    };

    // ฟังก์ชันสำหรับไอคอนหมวดหมู่สินค้า (ใช้เฉพาะในส่วนสถานะสินค้าคงคลัง)
    const getCategoryIcon = (categoryName?: string) => {
        if (!categoryName) return (
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
        );

        const name = categoryName.toLowerCase();

        if (name.includes('เทคโนโลยี') || name.includes('คอมพิวเตอร์')) return (
            <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
        );

        if (name.includes('อุปกรณ์') || name.includes('เครื่องมือ')) return (
            <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        );

        if (name.includes('ไฟฟ้า')) return (
            <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
        );

        if (name.includes('วัสดุสิ้นเปลือง')) return (
            <svg className="w-6 h-6 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
        );

        // Default icon
        return (
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
        );
    };

    // ฟังก์ชันสำหรับไอคอนฝ่าย/แผนก (ใหม่)
    const departmentAbbreviations: Record<string, string> = {
        'ทรัพยากรบุคคล': 'HRE',
        'บัญชีและการเงิน': 'ACC',
        'จัดซื้อปาล์ม': 'RPO',
        'ขายและการตลาด': 'MAR',
        'จัดซื้อและพัสดุคงคลัง': 'PUR',
        'ควบคุมคุณภาพ': 'QAC',
        'ผลิตและวิศวกรรม': 'PRO',
        'รักษาความปลอดภัย': 'SEC',
        'ความปลอดภัยและสิ่งแวดล้อม': 'SHE',
        'แผนพัฒนาคุณภาพ': 'QMR',
        'บริหาร': 'MD',
        'มั่นสกลการเกษตร': 'MUN',
        'เทคโนโลยีสารสนเทศ': 'ITE',
        'สวนและต้นกล้า': 'AGR',
        'สื่อประชาสัมพันธ์': 'PR'
    };

    // ฟังก์ชันดึงตัวย่อ
    const getDeptAbbreviation = (name: string) => {
        return departmentAbbreviations[name] || name.substring(0, 3).toUpperCase();
    };

    // แปลงวันไทย 'd/m/yyyy' เป็น 'YYYY-MM-DD' ไม่ปรับปี
    const parseThaiDate = (thaiDate: string | undefined | null) => {
        if (!thaiDate || typeof thaiDate !== 'string') return null;

        const parts = thaiDate.split('/');
        if (parts.length !== 3) return null;

        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10); // ใช้ปีตรง ๆ

        return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        setLoadingDepartments(true);

        const params: any = { timeRange };

        // ฟังก์ชันแปลง พ.ศ. -> ค.ศ.
        const toCE = (thaiDate: string | Date | undefined | null) => {
            if (!thaiDate) return null;

            if (thaiDate instanceof Date) {
                return thaiDate.toISOString().split('T')[0]; // YYYY-MM-DD
            }

            if (typeof thaiDate === 'string') {
                const match = thaiDate.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
                if (match) {
                    const [_, d, m, y] = match;
                    const yearCE = Number(y) - 543;
                    return `${yearCE}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
                }
                return thaiDate; // assume already YYYY-MM-DD
            }

            return null;
        };

        // single date
        if (dateMode === 'single' && selectedDate) {
            params.selectedDate = toCE(selectedDate);
        }

        // range date
        if (dateMode === 'range' && dateRange?.length === 2) {
            params.dateRange = [toCE(dateRange[0]), toCE(dateRange[1])];
        }

        console.log('📅 Sending params (CE):', params);

        axios.get("/StoreOrder/Departments", { params })
            .then((response) => {
                console.log('📥 Departments response:', response.data);
                const data = response.data;
                const departmentsArray = Object.entries(data).map(([name, items]) => ({
                    name,
                    items: Array.isArray(items) ? items.length : 0,
                    code: name.substring(0, 3).toUpperCase(),
                }));
                setDepartmentList(departmentsArray);
            })
            .catch(console.error)
            .finally(() => setLoadingDepartments(false));
    }, [timeRange, selectedDate, dateRange, dateMode]);

    useEffect(() => {
        setLoading(true);
        axios.get("/StoreOrder/StockOrder")
            .then(res => {
                const groupedByCategory: Record<string, CategoryStat> = {};

                res.data.forEach((item: any) => {
                    const prefix = Object.keys(goodCodeCategories).find(key => item.good_code.startsWith(key));
                    const category = prefix ? goodCodeCategories[prefix] : 'อื่นๆ';

                    if (!groupedByCategory[category]) {
                        groupedByCategory[category] = {
                            category,
                            totalItems: 0,
                            lowStock: 0,
                            outOfStock: 0
                        };
                    }

                    groupedByCategory[category].totalItems += 1;
                    if (item.availableQty === 0) {
                        groupedByCategory[category].outOfStock! += 1;
                    } else if (item.availableQty <= item.safety_stock) {
                        groupedByCategory[category].lowStock! += 1;
                    }
                });

                setCategoryStats(Object.values(groupedByCategory));
            })
            .catch(err => console.error("Error fetching stock order:", err))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        const fetchApprovedBudget = async () => {
            setLoading(true);

            try {
                const params: Record<string, string | string[]> = {};

                const formatLocalDateTime = (d: Date) => {
                    const pad = (n: number) => n.toString().padStart(2, '0');
                    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
                };

                let start: Date | null = null;
                let end: Date | null = null;

                if (selectedDate) {
                    const dateCE = toCE(selectedDate);
                    params.selectedDate = dateCE;

                    start = new Date(selectedDate);
                    start.setHours(0, 0, 0, 0);

                    end = new Date(selectedDate);
                    end.setHours(23, 59, 59, 999);
                } else if (Array.isArray(dateRange) && dateRange[0] && dateRange[1]) {
                    const startCE = toCE(dateRange[0]);
                    const endCE = toCE(dateRange[1]);
                    params.dateRange = [startCE, endCE];

                    start = new Date(dateRange[0]);
                    start.setHours(0, 0, 0, 0);

                    end = new Date(dateRange[1]);
                    end.setHours(23, 59, 59, 999);
                } else {
                    const today = new Date();
                    const range = timeRange || 'month';
                    switch (range) {
                        case 'month':
                            start = new Date(today.getFullYear(), today.getMonth(), 1, 0, 0, 0, 0);
                            end = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
                            break;
                        case 'quarter': {
                            const quarter = Math.floor(today.getMonth() / 3);
                            start = new Date(today.getFullYear(), quarter * 3, 1, 0, 0, 0, 0);
                            end = new Date(today.getFullYear(), quarter * 3 + 3, 0, 23, 59, 59, 999);
                            break;
                        }
                        case 'year':
                            start = new Date(today.getFullYear(), 0, 1, 0, 0, 0, 0);
                            end = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);
                            break;
                        case 'all':
                            params.all = 'true';
                            break;
                        default:
                            setBudget([]);
                            setTotalAmount(0);
                            setLoading(false);
                            return;
                    }
                }

                if (!params.all && start && end) {
                    params.startDate = formatLocalDateTime(start);
                    params.endDate = formatLocalDateTime(end);
                    if (!params.timeRange) params.timeRange = timeRange || 'custom';
                }

                const response = await axios.get('/StoreOrder/Budget', { params });

                // --- แปลง API data เป็น array ---
                let data: any[] = [];
                if (response.data?.success) {
                    const apiData = response.data.data;
                    if (Array.isArray(apiData)) {
                        data = apiData;
                    } else if (apiData && typeof apiData === 'object') {
                        data = Object.values(apiData); // แปลง object เป็น array
                    } else {
                        console.warn('⚠️ API ไม่ส่ง array หรือ object:', apiData);
                        data = [];
                    }
                }

                if (data.length === 0) {
                    setBudget([]);
                    setTotalAmount(0);
                    return;
                }

                // --- สรุปงบประมาณตามหมวดหมู่ ---
                const categoryTotals: Record<string, { amount: number; quantity: number }> = {};
                data.forEach(order => {
                    const items = Array.isArray(order.items) ? order.items : [];
                    items.forEach((item: any) => {
                        const prefix = Object.keys(goodCodeCategories).find(key =>
                            item.good_code?.startsWith(key)
                        );
                        const category = prefix ? goodCodeCategories[prefix] : 'อื่นๆ';
                        if (!categoryTotals[category]) categoryTotals[category] = { amount: 0, quantity: 0 };
                        categoryTotals[category].amount += item.total || 0;
                        categoryTotals[category].quantity += item.quantity || 0;
                    });
                });

                const budgetArray = Object.entries(categoryTotals).map(([category, totals]) => ({
                    category,
                    amount: totals.amount,
                    quantity: totals.quantity,
                }));

                const totalAmount = budgetArray.reduce((sum, item) => sum + item.amount, 0);

                setBudget(budgetArray);
                setTotalAmount(totalAmount);

            } catch (error) {
                console.error('❌ เกิดข้อผิดพลาดขณะดึงข้อมูลงบประมาณ:', error);
                setBudget([]);
                setTotalAmount(0);
            } finally {
                setLoading(false);
            }
        };

        fetchApprovedBudget();
    }, [selectedDate, dateRange, timeRange]);

    if (loading) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                    <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 h-full flex flex-col">
                        <div className="animate-pulse flex-1 flex flex-col space-y-4">
                            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-32 mb-2"></div>
                            <div className="h-48 bg-gray-300 dark:bg-gray-600 rounded"></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    // Common card container class
    const cardClass = "bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700  flex flex-col min-h-0";

    return (
        <>


            <div className="w-full  overflow-auto  dark:bg-gray-900 p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6  auto-rows-fr">
                    {/* สัดส่วนการเบิกตามฝ่าย */}
                    <div className={cardClass}>
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold text-gray-900 dark:text-white">สัดส่วนการเบิกตามฝ่าย</h4>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">กระจายการใช้งานตามแผนก</p>
                                </div>
                            </div>
                            <div className="px-3 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg border border-indigo-200 dark:border-indigo-700">
                                <span className="text-indigo-700 dark:text-indigo-300 text-sm font-semibold">
                                    {loadingDepartments
                                        ? 'กำลังโหลด...'
                                        : `${departmentList.reduce((sum, d) => sum + d.items, 0).toLocaleString()} การเบิก`}
                                </span>
                            </div>
                        </div>

                        {/* Content */}
                        {loadingDepartments ? (
                            <div className="flex flex-col items-center justify-center py-8 flex-1">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mb-3"></div>
                                <p className="text-gray-500 dark:text-gray-400 text-sm">กำลังโหลดข้อมูล...</p>
                            </div>
                        ) : (() => {
                            const chartColors = [
                                '#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6',
                                '#06b6d4', '#f97316', '#ec4899', '#84cc16', '#14b8a6'
                            ];

                            const displayedDepartments = departmentList.map((dept, index) => ({
                                name: dept.name,
                                items: dept.items,
                                color: chartColors[index % chartColors.length],
                                code: dept.code || dept.name.substring(0, 3).toUpperCase()
                            }));

                            const totalDeptItems = displayedDepartments.reduce((sum, d) => sum + d.items, 0);
                            const maxDept = displayedDepartments.length > 0
                                ? displayedDepartments.reduce((max, dept) => (dept.items > max.items ? dept : max), displayedDepartments[0])
                                : { name: '-', items: 0 };

                            if (totalDeptItems === 0) {
                                return (
                                    <div className="flex flex-col items-center justify-center py-8 text-gray-500 dark:text-gray-400 flex-1">
                                        <svg className="w-16 h-16 mb-3 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <p className="text-base font-medium">ไม่มีข้อมูลการเบิก</p>
                                        <p className="text-sm">ยังไม่มีการเบิกสินค้าในระบบ</p>
                                    </div>
                                );
                            }

                            return (
                                <div className="flex flex-col items-center space-y-4 flex-1 min-h-0">
                                    {/* Pie Chart */}
                                    <div className="relative w-40 h-40">
                                        <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                                            {displayedDepartments.map((dept, index) => {
                                                const percentage = totalDeptItems ? (dept.items / totalDeptItems) * 100 : 0;
                                                const circumference = 2 * Math.PI * 35;
                                                const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
                                                const offset = -displayedDepartments
                                                    .slice(0, index)
                                                    .reduce((sum, d) => sum + ((d.items / totalDeptItems) * circumference || 0), 0);

                                                return (
                                                    <circle
                                                        key={dept.name}
                                                        cx="50"
                                                        cy="50"
                                                        r="35"
                                                        fill="none"
                                                        stroke={dept.color}
                                                        strokeWidth="10"
                                                        strokeDasharray={strokeDasharray}
                                                        strokeDashoffset={offset}
                                                        className="transition-all duration-700 ease-in-out"
                                                    />
                                                );
                                            })}
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="text-center">
                                                <p className="text-xl font-bold text-gray-900 dark:text-white">{totalDeptItems.toLocaleString()}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">การเบิกทั้งหมด</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Quick Stats */}
                                    <div className="grid grid-cols-2 gap-3 w-full">
                                        <div className="text-center p-3 bg-gradient-to-br from-rose-50/80 to-pink-50/80 dark:from-rose-900/20 dark:to-pink-900/20 rounded-lg border border-rose-100 dark:border-rose-800 shadow-sm">
                                            <div className="w-6 h-6 bg-gradient-to-br from-rose-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-1 shadow-md shadow-rose-500/25">
                                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                                </svg>
                                            </div>
                                            <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 mb-1">แผนกสูงสุด</p>
                                            <div className="min-h-[32px] flex items-center justify-center">
                                                <p className="text-xs font-bold text-gray-900 dark:text-white text-center leading-tight break-words px-1">
                                                    {maxDept?.name || '-'}
                                                </p>
                                            </div>
                                            <div className="mt-1 text-xs text-rose-500 dark:text-rose-300 font-semibold">
                                                {maxDept?.items.toLocaleString()} รายการ
                                            </div>
                                        </div>

                                        <div className="text-center p-3 bg-gradient-to-br from-cyan-50/80 to-blue-50/80 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-lg border border-cyan-100 dark:border-cyan-800 shadow-sm">
                                            <div className="w-6 h-6 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-1 shadow-md shadow-cyan-500/25">
                                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                </svg>
                                            </div>
                                            <p className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 mb-1">จำนวนแผนก</p>
                                            <p className="text-sm font-bold text-gray-900 dark:text-white">{displayedDepartments.length}</p>
                                            <div className="mt-1 text-xs text-cyan-500 dark:text-cyan-300 font-semibold">ทั้งหมด</div>
                                        </div>
                                    </div>

                                    {/* Legend Section */}
                                    <div className="w-full space-y-2 max-h-48 overflow-y-auto flex-1 min-h-0">
                                        {displayedDepartments.map((dept) => {
                                            const percentage = totalDeptItems ? Math.round((dept.items / totalDeptItems) * 100) : 0;
                                            const isMaxDept = dept.name === maxDept.name;

                                            return (
                                                <div
                                                    key={dept.name}
                                                    className={`flex items-center space-x-2 p-2 rounded-lg border transition-all duration-200 ${isMaxDept
                                                        ? 'bg-gradient-to-r from-indigo-50/80 to-purple-50/80 dark:from-indigo-900/30 dark:to-purple-900/30 border-indigo-200 dark:border-indigo-600 shadow-sm'
                                                        : 'bg-white/80 dark:bg-gray-800/80 border-gray-200/50 dark:border-gray-600/50'
                                                        }`}
                                                >
                                                    <div className="w-2 h-6 rounded-full flex-shrink-0" style={{ backgroundColor: dept.color }}></div>
                                                    <div className="w-6 h-6 bg-gray-100 dark:bg-gray-700 rounded-md flex items-center justify-center flex-shrink-0 text-xs font-bold text-gray-700 dark:text-gray-200">
                                                        {getDeptAbbreviation(dept.name)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">
                                                                {dept.name}
                                                            </p>
                                                            <span className={`text-xs font-bold ${isMaxDept
                                                                ? 'text-indigo-600 dark:text-indigo-400'
                                                                : 'text-gray-700 dark:text-gray-300'
                                                                }`}>
                                                                {percentage}%
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1 mr-2">
                                                                <div
                                                                    className="h-1 rounded-full transition-all duration-500 ease-out"
                                                                    style={{ width: `${percentage}%`, backgroundColor: dept.color }}
                                                                ></div>
                                                            </div>
                                                            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                                                {dept.items.toLocaleString()} รายการ
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })()}
                    </div>

                    {/* สถานะสินค้าคงคลัง */}
                    <div className={cardClass}>
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                                        สถานะสินค้าคงคลัง
                                    </h4>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        สรุปสถานะสินค้าแยกตามประเภท
                                    </p>
                                </div>
                            </div>
                            <div className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                                <span className="text-blue-700 dark:text-blue-300 text-sm font-medium">
                                    {categoryStats.length} ประเภท
                                </span>
                            </div>
                        </div>

                        <div className="space-y-3 max-h-80 overflow-y-auto mb-4 flex-1 min-h-0
                [&::-webkit-scrollbar]:w-1.5
                [&::-webkit-scrollbar-track]:bg-gray-100
                [&::-webkit-scrollbar-track]:rounded-full
                [&::-webkit-scrollbar-thumb]:bg-gray-300
                [&::-webkit-scrollbar-thumb]:rounded-full
                dark:[&::-webkit-scrollbar-track]:bg-gray-700
                dark:[&::-webkit-scrollbar-thumb]:bg-gray-500">
                            {categoryStats.map((category) => {
                                const totalItems = category.totalItems || 0;
                                const lowStockCount = category.lowStock || 0;
                                const outOfStockCount = category.outOfStock || 0;
                                const normalStockCount = Math.max(totalItems - lowStockCount - outOfStockCount, 0);

                                const normalPercent = totalItems ? (normalStockCount / totalItems) * 100 : 0;
                                const lowPercent = totalItems ? (lowStockCount / totalItems) * 100 : 0;
                                const outPercent = totalItems ? (outOfStockCount / totalItems) * 100 : 0;

                                return (
                                    <div key={category.category} className="p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 hover:border-blue-200 dark:hover:border-blue-700 transition-all duration-200 shadow-sm">
                                        <div className="flex justify-between items-center mb-2">
                                            <div className="flex items-center space-x-2">
                                                <div className="text-xl">{getCategoryIcon(category.category)}</div>
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{category.category}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{totalItems} รายการ</p>
                                                </div>
                                            </div>
                                            <div className="flex space-x-1">
                                                {normalStockCount > 0 && (
                                                    <div className="text-center">
                                                        <div className="text-green-500 text-lg">●</div>
                                                        <p className="text-xs text-gray-500">{normalStockCount}</p>
                                                    </div>
                                                )}
                                                {lowStockCount > 0 && (
                                                    <div className="text-center">
                                                        <div className="text-amber-500 text-lg">●</div>
                                                        <p className="text-xs text-gray-500">{lowStockCount}</p>
                                                    </div>
                                                )}
                                                {outOfStockCount > 0 && (
                                                    <div className="text-center">
                                                        <div className="text-red-500 text-lg">●</div>
                                                        <p className="text-xs text-gray-500">{outOfStockCount}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700 mb-1 flex overflow-hidden">
                                            {normalPercent > 0 && <div className="bg-green-500 transition-all duration-500 ease-out" style={{ width: `${normalPercent}%` }} />}
                                            {lowPercent > 0 && <div className="bg-amber-500 transition-all duration-500 ease-out" style={{ width: `${lowPercent}%` }} />}
                                            {outPercent > 0 && <div className="bg-red-500 transition-all duration-500 ease-out" style={{ width: `${outPercent}%` }} />}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                            <div className="grid grid-cols-4 gap-2 text-center">
                                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                        {categoryStats.reduce((sum, cat) => sum + (cat.totalItems || 0), 0).toLocaleString()}
                                    </p>
                                    <p className="text-xs text-blue-700 dark:text-blue-300">สินค้าทั้งหมด</p>
                                </div>
                                <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                                    <p className="text-lg font-bold text-green-600 dark:text-green-400">
                                        {categoryStats.reduce((sum, cat) => sum + Math.max((cat.totalItems || 0) - (cat.lowStock || 0) - (cat.outOfStock || 0), 0), 0).toLocaleString()}
                                    </p>
                                    <p className="text-xs text-green-700 dark:text-green-300">ปกติ</p>
                                </div>
                                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                                    <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
                                        {categoryStats.reduce((sum, cat) => sum + (cat.lowStock || 0), 0).toLocaleString()}
                                    </p>
                                    <p className="text-xs text-amber-700 dark:text-amber-300">ต่ำกว่าจุดสั่ง</p>
                                </div>
                                <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                                    <p className="text-lg font-bold text-red-600 dark:text-red-400">
                                        {categoryStats.reduce((sum, cat) => sum + (cat.outOfStock || 0), 0).toLocaleString()}
                                    </p>
                                    <p className="text-xs text-red-700 dark:text-red-300">หมดสต็อก</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* งบประมาณที่ใช้ไป */}
                    <div className={cardClass}>
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                                        งบประมาณที่ใช้ไป
                                    </h4>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        สรุปค่าใช้จ่ายตามหมวดหมู่
                                    </p>
                                </div>
                            </div>
                            <div className="px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-100 dark:border-emerald-800">
                                <span className="text-emerald-700 dark:text-emerald-300 text-sm font-medium">
                                    ฿{totalAmount.toLocaleString()}
                                </span>
                            </div>
                        </div>

                        {/* Budget Items List */}
                        <div className="space-y-2 max-h-80 overflow-y-auto mb-4 flex-1 min-h-0
                            [&::-webkit-scrollbar]:w-1.5
                            [&::-webkit-scrollbar-track]:bg-gray-100
                            [&::-webkit-scrollbar-track]:rounded-full
                            [&::-webkit-scrollbar-thumb]:bg-gray-300
                            [&::-webkit-scrollbar-thumb]:rounded-full
                            dark:[&::-webkit-scrollbar-track]:bg-gray-700
                            dark:[&::-webkit-scrollbar-thumb]:bg-gray-500">
                            {budget
                                .filter(item => item.amount > 0)
                                .slice(0, 5)
                                .map((item, index) => {
                                    const percent = totalAmount ? (item.amount / totalAmount) * 100 : 0;
                                    const categoryIcons = ['📦', '⚡', '🔧', '🛠️', '📊', '💡', '🔩', '📐'];

                                    return (
                                        <div key={index} className="group p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600/50 transition-all duration-200 shadow-sm">
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="flex items-center space-x-2 flex-1">
                                                    <div className="w-6 h-6 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-md flex items-center justify-center shadow-sm">
                                                        <span className="text-xs">{categoryIcons[index] || '📦'}</span>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                                                            {item.category}
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                            {item.quantity.toLocaleString()} ชิ้น
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs font-bold text-gray-900 dark:text-white">
                                                        ฿{item.amount.toLocaleString()}
                                                    </p>
                                                    <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                                        {percent.toFixed(0)}%
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-600">
                                                <div
                                                    className="h-1.5 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-700 ease-out"
                                                    style={{ width: `${percent}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    );
                                })}

                            {budget.filter(item => item.amount > 0).length === 0 && (
                                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                    <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-sm">ยังไม่มีข้อมูลการใช้จ่าย</p>
                                </div>
                            )}
                        </div>

                        {/* Summary Section */}
                        <div className="space-y-3">
                            {/* Statistics Overview */}
                            <div className="grid grid-cols-3 gap-2 text-center">
                                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700">
                                    <p className="text-base font-bold text-blue-600 dark:text-blue-400">
                                        {budget.filter(item => item.amount > 0).length}
                                    </p>
                                    <p className="text-xs text-blue-700 dark:text-blue-300">หมวดหมู่</p>
                                </div>
                                <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700">
                                    <p className="text-base font-bold text-green-600 dark:text-green-400">
                                        {budget.reduce((sum, item) => sum + item.quantity, 0).toLocaleString()}
                                    </p>
                                    <p className="text-xs text-green-700 dark:text-green-300">ชิ้นทั้งหมด</p>
                                </div>
                                <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700">
                                    <p className="text-base font-bold text-purple-600 dark:text-purple-400">
                                        ฿{totalAmount.toLocaleString()}
                                    </p>
                                    <p className="text-xs text-purple-700 dark:text-purple-300">รวมมูลค่า</p>
                                </div>
                            </div>

                            {/* Top Categories & Summary */}
                            <div className="grid grid-cols-2 gap-2">
                                {/* Top Category */}
                                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200 dark:border-purple-700">
                                    <div className="flex items-center space-x-1 mb-1">
                                        <div className="w-5 h-5 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-md flex items-center justify-center">
                                            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                            </svg>
                                        </div>
                                        <h5 className="text-xs font-semibold text-gray-900 dark:text-white">สูงสุด</h5>
                                    </div>
                                    {(() => {
                                        const maxByAmount = budget.reduce((max, item) =>
                                            item.amount > max.amount ? item : max,
                                            { category: '-', amount: 0, quantity: 0 }
                                        );
                                        const maxPercent = totalAmount ? (maxByAmount.amount / totalAmount) * 100 : 0;

                                        return (
                                            <div className="space-y-1">
                                                <p className="text-xs font-bold text-purple-600 dark:text-purple-400 truncate">
                                                    {maxByAmount.category}
                                                </p>
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className="text-gray-500">฿{maxByAmount.amount.toLocaleString()}</span>
                                                    <span className="font-medium text-purple-500">{maxPercent.toFixed(0)}%</span>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>

                                {/* Average per Item */}
                                <div className="p-2 rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-700">
                                    <div className="flex items-center space-x-1 mb-1">
                                        <div className="w-5 h-5 bg-gradient-to-br from-amber-500 to-orange-500 rounded-md flex items-center justify-center">
                                            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <h5 className="text-xs font-semibold text-gray-900 dark:text-white">เฉลี่ย/ชิ้น</h5>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-amber-600 dark:text-amber-400">
                                            ฿{totalAmount > 0 ? (totalAmount / budget.reduce((sum, item) => sum + item.quantity, 1)).toFixed(2) : '0.00'}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            ต่อชิ้นสินค้า
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </>
    );
};

export default BottomSide;
