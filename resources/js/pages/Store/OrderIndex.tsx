import React, { useState, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { QRCodeCanvas } from 'qrcode.react';
import { Link } from '@inertiajs/react';
import ModalForm from '@/components/ModalForm';
import FormEdit from './useFormEdit';
import FormCreate from './useFormCreate';
import FormReturn from './useFormReturn';
import Swal from 'sweetalert2';
import { can } from '@/lib/can';

// mapping จากรหัสสินค้า (GoodCode) เป็นชื่อประเภทสินค้า
const goodCodeCategories: Record<string, string> = {
    "ST-EL": "อุปกรณ์ไฟฟ้า",
    "ST-FP": "อะไหล่ท่อ",
    "ST-SM": "อะไหล่",
    "ST-EQ": "วัสดุสิ้นเปลือง",
    "P-TS-AG001": "ทั่วไป",
};

const getCategoryByGoodCode = (goodCode?: string) => {
    if (!goodCode) return;

    for (const [prefix, category] of Object.entries(goodCodeCategories)) {
        if (goodCode.startsWith(prefix)) {
            return category;
        }
    }
    return undefined;
};

// ฟังก์ชันตรวจสอบสถานะตาม Safety Stock
const getStockStatus = (stockQty: number, safetyStock: number) => {
    if (stockQty === 0) return 'red'; // ถ้า stock เป็น 0 ให้เป็นสีแดงทันที

    if (safetyStock === 0) return 'green'; // ถ้าไม่มี safety stock ให้เป็นสีเขียว

    if (stockQty > safetyStock) {
        return 'green';
    } else if (stockQty >= safetyStock * 0.8) { // เข้าใกล้ safety stock (80-100%)
        return 'yellow';
    } else { // น้อยกว่า 80% ของ safety stock
        return 'red';
    }
};

const getStatusText = (stockQty: number, safetyStock: number) => {
    if (stockQty === 0) return 'หมด'; // แสดงว่า "หมด" เมื่อ stock เป็น 0

    if (safetyStock === 0) return 'พร้อมใช้งาน';

    const status = getStockStatus(stockQty, safetyStock);
    if (status === 'green') return 'พร้อมใช้งาน';
    if (status === 'yellow') return 'ใกล้หมด';
    return 'ต่ำกว่าขั้นต่ำ';
};

const GoodsIndex = ({ goods: initialGoods }) => {
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด');
    const [sortField, setSortField] = useState('GoodID');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const [viewMode, setViewMode] = useState<'card' | 'table'>('table');
    const itemsPerPage = 12;
    const [editingProductId, setEditingProductId] = useState<number | null>(null);
    const [editingProduct, setEditingProduct] = useState<any>({});
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
    const [returnProduct, setReturnProduct] = useState<any>(null);

    const openModal = (mode: 'create' | 'edit', product = null) => {
        setSelectedProduct(product);
        setModalMode(mode);
        setIsModalOpen(true);
    };

    const openReturnModal = (product = null) => {
        setReturnProduct(product);
        setIsReturnModalOpen(true);
    };

    // ✅ แก้ไขฟังก์ชันคำนวณสต็อก
    const calculateStockInfo = (product: any) => {
        const stockQty = Number(product.StockQty ?? product.stock_qty ?? 0);
        const reservedQty = Number(product.reservedQty ?? 0);

        const availableQty = stockQty - reservedQty;

        return {
            stockQty: stockQty,
            reservedQty: reservedQty,
            availableQty: Math.max(0, availableQty) // ไม่ให้ติดลบ
        };
    };

    // ✅ สร้างหมวดหมู่จาก GoodCode เฉพาะที่มีหมวดหมู่จริง
    const categories = useMemo(() => {
        const uniqueCategories = [
            ...new Set(
                initialGoods
                    .map(item => getCategoryByGoodCode(item.GoodCode))
                    .filter((category): category is string => Boolean(category))
                    .filter(category => category !== "คีมจับอ๊อก 500A")
            ),
        ];
        return ['ทั้งหมด', ...uniqueCategories];
    }, [initialGoods]);

    // ✅ กรอง + เรียงลำดับ
    const filteredAndSortedGoods = useMemo(() => {
        let result = [...initialGoods];

        if (search) {
            const searchLower = search.toLowerCase();
            result = result.filter(
                g =>
                    g.GoodName?.toLowerCase().includes(searchLower) ||
                    g.GoodCode?.toLowerCase().includes(searchLower)
            );
        }

        if (selectedCategory !== 'ทั้งหมด') {
            result = result.filter(
                g => getCategoryByGoodCode(g.GoodCode) === selectedCategory
            );
        }

        result.sort((a, b) => {
            let aValue = a[sortField] ?? '';
            let bValue = b[sortField] ?? '';

            if (sortField === 'StockQty') {
                aValue = Number(a.StockQty) || 0;
                bValue = Number(b.StockQty) || 0;
                return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
            }

            return sortDirection === 'asc'
                ? aValue.toString().localeCompare(bValue.toString(), 'th')
                : bValue.toString().localeCompare(aValue.toString(), 'th');
        });

        return result;
    }, [initialGoods, search, selectedCategory, sortField, sortDirection]);

    // ✅ pagination
    const totalPages = Math.ceil(filteredAndSortedGoods.length / itemsPerPage);
    const paginatedGoods = filteredAndSortedGoods.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // ✅ นับจำนวนสินค้าในแต่ละหมวดหมู่
    const categoryCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        categories.forEach(category => {
            counts[category] =
                category === 'ทั้งหมด'
                    ? initialGoods.filter(g => getCategoryByGoodCode(g.GoodCode)).length
                    : initialGoods.filter(g => getCategoryByGoodCode(g.GoodCode) === category).length;
        });
        return counts;
    }, [initialGoods, categories]);

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'หน้าหลัก', href: route('dashboard') },
                { title: 'จัดการสินค้า', href: route('orders.index') },
            ]}
        >

            <Head title="จัดการสินค้า" />

            <div className="px-4 py-6 sm:px-6  font-anuphan">
                {/* Header */}
                <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">ระบบจัดการสินค้า</h1>
                        <p className="text-gray-600 text-lg">
                            จัดการข้อมูลสินค้าและประเภทสินค้าทั้งหมด
                        </p>
                    </div>

                    {/* ปุ่มคืนสินค้า */}
                    <div className="flex justify-end space-x-3">
                        <button
                            onClick={() => openReturnModal()}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors duration-200 flex items-center shadow-md hover:shadow-lg"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            คืนสินค้า
                        </button>
                        <button
                            onClick={() => openModal('create')}
                            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg transition-colors duration-200 flex items-center shadow-md hover:shadow-lg"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-plus" viewBox="0 0 16 16">
                                <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4" />
                            </svg>
                            เพิ่มสินค้า
                        </button>

                    </div>
                </div>

                {/* Search & Sort */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                                ค้นหาสินค้า
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    placeholder="ค้นหาด้วยรหัสหรือชื่อสินค้า..."
                                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                />

                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-700">เรียงลำดับโดย</label>
                            <select
                                className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                value={sortField}
                                onChange={e => setSortField(e.target.value)}
                            >
                                <option value="GoodCode">รหัสสินค้า</option>
                                <option value="GoodName">ชื่อสินค้า</option>
                                <option value="StockQty">จำนวนคงเหลือ</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-700">ทิศทางการเรียง</label>
                            <select
                                className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                value={sortDirection}
                                onChange={e => setSortDirection(e.target.value as 'asc' | 'desc')}
                            >
                                <option value="asc">จากน้อยไปมาก</option>
                                <option value="desc">จากมากไปน้อย</option>
                            </select>
                        </div>
                    </div>

                    {/* View Mode Toggle */}
                    <div className="flex justify-between items-center mb-4">
                        <div className="space-y-3 flex-1">
                            <label className="block text-sm font-medium text-gray-700">
                                หมวดหมู่สินค้า (ตามรหัสสินค้า)
                            </label>
                            <div className="flex flex-wrap gap-3">
                                {categories.map(category => (
                                    <button
                                        key={category}
                                        onClick={() => {
                                            setSelectedCategory(category);
                                            setCurrentPage(1);
                                        }}
                                        className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${selectedCategory === category
                                            ? 'bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg transform scale-105 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                                            }`}
                                    >
                                        {category}
                                        <span className={`ml-2 px-2 py-1 rounded-full ${selectedCategory === category ? 'bg-white bg-opacity-20 text-gray-700' : 'bg-gray-200'}`}>
                                            {categoryCounts[category]}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => setViewMode('table')}
                                className={`p-3 rounded-lg transition ${viewMode === 'table'
                                    ? 'bg-blue-500 text-white shadow-md'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                title="แสดงแบบตาราง"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                            </button>
                            <button
                                onClick={() => setViewMode('card')}
                                className={`p-3 rounded-lg transition ${viewMode === 'card'
                                    ? 'bg-blue-500 text-white shadow-md'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                title="แสดงแบบการ์ด"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Results Info */}
                <div className="mb-6 flex justify-between items-center">
                    <p className="text-gray-600">
                        พบสินค้า <span className="font-semibold text-blue-600">{filteredAndSortedGoods.length}</span> รายการ
                        {selectedCategory !== 'ทั้งหมด' && (
                            <span className="ml-2 text-sm text-purple-600">
                                (หมวดหมู่: {selectedCategory})
                            </span>
                        )}
                    </p>
                    <p className="text-sm text-gray-500">
                        หน้า {currentPage} จาก {totalPages}
                    </p>
                </div>

                <div className="mb-8">
                    {paginatedGoods.length > 0 ? (
                        <>
                            {viewMode === 'table' ? (
                                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full table-auto text-sm">
                                            <thead className="bg-gray-50 border-b border-gray-200">
                                                <tr>
                                                    {/* รหัสสินค้า */}
                                                    <th className="px-4 py-3 text-start text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                                        รหัสสินค้า
                                                    </th>

                                                    {/* ชื่อสินค้า */}
                                                    <th className="px-4 py-3 text-start text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                                        ชื่อสินค้า
                                                    </th>

                                                    {/* จำนวนคงเหลือ */}
                                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                                        จำนวนคงเหลือ
                                                    </th>

                                                    {/* การเคลื่อนไหวของสินค้า */}
                                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                                        การเคลื่อนไหวของสินค้า
                                                    </th>

                                                    {/* สถานะ */}
                                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                                        สถานะ
                                                    </th>

                                                    {/* QR Code */}
                                                    <th className="px-4 py-3 text-start text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                                        QR Code
                                                    </th>
                                                    {can('PUR.edit') && (
                                                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                                            การจัดการ
                                                        </th>
                                                    )}

                                                </tr>

                                            </thead>

                                            <tbody className="bg-white divide-y divide-gray-100">
                                                {paginatedGoods.map((product) => {
                                                    // ✅ ใช้ฟังก์ชันคำนวณสต็อกที่แก้ไขแล้ว
                                                    const stockInfo = calculateStockInfo(product);
                                                    const category = getCategoryByGoodCode(product.GoodCode) ?? '-';
                                                    const safetyStock = Number(product.safety_stock ?? 0);

                                                    // ✅ คำนวณสถานะตาม Safety Stock โดยใช้ stockInfo.stockQty
                                                    const stockStatus = getStockStatus(stockInfo.stockQty, safetyStock);
                                                    const statusText = getStatusText(stockInfo.stockQty, safetyStock);

                                                    const statusStyles = {
                                                        green: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-400', border: 'border-green-200' },
                                                        yellow: { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-400', border: 'border-yellow-200' },
                                                        red: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-400', border: 'border-red-200' }
                                                    };

                                                    const currentStatus = statusStyles[stockStatus];

                                                    // ✅ สถานะเบิกได้ ใช้ stockInfo.availableQty
                                                    let availableBg = 'bg-red-50 border-red-100';
                                                    let availableText = 'text-red-600';
                                                    let availableBorder = 'border-red-100';

                                                    if (stockInfo.availableQty > 10) {
                                                        availableBg = 'bg-green-50 border-green-100';
                                                        availableText = 'text-green-600';
                                                        availableBorder = 'border-green-100';
                                                    } else if (stockInfo.availableQty > 0) {
                                                        availableBg = 'bg-amber-50 border-amber-100';
                                                        availableText = 'text-amber-600';
                                                        availableBorder = 'border-amber-100';
                                                    }

                                                    return (
                                                        <tr key={product.GoodID} className="hover:bg-gray-50 transition-colors duration-150">
                                                            {/* รหัสสินค้า */}
                                                            <td className="px-4 py-3">
                                                                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                                                    {product.GoodCode}
                                                                </span>
                                                            </td>

                                                            {/* ชื่อสินค้า */}
                                                            <td className="px-4 py-3">
                                                                <div className="flex flex-col gap-1.5 max-w-[200px]">
                                                                    <div className="text-sm font-semibold text-gray-900 truncate hover:text-blue-600 transition-colors">
                                                                        {product.GoodName}
                                                                    </div>
                                                                    <div className="flex items-center gap-2 flex-wrap">
                                                                        <span className="text-xs text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded border flex items-center justify-center">
                                                                            ID: {product.GoodID}
                                                                        </span>
                                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100">
                                                                            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full mr-1.5"></span>
                                                                            {category}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </td>

                                                            {/* ✅ จำนวนคงเหลือ - ใช้ stockInfo.stockQty */}
                                                            <td className="px-4 py-2">
                                                                <div className="flex flex-col gap-2 min-w-[40px]">
                                                                    <div className="flex items-center justify-between bg-blue-50 px-2 py-1 rounded-md border border-blue-100">
                                                                        <span className="text-xs text-blue-600">มีอยู่</span>
                                                                        <span>{stockInfo.stockQty.toLocaleString()}</span>
                                                                    </div>
                                                                </div>
                                                            </td>

                                                            {/* ✅ การเคลื่อนไหวของสินค้า - ใช้ stockInfo */}
                                                            <td className="px-4 py-3">
                                                                <div className="flex flex-col gap-1.5 min-w-[110px]">
                                                                    <div className="flex items-center justify-between bg-amber-50 px-2 py-1.5 rounded-md border border-amber-100">
                                                                        <span className="text-xs text-amber-600">ถูกจอง</span>
                                                                        <span className="text-xs font-semibold text-amber-800">{stockInfo.reservedQty.toLocaleString()}</span>
                                                                    </div>
                                                                    <div className={`flex items-center justify-between px-2 py-1.5 rounded-md border ${availableBg} ${availableBorder}`}>
                                                                        <span className={`text-xs font-semibold ${availableText}`}>เบิกได้</span>
                                                                        <span className={`text-xs font-semibold ${availableText}`}>{stockInfo.availableQty.toLocaleString()}</span>
                                                                    </div>
                                                                </div>
                                                            </td>

                                                            {/* ✅ สถานะ - ใช้ stockInfo.stockQty */}
                                                            <td className="px-4 py-3">
                                                                <div className="flex flex-col items-center space-y-2">
                                                                    <div className="text-xs font-medium text-gray-500 tracking-wide">Safety Stock</div>
                                                                    <div className="flex flex-col gap-2">
                                                                        <div className={`inline-flex items-center justify-center px-3 py-1 rounded-lg text-xs font-semibold transition-all duration-200 shadow-sm ${stockInfo.stockQty > safetyStock
                                                                            ? 'bg-green-50 text-green-700 border border-green-200 shadow-green-100'
                                                                            : stockInfo.stockQty >= safetyStock * 0.8
                                                                                ? 'bg-amber-50 text-amber-700 border border-amber-200 shadow-amber-100'
                                                                                : 'bg-red-50 text-red-700 border border-red-200 shadow-red-100'
                                                                            }`}>
                                                                            <span className="font-mono">{safetyStock.toLocaleString()}</span>
                                                                        </div>
                                                                        <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-medium border shadow-sm transition-all duration-200 ${currentStatus.bg} ${currentStatus.text} ${currentStatus.border}`}>
                                                                            <span className={`w-2 h-2 rounded-full mr-2 ${currentStatus.dot}`}></span>
                                                                            {statusText}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </td>

                                                            {/* QR Code */}
                                                            <td className="px-4 py-3">
                                                                <div className="flex flex-col items-center max-w-[60px]">
                                                                    <Link
                                                                        href={route('StoreOrder.qrcode', { order: product.GoodID })}
                                                                        className="cursor-pointer transition-transform duration-300 hover:scale-150 block"
                                                                    >
                                                                        <QRCodeCanvas
                                                                            value={route('StoreOrder.qrcode', { order: product.GoodID })}
                                                                            size={45}
                                                                            level="M"
                                                                            includeMargin={true}
                                                                            className="rounded"
                                                                        />
                                                                    </Link>
                                                                    <span className="text-xs text-gray-500 mt-1 truncate text-center leading-tight">{product.GoodCode}</span>
                                                                </div>
                                                            </td>

                                                            {/* การจัดการ */}
                                                            <td className="px-4 py-3">
                                                                <div className="flex justify-center">
                                                                    {can('PUR.edit') && (  // 🔹 ตรวจสอบ permission
                                                                        <button
                                                                            onClick={() => openModal('edit', product)}
                                                                            className="p-1.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-md transition-all duration-200 cursor-pointer"
                                                                            title="แก้ไข"
                                                                        >
                                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                            </svg>
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </td>

                                                        </tr>
                                                    );
                                                })}
                                            </tbody>

                                        </table>
                                    </div>
                                </div>
                            ) : (

                                // ✅ Card View - แก้ไขแล้ว
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {paginatedGoods.map((product, index) => {
                                        // ✅ ใช้ฟังก์ชันคำนวณสต็อกที่แก้ไขแล้ว
                                        const stockInfo = calculateStockInfo(product);
                                        const category = getCategoryByGoodCode(product.GoodCode) ?? '-';
                                        const safetyStock = Number(product.safety_stock ?? 0);

                                        const stockStatus = getStockStatus(stockInfo.stockQty, safetyStock);
                                        const statusText = getStatusText(stockInfo.stockQty, safetyStock);

                                        const statusStyles = {
                                            green: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-400', border: 'border-green-200' },
                                            yellow: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-400', border: 'border-amber-200' },
                                            red: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-400', border: 'border-red-200' }
                                        };
                                        const currentStatus = statusStyles[stockStatus];

                                        return (
                                            <div key={product.GoodID} className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-2xl hover:border-blue-200 transition-all duration-300 transform hover:-translate-y-2 flex flex-col h-full">

                                                {/* Header - Code & Category */}
                                                <div className="flex items-center justify-between mb-4">
                                                    <span className="text-xs font-bold bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1.5 rounded-full shadow-sm truncate max-w-[120px]">
                                                        {product.GoodCode}
                                                    </span>
                                                    <span className="text-xs font-semibold bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1.5 rounded-full shadow-sm truncate max-w-[120px]">
                                                        {category}
                                                    </span>
                                                </div>

                                                {/* Product Info */}
                                                <div className="mb-4 flex-1">
                                                    <div className="relative group">
                                                        <h3 className="font-bold text-gray-900 text-lg leading-tight truncate mb-2 hover:text-blue-600 transition-colors cursor-help"
                                                            title={product.GoodName}>
                                                            {product.GoodName}
                                                        </h3>
                                                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 whitespace-nowrap pointer-events-none">
                                                            {product.GoodName}
                                                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between text-sm text-gray-500">
                                                        <span className="truncate max-w-[100px]">ID: {product.GoodID}</span>
                                                        <span className={`inline-flex items-center px-2 py-2 rounded-full text-sm font-semibold border-2 shadow-sm ${currentStatus.bg} ${currentStatus.text} ${currentStatus.border} whitespace-nowrap`}>
                                                            <span className={`w-1 h-1 rounded-full mr-2 ${currentStatus.dot}`}></span>
                                                            {statusText}
                                                        </span>
                                                    </div>
                                                </div>



                                                {/* QR Code */}
                                                <div className="flex justify-center mb-4 p-3 bg-gray-50 rounded-lg">
                                                    <Link href={route('StoreOrder.qrcode', { order: product.GoodID })} className="cursor-pointer transition-transform hover:scale-105">
                                                        <QRCodeCanvas
                                                            value={route('StoreOrder.qrcode', { order: product.GoodID })}
                                                            size={80}
                                                            level="H"
                                                            includeMargin={true}
                                                            className="rounded-lg shadow-md"
                                                        />
                                                    </Link>
                                                </div>

                                                {/* ✅ Stock Information - ใช้ stockInfo */}
                                                <div className="space-y-3 pt-4 border-t border-gray-200 mb-4">
                                                    {/* Safety Stock */}
                                                    <div className="flex items-center justify-between p-2 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg">
                                                        <span className="text-sm font-medium text-gray-700 flex items-center truncate">
                                                            <svg className="w-4 h-4 mr-2 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                                            </svg>
                                                            <span className="truncate">Safety Stock</span>
                                                        </span>
                                                        <span className={`text-sm font-bold px-2 py-1 rounded flex-shrink-0 ml-2 ${safetyStock > 0 ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-600'}`}>
                                                            {Number(safetyStock).toLocaleString()}
                                                        </span>
                                                    </div>

                                                    {/* Stock Quantity */}
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div className="text-center p-2 bg-green-50 rounded-lg border border-green-100">
                                                            <div className="text-xs text-green-600 font-medium mb-1 truncate">มีอยู่ในสต็อก</div>
                                                            <div className="text-lg font-bold text-green-800">{Number(stockInfo.stockQty).toLocaleString()}</div>
                                                        </div>

                                                        <div className="text-center p-2 bg-blue-50 rounded-lg border border-blue-100">
                                                            <div className="text-xs text-blue-600 font-medium mb-1 truncate">ถูกจอง</div>
                                                            <div className="text-lg font-bold text-blue-800">{Number(stockInfo.reservedQty).toLocaleString()}</div>
                                                        </div>
                                                    </div>

                                                    {/* Available Quantity */}
                                                    <div className={`text-center p-3 rounded-lg border-2 ${stockInfo.availableQty > 10
                                                        ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
                                                        : stockInfo.availableQty > 0
                                                            ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200'
                                                            : 'bg-gradient-to-r from-red-50 to-pink-50 border-red-200'
                                                        }`}>
                                                        <div className={`text-sm font-semibold ${stockInfo.availableQty > 10
                                                            ? 'text-green-700'
                                                            : stockInfo.availableQty > 0
                                                                ? 'text-amber-700'
                                                                : 'text-red-700'
                                                            } truncate`}>
                                                            จำนวนที่เบิกได้
                                                        </div>
                                                        <div className={`text-xl font-bold ${stockInfo.availableQty > 10
                                                            ? 'text-green-900'
                                                            : stockInfo.availableQty > 0
                                                                ? 'text-amber-900'
                                                                : 'text-red-900'
                                                            }`}>
                                                            {Number(stockInfo.availableQty).toLocaleString()}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex space-x-2 mt-auto">
                                                    <button
                                                        onClick={() => openModal('edit', product)}
                                                        className="flex-1 px-3 py-2.5 bg-gradient-to-r from-yellow-500 to-amber-500 text-white rounded-lg hover:from-yellow-600 hover:to-amber-600 text-sm font-medium transition-all duration-200 flex items-center justify-center shadow-md hover:shadow-lg"
                                                    >
                                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                        แก้ไข
                                                    </button>

                                                    <Link
                                                        href={route('StoreOrder.qrcode', { order: product.GoodID })}
                                                        className="flex-1 px-3 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 text-sm font-medium transition-all duration-200 flex items-center justify-center shadow-md hover:shadow-lg"
                                                    >
                                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                                                        </svg>
                                                        QR Code
                                                    </Link>
                                                </div>
                                            </div>
                                        );

                                    })}
                                </div>
                            )}

                        </>
                    ) : (
                        <div className="col-span-full text-center py-16">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <p className="text-gray-500 text-lg font-medium mb-2">ไม่พบสินค้า</p>
                            <p className="text-gray-400">ลองเปลี่ยนคำค้นหาหรือหมวดหมู่ดูนะ</p>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 mt-8">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center"
                        >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                            </svg>
                            ก่อนหน้า
                        </button>

                        <div className="flex gap-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                                if (pageNum > totalPages) return null;

                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`w-10 h-10 rounded-lg flex items-center justify-center transition ${currentPage === pageNum
                                            ? 'bg-blue-500 text-white shadow-md'
                                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center"
                        >
                            ถัดไป
                            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                )}

                {isModalOpen && modalMode === 'create' && (
                    <ModalForm
                        isModalOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        title="เพิ่มข้อมูลใหม่"
                        size="max-w-3xl"
                    >
                        <FormCreate
                            data={selectedProduct}
                            onClose={() => setIsModalOpen(false)}
                            onSuccess={() => router.reload({ only: ['records', 'pagination'] })}
                        />
                    </ModalForm>
                )}

                {isModalOpen && modalMode === 'edit' && (
                    <ModalForm
                        isModalOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        title="แก้ไขข้อมูล"
                        size="max-w-3xl"
                    >
                        <FormEdit
                            data={selectedProduct}
                            onClose={() => setIsModalOpen(false)}
                            onSuccess={() => router.reload({ only: ['records', 'pagination'] })}
                        />
                    </ModalForm>
                )}




                {isReturnModalOpen && (
                    <ModalForm
                        isModalOpen={isReturnModalOpen}
                        onClose={() => setIsReturnModalOpen(false)}
                        title="คืนสินค้า"
                        size="max-w-3xl"
                    >
                        <FormReturn
                            data={returnProduct}
                            onClose={() => setIsReturnModalOpen(false)}
                            onSuccess={() => {
                                router.reload();
                                Swal.fire({
                                    position: 'center',
                                    icon: 'success',
                                    title: 'คืนสินค้าสำเร็จ',
                                    showConfirmButton: false,
                                    timer: 1500,
                                    customClass: { popup: 'rounded-2xl font-anuphan' }
                                });
                            }}
                        />
                    </ModalForm>
                )}

            </div>

        </AppLayout >
    );

};

export default GoodsIndex;









