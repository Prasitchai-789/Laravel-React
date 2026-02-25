// resources/js/pages/MAR/PlanOrder/components/PlanOrderFilters.tsx

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Calendar,
    CalendarCheck,
    CalendarRange,
    CalendarX,
    CheckCircle2,
    ChevronDown,
    Clock,
    Droplets,
    Filter,
    Flower2,
    Leaf,
    Package,
    Search,
    Sparkles,
    Target,
    Trees,
    TrendingUp,
    X,
    XCircle,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

// Import PlanOrder interface
import { PlanOrder } from './PlanOrderTable';

interface Filters {
    search: string;
    status: string;
    productType: string;
    dateFrom: string;
    dateTo: string;
}

interface Stats {
    pending: number;
    processing: number;
    completed: number;
    cancelled: number;
    totalWeight?: number;
    statusCodes?: {
        w: number;
        p: number;
        f: number;
        c: number;
    };
}

interface Props {
    filters: Filters;
    onFilterChange: (filters: Partial<Filters>) => void;
    totalCount: number;
    stats?: Stats;
    orders?: PlanOrder[];
    productStats?: Array<{ type: string; total: number }>;
    selectedProduct?: string | null;
    onProductSelect?: (productType: string | null) => void;
    selectedYear?: number;
    availableYears?: number[];
    onYearChange?: (year: string) => void;
}

// Map สีแบบ static สำหรับ Status
const STATUS_COLOR_CLASSES = {
    yellow: {
        bg: 'bg-yellow-500',
        bgLight: 'bg-yellow-50',
        text: 'text-yellow-700',
        border: 'border-yellow-200',
        hover: 'hover:bg-yellow-600',
        hoverLight: 'hover:bg-yellow-100',
    },
    sky: {
        bg: 'bg-sky-500',
        bgLight: 'bg-sky-50',
        text: 'text-sky-700',
        border: 'border-sky-200',
        hover: 'hover:bg-sky-600',
        hoverLight: 'hover:bg-sky-100',
    },
    emerald: {
        bg: 'bg-emerald-500',
        bgLight: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        hover: 'hover:bg-emerald-600',
        hoverLight: 'hover:bg-emerald-100',
    },
    purple: {
        bg: 'bg-purple-500',
        bgLight: 'bg-purple-50',
        text: 'text-purple-700',
        border: 'border-purple-200',
        hover: 'hover:bg-purple-600',
        hoverLight: 'hover:bg-purple-100',
    },
    gray: {
        bg: 'bg-gray-500',
        bgLight: 'bg-gray-50',
        text: 'text-gray-700',
        border: 'border-gray-200',
        hover: 'hover:bg-gray-600',
        hoverLight: 'hover:bg-gray-100',
    },
};

// Map สีแบบ static สำหรับ Product
const PRODUCT_COLOR_CLASSES = {
    amber: {
        bg: 'bg-amber-500',
        bgLight: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200',
        hover: 'hover:bg-amber-600',
        hoverLight: 'hover:bg-amber-100',
    },
    emerald: {
        bg: 'bg-emerald-500',
        bgLight: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        hover: 'hover:bg-emerald-600',
        hoverLight: 'hover:bg-emerald-100',
    },
    stone: {
        bg: 'bg-stone-500',
        bgLight: 'bg-stone-50',
        text: 'text-stone-700',
        border: 'border-stone-200',
        hover: 'hover:bg-stone-600',
        hoverLight: 'hover:bg-stone-100',
    },
    lime: {
        bg: 'bg-lime-500',
        bgLight: 'bg-lime-50',
        text: 'text-lime-700',
        border: 'border-lime-200',
        hover: 'hover:bg-lime-600',
        hoverLight: 'hover:bg-lime-100',
    },
    green: {
        bg: 'bg-green-500',
        bgLight: 'bg-green-50',
        text: 'text-green-700',
        border: 'border-green-200',
        hover: 'hover:bg-green-600',
        hoverLight: 'hover:bg-green-100',
    },
    sky: {
        bg: 'bg-sky-500',
        bgLight: 'bg-sky-50',
        text: 'text-sky-700',
        border: 'border-sky-200',
        hover: 'hover:bg-sky-600',
        hoverLight: 'hover:bg-sky-100',
    },
    brown: {
        bg: 'bg-amber-700',
        bgLight: 'bg-amber-100',
        text: 'text-amber-800',
        border: 'border-amber-300',
        hover: 'hover:bg-amber-800',
        hoverLight: 'hover:bg-amber-200',
    },
    gray: {
        bg: 'bg-gray-500',
        bgLight: 'bg-gray-50',
        text: 'text-gray-700',
        border: 'border-gray-200',
        hover: 'hover:bg-gray-600',
        hoverLight: 'hover:bg-gray-100',
    },
};

