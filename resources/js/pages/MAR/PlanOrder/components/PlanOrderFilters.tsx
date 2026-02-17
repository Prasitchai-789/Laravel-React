import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from '@/components/ui/select';
import { 
    Search, 
    Filter, 
    X, 
    Calendar, 
    Package, 
    ChevronDown,
    Clock,
    CheckCircle2,
    TrendingUp,
    Target,
    Sparkles,
    XCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Filters {
    search: string;
    status: string;
    priority: string;
    productType: string;
    dateFrom: string;
    dateTo: string;
}

interface Stats {
    pending: number;
    completed: number;
    production: number;
    confirmed: number;
    cancelled: number;
}

interface Props {
    filters: Filters;
    onFilterChange: (filters: Partial<Filters>) => void;
    totalCount: number;
    stats?: Stats;
    selectedProduct?: string | null;
    onProductSelect?: (productType: string | null) => void;
}

export default function PlanOrderFilters({ 
    filters, 
    onFilterChange, 
    totalCount, 
    stats,
    selectedProduct,
    onProductSelect 
}: Props) {
    const [showFilters, setShowFilters] = useState(false);
    const [searchHistory, setSearchHistory] = useState<string[]>([]);
    const [showSearchHistory, setShowSearchHistory] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const [prevSelectedProduct, setPrevSelectedProduct] = useState<string | null | undefined>(selectedProduct);

    // อัปเดต productType เมื่อมีการเลือกจาก summary และจัดการล้างเมื่อคลิกซ้ำ
    useEffect(() => {
        if (selectedProduct !== undefined) {
            // ถ้า selectedProduct เหมือนกับครั้งที่แล้ว แสดงว่าคลิกซ้ำ ให้ล้าง filter
            if (selectedProduct === prevSelectedProduct && selectedProduct !== null) {
                onFilterChange({ productType: 'all' });
                if (onProductSelect) {
                    onProductSelect(null);
                }
            } 
            // ถ้าเป็นค่าอื่น ให้ตั้งค่าตามปกติ
            else if (selectedProduct !== prevSelectedProduct) {
                onFilterChange({ productType: selectedProduct || 'all' });
            }
            
            setPrevSelectedProduct(selectedProduct);
        }
    }, [selectedProduct, prevSelectedProduct, onFilterChange, onProductSelect]);

    const handleChange = (key: keyof Filters, value: string) => {
        onFilterChange({ [key]: value });

        // บันทึกประวัติการค้นหา
        if (key === 'search' && value && !searchHistory.includes(value)) {
            setSearchHistory(prev => [value, ...prev].slice(0, 5));
        }

        // ถ้าเปลี่ยน productType ให้แจ้งไปยัง summary
        if (key === 'productType' && onProductSelect) {
            onProductSelect(value === 'all' ? null : value);
        }
    };

    const clearFilters = () => {
        onFilterChange({
            search: '',
            status: 'all',
            priority: 'all',
            productType: 'all',
            dateFrom: '',
            dateTo: '',
        });
        if (onProductSelect) {
            onProductSelect(null);
        }
        setPrevSelectedProduct(null);
    };

    const quickFilter = (type: string) => {
        switch(type) {
            case 'today':
                const today = new Date().toISOString().split('T')[0];
                onFilterChange({ dateFrom: today, dateTo: today });
                break;
            case 'pending':
                onFilterChange({ status: 'pending' });
                break;
            case 'completed':
                onFilterChange({ status: 'completed' });
                break;
            case 'cancelled':
                onFilterChange({ status: 'cancelled' });
                break;
        }
        setShowFilters(false);
    };

    const handleProductTagClick = (productValue: string) => {
        // ถ้าคลิกที่ tag สินค้าเดิม ให้ล้าง
        if (filters.productType === productValue) {
            handleChange('productType', 'all');
        } else {
            handleChange('productType', productValue);
        }
    };

    const hasActiveFilters = filters.search || 
        (filters.status && filters.status !== 'all') ||
        (filters.priority && filters.priority !== 'all') ||
        (filters.productType && filters.productType !== 'all') ||
        filters.dateFrom || 
        filters.dateTo;

    const activeFilterCount = [
        filters.status && filters.status !== 'all',
        filters.priority && filters.priority !== 'all',
        filters.productType && filters.productType !== 'all',
        filters.dateFrom,
        filters.dateTo
    ].filter(Boolean).length;

    const statusOptions = [
        { value: 'all', label: 'ทั้งหมด', icon: <Package className="h-3 w-3" />, color: 'gray' },
        { value: 'pending', label: 'รอดำเนินการ', icon: <Clock className="h-3 w-3" />, color: 'yellow' },
        { value: 'confirmed', label: 'ยืนยันแล้ว', icon: <CheckCircle2 className="h-3 w-3" />, color: 'blue' },
        { value: 'production', label: 'กำลังผลิต', icon: <TrendingUp className="h-3 w-3" />, color: 'yellow' },
        { value: 'completed', label: 'เสร็จสิ้น', icon: <CheckCircle2 className="h-3 w-3" />, color: 'green' },
        { value: 'cancelled', label: 'ยกเลิก', icon: <XCircle className="h-3 w-3" />, color: 'gray' }
    ];

    const priorityOptions = [
        { value: 'all', label: 'ทั้งหมด' },
        { value: 'normal', label: 'ปกติ' },
        { value: 'high', label: 'สำคัญ' },
        { value: 'urgent', label: 'เร่งด่วน' }
    ];

    const productOptions = [
        { value: 'all', label: 'ทั้งหมด' },
        { value: 'cpo', label: 'น้ำมันปาล์มดิบ' },
        { value: 'kernel', label: 'เมล็ดในปาล์ม' },
        { value: 'shell', label: 'กะลาปาล์ม' },
        { value: 'efb', label: 'ทะลายสับ' },
        { value: 'fiber', label: 'ใยปาล์ม' }
    ];

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="bg-blue-500 p-1.5 rounded-lg">
                        <Filter className="h-3.5 w-3.5 text-white" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-800">ค้นหาและกรอง</h3>
                    {activeFilterCount > 0 && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
                            {activeFilterCount} ตัวกรอง
                        </Badge>
                    )}
                </div>

                {/* Quick Filters */}
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => quickFilter('today')}
                        className="text-xs h-7 px-2 text-gray-600 hover:text-blue-600"
                    >
                        วันนี้
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => quickFilter('pending')}
                        className="text-xs h-7 px-2 text-gray-600 hover:text-yellow-600"
                    >
                        <Clock className="h-3 w-3 mr-1" />
                        รอ
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => quickFilter('completed')}
                        className="text-xs h-7 px-2 text-gray-600 hover:text-green-600"
                    >
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        เสร็จ
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => quickFilter('cancelled')}
                        className="text-xs h-7 px-2 text-gray-600 hover:text-gray-600"
                    >
                        <XCircle className="h-3 w-3 mr-1" />
                        ยกเลิก
                    </Button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <div className="flex gap-2">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                            ref={searchInputRef}
                            placeholder="ค้นหาเลขที่คำสั่งซื้อ, ชื่อลูกค้า, ทะเบียนรถ..."
                            className="pl-9 pr-4 py-2 text-sm border-2 focus:border-blue-400 transition-all"
                            value={filters.search || ''}
                            onChange={(e) => handleChange('search', e.target.value)}
                            onFocus={() => setShowSearchHistory(true)}
                            onBlur={() => setTimeout(() => setShowSearchHistory(false), 200)}
                        />
                        
                        {/* Search History */}
                        {showSearchHistory && searchHistory.length > 0 && (
                            <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg py-1">
                                {searchHistory.map((term, index) => (
                                    <button
                                        key={index}
                                        className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 flex items-center gap-2"
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
                        className={`gap-2 border-2 transition-all ${
                            showFilters ? 'border-blue-400 bg-blue-50 text-blue-700' : ''
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
                            className="text-gray-500 hover:text-red-600 hover:bg-red-50"
                            title="ล้างตัวกรองทั้งหมด"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* สถานะ */}
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                สถานะ
                            </label>
                            <Select
                                value={filters.status}
                                onValueChange={(value) => handleChange('status', value)}
                            >
                                <SelectTrigger className="bg-white border-2 h-9 text-sm">
                                    <SelectValue placeholder="ทั้งหมด" />
                                </SelectTrigger>
                                <SelectContent>
                                    {statusOptions.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value} className="text-sm">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-${opt.color}-500`}>{opt.icon}</span>
                                                {opt.label}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* ความสำคัญ */}
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1">
                                <Target className="h-3.5 w-3.5" />
                                ความสำคัญ
                            </label>
                            <Select
                                value={filters.priority}
                                onValueChange={(value) => handleChange('priority', value)}
                            >
                                <SelectTrigger className="bg-white border-2 h-9 text-sm">
                                    <SelectValue placeholder="ทั้งหมด" />
                                </SelectTrigger>
                                <SelectContent>
                                    {priorityOptions.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value} className="text-sm">
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* ประเภทสินค้า */}
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1">
                                <Package className="h-3.5 w-3.5" />
                                สินค้า
                            </label>
                            <Select
                                value={filters.productType}
                                onValueChange={(value) => handleChange('productType', value)}
                            >
                                <SelectTrigger className="bg-white border-2 h-9 text-sm">
                                    <SelectValue placeholder="ทั้งหมด" />
                                </SelectTrigger>
                                <SelectContent>
                                    {productOptions.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value} className="text-sm">
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* ช่วงวันที่ */}
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1.5">ตั้งแต่</label>
                                <div className="relative">
                                    <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 h-3.5 w-3.5" />
                                    <Input
                                        type="date"
                                        value={filters.dateFrom || ''}
                                        onChange={(e) => handleChange('dateFrom', e.target.value)}
                                        className="pl-8 h-9 text-sm border-2"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1.5">ถึง</label>
                                <div className="relative">
                                    <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 h-3.5 w-3.5" />
                                    <Input
                                        type="date"
                                        value={filters.dateTo || ''}
                                        onChange={(e) => handleChange('dateTo', e.target.value)}
                                        className="pl-8 h-9 text-sm border-2"
                                        min={filters.dateFrom}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filter Stats */}
                    <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1">
                                <Target className="h-3.5 w-3.5" />
                                ตัวกรองที่ใช้งาน: {activeFilterCount}
                            </span>
                            {stats && (
                                <>
                                    <span className="flex items-center gap-1 text-yellow-600">
                                        <Clock className="h-3.5 w-3.5" /> รอ {stats.pending}
                                    </span>
                                    <span className="flex items-center gap-1 text-green-600">
                                        <CheckCircle2 className="h-3.5 w-3.5" /> เสร็จ {stats.completed}
                                    </span>
                                    <span className="flex items-center gap-1 text-yellow-600">
                                        <TrendingUp className="h-3.5 w-3.5" /> ผลิต {stats.production}
                                    </span>
                                    <span className="flex items-center gap-1 text-gray-500">
                                        <XCircle className="h-3.5 w-3.5" /> ยกเลิก {stats.cancelled}
                                    </span>
                                </>
                            )}
                        </div>
                        <Button
                            variant="link"
                            onClick={clearFilters}
                            className="text-xs text-red-600 hover:text-red-800 h-auto p-0"
                        >
                            ล้างทั้งหมด
                        </Button>
                    </div>
                </div>
            )}         

            {/* Selected Product Indicator - ทำให้คลิกล้างได้ */}
            {selectedProduct && selectedProduct !== 'all' && (
                <div 
                    className="mt-2 text-xs text-blue-600 bg-blue-50 p-2 rounded-lg border border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors"
                    onClick={() => {
                        onFilterChange({ productType: 'all' });
                        if (onProductSelect) onProductSelect(null);
                    }}
                >
                    <span className="flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        กำลังแสดงเฉพาะ: {productOptions.find(p => p.value === selectedProduct)?.label}
                        <X className="h-3 w-3 ml-2 inline" />
                    </span>
                </div>
            )}
        </div>
    );
}