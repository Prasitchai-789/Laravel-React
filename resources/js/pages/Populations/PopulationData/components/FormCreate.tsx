import React, { useState } from "react";
import AppLayout from "@/layouts/app-layout";
import { Head, router } from "@inertiajs/react";
import axios from "axios";

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
    Shirt,
    GraduationCap
} from "lucide-react";

const FormCreate: React.FC = () => {
    const [hasCard, setHasCard] = useState<"yes" | "no" | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [receivedItems, setReceivedItems] = useState<number[]>([]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
        // ดึงข้อมูลจาก form
        const form = new FormData(e.currentTarget);
        const payload = Object.fromEntries(form.entries());

        // รวม payload + array (ต้อง JSON.stringify)
        const finalPayload = {
            ...payload,
            received_items: JSON.stringify(receivedItems),
        };

        await router.post("/population/createpopulation", finalPayload, {
            preserveScroll: true,
            onFinish: () => {
                setIsSubmitting(false);
            },
        });

    } catch (error) {
        console.error(error);
        setIsSubmitting(false);
    }
};


    const handleItemToggle = (itemId: number) => {
        setReceivedItems(prev =>
            prev.includes(itemId)
                ? prev.filter(id => id !== itemId)
                : [...prev, itemId]
        );
    };

    return (
        <AppLayout>
            <Head title="เพิ่มข้อมูลประชากร" />

            <div className="min-h-screen bg-whilte py-8 font-ANUPHAT">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="w-20 h-20 bg-white rounded-2xl shadow-sm border border-blue-100 flex items-center justify-center mx-auto mb-4">
                            <Users className="w-10 h-10 text-blue-600" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-3">
                            เพิ่มข้อมูลประชากร
                        </h1>
                        <p className="text-gray-600 text-lg">
                            กรุณาเลือกประเภทข้อมูลที่ต้องการบันทึก
                        </p>
                    </div>

                    {/* Toggle Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div
                            onClick={() => setHasCard("yes")}
                            className={`p-6 rounded-2xl cursor-pointer transition-all duration-300 border-2 ${hasCard === "yes"
                                    ? "border-blue-500 bg-blue-50 shadow-lg scale-105"
                                    : "border-gray-200 bg-white hover:shadow-md hover:border-blue-300"
                                }`}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                    <UserCheck className="w-6 h-6 text-blue-600" />
                                </div>
                                <div className={`w-6 h-6 rounded-full border-2 ${hasCard === "yes" ? "bg-blue-500 border-blue-500" : "border-gray-300"
                                    }`}>
                                    {hasCard === "yes" && (
                                        <Check className="w-4 h-4 text-white" />
                                    )}
                                </div>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                มีบัตรประชาชน
                            </h3>
                            <p className="text-gray-600 text-sm">
                                บันทึกข้อมูลพร้อมเลขบัตรประชาชนและข้อมูลส่วนตัวครบถ้วน
                            </p>
                        </div>

                        <div
                            onClick={() => setHasCard("no")}
                            className={`p-6 rounded-2xl cursor-pointer transition-all duration-300 border-2 ${hasCard === "no"
                                    ? "border-green-500 bg-green-50 shadow-lg scale-105"
                                    : "border-gray-200 bg-white hover:shadow-md hover:border-green-300"
                                }`}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                    <UserX className="w-6 h-6 text-green-600" />
                                </div>
                                <div className={`w-6 h-6 rounded-full border-2 ${hasCard === "no" ? "bg-green-500 border-green-500" : "border-gray-300"
                                    }`}>
                                    {hasCard === "no" && (
                                        <Check className="w-4 h-4 text-white" />
                                    )}
                                </div>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                ไม่มีบัตรประชาชน
                            </h3>
                            <p className="text-gray-600 text-sm">
                                บันทึกข้อมูลพื้นฐานโดยไม่มีเลขบัตรประชาชน
                            </p>
                        </div>
                    </div>

                    {/* Forms - Minimal Version */}
                    {!hasCard && (
                        <div className="text-center py-20 bg-white rounded-2xl border-2 border-gray-200">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <FileText className="w-10 h-10 text-gray-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-600 mb-3">
                                รอการเลือกประเภทข้อมูล
                            </h3>
                            <p className="text-gray-500">
                                กรุณาเลือกประเภทข้อมูลที่ต้องการบันทึกด้านบน
                            </p>
                        </div>
                    )}

                    {(hasCard === "yes" || hasCard === "no") && (
                        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                            {/* Header */}
                            <div className={`bg-gradient-to-r p-6 ${hasCard === "yes" ? "from-blue-600 to-blue-700" : "from-green-600 to-green-700"
                                }`}>
                                <h2 className="text-2xl font-bold text-white flex items-center">
                                    {hasCard === "yes" ? (
                                        <UserCheck className="w-6 h-6 mr-3" />
                                    ) : (
                                        <UserX className="w-6 h-6 mr-3" />
                                    )}
                                    {hasCard === "yes" ? "ฟอร์มผู้มีบัตรประชาชน" : "ฟอร์มผู้ไม่มีบัตรประชาชน"}
                                </h2>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* ข้อมูลส่วนตัว */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {hasCard === "yes" && (
                                        <>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    เลขบัตรประชาชน *
                                                </label>
                                                <input
                                                    name="national_id"
                                                    placeholder="เช่น 1-2345-67890-12-3"
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    คำนำหน้า
                                                </label>
                                                <input
                                                    name="title"
                                                    placeholder="เช่น นาย, นาง, นางสาว"
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    ชื่อ *
                                                </label>
                                                <input
                                                    name="first_name"
                                                    placeholder="ชื่อจริง"
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    นามสกุล *
                                                </label>
                                                <input
                                                    name="last_name"
                                                    placeholder="นามสกุล"
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    วันเกิด
                                                </label>
                                                <input
                                                    type="date"
                                                    name="birthdate"
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    เพศ
                                                </label>
                                                <input
                                                    name="gender"
                                                    placeholder="ชาย หรือ หญิง"
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                />
                                            </div>
                                        </>
                                    )}

                                    {hasCard === "no" && (
                                        <>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    คำนำหน้า
                                                </label>
                                                <input
                                                    name="title"
                                                    placeholder="เช่น นาย, นาง, นางสาว"
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    ชื่อ
                                                </label>
                                                <input
                                                    name="first_name"
                                                    placeholder="ชื่อจริง"
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    นามสกุล
                                                </label>
                                                <input
                                                    name="last_name"
                                                    placeholder="นามสกุล"
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                                                />
                                            </div>
                                        </>
                                    )}

                                    {/* ข้อมูลที่อยู่ (ร่วมกันทั้งสองฟอร์ม) */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            <Home className="w-4 h-4 inline mr-1" />
                                            บ้านเลขที่
                                        </label>
                                        <input
                                            name="house_no"
                                            placeholder="เลขที่บ้าน"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            <Hash className="w-4 h-4 inline mr-1" />
                                            หมู่ที่
                                        </label>
                                        <input
                                            name="village_no"
                                            type="number"
                                            placeholder="หมายเลขหมู่"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            <MapPin className="w-4 h-4 inline mr-1" />
                                            ที่อยู่
                                        </label>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <input
                                                name="subdistrict_name"
                                                placeholder="ตำบล"
                                                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                            />
                                            <input
                                                name="district_name"
                                                placeholder="อำเภอ"
                                                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                            />
                                            <input
                                                name="province_name"
                                                placeholder="จังหวัด"
                                                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* ส่วนเลือกรับของ */}
                                <div className="border-t pt-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                        <Shirt className="w-5 h-5 mr-2 text-blue-600" />
                                        รายการที่ได้รับ
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div
                                            onClick={() => handleItemToggle(2)}
                                            className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${receivedItems.includes(2)
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-gray-200 bg-white hover:border-blue-300'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center">
                                                    <Shirt className={`w-5 h-5 mr-3 ${receivedItems.includes(2) ? 'text-blue-600' : 'text-gray-400'
                                                        }`} />
                                                    <span className="font-medium text-gray-900">รับเสื้อ</span>
                                                </div>
                                                <div className={`w-5 h-5 rounded-full border-2 ${receivedItems.includes(2)
                                                        ? 'bg-blue-500 border-blue-500'
                                                        : 'border-gray-300'
                                                    }`}>
                                                    {receivedItems.includes(2) && (
                                                        <Check className="w-3 h-3 text-white" />
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div
                                            onClick={() => handleItemToggle(3)}
                                            className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${receivedItems.includes(3)
                                                    ? 'border-green-500 bg-green-50'
                                                    : 'border-gray-200 bg-white hover:border-green-300'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center">
                                                    <GraduationCap className={`w-5 h-5 mr-3 ${receivedItems.includes(3) ? 'text-green-600' : 'text-gray-400'
                                                        }`} />
                                                    <span className="font-medium text-gray-900">รับหมวก</span>
                                                </div>
                                                <div className={`w-5 h-5 rounded-full border-2 ${receivedItems.includes(3)
                                                        ? 'bg-green-500 border-green-500'
                                                        : 'border-gray-300'
                                                    }`}>
                                                    {receivedItems.includes(3) && (
                                                        <Check className="w-3 h-3 text-white" />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>


                                {/* ปุ่มดำเนินการ */}
                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setHasCard(null)}
                                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium flex items-center"
                                    >
                                        <ArrowLeft className="w-4 h-4 mr-2" />
                                        ย้อนกลับ
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className={`flex-1 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center text-white ${hasCard === "yes"
                                                ? 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400'
                                                : 'bg-green-600 hover:bg-green-700 disabled:bg-green-400'
                                            }`}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="animate-spin w-5 h-5 mr-2" />
                                                กำลังบันทึก...
                                            </>
                                        ) : (
                                            'บันทึกข้อมูล'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </AppLayout>
    );
};

export default FormCreate;
