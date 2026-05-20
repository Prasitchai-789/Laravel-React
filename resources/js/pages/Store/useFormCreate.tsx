import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

interface Good {
    GoodCode: string;
    GoodName1: string;
    GoodName?: string;
    GoodBrandID?: string;
    GoodCateID?: string;
    Price?: number;
    BuyPrice?: number;
    GoodUnitID?: string;
    StockQty?: number;
    GoodTypeID?: string;
    GoodID?: number;
    status?: string;
    GoodUnitID2?: string;
    GoodPrice2?: number;
    DocuDate?: string;
    SafetyStock?: number;
    stock_qty?: number;
    safety_stock?: number;
}

interface FormCreateProps {
    data?: any;
    onClose?: () => void;
    onSuccess?: () => void;
}

interface SelectedGood extends Good {
    inputStockQty: number;
    inputSafetyStock: number;
}

const FormCreate: React.FC<FormCreateProps> = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Good[]>([]);
    const [selectedGoods, setSelectedGoods] = useState<SelectedGood[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);

    // ✅ Search function
    useEffect(() => {
        if (query.length > 1) {
            setIsSearching(true);

            const searchTimer = setTimeout(() => {
                const params = {
                    query: query,
                };

                console.log('🔍 Sending API request:', {
                    url: '/StoreOrder/goods/search-new',
                    params: params
                });

                axios.get('/StoreOrder/goods/search-new', { params })
                    .then(res => {
                        console.log('✅ API Response:', {
                            status: res.status,
                            data: res.data,
                            count: res.data.length
                        });

                        setResults(res.data);
                        setShowResults(true);
                    })
                    .catch(err => {
                        console.error('❌ API Error:', {
                            message: err.message,
                            response: err.response?.data,
                            status: err.response?.status
                        });
                        setResults([]);

                        // ✅ แจ้งเตือน error ในการค้นหาด้วย Swal
                        Swal.fire({
                            icon: 'error',
                            title: 'เกิดข้อผิดพลาด',
                            text: 'ไม่สามารถค้นหาสินค้าได้ กรุณาลองใหม่อีกครั้ง',
                            confirmButtonColor: '#3B82F6',
                            confirmButtonText: 'ตกลง'
                        });
                    })
                    .finally(() => setIsSearching(false));
            }, 500);

            return () => clearTimeout(searchTimer);
        } else {
            setResults([]);
            setShowResults(false);
        }
    }, [query]);

    // ✅ ฟังก์ชันตรวจสอบสถานะสินค้า
    const getProductStatus = (good: Good) => {
        if (!good.status) return { isExisting: false, isDuplicate: false };

        const isExisting = good.status.includes('✅ มีอยู่แล้วใน store_items');
        const isDuplicate = good.status.includes('⚠️ ซ้ำใน EMGood');

        return { isExisting, isDuplicate };
    };

    // ✅ ฟังก์ชันยืนยันการล้างทั้งหมด
    const confirmClearAll = () => {
        Swal.fire({
            title: 'ยืนยันการล้างทั้งหมด?',
            text: `คุณต้องการล้างสินค้าทั้ง ${selectedGoods.length} รายการออกจากรายการหรือไม่?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#EF4444',
            cancelButtonColor: '#6B7280',
            confirmButtonText: 'ใช่, ล้างทั้งหมด',
            cancelButtonText: 'ยกเลิก'
        }).then((result) => {
            if (result.isConfirmed) {
                clearAll();
                Swal.fire({
                    icon: 'success',
                    title: 'ล้างเรียบร้อย',
                    text: 'ล้างสินค้าทั้งหมดออกจากรายการแล้ว',
                    confirmButtonColor: '#10B981',
                    confirmButtonText: 'ตกลง'
                });
            }
        });
    };

    // ✅ ฟังก์ชันบันทึกสินค้า
    const handleSave = async () => {
        if (selectedGoods.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'ไม่มีสินค้า',
                text: 'ยังไม่มีสินค้าที่เลือก',
                confirmButtonColor: '#3B82F6',
                confirmButtonText: 'ตกลง'
            });
            return;
        }

        const hasEmptyFields = selectedGoods.some(good =>
            good.inputStockQty === undefined || good.inputSafetyStock === undefined
        );

        if (hasEmptyFields) {
            Swal.fire({
                icon: 'warning',
                title: 'ข้อมูลไม่ครบถ้วน',
                text: 'กรุณากรอกจำนวนสต็อกและสต็อกปลอดภัยให้ครบทุกรายการ',
                confirmButtonColor: '#3B82F6',
                confirmButtonText: 'ตกลง'
            });
            return;
        }

        // ✅ ยืนยันการบันทึก
        const { value: isConfirm } = await Swal.fire({
            title: 'ยืนยันการบันทึก?',
            html: `คุณต้องการบันทึกสินค้าทั้งหมด <strong>${selectedGoods.length} รายการ</strong> ลงในระบบหรือไม่?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#10B981',
            cancelButtonColor: '#6B7280',
            confirmButtonText: 'ใช่, บันทึกทันที',
            cancelButtonText: 'ยกเลิก',
            reverseButtons: true
        });

        if (!isConfirm) return;

        setSaveLoading(true);

        try {
            const response = await axios.post('/StoreOrder/goods/import-new', {
                goods: selectedGoods,
            });

            const { saved, exists } = response.data;

            // ✅ แสดงผลลัพธ์การบันทึก
            if (saved.length > 0 && exists.length === 0) {
                await Swal.fire({
                    icon: 'success',
                    title: 'บันทึกสำเร็จ',
                    html: `✅ บันทึกสินค้าสำเร็จ <strong>${saved.length} รายการ</strong>`,
                    confirmButtonColor: '#10B981',
                    confirmButtonText: 'ตกลง'
                });

                // ล้างทั้งหมดถ้าบันทึกสำเร็จทั้งหมด
                setSelectedGoods([]);
            } else if (saved.length > 0 && exists.length > 0) {
                await Swal.fire({
                    icon: 'warning',
                    title: 'บันทึกบางส่วน',
                    html: `
                        <div class="text-left">
                            <div class="mb-2">✅ บันทึกสำเร็จ ${saved.length} รายการ</div>
                            <div>⚠️ มีอยู่แล้ว ${exists.length} รายการ</div>
                        </div>
                    `,
                    confirmButtonColor: '#3B82F6',
                    confirmButtonText: 'ตกลง'
                });

                // อัปเดต state ให้เหลือเฉพาะรายการที่ยังไม่ถูกบันทึก
                setSelectedGoods(exists);
            } else {
                await Swal.fire({
                    icon: 'info',
                    title: 'ไม่มีข้อมูลใหม่',
                    text: 'สินค้าทั้งหมดมีอยู่ในระบบแล้ว',
                    confirmButtonColor: '#3B82F6',
                    confirmButtonText: 'ตกลง'
                });
            }

            setQuery('');
        } catch (error: any) {
            console.error('❌ Save error:', error.response?.data || error.message);

            let errorMessage = 'เกิดข้อผิดพลาดในการบันทึกสินค้า';
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            }

            Swal.fire({
                icon: 'error',
                title: 'บันทึกไม่สำเร็จ',
                text: errorMessage,
                confirmButtonColor: '#EF4444',
                confirmButtonText: 'ตกลง'
            });
        } finally {
            setSaveLoading(false);
        }
    };

    const addProduct = (good: Good) => {
        if (!selectedGoods.find(g => g.GoodCode === good.GoodCode)) {
            const { isExisting } = getProductStatus(good);
            const newSelectedGood: SelectedGood = {
                ...good,
                inputStockQty: isExisting ? (good.StockQty || 0) : 0,
                inputSafetyStock: 0
            };
            setSelectedGoods([...selectedGoods, newSelectedGood]);
            setQuery('');
            setShowResults(false);

            // ✅ แจ้งเตือนการเพิ่มสินค้าสำเร็จ
            Swal.fire({
                icon: 'success',
                title: 'เพิ่มสินค้าแล้ว',
                html: `เพิ่ม <strong>${good.GoodCode}</strong> ลงในรายการนำเข้าแล้ว`,
                timer: 1500,
                showConfirmButton: false,
                position: 'top-end',
                toast: true
            });
        } else {
            // ✅ แจ้งเตือนถ้าสินค้าซ้ำ
            Swal.fire({
                icon: 'warning',
                title: 'สินค้าซ้ำ',
                text: `สินค้า ${good.GoodCode} มีอยู่ในรายการแล้ว`,
                confirmButtonColor: '#3B82F6',
                confirmButtonText: 'ตกลง'
            });
        }
    };

    const removeProduct = (goodCode: string) => {
        const productToRemove = selectedGoods.find(g => g.GoodCode === goodCode);

        Swal.fire({
            title: 'ลบสินค้า?',
            html: `คุณต้องการลบสินค้า <strong>${goodCode}</strong> ออกจากรายการหรือไม่?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#EF4444',
            cancelButtonColor: '#6B7280',
            confirmButtonText: 'ใช่, ลบออก',
            cancelButtonText: 'ยกเลิก',
            reverseButtons: true
        }).then((result) => {
            if (result.isConfirmed) {
                setSelectedGoods(selectedGoods.filter(good => good.GoodCode !== goodCode));

                Swal.fire({
                    icon: 'success',
                    title: 'ลบเรียบร้อย',
                    html: `ลบสินค้า <strong>${goodCode}</strong> ออกจากรายการแล้ว`,
                    timer: 1500,
                    showConfirmButton: false,
                    position: 'top-end',
                    toast: true
                });
            }
        });
    };

    const clearAll = () => {
        setSelectedGoods([]);
    };

    // ✅ ฟังก์ชันอัพเดทจำนวนสต็อก
    const updateStockQty = (goodCode: string, value: number) => {
        setSelectedGoods(selectedGoods.map(good =>
            good.GoodCode === goodCode
                ? { ...good, inputStockQty: value }
                : good
        ));
    };

    // ✅ ฟังก์ชันอัพเดทสต็อกปลอดภัย
    const updateSafetyStock = (goodCode: string, value: number) => {
        setSelectedGoods(selectedGoods.map(good =>
            good.GoodCode === goodCode
                ? { ...good, inputSafetyStock: value }
                : good
        ));
    };

    // ✅ ฟังก์ชันยกเลิก
    const handleCancel = () => {
        if (selectedGoods.length > 0) {
            Swal.fire({
                title: 'ยืนยันการยกเลิก?',
                text: `คุณต้องการยกเลิกการนำเข้าสินค้า ${selectedGoods.length} รายการหรือไม่? ข้อมูลที่กรอกจะหายไป`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#EF4444',
                cancelButtonColor: '#6B7280',
                confirmButtonText: 'ใช่, ยกเลิก',
                cancelButtonText: 'กลับไปกรอกข้อมูล',
                reverseButtons: true
            }).then((result) => {
                if (result.isConfirmed) {
                    setSelectedGoods([]);
                    setQuery('');
                    Swal.fire({
                        icon: 'info',
                        title: 'ยกเลิกแล้ว',
                        text: 'การนำเข้าสินค้าถูกยกเลิกแล้ว',
                        confirmButtonColor: '#3B82F6',
                        confirmButtonText: 'ตกลง'
                    });
                }
            });
        } else {
            setSelectedGoods([]);
            setQuery('');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                    </div>
                    <h1 className="text-4xl font-bold text-gray-800 mb-3">
                        นำเข้าสินค้าใหม่
                    </h1>
                    <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                        ค้นหาและเพิ่มสินค้าใหม่ลงในระบบ inventory
                        <span className="text-blue-600 font-medium"> พร้อมตั้งค่าสต็อกเริ่มต้น</span>
                    </p>
                </div>

                {/* Search Section */}
                <div className="bg-white rounded-3xl shadow-xl p-8 mb-8 border border-gray-100">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">
                                    ค้นหาสินค้า
                                </h2>
                                <p className="text-gray-500 mt-1">
                                    พิมพ์รหัสหรือชื่อสินค้าเพื่อค้นหาในระบบ
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-2xl text-lg font-semibold shadow-lg">
                                📦 {selectedGoods.length} รายการที่เลือก
                            </div>
                        </div>
                    </div>

                    {/* Search Input */}
                    <div className="relative mb-2">
                        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                            <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="พิมพ์รหัสหรือชื่อสินค้า (อย่างน้อย 2 ตัวอักษร)..."
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            className="w-full pl-14 pr-16 py-5 border-2 border-gray-200 rounded-2xl bg-gray-50 focus:bg-white focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all duration-300 text-lg placeholder-gray-400 shadow-sm"
                        />
                        {isSearching && (
                            <div className="absolute inset-y-0 right-0 pr-5 flex items-center">
                                <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
                            </div>
                        )}
                    </div>

                    {/* Search Results */}
                    {showResults && (
                        <div className="mt-6 bg-white border-2 border-gray-200 rounded-2xl shadow-2xl max-h-96 overflow-y-auto animate-fade-in">
                            {results.length > 0 ? (
                                <div className="divide-y divide-gray-100">
                                    {results.map((good, index) => {
                                        const { isExisting, isDuplicate } = getProductStatus(good);

                                        return (
                                            <div
                                                key={`${good.GoodCode}-${index}`}
                                                className={`p-6 hover:bg-blue-50 transition-all duration-300 cursor-pointer group border-l-4 ${isExisting ? 'border-l-orange-400 bg-orange-50' : 'border-l-green-400'
                                                    } ${index === 0 ? 'rounded-t-2xl' : ''} ${index === results.length - 1 ? 'rounded-b-2xl' : ''
                                                    }`}
                                                onClick={() => addProduct(good)}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-start gap-4 flex-1">
                                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm ${isExisting
                                                                ? 'bg-gradient-to-br from-orange-500 to-orange-600'
                                                                : 'bg-gradient-to-br from-green-500 to-green-600'
                                                            }`}>
                                                            {isExisting ? '✓' : '+'}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-3 mb-2">
                                                                <div className="font-bold text-gray-900 text-lg">
                                                                    {good.GoodCode}
                                                                </div>
                                                                {/* ✅ แสดงสถานะจาก API */}
                                                                <div className="flex items-center gap-2">
                                                                    {isExisting && (
                                                                        <div className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                                                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                            </svg>
                                                                            มีในระบบแล้ว
                                                                        </div>
                                                                    )}
                                                                    {!isExisting && (
                                                                        <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                                            </svg>
                                                                            สินค้าใหม่
                                                                        </div>
                                                                    )}
                                                                    {isDuplicate && (
                                                                        <div className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                                            </svg>
                                                                            รหัสซ้ำ
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <p className="text-gray-700 mb-3 text-lg">{good.GoodName1 || good.GoodName}</p>

                                                            {/* ✅ แสดงข้อมูลเพิ่มเติมจาก API */}
                                                            <div className="flex flex-wrap gap-4 text-sm">
                                                                {good.GoodPrice2 && good.GoodPrice2 > 0 && (
                                                                    <span className="text-green-600 font-semibold bg-green-50 px-3 py-1 rounded-full flex items-center gap-1">
                                                                        💰 ราคาล่าสุด: {good.GoodPrice2.toLocaleString('th-TH')} ฿
                                                                    </span>
                                                                )}
                                                                {good.GoodUnitID2 && (
                                                                    <span className="text-blue-600 bg-blue-50 px-3 py-1 rounded-full flex items-center gap-1">
                                                                        📏 หน่วย: {good.GoodUnitID2}
                                                                    </span>
                                                                )}
                                                                {good.DocuDate && (
                                                                    <span className="text-gray-600 bg-gray-100 px-3 py-1 rounded-full flex items-center gap-1">
                                                                        📅 อัพเดท: {new Date(good.DocuDate).toLocaleDateString('th-TH')}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {/* ✅ แสดง status message จาก API */}
                                                            {good.status && (
                                                                <div className="mt-2 text-xs text-gray-500">
                                                                    {good.status}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            addProduct(good);
                                                        }}
                                                        className={`opacity-0 group-hover:opacity-100 px-5 py-2 rounded-xl transition-all duration-300 flex items-center gap-2 font-semibold ${isExisting
                                                                ? 'bg-orange-500 hover:bg-orange-600 text-white'
                                                                : 'bg-green-500 hover:bg-green-600 text-white'
                                                            }`}
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                        </svg>
                                                        {isExisting ? 'อัพเดท' : 'เพิ่ม'}
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="px-6 py-16 text-center text-gray-500">
                                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <p className="text-xl font-semibold text-gray-400 mb-2">ไม่พบสินค้าที่ค้นหา</p>
                                    <p className="text-gray-500">ลองใช้คำค้นหาอื่นหรือตรวจสอบการสะกด</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Selected Products Section */}
                {selectedGoods.length > 0 && (
                    <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-800">
                                        สินค้าที่เลือกแล้ว
                                    </h2>
                                    <p className="text-gray-500 mt-1">
                                        ตั้งค่าสต็อกเริ่มต้นและสต็อกปลอดภัยสำหรับสินค้าแต่ละรายการ
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={confirmClearAll}
                                    className="px-5 py-3 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all duration-300 flex items-center gap-2 font-semibold border border-red-200"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    ล้างทั้งหมด
                                </button>
                            </div>
                        </div>

                        <div className="grid gap-6">
                            {selectedGoods.map((good, index) => {
                                const { isExisting, isDuplicate } = getProductStatus(good);

                                return (
                                    <div
                                        key={good.GoodCode}
                                        className="bg-gradient-to-r from-gray-50 to-white rounded-2xl p-6 border-2 border-gray-200 hover:border-blue-300 transition-all duration-300 shadow-sm"
                                    >
                                        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 mb-6">
                                            <div className="flex items-start gap-4 flex-1">
                                                <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-lg ${isExisting
                                                        ? 'bg-gradient-to-br from-orange-500 to-orange-600'
                                                        : 'bg-gradient-to-br from-blue-500 to-purple-600'
                                                    }`}>
                                                    {index + 1}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <h3 className="font-bold text-gray-900 text-xl">
                                                            {good.GoodCode}
                                                        </h3>
                                                        {/* ✅ แสดงสถานะในส่วนสินค้าที่เลือกแล้ว */}
                                                        <div className="flex items-center gap-2">
                                                            {isExisting && (
                                                                <div className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1 border border-orange-200">
                                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                    </svg>
                                                                    มีในระบบแล้ว
                                                                </div>
                                                            )}
                                                            {!isExisting && (
                                                                <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1 border border-green-200">
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                                    </svg>
                                                                    สินค้าใหม่
                                                                </div>
                                                            )}
                                                            {isDuplicate && (
                                                                <div className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1 border border-red-200">
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                                    </svg>
                                                                    รหัสซ้ำ
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <p className="text-gray-700 mb-4 text-lg">{good.GoodName1 || good.GoodName}</p>

                                                    <div className="flex flex-wrap gap-3 text-sm">
                                                        {good.GoodPrice2 && good.GoodPrice2 > 0 && (
                                                            <span className="text-green-600 font-semibold bg-green-50 px-3 py-2 rounded-xl border border-green-200">
                                                                💰 ราคาล่าสุด: {good.GoodPrice2.toLocaleString('th-TH')} ฿
                                                            </span>
                                                        )}
                                                        {good.GoodUnitID2 && (
                                                            <span className="text-blue-600 bg-blue-50 px-3 py-2 rounded-xl border border-blue-200">
                                                                📏 หน่วย: {good.GoodUnitID2}
                                                            </span>
                                                        )}
                                                        {good.DocuDate && (
                                                            <span className="text-gray-600 bg-gray-100 px-3 py-2 rounded-xl border border-gray-200">
                                                                📅 อัพเดท: {new Date(good.DocuDate).toLocaleDateString('th-TH')}
                                                            </span>
                                                        )}
                                                        {good.stock_qty !== undefined && (
                                                            <span className="text-purple-600 bg-purple-50 px-3 py-2 rounded-xl border border-purple-200">
                                                                💠 สต็อก: {good.stock_qty}
                                                            </span>
                                                        )}
                                                        {good.safety_stock !== undefined && (
                                                            <span className="text-orange-600 bg-orange-50 px-3 py-2 rounded-xl border border-orange-200">
                                                                ⚠️ Safety Stock: {good.safety_stock}
                                                            </span>
                                                        )}
                                                    </div>

                                                </div>
                                            </div>

                                            <button
                                                onClick={() => removeProduct(good.GoodCode)}
                                                className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all duration-300 flex-shrink-0 self-start border border-red-200"
                                            >
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>

                                        {/* Stock Input Section */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                                        </svg>
                                                    </div>
                                                    จำนวนสต็อกเริ่มต้น *
                                                </label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="1"
                                                    value={good.inputStockQty}
                                                    onChange={(e) => updateStockQty(good.GoodCode, parseInt(e.target.value) || 0)}
                                                    className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 bg-white transition-all duration-300 text-lg font-semibold"
                                                    placeholder="กรอกจำนวนสต็อก"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                                    <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                        </svg>
                                                    </div>
                                                    สต็อกปลอดภัย *
                                                </label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="1"
                                                    value={good.inputSafetyStock}
                                                    onChange={(e) => updateSafetyStock(good.GoodCode, parseInt(e.target.value) || 0)}
                                                    className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 bg-white transition-all duration-300 text-lg font-semibold"
                                                    placeholder="กรอกสต็อกปลอดภัย"
                                                />
                                            </div>
                                        </div>

                                        {/* Summary */}
                                        <div className="flex flex-wrap gap-4 mt-4 text-sm">
                                            <div className="text-blue-600 font-bold bg-blue-50 px-4 py-2 rounded-xl border border-blue-200">
                                                📥 สต็อกที่ตั้งค่า: {good.inputStockQty.toLocaleString()} ชิ้น
                                            </div>
                                            <div className="text-orange-600 font-bold bg-orange-50 px-4 py-2 rounded-xl border border-orange-200">
                                                ⚠️ สต็อกปลอดภัย: {good.inputSafetyStock.toLocaleString()} ชิ้น
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row justify-end gap-4 mt-8 pt-8 border-t border-gray-200">
                            <button
                                onClick={handleCancel}
                                className="px-8 py-4 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-all duration-300 flex items-center justify-center gap-3 font-semibold text-lg shadow-lg"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saveLoading}
                                className="px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 disabled:opacity-50 transition-all duration-300 flex items-center justify-center gap-3 font-semibold text-lg shadow-lg shadow-green-200"
                            >
                                {saveLoading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                                        กำลังบันทึก...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        บันทึกสินค้า ({selectedGoods.length} รายการ)
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {selectedGoods.length === 0 && (
                    <div className="bg-white rounded-3xl shadow-xl p-12 border border-gray-100 text-center">
                        <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                            <svg className="w-12 h-12 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                        </div>
                        <h3 className="text-3xl font-bold text-gray-800 mb-4">
                            ยังไม่มีสินค้าที่เลือก
                        </h3>
                        <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
                            ค้นหาสินค้าโดยใช้ช่องค้นหาด้านบน และคลิกปุ่ม "เพิ่ม" เพื่อเลือกลงในรายการนำเข้า
                        </p>
                        <div className="w-16 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto"></div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FormCreate;
