import React, { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import { Calendar, FileText, User, Building, Package, Save, X, Plus, Minus, Edit3, RefreshCw } from 'lucide-react';

interface OrderItem {
    id: number;
    product_name: string;
    product_type?: string;
    stock_qty?: number;
    reserved_qty?: number;
    remaining_qty?: number;
    quantity?: number | string;
    unit?: string;
    issueDate?: string;
    GoodCode?: string;
    good_code?: string;
    availableQty?: number;
    StockQty?: number;
    reservedQty?: number;
    product_id?: string;
    product_code?: string;
    stock?: number;
    available?: number;
    current_stock?: number;
    total_stock?: number;
    [key: string]: any;
}

interface StockInfo {
    GoodCode: string;
    stock_qty: number;
    reservedQty: number;
    availableQty: number;
    GoodStockUnitName?: string;
    GoodName?: string;
}

interface Order {
    id: number;
    document_number: string;
    order_date: string;
    status: string;
    source: 'WEB' | 'WIN';
    department?: string;
    requester?: string;
    note?: string;
    items?: OrderItem[];
}

interface FormEditOrderProps {
    order: Order | null;
    onClose: () => void;
    onSuccess: () => void;
}

export default function FormEditOrder({ order, onClose, onSuccess }: FormEditOrderProps) {
    const [saving, setSaving] = useState(false);
    const [loadingStock, setLoadingStock] = useState(false);
    const [stockData, setStockData] = useState<Record<string, StockInfo>>({});
    const [inputValues, setInputValues] = useState<Record<number, string>>({});
    const [formData, setFormData] = useState({
        status: '',
        note: '',
        order_date: '',
        requester: '',
        department: '',
        items: [] as OrderItem[]
    });

    const safeNumber = (value: any): number => {
        if (value === null || value === undefined) return 0;
        if (typeof value === 'string') {
            const cleaned = value.replace(/,/g, '');
            const num = parseFloat(cleaned);
            return isNaN(num) ? 0 : num;
        }
        return typeof value === 'number' ? value : 0;
    };

    // ฟังก์ชันช่วย format ตัวเลข
    const formatNumber = (value: any, decimals = 0) => {
        const num = safeNumber(value);
        return num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    };
    // ฟังก์ชันจัดรูปแบบการแสดงผล
    // ฟังก์ชันจัดรูปแบบการแสดงผล (จำกัด 4 ตำแหน่ง)
    const formatQuantityDisplay = (value: number): string => {
        if (isNaN(value)) return '0.0000';

        // ✅ จำกัดทศนิยม 4 ตำแหน่งเสมอ
        return value.toFixed(4);
    };

    // 🔥 ดึงข้อมูลสต็อกจาก API ที่มีอยู่
    const fetchStockData = async (productCodes: string[]) => {
        if (productCodes.length === 0) return;

        setLoadingStock(true);
        try {
            console.log('📦 Fetching stock data for product_codes:', productCodes);

            // เรียก API โดยส่ง product_code ไป
            const response = await fetch(`/StoreOrder/store-items/stock-info?good_codes=${encodeURIComponent(productCodes.join(','))}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const stockInfo: StockInfo[] = await response.json();
            console.log('✅ Stock data received:', stockInfo);

            // 🔥 แก้ไข: ใช้ product_code เป็น key ในการ map
            const stockMap: Record<string, StockInfo> = {};

            // Map ด้วย GoodCode จาก response
            stockInfo.forEach(item => {
                if (item.GoodCode) {
                    stockMap[item.GoodCode] = item;
                }
            });

            // 🔥 สำคัญ: ถ้าไม่พบข้อมูล ให้สร้างข้อมูล default ด้วย product_code
            productCodes.forEach(code => {
                if (!stockMap[code]) {
                    console.log(`🔄 Creating default stock for: ${code}`);
                    stockMap[code] = {
                        GoodCode: code,
                        stock_qty: 0,
                        reservedQty: 0,
                        availableQty: 0,
                        GoodStockUnitName: 'ชิ้น',
                        GoodName: 'ข้อมูลสต็อก'
                    };
                }
            });

            setStockData(stockMap);
        } catch (error) {
            console.error('❌ Failed to fetch stock data:', error);
            // ถ้าโหลดไม่สำเร็จ ให้ใช้ค่า default
            const defaultStock: Record<string, StockInfo> = {};
            productCodes.forEach(code => {
                defaultStock[code] = {
                    GoodCode: code,
                    stock_qty: 0,
                    reservedQty: 0,
                    availableQty: 0,
                    GoodStockUnitName: 'ชิ้น'
                };
            });
            setStockData(defaultStock);
        } finally {
            setLoadingStock(false);
        }
    };

    // 🔥 คำนวณสต็อกจาก stockData - แก้ไขให้ถูกต้อง
    const calculateStockInfo = (item: OrderItem) => {
        // ใช้ product_code เป็นหลัก เพราะนี่คือข้อมูลที่เรามี
        const productCode = item.product_code || item.GoodCode || item.good_code;

        if (!productCode) {
            console.warn('❌ No product code found for item:', item);
            return {
                totalStock: 0,
                reserved: 0,
                available: 0,
                remaining: 0,
                currentQuantity: safeNumber(item.quantity),
                isOutOfStock: true,
                isFullyReserved: false
            };
        }

        const stockInfo = stockData[productCode];

        if (!stockInfo) {
            console.warn('❌ No stock data found for:', productCode, 'available stockData:', Object.keys(stockData));
            return {
                totalStock: 0,
                reserved: 0,
                available: 0,
                remaining: 0,
                currentQuantity: safeNumber(item.quantity),
                isOutOfStock: true,
                isFullyReserved: false
            };
        }

        const totalStock = safeNumber(stockInfo.stock_qty);
        const reserved = safeNumber(stockInfo.reservedQty);
        const available = safeNumber(stockInfo.availableQty);
        const currentQuantity = safeNumber(item.quantity);

        // ✅ แก้ไข: คำนวณ remaining ถูกต้อง (available - currentQuantity)
        const remaining = Math.max(0, available - currentQuantity);

        const result = {
            totalStock,
            reserved,
            available,
            remaining,
            currentQuantity,
            isOutOfStock: totalStock === 0,
            isFullyReserved: available === 0 && totalStock > 0
        };

        console.log('📊 Stock calculation for', productCode, ':', result);
        return result;
    };

    useEffect(() => {
        if (order) {
            console.log('🔍 Order data received:', order);
            console.log('📦 Order items details:', order.items?.map(item => ({
                id: item.id,
                product_name: item.product_name,
                product_code: item.product_code,
                GoodCode: item.GoodCode,
                good_code: item.good_code,
                quantity: item.quantity
            })));

            const processedItems = order.items?.map((item: OrderItem) => {
                const safeQuantity = safeNumber(item.quantity);
                return {
                    ...item,
                    quantity: safeQuantity
                };
            }) || [];

            setFormData({
                status: order.status || 'pending',
                note: order.note || '',
                order_date: order.order_date ? new Date(order.order_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                requester: order.requester || '',
                department: order.department || '',
                items: processedItems
            });

            // 🔥 ดึงข้อมูลสต็อกเมื่อโหลด order - ใช้ product_code เป็นหลัก
            const productCodes = order.items?.map(item => {
                return item.product_code || item.GoodCode || item.good_code;
            }).filter(Boolean) as string[];

            console.log('🔍 Product codes to fetch:', productCodes);

            if (productCodes.length > 0) {
                fetchStockData(productCodes);
            } else {
                console.warn('⚠️ No product codes found in order items');
            }
        }
    }, [order]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!order?.id) {
            alert('ไม่พบข้อมูลคำสั่งซื้อ');
            return;
        }

        if (formData.items.length === 0) {
            alert('กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการ');
            return;
        }

        // ✅ แก้ไข: ตรวจสอบจำนวนที่เบิกไม่เกิน available
        const invalidItems = formData.items.filter(item => {
            const stockInfo = calculateStockInfo(item);
            return stockInfo.currentQuantity > stockInfo.available;
        });

        if (invalidItems.length > 0) {
            const itemNames = invalidItems.map(item =>
                `${item.product_name} (เบิก: ${item.quantity}, มี: ${calculateStockInfo(item).available})`
            ).join('\n');
            alert(`มีสินค้าที่จำนวนเบิกเกินจำนวนคงเหลือ:\n${itemNames}`);
            return;
        }

        if (!formData.requester.trim() || !formData.department.trim() || !formData.order_date) {
            alert('กรุณากรอกข้อมูลให้ครบถ้วน');
            return;
        }

        setSaving(true);

        try {
            const submitData = {
                status: formData.status,
                note: formData.note,
                order_date: formData.order_date,
                requester: formData.requester,
                department: formData.department,
                items: formData.items.map(item => ({
                    id: item.id,
                    quantity: safeNumber(item.quantity),
                    product_name: item.product_name,
                    product_code: item.product_code || item.GoodCode || item.good_code
                }))
            };

            await router.put(`/StoreOrder/${order.id}`, submitData, {
                onSuccess: () => {
                    onSuccess();
                    setSaving(false);
                },
                onError: (errors) => {
                    let errorMessage = 'บันทึกไม่สำเร็จ';
                    if (errors?.message) errorMessage = errors.message;
                    else if (typeof errors === 'string') errorMessage = errors;
                    else if (Array.isArray(errors)) errorMessage = errors.join(', ');
                    else if (typeof errors === 'object') errorMessage = Object.values(errors).flat().join(', ');
                    alert(errorMessage);
                    setSaving(false);
                }
            });
        } catch (error) {
            console.error('🚨 Unexpected error:', error);
            alert('เกิดข้อผิดพลาดที่ไม่คาดคิด');
            setSaving(false);
        }
    };

    const handleItemQuantityChange = (itemId: number, quantity: number) => {
        const parsedQuantity = safeNumber(quantity);

        setFormData(prev => ({
            ...prev,
            items: prev.items.map(item => {
                if (item.id === itemId) {
                    const stockInfo = calculateStockInfo(item);
                    // ✅ แก้ไข: จำกัดจำนวนไม่ให้เกิน available
                    const newQuantity = Math.max(0, Math.min(parsedQuantity, stockInfo.available));

                    console.log(`🔄 Changing quantity for item ${itemId}: ${item.quantity} -> ${newQuantity}`);

                    return {
                        ...item,
                        quantity: newQuantity
                    };
                }
                return item;
            })
        }));
    };

    const handleIncrementQuantity = (itemId: number) => {
        const item = formData.items.find(item => item.id === itemId);
        if (item) {
            const currentQuantity = safeNumber(item.quantity);
            const stockInfo = calculateStockInfo(item);

            if (currentQuantity < stockInfo.available) {
                handleItemQuantityChange(itemId, currentQuantity + 1);
            } else {
                console.log('🚫 Cannot increment - reached maximum available quantity');
            }
        }
    };

    const handleDecrementQuantity = (itemId: number) => {
        const item = formData.items.find(item => item.id === itemId);
        if (item) {
            const currentQuantity = safeNumber(item.quantity);
            if (currentQuantity > 0) {
                handleItemQuantityChange(itemId, currentQuantity - 1);
            }
        }
    };

    const handleItemRemove = (itemId: number) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter(item => item.id !== itemId)
        }));
    };

    const getTotalQuantity = () => {
        return formData.items.reduce((sum, item) => sum + safeNumber(item.quantity), 0);
    };

    const getTotalItems = () => {
        return formData.items.length;
    };

    const getStockStatus = (item: OrderItem) => {
        const stockInfo = calculateStockInfo(item);

        if (stockInfo.isOutOfStock) {
            return {
                status: 'OUT_OF_STOCK',
                message: 'สต็อกหมด',
                color: 'red',
                available: 0
            };
        } else if (stockInfo.isFullyReserved) {
            return {
                status: 'RESERVED',
                message: 'ถูกจองทั้งหมด',
                color: 'orange',
                available: 0
            };
        } else if (stockInfo.currentQuantity > stockInfo.available) {
            return {
                status: 'OVER_STOCK',
                message: `เกินสต็อก! (ใช้ได้: ${formatNumber(stockInfo.available)} ${item.unit || 'ชิ้น'})`,
                color: 'red',
                available: stockInfo.available
            };
        } else {
            const statusColor = stockInfo.available > 10 ? 'green' :
                stockInfo.available > 0 ? 'yellow' : 'red';

            return {
                status: 'IN_STOCK',
                message: `ใช้ได้: ${formatNumber(stockInfo.available)} ${item.unit || 'ชิ้น'}`,
                color: statusColor,
                available: stockInfo.available
            };
        }
    };

    if (!order) return (
        <div className="text-center py-12 text-gray-500">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">ไม่พบข้อมูลการเบิกสินค้า</p>
        </div>
    );

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Header */}
            <div className="text-center border-b border-gray-200 pb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Edit3 className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">แก้ไขข้อมูลการเบิกสินค้า</h2>
                <p className="text-gray-600">อัพเดตข้อมูลการเบิกสินค้าตามต้องการ</p>
            </div>

            {/* ข้อมูลพื้นฐาน */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
                    <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                        <FileText className="w-4 h-4 mr-2 text-blue-600" />
                        เลขเอกสาร
                    </label>
                    <div className="text-lg font-bold text-gray-900">
                        {order.document_number}
                    </div>
                    <div className="text-xs text-blue-600 bg-white px-2 py-1 rounded-lg inline-block border border-blue-200 mt-1">
                        ระบบ: {order.source === 'WEB' ? '🟢 WEB (ระบบใหม่)' : '🔵 WIN (ระบบเดิม)'}
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-200">
                    <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                        <Calendar className="w-4 h-4 mr-2 text-green-600" />
                        วันที่เบิก
                    </label>
                    <input
                        type="date"
                        value={formData.order_date}
                        onChange={(e) => setFormData(prev => ({ ...prev, order_date: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                        required
                    />
                </div>

                {/* ผู้เบิก */}
                <div className="bg-white p-4 rounded-xl border border-gray-200">
                    <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                        <svg className="w-4 h-4 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        ผู้เบิก
                        <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                        type="text"
                        value={formData.requester}
                        onChange={(e) => setFormData(prev => ({ ...prev, requester: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                        placeholder="ระบุชื่อผู้เบิก..."
                        required
                        disabled
                        style={{
                            backgroundColor: '#f9fafb',
                            cursor: 'not-allowed',
                            opacity: 0.7
                        }}
                    />

                </div>

                {/* ฝ่าย/แผนก */}
                <div className="bg-white p-4 rounded-xl border border-gray-200">
                    <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                        <svg className="w-4 h-4 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        ฝ่าย/แผนก
                        <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                        type="text"
                        value={formData.department}
                        onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                        placeholder="ระบุฝ่าย/แผนก..."
                        required
                        disabled
                        style={{
                            backgroundColor: '#f9fafb',
                            cursor: 'not-allowed',
                            opacity: 0.7
                        }}
                    />

                </div>
            </div>

            {/* รายการสินค้า */}
            <div className="bg-white p-4 rounded-xl border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                    <label className="flex items-center text-sm font-semibold text-gray-700">
                        <Package className="w-4 h-4 mr-2 text-indigo-600" />
                        รายการสินค้า
                    </label>
                    <div className="flex items-center gap-4">
                        {loadingStock && (
                            <span className="text-sm text-blue-600 flex items-center gap-1">
                                <RefreshCw className="w-3 h-3 animate-spin" />
                                กำลังโหลดข้อมูลสต็อก...
                            </span>
                        )}
                        <span className="text-sm font-medium bg-indigo-100 text-indigo-800 px-3 py-1 rounded-lg">
                            📦 {getTotalItems()} รายการ | รวม {formatNumber(getTotalQuantity())} ชิ้น
                        </span>
                    </div>
                </div>

                <div className="space-y-3 max-h-60 overflow-y-auto">
                    {formData.items.map((item) => {
                        const stockInfo = calculateStockInfo(item);
                        const stockStatus = getStockStatus(item);
                        const currentQuantity = safeNumber(item.quantity);
                        const productCode = item.product_code || item.GoodCode || item.good_code;

                        return (
                            <div
                                key={item.id}
                                className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 ${stockStatus.status === 'OVER_STOCK' || stockStatus.status === 'OUT_OF_STOCK'
                                    ? 'bg-red-50 border-red-200'
                                    : 'bg-gray-50 border-gray-200 hover:bg-white'
                                    }`}
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-gray-900 text-sm mb-1">
                                        {item.product_name}
                                    </div>
                                    <div className="text-xs text-gray-500 flex items-center gap-2 flex-wrap">
                                        {productCode && (
                                            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded border border-blue-200">
                                                🏷️ {productCode}
                                            </span>
                                        )}
                                        {/* สต็อกทั้งหมด */}
                                        <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded border border-purple-200">
                                            📦 สต็อกทั้งหมด: {formatNumber(stockInfo.totalStock)} {item.unit || 'ชิ้น'}
                                        </span>

                                        {/* แสดงจองแล้ว */}
                                        {stockInfo.reserved > 0 && (
                                            <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded border border-orange-200">
                                                ⏳ จองแล้ว: {formatNumber(stockInfo.reserved)} {item.unit || 'ชิ้น'}
                                            </span>
                                        )}

                                        <span className={`px-2 py-1 rounded border ${stockStatus.color === 'green' ? 'bg-green-100 text-green-700 border-green-200' :
                                            stockStatus.color === 'yellow' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                                                'bg-red-100 text-red-700 border-red-200'
                                            }`}>
                                            ✅ {stockStatus.message}
                                        </span>

                                        {/* แสดงจำนวนคงเหลือหลังจากเบิก */}
                                        {currentQuantity > 0 && (
                                            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded border border-gray-200">
                                                📊 เหลือ: {formatNumber(stockInfo.remaining)} {item.unit || 'ชิ้น'}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center space-x-3">
                                    <div className="flex items-center space-x-2 bg-white border border-gray-300 rounded-lg p-1">
                                        {/* ปุ่มลด */}
                                        <button
                                            type="button"
                                            onClick={() => handleDecrementQuantity(item.id)}
                                            className="p-1 bg-gray-100 rounded hover:bg-gray-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                            disabled={currentQuantity <= 0 || stockStatus.available === 0}
                                        >
                                            <Minus className="w-3 h-3 text-gray-600" />
                                        </button>

                                        {/* input จำนวน */}
                                        <input
                                            type="text"
                                            value={inputValues[item.id] ?? item.quantity.toFixed(2)} // ใช้ string จาก state หรือ default เป็น 2 ตำแหน่ง
                                            onChange={(e) => {
                                                let val = e.target.value;

                                                // อนุญาตตัวเลขและจุดทศนิยมเท่านั้น
                                                if (!/^\d*\.?\d*$/.test(val)) return;

                                                // จำกัดทศนิยม 2 หลัก
                                                if (val.includes('.')) {
                                                    const [intPart, decPart] = val.split('.');
                                                    val = intPart + '.' + decPart.slice(0, 2);
                                                }

                                                // อัพเดต state เฉพาะ input
                                                setInputValues((prev) => ({ ...prev, [item.id]: val }));

                                                // อัพเดตค่าจริงเมื่อใช้
                                                handleItemQuantityChange(item.id, Number(val) || 0);
                                            }}
                                            placeholder="0.00"
                                            className={`px-2 py-1 text-center border-0 focus:ring-0 focus:outline-none bg-transparent font-semibold
    ${stockStatus.status === 'OVER_STOCK' || stockStatus.status === 'OUT_OF_STOCK' ? 'text-red-600' : 'text-gray-900'}`}
                                            style={{ width: `${Math.max((inputValues[item.id] ?? item.quantity.toFixed(2)).length + 3, 6)}ch` }}
                                        />





                                        {/* ปุ่มเพิ่ม */}
                                        <button
                                            type="button"
                                            onClick={() => handleIncrementQuantity(item.id)}
                                            className="p-1 bg-gray-100 rounded hover:bg-gray-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                            disabled={currentQuantity >= stockStatus.available || stockStatus.available === 0}
                                        >
                                            <Plus className="w-3 h-3 text-gray-600" />
                                        </button>
                                    </div>

                                    <span className="text-sm text-gray-600 w-8 text-center">
                                        {item.unit || 'ชิ้น'}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => handleItemRemove(item.id)}
                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors duration-200"
                                        title="ลบรายการ"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
                {formData.items.length === 0 && (
                    <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                        <Package className="w-12 h-12 mx-auto mb-2 opacity-40" />
                        <p className="text-sm text-gray-500">ไม่มีรายการสินค้า</p>
                    </div>
                )}
            </div>

            {/* หมายเหตุ */}
            <div className="bg-white p-4 rounded-xl border border-gray-200">
                <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                    <FileText className="w-4 h-4 mr-2 text-gray-600" />
                    หมายเหตุ
                </label>
                <textarea
                    value={formData.note}
                    onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all duration-200 resize-none"
                    rows={3}
                    placeholder="ระบุหมายเหตุเพิ่มเติม (ถ้ามี)..."
                />
            </div>

            {/* ปุ่มดำเนินการ */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                    type="button"
                    onClick={onClose}
                    disabled={saving}
                    className="px-6 py-2.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                    <X className="w-4 h-4 mr-2" />
                    ยกเลิก
                </button>
                <button
                    type="submit"
                    disabled={saving || loadingStock}
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
                </button>
            </div>
        </form>
    );
}
