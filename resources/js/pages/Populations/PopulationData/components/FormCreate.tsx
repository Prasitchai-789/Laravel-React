import React, { useState, useEffect } from "react";
import AppLayout from "@/layouts/app-layout";
import { Head, router } from "@inertiajs/react";
import Swal from 'sweetalert2';
import {
    Users,
    Check,
    FileText,
    UserCheck,
    UserX,
    ArrowLeft,
    Loader2,
    MapPin,
    Home,
    Hash,
    Heart,
    Stethoscope,
    GraduationCap,
    Shield,
    DollarSign,
    Utensils,
    BookOpen,
    Briefcase,
    Car,
    Wifi,
    TreePine,
    Sprout,
    Gift,
    Award,
    Clock,
    Calendar,
    Phone,
    Mail,
    Map,
    Plus,
    Sparkles
} from "lucide-react";

// สร้าง type สำหรับ item
interface SeederItem {
    id: number;
    name: string;
    icon: string;
    color?: string;
}

// Mapping icon names to Lucide components
const iconMap: { [key: string]: React.ComponentType<any> } = {
    'heart': Heart,
    'stethoscope': Stethoscope,
    'graduation-cap': GraduationCap,
    'home': Home,
    'shield': Shield,
    'dollar-sign': DollarSign,
    'utensils': Utensils,
    'book-open': BookOpen,
    'briefcase': Briefcase,
    'car': Car,
    'wifi': Wifi,
    'tree-pine': TreePine,
    'sprout': Sprout,
    'users': Users,
    'file-text': FileText,
    'gift': Gift,
    'award': Award,
    'clock': Clock,
    'calendar': Calendar,
    'phone': Phone,
    'mail': Mail,
    'map': Map
};

// Fallback icon if not found
const FallbackIcon = FileText;