// แก้ไข STATUS_OPTIONS ให้ใช้ค่า database โดยตรง
const STATUS_OPTIONS = [
    { value: 'all', label: 'ทั้งหมด', icon: Package, color: 'gray' },
    { value: 'w', label: 'รอดำเนินการ', icon: Clock, color: 'yellow' },
    { value: 'p', label: 'กำลังดำเนินการ', icon: TrendingUp, color: 'sky' },
    { value: 'f', label: 'เสร็จแล้ว', icon: CheckCircle2, color: 'emerald' },
    { value: 'c', label: 'ยกเลิก', icon: XCircle, color: 'gray' },
];

// PRODUCT_OPTIONS คงเดิม
const PRODUCT_OPTIONS = [
    { value: 'all', label: 'ทั้งหมด', icon: Package, color: 'gray' },
    { value: 'cpo', label: 'น้ำมันปาล์มดิบ', icon: Droplets, color: 'amber' },
    { value: 'palm-kernel', label: 'เมล็ดในปาล์ม', icon: Flower2, color: 'emerald' },
    { value: 'shell', label: 'กะลาปาล์ม', icon: Package, color: 'stone' },
    { value: 'fiber', label: 'ใยปาล์ม', icon: Leaf, color: 'lime' },
    { value: 'efb', label: 'ทะลายปาล์ม', icon: Trees, color: 'green' },
    { value: 'palm-oil', label: 'น้ำมันปาล์มบริสุทธิ์', icon: Droplets, color: 'sky' },
    { value: 'other', label: 'อื่นๆ', icon: Package, color: 'gray' },
];

const DATE_RANGE_OPTIONS = [
    { value: 'custom', label: 'กำหนดเอง', icon: Calendar },
    { value: 'today', label: 'วันนี้', icon: CalendarCheck },
    { value: 'yesterday', label: 'เมื่อวาน', icon: CalendarX },
    { value: 'thisWeek', label: 'สัปดาห์นี้', icon: CalendarRange },
    { value: 'lastWeek', label: 'สัปดาห์ที่แล้ว', icon: CalendarRange },
    { value: 'thisMonth', label: 'เดือนนี้', icon: CalendarRange },
    { value: 'lastMonth', label: 'เดือนที่แล้ว', icon: CalendarRange },
];

// normalizeType คงเดิม
const normalizeType = (type: string | undefined): string => {
    if (!type) return 'other';

    const typeLower = type.toLowerCase().trim();

    if (typeLower.includes('cpo') || typeLower.includes('น้ำมันปาล์มดิบ') || typeLower.includes('ปาล์มดิบ')) {
        return 'cpo';
    }

    if (typeLower.includes('kernel') || typeLower.includes('เมล็ด')) {
        return 'palm-kernel';
    }

    if (typeLower.includes('shell') || typeLower.includes('กะลา') || typeLower.includes('palm-shell') || typeLower.includes('palm shell')) {
        return 'shell';
    }

    if (typeLower.includes('fiber') || typeLower.includes('ใย') || typeLower.includes('palm-fiber') || typeLower.includes('palm fiber')) {
        return 'fiber';
    }

    if (typeLower.includes('efb') || typeLower.includes('ทะลาย')) {
        return 'efb';
    }

    if (typeLower.includes('palm-oil') || typeLower.includes('palm oil') || typeLower.includes('oil') || (typeLower.includes('น้ำมัน') && !typeLower.includes('ดิบ'))) {
        return 'palm-oil';
    }

    return 'other';
};

