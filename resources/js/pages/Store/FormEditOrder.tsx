import React, { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import { Calendar, FileText, User, Building, Package, Save, X, Plus, Minus, Edit3, RefreshCw, Search } from 'lucide-react';
import axios from 'axios';
import Swal from 'sweetalert2';

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
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
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

    // 🔥 เพิ่มสินค้าใหม่
    const handleAddItem = (item: any) => {
        // ใช้ GoodCode เป็นหลัก เพราะ API ส่งคืน GoodCode
        const code = (item.GoodCode || item.product_code || item.good_code || '').trim().toUpperCase();

        console.log('🔄 Adding item with code:', code);
        console.log('📝 Item data:', item);

        // ตรวจสอบว่าสินค้ามีอยู่แล้วในรายการหรือไม่
        const existingItem = formData.items.find(existing => {
            const existingCode = (existing.GoodCode || existing.product_code || existing.good_code || '').trim().toUpperCase();
            return existingCode === code;
        });

        if (existingItem) {
            Swal.fire({
                icon: 'warning',
                title: 'สินค้าซ้ำ',
                text: `สินค้า "${item.GoodName || item.product_name}" มีอยู่ในรายการแล้ว`,
                confirmButtonText: 'ตกลง'
            });
            return;
        }

        // ✅ สำหรับสินค้าใหม่ที่เพิ่ม ให้สร้าง ID เป็น null เพื่อให้ backend สร้าง record ใหม่
        const newItem: OrderItem = {
            id: 0, // ใช้ 0 สำหรับสินค้าใหม่ (backend จะสร้าง ID ใหม่)
            product_name: item.GoodName || item.product_name || 'สินค้าใหม่',
            product_code: code,
            GoodCode: code,
            quantity: 0,
            unit: item.GoodStockUnitName || item.unit || 'ชิ้น',
            // เก็บข้อมูลเดิมทั้งหมด
            ...item
        };

        console.log('✅ New item created:', newItem);

        setFormData(prev => ({
            ...prev,
            items: [...prev.items, newItem]
        }));

        // ดึงข้อมูลสต็อกสำหรับสินค้าใหม่
        fetchStockData([code]);

        // รีเซ็ตการค้นหา
        setSearchTerm('');
        setResults([]);

        Swal.fire({
            icon: 'success',
            title: 'เพิ่มสินค้าเรียบร้อย',
            text: `เพิ่ม "${newItem.product_name}" ลงในรายการเรียบร้อย`,
            timer: 1500,
            showConfirmButton: false
        });
    };

    const fetchGoods = async (query: string) => {
        if (!query.trim()) {
            setResults([]);
            return;
        }

        setLoading(true);
        try {
            const response = await axios.get('/StoreOrder/search', {
                params: { search: query.trim() }
            });

            console.log('Raw response:', response);
            const goods = response.data?.goods || response.data || [];
            console.log('Goods fetched:', goods);

            setResults(goods);

        } catch (error: any) {
            console.error('Fetch error:', error);
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: error?.response?.data?.message || error.message,
            });
        } finally {
            setLoading(false);
        }
    };

    // Debounce การค้นหา
    useEffect(() => {
        const delay = setTimeout(() => {
            fetchGoods(searchTerm);
        }, 500);

        return () => clearTimeout(delay);
    }, [searchTerm]);

    // 🔥 ดึงข้อมูลสต็อกจาก API getStockInfo
    const fetchStockData = async (productCodes: string[]) => {
        if (productCodes.length === 0) return;

        setLoadingStock(true);
        try {
            console.log('📦 Fetching stock data for product_codes:', productCodes);

            // ใช้ endpoint getStockInfo ตามโค้ด PHP ที่ให้มา
            const response = await fetch(`/StoreOrder/store-items/stock-info?good_codes=${encodeURIComponent(productCodes.join(','))}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const stockInfo: StockInfo[] = await response.json();
            console.log('✅ Stock data received from getStockInfo:', stockInfo);

            const stockMap: Record<string, StockInfo> = {};

            stockInfo.forEach(item => {
                if (item.GoodCode) {
                    const key = item.GoodCode.trim().toUpperCase();
                    stockMap[key] = {
                        GoodCode: key,
                        stock_qty: safeNumber(item.stock_qty),
                        reservedQty: safeNumber(item.reservedQty),
                        availableQty: safeNumber(item.availableQty),
                        GoodStockUnitName: item.GoodStockUnitName || 'ชิ้น',
                        GoodName: item.GoodName || 'ไม่ระบุ'
                    };

                    console.log(`📊 Stock info for ${key}:`, {
                        stock_qty: stockMap[key].stock_qty,
                        reservedQty: stockMap[key].reservedQty,
                        availableQty: stockMap[key].availableQty
                    });
                }
            });

            // สำหรับสินค้าที่ไม่มีใน response ให้ตั้งค่า default
            productCodes.forEach(code => {
                const key = code.trim().toUpperCase();
                if (!stockMap[key]) {
                    console.warn(`❌ No stock data found for: ${key}, using default values`);
                    stockMap[key] = {
                        GoodCode: key,
                        stock_qty: 0,
                        reservedQty: 0,
                        availableQty: 0,
                        GoodStockUnitName: 'ชิ้น',
                        GoodName: 'ไม่พบข้อมูลสต็อก'
                    };
                }
            });

            setStockData(prev => ({
                ...prev,
                ...stockMap
            }));

        } catch (error) {
            console.error('❌ Failed to fetch stock data:', error);
            const defaultStock: Record<string, StockInfo> = {};
            productCodes.forEach(code => {
                const key = code.trim().toUpperCase();
                defaultStock[key] = {
                    GoodCode: key,
                    stock_qty: 0,
                    reservedQty: 0,
                    availableQty: 0,
                    GoodStockUnitName: 'ชิ้น',
                    GoodName: 'ไม่พบข้อมูลสต็อก'
                };
            });
            setStockData(prev => ({
                ...prev,
                ...defaultStock
            }));
        } finally {
            setLoadingStock(false);
        }
    };

    // 🔥 คำนวณสต็อกจาก stockData - ใช้ข้อมูลจาก getStockInfo โดยตรง
    const calculateStockInfo = (item: OrderItem) => {
        const code = (item.GoodCode || item.product_code || item.good_code || '').trim().toUpperCase();
        const stockInfo = stockData[code];

        if (!stockInfo) {
            console.warn('❌ No stock data found for:', code);
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

        // ใช้ข้อมูลที่ได้จาก getStockInfo โดยตรง
        const totalStock = safeNumber(stockInfo.stock_qty);
        const reserved = safeNumber(stockInfo.reservedQty);
        const available = safeNumber(stockInfo.availableQty);
        const currentQuantity = safeNumber(item.quantity);
        const remaining = Math.max(0, available - currentQuantity);

        console.log(`📊 Stock calculation for ${code}:`, {
            totalStock,
            reserved,
            available,
            currentQuantity,
            remaining,
            source: 'getStockInfo'
        });

        return {
            totalStock,
            reserved,
            available,
            remaining,
            currentQuantity,
            isOutOfStock: totalStock === 0,
            isFullyReserved: available === 0 && totalStock > 0
        };
    };

    useEffect(() => {
        if (order) {
            console.log('🔍 Order data received:', order);

            const processedItems = order.items?.map((item: OrderItem) => {
                const safeQuantity = safeNumber(item.quantity);
                const code = (item.GoodCode || item.product_code || item.good_code || '').trim().toUpperCase();

                return {
                    ...item,
                    quantity: safeQuantity,
                    GoodCode: code,
                    product_code: code
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

            const productCodes = processedItems.map(item =>
                (item.GoodCode || item.product_code || item.good_code || '').trim().toUpperCase()
            ).filter(Boolean);

            console.log('🔍 Product codes to fetch:', productCodes);

            if (productCodes.length > 0) {
                fetchStockData(productCodes);
            }
        }
    }, [order]);

    // 🔧 ฟังก์ชันตรวจสอบความถูกต้องของฟอร์ม
    const validateForm = (): string[] => {
        const errors: string[] = [];

        // ตรวจสอบข้อมูลพื้นฐาน
        if (!formData.requester.trim()) {
            errors.push('• กรุณาระบุชื่อผู้เบิก');
        }
        if (!formData.department.trim()) {
            errors.push('• กรุณาระบุฝ่าย/แผนก');
        }
        if (!formData.order_date) {
            errors.push('• กรุณาเลือกวันที่เบิก');
        }

        // ตรวจสอบรายการสินค้า
        if (formData.items.length === 0) {
            errors.push('• กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการ');
            return errors;
        }

        // ตรวจสอบจำนวนสินค้าแต่ละรายการ
        formData.items.forEach(item => {
            const stockInfo = calculateStockInfo(item);
            const currentQuantity = safeNumber(item.quantity);
            const maxAvailable = Math.max(0, stockInfo.available);

            if (currentQuantity <= 0) {
                errors.push(`• ${item.product_name}: จำนวนเบิกต้องมากกว่า 0`);
            }

            if (currentQuantity > maxAvailable) {
                errors.push(`• ${item.product_name}: จำนวนเบิก ${formatNumber(currentQuantity)} เกินสต็อกที่มี (ใช้ได้: ${formatNumber(maxAvailable)} ${item.unit || 'ชิ้น'})`);
            }
        });

        return errors;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!order?.id) {
            Swal.fire({
                icon: 'error',
                title: 'ไม่พบข้อมูลคำสั่งซื้อ',
                confirmButtonText: 'ตกลง'
            });
            return;
        }

        // ✅ ตรวจสอบความถูกต้องก่อนส่งข้อมูล
        const validationErrors = validateForm();
        if (validationErrors.length > 0) {
            Swal.fire({
                icon: 'error',
                title: 'ข้อมูลไม่ถูกต้อง',
                html: validationErrors.join('<br>'),
                confirmButtonText: 'ตกลง'
            });
            return;
        }

        setSaving(true);

        try {
            // ✅ เตรียมข้อมูลทั้งหมด (ทั้งสินค้าใหม่และเดิม)
            const submitData = {
                _method: 'PUT',
                status: formData.status,
                note: formData.note || '',
                order_date: formData.order_date,
                requester: formData.requester,
                department: formData.department,
                items: formData.items.map(item => {
                    const isNewItem = item.id === 0;

                    const itemData: any = {
                        id: item.id, // ✅ ส่ง 0 สำหรับสินค้าใหม่, ID เดิมสำหรับสินค้าเดิม
                        quantity: safeNumber(item.quantity),
                        product_name: item.product_name,
                        product_code: item.product_code || item.GoodCode || item.good_code
                    };

                    // ✅ ส่งข้อมูลเพิ่มเติมสำหรับสินค้าใหม่
                    if (isNewItem) {
                        itemData.unit = item.unit || 'ชิ้น';
                        itemData.GoodCode = item.GoodCode;
                    }

                    return itemData;
                })
            };

            console.log('📤 Submitting data to backend:', {
                orderId: order.id,
                totalItems: submitData.items.length,
                newItems: submitData.items.filter(item => item.id === 0).length,
                existingItems: submitData.items.filter(item => item.id !== 0).length,
                data: submitData
            });

            await router.put(`/StoreOrder/${order.id}`, submitData, {
                preserveScroll: true,
                onSuccess: (page) => {
                    console.log('✅ Update successful:', page);
                    Swal.fire({
                        icon: 'success',
                        title: 'บันทึกสำเร็จ',
                        text: 'ระบบได้อัปเดตข้อมูลเรียบร้อยแล้ว',
                        timer: 2000,
                        showConfirmButton: false
                    }).then(() => {
                        onSuccess();
                        setSaving(false);
                    });
                },
                onError: (errors) => {
                    console.error('❌ Backend validation errors:', errors);

                    let errorMessage = 'บันทึกไม่สำเร็จ';

                    if (errors && typeof errors === 'object') {
                        const errorMessages = Object.values(errors).flat();
                        errorMessage = errorMessages.join('\n');
                    } else if (typeof errors === 'string') {
                        errorMessage = errors;
                    }

                    Swal.fire({
                        icon: 'error',
                        title: 'บันทึกไม่สำเร็จ',
                        html: errorMessage.replace(/\n/g, '<br>'),
                        confirmButtonText: 'ตกลง'
                    });
                    setSaving(false);
                },
                onFinish: () => {
                    setSaving(false);
                }
            });

        } catch (error) {
            console.error('🚨 Unexpected error:', error);
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: 'เกิดข้อผิดพลาดที่ไม่คาดคิดในการส่งข้อมูล',
                confirmButtonText: 'ตกลง'
            });
            setSaving(false);
        }
    };

    // 🔧 ฟังก์ชันจัดการการเปลี่ยนแปลงจำนวนสินค้า (ป้องกันเกิน available)
    const handleItemQuantityChange = (itemId: number, quantity: number) => {
        const parsedQuantity = safeNumber(quantity);

        setFormData(prev => ({
            ...prev,
            items: prev.items.map(item => {
                if (item.id === itemId) {
                    const stockInfo = calculateStockInfo(item);
                    // ✅ จำกัดจำนวนไม่ให้เกิน available
                    const maxAvailable = Math.max(0, stockInfo.available);
                    const newQuantity = Math.max(0, Math.min(parsedQuantity, maxAvailable));

                    console.log(`📦 Item ${itemId}: Requested ${parsedQuantity}, Available ${maxAvailable}, Final ${newQuantity}`);

                    return {
                        ...item,
                        quantity: newQuantity
                    };
                }
                return item;
            })
        }));
    };

    // 🔧 ฟังก์ชันเพิ่มจำนวน (ป้องกันเกิน available)
    const handleIncrementQuantity = (itemId: number) => {
        const item = formData.items.find(item => item.id === itemId);
        if (item) {
            const currentQuantity = safeNumber(item.quantity);
            const stockInfo = calculateStockInfo(item);
            const maxAvailable = Math.max(0, stockInfo.available);

            // ✅ ตรวจสอบว่ายังเพิ่มได้อีกหรือไม่
            if (currentQuantity < maxAvailable) {
                handleItemQuantityChange(itemId, currentQuantity + 1);
            } else {
                // แจ้งเตือนเมื่อพยายามเพิ่มเกินสต็อก
                Swal.fire({
                    icon: 'warning',
                    title: 'ไม่สามารถเพิ่มได้',
                    text: `จำนวนที่เบิกเกินสต็อกที่มี (ใช้ได้: ${formatNumber(maxAvailable)} ${item.unit || 'ชิ้น'})`,
                    timer: 1500,
                    showConfirmButton: false
                });
            }
        }
    };

    // 🔧 ฟังก์ชันลดจำนวน
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
        const itemToRemove = formData.items.find(item => item.id === itemId);

        if (!itemToRemove) return;

        Swal.fire({
            title: 'ยืนยันการลบรายการ',
            text: `คุณต้องการลบ "${itemToRemove.product_name}" ออกจากรายการใช่หรือไม่?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'ลบออกจากรายการ',
            cancelButtonText: 'ยกเลิก'
        }).then((result) => {
            if (result.isConfirmed) {
                // ✅ แค่ลบออกจาก state ในฟอร์มเท่านั้น ไม่ส่ง request ไปลบข้อมูลจริง
                setFormData(prev => ({
                    ...prev,
                    items: prev.items.filter(item => item.id !== itemId)
                }));

                // ลบค่า input ที่เกี่ยวข้องออก
                setInputValues(prev => {
                    const newInputValues = { ...prev };
                    delete newInputValues[itemId];
                    return newInputValues;
                });

                Swal.fire({
                    icon: 'success',
                    title: 'ลบออกจากรายการเรียบร้อย',
                    text: `นำ "${itemToRemove.product_name}" ออกจากรายการเบิกแล้ว`,
                    timer: 1500,
                    showConfirmButton: false
                });
            }
        });
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

    // 🔄 ฟังก์ชันรีเฟรชข้อมูลสต็อก
    const handleRefreshStock = () => {
        const productCodes = formData.items.map(item =>
            (item.GoodCode || item.product_code || item.good_code || '').trim().toUpperCase()
        ).filter(Boolean);

        if (productCodes.length > 0) {
            fetchStockData(productCodes);
            Swal.fire({
                icon: 'success',
                title: 'รีเฟรชข้อมูลสต็อก',
                text: 'กำลังอัปเดตข้อมูลสต็อกล่าสุด...',
                timer: 1500,
                showConfirmButton: false
            });
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
                        <User className="w-4 h-4 mr-2 text-purple-600" />
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
                        <Building className="w-4 h-4 mr-2 text-orange-600" />
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

            {/* ค้นหาสินค้า */}
            <div className="bg-white p-4 rounded-xl border border-gray-200">
                <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                    <Search className="w-4 h-4 mr-2 text-blue-600" />
                    ค้นหาสินค้า
                </label>
                <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="ค้นหาสินค้าด้วยชื่อหรือรหัส..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                {/* ผลลัพธ์ค้นหา */}
                {searchTerm && (
                    <div className="mt-3 border border-gray-200 rounded-lg bg-white max-h-60 overflow-y-auto">
                        {loading && (
                            <div className="flex items-center justify-center py-4">
                                <RefreshCw className="w-4 h-4 animate-spin text-blue-500 mr-2" />
                                <span className="text-gray-600">กำลังค้นหา...</span>
                            </div>
                        )}

                        {!loading && results.length === 0 && (
                            <div className="text-center py-4 text-gray-500">
                                <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
                                <p>ไม่พบผลลัพธ์สำหรับ "{searchTerm}"</p>
                            </div>
                        )}

                        {!loading && results.map((item, index) => {
                            const code = item.GoodCode || item.good_code || item.product_code || 'ไม่มีรหัส';
                            const name = item.GoodName || item.product_name || 'สินค้าใหม่';
                            const unit = item.GoodStockUnitName || item.unit || 'ชิ้น';

                            // คำนวณจำนวนที่เบิกได้จากข้อมูลสต็อก
                            const stockQty = item.stock_qty || item.StockQty || 0;
                            const reservedQty = item.reservedQty || item.reserved_qty || 0;
                            const availableQty = item.availableQty || item.available || Math.max(stockQty - reservedQty, 0);

                            // กำหนดสีและสถานะตามจำนวนที่เบิกได้
                            const getStockStatus = () => {
                                if (availableQty <= 0) {
                                    return {
                                        color: 'text-red-600 bg-red-50 border-red-200',
                                        text: 'สต็อกหมด',
                                        available: 0
                                    };
                                } else if (availableQty < 10) {
                                    return {
                                        color: 'text-orange-600 bg-orange-50 border-orange-200',
                                        text: `เหลือน้อย (${formatNumber(availableQty)} ${unit})`,
                                        available: availableQty
                                    };
                                } else {
                                    return {
                                        color: 'text-green-600 bg-green-50 border-green-200',
                                        text: `พร้อมเบิก (${formatNumber(availableQty)} ${unit})`,
                                        available: availableQty
                                    };
                                }
                            };

                            const stockStatus = getStockStatus();

                            return (
                                <div
                                    key={`${code}-${index}`}
                                    className="p-3 border-b border-gray-100 flex justify-between items-center cursor-pointer hover:bg-blue-50 transition-colors"
                                    onClick={() => handleAddItem(item)}
                                >
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="font-semibold text-gray-900">{name}</p>
                                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                    <p className="text-xs text-gray-600">รหัส: {code}</p>
                                                    <p className="text-xs text-gray-500">หน่วย: {unit}</p>
                                                </div>
                                            </div>
                                            <div className={`text-xs px-2 py-1 rounded border ${stockStatus.color} ml-2 flex-shrink-0`}>
                                                {stockStatus.text}
                                            </div>
                                        </div>

                                        {/* แสดงข้อมูลสต็อกเพิ่มเติม */}
                                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                                            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                                📦 สต็อก: {formatNumber(stockQty)} {unit}
                                            </span>
                                            {reservedQty > 0 && (
                                                <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded">
                                                    ⏳ จอง: {formatNumber(reservedQty)} {unit}
                                                </span>
                                            )}
                                            <span className="bg-green-100 text-green-700 px-2 py-1 rounded">
                                                ✅ เบิกได้: {formatNumber(availableQty)} {unit}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 ml-4">
                                        <Plus className="w-4 h-4 text-green-500" />
                                        <span className="text-green-600 text-sm font-medium">เพิ่ม</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* รายการสินค้า */}
            <div className="bg-white p-4 rounded-xl border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <label className="flex items-center text-sm font-semibold text-gray-700">
                            <Package className="w-4 h-4 mr-2 text-indigo-600" />
                            รายการสินค้า
                        </label>
                        <button
                            type="button"
                            onClick={handleRefreshStock}
                            disabled={loadingStock}
                            className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors disabled:opacity-50"
                        >
                            <RefreshCw className={`w-3 h-3 ${loadingStock ? 'animate-spin' : ''}`} />
                            รีเฟรชสต็อก
                        </button>
                    </div>
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
                        const productCode = item.GoodCode || item.product_code || item.good_code;

                        // คำนวณจำนวนสูงสุดที่เบิกได้
                        const maxAvailable = Math.max(0, stockStatus.available);
                        // ตรวจสอบว่าจำนวนปัจจุบันเกินสต็อกหรือไม่
                        const isOverStock = currentQuantity > maxAvailable;
                        // ตรวจสอบว่าสินค้ามีสต็อกพอให้เบิกหรือไม่
                        const hasStock = maxAvailable > 0;
                        // ตรวจสอบว่าถึงขีดจำกัดแล้วหรือไม่
                        const isAtLimit = currentQuantity === maxAvailable && maxAvailable > 0;

                        return (
                            <div
                                key={item.id}
                                className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 ${isOverStock || stockStatus.status === 'OUT_OF_STOCK' || !hasStock
                                    ? 'bg-red-50 border-red-200'
                                    : isAtLimit
                                        ? 'bg-yellow-50 border-yellow-200'
                                        : 'bg-gray-50 border-gray-200 hover:bg-white'
                                    }`}
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-gray-900 text-sm mb-1">
                                        {item.product_name}
                                        {isOverStock && (
                                            <span className="ml-2 text-xs text-red-600 bg-red-100 px-2 py-1 rounded">
                                                ⚠️ เบิกเกินสต็อก
                                            </span>
                                        )}
                                        {isAtLimit && (
                                            <span className="ml-2 text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded">
                                                ⚠️ ถึงขีดจำกัดสูงสุด
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xs text-gray-500 flex items-center gap-2 flex-wrap">
                                        {productCode && (
                                            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded border border-blue-200">
                                                {productCode}
                                            </span>
                                        )}
                                        <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded border border-purple-200">
                                            📦 สต็อกทั้งหมด: {formatNumber(stockInfo.totalStock)} {item.unit || 'ชิ้น'}
                                        </span>

                                        {stockInfo.reserved > 0 && (
                                            <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded border border-orange-200">
                                                ⏳ จองแล้ว: {formatNumber(stockInfo.reserved)} {item.unit || 'ชิ้น'}
                                            </span>
                                        )}



                                        {currentQuantity > 0 && stockInfo.remaining >= 0 && (
                                            <span className={`px-2 py-1 rounded border ${isOverStock
                                                ? 'bg-red-100 text-red-700 border-red-200'
                                                : 'bg-gray-100 text-gray-700 border-gray-200'
                                                }`}>
                                                📊 เหลือ: {formatNumber(stockInfo.remaining)} {item.unit || 'ชิ้น'}
                                                {isOverStock && ' (เกินสต็อก!)'}
                                            </span>
                                        )}

                                        {/* แสดงจำนวนสูงสุดที่เบิกได้ */}
                                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded border border-green-200">
                                            🎯 เบิกได้สูงสุด: {formatNumber(maxAvailable)} {item.unit || 'ชิ้น'}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-3">
                                    <div className={`flex items-center space-x-2 border rounded-lg p-1 ${isOverStock
                                        ? 'bg-red-50 border-red-300'
                                        : isAtLimit
                                            ? 'bg-yellow-50 border-yellow-300'
                                            : 'bg-white border-gray-300'
                                        }`}>
                                        <button
                                            type="button"
                                            onClick={() => handleDecrementQuantity(item.id)}
                                            className="p-1 bg-gray-100 rounded hover:bg-gray-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                            disabled={currentQuantity <= 0 || !hasStock}
                                        >
                                            <Minus className="w-3 h-3 text-gray-600" />
                                        </button>

                                        <input
                                            type="text"
                                            value={inputValues[item.id] ?? safeNumber(item.quantity).toFixed(2)}
                                            onChange={(e) => {
                                                let val = e.target.value;

                                                // Allow only numbers and decimal
                                                if (!/^\d*\.?\d*$/.test(val)) return;

                                                // Limit decimal places to 2
                                                if (val.includes('.')) {
                                                    const [intPart, decPart] = val.split('.');
                                                    val = intPart + '.' + decPart.slice(0, 2);
                                                }

                                                const numericValue = Number(val) || 0;

                                                // ✅ ป้องกันการป้อนค่าเกิน available
                                                if (numericValue > maxAvailable) {
                                                    // Auto-correct to max available if exceeds
                                                    handleItemQuantityChange(item.id, maxAvailable);
                                                    setInputValues((prev) => ({ ...prev, [item.id]: maxAvailable.toFixed(2) }));

                                                    // แจ้งเตือนผู้ใช้
                                                    Swal.fire({
                                                        icon: 'warning',
                                                        title: 'ปรับจำนวนให้เหมาะสม',
                                                        text: `จำนวนที่ป้อนเกินสต็อกที่มี ระบบปรับเป็น ${formatNumber(maxAvailable)} ${item.unit || 'ชิ้น'} ให้แล้ว`,
                                                        timer: 2000,
                                                        showConfirmButton: false
                                                    });
                                                } else {
                                                    setInputValues((prev) => ({ ...prev, [item.id]: val }));
                                                    handleItemQuantityChange(item.id, numericValue);
                                                }
                                            }}
                                            onBlur={(e) => {
                                                const val = e.target.value;
                                                const numericValue = Number(val) || 0;
                                                const stockInfo = calculateStockInfo(item);
                                                const maxAvailable = Math.max(0, stockInfo.available);

                                                // ✅ Auto-correct on blur
                                                if (numericValue > maxAvailable) {
                                                    handleItemQuantityChange(item.id, maxAvailable);
                                                    setInputValues((prev) => ({ ...prev, [item.id]: maxAvailable.toFixed(2) }));
                                                }
                                            }}
                                            placeholder="0.00"
                                            className={`px-2 py-1 text-center border-0 focus:ring-0 focus:outline-none bg-transparent font-semibold ${isOverStock
                                                ? 'text-red-600'
                                                : stockStatus.status === 'OUT_OF_STOCK' || !hasStock
                                                    ? 'text-gray-400'
                                                    : 'text-gray-900'
                                                }`}
                                            style={{ width: `${Math.max((inputValues[item.id] ?? safeNumber(item.quantity).toFixed(2)).length + 3, 6)}ch` }}
                                            disabled={!hasStock}
                                        />

                                        <button
                                            type="button"
                                            onClick={() => {
                                                const newQuantity = currentQuantity + 1;
                                                // ✅ ป้องกัน increment ถ้าเกิน max available
                                                if (newQuantity <= maxAvailable) {
                                                    handleIncrementQuantity(item.id);
                                                } else {
                                                    Swal.fire({
                                                        icon: 'warning',
                                                        title: 'ไม่สามารถเพิ่มได้',
                                                        text: `จำนวนที่เบิกเกินสต็อกที่มี (ใช้ได้: ${formatNumber(maxAvailable)} ${item.unit || 'ชิ้น'})`,
                                                        timer: 1500,
                                                        showConfirmButton: false
                                                    });
                                                }
                                            }}
                                            className="p-1 bg-gray-100 rounded hover:bg-gray-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                            disabled={currentQuantity >= maxAvailable || !hasStock}
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
                        <p className="text-xs text-gray-400 mt-1">กรุณาค้นหาและเพิ่มสินค้าจากช่องค้นหาด้านบน</p>
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
