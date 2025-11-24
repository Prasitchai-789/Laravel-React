import React, { useMemo } from 'react';
import {
    X, User, Briefcase, Calendar, MapPin, Tag, List, HardDrive, Barcode, Info,
    Image, ClipboardCheck, Cpu, Database, Server, Wrench, Clock, CheckCircle,
    AlertCircle, DollarSign, Package, Settings, Monitor, Smartphone, TrendingUp, Zap, FileText
} from 'lucide-react';
import { Icon as IconType } from 'lucide-react';

// =================================================
// 1. INTERFACES & TYPES
// =================================================

type AssetStatus = "ใช้งานอยู่" | "พร้อมใช้งาน" | "ไม่พร้อมใช้งาน" | "กำลังดำเนินการ";
type MaintenanceType = "ซ่อมบำรุง" | "ซ่อมใหญ่" | "ตรวจสอบ" | "อัพเกรด";
type MaintenanceStatus = "สำเร็จ" | "กำลังดำเนินการ" | "ยกเลิก";

interface MaintenanceRecord {
    id: string;
    date: string;
    type: MaintenanceType;
    description: string;
    technician: string;
    status: MaintenanceStatus;
    cost?: number;
    duration?: string;
    partsReplaced?: string[];
    note?: string;
}

interface ITOrder {
    orderId: string;
    productName: string;
    brand: string;
    model: string;
    status: AssetStatus;
    requester: string;
    department: string;
    location: string;
    purpose: string;
    specification: string;
    requestDate: string;
    processor: string; // ผู้ดำเนินการ (IT)
    assetTag?: string;
    serialNumber?: string;
    note?: string;
    image_path?: string;
    category?: string;
    cpu?: string;
    ram?: string;
    storage?: string;
    maintenanceHistory?: MaintenanceRecord[];
}

interface OrderDetailModalProps {
    order: ITOrder;
    onClose: () => void;
    // เพิ่ม props สำหรับ action buttons ถ้าต้องการ
    onEdit?: () => void;
    onAddMaintenance?: () => void;
}

// =================================================
// 2. CONFIGURATIONS
// =================================================

// กำหนดสีและไอคอนตามสถานะหลักของอุปกรณ์
const STATUS_CONFIG: Record<AssetStatus, {
    color: string;
    bgColor: string;
    ringColor: string;
    label: string;
    icon: IconType; // ใช้ IconType จาก Lucide
}> = {
    "ใช้งานอยู่": {
        color: "text-green-700",
        bgColor: "bg-gradient-to-r from-green-500 to-emerald-500",
        ringColor: "ring-green-300",
        label: "ใช้งานอยู่",
        icon: Zap
    },
    "พร้อมใช้งาน": {
        color: "text-blue-700",
        bgColor: "bg-gradient-to-r from-blue-500 to-cyan-500",
        ringColor: "ring-blue-300",
        label: "พร้อมใช้งาน",
        icon: CheckCircle
    },
    "ไม่พร้อมใช้งาน": {
        color: "text-red-700",
        bgColor: "bg-gradient-to-r from-red-500 to-rose-500",
        ringColor: "ring-red-300",
        label: "ไม่พร้อมใช้งาน",
        icon: AlertCircle
    },
    "กำลังดำเนินการ": {
        color: "text-amber-700",
        bgColor: "bg-gradient-to-r from-amber-500 to-orange-500",
        ringColor: "ring-amber-300",
        label: "กำลังดำเนินการ",
        icon: Clock
    },
};

// กำหนดสีสำหรับประเภทการซ่อมบำรุง
const MAINTENANCE_TYPE_CONFIG: Record<MaintenanceType, { color: string; icon: IconType; badgeClass: string }> = {
    "ซ่อมบำรุง": { color: "blue", icon: Wrench, badgeClass: "bg-blue-500/10 text-blue-700 border border-blue-200" },
    "ซ่อมใหญ่": { color: "red", icon: AlertCircle, badgeClass: "bg-red-500/10 text-red-700 border border-red-200" },
    "ตรวจสอบ": { color: "green", icon: CheckCircle, badgeClass: "bg-green-500/10 text-green-700 border border-green-200" },
    "อัพเกรด": { color: "purple", icon: TrendingUp, badgeClass: "bg-purple-500/10 text-purple-700 border border-purple-200" }
};