const detectFromProductName = (productName: string | undefined): string | null => {
    if (!productName) return null;

    const nameLower = productName.toLowerCase();

    if (nameLower.includes('กะลา') || nameLower.includes('shell') || (nameLower.includes('กะลา') && nameLower.includes('ปาล์ม'))) {
        return 'shell';
    }

    if (nameLower.includes('ใย') || nameLower.includes('fiber') || (nameLower.includes('ใย') && nameLower.includes('ปาล์ม'))) {
        return 'fiber';
    }

    return null;
};

const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('th-TH', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
    } catch {
        return dateStr;
    }
};

const getTodayDate = (): string => {
    const today = new Date();
    return today.toISOString().split('T')[0];
};

export default function PlanOrderFilters({
    filters,
    onFilterChange,
    totalCount,
    stats,
    orders = [],
    selectedProduct,
    onProductSelect,
    selectedYear,
    availableYears = [],
    onYearChange,
}: Props) {
    const [showFilters, setShowFilters] = useState(false);
    const [searchHistory, setSearchHistory] = useState<string[]>([]);
    const [showSearchHistory, setShowSearchHistory] = useState(false);
    const [dateRangeType, setDateRangeType] = useState('today');

    const searchInputRef = useRef<HTMLInputElement>(null);
    const dateFromRef = useRef<HTMLInputElement>(null);
    const dateToRef = useRef<HTMLInputElement>(null);

    // หมายเหตุ: ไม่ auto-set วันที่เริ่มต้น เพราะ server กรองข้อมูลตามปีที่เลือกแล้ว
    // ถ้าต้องการดูวันนี้ให้กดปุ่ม "วันนี้" เอง

    const productCounts = React.useMemo(() => {
        const counts: Record<string, number> = {};

        orders.forEach((order) => {
            let type = normalizeType(order.productType);

            if (type === 'other' && order.productName) {
                const detected = detectFromProductName(order.productName);
                if (detected) {
                    type = detected;
                }
            }

            counts[type] = (counts[type] || 0) + 1;
        });

        return counts;
    }, [orders]);

    useEffect(() => {
        console.log('🔍 Filters Debug:', {
            filters,
            selectedProduct,
            productCounts,
            stats,
            ordersCount: orders.length,
            dateRangeType,
        });
    }, [filters, selectedProduct, productCounts, stats, orders, dateRangeType]);

    const getDateRange = (type: string) => {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);

        const startOfLastWeek = new Date(startOfWeek);
        startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);
        const endOfLastWeek = new Date(startOfLastWeek);
        endOfLastWeek.setDate(startOfLastWeek.getDate() + 6);

        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

        const formatDate = (date: Date) => date.toISOString().split('T')[0];

        const ranges: Record<string, { dateFrom: string; dateTo: string }> = {
            today: { dateFrom: formatDate(today), dateTo: formatDate(today) },
            yesterday: { dateFrom: formatDate(yesterday), dateTo: formatDate(yesterday) },
            thisWeek: { dateFrom: formatDate(startOfWeek), dateTo: formatDate(endOfWeek) },
            lastWeek: { dateFrom: formatDate(startOfLastWeek), dateTo: formatDate(endOfLastWeek) },
            thisMonth: { dateFrom: formatDate(startOfMonth), dateTo: formatDate(endOfMonth) },
            lastMonth: { dateFrom: formatDate(startOfLastMonth), dateTo: formatDate(endOfLastMonth) },
        };

        return ranges[type] || { dateFrom: filters.dateFrom, dateTo: filters.dateTo };
    };

    const isDateRangeActive = (type: string): boolean => {
        const range = getDateRange(type);
        return filters.dateFrom === range.dateFrom && filters.dateTo === range.dateTo;
    };

    useEffect(() => {
        if (selectedProduct !== undefined) {
            const newProductType = selectedProduct || 'all';
            if (filters.productType !== newProductType) {
                onFilterChange({ productType: newProductType });
            }
        }
    }, [selectedProduct]);

    const handleChange = (key: keyof Filters, value: string) => {
        console.log(`📝 Filter changed - ${key}:`, value);
        onFilterChange({ [key]: value });

        if (key === 'search' && value && !searchHistory.includes(value)) {
            setSearchHistory(prev => [value, ...prev].slice(0, 5));
        }

        if (key === 'productType') {
            if (onProductSelect) {
                onProductSelect(value === 'all' ? null : value);
            }
        }
    };

    const handleDateRangeChange = (value: string) => {
        setDateRangeType(value);
        if (value !== 'custom') {
            const range = getDateRange(value);
            onFilterChange(range);
        }
    };

    const handleDateClick = (type: string) => {
        const isActive = isDateRangeActive(type);

        if (isActive) {
            onFilterChange({
                dateFrom: '',
                dateTo: '',
            });
            setDateRangeType('custom');
        } else {
            const range = getDateRange(type);
            onFilterChange(range);
            setDateRangeType(type);
        }
        setShowFilters(false);
    };

    const clearFilters = () => {
        console.log('🧹 Clearing all filters');
        const today = getTodayDate();
        onFilterChange({
            search: '',
            status: 'all',
            productType: 'all',
            dateFrom: '',
            dateTo: '',
        });
        setDateRangeType('custom');
        if (onProductSelect) {
            onProductSelect(null);
        }
    };

    const quickFilter = (type: string) => {
        handleChange('status', type);
        setShowFilters(false);
    };

    const hasActiveFilters = Boolean(
        filters.search ||
        (filters.status && filters.status !== 'all') ||
        (filters.productType && filters.productType !== 'all') ||
        filters.dateFrom ||
        filters.dateTo
    );

    const activeFilterCount = [
        filters.status && filters.status !== 'all',
        filters.productType && filters.productType !== 'all',
        filters.dateFrom,
        filters.dateTo,
    ].filter(Boolean).length;

    const getProductLabel = (value: string) => {
        const product = PRODUCT_OPTIONS.find(p => p.value === value);
        return product?.label || value;
    };

    const getStatusLabel = (value: string) => {
        const statusMap: { [key: string]: string } = {
            'w': 'รอดำเนินการ',
            'p': 'กำลังดำเนินการ',
            'f': 'เสร็จแล้ว',
            'c': 'ยกเลิก',
        };
        return statusMap[value] || value;
    };

    const handleProductBadgeClick = (productValue: string) => {
        if (filters.productType === productValue) {
            onFilterChange({ productType: 'all' });
            if (onProductSelect) {
                onProductSelect(null);
            }
        } else {
            onFilterChange({ productType: productValue });
            if (onProductSelect) {
                onProductSelect(productValue);
            }
        }
    };

    const handleStatusBadgeClick = (statusValue: string) => {
        if (filters.status === statusValue) {
            onFilterChange({ status: 'all' });
        } else {
            onFilterChange({ status: statusValue });
        }
    };

    const getStatusColorClasses = (color: string, isSelected: boolean) => {
        const colors = STATUS_COLOR_CLASSES[color as keyof typeof STATUS_COLOR_CLASSES] || STATUS_COLOR_CLASSES.gray;

        if (isSelected) {
            return `${colors.bg} ${colors.hover} text-white`;
        } else {
            return `${colors.bgLight} ${colors.text} ${colors.border} ${colors.hoverLight}`;
        }
    };

    const getProductColorClasses = (color: string, isSelected: boolean) => {
        const colors = PRODUCT_COLOR_CLASSES[color as keyof typeof PRODUCT_COLOR_CLASSES] || PRODUCT_COLOR_CLASSES.gray;

        if (isSelected) {
            return `${colors.bg} ${colors.hover} text-white`;
        } else {
            return `${colors.bgLight} ${colors.text} ${colors.border} ${colors.hoverLight}`;
        }
    };

    const renderStatusFilterSection = () => {
        return (
            <div className="space-y-2">
                <label className="flex items-center gap-1 text-xs font-medium text-gray-600">
                    <Clock className="h-3.5 w-3.5" />
                    สถานะ
                </label>
                <Select value={filters.status} onValueChange={(v) => handleChange('status', v)}>
                    <SelectTrigger className="h-9 border-2 bg-white text-sm">
                        <SelectValue placeholder="ทั้งหมด" />
                    </SelectTrigger>
                    <SelectContent>
                        {STATUS_OPTIONS.map((opt) => {
                            const Icon = opt.icon;
                            // ใช้ stats.statusCodes สำหรับจำนวน
                            const count = stats?.statusCodes?.[opt.value as keyof typeof stats.statusCodes] || 0;
                            return (
                                <SelectItem key={opt.value} value={opt.value} className="text-sm">
                                    <div className="flex items-center gap-2">
                                        <Icon className="h-3.5 w-3.5" style={{ color: `var(--${opt.color}-500)` }} />
                                        <span>{opt.label}</span>
                                        {opt.value !== 'all' && (
                                            <span className="ml-1 text-xs text-gray-400">({count})</span>
                                        )}
                                    </div>
                                </SelectItem>
                            );
                        })}
                    </SelectContent>
                </Select>
            </div>
        );
    };

    return (
        <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            {/* Header */}
            <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-blue-500 p-1.5">
                        <Filter className="h-3.5 w-3.5 text-white" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-800">ค้นหาและกรอง</h3>
                    {activeFilterCount > 0 && (
                        <Badge variant="secondary" className="bg-blue-100 text-xs text-blue-700">
                            {activeFilterCount} ตัวกรอง
                        </Badge>
                    )}
                    {totalCount > 0 && (
                        <span className="ml-2 text-xs text-gray-400">พบ {totalCount} รายการ</span>
                    )}
                </div>

                {/* Quick Filters */}
                <div className="flex items-center gap-1">
                    {['today', 'yesterday', 'thisWeek'].map((type) => {
                        const icons = {
                            today: Calendar,
                            yesterday: CalendarX,
                            thisWeek: CalendarRange,
                        };
                        const labels = {
                            today: 'วันนี้',
                            yesterday: 'เมื่อวาน',
                            thisWeek: 'สัปดาห์นี้',
                        };
                        const Icon = icons[type as keyof typeof icons];
                        const isActive = isDateRangeActive(type);

                        return (
                            <Button
                                key={type}
                                variant={isActive ? "default" : "ghost"}
                                size="sm"
                                onClick={() => handleDateClick(type)}
                                className={`h-7 px-2 text-xs ${isActive
                                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                                    : 'text-gray-600 hover:text-blue-600'
                                    }`}
                                title={isActive ? `คลิกเพื่อล้างตัวกรอง${labels[type as keyof typeof labels]}` : `เลือก${labels[type as keyof typeof labels]}`}
                            >
                                <Icon className="mr-1 h-3 w-3" />
                                {labels[type as keyof typeof labels]}
                            </Button>
                        );
                    })}

                    {/* ปีข้อมูล (Year Selector) ไปอยู่หลัง สัปดาห์นี้ */}
                    {availableYears && availableYears.length > 0 && (
                        <div className="ml-2 flex items-center gap-1.5 border-l pl-2 border-gray-200">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            <Select
                                value={String(selectedYear ?? new Date().getFullYear())}
                                onValueChange={(v) => onYearChange?.(v)}
                            >
                                <SelectTrigger className="h-7 w-[90px] border-2 text-xs bg-white">
                                    <SelectValue placeholder="ปี" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableYears.map(y => (
                                        <SelectItem key={y} value={String(y)} className="text-xs">
                                            {y}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                            ref={searchInputRef}
                            placeholder="ค้นหาเลขที่คำสั่งซื้อ, ชื่อลูกค้า, ทะเบียนรถ, ชื่อคนขับ..."
                            className="border-2 py-2 pl-9 pr-4 text-sm transition-all focus:border-blue-400"
                            value={filters.search || ''}
                            onChange={(e) => handleChange('search', e.target.value)}
                            onFocus={() => setShowSearchHistory(true)}
                            onBlur={() => setTimeout(() => setShowSearchHistory(false), 200)}
                        />

                        {showSearchHistory && searchHistory.length > 0 && (
                            <div className="absolute left-0 right-0 top-full z-10 mt-1 rounded-lg border bg-white py-1 shadow-lg">
                                {searchHistory.map((term, i) => (
                                    <button
                                        key={i}
                                        className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-gray-50"
                                        onClick={() => {
                                            handleChange('search', term);
                                            setShowSearchHistory(false);
                                        }}
                                    >
                                        <Search className="h-3 w-3 text-gray-400" />
                                        {term}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <Button
                        variant="outline"
                        onClick={() => setShowFilters(!showFilters)}
                        className={`gap-2 border-2 transition-all ${showFilters ? 'border-blue-400 bg-blue-50 text-blue-700' : ''
                            }`}
                    >
                        <Filter className="h-4 w-4" />
                        <span className="hidden sm:inline">ตัวกรอง</span>
                        {activeFilterCount > 0 && (
                            <Badge variant="secondary" className="ml-1 bg-blue-100 text-blue-700">
                                {activeFilterCount}
                            </Badge>
                        )}
                        <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${showFilters ? 'rotate-180' : ''}`} />
                    </Button>

                    {hasActiveFilters && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={clearFilters}
                            className="text-gray-500 hover:bg-red-50 hover:text-red-600"
                            title="ล้างตัวกรองทั้งหมด"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Status Badges - ใช้ stats.statusCodes */}
            {stats && stats.statusCodes && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="text-xs text-gray-500">สถานะ:</span>
                    {STATUS_OPTIONS.filter(opt => opt.value !== 'all').map((opt) => {
                        const Icon = opt.icon;
                        // ใช้ stats.statusCodes ตามรหัสสถานะโดยตรง
                        const count = stats.statusCodes?.[opt.value as keyof typeof stats.statusCodes] || 0;
                        const isSelected = filters.status === opt.value;
                        const colorClasses = getStatusColorClasses(opt.color, isSelected);

                        if (count === 0 && !isSelected) return null;

                        return (
                            <Badge
                                key={opt.value}
                                variant={isSelected ? "default" : "outline"}
                                className={`cursor-pointer gap-1 px-3 py-1 text-xs transition-all border ${colorClasses}`}
                                onClick={() => handleStatusBadgeClick(opt.value)}
                                title={isSelected ? `คลิกเพื่อล้างตัวกรอง${opt.label}` : `เลือก${opt.label}`}
                            >
                                <Icon className="h-3 w-3" />
                                {opt.label} ({count})
                                {isSelected && (
                                    <X
                                        className="ml-1 h-3 w-3 cursor-pointer hover:text-white"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleStatusBadgeClick(opt.value);
                                        }}
                                    />
                                )}
                            </Badge>
                        );
                    })}
                </div>
            )}

            {/* Product Badges */}
            {Object.keys(productCounts).length > 0 && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="text-xs text-gray-500">สินค้า:</span>
                    {PRODUCT_OPTIONS.filter(opt =>
                        opt.value !== 'all' && productCounts[opt.value] > 0
                    ).map((opt) => {
                        const Icon = opt.icon;
                        const isSelected = filters.productType === opt.value;
                        const colorClasses = getProductColorClasses(opt.color, isSelected);

                        return (
                            <Badge
                                key={opt.value}
                                variant={isSelected ? "default" : "outline"}
                                className={`cursor-pointer gap-1 px-3 py-1 text-xs transition-all border ${colorClasses}`}
                                onClick={() => handleProductBadgeClick(opt.value)}
                                title={isSelected ? `คลิกเพื่อล้างตัวกรอง${opt.label}` : `เลือก${opt.label}`}
                            >
                                <Icon className="h-3 w-3" />
                                {opt.label} ({productCounts[opt.value]})
                                {isSelected && (
                                    <X
                                        className="ml-1 h-3 w-3 cursor-pointer hover:text-white"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleProductBadgeClick(opt.value);
                                        }}
                                    />
                                )}
                            </Badge>
                        );
                    })}
                </div>
            )}

            {/* Active Filters */}
            {hasActiveFilters && (
                <div className="mt-2 flex flex-wrap gap-1">
                    {filters.search && (
                        <Badge variant="outline" className="gap-1 bg-gray-50 text-gray-700">
                            <Search className="h-3 w-3" />
                            {filters.search}
                            <X className="ml-1 h-3 w-3 cursor-pointer hover:text-red-600" onClick={() => handleChange('search', '')} />
                        </Badge>
                    )}
                    {filters.status && filters.status !== 'all' && (
                        <Badge variant="outline" className="gap-1 bg-yellow-50 text-yellow-700">
                            <Clock className="h-3 w-3" />
                            {getStatusLabel(filters.status)}
                            <X className="ml-1 h-3 w-3 cursor-pointer hover:text-red-600" onClick={() => handleChange('status', 'all')} />
                        </Badge>
                    )}
                    {filters.productType && filters.productType !== 'all' && (
                        <Badge variant="outline" className="gap-1 bg-blue-50 text-blue-700">
                            <Package className="h-3 w-3" />
                            {getProductLabel(filters.productType)}
                            <X className="ml-1 h-3 w-3 cursor-pointer hover:text-red-600" onClick={() => handleChange('productType', 'all')} />
                        </Badge>
                    )}
                    {filters.dateFrom && (
                        <Badge variant="outline" className="gap-1 bg-indigo-50 text-indigo-700">
                            <Calendar className="h-3 w-3" />
                            {formatDisplayDate(filters.dateFrom)}
                            {filters.dateTo && filters.dateFrom !== filters.dateTo && ` - ${formatDisplayDate(filters.dateTo)}`}
                            <X
                                className="ml-1 h-3 w-3 cursor-pointer hover:text-red-600"
                                onClick={() => {
                                    handleChange('dateFrom', '');
                                    handleChange('dateTo', '');
                                    setDateRangeType('custom');
                                }}
                            />
                        </Badge>
                    )}
                </div>
            )}

            {/* Advanced Filters */}
            {showFilters && (
                <div className="mt-4 border-t border-gray-200 pt-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        {/* Status */}
                        <div>
                            {renderStatusFilterSection()}
                        </div>

                        {/* Product Type */}
                        <div>
                            <label className="mb-1.5 flex items-center gap-1 text-xs font-medium text-gray-600">
                                <Package className="h-3.5 w-3.5" />
                                สินค้า
                            </label>
                            <Select value={filters.productType} onValueChange={(v) => handleChange('productType', v)}>
                                <SelectTrigger className="h-9 border-2 bg-white text-sm">
                                    <SelectValue placeholder="ทั้งหมด" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all" className="text-sm">
                                        <div className="flex items-center gap-2">
                                            <Package className="h-3.5 w-3.5 text-gray-500" />
                                            <span>ทั้งหมด</span>
                                            <span className="ml-1 text-xs text-gray-400">({orders.length})</span>
                                        </div>
                                    </SelectItem>

                                    {PRODUCT_OPTIONS.filter(opt =>
                                        opt.value !== 'all' && productCounts[opt.value] > 0
                                    ).map((opt) => {
                                        const Icon = opt.icon;
                                        const count = productCounts[opt.value] || 0;

                                        return (
                                            <SelectItem key={opt.value} value={opt.value} className="text-sm">
                                                <div className="flex items-center gap-2">
                                                    <Icon className="h-3.5 w-3.5" style={{ color: `var(--${opt.color}-500)` }} />
                                                    <span>{opt.label}</span>
                                                    <span className="ml-1 text-xs text-gray-400">({count})</span>
                                                </div>
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Date Range */}
                        <div>
                            <label className="mb-1.5 flex items-center gap-1 text-xs font-medium text-gray-600">
                                <Calendar className="h-3.5 w-3.5" />
                                ช่วงวันที่
                            </label>

                            <Select value={dateRangeType} onValueChange={handleDateRangeChange}>
                                <SelectTrigger className="mb-2 h-9 border-2 bg-white text-sm">
                                    <SelectValue placeholder="เลือกช่วงวันที่" />
                                </SelectTrigger>
                                <SelectContent>
                                    {DATE_RANGE_OPTIONS.map((opt) => {
                                        const Icon = opt.icon;
                                        return (
                                            <SelectItem key={opt.value} value={opt.value} className="text-sm">
                                                <div className="flex items-center gap-2">
                                                    <Icon className="h-3.5 w-3.5 text-gray-500" />
                                                    {opt.label}
                                                </div>
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>

                            <div className="grid grid-cols-2 gap-2">
                                <div className="relative">
                                    <div
                                        className="absolute left-2 top-1/2 z-10 -translate-y-1/2 cursor-pointer"
                                        onClick={() => dateFromRef.current?.showPicker()}
                                    >
                                        <Calendar className="h-3.5 w-3.5 text-gray-400 hover:text-blue-600" />
                                    </div>
                                    <Input
                                        ref={dateFromRef}
                                        type="date"
                                        value={filters.dateFrom || ''}
                                        onChange={(e) => {
                                            handleChange('dateFrom', e.target.value);
                                            setDateRangeType('custom');
                                        }}
                                        className="h-9 w-full cursor-pointer border-2 pl-8 text-sm hover:border-blue-400 focus:border-blue-400"
                                        placeholder="จากวันที่"
                                    />
                                </div>
                                <div className="relative">
                                    <div
                                        className="absolute left-2 top-1/2 z-10 -translate-y-1/2 cursor-pointer"
                                        onClick={() => dateToRef.current?.showPicker()}
                                    >
                                        <Calendar className="h-3.5 w-3.5 text-gray-400 hover:text-blue-600" />
                                    </div>
                                    <Input
                                        ref={dateToRef}
                                        type="date"
                                        value={filters.dateTo || ''}
                                        onChange={(e) => {
                                            handleChange('dateTo', e.target.value);
                                            setDateRangeType('custom');
                                        }}
                                        className="h-9 w-full cursor-pointer border-2 pl-8 text-sm hover:border-blue-400 focus:border-blue-400"
                                        min={filters.dateFrom}
                                        placeholder="ถึงวันที่"
                                    />
                                </div>
                            </div>

                            {(filters.dateFrom || filters.dateTo) && (
                                <div className="mt-2 flex items-center gap-1">
                                    {filters.dateFrom && (
                                        <div className="flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-[10px] text-blue-700">
                                            <Calendar className="h-3 w-3" />
                                            <span>{formatDisplayDate(filters.dateFrom)}</span>
                                        </div>
                                    )}
                                    {filters.dateTo && filters.dateFrom && filters.dateFrom !== filters.dateTo && (
                                        <span className="text-[10px] text-gray-400">→</span>
                                    )}
                                    {filters.dateTo && filters.dateFrom !== filters.dateTo && (
                                        <div className="flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-[10px] text-blue-700">
                                            <Calendar className="h-3 w-3" />
                                            <span>{formatDisplayDate(filters.dateTo)}</span>
                                        </div>
                                    )}
                                    {(filters.dateFrom || filters.dateTo) && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                handleChange('dateFrom', '');
                                                handleChange('dateTo', '');
                                                setDateRangeType('custom');
                                            }}
                                            className="ml-1 h-5 w-5 p-0 text-gray-400 hover:text-red-600"
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Stats Footer */}
                    <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1">
                                <Target className="h-3.5 w-3.5" />
                                ตัวกรอง: {activeFilterCount}
                            </span>
                            {stats && (
                                <>
                                    <span className="flex items-center gap-1 text-yellow-600">
                                        <Clock className="h-3.5 w-3.5" /> รอ {stats.pending}
                                    </span>
                                    <span className="flex items-center gap-1 text-sky-600">
                                        <TrendingUp className="h-3.5 w-3.5" /> กำลัง {stats.processing}
                                    </span>
                                    <span className="flex items-center gap-1 text-emerald-600">
                                        <CheckCircle2 className="h-3.5 w-3.5" /> เสร็จ {stats.completed}
                                    </span>
                                    <span className="flex items-center gap-1 text-gray-500">
                                        <XCircle className="h-3.5 w-3.5" /> ยกเลิก {stats.cancelled}
                                    </span>
                                </>
                            )}
                        </div>
                        <Button variant="link" onClick={clearFilters} className="h-auto p-0 text-xs text-red-600 hover:text-red-800">
                            ล้างทั้งหมด
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}