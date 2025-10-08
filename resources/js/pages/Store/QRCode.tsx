import React, { useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Link } from '@inertiajs/react';
import { router } from '@inertiajs/react';

const QRCodePage = ({ product }: { product: any }) => {
    const [editableProduct, setEditableProduct] = useState({ ...product });
    const [isEditing, setIsEditing] = useState(false);

    const getStockStatus = (quantity: number, safetyStock: number) => {
        const qty = quantity || 0;
        const safety = safetyStock || 0;
        if (qty > safety * 1.5) return { text: 'พร้อมใช้งาน', color: 'text-green-600', bg: 'bg-green-100' };
        if (qty > safety) return { text: 'เพียงพอ', color: 'text-blue-600', bg: 'bg-blue-100' };
        if (qty > 0) return { text: 'จำนวนจำกัด', color: 'text-yellow-600', bg: 'bg-yellow-100' };
        return { text: 'สินค้าหมด', color: 'text-red-600', bg: 'bg-red-100' };
    };

    const stockStatus = getStockStatus(editableProduct.stock_qty, editableProduct.safety_stock);

    const formatPrice = (price: number) => {
        return price != null
            ? new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(price)
            : '0.00';
    };

    const formatNumber = (number: number) => {
        return number != null ? new Intl.NumberFormat('th-TH').format(number) : '0';
    };

    const handleChange = (field: string, value: any) => {
        setEditableProduct(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex flex-col items-center justify-center font-anuphan">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">

                {/* Header */}
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-5 text-white text-center">
                    <h1 className="text-xl font-bold mb-1">{editableProduct.GoodName}</h1>

                    <p className="text-sm opacity-90">{editableProduct.GoodCode}</p>
                </div>


                {/* Product Details */}
                <div className="p-5 bg-gray-50">
                    <div className="grid grid-cols-1 gap-3">
                        {[


                            { field: 'stock_qty', label: 'จำนวนในสต็อก', type: 'number' },
                            { field: 'GoodStockUnitName', label: 'หน่วยนับ' },
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

                {/* Product Name + Edit */}
                <div className="p-2 border-b border-gray-100 flex flex-col items-center pt-4">
                    <h2 className="text-lg font-semibold">{editableProduct.GoodName}</h2>

                    {/* QR Code */}
                    <div className=" flex flex-col items-center justify-center pb-4">
                        <QRCodeCanvas
                            value={route('StoreOrder.qrcode', { order: editableProduct.GoodID })}
                            size={250}
                            level="H"
                            includeMargin={true}
                            className="rounded shadow-sm"
                        />
                        <h2 className="p-2 text-lg font-semibold">{editableProduct.GoodCode}</h2>
                    </div>
                    <button
                        onClick={() => {
                            if (editableProduct?.GoodCode) {
                                router.get('/StoreOrder', { search: editableProduct.GoodCode });
                            }
                        }}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center"
                    >
                        แก้ไขข้อมูล
                    </button>

                </div>
                {/* Footer */}
                <div className="p-4 bg-white text-center border-t border-gray-200">
                    <p className="text-xs text-gray-400 mt-1">
                        ข้อมูลล่าสุด : {new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default QRCodePage;
