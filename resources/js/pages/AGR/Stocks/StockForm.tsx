import Button from '@/components/Buttons/Button';
import InputLabel from '@/components/Inputs/InputLabel';
import Textarea from '@/components/Inputs/Textarea';
import { router, useForm } from '@inertiajs/react';
import { Package } from 'lucide-react';
import { useEffect } from 'react';
import Swal from 'sweetalert2';

interface StockFormProps {
    onClose: () => void;
    onSuccess: () => void;
    product?: {
        id: number;
        sku: string;
        name: string;
        category: string;
        price: string;
        stock: string;
        notes: string;
        store_id: string;
    };
    location?: {
        location_name: string;
    } | null;
    mode?: 'create' | 'edit' | 'stockEdit';
}
export default function StockForm({ onClose, onSuccess, product, locations, mode = 'create' }: StockFormProps) {
    const { data, setData, post, put, processing, errors, reset } = useForm({
        sku: product?.sku ?? '',
        name: product?.name ?? '',
        category: product?.category ?? '',
        price: product?.price ?? '',
        stock: product?.stock ?? '',
        notes: product?.notes ?? '',
        store_id: product?.store_id ?? '',
        location: locations?.location_name ?? '',
        transactionType: 'in', // ค่าเริ่มต้น = รับเข้า
    });


    useEffect(() => {
        if (product) {
            setData({
                sku: product.sku || '',
                name: product.name || '',
                category: product.category || '',
                price: product.price || '',
                stock: '',
                notes: '',
                store_id: product.store_id || '',
                location: locations?.location_name || '',
                transactionType: 'in',
            });
        }
    }, [product, locations]);

    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        customClass: { popup: 'custom-swal' },
        didOpen: (toast) => {
            toast.onmouseenter = Swal.stopTimer;
            toast.onmouseleave = Swal.resumeTimer;
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (mode === 'create') {
            router.post(route('products.store'), data, {
                onSuccess: () => {
                    Toast.fire({ icon: 'success', title: 'บันทึกสินค้าเรียบร้อยแล้ว' });
                    onSuccess();
                    reset();
                },
                onError: () => {
                    Toast.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' });
                },
                preserveScroll: true,
            });
        } else if (mode === 'stockEdit' && product) {
            router.put(route('products.update', product.id), data, {
                onSuccess: () => {
                    Toast.fire({ icon: 'success', title: 'อัปเดตสินค้าเรียบร้อยแล้ว' });
                    onSuccess();
                },
                onError: () => {
                    Toast.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' });
                },
                preserveScroll: true,
            });
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 font-anuphan">
                {/* Product Information Section */}
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <h3 className="mb-4 flex items-center text-lg font-semibold text-gray-800">
                        <Package className="mr-2 h-5 w-5 text-green-600" />
                        ข้อมูลสินค้า
                    </h3>

                    <div className="space-y-3">
                        <div className="flex items-center">
                            <span className="min-w-[80px] font-medium text-gray-700">ชื่อสินค้า :</span>
                            <span className="ml-2 text-gray-900">{data.name}</span>
                        </div>

                        <div className="flex items-center">
                            <span className="min-w-[80px] font-medium text-gray-700">สถานที่ :</span>
                            <span className="ml-2 text-gray-900">{product?.location?.location_name ? product?.location?.location_name : '-'}</span>
                        </div>

                        <div className="flex items-center">
                            <span className="min-w-[80px] font-medium text-gray-700">ราคา :</span>
                            <span className="ml-2 text-gray-900">{data.price} บาท</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <label className="flex cursor-pointer items-center gap-2">
                        <input
                            type="radio"
                            name="transactionType"
                            value="in"
                            checked={data.transactionType === 'in'}
                            onChange={(e) => setData('transactionType', e.target.value)}
                            className="text-green-600 focus:ring-green-500"
                        />
                        <span className="text-gray-700">รับเข้า</span>
                    </label>

                    <label className="flex cursor-pointer items-center gap-2">
                        <input
                            type="radio"
                            name="transactionType"
                            value="out"
                            checked={data.transactionType === 'out'}
                            onChange={(e) => setData('transactionType', e.target.value)}
                            className="text-red-600 focus:ring-red-500"
                        />
                        <span className="text-gray-700">จ่ายออก</span>
                    </label>
                </div>
                {/* Stock Input (Conditional) */}
                {mode === 'stockEdit' && (
                    <InputLabel
                        label="จำนวน"
                        placeholder="กรอกจำนวนสินค้า"
                        name="stock"
                        value={data.stock}
                        onChange={(e) => setData('stock', e.target.value)}
                        required={true}
                        error={errors.stock}
                        disabled={processing}
                        type="number"
                        className="font-anuphan"
                    />
                )}

                {/* Notes Textarea */}
                <Textarea
                    label="รายละเอียด"
                    placeholder="เพิ่มรายละเอียดเกี่ยวกับการเพิ่ม/ลดสินค้า..."
                    name="notes"
                    value={data.notes}
                    onChange={(e) => setData('notes', e.target.value)}
                    error={errors.notes}
                    disabled={processing}
                    className="font-anuphan"
                    required={true}
                    rows={3}
                />
            </div>

            <hr className="my-8 border-gray-200" />

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 font-anuphan">
                <Button
                    type="button"
                    variant="secondary"
                    onClick={onClose}
                    className="rounded-lg border border-gray-300 px-5 py-2.5 transition-colors hover:bg-gray-50"
                >
                    ยกเลิก
                </Button>
                <Button
                    type="submit"
                    variant="primary"
                    disabled={processing}
                    className="rounded-lg bg-green-600 px-5 py-2.5 text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                >
                    {processing ? (
                        <span className="flex items-center">
                            <svg
                                className="mr-2 -ml-1 h-4 w-4 animate-spin text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                            </svg>
                            กำลังประมวลผล...
                        </span>
                    ) : mode === 'create' ? (
                        'บันทึก'
                    ) : (
                        'อัปเดต'
                    )}
                </Button>
            </div>
        </form>
    );
}
