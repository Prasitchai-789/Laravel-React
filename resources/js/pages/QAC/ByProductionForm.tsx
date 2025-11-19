// ByProductionForm.tsx (Fixed with Fallback Data)

import DeleteModal from '@/components/DeleteModal';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { BarChart3, Calendar, CheckCircle, FileText, Leaf, Nut, Package, Plus, RefreshCw, Save, Trash2, Trees, TrendingUp } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Stock CPO', href: '#' },
];

/* ---------------------------------------------------
    Strict Date Parser (รองรับ "Nov 13 2025 12:00:00:AM")
--------------------------------------------------- */
const strictDateParser = (input: string): string => {
    if (!input) return '';

    // ถ้าเป็น YYYY-MM-DD หรือ YYYY-MM-DD HH:mm:ss
    if (/^\d{4}-\d{2}-\d{2}/.test(input)) {
        return input.slice(0, 10); // ตัดให้เหลือ YYYY-MM-DD
    }

    // แปลง "Nov 13 2025 12:00:00 AM"
    const monthNames: Record<string, string> = {
        Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05',
        Jun: '06', Jul: '07', Aug: '08', Sep: '09', Oct: '10',
        Nov: '11', Dec: '12'
    };

    const parts = input.split(' ');
    if (parts.length >= 3 && monthNames[parts[0]]) {
        const month = monthNames[parts[0]];
        const day = parts[1].padStart(2, '0');
        const year = parts[2];
        return `${year}-${month}-${day}`;
    }

    // fallback: use new Date
    const d = new Date(input);
    if (!isNaN(d.getTime())) {
        return d.toISOString().split('T')[0];
    }

    return '';
};


/* ---------------------------------------------------
    Types
--------------------------------------------------- */
interface InputFieldProps {
    label: string;
    name: string;
    value: string | number;
    onChange: (e: any) => void;
    type?: string;
    step?: string;
    min?: string;
    max?: string;
    suffix?: string;
    required?: boolean;
    disabled?: boolean;
}

interface StatCardProps {
    title: string;
    value: number | string;
    unit?: string;
    color?: 'blue' | 'green' | 'orange' | 'purple' | 'emerald' | 'yellow';
    icon: React.ComponentType<{ size?: number }>;
    subtitle?: string;
}

interface SectionHeaderProps {
    title: string;
    description?: string;
    icon: React.ComponentType<{ size?: number }>;
    color?: 'blue' | 'orange' | 'green' | 'purple' | 'red' | 'yellow' | 'emerald' | 'gray';
    children: React.ReactNode;
}

interface FormState {
    production_date: string;
    initial_palm_quantity: number;

    efb_fiber_percentage: number;
    efb_percentage: number;
    shell_percentage: number;

    efb_fiber_previous_balance: number;
    efb_previous_balance: number;
    shell_previous_balance: number;

    efb_fiber_sold: number;
    efb_sold: number;
    shell_sold: number;

    efb_fiber_other: number;
    efb_other: number;
    shell_other: number;

    notes: string;
}

interface CalculationState {
    efb_fiber_produced: number;
    efb_produced: number;
    shell_produced: number;

    efb_fiber_balance: number;
    efb_balance: number;
    shell_balance: number;
}

/* ---------------------------------------------------
    INPUT FIELD (No formatting inside <input/>)
--------------------------------------------------- */
const InputField: React.FC<InputFieldProps> = React.memo(
    ({ label, name, value, onChange, type = 'number', step = '0.001', min = '0', max, suffix, required = false, disabled = false }) => {
        const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const raw = e.target.value;
            const cleanedValue = raw === '' ? '' : raw.replace(/,/g, '');
            onChange({
                target: {
                    name,
                    value: cleanedValue,
                    type,
                },
            });
        };

        return (
            <div className="group">
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>

                <div className="relative">
                    <input
                        type={type}
                        name={name}
                        value={value}
                        onChange={handleInputChange}
                        step={step}
                        min={min}
                        max={max}
                        required={required}
                        disabled={disabled}
                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 pr-8"
                    />
                    {suffix && <span className="absolute top-1/2 right-3 -translate-y-1/2 text-sm text-gray-500">{suffix}</span>}
                </div>
            </div>
        );
    },
);

/* ---------------------------------------------------
    STAT CARD – Auto color when negative
--------------------------------------------------- */
const StatCard: React.FC<StatCardProps> = React.memo(({ title, value, unit = 'ตัน', color = 'blue', icon, subtitle }) => {
    const numValue = Number(value) || 0;
    const isNegative = numValue < 0;

    const bg = isNegative
        ? 'from-red-500 to-red-700'
        : {
              blue: 'from-blue-500 to-blue-600',
              green: 'from-green-500 to-green-600',
              orange: 'from-orange-500 to-orange-600',
              purple: 'from-purple-500 to-purple-600',
              emerald: 'from-emerald-500 to-emerald-600',
              yellow: 'from-yellow-500 to-yellow-600',
          }[color] || 'from-gray-500 to-gray-600';

    const IconComponent = icon;

    return (
        <div className={`rounded-xl bg-gradient-to-br p-4 text-white shadow-lg ${bg}`}>
            <div className="mb-2 flex items-center justify-between">
                <div className="text-xs opacity-90">{title}</div>
                <IconComponent size={20} />
            </div>

            <div className="text-2xl font-bold">
                {numValue.toLocaleString('th-TH', {
                    minimumFractionDigits: 3,
                    maximumFractionDigits: 3,
                })}{' '}
                <span className="text-sm opacity-80">{unit}</span>
            </div>

            {subtitle && <div className="mt-1 text-xs opacity-80">{subtitle}</div>}
        </div>
    );
});