// กำหนดสีสำหรับสถานะการซ่อมบำรุง
const MAINTENANCE_STATUS_CONFIG: Record<MaintenanceStatus, { color: string; icon: IconType; badgeClass: string }> = {
    "สำเร็จ": { color: "text-green-700", icon: CheckCircle, badgeClass: "bg-green-500/10 text-green-700 border border-green-200" },
    "กำลังดำเนินการ": { color: "text-blue-700", icon: Clock, badgeClass: "bg-blue-500/10 text-blue-700 border border-blue-200" },
    "ยกเลิก": { color: "text-red-700", icon: X, badgeClass: "bg-red-500/10 text-red-700 border border-red-200" }
};

// =================================================
// 3. HELPER FUNCTIONS
// =================================================

const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'ไม่ระบุ';
    try {
        // ใช้ toISOString ก่อนเพื่อให้แน่ใจว่า Date object ถูกสร้างอย่างถูกต้อง
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'วันที่ไม่ถูกต้อง';

        return date.toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (e) {
        return 'วันที่ไม่ถูกต้อง';
    }
};

const formatCurrency = (amount?: number): string => {
    if (amount === undefined || amount === null) return 'ไม่ระบุ';
    return new Intl.NumberFormat('th-TH', {
        style: 'currency',
        currency: 'THB',
        minimumFractionDigits: 0
    }).format(amount);
};

const getCategoryIconComponent = (category?: string): IconType => {
    switch (category?.toLowerCase()) {
        case 'computer':
        case 'laptop':
            return Monitor;
        case 'printer':
            return Printer;
        case 'server':
            return Server;
        case 'network':
        case 'switch':
        case 'router':
            return Settings;
        case 'smartphone':
        case 'mobile':
            return Smartphone;
        default:
            return Package;
    }
};

// =================================================
// 4. SUB-COMPONENTS
// =================================================

// Component: แสดงข้อมูลเป็นคู่ในรูปแบบ Card (เน้นสีน้ำเงิน)
const InfoItem: React.FC<{
    label: string;
    value?: string;
    icon: IconType;
    className?: string;
    valueClassName?: string;
    isLarge?: boolean;
}> = ({ label, value, icon: Icon, className = "", valueClassName = "", isLarge = false }) => (
    <div className={`p-4 bg-white rounded-xl border border-gray-200/80 hover:border-blue-400/80 transition-all duration-300 hover:shadow-lg ${className}`}>
        <div className="flex items-start space-x-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg text-white shadow-md flex-shrink-0">
                <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs font-medium uppercase text-gray-500 tracking-wider mb-0.5 font-['Anuphan']">{label}</p>
                <p className={`font-semibold text-gray-900 leading-relaxed break-words font-['Anuphan'] ${isLarge ? 'text-base' : 'text-sm'} ${valueClassName}`}>
                    {value || <span className="text-gray-400 italic font-medium">ไม่ระบุ</span>}
                </p>
            </div>
        </div>
    </div>
);

// Component: แสดงสเปคเฉพาะ (เน้นสีม่วง)
const SpecItem: React.FC<{ icon: IconType; label: string; value?: string }> = ({ icon: Icon, label, value }) => (
    <div className="flex items-center space-x-4 p-4 bg-white rounded-xl border border-gray-200/80 hover:border-purple-400 transition-all duration-300 shadow-sm">
        <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg text-white shadow-md flex-shrink-0">
            <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5 font-['Anuphan']">{label}</p>
            <p className="font-bold text-gray-900 text-base font-['Anuphan']">
                {value || <span className="text-gray-400 italic font-medium">ไม่ระบุ</span>}
            </p>
        </div>
    </div>
);