const FormCreate: React.FC = () => {
    const [hasCard, setHasCard] = useState<"yes" | "no" | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [receivedItems, setReceivedItems] = useState<number[]>([]);
    const [seederItems, setSeederItems] = useState<SeederItem[]>([]);

    // 🔥 ดึงข้อมูล seeder status items จาก backend
    useEffect(() => {
        const fetchItems = async () => {
            try {
                const response = await fetch("/getSeederStatusItems");
                const data = await response.json();
                setSeederItems(data);
            } catch (error) {
                console.error("Error fetching seeder items:", error);
                Swal.fire({
                    icon: 'error',
                    title: '❌ เกิดข้อผิดพลาด',
                    text: 'ไม่สามารถดึงข้อมูลรายการที่ได้รับได้',
                });
            }
        };
        fetchItems();
    }, []);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (isSubmitting) return;

        setIsSubmitting(true);
        try {
            const form = new FormData(e.currentTarget);
            const payload = Object.fromEntries(form.entries());

            const finalPayload = {
                ...payload,
                received_items: JSON.stringify(receivedItems),
            };

            console.log('🚀 Payload:', finalPayload);

            await router.post("/population/createpopulation", finalPayload, {
                preserveScroll: true,
                onFinish: () => setIsSubmitting(false),
                onError: (errors) => {
                    setIsSubmitting(false);
                    const errorMessages = Object.values(errors).flat().join("\n");
                    Swal.fire({
                        icon: 'error',
                        title: '❌ เกิดข้อผิดพลาด',
                        text: errorMessages || 'เกิดข้อผิดพลาดไม่ทราบสาเหตุ',
                    });
                },
                onSuccess: () => {
                    setIsSubmitting(false);
                    Swal.fire({
                        icon: 'success',
                        title: '✅ บันทึกสำเร็จ',
                        text: 'ข้อมูลประชากรถูกบันทึกเรียบร้อยแล้ว',
                        timer: 2000,
                        showConfirmButton: false,
                    });
                    setHasCard(null);
                    setReceivedItems([]);
                    e.currentTarget.reset();
                }
            });
        } catch (error: any) {
            console.error('💥 Error:', error);
            setIsSubmitting(false);
            Swal.fire({
                icon: 'error',
                title: '💥 เกิดข้อผิดพลาด',
                text: error?.message || 'เกิดข้อผิดพลาดไม่ทราบสาเหตุ',
            });
        }
    };

    const handleItemToggle = (itemId: number) => {
        setReceivedItems(prev =>
            prev.includes(itemId)
                ? prev.filter(id => id !== itemId)
                : [...prev, itemId]
        );
    };

    // Function to get icon component
    const getIconComponent = (iconName: string) => {
        const IconComponent = iconMap[iconName] || FallbackIcon;
        return <IconComponent className="w-5 h-5" />;
    };

    // Function to get color classes
    const getColorClasses = (item: SeederItem, isSelected: boolean) => {
        const baseColor = item.color || 'blue';

        const colorMap: { [key: string]: any } = {
            blue: {
                bg: 'bg-blue-50',
                border: 'border-blue-500',
                icon: 'text-blue-600',
                check: 'bg-blue-500 border-blue-500',
                iconBg: 'bg-blue-100',
                gradient: 'from-blue-500 to-blue-600'
            },
            green: {
                bg: 'bg-green-50',
                border: 'border-green-500',
                icon: 'text-green-600',
                check: 'bg-green-500 border-green-500',
                iconBg: 'bg-green-100',
                gradient: 'from-green-500 to-green-600'
            },
            red: {
                bg: 'bg-red-50',
                border: 'border-red-500',
                icon: 'text-red-600',
                check: 'bg-red-500 border-red-500',
                iconBg: 'bg-red-100',
                gradient: 'from-red-500 to-red-600'
            },
            yellow: {
                bg: 'bg-yellow-50',
                border: 'border-yellow-500',
                icon: 'text-yellow-600',
                check: 'bg-yellow-500 border-yellow-500',
                iconBg: 'bg-yellow-100',
                gradient: 'from-yellow-500 to-yellow-600'
            },
            purple: {
                bg: 'bg-purple-50',
                border: 'border-purple-500',
                icon: 'text-purple-600',
                check: 'bg-purple-500 border-purple-500',
                iconBg: 'bg-purple-100',
                gradient: 'from-purple-500 to-purple-600'
            },
            pink: {
                bg: 'bg-pink-50',
                border: 'border-pink-500',
                icon: 'text-pink-600',
                check: 'bg-pink-500 border-pink-500',
                iconBg: 'bg-pink-100',
                gradient: 'from-pink-500 to-pink-600'
            },
            indigo: {
                bg: 'bg-indigo-50',
                border: 'border-indigo-500',
                icon: 'text-indigo-600',
                check: 'bg-indigo-500 border-indigo-500',
                iconBg: 'bg-indigo-100',
                gradient: 'from-indigo-500 to-indigo-600'
            }
        };

        const color = colorMap[baseColor] || colorMap.blue;

        if (isSelected) {
            return color;
        }

        return {
            bg: 'bg-white',
            border: 'border-gray-200 hover:border-gray-300',
            icon: 'text-gray-500',
            check: 'border-gray-300',
            iconBg: 'bg-gray-100',
            gradient: 'from-gray-400 to-gray-500'
        };
    };

    return (
        <AppLayout>
            <Head title="เพิ่มข้อมูลประชากร" />

            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-8 font-ANUPHAT">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <div className="relative inline-block mb-6">
                            <div className="w-24 h-24 bg-white rounded-3xl shadow-lg border border-blue-100 flex items-center justify-center mx-auto transform hover:scale-105 transition-transform duration-300">
                                <div className="relative">
                                    <Users className="w-12 h-12 text-blue-600" />
                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
                                </div>
                            </div>
                            <div className="absolute -top-2 -right-2">
                                <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
                                    <Plus className="w-4 h-4 text-white" />
                                </div>
                            </div>
                        </div>
                        <h1 className="text-4xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                            เพิ่มข้อมูลประชากร
                        </h1>
                        <p className="text-gray-600 text-lg max-w-2xl mx-auto leading-relaxed">
                            เลือกประเภทข้อมูลที่ต้องการบันทึกและกรอกข้อมูลให้ครบถ้วน
                        </p>
                    </div>

                    {/* Toggle Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                        <div
                            onClick={() => setHasCard("yes")}
                            className={`relative p-8 rounded-3xl cursor-pointer transition-all duration-500 border-2 backdrop-blur-sm ${
                                hasCard === "yes"
                                    ? "border-blue-500 bg-white/80 shadow-2xl scale-105 ring-4 ring-blue-100"
                                    : "border-gray-200/80 bg-white/60 hover:shadow-xl hover:border-blue-300 hover:bg-white/80"
                            }`}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                                    <UserCheck className="w-8 h-8 text-white" />
                                </div>
                                <div className={`w-7 h-7 rounded-full border-2 transition-all duration-300 ${
                                    hasCard === "yes"
                                        ? "bg-blue-500 border-blue-500 shadow-lg transform scale-110"
                                        : "border-gray-300 bg-white/80"
                                }`}>
                                    {hasCard === "yes" && (
                                        <Check className="w-4 h-4 text-white animate-scale-in" />
                                    )}
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-3">
                                มีบัตรประชาชน
                            </h3>
                            <p className="text-gray-600 leading-relaxed">
                                บันทึกข้อมูลพร้อมเลขบัตรประชาชนและข้อมูลส่วนตัวครบถ้วน
                            </p>
                            {hasCard === "yes" && (
                                <div className="absolute top-4 right-4">
                                    <Sparkles className="w-5 h-5 text-blue-500 animate-pulse" />
                                </div>
                            )}
                        </div>

                        <div
                            onClick={() => setHasCard("no")}
                            className={`relative p-8 rounded-3xl cursor-pointer transition-all duration-500 border-2 backdrop-blur-sm ${
                                hasCard === "no"
                                    ? "border-green-500 bg-white/80 shadow-2xl scale-105 ring-4 ring-green-100"
                                    : "border-gray-200/80 bg-white/60 hover:shadow-xl hover:border-green-300 hover:bg-white/80"
                            }`}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                                    <UserX className="w-8 h-8 text-white" />
                                </div>
                                <div className={`w-7 h-7 rounded-full border-2 transition-all duration-300 ${
                                    hasCard === "no"
                                        ? "bg-green-500 border-green-500 shadow-lg transform scale-110"
                                        : "border-gray-300 bg-white/80"
                                }`}>
                                    {hasCard === "no" && (
                                        <Check className="w-4 h-4 text-white animate-scale-in" />
                                    )}
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-3">
                                ไม่มีบัตรประชาชน
                            </h3>
                            <p className="text-gray-600 leading-relaxed">
                                บันทึกข้อมูลพื้นฐานโดยไม่มีเลขบัตรประชาชน
                            </p>
                            {hasCard === "no" && (
                                <div className="absolute top-4 right-4">
                                    <Sparkles className="w-5 h-5 text-green-500 animate-pulse" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Forms */}
                    {!hasCard && (
                        <div className="text-center py-24 bg-white/80 rounded-3xl border-2 border-gray-200/60 backdrop-blur-sm">
                            <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                                <FileText className="w-12 h-12 text-gray-400" />
                            </div>
                            <h3 className="text-2xl font-semibold text-gray-500 mb-4">
                                รอการเลือกประเภทข้อมูล
                            </h3>
                            <p className="text-gray-400 text-lg">
                                กรุณาเลือกประเภทข้อมูลที่ต้องการบันทึกด้านบน
                            </p>
                        </div>
                    )}

                    {(hasCard === "yes" || hasCard === "no") && (
                        <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden border border-white/20">
                            {/* Form Header */}
                            <div className={`relative bg-gradient-to-r p-8 ${hasCard === "yes" ? "from-blue-500 to-blue-600" : "from-green-500 to-green-600"}`}>
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>

                                <div className="relative">
                                    <h2 className="text-3xl font-bold text-white flex items-center mb-2">
                                        {hasCard === "yes" ? <UserCheck className="w-8 h-8 mr-4" /> : <UserX className="w-8 h-8 mr-4" />}
                                        {hasCard === "yes" ? "ฟอร์มผู้มีบัตรประชาชน" : "ฟอร์มผู้ไม่มีบัตรประชาชน"}
                                    </h2>
                                    <p className="text-blue-100 text-lg">
                                        กรุณากรอกข้อมูลให้ครบถ้วนตามความเป็นจริง
                                    </p>
                                </div>
                            </div>

                            <div className="p-8 space-y-8">
                                {/* Personal Info Section */}
                                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                                    <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mr-3">
                                            <Users className="w-5 h-5 text-blue-600" />
                                        </div>
                                        ข้อมูลส่วนบุคคล
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {hasCard === "yes" && (
                                            <>
                                                <div className="space-y-2">
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        เลขบัตรประชาชน *
                                                    </label>
                                                    <input
                                                        name="national_id"
                                                        placeholder="เช่น 1-2345-67890-12-3"
                                                        className="w-full px-4 py-3.5 border border-gray-300 rounded-xl focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/50"
                                                        required
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        คำนำหน้า
                                                    </label>
                                                    <input
                                                        name="title"
                                                        placeholder="เช่น นาย, นาง, นางสาว"
                                                        className="w-full px-4 py-3.5 border border-gray-300 rounded-xl focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/50"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        ชื่อ *
                                                    </label>
                                                    <input
                                                        name="first_name"
                                                        placeholder="ชื่อจริง"
                                                        className="w-full px-4 py-3.5 border border-gray-300 rounded-xl focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/50"
                                                        required
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        นามสกุล *
                                                    </label>
                                                    <input
                                                        name="last_name"
                                                        placeholder="นามสกุล"
                                                        className="w-full px-4 py-3.5 border border-gray-300 rounded-xl focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/50"
                                                        required
                                                    />
                                                </div>
                                            </>
                                        )}

                                        {hasCard === "no" && (
                                            <>
                                                <div className="space-y-2">
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        คำนำหน้า
                                                    </label>
                                                    <input
                                                        name="title"
                                                        placeholder="เช่น นาย, นาง, นางสาว"
                                                        className="w-full px-4 py-3.5 border border-gray-300 rounded-xl focus:ring-3 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300 bg-white/50"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        ชื่อ
                                                    </label>
                                                    <input
                                                        name="first_name"
                                                        placeholder="ชื่อจริง"
                                                        className="w-full px-4 py-3.5 border border-gray-300 rounded-xl focus:ring-3 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300 bg-white/50"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        นามสกุล
                                                    </label>
                                                    <input
                                                        name="last_name"
                                                        placeholder="นามสกุล"
                                                        className="w-full px-4 py-3.5 border border-gray-300 rounded-xl focus:ring-3 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300 bg-white/50"
                                                    />
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Address Section */}
                                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                                    <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                                        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mr-3">
                                            <MapPin className="w-5 h-5 text-green-600" />
                                        </div>
                                        ที่อยู่
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                                                <Home className="w-4 h-4 mr-2 text-gray-500" />
                                                บ้านเลขที่
                                            </label>
                                            <input
                                                name="house_no"
                                                placeholder="เลขที่บ้าน"
                                                className="w-full px-4 py-3.5 border border-gray-300 rounded-xl focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/50"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                                                <Hash className="w-4 h-4 mr-2 text-gray-500" />
                                                หมู่ที่
                                            </label>
                                            <input
                                                name="village_no"
                                                type="number"
                                                placeholder="หมายเลขหมู่"
                                                className="w-full px-4 py-3.5 border border-gray-300 rounded-xl focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/50"
                                            />
                                        </div>

                                        <div className="md:col-span-2 space-y-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                                                <Map className="w-4 h-4 mr-2 text-gray-500" />
                                                ที่อยู่
                                            </label>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <input
                                                    name="subdistrict_name"
                                                    placeholder="ตำบล"
                                                    className="px-4 py-3.5 border border-gray-300 rounded-xl focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/50"
                                                />
                                                <input
                                                    name="district_name"
                                                    placeholder="อำเภอ"
                                                    className="px-4 py-3.5 border border-gray-300 rounded-xl focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/50"
                                                />
                                                <input
                                                    name="province_name"
                                                    placeholder="จังหวัด"
                                                    className="px-4 py-3.5 border border-gray-300 rounded-xl focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/50"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Dynamic Received Items */}
                                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                                    <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                                        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mr-3">
                                            <Gift className="w-5 h-5 text-purple-600" />
                                        </div>
                                        รายการที่ได้รับ
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {seederItems.map(item => {
                                            const isSelected = receivedItems.includes(item.id);
                                            const colorClasses = getColorClasses(item, isSelected);

                                            return (
                                                <div
                                                    key={item.id}
                                                    onClick={() => handleItemToggle(item.id)}
                                                    className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 group backdrop-blur-sm ${
                                                        isSelected
                                                            ? `${colorClasses.bg} ${colorClasses.border} shadow-lg transform scale-105 ring-2 ring-opacity-20 ${colorClasses.border.replace('border-', 'ring-')}`
                                                            : `${colorClasses.bg} ${colorClasses.border} hover:shadow-lg hover:scale-105 bg-white/60`
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center space-x-3">
                                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm ${
                                                                isSelected ? colorClasses.iconBg : 'bg-gray-100 group-hover:bg-gray-200'
                                                            }`}>
                                                                <span className={isSelected ? colorClasses.icon : 'text-gray-500'}>
                                                                    {getIconComponent(item.icon)}
                                                                </span>
                                                            </div>
                                                            <span className={`font-semibold ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>
                                                                {item.name}
                                                            </span>
                                                        </div>
                                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                                                            isSelected ? `${colorClasses.check} shadow-inner` : 'border-gray-300 bg-white'
                                                        }`}>
                                                            {isSelected && (
                                                                <Check className="w-3 h-3 text-white animate-scale-in" />
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {receivedItems.length > 0 && (
                                        <div className="mt-6 p-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg">
                                            <p className="text-white text-sm font-medium flex items-center justify-center">
                                                <Check className="w-5 h-5 mr-2" />
                                                เลือกแล้ว {receivedItems.length} รายการ
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Buttons */}
                                <div className="flex gap-4 pt-6">
                                    <button
                                        type="button"
                                        onClick={() => setHasCard(null)}
                                        className="px-8 py-4 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-300 font-semibold flex items-center hover:shadow-lg hover:scale-105 active:scale-95"
                                    >
                                        <ArrowLeft className="w-5 h-5 mr-2" />
                                        ย้อนกลับ
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className={`flex-1 py-4 rounded-xl font-bold transition-all duration-300 flex items-center justify-center text-white shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 ${
                                            hasCard === "yes"
                                                ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-blue-300 disabled:to-blue-400'
                                                : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-green-300 disabled:to-green-400'
                                        }`}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="animate-spin w-6 h-6 mr-3" />
                                                กำลังบันทึก...
                                            </>
                                        ) : (
                                            <>
                                                <Check className="w-6 h-6 mr-3" />
                                                บันทึกข้อมูล
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </form>
                    )}
                </div>
            </div>

            <style jsx>{`
                @keyframes scale-in {
                    from { transform: scale(0); }
                    to { transform: scale(1); }
                }
                .animate-scale-in {
                    animation: scale-in 0.2s ease-out;
                }
            `}</style>
        </AppLayout>
    );
};

export default FormCreate;
