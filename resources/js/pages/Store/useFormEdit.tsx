import React, { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import Swal from 'sweetalert2';

interface FormEditProps {
    data?: any;
    onClose?: () => void;
    onSuccess?: () => void;
    goodUnits?: any[];
    goodNames?: any[];
}

const FormEdit: React.FC<FormEditProps> = ({ data, onClose, onSuccess, goodUnits = [], goodNames = [] }) => {
    const [product, setProduct] = useState({
        good_code: data?.GoodCode || '',
        GoodUnitID: data?.GoodUnitID || '',
        stock_qty: data?.stock_qty ?? 0,
        safety_stock: data?.safety_stock ?? 0,
        price: data?.price ?? '',
        note: data?.Note ?? '',
        GoodName: data?.GoodName || ''
    });
    const [editCategory, setEditCategory] = useState('both');
    const [adjustStock, setAdjustStock] = useState(0);
    const [adjustSafety, setAdjustSafety] = useState(0);
    const [errors, setErrors] = useState({});
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isReturnOpen, setIsReturnOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // ✅ State สำหรับค้นหาสินค้า
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // ฟังก์ชันป้องกันการกดซ้ำ
    const handleSubmitWithPrevention = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isSubmitting) {
            Swal.fire({
                icon: 'info',
                title: 'กำลังดำเนินการ',
                text: 'กรุณารอสักครู่...',
                timer: 1500,
                showConfirmButton: false
            });
            return;
        }

        if (!validateForm()) return;

        setIsSubmitting(true);

        try {
            await handleSubmit(e);
        } catch (error) {
            console.error('Error:', error);
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: 'ไม่สามารถบันทึกข้อมูลได้',
            });
        } finally {
            // รีเซ็ตสถานะหลังจาก 2 วินาทีเพื่อป้องกันการกดซ้ำ
            setTimeout(() => setIsSubmitting(false), 2000);
        }
    };

    useEffect(() => {
        if (data) {
            setProduct({
                good_code: data.GoodCode || '',
                GoodUnitID: data.GoodUnitID || '',
                stock_qty: data.stock_qty ?? 0,
                safety_stock: data.safety_stock ?? 0,
                price: data.price ?? '',
                note: data.Note ?? '',
                GoodName: data.GoodName || ''
            });
        }
    }, [data]);

    // ✅ ฟังก์ชันค้นหาสินค้าใหม่จาก EMGood (Auto-search)
    const searchNewGoods = async (query: string) => {
        if (!query.trim() || query.length < 2) {
            setSearchResults([]);
            setShowSearchResults(false);
            return;
        }

        setIsSearching(true);
        try {
            const response = await fetch(route('goods.search-new') + `?query=${encodeURIComponent(query)}`);
            const data = await response.json();
            setSearchResults(data);
            setShowSearchResults(data.length > 0);
        } catch (error) {
            console.error('Error searching new goods:', error);
            setSearchResults([]);
            setShowSearchResults(false);
        } finally {
            setIsSearching(false);
        }
    };

    // ✅ ฟังก์ชันเมื่อพิมพ์ในช่องค้นหา
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);

        // ค้นหาโดยอัตโนมัติเมื่อพิมพ์
        if (query.length >= 2) {
            const debounceTimer = setTimeout(() => {
                searchNewGoods(query);
            }, 300);

            return () => clearTimeout(debounceTimer);
        } else {
            setSearchResults([]);
            setShowSearchResults(false);
        }
    };

    // ✅ ฟังก์ชันเลือกสินค้าจากผลการค้นหา
    const selectProduct = (good: any) => {
        setProduct(prev => ({
            ...prev,
            good_code: good.GoodCode,
            GoodName: good.GoodName
        }));
        setSearchQuery('');
        setSearchResults([]);
        setShowSearchResults(false);

        Swal.fire({
            icon: 'success',
            title: 'เลือกสินค้าเรียบร้อย',
            text: `เลือก ${good.GoodCode} - ${good.GoodName} แล้ว`,
            timer: 1500,
            showConfirmButton: false
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        const currentGoodCode = product.good_code?.trim();
        const currentGoodName = product.GoodName?.trim();

        if (!currentGoodCode) {
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: 'ไม่พบรหัสสินค้าในระบบ',
            });
            return;
        }

        const payload: any = {
            store_item_code: currentGoodCode,
            price: product.price,
            note: product.note ?? '',
            stock_qty: (editCategory === 'both' || editCategory === 'stock') ? Math.abs(adjustStock) : null,
            stock_type: (editCategory === 'both' || editCategory === 'stock') ? (adjustStock >= 0 ? 'add' : 'subtract') : null,
            safety_stock: (editCategory === 'both' || editCategory === 'safety') ? Math.abs(adjustSafety) : null,
            safety_type: (editCategory === 'both' || editCategory === 'safety') ? (adjustSafety >= 0 ? 'add' : 'subtract') : null,
        };

        return new Promise((resolve, reject) => {
            router.post('/store-movements', payload, {
                onSuccess: () => {
                    Swal.fire({
                        icon: 'success',
                        title: 'บันทึกเรียบร้อยแล้ว',
                        showConfirmButton: false,
                        timer: 1500,
                    }).then(() => {
                        router.get(route('Store.index'));
                        resolve(true);
                    });
                },
                onError: (errors: any) => {
                    Swal.fire({
                        icon: 'error',
                        title: 'เกิดข้อผิดพลาด',
                        text: 'ตรวจสอบข้อมูลอีกครั้ง',
                    });
                    console.error(errors);
                    reject(errors);
                },
            });
        });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        setProduct(prev => {
            const updated = { ...prev, [name]: value };
            if (name === 'good_code') {
                const good = goodNames.find(g => g.GoodCode === value);
                updated.GoodName = good ? good.GoodName1 : '';
            }
            return updated;
        });

        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handleQuantityChange = (field: 'stock_qty' | 'safety_stock', type: 'increase' | 'decrease') => {
        setProduct(prev => {
            const current = parseInt(prev[field] as any) || 0;
            const newValue = type === 'increase' ? current + 1 : Math.max(current - 1, 0);
            return { ...prev, [field]: newValue };
        });
    };

    const handleAdjustmentChange = (field: 'stock' | 'safety', value: number) => {
        if (field === 'stock') {
            setAdjustStock(Math.max(value, 0));
        } else {
            setAdjustSafety(Math.max(value, 0));
        }
    };

    const applyAdjustment = (field: 'stock_qty' | 'safety_stock', adjustment: number) => {
        if (adjustment === 0) return;

        setProduct(prev => ({
            ...prev,
            [field]: Math.max(0, prev[field] + adjustment)
        }));

        if (field === 'stock_qty') {
            setAdjustStock(0);
        } else {
            setAdjustSafety(0);
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        // ✅ อนุญาตทุกค่า (ค่าว่าง, 0, บวก, ลบ) - ไม่ validate ราคา
        // if (product.price && parseFloat(product.price as any) < 0) {
        //     newErrors.price = 'ราคาไม่สามารถเป็นลบได้';
        // }

        if (product.stock_qty < 0) newErrors.stock_qty = 'จำนวนสต็อกไม่สามารถเป็นลบได้';
        if (product.safety_stock < 0) newErrors.safety_stock = 'สต็อกปลอดภัยไม่สามารถเป็นลบได้';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="">
                <form onSubmit={handleSubmitWithPrevention} className="space-y-6">
                    {/* รหัสสินค้าและชื่อสินค้า */}
                    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                            <svg className="h-5 w-5 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                            </svg>
                            ข้อมูลสินค้า
                        </h3>


                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* รหัสสินค้า */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <label className="block text-sm font-medium text-gray-600 mb-2">
                                    รหัสสินค้า
                                </label>
                                <div className="flex items-center">
                                    <svg className="h-5 w-5 text-gray-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-gray-800 font-medium">{product.good_code}</span>
                                </div>
                            </div>

                            {/* ชื่อสินค้า */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <label className="block text-sm font-medium text-gray-600 mb-2">
                                    ชื่อสินค้า
                                </label>
                                <div className="flex items-center">
                                    <svg className="h-5 w-5 text-gray-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-gray-800 font-medium">{product.GoodName}</span>
                                </div>
                            </div>

                            {/* ราคา */}
                            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm md:col-span-2">
                                <label className="block text-sm font-semibold text-gray-800 mb-3">
                                    ราคาสินค้า
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    {/* ✅ แสดงแบบ read-only เสมอ */}
                                    <div className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg bg-gray-50 flex items-center justify-between">
                                        <span className="text-gray-800 font-medium">
                                            {parseFloat(product.price || 0).toLocaleString('th-TH', {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2
                                            })} ฿
                                        </span>
                                       
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* หมวดที่ต้องการแก้ไข */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-4">
                            <svg className="w-5 h-5 text-blue-500 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            เลือกหมวดที่ต้องการแก้ไข <span className="text-red-500">*</span>
                        </label>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {/* Radio Card สำหรับทั้งสองอย่าง */}
                            <label className="relative cursor-pointer">
                                <input
                                    type="radio"
                                    name="editCategory"
                                    value="both"
                                    checked={editCategory === 'both'}
                                    onChange={() => setEditCategory('both')}
                                    className="sr-only"
                                />
                                <div
                                    className={`flex flex-col items-center p-4 border-2 rounded-xl transition-all duration-200
        ${editCategory === 'both'
                                            ? 'bg-blue-50 border-blue-500 shadow-lg'
                                            : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md'}
        `}
                                >
                                    <div
                                        className={`w-12 h-12 rounded-lg flex items-center justify-center mb-3 transition-colors duration-200
          ${editCategory === 'both' ? 'bg-blue-500 text-white' : 'bg-blue-100 text-gray-500'}`}
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                    <span className={`text-sm font-semibold ${editCategory === 'both' ? 'text-blue-600' : 'text-gray-800'}`}>ทั้งสองอย่าง</span>
                                    <span className="text-xs text-gray-500 text-center mt-1">แก้ไขทั้งสต็อกและสต็อกปลอดภัย</span>

                                    {editCategory === 'both' && (
                                        <div className="absolute top-3 right-3 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                            </label>

                            {/* Radio Card สำหรับสต็อก */}
                            <label className="relative cursor-pointer">
                                <input
                                    type="radio"
                                    name="editCategory"
                                    value="stock"
                                    checked={editCategory === 'stock'}
                                    onChange={() => setEditCategory('stock')}
                                    className="sr-only"
                                />
                                <div className={`flex flex-col items-center p-4 border-2 rounded-xl transition-all duration-200
                                            ${editCategory === 'stock'
                                        ? 'bg-orange-50 border-orange-500 shadow-lg'
                                        : 'bg-white border-gray-200 hover:border-orange-300 hover:shadow-md'}
                                            `}
                                >
                                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-3 transition-colors duration-200
                                        ${editCategory === 'stock' ? 'bg-orange-500 text-white' : 'bg-orange-100 text-gray-500'}`}
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path d="M20 7H4C2.89543 7 2 7.89543 2 9V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V9C22 7.89543 21.1046 7 20 7Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M16 21V5C16 3.89543 15.1046 3 14 3H10C8.89543 3 8 3.89543 8 5V21" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                    <span className={`text-sm font-semibold ${editCategory === 'stock' ? 'text-orange-600' : 'text-gray-800'}`}>Stock</span>
                                    <span className="text-xs text-gray-500 text-center mt-1">แก้ไขเฉพาะจำนวนสต็อกเท่านั้น</span>

                                    {editCategory === 'stock' && (
                                        <div className="absolute top-3 right-3 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                            </label>

                            {/* Radio Card สำหรับสต็อกปลอดภัย */}
                            <label className="relative cursor-pointer">
                                <input
                                    type="radio"
                                    name="editCategory"
                                    value="safety"
                                    checked={editCategory === 'safety'}
                                    onChange={() => setEditCategory('safety')}
                                    className="sr-only"
                                />
                                <div
                                    className={`flex flex-col items-center p-4 border-2 rounded-xl transition-all duration-200
                                    ${editCategory === 'safety'
                                            ? 'bg-green-50 border-green-500 shadow-lg'
                                            : 'bg-white border-gray-200 hover:border-green-300 hover:shadow-md'}
                                `}
                                >
                                    <div
                                        className={`w-12 h-12 rounded-lg flex items-center justify-center mb-3 transition-colors duration-200
          ${editCategory === 'safety' ? 'bg-green-500 text-white' : 'bg-green-100 text-gray-500'}`}
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                    <span className={`text-sm font-semibold ${editCategory === 'safety' ? 'text-green-600' : 'text-gray-800'}`}>Safety Stock</span>
                                    <span className="text-xs text-gray-500 text-center mt-1">แก้ไขเฉพาะสต็อกปลอดภัยเท่านั้น</span>

                                    {editCategory === 'safety' && (
                                        <div className="absolute top-3 right-3 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* จำนวนสต็อกและสต็อกปลอดภัย - แสดงในแถวเดียวกัน */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        {/* ส่วนปรับสต็อกสินค้า */}
                        {editCategory !== 'safety' && (
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100 shadow-sm">
                                <h3 className="text-xl font-semibold text-blue-900 mb-4 flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                    Stock สินค้า
                                </h3>

                                <div className="grid grid-cols-1 gap-5">
                                    <div className="bg-white p-5 rounded-xl border border-blue-100 shadow-sm">
                                        <div className="mb-4">
                                            <p className="text-sm text-gray-500 mb-1">ค่าปัจจุบัน</p>
                                            <div className="text-2xl font-bold text-blue-700">{product.stock_qty} <span className="text-sm font-normal text-gray-500">ชิ้น</span></div>
                                        </div>

                                        <div className="flex items-center justify-between gap-3 mb-5">
                                            {/* ปุ่มลด */}
                                            <button
                                                type="button"
                                                onClick={() => setAdjustStock(prev => prev - 1)}
                                                className="p-3 bg-blue-100 text-blue-800 rounded-xl hover:bg-blue-200 transition-colors flex-shrink-0"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                                </svg>
                                            </button>

                                            {/* Input ปรับค่า */}
                                            <div className="relative flex-1">
                                                <input
                                                    type="number"
                                                    value={adjustStock}
                                                    onChange={(e) => setAdjustStock(parseInt(e.target.value) || 0)}
                                                    className="w-full px-4 py-3 border border-blue-200 rounded-xl text-center focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-xl font-bold text-blue-800"
                                                    placeholder="0"
                                                />
                                                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                                    <span className="text-blue-600 font-medium text-lg">{adjustStock >= 0 ? '+' : ''}</span>
                                                </div>
                                            </div>

                                            {/* ปุ่มเพิ่ม */}
                                            <button
                                                type="button"
                                                onClick={() => setAdjustStock(prev => prev + 1)}
                                                className="p-3 bg-blue-100 text-blue-800 rounded-xl hover:bg-blue-200 transition-colors flex-shrink-0"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                </svg>
                                            </button>
                                        </div>

                                    </div>

                                    {/* ผลลัพธ์ */}
                                    <div className="bg-white p-5 rounded-xl border border-blue-100 shadow-sm flex flex-col justify-center">
                                        <p className="text-sm text-gray-500 mb-2">ผลลัพธ์หลังจากปรับ</p>
                                        <div className="flex items-center justify-center gap-2 text-xl">
                                            <span className="font-semibold text-blue-700">{product.stock_qty}</span>
                                            <span className="text-gray-400">{adjustStock >= 0 ? '+' : ''}</span>
                                            <span className={`font-semibold ${adjustStock >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                {adjustStock}
                                            </span>
                                            <span className="text-gray-400">=</span>
                                            <span className="font-bold text-green-600 text-2xl">
                                                {product.stock_qty + adjustStock}
                                            </span>
                                            <span className="text-gray-500 text-sm">ชิ้น</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ส่วนปรับสต็อกปลอดภัย */}
                        {editCategory !== 'stock' && (
                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100 shadow-sm">
                                <h3 className="text-xl font-semibold text-green-900 mb-4 flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                    Safety Stock
                                </h3>

                                <div className="grid grid-cols-1 gap-5">
                                    <div className="bg-white p-5 rounded-xl border border-green-100 shadow-sm">
                                        <div className="mb-4">
                                            <p className="text-sm text-gray-500 mb-1">ค่าปัจจุบัน</p>
                                            <div className="text-2xl font-bold text-green-700">{product.safety_stock} <span className="text-sm font-normal text-gray-500">ชิ้น</span></div>
                                        </div>

                                        <div className="flex items-center justify-between gap-3 mb-5">
                                            <button
                                                type="button"
                                                onClick={() => setAdjustSafety(prev => prev - 1)}
                                                className="p-3 bg-green-100 text-green-800 rounded-xl hover:bg-green-200 transition-colors flex-shrink-0"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                                </svg>
                                            </button>

                                            <div className="relative flex-1">
                                                <input
                                                    type="number"
                                                    value={adjustSafety}
                                                    onChange={(e) => setAdjustSafety(parseInt(e.target.value) || 0)}
                                                    className="w-full px-4 py-3 border border-green-200 rounded-xl text-center focus:ring-2 focus:ring-green-400 focus:border-green-400 text-xl font-bold text-green-800"
                                                    placeholder="0"
                                                />
                                                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                                    <span className="text-green-600 font-medium text-lg">{adjustSafety >= 0 ? '+' : ''}</span>
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => setAdjustSafety(prev => prev + 1)}
                                                className="p-3 bg-green-100 text-green-800 rounded-xl hover:bg-green-200 transition-colors flex-shrink-0"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="bg-white p-5 rounded-xl border border-green-100 shadow-sm flex flex-col justify-center">
                                        <p className="text-sm text-gray-500 mb-2">ผลลัพธ์หลังจากปรับ</p>
                                        <div className="flex items-center justify-center gap-2 text-xl">
                                            <span className="font-semibold text-green-700">{product.safety_stock}</span>
                                            <span className="text-gray-400">{adjustSafety >= 0 ? '+' : ''}</span>
                                            <span className={`font-semibold ${adjustSafety >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                {adjustSafety}
                                            </span>
                                            <span className="text-gray-400">=</span>
                                            <span className="font-bold text-green-600 text-2xl">
                                                {product.safety_stock + adjustSafety}
                                            </span>
                                            <span className="text-gray-500 text-sm">ชิ้น</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* หมายเหตุ */}
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700">หมายเหตุ</label>
                        <div className="relative">
                            <div className="absolute top-3 left-3 text-gray-400">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <textarea
                                name="note"
                                value={product.note}
                                onChange={handleChange}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                                rows={3}
                                placeholder="กรอกหมายเหตุเกี่ยวกับสินค้า..."
                            />
                        </div>
                    </div>

                    {/* ปุ่มดำเนินการ */}
                    <div className="flex flex-col sm:flex-row gap-3 justify-end pt-6 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                            ยกเลิก
                        </button>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`px-6 py-3 text-white rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${isSubmitting
                                ? 'bg-blue-300 cursor-not-allowed'
                                : 'bg-blue-500 hover:bg-blue-600'
                                }`}
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    กำลังบันทึก...
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    บันทึกการเปลี่ยนแปลง
                                </>
                            )}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default FormEdit;