// Component: แสดงรายการประวัติการซ่อม
const MaintenanceItem: React.FC<{ record: MaintenanceRecord }> = ({ record }) => {
    const typeConfig = MAINTENANCE_TYPE_CONFIG[record.type] || MAINTENANCE_TYPE_CONFIG["ซ่อมบำรุง"];
    const statusConfig = MAINTENANCE_STATUS_CONFIG[record.status] || MAINTENANCE_STATUS_CONFIG["สำเร็จ"];

    // กำหนดสีของ Icon และ Timeline
    const iconClass = typeConfig.color === "blue" ? "bg-blue-500 text-white" :
                      typeConfig.color === "red" ? "bg-red-500 text-white" :
                      typeConfig.color === "green" ? "bg-green-500 text-white" :
                      "bg-purple-500 text-white";

    return (
        <div className="flex items-start group">
            <div className="flex flex-col items-center mr-4">
                <div className={`p-2 rounded-full ring-2 ring-white shadow-md transition-all duration-300 ${iconClass}`}>
                    <typeConfig.icon className="w-4 h-4" />
                </div>
                <div className="h-full w-0.5 bg-gradient-to-b from-gray-200 to-transparent group-last:hidden" />
            </div>
            <div className="flex-1 min-w-0 bg-white rounded-xl border border-gray-200/80 p-4 shadow-sm mb-6 hover:shadow-lg hover:border-orange-300 transition-all duration-300">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 mb-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                            {/* Type Badge */}
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold font-['Anuphan'] ${typeConfig.badgeClass}`}>
                                <typeConfig.icon className="w-3 h-3" />
                                {record.type}
                            </span>
                            {/* Status Badge */}
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold font-['Anuphan'] ${statusConfig.badgeClass}`}>
                                <statusConfig.icon className="w-3 h-3" />
                                {record.status}
                            </span>
                        </div>
                        <h4 className="font-bold text-gray-900 text-sm mb-1 leading-relaxed font-['Anuphan']">{record.description}</h4>
                        <p className="text-xs text-gray-500 flex items-center gap-1 font-['Anuphan']">
                            <User className="w-3 h-3" />
                            โดย <span className="font-medium text-gray-700">{record.technician}</span>
                        </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                        <p className="text-sm font-semibold text-gray-700 bg-gray-100 px-3 py-1 rounded-lg border border-gray-200 font-['Anuphan']">
                            {formatDate(record.date)}
                        </p>
                        {record.duration && (
                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1 justify-end font-['Anuphan']">
                                <Clock className="w-3 h-3" />
                                ระยะเวลา: {record.duration}
                            </p>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs border-t border-gray-100 pt-3">
                    {record.cost !== undefined && (
                        <div className="flex items-center gap-2 font-['Anuphan']">
                            <DollarSign className="w-4 h-4 text-green-600" />
                            <span className="text-gray-500">ค่าใช้จ่าย: </span>
                            <span className="font-bold text-green-600 ml-auto">{formatCurrency(record.cost)}</span>
                        </div>
                    )}
                    {record.partsReplaced && record.partsReplaced.length > 0 && (
                        <div className="flex items-start gap-2 md:col-span-2">
                            <Package className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div className="font-['Anuphan'] flex-1 min-w-0">
                                <span className="text-gray-500">อะไหล่ที่เปลี่ยน: </span>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {record.partsReplaced.map((part, index) => (
                                        <span key={index} className="inline-block bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full border border-blue-200 font-medium font-['Anuphan']">
                                            {part}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {record.note && (
                    <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                        <p className="text-xs text-amber-800 leading-relaxed font-medium font-['Anuphan']">
                            <span className="font-semibold mr-1">หมายเหตุ:</span>{record.note}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

// =================================================
// 5. MAIN COMPONENT
// =================================================

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({ order, onClose, onEdit, onAddMaintenance }) => {
    // ใช้ useMemo เพื่อป้องกันการคำนวณซ้ำที่ไม่จำเป็น
    const config = useMemo(() => STATUS_CONFIG[order.status] || {
        color: "text-gray-700",
        bgColor: "bg-gradient-to-r from-gray-500 to-gray-600",
        ringColor: "ring-gray-300",
        label: order.status,
        icon: Info
    }, [order.status]);
// console.log(order.image_path);
    const CategoryIcon = useMemo(() => getCategoryIconComponent(order.category), [order.category]);
    const maintenanceHistory = order.maintenanceHistory || [];
    const hasTechnicalSpecs = !!order.cpu || !!order.ram || !!order.storage;

    return (
        <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
            onClick={onClose} // ปิดเมื่อคลิกนอก Modal
        >
            <div
                className="bg-gray-50 rounded-3xl p-6 md:p-10 max-w-6xl w-full max-h-[95vh] overflow-y-auto shadow-2xl relative transform transition-all duration-500 scale-100 border-4 border-white ring-2 ring-blue-500/5 font-['Anuphan'] scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-gray-100 scrollbar-thumb-rounded-full scrollbar-track-rounded-full hover:scrollbar-thumb-blue-400"
                onClick={(e) => e.stopPropagation()} // ป้องกันการ propagate ไปที่ overlay
            >
                {/* Close Button (Top Right) */}
                {/* <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 bg-white/70 backdrop-blur-sm rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all duration-300 z-10 shadow-lg border border-gray-200"
                    aria-label="ปิดหน้าต่าง"
                >
                    <X className="w-5 h-5" />
                </button> */}

                {/* Header Section */}
                <div className="mb-10 pb-4 border-b border-gray-200">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
                        <div className="flex-1">
                            <div className="flex items-start gap-4 mb-3">
                                <div className="p-4 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-xl flex-shrink-0 text-white">
                                    <CategoryIcon className="w-6 h-6" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 leading-tight font-['Anuphan'] break-words">
                                        {order.productName}
                                    </h2>
                                    <p className="text-base lg:text-lg text-gray-600 mt-1 font-['Anuphan']">
                                        <span className="font-semibold text-gray-700">{order.brand} / {order.model}</span>
                                        <span className="text-gray-400 ml-3 font-mono text-sm">#{order.orderId}</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                        {/* Status Badge */}
                        <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-xl text-white font-bold shadow-xl ${config.bgColor} ring-4 ${config.ringColor} transform transition-all duration-300 hover:scale-105 font-['Anuphan'] flex-shrink-0`}>
                            <config.icon className="w-5 h-5" />
                            <span className="text-base uppercase tracking-wider">{config.label}</span>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
                    {/* LEFT COLUMN: Image & Quick Specs (Col Span 4) */}
                    <div className="xl:col-span-4 space-y-8">

                        {/* Image Section */}
                        <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-lg ">
                            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 font-['Anuphan']">
                                <Image className="w-5 h-5 text-blue-500" />
                                ภาพอุปกรณ์
                            </h3>
                            {order.image_path ? (
                                <div className="relative group overflow-hidden rounded-xl">
                                    <img
                                        src={`/storage/${order.image_path}`}
                                        alt={order.productName}
                                        className="w-full h-72 object-cover transition-transform duration-500 group-hover:scale-110 shadow-md"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.onerror = null;
                                            target.src = "https://via.placeholder.com/400x300?text=Image+Not+Found"; // Fallback image
                                        }}
                                    />
                                    <div className="absolute inset-0 bg-black/10 transition-opacity duration-300 group-hover:opacity-0" />
                                </div>
                            ) : (
                                <div className="w-full h-72 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-500 border-2 border-dashed border-gray-300">
                                    <Image className="w-16 h-16 mb-3 opacity-70" />
                                    <p className="text-sm font-medium font-['Anuphan']">ไม่มีรูปภาพแสดง</p>
                                </div>
                            )}
                        </div>

                        {/* Technical Specifications */}
                        {hasTechnicalSpecs && (
                            <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-lg">
                                <h3 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2 font-['Anuphan']">
                                    <Cpu className="w-5 h-5 text-purple-500" />
                                    คุณสมบัติหลัก
                                </h3>
                                <div className="space-y-4">
                                    {order.cpu && <SpecItem icon={Cpu} label="CPU" value={order.cpu} />}
                                    {order.ram && <SpecItem icon={Server} label="RAM" value={order.ram} />}
                                    {order.storage && <SpecItem icon={Database} label="Storage" value={order.storage} />}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT COLUMN: All Other Details (Col Span 8) */}
                    <div className="xl:col-span-8 space-y-8">

                        {/* Asset & Allocation Block */}
                        <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-lg">
                            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2 pb-2 border-b border-gray-100 font-['Anuphan']">
                                <HardDrive className="w-5 h-5 text-blue-500" />
                                ข้อมูลการจัดสรรและผู้รับผิดชอบ
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                <InfoItem label="Asset Tag" value={order.asset_id} icon={Barcode} valueClassName="font-mono text-base" />
                                <InfoItem label="Serial Number" value={order.serial_number} icon={Info} valueClassName="font-mono text-base" />
                                <InfoItem label="วันที่ขอ" value={formatDate(order.created_at)} icon={Calendar} />
                                <InfoItem label="ผู้ขอ" value={order.requester} icon={User} />
                                <InfoItem label="แผนก" value={order.department} icon={Briefcase} />
                                <InfoItem label="ผู้ดำเนินการ (IT)" value={order.assignee} icon={User} />
                                <InfoItem
                                    label="สถานที่ติดตั้ง/ใช้งาน"
                                    value={order.location}
                                    icon={MapPin}
                                    className="sm:col-span-2 lg:col-span-3"
                                    isLarge={true}
                                />
                            </div>
                        </div>

                        {/* Purpose & Specification Details Block */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* Purpose */}
                            <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-lg">
                                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2 pb-2 border-b border-gray-100 font-['Anuphan']">
                                    <Tag className="w-5 h-5 text-amber-500" />
                                    วัตถุประสงค์การใช้งาน
                                </h3>
                                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                                    <p className="text-gray-800 leading-relaxed whitespace-pre-wrap text-sm font-medium font-['Anuphan']">
                                        {order.purpose || <span className="text-gray-400 italic">ไม่ระบุวัตถุประสงค์</span>}
                                    </p>
                                </div>
                            </div>

                            {/* Specification Section */}
                            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
                                {/* Header */}
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-purple-500 rounded-lg text-white">
                                        <List className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800 font-['Anuphan']">รายละเอียดสเปค</h3>
                                        <p className="text-sm text-gray-500 mt-0.5 font-['Anuphan']">ข้อมูลจำเพาะทางเทคนิค</p>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm font-['Anuphan']">
                                        {order.specification || (
                                            <span className="text-gray-400 italic">ไม่ระบุรายละเอียดสเปค</span>
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Maintenance History */}
                        <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-lg">
                            <div className="flex items-center justify-between mb-6 pb-2 border-b border-gray-100">
                                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2 font-['Anuphan']">
                                    <Wrench className="w-5 h-5 text-orange-500" />
                                    ประวัติการซ่อมบำรุง
                                </h3>
                                <span className="text-sm font-bold text-orange-600 bg-orange-100 px-3 py-1 rounded-full border border-orange-200 font-['Anuphan']">
                                    {maintenanceHistory.length} รายการ
                                </span>
                            </div>

                            {maintenanceHistory.length > 0 ? (
                                <div className="space-y-2 max-h-96 overflow-y-auto pr-3 scrollbar-thin scrollbar-thumb-orange-300 scrollbar-track-gray-50 scrollbar-thumb-rounded-full scrollbar-track-rounded-full hover:scrollbar-thumb-orange-400">
                                    {maintenanceHistory.map((record) => (
                                        <MaintenanceItem key={record.id} record={record} />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                                    <Wrench className="w-16 h-16 mx-auto mb-3 opacity-60" />
                                    <p className="text-base font-semibold font-['Anuphan']">ไม่มีประวัติการซ่อมบำรุงในระบบ</p>
                                </div>
                            )}
                        </div>

                        {/* Note (Optional) */}
                        {order.note && (
                            <div className="bg-white rounded-2xl p-6 border border-red-200/80 shadow-lg">
                                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2 pb-2 border-b border-gray-100 font-['Anuphan']">
                                    <AlertCircle className="w-5 h-5 text-red-500" />
                                    หมายเหตุ / ข้อควรระวัง
                                </h3>
                                <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                                    <p className="text-red-800 leading-relaxed whitespace-pre-wrap text-sm font-medium font-['Anuphan']">
                                        {order.note}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer / Action Buttons */}
                <div className="flex justify-end gap-4 pt-8 mt-8 border-t border-gray-200">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-all duration-300 shadow-md hover:shadow-lg border border-gray-300 font-['Anuphan']"
                    >
                        <X className="w-4 h-4 inline-block mr-2" />
                        ปิดหน้าต่าง
                    </button>
                    {onEdit && (
                        <button
                            onClick={onEdit}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2 font-['Anuphan']"
                        >
                            <ClipboardCheck className="w-4 h-4" />
                            แก้ไขข้อมูลหลัก
                        </button>
                    )}
                    {onAddMaintenance && (
                        <button
                            onClick={onAddMaintenance}
                            className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2 font-['Anuphan']"
                        >
                            <Wrench className="w-4 h-4" />
                            เพิ่มบันทึกการซ่อม
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

<label >
    onEdit
    <input>

    </input>
</label>

