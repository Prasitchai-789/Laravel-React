import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Truck, CalendarIcon, Loader2, Save, Plus, CheckCircle2, BadgeDollarSign, TrendingUp, TrendingDown, Archive } from 'lucide-react';
import CountUp from 'react-countup';
import { GlassCard } from '@/components/Production/ProductionKPICards';
import AppLayout from '@/layouts/app-layout';

// interfaces
interface DeliveryPlanItem {
    id: number;
    order_id: number;
    plan_date: string;
    quantity: number;
}

interface Order {
    id: number;
    cust_id: number | null;
    cust_code: string | null;
    customer_name: string;
    dest_cust_id: number | null;
    dest_cust_code: string | null;
    dest_cust_name: string | null;
    good_id: number | null;
    good_code: string | null;
    product: string;
    quantity: number;
    price_sell: number;
    price_customer: number;
    is_completed: boolean;
    total_planned: number | null; // All scheduled items
    total_delivered: number | null; // Scheduled items where date <= Today
    delivery_plan_items: DeliveryPlanItem[];
}

interface EditableCellProps {
    orderId: number;
    date: string;
    initialValue: number;
    onSave: (orderId: number, date: string, value: number) => Promise<boolean>;
}

// EditableCell Sub-component
const EditableCell: React.FC<EditableCellProps> = ({ orderId, date, initialValue, onSave }) => {
    const [value, setValue] = useState<string>(initialValue > 0 ? initialValue.toString() : '');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!isSaving) {
            setValue(initialValue > 0 ? initialValue.toString() : '');
        }
    }, [initialValue, isSaving]);

    const handleBlur = async () => {
        const numValue = parseFloat(value) || 0;
        if (numValue !== initialValue) {
            setIsSaving(true);
            const success = await onSave(orderId, date, numValue);
            setIsSaving(false);
            if (!success) {
                setValue(initialValue > 0 ? initialValue.toString() : '');
            } else {
                setValue(numValue > 0 ? numValue.toString() : '');
            }
        } else {
            setValue(initialValue > 0 ? initialValue.toString() : '');
        }
    };

    return (
        <div className="relative flex items-center justify-center">
            <input
                type="number"
                disabled={isSaving}
                className={`w-full text-center px-1 py-1.5 border-b-2 bg-transparent focus:outline-none transition-colors
                    ${isSaving ? 'text-slate-400 border-slate-200' : 'text-blue-700 border-blue-200 focus:border-blue-500 font-semibold'}
                `}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onBlur={handleBlur}
                onFocus={(e) => e.target.select()}
                placeholder=""
            />
            {isSaving && (
                <div className="absolute right-1">
                    <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />
                </div>
            )}
        </div>
    );
};

