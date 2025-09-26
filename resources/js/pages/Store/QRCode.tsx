import React, { useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { router } from '@inertiajs/react';
import { Link } from '@inertiajs/react';
 
const QRCodePage = ({ product }: { product: any }) => {
    const [editableProduct, setEditableProduct] = useState({ ...product });
    const [isEditing, setIsEditing] = useState(false);

    // ฟังก์ชันตรวจสอบสถานะสต็อก
    const getStockStatus = (quantity, safetyStock) => {
        const qty = quantity || 0;
        const safety = safetyStock || 0;
        if (qty > safety * 1.5) return { text: 'พร้อมใช้งาน', color: 'text-green-600', bg: 'bg-green-100' };
        if (qty > safety) return { text: 'เพียงพอ', color: 'text-blue-600', bg: 'bg-blue-100' };
        if (qty > 0) return { text: 'จำนวนจำกัด', color: 'text-yellow-600', bg: 'bg-yellow-100' };
        return { text: 'สินค้าหมด', color: 'text-red-600', bg: 'bg-red-100' };
    };

    const stockStatus = getStockStatus(editableProduct.stock_qty, editableProduct.safety_stock);

    // ฟังก์ชันจัดรูปแบบราคา
    const formatPrice = (price) => {
        if (!price) return '0.00';
        return new Intl.NumberFormat('th-TH', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(price);
    };

    // ฟังก์ชันจัดรูปแบบจำนวน
    const formatNumber = (number) => {
        if (!number) return '0';
        return new Intl.NumberFormat('th-TH').format(number);
    };

    const handleChange = (field: string, value: any) => {
        setEditableProduct(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        setIsEditing(false);
        router.get(route('StoreIssue.index'));
    };

    // ฟังก์ชันแปลงชื่อฟิลด์เป็นภาษาไทย
    const getThaiFieldName = (field) => {
        const fieldNames = {
            'GoodCode': 'รหัสสินค้า',
            'GoodStockUnitName': 'หน่วยนับ',
            'stock_qty': 'จำนวนในสต็อก',
            'safety_stock': 'สต็อกปลอดภัย',
            'price': 'ราคา',
            'GoodName': 'ชื่อสินค้า',
            'GoodID': 'รหัสประจำสินค้า',
            'category': 'หมวดหมู่'
        };
        return fieldNames[field] || field;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex flex-col items-center justify-center font-anuphan">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-5 text-white text-center">
                    <h1 className="text-xl font-bold mb-1">QR Code สินค้า</h1>
                    <p className="text-sm opacity-90">สแกนเพื่อดูข้อมูลสินค้า</p>
                </div>

                {/* Product Name Section */}
                <div className="p-5 border-b border-gray-100">
                    <div className="flex flex-col items-center space-y-3">
                                                       
                        <Link
                            href={`/StoreOrder?goodCode=${editableProduct.GoodCode}`}
                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            แก้ไขข้อมูล
                        </Link>
                    </div>
                </div>

                {/* QR Code Section */}
                <div className="p-6 flex flex-col items-center justify-center">
                    <h2 className="text-lg font-semibold text-gray-800 text-center line-clamp-2">
                        {editableProduct.GoodName}
                    </h2>
                    <QRCodeCanvas
                        value={route('StoreOrder.qrcode', { order: product.GoodID })}
                        size={300}
                        level="H"
                        includeMargin={true}
                        className="rounded shadow-sm"
                    />
                    <h2 className="text-lg font-semibold text-gray-800 text-center line-clamp-2">
                                {editableProduct.GoodCode}
                            </h2>
                    <div className="mt-4 flex items-center justify-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${stockStatus.bg} ${stockStatus.color}`}>
                            {stockStatus.text}
                        </span>
                    </div>
                </div>

                {/* Product Details */}
                <div className="p-5 bg-gray-50">
                    <div className="grid grid-cols-1 gap-3">
                        {[
                            { field: 'GoodCode', label: 'รหัสสินค้า' },
                            { field: 'GoodID', label: 'รหัสประจำสินค้า' },
                            { field: 'GoodStockUnitName', label: 'หน่วยนับ' },
                            { field: 'stock_qty', label: 'จำนวนในสต็อก', type: 'number' },
                            { field: 'safety_stock', label: 'สต็อกปลอดภัย', type: 'number' },
                            { field: 'price', label: 'ราคา (บาท)', type: 'price' }
                        ].map(({ field, label, type }) => (
                            <div key={field} className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                                <p className="text-xs text-gray-500 mb-1">{label}</p>
                                {isEditing ? (
                                    <input
                                        type={type === 'number' || type === 'price' ? 'number' : 'text'}
                                        value={editableProduct[field] ?? ''}
                                        onChange={(e) =>
                                            handleChange(
                                                field,
                                                type === 'number' || type === 'price'
                                                    ? Number(e.target.value)
                                                    : e.target.value
                                            )
                                        }
                                        className="text-sm font-medium text-gray-800 w-full border border-gray-200 rounded px-2 py-1"
                                        step={type === 'price' ? '0.01' : '1'}
                                    />
                                ) : (
                                    <p className="text-sm font-medium text-gray-800">
                                        {type === 'price'
                                            ? `${formatPrice(editableProduct[field])} บาท`
                                            : type === 'number'
                                                ? formatNumber(editableProduct[field])
                                                : editableProduct[field] || '-'
                                        }
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>


                {/* Download QR Code */}
                

                {/* Footer */}
                <div className="p-4 bg-white text-center border-t border-gray-200">
                    
                    <p className="text-xs text-gray-400 mt-1">
                        ข้อมูลล่าสุด : {new Date().toLocaleDateString('th-TH', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default QRCodePage;