import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
    Package, 
    Droplets, 
    Leaf, 
    Trees, 
    Flower2,
    Clock,
    CheckCircle2,
    TrendingUp,
    RefreshCw,
    PieChart,
    BarChart3,
    Download,
    Eye,
    EyeOff,
    Target,
    XCircle,
    CheckCircle
} from 'lucide-react';

interface PlanOrder {
    id: number;
    status: 'pending' | 'confirmed' | 'production' | 'completed' | 'cancelled';
    priority?: 'normal' | 'high' | 'urgent';
    productType?: string;
    productName?: string;
    netWeight?: number;
}

interface Props {
    orders: PlanOrder[];
    onRefresh?: () => void;
    onExport?: () => void;
    onProductSelect?: (productType: string | null) => void;
    selectedProduct?: string | null;
}

export default function PlanOrderSummary({ 
    orders, 
    onRefresh, 
    onExport, 
    onProductSelect,
    selectedProduct: externalSelectedProduct
}: Props) {
    const [showDetails, setShowDetails] = useState(false);
    const [animateNumber, setAnimateNumber] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [autoRefresh, setAutoRefresh] = useState(false);
    
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Auto refresh with fixed 30-second interval
    useEffect(() => {
        if (autoRefresh && onRefresh) {
            intervalRef.current = setInterval(() => {
                onRefresh();
            }, 30000);
        }
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [autoRefresh, onRefresh]);

    // คำนวณสถิติ
    const stats = useMemo(() => {
        const total = orders.length;
        const completed = orders.filter(o => o.status === 'completed').length;
        const pending = orders.filter(o => o.status === 'pending').length;
        const production = orders.filter(o => o.status === 'production').length;
        const confirmed = orders.filter(o => o.status === 'confirmed').length;
        const cancelled = orders.filter(o => o.status === 'cancelled').length;

        return {
            total,
            completed,
            pending,
            production,
            confirmed,
            cancelled,
            completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
            remaining: total - completed,
            efficiency: total > 0 ? Math.round((completed / (production || 1)) * 100) : 0
        };
    }, [orders]);

    // คำนวณข้อมูลสินค้า
    const products = useMemo(() => {
        const productList = [
            { 
                key: 'cpo', 
                name: 'น้ำมันปาล์มดิบ', 
                icon: <Droplets className="h-5 w-5" />, 
                color: 'amber', 
                unit: 'ตัน',
                bgLight: 'bg-amber-50',
                border: 'border-amber-200',
                text: 'text-amber-700'
            },
            { 
                key: 'kernel', 
                name: 'เมล็ดในปาล์ม', 
                icon: <Flower2 className="h-5 w-5" />, 
                color: 'emerald', 
                unit: 'กก.',
                bgLight: 'bg-emerald-50',
                border: 'border-emerald-200',
                text: 'text-emerald-700'
            },
            { 
                key: 'shell', 
                name: 'กะลาปาล์ม', 
                icon: <Package className="h-5 w-5" />, 
                color: 'stone', 
                unit: 'ตัน',
                bgLight: 'bg-stone-50',
                border: 'border-stone-200',
                text: 'text-stone-700'
            },
            { 
                key: 'efb', 
                name: 'ทะลายสับ', 
                icon: <Trees className="h-5 w-5" />, 
                color: 'lime', 
                unit: 'ตัน',
                bgLight: 'bg-lime-50',
                border: 'border-lime-200',
                text: 'text-lime-700'
            },
            { 
                key: 'fiber', 
                name: 'ใยปาล์ม', 
                icon: <Leaf className="h-5 w-5" />, 
                color: 'orange', 
                unit: 'กก.',
                bgLight: 'bg-orange-50',
                border: 'border-orange-200',
                text: 'text-orange-700'
            }
        ];

        return productList.map(product => {
            const productOrders = orders.filter(o => o.productType === product.key);
            const count = productOrders.length;
            const completed = productOrders.filter(o => o.status === 'completed').length;
            const pending = productOrders.filter(o => o.status === 'pending').length;
            const cancelled = productOrders.filter(o => o.status === 'cancelled').length;
            
            return {
                ...product,
                count,
                completed,
                pending,
                cancelled,
                progress: count > 0 ? Math.round((completed / count) * 100) : 0
            };
        });
    }, [orders]);

    // Animation เมื่อตัวเลขเปลี่ยน
    useEffect(() => {
        setAnimateNumber(true);
        const timer = setTimeout(() => setAnimateNumber(false), 500);
        return () => clearTimeout(timer);
    }, [stats.total, stats.completed]);

    // ฟังก์ชันแจ้งเตือน
    const showNotification = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 p-3 rounded-lg shadow-lg z-50 ${
            type === 'success' ? 'bg-green-500' :
            type === 'error' ? 'bg-red-500' : 'bg-blue-500'
        } text-white text-sm animate-slideIn`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('animate-slideOut');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }, []);

    // ส่งออกข้อมูล
    const handleExport = useCallback(() => {
        if (onExport) {
            onExport();
        } else {
            const dataStr = JSON.stringify({ stats, products, timestamp: new Date() }, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
            const exportFileDefaultName = `summary-${new Date().toISOString()}.json`;
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
            showNotification('ส่งออกข้อมูลสำเร็จ', 'success');
        }
    }, [stats, products, onExport, showNotification]);

    // จัดรูปแบบตัวเลข
    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('th-TH').format(num);
    };

    // ฟังก์ชันเลือกสินค้า - ถ้าคลิกซ้ำให้ล้าง filter
    const handleProductClick = (productKey: string | null) => {
        // ถ้าคลิกสินค้าเดิมที่มีอยู่แล้ว ให้ส่ง null เพื่อล้าง filter
        // ถ้าคลิกสินค้าใหม่ ให้ส่ง productKey ใหม่
        const newSelection = productKey === externalSelectedProduct ? null : productKey;
        
        if (onProductSelect) {
            onProductSelect(newSelection);
            
            // แสดงข้อความแจ้งเตือน
            if (newSelection === null) {
                showNotification('ล้างตัวกรองสินค้า', 'info');
            } else {
                const productName = products.find(p => p.key === newSelection)?.name;
                showNotification(`แสดงเฉพาะ ${productName}`, 'success');
            }
        }
    };

    return (
        <div className="space-y-3 mb-4 relative">
         

            {/* Main Stats Cards */}
            <div className="grid grid-cols-4 gap-2">
                {/* Total Orders */}
                <div 
                    className="bg-blue-500 text-white p-3 rounded-lg cursor-pointer hover:bg-blue-600 transition-colors"
                    onClick={() => handleProductClick(null)}
                    title="คลิกเพื่อล้างตัวกรอง"
                >
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-blue-100">ทั้งหมด</div>
                        <Package className="h-4 w-4 text-blue-200" />
                    </div>
                    <div className={`text-2xl font-bold ${animateNumber ? 'scale-110' : ''}`}>
                        {formatNumber(stats.total)}
                    </div>
                   
                </div>

                {/* Completed */}
                <div className="bg-green-500 text-white p-3 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-green-100">เสร็จสิ้น</div>
                        <CheckCircle className="h-4 w-4 text-green-200" />
                    </div>
                    <div className="text-2xl font-bold">{formatNumber(stats.completed)}</div>
                    <div className="mt-2 text-[10px] text-green-100">{stats.completionRate}%</div>
                </div>

                {/* In Progress */}
                <div className="bg-yellow-500 text-white p-3 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-yellow-100">กำลังดำเนินการ</div>
                        <TrendingUp className="h-4 w-4 text-yellow-200" />
                    </div>
                    <div className="text-2xl font-bold">{formatNumber(stats.production + stats.confirmed)}</div>
                    <div className="mt-2 text-[10px] text-yellow-100">
                        ผลิต {stats.production} | ยืนยัน {stats.confirmed}
                    </div>
                </div>

                {/* Cancelled - เปลี่ยนเป็นสีเทา */}
                <div className="bg-red-500 text-white p-3 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-gray-100">ยกเลิก</div>
                        <XCircle className="h-4 w-4 text-gray-200" />
                    </div>
                    <div className="text-2xl font-bold">{formatNumber(stats.cancelled)}</div>
                    <div className="mt-2 text-[10px] text-gray-100">
                        {stats.cancelled > 0 ? 'มีรายการยกเลิก' : 'ไม่มีรายการ'}
                    </div>
                </div>
            </div>

            {/* Products Grid/List */}
            {viewMode === 'grid' ? (
                <div className="grid grid-cols-5 gap-2">
                    {products.map((product) => {
                        const isSelected = externalSelectedProduct === product.key;

                        return (
                            <div
                                key={product.key}
                                className={`
                                    ${product.bgLight} border ${product.border} 
                                    rounded-lg p-2 cursor-pointer
                                    ${isSelected ? `ring-2 ring-${product.color}-500 shadow-md bg-white` : 'hover:bg-white hover:shadow'}
                                    transition-all
                                `}
                                onClick={() => handleProductClick(product.key)}
                                title={isSelected ? 'คลิกเพื่อล้างตัวกรอง' : `เลือกเฉพาะ ${product.name}`}
                            >
                                <div className="relative">
                                    {/* Header */}
                                    <div className="flex items-center justify-between mb-2">
                                        <div className={`p-1.5 rounded-lg bg-white ${product.text}`}>
                                            {product.icon}
                                        </div>
                                        <span className={`text-[8px] px-1.5 py-0.5 rounded-full bg-white ${product.text}`}>
                                            {product.unit}
                                        </span>
                                    </div>

                                    {/* Name */}
                                    <p className="text-xs font-medium text-gray-800 mb-1 truncate">
                                        {product.name}
                                    </p>

                                    {/* Count */}
                                    <div className="flex items-baseline justify-between mb-2">
                                        <span className={`text-lg font-bold ${product.text}`}>
                                            {formatNumber(product.count)}
                                        </span>
                                        <span className="text-[9px] text-gray-500">
                                            {product.progress}%
                                        </span>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="w-full h-1 bg-gray-200 rounded-full mb-2">
                                        <div 
                                            className={`h-full bg-${product.color}-500 rounded-full`}
                                            style={{ width: `${product.progress}%` }}
                                        />
                                    </div>

                                    {/* Stats */}
                                    <div className="flex items-center justify-between text-[8px]">
                                        <span className="flex items-center gap-0.5 text-green-600">
                                            <CheckCircle2 className="h-2.5 w-2.5" /> {product.completed}
                                        </span>
                                        <span className="flex items-center gap-0.5 text-yellow-600">
                                            <Clock className="h-2.5 w-2.5" /> {product.pending}
                                        </span>
                                        {product.cancelled > 0 && (
                                            <span className="flex items-center gap-0.5 text-gray-500">
                                                <XCircle className="h-2.5 w-2.5" /> {product.cancelled}
                                            </span>
                                        )}
                                    </div>

                                    {/* Selected indicator - แสดงเมื่อถูกเลือก */}
                                    {isSelected && (
                                        <div className="absolute -top-1 -right-1">
                                            <span className="flex h-3 w-3">
                                                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500 animate-pulse"></span>
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* List View */
                <div className="bg-white rounded-lg border border-gray-200">
                    <div className="grid grid-cols-7 gap-2 bg-gray-50 p-2 text-[10px] font-medium text-gray-600 border-b">
                        <div className="col-span-2">สินค้า</div>
                        <div className="text-right">จำนวน</div>
                        <div className="text-right">เสร็จ</div>
                        <div className="text-right">รอ</div>
                        <div className="text-right">ยกเลิก</div>
                        <div className="text-right">ความคืบหน้า</div>
                    </div>
                    {products.map((product) => (
                        <div 
                            key={product.key} 
                            className={`grid grid-cols-7 gap-2 p-2 text-xs border-b last:border-0 hover:bg-gray-50 cursor-pointer transition-colors ${
                                externalSelectedProduct === product.key ? 'bg-blue-50' : ''
                            }`}
                            onClick={() => handleProductClick(product.key)}
                            title={externalSelectedProduct === product.key ? 'คลิกเพื่อล้างตัวกรอง' : `เลือกเฉพาะ ${product.name}`}
                        >
                            <div className="col-span-2 flex items-center gap-2">
                                <div className={`p-1 rounded ${product.bgLight} ${product.text}`}>
                                    {product.icon}
                                </div>
                                <span className="font-medium">{product.name}</span>
                                {externalSelectedProduct === product.key && (
                                    <span className="ml-1 text-blue-600 text-[8px]">✓</span>
                                )}
                            </div>
                            <div className="text-right font-bold">{formatNumber(product.count)}</div>
                            <div className="text-right text-green-600">{formatNumber(product.completed)}</div>
                            <div className="text-right text-yellow-600">{formatNumber(product.pending)}</div>
                            <div className="text-right text-red-500">{formatNumber(product.cancelled || 0)}</div>
                            <div className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                    <span>{product.progress}%</span>
                                    <div className="w-16 h-1 bg-gray-200 rounded-full">
                                        <div 
                                            className={`h-full bg-${product.color}-500 rounded-full`}
                                            style={{ width: `${product.progress}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

        

            {/* แสดงข้อความเมื่อมีตัวกรอง */}
            {externalSelectedProduct && (
                <div className="text-[10px] text-center bg-blue-50 py-1.5 rounded-lg border border-blue-200 animate-pulse">
                    <span className="text-blue-700">
                        กำลังแสดงเฉพาะ: {products.find(p => p.key === externalSelectedProduct)?.name}
                        <button 
                            onClick={() => handleProductClick(null)}
                            className="ml-2 text-blue-800 hover:text-blue-900 font-medium"
                        >
                            ✕ ล้าง
                        </button>
                    </span>
                </div>
            )}
        </div>
    );
}