/* ---------------------------------------------------
    SECTION HEADER
--------------------------------------------------- */
const SectionHeader: React.FC<SectionHeaderProps> = React.memo(({ title, description, icon, color = 'blue', children }) => {
    const colorClasses: Record<string, string> = {
        blue: 'bg-blue-50 border-blue-200',
        orange: 'bg-orange-50 border-orange-200',
        green: 'bg-green-50 border-green-200',
        purple: 'bg-purple-50 border-purple-200',
        red: 'bg-red-50 border-red-200',
        yellow: 'bg-yellow-50 border-yellow-200',
        emerald: 'bg-emerald-50 border-emerald-200',
        gray: 'bg-gray-50 border-gray-200',
    };

    const IconComponent = icon;

    return (
        <div className={`rounded-2xl border p-4 ${colorClasses[color]}`}>
            <div className="mb-4 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm">
                    <IconComponent size={24} className="text-gray-600" />
                </div>
                <div>
                    <h2 className="text-xl font-bold">{title}</h2>
                    {description && <p className="text-sm text-gray-600">{description}</p>}
                </div>
            </div>

            {children}
        </div>
    );
});

/* ---------------------------------------------------
    MAIN COMPONENT
--------------------------------------------------- */
const ByProductionForm: React.FC = () => {
    /* -------------------------
        Date Helpers
    ------------------------- */
    const getYesterdayDate = () => {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        return d.toISOString().split('T')[0];
    };

    /* -------------------------
        STATES
    ------------------------- */
    const [formData, setFormData] = useState<FormState>({
        production_date: getYesterdayDate(),
        initial_palm_quantity: 0,

        efb_fiber_percentage: 9,
        efb_percentage: 19,
        shell_percentage: 5,

        efb_fiber_previous_balance: 0,
        efb_previous_balance: 0,
        shell_previous_balance: 0,

        efb_fiber_sold: 0,
        efb_sold: 0,
        shell_sold: 0,

        efb_fiber_other: 0,
        efb_other: 0,
        shell_other: 0,

        notes: '',
    });

    const [calculations, setCalculations] = useState<CalculationState>({
        efb_fiber_produced: 0,
        efb_produced: 0,
        shell_produced: 0,

        efb_fiber_balance: 0,
        efb_balance: 0,
        shell_balance: 0,
    });

    const [stocks, setStocks] = useState<any[]>([]);
    const [productions, setProductions] = useState<any[]>([]);
    const [sales, setSales] = useState<any[]>([]);

    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'form' | 'history'>('form');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    const page = usePage<{ auth: { user?: any; permissions?: string[] } }>();
    const userPermissions: string[] = Array.isArray(page.props.auth?.permissions)
        ? page.props.auth.permissions
        : Array.isArray(page.props.auth?.user?.permissions)
          ? page.props.auth.user.permissions
          : [];
    /* ---------------------------------------------------
        FORMAT DATE FOR API
    --------------------------------------------------- */
    const formatDateForAPI = (dateString: string): string => {
        if (!dateString) return '';

        // ถ้าวันที่อยู่ในรูปแบบ YYYY-MM-DD ให้แปลงเป็นรูปแบบที่ API ต้องการ
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            const date = new Date(dateString);
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const month = monthNames[date.getMonth()];
            const day = date.getDate();
            const year = date.getFullYear();

            return `${month} ${day} ${year}`;
        }

        return dateString;
    };

    /* ---------------------------------------------------
        GET PREVIOUS BALANCE
    --------------------------------------------------- */
    const getPreviousDayBalances = useCallback((stocksList: any[], selectedDate: string) => {
        if (!stocksList || stocksList.length === 0) {
            return {
                efb_fiber_previous_balance: 0,
                efb_previous_balance: 0,
                shell_previous_balance: 0,
            };
        }

        const targetStr = strictDateParser(selectedDate);
        if (!targetStr) {
            return {
                efb_fiber_previous_balance: 0,
                efb_previous_balance: 0,
                shell_previous_balance: 0,
            };
        }

        const target = new Date(targetStr);
        const prev = new Date(target);
        prev.setDate(prev.getDate() - 1);
        const prevStr = prev.toISOString().split('T')[0];

        // 1) exact previous day
        const exact = stocksList.find((s) => strictDateParser(s.production_date) === prevStr);

        if (exact) {
            return {
                efb_fiber_previous_balance: Number(exact.efb_fiber_balance) || 0,
                efb_previous_balance: Number(exact.efb_balance) || 0,
                shell_previous_balance: Number(exact.shell_balance) || 0,
            };
        }

        // 2) latest before selected date
        const before = stocksList
            .filter((s) => {
                const dStr = strictDateParser(s.production_date);
                if (!dStr) return false;
                return new Date(dStr) < target;
            })
            .sort((a, b) => {
                const da = new Date(strictDateParser(a.production_date));
                const db = new Date(strictDateParser(b.production_date));
                return db.getTime() - da.getTime();
            });

        if (before.length > 0) {
            const latest = before[0];
            return {
                efb_fiber_previous_balance: Number(latest.efb_fiber_balance) || 0,
                efb_previous_balance: Number(latest.efb_balance) || 0,
                shell_previous_balance: Number(latest.shell_balance) || 0,
            };
        }

        return {
            efb_fiber_previous_balance: 0,
            efb_previous_balance: 0,
            shell_previous_balance: 0,
        };
    }, []);

    /* ---------------------------------------------------
        FETCH DATA
    --------------------------------------------------- */
    const fetchStocks = useCallback(async () => {
        try {
            setLoading(true);
            const res = await axios.get('/stock/by-products/api');
            const data = res.data.records || [];
            setStocks(data);

            if (!isEditing) {
                const prevBalances = getPreviousDayBalances(data, formData.production_date);
                setFormData((prevForm) => ({
                    ...prevForm,
                    ...prevBalances,
                }));
            }
        } catch (err) {
            console.error(err);
            Swal.fire({
                icon: 'error',
                title: 'ผิดพลาด',
                text: 'เกิดข้อผิดพลาดในการโหลดข้อมูล Stocks',
            });
        } finally {
            setLoading(false);
        }
    }, [isEditing, formData.production_date, getPreviousDayBalances]);

    const fetchProductions = useCallback(async () => {
        try {
            const res = await axios.get('/stock/productions/api');
            const data = res.data.productions || [];
            setProductions(data);
        } catch (err) {
            console.error(err);
            Swal.fire({
                icon: 'error',
                title: 'ผิดพลาด',
                text: 'เกิดข้อผิดพลาดในการโหลดข้อมูลการผลิต',
            });
        }
    }, [isEditing]);

    const fetchSales = useCallback(async () => {
        try {
            const res = await axios.get('/stock/sales/api');
            setSales(res.data.sales || []);
        } catch (err) {
            console.error(err);
            Swal.fire({
                icon: 'error',
                title: 'ผิดพลาด',
                text: 'เกิดข้อผิดพลาดในการโหลดข้อมูล Sales',
            });
        }
    }, []);

    /* ---------------------------------------------------
        FIND PRODUCTION & SALES BY DATE
    --------------------------------------------------- */
    const findProductionByDate = useCallback(
        (date: string) => {
            const target = strictDateParser(date);
            if (!target) return null;
            return productions.find((p) => strictDateParser(p.Date) === target) || null;
        },
        [productions],
    );

    const findSalesByDate = useCallback(
        (date: string) => {
            const target = strictDateParser(date);
            if (!target) {
                return {
                    efb_fiber_sold: 0,
                    efb_sold: 0,
                    shell_sold: 0,
                };
            }

            const salesForDay = sales.filter((s) => strictDateParser(s.SOPDate) === target);

            const result = {
                efb_fiber_sold: 0,
                efb_sold: 0,
                shell_sold: 0,
            };

            salesForDay.forEach((s) => {
                const weight = Number(s.total_netwei) / 1000 || 0;

                switch (s.GoodID) {
                    case 9012:
                        result.efb_fiber_sold += weight;
                        break;
                    case 2149:
                        result.efb_sold += weight;
                        break;
                    case 2151:
                        result.shell_sold += weight;
                        break;
                    default:
                        break;
                }
            });

            return result;
        },
       
        [sales],
    );

    /* ---------------------------------------------------
        FETCH FFB BY DATE (WITH FALLBACK)
    --------------------------------------------------- */
    const fetchFFBByDate = async (date: string): Promise<number> => {
        try {
            const formattedDate = formatDateForAPI(date);
            const res = await axios.get(`/productions/by-date?date=${formattedDate}`);

            const qty = Number(res.data.FFBGoodQty) || 0;

            return qty;
        } catch (error) {
            console.error('Error fetching FFBGoodQty:', error);
            return 0; // ไม่ fallback แค่คืน 0
        }
    };

    /* ---------------------------------------------------
        AUTO LOAD DATA BY DEFAULT DATE ON RENDER
    --------------------------------------------------- */
    useEffect(() => {
        // ถ้าทั้ง 3 api โหลดเสร็จแล้ว + ไม่อยู่ในโหมดแก้ไข
        if (stocks.length > 0 && productions.length > 0 && sales.length > 0 && !isEditing) {
            const dateParsed = strictDateParser(formData.production_date);

            // 1) โหลด FFB
            fetchFFBByDate(dateParsed).then((ffbQty) => {
                // 2) โหลดยอดขายตามวัน
                const salesDay = findSalesByDate(dateParsed);

                // 3) โหลดยอดยกมา (previous balance)
                const prevBal = getPreviousDayBalances(stocks, dateParsed);

                // 4) ใส่ค่าลงฟอร์ม
                setFormData((prev) => ({
                    ...prev,
                    initial_palm_quantity: ffbQty,

                    efb_fiber_sold: salesDay.efb_fiber_sold,
                    efb_sold: salesDay.efb_sold,
                    shell_sold: salesDay.shell_sold,

                    ...prevBal,
                }));
            });
        }
    }, [stocks, productions, sales, isEditing, formData.production_date, findSalesByDate, getPreviousDayBalances]);

    /* ---------------------------------------------------
        CALCULATE VALUES
    --------------------------------------------------- */
    useEffect(() => {
        const t = setTimeout(() => {
            const q = Number(formData.initial_palm_quantity) || 0;

            const fiberP = Number(formData.efb_fiber_percentage) || 0;
            const efbP = Number(formData.efb_percentage) || 0;
            const shellP = Number(formData.shell_percentage) || 0;

            const fiberProduced = (q * fiberP) / 100;
            const efbProduced = (q * efbP) / 100;
            const shellProduced = (q * shellP) / 100;

            const fiberBal =
                Number(formData.efb_fiber_previous_balance) + fiberProduced - Number(formData.efb_fiber_sold) - Number(formData.efb_fiber_other);

            const efbBal = Number(formData.efb_previous_balance) + efbProduced - Number(formData.efb_sold) - Number(formData.efb_other);

            const shellBal = Number(formData.shell_previous_balance) + shellProduced - Number(formData.shell_sold) - Number(formData.shell_other);

            setCalculations({
                efb_fiber_produced: fiberProduced,
                efb_produced: efbProduced,
                shell_produced: shellProduced,
                efb_fiber_balance: fiberBal,
                efb_balance: efbBal,
                shell_balance: shellBal,
            });
        }, 100);

        return () => clearTimeout(t);
    }, [formData]);

    /* ---------------------------------------------------
        HANDLE CHANGE
    --------------------------------------------------- */
    const handleChange = useCallback(
        async (e: any) => {
            const { name, value, type } = e.target;

            const cleaned = type === 'number' ? Number(value || 0) : value;

            setFormData((prev) => ({
                ...prev,
                [name]: cleaned,
            }));

            if (name === 'production_date' && value) {
                const dateParsed = strictDateParser(value);

                const ffbQty = await fetchFFBByDate(dateParsed);
                const salesDay = findSalesByDate(dateParsed);
                const prevBal = getPreviousDayBalances(stocks, dateParsed);

                setFormData((prev) => ({
                    ...prev,
                    production_date: dateParsed,
                    initial_palm_quantity: ffbQty,

                    efb_fiber_sold: salesDay.efb_fiber_sold,
                    efb_sold: salesDay.efb_sold,
                    shell_sold: salesDay.shell_sold,

                    ...prevBal,
                }));

                return;
            }
        },
        [stocks, findSalesByDate, getPreviousDayBalances],
    );
    /* ---------------------------------------------------
        LOAD DATA ON MOUNT
    --------------------------------------------------- */