export default function DeliveryPlanPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [dates, setDates] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentDateString, setCurrentDateString] = useState(new Date().toISOString().split('T')[0]);

    // Lookup states
    const [selectedProduct, setSelectedProduct] = useState<string>('น้ำมันปาล์มดิบ');
    const [lookupCustomers, setLookupCustomers] = useState<any[]>([]);
    const [lookupGoods, setLookupGoods] = useState<any[]>([]);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newOrder, setNewOrder] = useState({
        cust_id: '',
        cust_code: '',
        customer_name: '',
        dest_cust_id: '',
        dest_cust_code: '',
        dest_cust_name: '',
        good_id: '',
        good_code: '',
        product: '',
        quantity: '',
        price_sell: '',
        price_customer: ''
    });

    useEffect(() => {
        fetchData(currentDateString);
        fetchLookups();
    }, [currentDateString]);

    const fetchLookups = async () => {
        try {
            const res = await axios.get('/api/delivery-plan/lookups');
            setLookupCustomers(res.data.customers);

            // Custom sort order for goods
            const order = [
                'น้ำมันปาล์มดิบ',
                'เมล็ดในปาล์ม',
                'กะลาปาล์ม',
                'ทะลายสับ',
                'ใยปาล์ม'
            ];

            const sortedGoods = [...res.data.goods].sort((a, b) => {
                const indexA = order.indexOf(a.GoodName1);
                const indexB = order.indexOf(b.GoodName1);

                if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                if (indexA !== -1) return -1;
                if (indexB !== -1) return 1;
                return a.GoodName1.localeCompare(b.GoodName1);
            });

            setLookupGoods(sortedGoods);
        } catch (error) {
            console.error('Error fetching lookups', error);
        }
    };

    const fetchData = async (dateStr: string) => {
        try {
            setLoading(true);
            const res = await axios.get(`/api/delivery-plan/${dateStr}`);
            setDates(res.data.dates);
            const fetchedOrders = res.data.orders;
            setOrders(fetchedOrders);

            // AUTO-SELECT PRODUCT logic:
            // If the current selectedProduct has no orders, and there are orders available,
            // find the first product that actually has orders and switch to it.
            if (fetchedOrders.length > 0) {
                const currentProductOrders = fetchedOrders.filter((o: Order) => o.product === selectedProduct);
                if (currentProductOrders.length === 0) {
                    const firstAvailableProduct = fetchedOrders[0].product;
                    if (firstAvailableProduct) {
                        setSelectedProduct(firstAvailableProduct);
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching delivery plan', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveCell = async (orderId: number, date: string, value: number) => {
        try {
            const res = await axios.post('/api/delivery-plan/update', {
                order_id: orderId,
                date: date,
                quantity: value
            });

            if (res.data.success) {
                setOrders(prevOrders =>
                    prevOrders.map(order => {
                        if (order.id === orderId) {
                            const newItems = [...order.delivery_plan_items];
                            const existingIdx = newItems.findIndex(i => i.plan_date === date);
                            const oldValue = existingIdx >= 0 ? Number(newItems[existingIdx].quantity) : 0;
                            const diff = value - oldValue;

                            if (existingIdx >= 0) {
                                newItems[existingIdx].quantity = value;
                            } else if (value > 0) {
                                newItems.push({ id: 0, order_id: orderId, plan_date: date, quantity: value });
                            }

                            // Reactive Metrics Update:
                            const todayStr = new Date().toISOString().split('T')[0];
                            const isPast = date < todayStr;

                            return { 
                                ...order, 
                                delivery_plan_items: newItems,
                                total_planned: (Number(order.total_planned) || 0) + diff,
                                total_delivered: isPast ? (Number(order.total_delivered) || 0) + diff : order.total_delivered
                            };
                        }
                        return order;
                    })
                );
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error auto saving', error);
            return false;
        }
    };

    const handleCreateOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await axios.post('/api/delivery-plan/order', newOrder);
            if (res.data.success) {
                setOrders([...orders, res.data.order]);
                setIsModalOpen(false);
                setNewOrder({
                    cust_id: '', cust_code: '', customer_name: '',
                    dest_cust_id: '', dest_cust_code: '', dest_cust_name: '',
                    good_id: '', good_code: '', product: '',
                    quantity: '', price_sell: '', price_customer: ''
                });
            }
        } catch (error) {
            console.error('Error creating order', error);
            alert('Failed to create order. Please check the input.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCompleteOrder = async (orderId: number) => {
        if (!confirm('ยืนยันว่า Order นี้ส่งครบแล้วและต้องการปิด/ซ่อนออกจากตาราง?')) return;
        try {
            const res = await axios.post('/api/delivery-plan/order/complete', { order_id: orderId });
            if (res.data.success) {
                setOrders(orders.filter(o => o.id !== orderId));
            }
        } catch (error) {
            console.error('Error completing order', error);
            alert('Failed to complete order.');
        }
    };

    const dObj = (dateStr: string) => {
        const d = new Date(dateStr);
        const weekday = d.toLocaleDateString('th-TH', { weekday: 'short' });
        const dateMonth = d.toLocaleDateString('th-TH', { day: '2-digit', month: 'short' });
        return (
            <div className="flex flex-col items-center leading-tight">
                <span className="text-blue-300 text-[12px] uppercase tracking-widest font-semibold mb-0.5">{weekday}</span>
                <span className="text-cyan-100 text-sm font-bold tracking-tight">{dateMonth}</span>
            </div>
        );
    };

    const formatNum = (num: number, decimals: number = 2) => {
        return (Number(num) || 0).toLocaleString('en-US', { 
            minimumFractionDigits: decimals, 
            maximumFractionDigits: decimals 
        });
    };

    const filteredOrders = orders.filter(o => o.product === selectedProduct);
    const totalOrderKg = filteredOrders.reduce((sum, order) => sum + (Number(order.quantity) * 1000), 0);
    const totalSellRevenue = filteredOrders.reduce((sum, order) => sum + (Number(order.quantity) * 1000 * order.price_sell), 0);
    const totalCustRevenue = filteredOrders.reduce((sum, order) => sum + (Number(order.quantity) * 1000 * order.price_customer), 0);

    const avgSellPrice = totalOrderKg > 0 ? (totalSellRevenue / totalOrderKg) : 0;
    const avgCustPrice = totalOrderKg > 0 ? (totalCustRevenue / totalOrderKg) : 0;
    const priceDiff = avgCustPrice - avgSellPrice;

    const totalTodayPlanned = filteredOrders.reduce((sum, order) => {
        const item = order.delivery_plan_items.find(i => i.plan_date && i.plan_date.substring(0, 10) === currentDateString);
        return sum + (item ? Number(item.quantity) : 0);
    }, 0);
    const trailersCount = Math.round(totalTodayPlanned / 32);

    const totalOrderedQty = filteredOrders.reduce((sum, order) => sum + (Number(order.quantity) || 0), 0);
    // Dynamic 'Total Planned': Sum of items visible in the current 7-day table
    const totalPlannedAll = filteredOrders.reduce((sum, order) => {
        const viewSum = order.delivery_plan_items.reduce((itemSum, item) => itemSum + (Number(item.quantity) || 0), 0);
        return sum + viewSum;
    }, 0);
    const totalDeliveredQty = filteredOrders.reduce((sum, order) => sum + (Number(order.total_delivered) || 0), 0);
    const totalRemainingQty = Math.max(0, totalOrderedQty - totalDeliveredQty);

    return (
        <AppLayout breadcrumbs={[{ title: 'Sales & Marketing', href: '#' }, { title: 'Delivery Plan Table', href: '#' }]}>
            <div className="min-h-screen bg-gradient-to-br from-blue-50/40 via-white to-slate-50/40 p-4 md:p-4 lg:p-6 font-anuphan space-y-6">

                {/* HEAD CARD */}
                <div className="bg-white/40 backdrop-blur-md rounded-3xl p-4 border border-white/60 shadow-sm mb-2">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        {/* 1. Branding & Current Selection */}
                        <div className="flex items-center gap-4">
                            <div className="flex-shrink-0 p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 shadow-xl shadow-blue-500/20 text-white">
                                <Truck className="w-8 h-8" />
                            </div>
                            <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                    <h1 className="text-4xl font-black tracking-tight text-slate-800">Delivery Plan</h1>
                                    <span className="text-[10px] font-black bg-blue-600 text-white px-2 py-0.5 rounded-lg shadow-sm">ISANPALM</span>
                                </div>
                                <p className="text-slate-800 font-bold text-md flex items-center gap-2">
                                    <CalendarIcon className="w-4 h-4 text-blue-400" />
                                    {new Date(currentDateString).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </p>
                            </div>
                        </div>

                        {/* 2. Product Navigation (Pill Style) */}
                        {!loading && lookupGoods.length > 0 && (
                            <div className="flex-1 flex justify-center">
                                <div className="inline-flex items-center p-2 bg-slate-100/50 backdrop-blur-sm rounded-2xl border border-slate-200/50 shadow-inner">
                                    {lookupGoods.map((g, idx) => (
                                        <button
                                            key={`filter-btn-${idx}`}
                                            onClick={() => setSelectedProduct(g.GoodName1)}
                                            className={`px-4 py-2 rounded-xl font-bold text-[11px] uppercase tracking-wider transition-all duration-300 ${selectedProduct === g.GoodName1
                                                ? 'bg-blue-600 text-white shadow-md ring-1 ring-slate-100'
                                                : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
                                                }`}
                                        >
                                            {g.GoodName1}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 3. Global Actions & Date Picker */}
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 bg-slate-100/50 p-2 rounded-2xl border border-slate-200/50 shadow-inner">
                                <div className="flex items-center gap-2 pl-2">
                                    <CalendarIcon className="w-4 h-4 text-slate-400" />
                                </div>
                                <input
                                    type="date"
                                    value={currentDateString}
                                    onChange={(e) => setCurrentDateString(e.target.value)}
                                    className="bg-transparent border-0 rounded-xl px-2 py-1.5 text-slate-700 font-black text-xs focus:ring-0 transition-all cursor-pointer"
                                />
                            </div>
                            
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-2xl font-black text-xs transition-all duration-200 flex items-center gap-2 shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 transform hover:scale-[1.02]"
                            >
                                <Plus className="w-4 h-4" />
                                <span className="uppercase tracking-widest">เพิ่ม Order</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* FINANCIAL KPI CARDS - MODERN DASHBOARD DESIGN */}
                {!loading && filteredOrders.length > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-2">
                        {/* 1. Financial Overview Card */}
                        <GlassCard className="col-span-1 relative overflow-hidden border-0 bg-white shadow-xl hover:shadow-2xl transition-all duration-500 group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
                            <div className="p-5 relative z-10 flex flex-col h-full">
                                <div className="flex justify-between items-center mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 rounded-2xl bg-blue-600 shadow-lg shadow-blue-500/20">
                                            <BadgeDollarSign className="w-3 h-3 text-white" />
                                        </div>
                                        <div className=''>
                                            <p className="text-xl font-black text-slate-800">ราคาขายเฉลี่ย</p>
                                        </div>
                                    </div>
                                    <div className={`px-4 py-2 rounded-2xl shadow-sm border font-black text-sm flex items-center gap-2 ${priceDiff >= 0 ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-rose-50 border-rose-100 text-rose-600'}`}>
                                        {priceDiff > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                        {priceDiff.toFixed(2)} ฿/kg
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6 flex-1">
                                    <div className="space-y-1">
                                        <p className="text-sm font-bold text-slate-800 uppercase">ราคาขายรวม</p>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-4xl font-black text-slate-800 tracking-tight">
                                                <CountUp key={totalSellRevenue} end={totalSellRevenue / 1000000} duration={2} decimals={2} />
                                            </span>
                                            <span className="text-sm font-bold text-slate-400">MB</span>
                                        </div>
                                        <div className="pt-3 flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                            <span className="text-sm font-bold text-slate-500">เฉลี่ย </span>
                                            <span className="text-md font-black text-blue-600">{avgSellPrice.toFixed(2)}</span>
                                            <span className="text-sm font-bold text-slate-400">฿</span>
                                        </div>
                                    </div>

                                    <div className="space-y-1 border-l border-slate-100 pl-6">
                                        <p className="text-sm font-bold text-slate-800 uppercase">ราคาลูกค้ารวม</p>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-4xl font-black text-emerald-600 tracking-tight">
                                                <CountUp key={totalCustRevenue} end={totalCustRevenue / 1000000} duration={2} decimals={2} />
                                            </span>
                                            <span className="text-sm font-bold text-slate-400">MB</span>
                                        </div>
                                        <div className="pt-3 flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                            <span className="text-sm font-bold text-slate-500">เฉลี่ย </span>
                                            <span className="text-md font-black text-emerald-600">{avgCustPrice.toFixed(2)}</span>
                                            <span className="text-sm font-bold text-slate-400">฿</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </GlassCard>

                        {/* 2. Daily Logistics Card */}
                        <GlassCard className="col-span-1 relative overflow-hidden border-0 bg-white shadow-xl hover:shadow-2xl transition-all duration-500 group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
                            <div className="p-5 relative z-10 flex flex-col h-full">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 rounded-2xl bg-cyan-600 shadow-lg shadow-cyan-500/20">
                                        <Truck className="w-3 h-3 text-white" />
                                    </div>
                                    <div className=''>
                                        <p className="text-xl font-black text-slate-800">แผนการจัดส่งวันนี้</p>
                                    </div>
                                </div>

                                <div className="flex-1">
                                    <div className="flex items-center justify-between mt-4">
                                        <div className="flex flex-col  ml-8">
                                            <p className="text-sm font-bold text-slate-800 uppercase mb-1">น้ำหนักรวม</p>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-5xl font-black text-slate-800 tracking-tight">
                                                    <CountUp key={totalTodayPlanned} end={totalTodayPlanned} duration={1.5} decimals={0} />
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-600 uppercase">Tons</span>
                                            </div>
                                        </div>
                                        <div className="h-12 w-[1px] bg-slate-100"></div>
                                        <div className="flex flex-col items-end  mr-8">
                                            <p className="text-sm font-bold text-cyan-800 uppercase mb-1">จำนวนรถ</p>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-5xl font-black text-cyan-700 tracking-tight">
                                                    <CountUp key={trailersCount} end={trailersCount} duration={1.5} decimals={0} />
                                                </span>
                                                <span className="text-[10px] font-bold text-blue-800 uppercase">คัน</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-2 rounded-2xl bg-slate-50/80 border border-slate-100 flex flex-wrap gap-2 min-h-[80px] content-start mt-2">
                                        {trailersCount > 0 ? (
                                            <>
                                                {Array.from({ length: Math.min(trailersCount, 21) }).map((_, i) => (
                                                    <div key={i} className="p-1 rounded-lg bg-white shadow-sm border border-slate-100 transition-all hover:scale-110 hover:border-cyan-300">
                                                        <Truck className="w-5 h-5 text-cyan-600" />
                                                    </div>
                                                ))}
                                                {trailersCount > 21 && (
                                                    <div className="flex items-center justify-center bg-cyan-600 text-white rounded-lg px-2.5 py-1 text-[10px] font-black shadow-sm">
                                                        +{trailersCount - 21}
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center py-4">
                                                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">No schedule for today</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </GlassCard>

                        {/* 3. Pipeline Card */}
                        <GlassCard className="col-span-1 relative overflow-hidden border-0 bg-white shadow-xl hover:shadow-2xl transition-all duration-500 group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
                            <div className="p-4 relative z-10 flex flex-col h-full">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 rounded-2xl bg-emerald-600 shadow-lg shadow-emerald-500/20">
                                        <Archive className="w-3 h-3 text-white" />
                                    </div>
                                    <div className=''>
                                        <p className="text-xl font-black text-slate-800">สถานะการสั่งซื้อ</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 mt-2 mb-2">
                                    <div className="p-2 rounded-2xl bg-emerald-50/50 border border-emerald-100 text-center">
                                        <p className="text-sm font-bold text-emerald-800 uppercase tracking-widest mb-1 text-center">ทั้งหมด</p>
                                        <div className="font-black text-5xl text-emerald-800 tracking-tight">
                                            <CountUp end={totalOrderedQty} duration={1.5} decimals={0} />
                                            <span className="text-[12px] ml-1 opacity-60">Tons</span>
                                        </div>
                                    </div>
                                    <div className="p-2 rounded-2xl bg-blue-50/50 border border-blue-100 text-center">
                                        <p className="text-sm font-bold text-blue-800 uppercase tracking-widest mb-1 text-center">ลงคิวรวม</p>
                                        <div className="font-black text-5xl text-blue-800 tracking-tight">
                                            <CountUp end={totalPlannedAll} duration={1.5} decimals={0} />
                                            <span className="text-[12px] ml-1 opacity-60">Tons</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2 flex-1">
                                    <div>
                                        <div className="flex justify-between items-end mb-1">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Progress (ส่งแล้ว)</span>
                                            <span className="text-xl font-black text-emerald-600">
                                                {totalOrderedQty > 0 ? ((totalDeliveredQty / totalOrderedQty) * 100).toFixed(1) : 0}%
                                            </span>
                                        </div>
                                        <div className="relative h-4 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner border border-slate-200">
                                            {/* Blue: Total Planned (upcoming) */}
                                            <div 
                                                className="absolute top-0 left-0 h-full bg-blue-300 transition-all duration-1000 ease-out"
                                                style={{ width: `${totalOrderedQty > 0 ? (totalPlannedAll / totalOrderedQty) * 100 : 0}%` }}
                                            />
                                            {/* Green: Already Delivered (Past/Today) */}
                                            <div 
                                                className="absolute top-0 left-0 h-full bg-emerald-500 transition-all duration-1000 ease-out shadow-sm"
                                                style={{ width: `${totalOrderedQty > 0 ? (totalDeliveredQty / totalOrderedQty) * 100 : 0}%` }}
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none"></div>
                                        </div>
                                        <div className="flex justify-between mt-1 text-[9px] font-bold">
                                            <div className="flex items-center gap-1 text-emerald-600">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> ส่งแล้ว
                                            </div>
                                            <div className="flex items-center gap-1 text-blue-400">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-300"></div> จองคิวล่วงหน้า
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-slate-50 flex items-center justify-between">
                                    <div>
                                        <p className="text-lg font-bold text-rose-500 uppercase mb-0.5">ค้างจัดส่ง</p>
                                    </div>
                                    <div className="flex items-baseline gap-1 text-rose-600">
                                        <span className="text-4xl font-black tracking-tight">
                                            <CountUp end={totalRemainingQty} duration={1.5} decimals={0} />
                                        </span>
                                        <span className="text-sm font-bold opacity-60">Tons</span>
                                    </div>
                                </div>
                            </div>
                        </GlassCard>
                    </div>
                )}

                {/* TABLE SECTION */}
                <div className="bg-white overflow-hidden rounded-2xl shadow-lg border border-blue-100">
                    {loading ? (
                        <div className="flex justify-center items-center py-20">
                            <div className="flex flex-col items-center gap-3">
                                <div className="border-4 border-blue-200 border-t-blue-600 animate-spin w-12 h-12 rounded-full"></div>
                                <span className="text-blue-600 font-medium">กำลังโหลดข้อมูล...</span>
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gradient-to-r from-blue-800 to-blue-700 text-white">
                                        <th className="py-4 px-4 font-bold whitespace-nowrap text-left rounded-tl-2xl">Customer & Destination</th>
                                        <th className="py-2 px-4 font-bold text-center border-l border-blue-600 leading-tight">Order<br />Qty</th>
                                        <th className="py-2 px-4 font-bold text-center border-l border-blue-600 leading-tight">Sell<br />Price</th>
                                        <th className="py-2 px-4 font-bold text-center border-l border-blue-600 leading-tight">Cust.<br />Price</th>
                                        <th className="py-4 px-4 font-bold whitespace-nowrap text-center border-l border-blue-500/50 text-blue-200">Planned</th>
                                        <th className="py-4 px-4 font-bold whitespace-nowrap text-center border-l border-red-500/50 text-red-200">Remaining</th>
                                        <th className="py-4 px-2 font-bold whitespace-nowrap text-center border-l border-blue-600">Action</th>
                                        {dates.map(date => (
                                            <th key={date} className="py-4 px-3 font-bold whitespace-nowrap text-center border-l border-blue-600 bg-blue-700/50 text-cyan-300">
                                                {dObj(date)}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-blue-50">
                                    {filteredOrders.map((order, idx) => {
                                        const sumPlanned = Number(order.total_planned) || 0;
                                        const sumDelivered = Number(order.total_delivered) || 0;
                                        const remainingDelivered = Number(order.quantity) - sumDelivered;

                                        return (
                                            <tr key={order.id} className={`hover:bg-blue-50/50 transition-colors duration-150 ${idx % 2 === 0 ? 'bg-white' : 'bg-blue-50/30'}`}>
                                                <td className="py-3 px-4 whitespace-nowrap">
                                                    <div className="font-bold text-slate-800 text-sm tracking-tight">{order.customer_name}</div>
                                                    {order.dest_cust_name && (
                                                        <div className="text-[11px] font-bold text-blue-600 mt-1 flex items-center gap-1.5 opacity-90">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></div>
                                                            {order.dest_cust_name}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 font-semibold text-slate-600 text-center border-l border-blue-50">
                                                    {formatNum(order.quantity, 0)}
                                                </td>
                                                <td className="py-3 px-4 text-slate-500 text-center border-l border-blue-50">
                                                    {formatNum(order.price_sell, 2)}
                                                </td>
                                                <td className="py-3 px-4 text-slate-500 text-center border-l border-blue-50">
                                                    {formatNum(order.price_customer, 2)}
                                                </td>
                                                <td className="py-3 px-4 font-bold text-center whitespace-nowrap border-l border-blue-100 bg-blue-50/50 text-blue-700">
                                                    <div className="flex flex-col">
                                                        <span>{formatNum(sumPlanned, 0)}</span>
                                                        <span className="text-[10px] opacity-40 font-normal">All Planned</span>
                                                    </div>
                                                </td>
                                                <td className={`py-3 px-4 font-black text-center whitespace-nowrap border-l border-red-100 bg-red-50/50 
                                                    ${remainingDelivered < 0 ? 'text-red-600' : remainingDelivered === 0 ? 'text-emerald-600' : 'text-orange-500'}`}
                                                >
                                                    {formatNum(Math.max(0, remainingDelivered), 0)}
                                                </td>
                                                <td className="py-3 px-2 text-center whitespace-nowrap border-l border-blue-100 bg-blue-50/30">
                                                    <button
                                                        onClick={() => handleCompleteOrder(order.id)}
                                                        disabled={remainingDelivered > 0}
                                                        className={`p-1.5 rounded-lg transition-all ${remainingDelivered <= 0 ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-500 hover:text-white shadow-sm' : 'bg-slate-100 text-slate-300 cursor-not-allowed opacity-50'}`}
                                                        title={remainingDelivered <= 0 ? "ปิดแจ้งจัดส่งครบแล้ว" : "ยอดจัดส่งยังไม่ครบจำนวน"}
                                                    >
                                                        <CheckCircle2 className="w-5 h-5" />
                                                    </button>
                                                </td>
                                                {dates.map(date => {
                                                    const planItem = order.delivery_plan_items.find(i => i.plan_date && i.plan_date.substring(0, 10) === date);
                                                    const val = planItem ? planItem.quantity : 0;

                                                    return (
                                                        <td key={date} className="px-2 py-2 border-l border-blue-50 bg-blue-50/20 min-w-[90px]">
                                                            <EditableCell
                                                                orderId={order.id}
                                                                date={date}
                                                                initialValue={val}
                                                                onSave={handleSaveCell}
                                                            />
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        );
                                    })}
                                    {filteredOrders.length === 0 && (
                                        <tr>
                                            <td colSpan={7 + dates.length} className="py-16 text-center text-slate-400 font-medium bg-blue-50/30">
                                                <div className="flex flex-col items-center gap-2">
                                                    <Truck className="w-12 h-12 text-blue-200" />
                                                    <p>No orders available for the selected range.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* CREATE ORDER MODAL - Blue Theme */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl transform transition-all border-t-4 border-blue-500">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-blue-100 rounded-xl">
                                        <Plus className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <h2 className="text-xl font-bold text-slate-800">เพิ่ม Order ใหม่</h2>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                            <form onSubmit={handleCreateOrder} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Customer Name</label>
                                    <input required list="customers-list" type="text" value={newOrder.customer_name} onChange={e => {
                                        const name = e.target.value;
                                        const c = lookupCustomers.find(x => x.CustName === name);
                                        setNewOrder({ ...newOrder, customer_name: name, cust_id: c ? c.CustID : '', cust_code: c ? c.CustCode : '' });
                                    }} className="w-full border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" placeholder="ค้นหาหรือพิมพ์ชื่อลูกค้า" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-blue-700 mb-1">Destination Customer (ปลายทางจัดส่ง)</label>
                                    <input required list="customers-list" type="text" value={newOrder.dest_cust_name} onChange={e => {
                                        const name = e.target.value;
                                        const c = lookupCustomers.find(x => x.CustName === name);
                                        setNewOrder({ ...newOrder, dest_cust_name: name, dest_cust_id: c ? c.CustID : '', dest_cust_code: c ? c.CustCode : '' });
                                    }} className="w-full border border-blue-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 bg-blue-50/30 transition-all" placeholder="ค้นหาหรือพิมพ์ปลายทางจัดส่ง" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Product</label>
                                    <input required list="goods-list" type="text" value={newOrder.product} onChange={e => {
                                        const name = e.target.value;
                                        const g = lookupGoods.find(x => x.GoodName1 === name);
                                        setNewOrder({ ...newOrder, product: name, good_id: g ? g.GoodID : '', good_code: g ? g.GoodCode : '' });
                                    }} className="w-full border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 transition-all" placeholder="เลือกสินค้า" />
                                </div>

                                <datalist id="customers-list">
                                    {lookupCustomers.map((c, idx) => (
                                        <option key={`c-${idx}`} value={c.CustName}>{c.CustCode}</option>
                                    ))}
                                </datalist>
                                <datalist id="goods-list">
                                    {lookupGoods.map((g, idx) => (
                                        <option key={`g-${idx}`} value={g.GoodName1}>{g.GoodCode}</option>
                                    ))}
                                </datalist>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Quantity</label>
                                    <input required type="number" step="any" value={newOrder.quantity} onChange={e => setNewOrder({ ...newOrder, quantity: e.target.value })} className="w-full border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 transition-all" placeholder="จำนวน" />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Customer Price</label>
                                        <input required type="number" step="any" value={newOrder.price_customer} onChange={e => setNewOrder({ ...newOrder, price_customer: e.target.value })} className="w-full border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 transition-all" placeholder="ราคาลูกค้า" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Sell Price</label>
                                        <input required type="number" step="any" value={newOrder.price_sell} onChange={e => setNewOrder({ ...newOrder, price_sell: e.target.value })} className="w-full border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 transition-all" placeholder="ราคาขาย" />
                                    </div>
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors">
                                        ยกเลิก
                                    </button>
                                    <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold rounded-xl hover:from-blue-700 hover:to-blue-600 transition-all duration-200 flex justify-center items-center shadow-md">
                                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'บันทึก'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}