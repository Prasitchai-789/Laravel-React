import React, { useState, useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';
import axios from 'axios';
import Swal from 'sweetalert2';

interface ReturnFormProps {
    onClose: () => void;
    onSuccess: () => void;
}

interface DocumentItem {
    id: number;
    GoodID: string;
    GoodName: string;
    borrowedQty: number;
    returnQty: number;
    unit?: string;
    remainingQty: number;
}

interface Document {
    id: number;
    document_number: string;
    order_date: string;
    status: string;
}

const ReturnForm: React.FC<ReturnFormProps> = ({ onClose, onSuccess }) => {
    const [documentNumber, setDocumentNumber] = useState('');
    const [documentList, setDocumentList] = useState<Document[]>([]);
    const [documentItems, setDocumentItems] = useState<DocumentItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [isFetchingItems, setIsFetchingItems] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [submitting, setSubmitting] = useState(false);
    // กรองเอกสารตามคำค้นหา
    const filteredDocuments = documentList.filter(doc =>
        doc.document_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.order_date.includes(searchTerm) ||
        doc.status.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // จำกัดการแสดงผลเพียง 5 รายการ
    const displayedDocuments = filteredDocuments.slice(0, 5);

    useEffect(() => {
        const fetchDocuments = async () => {
            try {
                const res = await axios.get('/StoreOrder/store-orders/documents');

                // กรองเฉพาะเอกสารที่ approved
                const approvedDocuments = res.data.filter((doc: any) => doc.status === 'approved');

                setDocumentList(approvedDocuments);
            } catch (error: any) {
                console.error(error);
                Swal.fire('Error', 'ไม่สามารถดึงรายการเอกสารได้', 'error');
            }
        };

        fetchDocuments();
    }, []);

    // ปิด dropdown เมื่อคลิกนอกพื้นที่
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // เมื่อเลือกเอกสารจาก dropdown
    const handleDocumentSelect = (doc: Document) => {
        setDocumentNumber(doc.document_number);
        setSearchTerm(doc.document_number);
        setShowDropdown(false);
    };

    const fetchDocumentItems = async () => {
        if (!documentNumber) return;

        setLoading(true);
        setIsFetchingItems(true);
        setDocumentItems([]); // ล้างรายการเก่าก่อน fetch

        try {
            const response = await axios.get(`/StoreOrder/document-items/${documentNumber}`);

            // ตรวจสอบว่ามี items
            if (!response.data.items || response.data.items.length === 0) {
                Swal.fire({
                    icon: 'info',
                    title: 'เอกสารว่าง',
                    text: 'เอกสารนี้ไม่มีรายการสินค้า',
                });
                return;
            }

            // ใน fetchDocumentItems
            const items: DocumentItem[] = response.data.items.map((item: any) => ({
                id: item.id,
                GoodID: item.good_id,
                GoodName: item.good_name,
                borrowedQty: item.borrowed_quantity,
                returnedQty: item.returned_quantity,
                remainingQty: item.remaining_quantity,
                returnQty: 0,
                unit: item.unit || 'ชิ้น',
                storeItemId: item.store_item_id,
            }));


            console.log("📌 Raw response:", response.data.items);
            console.log("📌 Mapped items:", items);

            setDocumentItems(items);


        } catch (error: any) {
            console.error(error);

            if (error.response?.status === 404) {
                Swal.fire({
                    icon: 'error',
                    title: 'ไม่พบเอกสาร',
                    text: `ไม่พบเอกสารหมายเลข ${documentNumber}`,
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'เกิดข้อผิดพลาด',
                    text: error.message || 'ไม่สามารถดึงรายการสินค้าได้',
                });
            }

            setDocumentItems([]);
        } finally {
            setLoading(false);
            setIsFetchingItems(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (submitting) return; // ป้องกันกดซ้ำ

        // ตรวจสอบเอกสารและจำนวนคืนเหมือนเดิม
        if (documentItems.length === 0) {
            Swal.fire('Warning', 'กรุณาเลือกเอกสารก่อน', 'warning');
            return;
        }

        const hasReturnItems = documentItems.some(i => i.returnQty > 0);
        if (!hasReturnItems) {
            Swal.fire('Warning', 'กรุณากรอกจำนวนที่คืนอย่างน้อย 1 รายการ', 'warning');
            return;
        }

        const invalidItem = documentItems.find(i => i.returnQty > i.remainingQty);
        if (invalidItem) {
            Swal.fire(
                'Warning',
                `${invalidItem.GoodName} คืนเกินจำนวนที่ยืมได้ (สูงสุด: ${invalidItem.remainingQty} ${invalidItem.unit || 'ชิ้น'})`,
                'warning'
            );
            return;
        }

        setSubmitting(true); // ✅ ป้องกันกดซ้ำ

        // ใน handleSubmit
        router.post(route('store.return'), {
            document_number: documentNumber,
            items: documentItems
                .filter(i => i.returnQty > 0)
                .map(i => ({
                    product_id: i.id,             // store_order_items.id
                    store_item_id: i.storeItemId, // ✅ ส่ง store_items.id จริง
                    good_name: i.GoodName,
                    quantity: i.returnQty,
                    movement_type: 'return',
                    type: 'add',
                    category: 'stock',
                    note: `คืนสินค้า ${i.GoodName} จากเอกสาร ${documentNumber}`,
                    unit: i.unit || 'ชิ้น'
                }))

        }, {
            onSuccess: () => {
                Swal.fire('Success', 'คืนสินค้าสำเร็จ', 'success').then(() => {
                    onSuccess();
                    onClose();
                    setSubmitting(false);
                });
            },
            onError: (errors) => {
                console.error('Error details:', errors);
                Swal.fire('Error', 'ไม่สามารถคืนสินค้าได้', 'error');
                setSubmitting(false);
            },
        });

    };

    // คำนวณตำแหน่งสำหรับ dropdown popup
    const getDropdownPosition = () => {
        if (!inputRef.current) return {};

        const inputRect = inputRef.current.getBoundingClientRect();
        const modalRect = dropdownRef.current?.closest('.modal-container')?.getBoundingClientRect();

        return {
            position: 'fixed' as const,
            top: inputRect.bottom + window.scrollY + 8,
            left: inputRect.left + window.scrollX,
            width: inputRect.width,
            zIndex: 9999
        };
    };

    return (
        <div className="bg-white rounded-2xl shadow-xl p-6 max-w-4xl mx-auto modal-container  font-anuphan">


            <form onSubmit={handleSubmit} className="space-y-6">
                {/* ค้นหาและเลือกเอกสาร */}
                <div className="space-y-4">
                    <label className="block text-lg font-semibold text-gray-800">
                        เลือกหรือค้นหาเลขเอกสาร
                    </label>

                    {/* ช่องค้นหาและเลือกเอกสาร */}
                    <div className="relative" ref={dropdownRef}>
                        <div className="relative">
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder="พิมพ์เลขเอกสารหรือคลิกเลือกจากรายการ..."
                                value={searchTerm}
                                onChange={e => {
                                    setSearchTerm(e.target.value);
                                    setShowDropdown(true);
                                }}
                                onFocus={() => setShowDropdown(true)}
                                className="w-full border border-gray-300 px-5 py-4 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-12 transition-all duration-200 shadow-sm text-lg"
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                                <svg
                                    className="h-5 w-5 text-gray-400 transition-transform duration-200"
                                    style={{ transform: showDropdown ? 'rotate(180deg)' : 'rotate(0deg)' }}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>

                        {/* Dropdown Popup */}
                        {showDropdown && (
                            <div
                                className="absolute bg-white border border-gray-200 rounded-xl shadow-2xl max-h-72 overflow-y-auto transform origin-top"
                                style={getDropdownPosition()}
                            >
                                {displayedDocuments.length > 0 ? (
                                    <div className="py-2">
                                        {displayedDocuments.map((doc, index) => (
                                            <div
                                                key={doc.id}
                                                onClick={() => handleDocumentSelect(doc)}
                                                className={`px-4 py-3 cursor-pointer transition-all duration-200 hover:bg-blue-50 ${index !== displayedDocuments.length - 1 ? 'border-b border-gray-100' : ''
                                                    } ${documentNumber === doc.document_number ? 'bg-blue-100 border-l-4 border-blue-500' : ''
                                                    }`}
                                            >
                                                <div className="font-medium text-gray-800 text-base mb-1">
                                                    {doc.document_number}
                                                </div>
                                                <div className="flex items-center justify-between text-sm text-gray-600">
                                                    <span>วันที่: {doc.order_date}</span>
                                                    <span className={`px-2 py-1 rounded-full ${doc.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                        doc.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {doc.status}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                        {filteredDocuments.length > 5 && (
                                            <div className="px-4 py-2 text-center text-xs text-gray-500 bg-gray-50 border-t border-gray-100">
                                                แสดง 5 จาก {filteredDocuments.length} รายการ
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="px-4 py-3 text-gray-500 text-center text-sm">
                                        {searchTerm ? 'ไม่พบเอกสารที่ตรงกับคำค้นหา' : 'ไม่มีเอกสารในระบบ'}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* แสดงเอกสารที่เลือก */}
                    {documentNumber && (
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className="bg-blue-100 p-3 rounded-lg mr-4">
                                        <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <div className="font-medium text-blue-800 text-sm">เอกสารที่เลือก</div>
                                        <div className="font-semibold text-gray-800 text-lg">{documentNumber}</div>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setDocumentNumber('');
                                        setSearchTerm('');
                                        setDocumentItems([]);
                                    }}
                                    className="text-red-400 hover:text-red-600 transition-colors duration-200 p-2 rounded-full hover:bg-red-50"
                                    title="ล้างการเลือก"
                                >
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={fetchDocumentItems}
                        disabled={!documentNumber || isFetchingItems}
                        className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-lg font-medium"
                    >
                        {isFetchingItems ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                กำลังโหลด...
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                ตรวจสอบรายการสินค้า
                            </>
                        )}
                    </button>
                </div>

                {/* Loading */}
                {loading && (
                    <div className="flex flex-col items-center justify-center py-10 bg-gray-50 rounded-xl">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                        <span className="text-gray-600 text-lg">กำลังโหลดรายการสินค้า...</span>
                    </div>
                )}

                {/* รายการสินค้า */}
                {documentItems.length > 0 && (
                    <div className="space-y-6">
                        <h3 className="font-semibold text-gray-800 text-xl border-b pb-3 flex items-center">
                            <svg className="h-6 w-6 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            รายการสินค้าในเอกสาร
                        </h3>
                        <div className="max-h-96 overflow-y-auto space-y-5">
                            {documentItems.map((item, idx) => (
                                <div key={item.GoodID} className="border border-gray-200 rounded-xl p-6 bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
                                    <div className="flex justify-between items-start mb-5">
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-gray-800 text-lg mb-2">{item.GoodName}</h4>
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1.5 rounded-full">
                                                    รหัส: {item.GoodID}
                                                </span>
                                                <span className="text-sm bg-gray-100 text-gray-800 px-3 py-1.5 rounded-full">
                                                    หน่วย: {item.unit || 'ชิ้น'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">จำนวนที่คืนได้</label>
                                            <div className="bg-gray-50 px-5 py-3.5 rounded-lg border border-gray-200 text-gray-800 font-medium text-lg flex items-center">
                                                <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                {item.remainingQty} {item.unit || 'ชิ้น'}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">จำนวนที่คืน *</label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    min={0}
                                                    max={item.remainingQty}
                                                    value={item.returnQty}
                                                    step="0.01"
                                                    onChange={e => {
                                                        const value = Math.max(0, Math.min(item.remainingQty, Number(e.target.value) || 0));
                                                        setDocumentItems(prev => {
                                                            const copy = [...prev];
                                                            copy[idx].returnQty = value;
                                                            return copy;
                                                        });
                                                    }}
                                                    className="w-full border border-gray-300 px-5 py-3.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-lg"
                                                    placeholder="0"
                                                    required
                                                />
                                            </div>
                                            <p className="text-xs text-gray-500 mt-2">
                                                คืนได้สูงสุด: {item.remainingQty} {item.unit || 'ชิ้น'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {documentItems.length > 0 && (
                    <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-8 py-3.5 rounded-xl bg-gray-200 text-gray-700 hover:bg-gray-300 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
                        >
                            ยกเลิก
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className={`px-8 py-3.5 rounded-xl text-white transition-all duration-200 font-medium shadow-md flex items-center
        ${submitting
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 hover:shadow-lg transform hover:-translate-y-0.5'}
    `}
                        >
                            {submitting ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                    กำลังประมวลผล...
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    ยืนยันคืนสินค้า
                                </>
                            )}
                        </button>

                    </div>
                )}
            </form>

            <style jsx>{`
                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .absolute {
                    animation: slideDown 0.2s ease-out;
                }
            `}</style>
        </div>
    );
};

export default ReturnForm;