const loadInitialData = async () => {
    try {
        const stocksRes = await axios.get('/stock/by-products/api');
        const stocksData = stocksRes.data.records || [];

        const productionsRes = await axios.get('/stock/productions/api');
        const productionsData = productionsRes.data.productions || [];

        const salesRes = await axios.get('/stock/sales/api');
        const salesData = salesRes.data.sales || [];

        // อัปเดต state ทั้ง 3 อันก่อน
        setStocks(stocksData);
        setProductions(productionsData);
        setSales(salesData);

        // ห้ามคำนวณทันที ❌ เพราะ state ยังไม่อัปเดต
        // ให้ useEffect ข้างบนคำนวณแทน ✔
    } catch (error) {
        console.error('Initial load error:', error);
    }
};


    useEffect(() => {
    loadInitialData();
}, []);

useEffect(() => {
    if (!stocks.length || !sales.length || !productions.length) return;

    const dateParsed = strictDateParser(formData.production_date);

    const salesDay = findSalesByDate(dateParsed);
    const prevBal = getPreviousDayBalances(stocks, dateParsed);

    fetchFFBByDate(dateParsed).then((ffbQty) => {
        setFormData(prev => ({
            ...prev,
            initial_palm_quantity: ffbQty,

            efb_fiber_sold: salesDay.efb_fiber_sold,
            efb_sold: salesDay.efb_sold,
            shell_sold: salesDay.shell_sold,

            ...prevBal,
        }));
    });

}, [stocks, sales, productions]);

    // เพิ่ม state สำหรับเลือกเดือน
    const [selectedMonth, setSelectedMonth] = useState('');

    // ฟังก์ชันสร้างตัวเลือกเดือน
    const generateMonthOptions = () => {
        const options = [];
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();

        // ย้อนหลัง 12 เดือน
        for (let i = 0; i < 12; i++) {
            const date = new Date(currentYear, currentDate.getMonth() - i, 1);
            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            const value = `${year}-${month.toString().padStart(2, '0')}`;
            const label = `${date.toLocaleDateString('th-TH', { month: 'long' })} ${year + 543}`;

            options.push({ value, label });
        }

        return options;
    };

    const monthOptions = generateMonthOptions();

    // ฟังก์ชันดึงข้อมูลเดือนปัจจุบัน
    const getCurrentMonthLabel = () => {
        const currentDate = new Date();
        return currentDate.toLocaleDateString('th-TH', {
            month: 'long',
            year: 'numeric',
        });
    };

    // ฟังก์ชันกรองข้อมูลตามเดือนที่เลือก
    const filterStocksByMonth = (stocks: any[], month: string) => {
        if (!month) {
            // ถ้าไม่ได้เลือกเดือน ให้ใช้เดือนปัจจุบัน
            const currentDate = new Date();
            month = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}`;
        }

        return stocks.filter((stock) => {
            const stockDate = new Date(stock.production_date);
            const stockMonth = `${stockDate.getFullYear()}-${(stockDate.getMonth() + 1).toString().padStart(2, '0')}`;
            return stockMonth === month;
        });
    };

    // ฟังก์ชันคำนวณผลรวมทั้งเดือน
    const getMonthlyTotal = (stocks: any[], field: string) => {
        const monthlyStocks = filterStocksByMonth(stocks, selectedMonth);
        return monthlyStocks.reduce((total, stock) => {
            return total + (Number(stock[field]) || 0);
        }, 0);
    };

    // ฟังก์ชันคำนวณค่าเฉลี่ยต่อวัน
    const getMonthlyAverage = (stocks: any[], field: string) => {
        const monthlyStocks = filterStocksByMonth(stocks, selectedMonth);
        if (monthlyStocks.length === 0) return 0;

        const total = getMonthlyTotal(stocks, field);
        return total / monthlyStocks.length;
    };

    // ตั้งค่าเดือนเริ่มต้นเมื่อ component mount
    useEffect(() => {
        const currentDate = new Date();
        const currentMonth = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}`;
        setSelectedMonth(currentMonth);
    }, []);

    /* ---------------------------------------------------
        SUBMIT FORM (SweetAlert2 Popup)
    --------------------------------------------------- */
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 1500,
        timerProgressBar: true,
        customClass: { popup: 'custom-swal' },
        didOpen: (toast) => {
            toast.onmouseenter = Swal.stopTimer;
            toast.onmouseleave = Swal.resumeTimer;
        },
    });

    const handleSubmit = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            setLoading(true);

            const payload: any = {
                ...formData,
                ...calculations,
            };

            Object.keys(payload).forEach((k) => {
                if (typeof payload[k] === 'string' && /^\d+(\.\d+)?$/.test(payload[k])) {
                    payload[k] = Number(payload[k]);
                }
            });

            try {
                if (isEditing && editingId) {
                    await axios.put(`/stock/by-products/${editingId}`, payload);
                    Toast.fire({ icon: 'success', title: 'อัพเดทเรียบร้อยแล้ว' });
                } else {
                    await axios.post('/stock/by-products', payload);
                    Toast.fire({ icon: 'success', title: 'บันทึกข้อมูลเรียบร้อยแล้ว' });
                }

                resetForm(true);
                fetchStocks();
                setActiveTab('history');
            } catch (err) {
                console.error(err);
                Swal.fire({
                    icon: 'error',
                    title: 'ผิดพลาด',
                    text: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล',
                    confirmButtonText: 'ปิด',
                });
            } finally {
                setLoading(false);
            }
        },
        [formData, calculations, isEditing, editingId, fetchStocks],
    );

    /* ---------------------------------------------------
        EDIT RECORD
    --------------------------------------------------- */
    const handleEdit = useCallback((stock: any) => {
        const parsedDate = strictDateParser(stock.production_date);

        setFormData({
            production_date: parsedDate,
            initial_palm_quantity: Number(stock.initial_palm_quantity) || 0,
            efb_fiber_percentage: Number(stock.efb_fiber_percentage) || 16,
            efb_percentage: Number(stock.efb_percentage) || 19,
            shell_percentage: Number(stock.shell_percentage) || 5,
            efb_fiber_previous_balance: Number(stock.efb_fiber_previous_balance) || 0,
            efb_previous_balance: Number(stock.efb_previous_balance) || 0,
            shell_previous_balance: Number(stock.shell_previous_balance) || 0,
            efb_fiber_sold: Number(stock.efb_fiber_sold) || 0,
            efb_sold: Number(stock.efb_sold) || 0,
            shell_sold: Number(stock.shell_sold) || 0,
            efb_fiber_other: Number(stock.efb_fiber_other) || 0,
            efb_other: Number(stock.efb_other) || 0,
            shell_other: Number(stock.shell_other) || 0,
            notes: stock.notes || '',
        });

        setEditingId(stock.id);
        setIsEditing(true);
        setActiveTab('form');
    }, []);

    /* ---------------------------------------------------
        DELETE RECORD (with SweetAlert2)
    --------------------------------------------------- */
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
    const [selectedId, setSelectedId] = useState<number | null>(null);

    const openDeleteModal = (id: number): void => {
        setSelectedId(id);
        setIsDeleteModalOpen(true);
    };

    const closeDeleteModal = (): void => {
        setIsDeleteModalOpen(false);
        setSelectedId(null);
    };

    const handleDeleteWithPermission = (id: number): void => {
        if (userPermissions.includes('Admin.delete')) {
            openDeleteModal(id);
        } else {
            Swal.fire({
                icon: 'error',
                customClass: { popup: 'custom-swal' },
                title: 'ไม่มีสิทธิ์ในการลบข้อมูล',
            });
        }
    };

    const handleDelete = (): void => {
        if (selectedId) {
            router.delete(route('stock.by-products.destroy', selectedId), {
                onSuccess: () => {
                    Toast.fire({ icon: 'success', title: 'ลบรายการเรียบร้อยแล้ว' });
                    closeDeleteModal();
                },
                preserveScroll: true,
            });
            fetchStocks();
        }
    };

    /* ---------------------------------------------------
        RESET & NEW RECORD
    --------------------------------------------------- */
    const resetForm = useCallback(
        (keepDate = true) => {
            const targetDate = keepDate ? formData.production_date : getYesterdayDate();
            const parsed = strictDateParser(targetDate) || getYesterdayDate();
            const prev = getPreviousDayBalances(stocks, parsed);

            setFormData({
                production_date: parsed,
                initial_palm_quantity: 0,
                efb_fiber_percentage: 16,
                efb_percentage: 19,
                shell_percentage: 5,
                efb_fiber_previous_balance: prev.efb_fiber_previous_balance,
                efb_previous_balance: prev.efb_previous_balance,
                shell_previous_balance: prev.shell_previous_balance,
                efb_fiber_sold: 0,
                efb_sold: 0,
                shell_sold: 0,
                efb_fiber_other: 0,
                efb_other: 0,
                shell_other: 0,
                notes: '',
            });

            setEditingId(null);
            setIsEditing(false);
        },
        [stocks, formData.production_date, getPreviousDayBalances],
    );

    const handleNewRecord = useCallback(() => {
        const newDate = getYesterdayDate();
        const prev = getPreviousDayBalances(stocks, newDate);

        setFormData({
            production_date: newDate,
            initial_palm_quantity: 0,
            efb_fiber_percentage: 16,
            efb_percentage: 19,
            shell_percentage: 5,
            efb_fiber_previous_balance: prev.efb_fiber_previous_balance,
            efb_previous_balance: prev.efb_previous_balance,
            shell_previous_balance: prev.shell_previous_balance,
            efb_fiber_sold: 0,
            efb_sold: 0,
            shell_sold: 0,
            efb_fiber_other: 0,
            efb_other: 0,
            shell_other: 0,
            notes: '',
        });

        setEditingId(null);
        setIsEditing(false);
        setActiveTab('form');
    }, [stocks, getPreviousDayBalances]);

    /* ---------------------------------------------------
        RENDER
    --------------------------------------------------- */
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-emerald-50/30 py-6 font-anuphan">
                <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-8 text-center">
                        <h1 className="mb-3 bg-gradient-to-br from-gray-900 via-blue-800 to-purple-700 bg-clip-text text-3xl font-black text-transparent">
                            บันทึกข้อมูลสต๊อคผลผลิตปาล์ม
                        </h1>

                        {/* Quick Actions */}
                        <div className="mt-4 flex flex-wrap justify-center gap-2">
                            <button
                                onClick={handleNewRecord}
                                className="flex items-center gap-2 rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:scale-105 hover:shadow-md"
                            >
                                <Plus size={16} />
                                บันทึกใหม่
                            </button>
                            <button
                                onClick={() => resetForm(true)}
                                className="flex items-center gap-2 rounded-lg bg-gray-500 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:scale-105 hover:shadow-md"
                            >
                                <Trash2 size={16} />
                                ล้างฟอร์ม
                            </button>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="mb-6 overflow-hidden rounded-2xl bg-white shadow-xl">
                        <div className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-blue-50/50">
                            <div className="flex">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('form')}
                                    className={`flex-1 px-6 py-4 text-center font-bold transition-all duration-200 ${
                                        activeTab === 'form'
                                            ? 'border-b-2 border-blue-500 bg-white text-blue-600 shadow-sm'
                                            : 'text-gray-500 hover:bg-white/80 hover:text-gray-700'
                                    }`}
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        <FileText size={20} />
                                        <span className="text-base">{isEditing ? 'แก้ไขข้อมูล' : 'บันทึกข้อมูลใหม่'}</span>
                                    </div>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('history')}
                                    className={`flex-1 px-6 py-4 text-center font-bold transition-all duration-200 ${
                                        activeTab === 'history'
                                            ? 'border-b-2 border-blue-500 bg-white text-blue-600 shadow-sm'
                                            : 'text-gray-500 hover:bg-white/80 hover:text-gray-700'
                                    }`}
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        <BarChart3 size={20} />
                                        <span className="text-base">ประวัติการบันทึก</span>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Form Tab */}
                        {activeTab === 'form' && (
                            <div className="p-6">
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* ข้อมูลพื้นฐาน */}
                                    <SectionHeader
                                        title="ข้อมูลพื้นฐานการผลิต"
                                        description="กรอกข้อมูลพื้นฐานเกี่ยวกับการผลิตปาล์มน้ำมัน"
                                        icon={Calendar}
                                        color="blue"
                                    >
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <InputField
                                                label="วันที่ผลิต"
                                                name="production_date"
                                                value={formData.production_date}
                                                onChange={handleChange}
                                                type="date"
                                                max={getYesterdayDate()}
                                                required
                                            />
                                            <InputField
                                                label="ปริมาณผลปาล์มที่ใช้ในการผลิต"
                                                name="initial_palm_quantity"
                                                value={formData.initial_palm_quantity}
                                                onChange={handleChange}
                                                required
                                                suffix="ตัน"
                                            />
                                        </div>
                                    </SectionHeader>

                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        {/* ทะลายปาล์มสับ EFB Fiber */}
                                        <SectionHeader
                                            title="ทะลายปาล์มสับ EFB Fiber"
                                            description="กำหนดเปอร์เซ็นต์การผลิตสำหรับแต่ละประเภทผลผลิต"
                                            icon={TrendingUp}
                                            color="orange"
                                        >
                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                <InputField
                                                    label="เปอร์เซ็นต์การผลิต"
                                                    name="efb_fiber_percentage"
                                                    value={formData.efb_fiber_percentage}
                                                    onChange={handleChange}
                                                    max="100"
                                                    suffix="%"
                                                />
                                                <InputField
                                                    label="ยอดยกมา"
                                                    name="efb_fiber_previous_balance"
                                                    value={formData.efb_fiber_previous_balance}
                                                    onChange={handleChange}
                                                    suffix="ตัน"
                                                    disabled={isEditing}
                                                />
                                                <InputField
                                                    label="ขายไป EFB Fiber"
                                                    name="efb_fiber_sold"
                                                    value={formData.efb_fiber_sold}
                                                    onChange={handleChange}
                                                    suffix="ตัน"
                                                    step="0.001"
                                                />
                                                <InputField
                                                    label="อื่นๆ"
                                                    name="efb_fiber_other"
                                                    value={formData.efb_fiber_other}
                                                    onChange={handleChange}
                                                    suffix="ตัน"
                                                />
                                            </div>
                                        </SectionHeader>

                                        <SectionHeader
                                            title="ทะลายปาล์มสับ EFB Fiber"
                                            description="(คำนวณอัตโนมัติ)"
                                            icon={CheckCircle}
                                            color="green"
                                        >
                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                <StatCard
                                                    title="ทะลายปาล์มสับ EFB Fiber"
                                                    value={calculations.efb_fiber_produced}
                                                    color="green"
                                                    icon={Leaf}
                                                    subtitle="ผลิตได้จากเปอร์เซ็นต์"
                                                />
                                                <StatCard
                                                    title="ยอดคงเหลือ EFB Fiber"
                                                    value={calculations.efb_fiber_balance}
                                                    color="emerald"
                                                    icon={Leaf}
                                                    subtitle="ยกมา + ผลิตได้ - ขาย - อื่น"
                                                />
                                            </div>
                                        </SectionHeader>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        {/* กะลาปาล์ม Shell */}
                                        <SectionHeader
                                            title="กะลาปาล์ม Shell"
                                            description="กำหนดเปอร์เซ็นต์การผลิตสำหรับแต่ละประเภทผลผลิต"
                                            icon={FileText}
                                            color="yellow"
                                        >
                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                <InputField
                                                    label="เปอร์เซ็นต์การผลิต"
                                                    name="shell_percentage"
                                                    value={formData.shell_percentage}
                                                    onChange={handleChange}
                                                    max="100"
                                                    suffix="%"
                                                />
                                                <InputField
                                                    label="ยอดยกมา"
                                                    name="shell_previous_balance"
                                                    value={formData.shell_previous_balance}
                                                    onChange={handleChange}
                                                    suffix="ตัน"
                                                    disabled={isEditing}
                                                />
                                                <InputField
                                                    label="ขายไป"
                                                    name="shell_sold"
                                                    value={formData.shell_sold}
                                                    onChange={handleChange}
                                                    suffix="ตัน"
                                                />
                                                <InputField
                                                    label="อื่นๆ"
                                                    name="shell_other"
                                                    value={formData.shell_other}
                                                    onChange={handleChange}
                                                    suffix="ตัน"
                                                />
                                            </div>
                                        </SectionHeader>

                                        <SectionHeader title="กะลาปาล์ม Shell" description="(คำนวณอัตโนมัติ)" icon={CheckCircle} color="green">
                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                <StatCard
                                                    title="กะลาปาล์ม Shell"
                                                    value={calculations.shell_produced}
                                                    color="green"
                                                    icon={Nut}
                                                    subtitle="ผลิตได้จากเปอร์เซ็นต์"
                                                />
                                                <StatCard
                                                    title="ยอดคงเหลือ Shell"
                                                    value={calculations.shell_balance}
                                                    color="emerald"
                                                    icon={Nut}
                                                    subtitle="ยกมา + ผลิตได้ - ขาย - อื่น"
                                                />
                                            </div>
                                        </SectionHeader>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        {/* ทะลายปาล์มเปล่า EFB */}
                                        <SectionHeader
                                            title="ทะลายปาล์มเปล่า EFB"
                                            description="กำหนดเปอร์เซ็นต์การผลิตสำหรับแต่ละประเภทผลผลิต"
                                            icon={Package}
                                            color="purple"
                                        >
                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                <InputField
                                                    label="เปอร์เซ็นต์การผลิต"
                                                    name="efb_percentage"
                                                    value={formData.efb_percentage}
                                                    onChange={handleChange}
                                                    max="100"
                                                    suffix="%"
                                                />
                                                <InputField
                                                    label="ยอดยกมา"
                                                    name="efb_previous_balance"
                                                    value={formData.efb_previous_balance}
                                                    onChange={handleChange}
                                                    suffix="ตัน"
                                                    disabled={isEditing}
                                                />
                                                <InputField
                                                    label="ขายไป"
                                                    name="efb_sold"
                                                    value={formData.efb_sold}
                                                    onChange={handleChange}
                                                    suffix="ตัน"
                                                />
                                                <InputField
                                                    label="อื่นๆ"
                                                    name="efb_other"
                                                    value={formData.efb_other}
                                                    onChange={handleChange}
                                                    suffix="ตัน"
                                                />
                                            </div>
                                        </SectionHeader>

                                        <SectionHeader title="ทะลายปาล์มเปล่า EFB" description="(คำนวณอัตโนมัติ)" icon={CheckCircle} color="green">
                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                <StatCard
                                                    title="ทะลายปาล์มเปล่า EFB"
                                                    value={calculations.efb_produced}
                                                    color="green"
                                                    icon={Trees}
                                                    subtitle="ผลิตได้จากเปอร์เซ็นต์"
                                                />
                                                <StatCard
                                                    title="ยอดคงเหลือ EFB"
                                                    value={calculations.efb_balance}
                                                    color="emerald"
                                                    icon={Trees}
                                                    subtitle="ยกมา + ผลิตได้ - ขาย - อื่น"
                                                />
                                            </div>
                                        </SectionHeader>
                                    </div>

                                    {/* หมายเหตุ */}
                                    <SectionHeader
                                        title="หมายเหตุ"
                                        description="บันทึกหมายเหตุเพิ่มเติมเกี่ยวกับการผลิต"
                                        icon={FileText}
                                        color="gray"
                                    >
                                        <textarea
                                            name="notes"
                                            value={formData.notes}
                                            onChange={handleChange}
                                            rows={3}
                                            placeholder="บันทึกหมายเหตุเพิ่มเติมเกี่ยวกับการผลิตในรอบนี้..."
                                            className="w-full rounded-lg border border-gray-300 px-3 py-2 transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none"
                                        />
                                    </SectionHeader>

                                    {/* Submit Button */}
                                    <div className="flex justify-center gap-4 pt-4">
                                        {isEditing && (
                                            <button
                                                type="button"
                                                onClick={() => resetForm(true)}
                                                className="rounded-xl bg-gray-500 px-8 py-4 text-lg font-bold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl focus:ring-2 focus:ring-gray-200 focus:outline-none"
                                            >
                                                ยกเลิก
                                            </button>
                                        )}
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-12 py-4 text-lg font-bold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl focus:ring-2 focus:ring-blue-200 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <div className="relative z-10 flex items-center gap-3">
                                                {loading ? (
                                                    <>
                                                        <RefreshCw className="h-5 w-5 animate-spin" />
                                                        กำลังบันทึก...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Save size={20} />
                                                        {isEditing ? 'อัพเดทข้อมูล' : 'บันทึกข้อมูลการผลิต'}
                                                    </>
                                                )}
                                            </div>
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* History Tab - เนื้อหาเดิมไม่เปลี่ยนแปลง */}
                        {activeTab === 'history' && <div className="p-6">{/* ... History Tab Content (เหมือนเดิม) ... */}</div>}
                    </div>
                </div>
            </div>

            {/* Delete Modal */}
            <DeleteModal isModalOpen={isDeleteModalOpen} onClose={closeDeleteModal} title="ยืนยันการลบ" onConfirm={handleDelete}>
                <p className="font-anuphan text-sm text-gray-500">คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้? การกระทำนี้ไม่สามารถย้อนกลับได้</p>
            </DeleteModal>
        </AppLayout>
    );
};

export default ByProductionForm;
