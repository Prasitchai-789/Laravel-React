// resources/js/pages/MAR/PlanOrder/components/CreatePlanOrderModal.tsx

import React, { useState, useEffect, useRef } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Plus, Trash2, Calendar, Loader2, AlertCircle,
    Package, Building2, MapPin, Truck, User, Search,
    X, Save, FilePlus2, CheckCircle2, MessageSquare,
    ClipboardList, Weight, ArrowRight, GripVertical, Hash
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Swal from 'sweetalert2';

interface CreateOrderProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => void;
    editData?: any;
    products?: any[];
    customers?: any[];
    destinations?: string[];
    vehicles?: any[];
}

const SearchResults = ({ results, onSelect, type, loading }: any) => {
    if (loading) return (
        <div className="absolute z-50 mt-1.5 w-full bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl shadow-xl p-4 text-center animate-in fade-in slide-in-from-top-2 duration-200">
            <Loader2 className="h-5 w-5 animate-spin mx-auto text-blue-500" />
            <p className="text-xs text-slate-400 mt-1.5">กำลังค้นหา...</p>
        </div>
    );

    if (!results?.length) return null;

    return (
        <div className="absolute z-50 mt-1.5 w-full bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl shadow-xl max-h-56 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
            {results.map((item: any, i: number) => (
                <button
                    key={i}
                    className="w-full px-4 py-3 text-left hover:bg-gradient-to-r hover:from-blue-50 hover:to-transparent border-b border-slate-50 last:border-0 transition-all duration-150 group"
                    onMouseDown={(e) => {
                        e.preventDefault();
                        onSelect(item);
                    }}
                >
                    <div className="font-medium text-sm text-slate-700 group-hover:text-blue-700 transition-colors">
                        {type === 'product' ? item.goodName : (item.goodName || item.custName || item.destination || item.numberCar)}
                    </div>
                    {(item.goodID || item.custCode || item.driverName || item.productCode) && (
                        <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                            <span className="px-1.5 py-0.5 bg-slate-100 rounded-md text-[10px] font-mono">
                                {type === 'product' ? item.productCode : (item.goodID || item.custCode || item.driverName)}
                            </span>
                        </div>
                    )}
                </button>
            ))}
        </div>
    );
};

const ALLOWED_PRODUCTS = [
    { goodID: '2147', productCode: 'S-FG-CPO-0001', goodName: 'น้ำมันปาล์มดิบ' },
    { goodID: '2152', productCode: 'S-FG-PKN-0001', goodName: 'เมล็ดในปาล์ม' },
    { goodID: '2151', productCode: 'S-FG-FS-0001', goodName: 'กะลาปาล์ม(เพียว)' },
    { goodID: '9012', productCode: 'S-FG-EFB-0002', goodName: 'ทะลายสับ (EFB Fiber)' },
    { goodID: '2148', productCode: 'S-FG-DC-0001', goodName: 'ขี้เค้ก' },
    { goodID: '2150', productCode: 'S-FG-FB-0001', goodName: 'ใยปาล์ม' },
    { goodID: '2149', productCode: 'S-FG-EFB-0001', goodName: 'ทะลายปาล์มเปล่า' }
];

