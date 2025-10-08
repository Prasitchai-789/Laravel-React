import React, { useState, useEffect } from 'react';
import axios from 'axios';

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
}

interface SelectedGood extends Good {
    inputStockQty: number;
    inputSafetyStock: number;
}

const FormCreate: React.FC = () => {
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
                const params = { query: query };

                axios.get('/StoreOrder/goods/search-new', { params })
                    .then(res => {
                        setResults(res.data);
                        setShowResults(true);
                    })
                    .catch(err => {
                        console.error('❌ API Error:', err);
                        setResults([]);
                    })
                    .finally(() => setIsSearching(false));
            }, 500);

            return () => clearTimeout(searchTimer);
        } else {
            setResults([]);
            setShowResults(false);
        }
    }, [query]);

    // ✅ Save function
    const handleSave = async () => {
        if (selectedGoods.length === 0) {
            alert("ยังไม่มีสินค้าที่เลือก");
            return;
        }

        const hasEmptyFields = selectedGoods.some(good =>
            good.inputStockQty === undefined || good.inputSafetyStock === undefined
        );

        if (hasEmptyFields) {
            alert("กรุณากรอกจำนวนสต็อกและสต็อกปลอดภัยให้ครบทุกรายการ");
            return;
        }

        setSaveLoading(true);

        try {
            const response = await axios.post('/StoreOrder/goods/import-new', {
                goods: selectedGoods,
            });

            const { saved, exists } = response.data;

            let msg = '';
            if (saved.length > 0) msg += `✅ บันทึกสำเร็จ ${saved.length} รายการ\n`;
            if (exists.length > 0) msg += `⚠️ มีอยู่แล้ว ${exists.length} รายการ`;

            alert(msg);
            setSelectedGoods(exists);
            setQuery('');
        } catch (error: any) {
            console.error('❌ Save error:', error);
            alert('เกิดข้อผิดพลาดในการบันทึกสินค้า ❌');
        } finally {
            setSaveLoading(false);
        }
    };

    const addProduct = (good: Good) => {
        if (!selectedGoods.find(g => g.GoodCode === good.GoodCode)) {
            const newSelectedGood: SelectedGood = {
                ...good,
                inputStockQty: 0,
                inputSafetyStock: 0
            };
            setSelectedGoods([...selectedGoods, newSelectedGood]);
            setQuery('');
            setShowResults(false);
        }
    };

    const removeProduct = (goodCode: string) => {
        setSelectedGoods(selectedGoods.filter(good => good.GoodCode !== goodCode));
    };

    const clearAll = () => {
        setSelectedGoods([]);
    };

    const updateStockQty = (goodCode: string, value: number) => {
        setSelectedGoods(selectedGoods.map(good =>
            good.GoodCode === goodCode
                ? { ...good, inputStockQty: value }
                : good
        ));
    };

    const updateSafetyStock = (goodCode: string, value: number) => {
        setSelectedGoods(selectedGoods.map(good =>
            good.GoodCode === goodCode
                ? { ...good, inputSafetyStock: value }
                : good
        ));
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">
                        🛍️ นำเข้าสินค้าใหม่
                    </h1>
                    <p className="text-gray-600">
                        ค้นหาและเพิ่มสินค้าใหม่ลงในระบบ inventory
                    </p>
                </div>

                {/* Search Section */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                ค้นหาสินค้า
                            </h2>
                            <p className="text-gray-500 text-sm mt-1">
                                พิมพ์รหัสหรือชื่อสินค้าเพื่อค้นหาในระบบ
                            </p>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium">
                                📦 {selectedGoods.length} รายการที่เลือก
                            </div>
                        </div>
                    </div>

                    {/* Search Input */}
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="พิมพ์รหัสหรือชื่อสินค้า (อย่างน้อย 2 ตัวอักษร)..."
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            className="w-full pl-12 pr-12 py-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-lg placeholder-gray-400"
                        />
                        {isSearching && (
                            <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
                            </div>
                        )}
                    </div>

                    {/* Search Results */}
                    {showResults && (
                        <div className="mt-4 bg-white border border-gray-200 rounded-xl shadow-lg max-h-96 overflow-y-auto animate-fade-in">
                            {results.length > 0 ? (
                                <div className="divide-y divide-gray-100">
                                    {results.map((good, index) => (
                                        <div
                                            key={good.GoodCode}
                                            className={`p-4 hover:bg-blue-50 transition-all duration-200 cursor-pointer group ${
                                                index === 0 ? 'rounded-t-xl' : ''
                                            } ${index === results.length - 1 ? 'rounded-b-xl' : ''}`}
                                            onClick={() => addProduct(good)}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4 flex-1">
                                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                                                        {good.GoodCode.substring(0, 3)}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <div className="font-semibold text-gray-900">
                                                                {good.GoodCode}
                                                            </div>
                                                            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                                                            <div className="text-sm text-gray-500 truncate flex-1">
                                                                {good.GoodName1 || good.GoodName}
                                                            </div>
                                                        </div>

                                                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                                                            {good.Price && good.Price > 0 && (
                                                                <span className="flex items-center gap-1">
                                                                    💰 {good.Price.toLocaleString('th-TH')} ฿
                                                                </span>
                                                            )}
                                                            {good.StockQty !== undefined && (
                                                                <span className="flex items-center gap-1">
                                                                    📊 {good.StockQty.toLocaleString()} ชิ้น
                                                                </span>
                                                            )}
                                                            {good.GoodTypeID && (
                                                                <span className="flex items-center gap-1">
                                                                    🏷️ {good.GoodTypeID}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        addProduct(good);
                                                    }}
                                                    className="opacity-0 group-hover:opacity-100 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 font-medium"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                    </svg>
                                                    เพิ่ม
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="px-6 py-12 text-center text-gray-500">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <p className="text-lg font-medium text-gray-400 mb-2">ไม่พบสินค้าที่ค้นหา</p>
                                    <p className="text-sm">ลองใช้คำค้นหาอื่นหรือตรวจสอบการสะกด</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Selected Products Section */}
                {selectedGoods.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                                    <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    สินค้าที่เลือกแล้ว
                                </h2>
                                <p className="text-gray-500 text-sm mt-1">
                                    ตั้งค่าสต็อกเริ่มต้นและสต็อกปลอดภัยสำหรับสินค้าแต่ละรายการ
                                </p>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={clearAll}
                                    className="px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-all duration-200 flex items-center gap-2 text-sm font-medium"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    ล้างทั้งหมด
                                </button>
                            </div>
                        </div>

                        <div className="grid gap-4">
                            {selectedGoods.map((good, index) => (
                                <div
                                    key={good.GoodCode}
                                    className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-6 border border-gray-200 hover:border-blue-300 transition-all duration-200"
                                >
                                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-4">
                                        <div className="flex items-start gap-4 flex-1">
                                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                                                {index + 1}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="font-bold text-gray-900 text-lg">
                                                        {good.GoodCode}
                                                    </h3>
                                                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                                    <span className="text-green-600 text-sm font-medium bg-green-50 px-2 py-1 rounded-full">
                                                        พร้อมใช้งาน
                                                    </span>
                                                </div>
                                                <p className="text-gray-700 mb-3">{good.GoodName1 || good.GoodName}</p>

                                                <div className="flex flex-wrap gap-4 text-sm">
                                                    {good.Price && good.Price > 0 && (
                                                        <span className="text-green-600 font-semibold bg-green-50 px-3 py-1 rounded-full">
                                                            💰 ราคาขาย: {good.Price.toLocaleString('th-TH')} ฿
                                                        </span>
                                                    )}
                                                    {good.BuyPrice && good.BuyPrice > 0 && (
                                                        <span className="text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                                                            📥 ราคาซื้อ: {good.BuyPrice.toLocaleString('th-TH')} ฿
                                                        </span>
                                                    )}
                                                    {good.StockQty !== undefined && (
                                                        <span className="text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                                                            📦 สต็อกระบบ: {good.StockQty.toLocaleString()} ชิ้น
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => removeProduct(good.GoodCode)}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200 flex-shrink-0 self-start"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>

                                    {/* Stock Input Section */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                                <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center">
                                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-200"
                                                placeholder="กรอกจำนวนสต็อก"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                                <div className="w-6 h-6 bg-orange-500 rounded flex items-center justify-center">
                                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-200"
                                                placeholder="กรอกสต็อกปลอดภัย"
                                            />
                                        </div>
                                    </div>

                                    {/* Summary */}
                                    <div className="flex flex-wrap gap-4 mt-3 text-sm">
                                        <div className="text-blue-600 font-semibold bg-blue-50 px-3 py-1 rounded-full">
                                            📥 สต็อกที่ตั้งค่า: {good.inputStockQty.toLocaleString()} ชิ้น
                                        </div>
                                        <div className="text-orange-600 font-semibold bg-orange-50 px-3 py-1 rounded-full">
                                            ⚠️ สต็อกปลอดภัย: {good.inputSafetyStock.toLocaleString()} ชิ้น
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
                            <button
                                className="px-8 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-all duration-200 flex items-center justify-center gap-2 font-semibold order-2 sm:order-1"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saveLoading}
                                className="px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 disabled:opacity-50 transition-all duration-200 flex items-center justify-center gap-2 font-semibold shadow-lg shadow-green-200 order-1 sm:order-2"
                            >
                                {saveLoading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                        กำลังบันทึก...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    <div className="bg-white rounded-2xl shadow-lg p-12 border border-gray-100 text-center">
                        <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-12 h-12 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-3">
                            ยังไม่มีสินค้าที่เลือก
                        </h3>
                        <p className="text-gray-600 mb-8 max-w-md mx-auto">
                            ค้นหาสินค้าโดยใช้ช่องค้นหาด้านบน และคลิกปุ่ม "เพิ่ม" เพื่อเลือกลงในรายการนำเข้า
                        </p>
                        <div className="w-12 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto"></div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FormCreate;
