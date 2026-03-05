import { CheckCircle, CheckCircle2, Clock, Droplets, Flower2, Leaf, Package, Target, Trees, TrendingUp, XCircle } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface PlanOrder {
    id: number;
    status: 'pending' | 'processing' | 'production' | 'completed' | 'cancelled' | 'confirmed' | string;
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

export default function PlanOrderSummary({ orders, onRefresh, onExport, onProductSelect, selectedProduct: externalSelectedProduct }: Props) {
    const [showDetails, setShowDetails] = useState(false);
    const [animateNumber, setAnimateNumber] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [autoRefresh, setAutoRefresh] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [touchStart, setTouchStart] = useState(0);
    const [touchEnd, setTouchEnd] = useState(0);

    const slideRef = useRef<HTMLDivElement>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const PRODUCT_META: {
        [key: string]: {
            name: string;
            icon: JSX.Element;
            color: string;
            unit: string;
            bgLight: string;
            border: string;
            text: string;
        };
    } = {
        cpo: {
            name: 'น้ำมันปาล์มดิบ (CPO)',
            icon: <Droplets className="h-5 w-5" />,
            color: 'amber',
            unit: 'กก.',
            bgLight: 'bg-amber-50',
            border: 'border-amber-200',
            text: 'text-amber-700',
        },
        'palm-oil': {
            name: 'น้ำมันปาล์มบริสุทธิ์',
            icon: <Droplets className="h-5 w-5" />,
            color: 'sky',
            unit: 'กก.',
            bgLight: 'bg-sky-50',
            border: 'border-sky-200',
            text: 'text-sky-700',
        },
        'palm-kernel': {  // เปลี่ยนจาก 'kernel' เป็น 'palm-kernel'
            name: 'เมล็ดในปาล์ม',
            icon: <Flower2 className="h-5 w-5" />,
            color: 'emerald',
            unit: 'กก.',
            bgLight: 'bg-emerald-50',
            border: 'border-emerald-200',
            text: 'text-emerald-700',
        },
        shell: {
            name: 'กะลาปาล์ม',
            icon: <Package className="h-5 w-5" />,
            color: 'stone',
            unit: 'กก.',
            bgLight: 'bg-stone-50',
            border: 'border-stone-200',
            text: 'text-stone-700',
        },
        efb: {
            name: 'ทะลายสับ (EFB)',
            icon: <Trees className="h-5 w-5" />,
            color: 'lime',
            unit: 'กก.',
            bgLight: 'bg-lime-50',
            border: 'border-lime-200',
            text: 'text-lime-700',
        },
        fiber: {
            name: 'ใยปาล์ม',
            icon: <Leaf className="h-5 w-5" />,
            color: 'orange',
            unit: 'กก.',
            bgLight: 'bg-orange-50',
            border: 'border-orange-200',
            text: 'text-orange-700',
        },
        fertilizer: {
            name: 'ปุ๋ยอินทรีย์',
            icon: <Target className="h-5 w-5" />,
            color: 'purple',
            unit: 'กก.',
            bgLight: 'bg-purple-50',
            border: 'border-purple-200',
            text: 'text-purple-700',
        },
        other: {
            name: 'อื่นๆ',
            icon: <Package className="h-5 w-5" />,
            color: 'brown',
            unit: 'กก.',
            bgLight: 'bg-amber-100',
            border: 'border-amber-300',
            text: 'text-amber-800',
        },
    };

    // ฟังก์ชันจัดรูปแบบตัวเลขให้มี comma
    const formatNumber = (num: number) => {
        return num.toLocaleString('en-US');
    };

    // ฟังก์ชันจัดรูปแบบน้ำหนัก
    const formatWeight = (weight: number, unit: string = 'กก.') => {
        if (weight === 0) return '0';

        // ถ้าไม่มีน้ำหนัก
        if (!weight) return '-';

        return `${weight.toLocaleString(undefined, {
            minimumFractionDigits: weight % 1 === 0 ? 0 : 2,
            maximumFractionDigits: 2,
        })} กก.`;
    };

    // คำนวณสถิติ
    const stats = useMemo(() => {
        const total = orders.length;
        const completed = orders.filter((o) => o.status === 'completed').length;
        const pending = orders.filter((o) => o.status === 'pending').length;
        const processing = orders.filter((o) => o.status === 'processing').length;
        const production = orders.filter((o) => o.status === 'production').length;
        const confirmed = orders.filter((o) => o.status === 'confirmed').length;
        const cancelled = orders.filter((o) => o.status === 'cancelled').length;

        // คำนวณน้ำหนักรวมทั้งหมด
        const totalWeight = orders.reduce((sum, o) => sum + (o.netWeight || 0), 0);
        const completedWeight = orders.filter((o) => o.status === 'completed').reduce((sum, o) => sum + (o.netWeight || 0), 0);

        return {
            total,
            completed,
            pending,
            processing,
            production,
            confirmed,
            cancelled,
            completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
            remaining: total - completed,
            totalWeight,
            completedWeight,
            completionWeightRate: totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0,
        };
    }, [orders]);

    // แก้ไข normalizeType ให้ return 'palm-kernel' แทน 'kernel'
    const normalizeType = (type: string | undefined): string => {
        if (!type) return 'other';

        const typeLower = type.toLowerCase().trim();

        // CPO / น้ำมันปาล์มดิบ
        if (typeLower.includes('cpo') || typeLower.includes('น้ำมันปาล์มดิบ') || typeLower.includes('ปาล์มดิบ')) {
            return 'cpo';
        }

        // Palm Kernel / เมล็ดในปาล์ม - return 'palm-kernel'
        if (typeLower.includes('kernel') ||
            typeLower.includes('เมล็ด') ||
            typeLower.includes('palm-kernel') ||
            typeLower.includes('palm kernel')) {
            return 'palm-kernel';  // เปลี่ยนจาก 'kernel' เป็น 'palm-kernel'
        }

        // Palm Oil / น้ำมันปาล์มบริสุทธิ์
        if (typeLower.includes('palm-oil') ||
            typeLower.includes('palm oil') ||
            (typeLower.includes('น้ำมัน') && !typeLower.includes('ดิบ'))) {
            return 'palm-oil';
        }

        // Shell / กะลา
        if (typeLower.includes('shell') || typeLower.includes('กะลา')) {
            return 'shell';
        }

        // Fiber / ใย
        if (typeLower.includes('fiber') || typeLower.includes('ใย')) {
            return 'fiber';
        }

        // EFB / ทะลาย
        if (typeLower.includes('efb') || typeLower.includes('ทะลาย')) {
            return 'efb';
        }

        // Fertilizer / ปุ๋ย
        if (typeLower.includes('fertilizer') || typeLower.includes('ปุ๋ย')) {
            return 'fertilizer';
        }

        return 'other';
    };

    // ฟังก์ชันตรวจสอบ product type จากชื่อสินค้าโดยเฉพาะ
    const detectFromProductName = (productName: string | undefined): string | null => {
        if (!productName) return null;

        const nameLower = productName.toLowerCase();

        // ตรวจสอบเมล็ดในปาล์ม / palm-kernel จากชื่อสินค้า
        if (nameLower.includes('เมล็ดในปาล์ม') ||
            nameLower.includes('palm-kernel') ||
            nameLower.includes('palm kernel') ||
            nameLower.includes('kernel') ||
            (nameLower.includes('เมล็ด') && nameLower.includes('ปาล์ม'))) {
            return 'palm-kernel';  // เปลี่ยนจาก 'kernel' เป็น 'palm-kernel'
        }

        // CPO
        if (nameLower.includes('cpo') ||
            (nameLower.includes('น้ำมัน') && nameLower.includes('ปาล์ม') && nameLower.includes('ดิบ')) ||
            nameLower.includes('น้ำมันปาล์มดิบ')) {
            return 'cpo';
        }

        // น้ำมันปาล์มบริสุทธิ์
        if ((nameLower.includes('น้ำมัน') && nameLower.includes('ปาล์ม') && !nameLower.includes('ดิบ')) ||
            nameLower.includes('palm-oil') ||
            nameLower.includes('palm oil')) {
            return 'palm-oil';
        }

        // กะลาปาล์ม
        if (nameLower.includes('กะลา') ||
            nameLower.includes('shell') ||
            (nameLower.includes('กะลา') && nameLower.includes('ปาล์ม'))) {
            return 'shell';
        }

        // ใยปาล์ม
        if (nameLower.includes('ใย') ||
            nameLower.includes('fiber') ||
            (nameLower.includes('ใย') && nameLower.includes('ปาล์ม'))) {
            return 'fiber';
        }

        // ทะลายปาล์ม
        if (nameLower.includes('ทะลาย') ||
            nameLower.includes('efb') ||
            (nameLower.includes('ทะลาย') && nameLower.includes('ปาล์ม'))) {
            return 'efb';
        }

        return null;
    };

    // ตรวจสอบและแก้ไข product type โดยตรงจากทุกแหล่งข้อมูล
    const detectProductType = (order: PlanOrder): string => {
        // ลองตรวจสอบจาก productType ก่อน
        if (order.productType) {
            const normalized = normalizeType(order.productType);
            if (normalized !== 'other') return normalized;
        }

        // ถ้า productType ไม่ชัดเจน ให้ตรวจสอบจาก productName
        if (order.productName) {
            const detected = detectFromProductName(order.productName);
            if (detected) return detected;
        }

        // ถ้ายังไม่เจอ ให้ตรวจสอบจาก productName อีกครั้งแบบละเอียด
        if (order.productName) {
            const nameLower = order.productName.toLowerCase();

            // ตรวจสอบคำสำคัญต่างๆ
            if (nameLower.includes('เมล็ด')) return 'palm-kernel';  // เปลี่ยนจาก 'kernel'
            if (nameLower.includes('kernel')) return 'palm-kernel';  // เปลี่ยนจาก 'kernel'
            if (nameLower.includes('cpo')) return 'cpo';
            if (nameLower.includes('กะลา')) return 'shell';
            if (nameLower.includes('shell')) return 'shell';
            if (nameLower.includes('ใย')) return 'fiber';
            if (nameLower.includes('fiber')) return 'fiber';
            if (nameLower.includes('ทะลาย')) return 'efb';
            if (nameLower.includes('efb')) return 'efb';
            if (nameLower.includes('น้ำมัน') && nameLower.includes('ปาล์ม')) {
                if (nameLower.includes('ดิบ')) return 'cpo';
                return 'palm-oil';
            }
        }

        return 'other';
    };

    // คำนวณ products โดยใช้ useMemo
    const products = useMemo(() => {
        // ใช้ Map เพื่อจัดกลุ่ม orders ตาม product type
        const productTypeMap = new Map<string, PlanOrder[]>();

        orders.forEach(order => {
            const type = detectProductType(order);
            if (!productTypeMap.has(type)) {
                productTypeMap.set(type, []);
            }
            productTypeMap.get(type)!.push(order);
        });

        const types = Array.from(productTypeMap.keys());

        // ลำดับที่ต้องการให้แสดง - เปลี่ยน 'kernel' เป็น 'palm-kernel'
        const preferredOrder = ['cpo', 'palm-oil', 'palm-kernel', 'shell', 'efb', 'fiber', 'fertilizer', 'other'];

        // เรียงลำดับตาม preferredOrder
        types.sort((a, b) => {
            const ai = preferredOrder.indexOf(a);
            const bi = preferredOrder.indexOf(b);
            if (ai === -1 && bi === -1) return a.localeCompare(b);
            if (ai === -1) return 1;
            if (bi === -1) return -1;
            return ai - bi;
        });

        return types
            .map((key) => {
                const meta = PRODUCT_META[key] || {
                    name: key === 'other' ? 'อื่นๆ' : key,
                    icon: <Package className="h-5 w-5" />,
                    color: 'brown',
                    unit: 'กก.',
                    bgLight: 'bg-amber-100',
                    border: 'border-amber-300',
                    text: 'text-amber-800',
                };

                // กรอง orders ตาม product type
                const productOrders = productTypeMap.get(key) || [];

                // คำนวณน้ำหนักรวม
                const totalWeight = productOrders.reduce((sum, o) => sum + (o.netWeight || 0), 0);

                // คำนวณน้ำหนักที่สำเร็จ
                const completedWeight = productOrders.filter((o) => o.status === 'completed').reduce((sum, o) => sum + (o.netWeight || 0), 0);

                // คำนวณน้ำหนักที่รอ
                const pendingWeight = productOrders.filter((o) => o.status === 'pending').reduce((sum, o) => sum + (o.netWeight || 0), 0);

                // คำนวณน้ำหนักที่ยกเลิก
                const cancelledWeight = productOrders.filter((o) => o.status === 'cancelled').reduce((sum, o) => sum + (o.netWeight || 0), 0);

                const progress = totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;

                return {
                    key,
                    ...meta,
                    totalWeight,
                    completedWeight,
                    pendingWeight,
                    cancelledWeight,
                    progress,
                    count: productOrders.length,
                };
            })
            .filter((product) => product.totalWeight > 0); // แสดงเฉพาะที่มีน้ำหนัก
    }, [orders]);

    // Create infinite slide items for smooth infinite loop
    const infiniteProducts = useMemo(() => {
        if (products.length === 0) return [];
        if (products.length <= 5) return products;

        const firstItems = products.slice(0, 3);
        const lastItems = products.slice(-3);

        return [...lastItems, ...products, ...firstItems];
    }, [products]);

    // Adjust currentSlide when products change
    useEffect(() => {
        if (infiniteProducts.length > 0 && products.length > 5) {
            setCurrentSlide(3);
        } else {
            setCurrentSlide(0);
        }
    }, [products.length, infiniteProducts.length]);

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

    // Animation เมื่อตัวเลขเปลี่ยน
    useEffect(() => {
        setAnimateNumber(true);
        const timer = setTimeout(() => setAnimateNumber(false), 500);
        return () => clearTimeout(timer);
    }, [stats.total, stats.completed]);

    // Handle transition end for infinite loop
    const handleTransitionEnd = useCallback(() => {
        if (!isTransitioning || products.length <= 5) return;

        setIsTransitioning(false);

        if (currentSlide <= 2) {
            setCurrentSlide(infiniteProducts.length - 4);
        } else if (currentSlide >= infiniteProducts.length - 3) {
            setCurrentSlide(3);
        }
    }, [currentSlide, infiniteProducts.length, products.length, isTransitioning]);

    // ฟังก์ชันแจ้งเตือน
    const showNotification = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 p-3 rounded-lg shadow-lg z-50 ${type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'
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
            const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
            const exportFileDefaultName = `summary-${new Date().toISOString()}.json`;
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
            showNotification('ส่งออกข้อมูลสำเร็จ', 'success');
        }
    }, [stats, products, onExport, showNotification]);

    // ฟังก์ชันเลือกสินค้า
    const handleProductClick = (productKey: string | null) => {
        const newSelection = productKey === externalSelectedProduct ? null : productKey;

        if (onProductSelect) {
            onProductSelect(newSelection);

            if (newSelection === null) {
                showNotification('ล้างตัวกรองสินค้า', 'info');
            } else {
                const productName = products.find((p) => p.key === newSelection)?.name;
                showNotification(`แสดงเฉพาะ ${productName}`, 'success');
            }
        }
    };

    // Slide navigation functions for infinite loop
    const nextSlide = () => {
        if (products.length <= 5 || isTransitioning) return;

        setIsTransitioning(true);
        setCurrentSlide((prev) => prev + 1);

        if (transitionTimeoutRef.current) {
            clearTimeout(transitionTimeoutRef.current);
        }

        transitionTimeoutRef.current = setTimeout(() => {
            handleTransitionEnd();
        }, 300);
    };

    const prevSlide = () => {
        if (products.length <= 5 || isTransitioning) return;

        setIsTransitioning(true);
        setCurrentSlide((prev) => prev - 1);

        if (transitionTimeoutRef.current) {
            clearTimeout(transitionTimeoutRef.current);
        }

        transitionTimeoutRef.current = setTimeout(() => {
            handleTransitionEnd();
        }, 300);
    };

    // Get real product for display (ignore cloned items for selection)
    const getRealProduct = (index: number) => {
        if (products.length <= 5) return products[index];

        if (index < 3) {
            return products[products.length - 3 + index];
        } else if (index >= products.length + 3) {
            return products[index - products.length - 3];
        } else {
            return products[index - 3];
        }
    };

    // Touch handlers for mobile drag/swipe
    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchStart(e.targetTouches[0].clientX);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = () => {
        if (!touchStart || !touchEnd || isTransitioning) return;

        const distance = touchStart - touchEnd;
        const threshold = 50;

        if (Math.abs(distance) > threshold) {
            if (distance > 0) {
                nextSlide();
            } else {
                prevSlide();
            }
        }

        setTouchStart(0);
        setTouchEnd(0);
    };

    // Mouse drag handlers for desktop
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartX, setDragStartX] = useState(0);
    const [dragEndX, setDragEndX] = useState(0);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (isTransitioning) return;
        setIsDragging(true);
        setDragStartX(e.clientX);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || isTransitioning) return;
        setDragEndX(e.clientX);
    };

    const handleMouseUp = () => {
        if (!isDragging || !dragStartX || !dragEndX || isTransitioning) {
            setIsDragging(false);
            return;
        }

        const distance = dragStartX - dragEndX;
        const threshold = 50;

        if (Math.abs(distance) > threshold) {
            if (distance > 0) {
                nextSlide();
            } else {
                prevSlide();
            }
        }

        setIsDragging(false);
        setDragStartX(0);
        setDragEndX(0);
    };

    const handleMouseLeave = () => {
        setIsDragging(false);
        setDragStartX(0);
        setDragEndX(0);
    };

    // Clean up transition timeout
    useEffect(() => {
        return () => {
            if (transitionTimeoutRef.current) {
                clearTimeout(transitionTimeoutRef.current);
            }
        };
    }, []);

    return (
        <div className="relative mb-4 space-y-3">
            {/* Main Stats Cards */}
            <div className="grid grid-cols-4 gap-2">
                <div
                    className="cursor-pointer rounded-lg bg-blue-500 p-3 text-white transition-colors hover:bg-blue-600"
                    onClick={() => handleProductClick(null)}
                    title="คลิกเพื่อล้างตัวกรอง"
                >
                    <div className="mb-2 flex items-center justify-between">
                        <div className="text-xs text-blue-100">ทั้งหมด</div>
                        <Package className="h-4 w-4 text-blue-200" />
                    </div>
                    <div className={`text-2xl font-bold ${animateNumber ? 'scale-110' : ''}`}>{formatNumber(stats.total)}</div>
                    <div className="mt-1 text-[8px] text-blue-200">น้ำหนักรวม {formatWeight(stats.totalWeight)}</div>
                </div>

                <div className="rounded-lg bg-green-500 p-3 text-white">
                    <div className="mb-2 flex items-center justify-between">
                        <div className="text-xs text-green-100">เสร็จสิ้น</div>
                        <CheckCircle className="h-4 w-4 text-green-200" />
                    </div>
                    <div className="text-2xl font-bold">{formatNumber(stats.completed)}</div>
                    <div className="mt-1 text-[8px] text-green-200">
                        {formatWeight(stats.completedWeight)} ({stats.completionWeightRate}%)
                    </div>
                </div>

                <div className="rounded-lg bg-yellow-500 p-3 text-white">
                    <div className="mb-2 flex items-center justify-between">
                        <div className="text-xs text-yellow-100">กำลังดำเนินการ</div>
                        <TrendingUp className="h-4 w-4 text-yellow-200" />
                    </div>
                    <div className="text-2xl font-bold">{formatNumber(stats.processing)}</div>
                    <div className="mt-1 text-[8px] text-yellow-200">{formatNumber(stats.processing)} รายการ</div>
                </div>

                <div className="rounded-lg bg-red-500 p-3 text-white">
                    <div className="mb-2 flex items-center justify-between">
                        <div className="text-xs text-red-100">ยกเลิก</div>
                        <XCircle className="h-4 w-4 text-red-200" />
                    </div>
                    <div className="text-2xl font-bold">{formatNumber(stats.cancelled)}</div>
                    <div className="mt-1 text-[8px] text-red-200">
                        {stats.cancelled > 0 ? `${formatNumber(stats.cancelled)} รายการ` : 'ไม่มีรายการ'}
                    </div>
                </div>
            </div>

            {/* Slide Section */}
            {viewMode === 'grid' && products.length > 0 ? (
                <div className="relative">
                    <div
                        ref={slideRef}
                        className="cursor-grab overflow-hidden rounded-lg select-none active:cursor-grabbing"
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseLeave}
                    >
                        <div
                            className="flex transition-transform duration-300 ease-out"
                            style={{
                                transform: `translateX(-${currentSlide * 20}%)`,
                                transition: isTransitioning ? 'transform 300ms ease-out' : 'none',
                            }}
                            onTransitionEnd={handleTransitionEnd}
                        >
                            {infiniteProducts.map((product, index) => {
                                const realProduct = getRealProduct(index);
                                const isSelected = externalSelectedProduct === realProduct.key;

                                return (
                                    <div key={`${product.key}-${index}`} className="w-1/5 flex-none px-1">
                                        <div
                                            className={` ${product.bgLight} border ${product.border} h-full cursor-pointer rounded-lg p-2 ${isSelected ? `ring-2 ring-${product.color}-500 bg-white shadow-md` : 'hover:bg-white hover:shadow'} transition-all ${isDragging ? 'transition-none' : ''} `}
                                            onClick={() => handleProductClick(realProduct.key)}
                                            title={isSelected ? 'คลิกเพื่อล้างตัวกรอง' : `เลือกเฉพาะ ${product.name}`}
                                        >
                                            <div className="relative">
                                                <div className="mb-2 flex items-center justify-between">
                                                    <div className={`rounded-lg bg-white p-1.5 ${product.text}`}>{product.icon}</div>
                                                    <span className={`rounded-full bg-white px-1.5 py-0.5 text-[8px] ${product.text}`}>
                                                        {product.unit}
                                                    </span>
                                                </div>

                                                <p className="mb-1 truncate text-xs font-medium text-gray-800">{product.name}</p>

                                                <div className="flex items-baseline justify-between">
                                                    <span className={`text-lg font-bold ${product.text}`}>
                                                        {formatWeight(product.totalWeight, product.unit).split(' ')[0]}
                                                    </span>
                                                    <span className="text-[8px] text-gray-500">
                                                        {formatWeight(product.totalWeight, product.unit).split(' ')[1] || product.unit}
                                                    </span>
                                                </div>

                                                {product.progress > 0 && (
                                                    <div className="mt-2 h-1 w-full rounded-full bg-gray-200">
                                                        <div
                                                            className={`h-full bg-${product.color}-500 rounded-full`}
                                                            style={{ width: `${product.progress}%` }}
                                                        />
                                                    </div>
                                                )}

                                                <div className="mt-2 flex items-center justify-between text-[8px]">
                                                    <span className="flex items-center gap-0.5 text-green-600">
                                                        <CheckCircle2 className="h-2.5 w-2.5" />
                                                        {formatWeight(product.completedWeight, product.unit).split(' ')[0]}
                                                    </span>
                                                    {product.pendingWeight > 0 && (
                                                        <span className="flex items-center gap-0.5 text-yellow-600">
                                                            <Clock className="h-2.5 w-2.5" />
                                                            {formatWeight(product.pendingWeight, product.unit).split(' ')[0]}
                                                        </span>
                                                    )}
                                                </div>

                                                {isSelected && (
                                                    <div className="absolute -top-1 -right-1">
                                                        <span className="flex h-3 w-3">
                                                            <span className="relative inline-flex h-3 w-3 animate-pulse rounded-full bg-blue-500"></span>
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {products.length > 5 && (
                        <div className="mt-2 flex justify-center gap-1">
                            {products.map((_, index) => {
                                let isActive = false;

                                if (currentSlide >= 3 && currentSlide <= products.length + 2) {
                                    isActive = currentSlide - 3 === index;
                                } else if (currentSlide < 3) {
                                    isActive = products.length - 3 + currentSlide === index;
                                } else {
                                    isActive = currentSlide - products.length - 3 === index;
                                }

                                return (
                                    <button
                                        key={index}
                                        onClick={() => {
                                            if (isTransitioning) return;
                                            const targetSlide = index + 3;
                                            setIsTransitioning(true);
                                            setCurrentSlide(targetSlide);

                                            if (transitionTimeoutRef.current) {
                                                clearTimeout(transitionTimeoutRef.current);
                                            }

                                            transitionTimeoutRef.current = setTimeout(() => {
                                                handleTransitionEnd();
                                            }, 300);
                                        }}
                                        className={`h-1.5 rounded-full transition-all ${isActive ? 'w-4 bg-blue-500' : 'w-1.5 bg-gray-300 hover:bg-gray-400'
                                            }`}
                                        aria-label={`Go to slide ${index + 1}`}
                                        disabled={isTransitioning}
                                    />
                                );
                            })}
                        </div>
                    )}
                </div>
            ) : viewMode === 'grid' && products.length === 0 ? (
                <div className="rounded-lg bg-gray-50 p-4 text-center">
                    <p className="text-xs text-gray-500">ไม่มีข้อมูลน้ำหนักที่สำเร็จ</p>
                </div>
            ) : (
                <div className="rounded-lg border border-gray-200 bg-white">
                    <div className="grid grid-cols-7 gap-2 border-b bg-gray-50 p-2 text-[10px] font-medium text-gray-600">
                        <div className="col-span-2">สินค้า</div>
                        <div className="text-right">น้ำหนักรวม</div>
                        <div className="text-right">เสร็จ</div>
                        <div className="text-right">รอ</div>
                        <div className="text-right">ยกเลิก</div>
                        <div className="text-right">ความคืบหน้า</div>
                    </div>
                    {products.map((product) => (
                        <div
                            key={product.key}
                            className={`grid cursor-pointer grid-cols-7 gap-2 border-b p-2 text-xs transition-colors last:border-0 hover:bg-gray-50 ${externalSelectedProduct === product.key ? 'bg-blue-50' : ''
                                }`}
                            onClick={() => handleProductClick(product.key)}
                            title={externalSelectedProduct === product.key ? 'คลิกเพื่อล้างตัวกรอง' : `เลือกเฉพาะ ${product.name}`}
                        >
                            <div className="col-span-2 flex items-center gap-2">
                                <div className={`rounded p-1 ${product.bgLight} ${product.text}`}>{product.icon}</div>
                                <span className="font-medium">{product.name}</span>
                                {externalSelectedProduct === product.key && <span className="ml-1 text-[8px] text-blue-600">✓</span>}
                            </div>
                            <div className="text-right font-bold">{formatWeight(product.totalWeight, product.unit)}</div>
                            <div className="text-right text-green-600">{formatWeight(product.completedWeight, product.unit)}</div>
                            <div className="text-right text-yellow-600">
                                {product.pendingWeight > 0 ? formatWeight(product.pendingWeight, product.unit) : '-'}
                            </div>
                            <div className="text-right text-red-500">
                                {product.cancelledWeight > 0 ? formatWeight(product.cancelledWeight, product.unit) : '-'}
                            </div>
                            <div className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                    <span className={product.progress >= 100 ? 'text-green-600' : 'text-gray-600'}>{product.progress}%</span>
                                    <div className="h-1 w-16 rounded-full bg-gray-200">
                                        <div className={`h-full bg-${product.color}-500 rounded-full`} style={{ width: `${product.progress}%` }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {externalSelectedProduct && (
                <div className="animate-pulse rounded-lg border border-blue-200 bg-blue-50 py-1.5 text-center text-[10px]">
                    <span className="text-blue-700">
                        กำลังแสดงเฉพาะ: {products.find((p) => p.key === externalSelectedProduct)?.name}
                        <button onClick={() => handleProductClick(null)} className="ml-2 font-medium text-blue-800 hover:text-blue-900">
                            ✕ ล้าง
                        </button>
                    </span>
                </div>
            )}
        </div>
    );
}