const CreatePlanOrderModal = ({
    isOpen, onClose, onSave, editData = null,
    products = [], customers = [], destinations = [], vehicles = []
}: CreateOrderProps) => {
    const [formData, setFormData] = useState({
        receiveDate: new Date().toISOString().split('T')[0],
        goodID: '',
        goodName: '',
        productCode: '',
        loadingRequestNumber: '',
        loadPlan: '',
        custID: '',
        custCode: '',
        custName: '',
        destination: '',
        notes: '',
    });

    const [vehiclesList, setVehiclesList] = useState([{ numberCar: '', driverName: '' }]);
    const [loading, setLoading] = useState({ product: false, customer: false, destination: false, vehicle: false });
    const [searchResults, setSearchResults] = useState({ product: [], customer: [], destination: [], vehicle: [] });
    const [vehicleSearchIndex, setVehicleSearchIndex] = useState<number | null>(null);
    const searchTimeout = useRef<any>(null);
    const [activeSection, setActiveSection] = useState<string | null>(null);

    const formatDateForInput = (dateStr: any) => {
        if (!dateStr) return new Date().toISOString().split('T')[0];

        const str = dateStr.toString();

        if (str.includes('-')) {
            const datePart = str.split(' ')[0].split('T')[0];
            const parts = datePart.split('-');
            if (parts.length === 3 && parts[0].length === 4) {
                return datePart;
            }
        }

        if (str.includes('/')) {
            const datePart = str.split(' ')[0];
            const parts = datePart.split('/');
            if (parts.length === 3) {
                const [d, m, y] = parts;
                return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
            }
        }

        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return new Date().toISOString().split('T')[0];

            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        } catch {
            return new Date().toISOString().split('T')[0];
        }
    };

    const fetchNextLoadingRequestNumber = async (date: string) => {
        try {
            const response = await fetch(`/mar/plan-order/next-loading-request-number?date=${encodeURIComponent(date)}`);
            const result = await response.json();
            if (result?.success && result.request_number) {
                setFormData(prev => ({ ...prev, loadingRequestNumber: result.request_number }));
            }
        } catch (error) {
            console.error('Unable to fetch loading request number:', error);
        }
    };

    useEffect(() => {
        if (!isOpen) return;

        if (editData) {
            const currentGoodId = String(editData.rawData?.goodId || editData.goodID || editData.productType || '');
            const matchedProduct = ALLOWED_PRODUCTS.find(p => String(p.goodID) === currentGoodId);
            const receiveDate = formatDateForInput(editData.orderDate || editData.rawData?.orderDate);
            const loadingRequestNumber = editData.rawData?.loadingRequestNumber || editData.loadingRequestNumber || '';
            
            setFormData({
                receiveDate,
                goodID: currentGoodId,
                goodName: editData.productName || matchedProduct?.goodName || '',
                productCode: matchedProduct?.productCode || '',
                loadingRequestNumber,
                loadPlan: editData.rawData?.amntLoad || editData.rawData?.netWei || editData.netWeight?.toString() || '',
                custID: String(editData.customerID || ''),
                custCode: editData.customerCode || '',
                custName: editData.customerName || '',
                destination: editData.destination || '',
                notes: editData.rawData?.remarks || '',
            });

            const cars = editData.licensePlate && editData.licensePlate !== '-' ? editData.licensePlate.split(',') : [];
            const drivers = editData.driverName && editData.driverName !== '-' ? editData.driverName.split(',') : [];
            
            if (cars.length > 0) {
                setVehiclesList(cars.map((car: string, i: number) => ({
                    numberCar: car.trim(),
                    driverName: drivers[i]?.trim() || ''
                })));
            } else {
                setVehiclesList([{ numberCar: '', driverName: '' }]);
            }

            if (!loadingRequestNumber) {
                fetchNextLoadingRequestNumber(receiveDate);
            }
        } else {
            setFormData({
                receiveDate: new Date().toISOString().split('T')[0],
                goodID: '',
                goodName: '',
                productCode: '',
                loadingRequestNumber: '',
                loadPlan: '',
                custID: '',
                custCode: '',
                custName: '',
                destination: '',
                notes: '',
            });
            setVehiclesList([{ numberCar: '', driverName: '' }]);
            fetchNextLoadingRequestNumber(new Date().toISOString().split('T')[0]);
        }
        setSearchResults({ product: [], customer: [], destination: [], vehicle: [] });
        setActiveSection(null);
    }, [editData, isOpen]);

    const handleSearch = (type: string, value: string, data: any[], index: number | null = null) => {
        if (searchTimeout.current) clearTimeout(searchTimeout.current);

        setLoading(prev => ({ ...prev, [type]: true }));
        if (type === 'vehicle') setVehicleSearchIndex(index);

        searchTimeout.current = setTimeout(() => {
            let results = [];
            
            if (type === 'product') {
                results = ALLOWED_PRODUCTS.filter(item => {
                    const searchStr = item.goodName.toLowerCase();
                    const codeStr = (item.goodID || '').toLowerCase();
                    const pCodeStr = (item.productCode || '').toLowerCase();
                    const val = value.toLowerCase();
                    return searchStr.includes(val) || codeStr.includes(val) || pCodeStr.includes(val);
                });
            } else {
                results = data.filter(item => {
                    const searchStr = (item.goodName || item.custName || item.destination || item.numberCar || item.driverName || '').toLowerCase();
                    const codeStr = (item.goodID || item.custCode || '').toLowerCase();
                    const val = value.toLowerCase();
                    return searchStr.includes(val) || codeStr.includes(val);
                }).slice(0, 5);
            }

            setSearchResults(prev => ({ ...prev, [type]: results }));
            setLoading(prev => ({ ...prev, [type]: false }));
        }, 300);
    };

    const selectItem = (type: string, item: any, index: number | null = null) => {
        if (type === 'product') {
            setFormData(prev => ({ 
                ...prev, 
                goodID: item.goodID, 
                goodName: item.goodName,
                productCode: item.productCode 
            }));
        } else if (type === 'customer') {
            setFormData(prev => ({ ...prev, custID: item.custID, custName: item.custName, custCode: item.custCode }));
        } else if (type === 'destination') {
            setFormData(prev => ({ ...prev, destination: item.destination }));
        } else if (type === 'vehicle' && index !== null) {
            const updated = [...vehiclesList];
            updated[index] = {
                numberCar: item.numberCar || updated[index].numberCar,
                driverName: item.driverName || updated[index].driverName
            };
            setVehiclesList(updated);
        }
        setSearchResults(prev => ({ ...prev, [type]: [] }));
        setVehicleSearchIndex(null);
    };

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (!(e.target as HTMLElement).closest('.search-container')) {
                setSearchResults({ product: [], customer: [], destination: [], vehicle: [] });
                setVehicleSearchIndex(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const validateForm = (data: any) => {
        if (!data.goodName || !data.goodID) {
            Swal.fire({ icon: 'warning', title: 'กรุณาเลือกสินค้าจากรายการ', timer: 1500, showConfirmButton: false });
            return false;
        }
        if (!data.custName || !data.custID) {
            Swal.fire({ icon: 'warning', title: 'กรุณาเลือกลูกค้าจากรายการ', timer: 1500, showConfirmButton: false });
            return false;
        }
        if (!data.destination) {
            Swal.fire({ icon: 'warning', title: 'กรุณาระบุปลายทาง', timer: 1500, showConfirmButton: false });
            return false;
        }
        if (!data.loadingRequestNumber) {
            Swal.fire({ icon: 'warning', title: 'กรุณาระบุเลขที่', timer: 1500, showConfirmButton: false });
            return false;
        }
        if (!data.loadPlan || parseFloat(data.loadPlan) <= 0) {
            Swal.fire({ icon: 'warning', title: 'กรุณาระบุน้ำหนักแผนการโหลด', timer: 1500, showConfirmButton: false });
            return false;
        }
        return true;
    };

    const handleSubmit = () => {
        // พยายามหา goodID ถ้าไม่มีแต่ชื่อตรงเป๊ะ
        let finalData = { ...formData };
        if (!finalData.goodID && finalData.goodName) {
            const match = ALLOWED_PRODUCTS.find(p => p.goodName === finalData.goodName);
            if (match) {
                finalData.goodID = match.goodID;
                finalData.productCode = match.productCode;
            }
        }

        // พยายามหา custID ถ้าไม่มีแต่ชื่อตรงเป๊ะ
        if (!finalData.custID && finalData.custName) {
            const match = (customers || []).find(c => c.custName === finalData.custName);
            if (match) {
                finalData.custID = match.custID;
                finalData.custCode = match.custCode;
            }
        }

        if (!validateForm(finalData)) return;
        
        onSave({
            ...finalData,
            vehicles: vehiclesList.filter(v => v.numberCar || v.driverName)
        });
    };

    const isValid = formData.goodName && formData.custName && formData.destination && formData.loadingRequestNumber && formData.loadPlan;
    const progressPercentage = [
        formData.goodName, 
        formData.custName, 
        formData.destination, 
        formData.loadingRequestNumber,
        formData.loadPlan
    ].filter(Boolean).length / 5 * 100;

    const getProgressColor = () => {
        if (progressPercentage === 100) return 'from-emerald-400 to-emerald-500';
        if (progressPercentage >= 50) return 'from-amber-400 to-amber-500';
        return 'from-slate-300 to-slate-400';
    };

    const inputClasses = "h-10 text-sm rounded-xl border-slate-200/80 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-offset-0 transition-all duration-200 placeholder:text-slate-400 hover:border-slate-300";
    const sectionCardClasses = "group rounded-2xl border border-slate-200/60 bg-white p-4 shadow-sm hover:shadow-lg transition-all duration-300 relative";
    const iconContainerClasses = "p-2 rounded-xl transition-all duration-300 group-hover:scale-110";
    const sectionTitleClasses = "font-bold text-sm tracking-tight text-slate-800";

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[95vw] xl:max-w-[1050px] p-0 overflow-hidden border-0 shadow-2xl rounded-2xl bg-white/98 backdrop-blur-xl ring-1 ring-black/5">
                <div className="flex flex-col max-h-[90vh]">
                    {/* Modern Header */}
                    <div className="relative px-5 py-3.5 border-b border-slate-100 bg-gradient-to-r from-white via-blue-50/30 to-white">
                        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwMDAiIGZpbGwtb3BhY2l0eT0iMC4wMSI+PHBhdGggZD0iTTM2IDE4YzAtMS4xLS45LTItMi0yaC0yYy0xLjEgMC0yIC45LTIgMnYyYzAgMS4xLjkgMiAyIDJoMmMxLjEgMCAyLS45IDItMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-20" />
                        <div className="relative flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl shadow-lg shadow-blue-200/50">
                                    {editData ? <ClipboardList className="h-4.5 w-4.5" /> : <FilePlus2 className="h-4.5 w-4.5" />}
                                </div>
                                <div>
                                    <DialogTitle className="text-base font-bold text-slate-800">
                                        {editData ? 'แก้ไขแผนการขนส่ง' : 'สร้างแผนการขนส่งใหม่'}
                                    </DialogTitle>
                                    <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                                        <span className="inline-block w-1 h-1 rounded-full bg-blue-500 animate-pulse" />
                                        {editData ? 'แก้ไขข้อมูลแผนการขนส่งที่มีอยู่' : 'กรอกข้อมูลเพื่อสร้างแผนการขนส่ง'}
                                    </p>
                                </div>
                            </div>
                            
                            {/* Progress Indicator */}
                            <div className="hidden md:flex items-center gap-3 pr-10">
                                <div className="flex flex-col items-end">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Progress</span>
                                    <span className="text-sm font-black text-slate-700">{Math.round(progressPercentage)}%</span>
                                </div>
                                <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                    <div 
                                        className={cn(
                                            "h-full rounded-full bg-gradient-to-r transition-all duration-500 ease-out",
                                            getProgressColor()
                                        )}
                                        style={{ width: `${progressPercentage}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Body with improved layout */}
                    <div className="flex-1 overflow-y-auto p-2 md:p-2 bg-gradient-to-b from-slate-50/50 to-white custom-scrollbar">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2">
                            
                            {/* Left Column - Main Info (8 cols on large screens) */}
                            <div className="lg:col-span-8 space-y-3.5">
                                {/* Top Row: Date & Weight */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    {/* Date Card */}
                                    <div className={cn(sectionCardClasses, "hover:border-blue-200")}>
                                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 transform scale-y-0 group-hover:scale-y-100 transition-transform duration-300 rounded-l-2xl" />
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className={cn(iconContainerClasses, "bg-blue-50 text-blue-600")}>
                                                <Calendar className="h-4 w-4" />
                                            </div>
                                            <span className={sectionTitleClasses}>วันที่รับสินค้า</span>
                                        </div>
                                        <Input 
                                            type="date" 
                                            value={formData.receiveDate} 
                                            onChange={e => {
                                                const nextDate = e.target.value;
                                                setFormData({ ...formData, receiveDate: nextDate });
                                                if (!editData) fetchNextLoadingRequestNumber(nextDate);
                                            }}
                                            className={cn(inputClasses, "focus:ring-blue-500/30")}
                                        />
                                    </div>

                                    {/* Loading Request Number Card */}
                                    <div className={cn(sectionCardClasses, "hover:border-indigo-200")}>
                                        <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 transform scale-y-0 group-hover:scale-y-100 transition-transform duration-300 rounded-l-2xl" />
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className={cn(iconContainerClasses, "bg-indigo-50 text-indigo-600")}>
                                                <Hash className="h-4 w-4" />
                                            </div>
                                            <span className={sectionTitleClasses}>เลขที่</span>
                                        </div>
                                        <Input
                                            placeholder="MAR690520/010"
                                            value={formData.loadingRequestNumber}
                                            onChange={e => setFormData({ ...formData, loadingRequestNumber: e.target.value })}
                                            className={cn(inputClasses, "font-bold text-indigo-700 border-indigo-100 bg-indigo-50/30 focus:ring-indigo-500/30")}
                                        />
                                    </div>

                                    {/* Weight Card */}
                                    <div className={cn(sectionCardClasses, "hover:border-blue-200")}>
                                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 transform scale-y-0 group-hover:scale-y-100 transition-transform duration-300 rounded-l-2xl" />
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className={cn(iconContainerClasses, "bg-blue-50 text-blue-600")}>
                                                <Weight className="h-4 w-4" />
                                            </div>
                                            <span className={sectionTitleClasses}>แผนการโหลด</span>
                                        </div>
                                        <div className="relative">
                                            <Input 
                                                type="number" 
                                                step="0.01" 
                                                placeholder="0.00" 
                                                value={formData.loadPlan} 
                                                onChange={e => setFormData({ ...formData, loadPlan: e.target.value })} 
                                                className={cn(inputClasses, "font-bold text-blue-700 border-blue-100 bg-blue-50/30 focus:ring-blue-500/30 pr-12")}
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-blue-400 bg-blue-50 px-1.5 py-0.5 rounded-md">
                                                กก.
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Product & Customer Row */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {/* Product Card */}
                                    <div className={cn(sectionCardClasses, "hover:border-amber-200")}>
                                        <div className="absolute top-0 left-0 w-1 h-full bg-amber-500 transform scale-y-0 group-hover:scale-y-100 transition-transform duration-300 rounded-l-2xl" />
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className={cn(iconContainerClasses, "bg-amber-50 text-amber-600")}>
                                                    <Package className="h-4 w-4" />
                                                </div>
                                                <span className={sectionTitleClasses}>สินค้า</span>
                                            </div>
                                            {formData.productCode && (
                                                <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-lg">
                                                    {formData.productCode}
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="relative search-container">
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                                <Input
                                                    placeholder="ค้นหาสินค้า..."
                                                    value={formData.goodName}
                                                    onFocus={() => handleSearch('product', formData.goodName, products)}
                                                    onChange={e => {
                                                        setFormData({ ...formData, goodName: e.target.value });
                                                        handleSearch('product', e.target.value, products);
                                                    }}
                                                    className={cn(inputClasses, "pl-9 focus:ring-amber-500/30")}
                                                />
                                            </div>
                                            <SearchResults
                                                results={searchResults.product}
                                                loading={loading.product}
                                                onSelect={(item: any) => selectItem('product', item)}
                                                type="product"
                                            />
                                        </div>
                                    </div>

                                    {/* Customer Card */}
                                    <div className={cn(sectionCardClasses, "hover:border-emerald-200")}>
                                        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 transform scale-y-0 group-hover:scale-y-100 transition-transform duration-300 rounded-l-2xl" />
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className={cn(iconContainerClasses, "bg-emerald-50 text-emerald-600")}>
                                                    <Building2 className="h-4 w-4" />
                                                </div>
                                                <span className={sectionTitleClasses}>ลูกค้า</span>
                                            </div>
                                            {formData.custCode && (
                                                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-lg">
                                                    {formData.custCode}
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="relative search-container">
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                                <Input
                                                    placeholder="ค้นหาลูกค้า..."
                                                    value={formData.custName}
                                                    onFocus={() => handleSearch('customer', formData.custName, customers)}
                                                    onChange={e => {
                                                        setFormData({ ...formData, custName: e.target.value });
                                                        handleSearch('customer', e.target.value, customers);
                                                    }}
                                                    className={cn(inputClasses, "pl-9 focus:ring-emerald-500/30")}
                                                />
                                            </div>
                                            <SearchResults
                                                results={searchResults.customer}
                                                loading={loading.customer}
                                                onSelect={(item: any) => selectItem('customer', item)}
                                                type="customer"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Destination */}
                                <div className={cn(sectionCardClasses, "hover:border-orange-200")}>
                                    <div className="absolute top-0 left-0 w-1 h-full bg-orange-500 transform scale-y-0 group-hover:scale-y-100 transition-transform duration-300 rounded-l-2xl" />
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className={cn(iconContainerClasses, "bg-orange-50 text-orange-600")}>
                                            <MapPin className="h-4 w-4" />
                                        </div>
                                        <span className={sectionTitleClasses}>ปลายทาง</span>
                                    </div>
                                    <div className="relative search-container">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                            <Input
                                                placeholder="ค้นหาหรือระบุปลายทาง..."
                                                value={formData.destination}
                                                onFocus={() => handleSearch('destination', formData.destination, destinations.map(d => ({ destination: d })))}
                                                onChange={e => {
                                                    setFormData({ ...formData, destination: e.target.value });
                                                    handleSearch('destination', e.target.value, destinations.map(d => ({ destination: d })));
                                                }}
                                                className={cn(inputClasses, "pl-9 focus:ring-orange-500/30")}
                                            />
                                        </div>
                                        <SearchResults
                                            results={searchResults.destination}
                                            loading={loading.destination}
                                            onSelect={(item: any) => selectItem('destination', item)}
                                            type="destination"
                                        />
                                    </div>
                                </div>

                                {/* Notes */}
                                <div className={cn(sectionCardClasses, "hover:border-slate-300")}>
                                    <div className="absolute top-0 left-0 w-1 h-full bg-slate-400 transform scale-y-0 group-hover:scale-y-100 transition-transform duration-300 rounded-l-2xl" />
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className={cn(iconContainerClasses, "bg-slate-100 text-slate-600")}>
                                            <MessageSquare className="h-4 w-4" />
                                        </div>
                                        <span className={sectionTitleClasses}>หมายเหตุ</span>
                                    </div>
                                    <Textarea
                                        placeholder="เพิ่มรายละเอียดเพิ่มเติม (ถ้ามี)..."
                                        value={formData.notes}
                                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                        rows={1}
                                        className="text-sm rounded-xl border-slate-200/80 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-slate-400/30 focus:ring-offset-0 resize-none transition-all placeholder:text-slate-400 min-h-[45px]"
                                    />
                                </div>
                            </div>

                            {/* Right Column - Vehicles (4 cols on large screens) */}
                            <div className="lg:col-span-4 pb-20 md:pb-0">
                                <div className={cn(sectionCardClasses, "hover:border-purple-200 h-full flex flex-col")}>
                                    <div className="absolute top-0 left-0 w-1 h-full bg-purple-500 transform scale-y-0 group-hover:scale-y-100 transition-transform duration-300 rounded-l-2xl" />
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className={cn(iconContainerClasses, "bg-purple-50 text-purple-600")}>
                                                <Truck className="h-4 w-4" />
                                            </div>
                                            <span className={sectionTitleClasses}>รถและคนขับ</span>
                                        </div>
                                        <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-[10px] font-bold px-2 py-0.5 rounded-lg">
                                            {vehiclesList.length} คัน
                                        </Badge>
                                    </div>

                                    <div className="space-y-2.5 flex-1 overflow-y-visible pr-1 custom-scrollbar max-h-[400px]">
                                        {vehiclesList.map((v, i) => (
                                            <div 
                                                key={i} 
                                                className={cn(
                                                    "group/item relative p-2 rounded-xl border transition-all duration-200",
                                                    activeSection === `vehicle-${i}` 
                                                        ? "border-purple-300 bg-purple-50/30 shadow-md" 
                                                        : "border-slate-100 bg-slate-50/30 hover:border-purple-200 hover:bg-purple-50/10"
                                                )}
                                                onClick={() => setActiveSection(`vehicle-${i}`)}
                                            >
                                                <div className="flex items-start gap-2">
                                                    <div className="w-7 h-7 flex items-center justify-center bg-white rounded-lg shadow-sm border border-slate-200 group-hover/item:border-purple-300 transition-all shrink-0">
                                                        <span className="text-[10px] font-black text-slate-600">{i + 1}</span>
                                                    </div>
                                                    
                                                    <div className="flex-1 space-y-2">
                                                        <div className="relative search-container">
                                                            <Input
                                                                placeholder="ทะเบียนรถ"
                                                                value={v.numberCar}
                                                                onFocus={() => handleSearch('vehicle', v.numberCar, vehicles, i)}
                                                                onChange={e => {
                                                                    const updated = [...vehiclesList];
                                                                    updated[i].numberCar = e.target.value;
                                                                    setVehiclesList(updated);
                                                                    handleSearch('vehicle', e.target.value, vehicles, i);
                                                                }}
                                                                className="h-8.5 text-xs rounded-lg border-slate-200 bg-white focus:ring-2 focus:ring-purple-500/30 transition-all"
                                                            />
                                                            {vehicleSearchIndex === i && searchResults.vehicle.length > 0 && (
                                                                <SearchResults
                                                                    results={searchResults.vehicle}
                                                                    loading={loading.vehicle}
                                                                    onSelect={(item: any) => selectItem('vehicle', item, i)}
                                                                    type="vehicle"
                                                                />
                                                            )}
                                                        </div>
                                                        <div className="relative">
                                                            <Input
                                                                placeholder="ชื่อคนขับ"
                                                                value={v.driverName}
                                                                onFocus={() => handleSearch('vehicle', v.driverName, vehicles, i)}
                                                                onChange={e => {
                                                                    const updated = [...vehiclesList];
                                                                    updated[i].driverName = e.target.value;
                                                                    setVehiclesList(updated);
                                                                    handleSearch('vehicle', e.target.value, vehicles, i);
                                                                }}
                                                                className="h-8.5 text-xs rounded-lg border-slate-200 bg-white focus:ring-2 focus:ring-purple-500/30 transition-all"
                                                            />
                                                        </div>
                                                    </div>

                                                    {vehiclesList.length > 1 && (
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setVehiclesList(vehiclesList.filter((_, idx) => idx !== i));
                                                            }} 
                                                            className="h-7 w-7 text-rose-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg shrink-0 transition-all opacity-0 group-hover/item:opacity-100"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <Button 
                                        variant="outline" 
                                        onClick={() => {
                                            setVehiclesList([...vehiclesList, { numberCar: '', driverName: '' }]);
                                            setActiveSection(`vehicle-${vehiclesList.length}`);
                                        }} 
                                        className="mt-3 w-full h-9 text-xs font-bold rounded-xl border-dashed border-2 border-purple-200 text-purple-600 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300 transition-all"
                                    >
                                        <Plus className="h-3.5 w-3.5 mr-1.5" /> เพิ่มรถ
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Modern Footer */}
                    <div className="px-5 py-3.5 border-t border-slate-100 bg-white/80 backdrop-blur-md">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold",
                                    isValid 
                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                                        : "bg-slate-100 text-slate-500 border border-slate-200"
                                )}>
                                    <div className={cn(
                                        "w-1.5 h-1.5 rounded-full",
                                        isValid ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                                    )} />
                                    {isValid ? 'พร้อมบันทึก' : 'ข้อมูลไม่ครบถ้วน'}
                                </div>
                                {editData && parseFloat(editData.netWeight) > 0 && (
                                    <div className="text-[10px] text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                                        น้ำหนักจริง: <span className="font-bold text-slate-700">{parseFloat(editData.netWeight).toLocaleString()} กก.</span>
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex gap-2.5">
                                <Button 
                                    variant="outline" 
                                    onClick={onClose} 
                                    className="h-10 px-5 text-sm font-bold rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 transition-all"
                                >
                                    ยกเลิก
                                </Button>
                                <Button 
                                    onClick={handleSubmit} 
                                    disabled={!isValid} 
                                    className={cn(
                                        "h-10 px-7 text-sm font-bold rounded-xl shadow-lg transition-all active:scale-95 flex items-center gap-2",
                                        isValid 
                                            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-blue-200 hover:shadow-blue-300 hover:brightness-110" 
                                            : "bg-slate-100 text-slate-400 shadow-none border border-slate-200 cursor-not-allowed"
                                    )}
                                >
                                    <Save className="h-4 w-4" />
                                    {editData ? 'บันทึก' : 'สร้างแผน'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default CreatePlanOrderModal;
