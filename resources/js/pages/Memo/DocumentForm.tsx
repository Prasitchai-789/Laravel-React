import Button from '@/components/Buttons/Button';
import InputLabel from '@/components/Inputs/InputLabel';
import Select from '@/components/Inputs/Select';
import Textarea from '@/components/Inputs/Textarea';
import { router, useForm } from '@inertiajs/react';
import dayjs from 'dayjs';
import 'dayjs/locale/th';
import { useState } from 'react';
import Swal from 'sweetalert2';

interface PDocumentFormData {
    document_no: string;
    date: string;
    description: string;
    category_id: number;
    amount: string | number;
    status: 'pending' | 'approved' | 'rejected';
    attachment_path: File | null;
    winspeed_ref_id: string | number;
}

interface DocumentFormProps {
    categories?: any[];
    mode?: 'create' | 'edit';
    document?: Partial<PDocumentFormData> & { id?: number };
    onClose: () => void;
    onSuccess?: () => void;
}

export default function DocumentForm({ categories, onSuccess, onClose, mode = 'create', document }: DocumentFormProps) {
    const { data, setData, reset, processing, post, errors } = useForm<PDocumentFormData>({
        document_no: document?.document_no || '',
        date: document?.date ? dayjs(document.date).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
        description: document?.description || '',
        category_id: document?.category_id || '',
        amount: document?.amount || '',
        status: (document?.status as 'pending' | 'approved' | 'rejected') || 'pending',
        attachment_path: null,
        winspeed_ref_id: document?.winspeed_ref_id || '',
    });

    const [formErrors, setFormErrors] = useState<Partial<Record<keyof PDocumentFormData, string>>>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const target = e.target as HTMLInputElement;
        const { name, value, files } = target;

        if (files && files.length > 0) {
            setData(name as keyof PDocumentFormData, files[0]);
        } else {
            setData(name as keyof PDocumentFormData, value);
        }

        if (formErrors[name]) {
            setFormErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    /** ✅ handleFileChange สำหรับไฟล์ */
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setData('attachment_path', file);

        if (errors.attachment_path) {
            // ลบ error ไฟล์ถ้ามี
            const newErrors = { ...errors };
            delete newErrors.attachment_path;
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Partial<Record<keyof PDocumentFormData, string>> = {};

        if (!data.document_no.trim()) newErrors.document_no = 'กรุณาระบุเลขที่เอกสาร';
        if (!data.date) newErrors.date = 'กรุณาระบุวันที่';
        if (!data.category_id) newErrors.category_id = 'กรุณาเลือกหมวดค่าใช้จ่าย';
        if (!data.amount || parseFloat(data.amount as string) <= 0) {
            newErrors.amount = 'กรุณาระบุจำนวนเงินที่ถูกต้อง';
        }

        setFormErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) {
            Swal.fire({
                icon: 'warning',
                title: 'ข้อมูลไม่ครบถ้วน',
                text: 'กรุณากรอกข้อมูลให้ครบถ้วน',
                toast: true,
                position: 'top-end',
                customClass: {
                    popup: 'custom-swal font-anuphan',
                    title: 'font-anuphan text-red-800',
                    htmlContainer: 'font-anuphan text-red-500',
                },
                showConfirmButton: false,
                timer: 3000,
            });
            return;
        }

        const formData = new FormData();
        formData.append('document_no', data.document_no);
        formData.append('date', data.date);
        formData.append('category_id', data.category_id || '');
        formData.append('amount', data.amount ? String(data.amount) : '0');
        formData.append('status', data.status || '');
        formData.append('description', data.description || '');
        formData.append('winspeed_ref_id', data.winspeed_ref_id || '');

        if (data.attachment_path) {
            formData.append('attachment_path', data.attachment_path); // ต้องตรงกับชื่อ field ใน Laravel
        }

        if (mode === 'create') {
            router.post(route('memo.documents.store'), formData, {
                forceFormData: true,
                onSuccess: () => {
                    Swal.fire({
                        icon: 'success',
                        title: mode === 'create' ? 'บันทึกเอกสารเรียบร้อยแล้ว' : 'อัปเดตเอกสารเรียบร้อยแล้ว',
                        toast: true,
                        position: 'top-end',
                        showConfirmButton: false,
                        timer: 3000,
                        customClass: {
                            popup: 'custom-swal font-anuphan',
                            title: 'font-anuphan text-red-800',
                            htmlContainer: 'font-anuphan text-red-500',
                        },
                    });
                    reset();
                    onClose?.();
                    onSuccess?.();
                },
                onError: (errors) => {
                    Swal.fire({
                        icon: 'error',
                        title: 'เกิดข้อผิดพลาด',
                        text: 'กรุณาตรวจสอบข้อมูลอีกครั้ง',
                        toast: true,
                        position: 'top-end',
                        showConfirmButton: false,
                        timer: 3000,
                        customClass: {
                            popup: 'custom-swal font-anuphan',
                            title: 'font-anuphan text-red-800',
                            htmlContainer: 'font-anuphan text-red-500',
                        },
                    });
                },
            });
        } else if (mode === 'edit' && document?.id) {
            router.post(
                route('memo.documents.update', document.id),
                {
                    _method: 'put', // ใช้ method spoofing เพราะ FormData ไม่ส่ง put โดยตรงได้
                    ...Object.fromEntries(formData),
                },{
                    forceFormData: true,
                    onSuccess: () => {
                        Swal.fire({
                            icon: 'success',
                            title: mode === 'create' ? 'บันทึกเอกสารเรียบร้อยแล้ว' : 'อัปเดตเอกสารเรียบร้อยแล้ว',
                            toast: true,
                            position: 'top-end',
                            showConfirmButton: false,
                            timer: 3000,
                            customClass: {
                                popup: 'custom-swal font-anuphan',
                                title: 'font-anuphan text-red-800',
                                htmlContainer: 'font-anuphan text-red-500',
                            },
                        });
                        reset();
                        onClose?.();
                        onSuccess?.();
                    },
                    onError: (errors) => {
                        console.error('Form submission errors:', errors);
                        Swal.fire({
                            icon: 'error',
                            title: 'เกิดข้อผิดพลาด',
                            text: 'กรุณาตรวจสอบข้อมูลอีกครั้ง',
                            toast: true,
                            position: 'top-end',
                            showConfirmButton: false,
                            timer: 3000,
                            customClass: {
                                popup: 'custom-swal font-anuphan',
                                title: 'font-anuphan text-red-800',
                                htmlContainer: 'font-anuphan text-red-500',
                            },
                        });
                    },
                },
            );
        }
    };

    const statusOptions = [
        { value: 'pending', label: 'รอดำเนินการ', color: 'text-amber-600' },
        { value: 'approved', label: 'อนุมัติ', color: 'text-green-600' },
        { value: 'rejected', label: 'ไม่อนุมัติ', color: 'text-red-600' },
    ];

    const categoriesOptions = [
        { value: '', label: '-- เลือกหมวด --', disabled: true, hidden: true },
        ...categories.map((cat) => ({
            value: cat.id.toString(),
            label: cat.name,
        })),
    ];

    return (
        <div className="mx-auto max-w-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {/* Document No */}
                    <div className="transform transition-all duration-200 hover:scale-[1.01]">
                        <InputLabel
                            label={
                                <span className="flex items-center gap-1">
                                    <span className="text-lg">📄</span>
                                    เลขที่เอกสาร
                                    <span className="text-red-500">*</span>
                                </span>
                            }
                            name="document_no"
                            value={data.document_no}
                            onChange={handleChange}
                            disabled={processing}
                            error={formErrors.document_no || errors.document_no}
                            type="text"
                            className="font-anuphan transition-all duration-200 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                            placeholder="เช่น ITE680101-01"
                        />
                    </div>

                    {/* Date */}
                    <div className="transform transition-all duration-200 hover:scale-[1.01]">
                        <InputLabel
                            label={
                                <span className="flex items-center gap-1">
                                    <span className="text-lg">📅</span>
                                    วันที่
                                    <span className="text-red-500">*</span>
                                </span>
                            }
                            name="date"
                            value={data.date}
                            onChange={(e) => setData('date', e.target.value)}
                            disabled={processing}
                            error={formErrors.date || errors.date}
                            type="date"
                            className="font-anuphan transition-all duration-200 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* Description */}
                <div className="transform transition-all duration-200 hover:scale-[1.01]">
                    <Textarea
                        label={
                            <span className="flex items-center gap-1">
                                <span className="text-lg">📋</span>
                                รายละเอียด
                            </span>
                        }
                        name="description"
                        value={data.description}
                        onChange={handleChange}
                        disabled={processing}
                        error={errors.description}
                        className="resize-none font-anuphan transition-all duration-200 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                        rows={2}
                        placeholder="อธิบายรายละเอียดของเอกสาร..."
                    />
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {/* Category */}
                    <div className="transform transition-all duration-200 hover:scale-[1.01]">
                        <Select
                            label={
                                <span className="flex items-center gap-1">
                                    <span className="text-lg">📂</span>
                                    หมวดค่าใช้จ่าย
                                    <span className="text-red-500">*</span>
                                </span>
                            }
                            name="category_id"
                            value={data.category_id ?? ''}
                            onChange={handleChange}
                            options={categoriesOptions}
                            disabled={processing}
                            error={formErrors.category_id || errors.category_id}
                            className="font-anuphan transition-all duration-200 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Amount */}
                    <div className="transform transition-all duration-200 hover:scale-[1.01]">
                        <InputLabel
                            label={
                                <span className="flex items-center gap-1">
                                    <span className="text-lg">💰</span>
                                    จำนวนเงิน
                                    <span className="text-red-500">*</span>
                                </span>
                            }
                            name="amount"
                            value={data.amount}
                            onChange={handleChange}
                            disabled={processing}
                            error={formErrors.amount || errors.amount}
                            type="number"
                            className="font-anuphan transition-all duration-200 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {/* Winspeed Reference */}
                    <div className="transform transition-all duration-200 hover:scale-[1.01]">
                        <InputLabel
                            label={
                                <span className="flex items-center gap-1">
                                    <span className="text-lg">🔗</span>
                                    เลขที่อ้างอิง Win Speed
                                </span>
                            }
                            name="winspeed_ref_id"
                            value={data.winspeed_ref_id}
                            onChange={handleChange}
                            disabled={processing}
                            error={errors.winspeed_ref_id}
                            type="text"
                            className="font-anuphan transition-all duration-200 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                            placeholder="เช่น WS-2024-001"
                        />
                    </div>

                    {/* Status */}
                    <div className="transform transition-all duration-200 hover:scale-[1.01]">
                        <Select
                            label={
                                <span className="flex items-center gap-1">
                                    <span className="text-lg">🎯</span>
                                    สถานะ
                                </span>
                            }
                            name="status"
                            value={data.status}
                            onChange={handleChange}
                            options={statusOptions}
                            disabled={processing}
                            error={errors.status}
                            className="font-anuphan transition-all duration-200 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* Attachment */}
                <div className="font-anuphan">
                    <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                        <span className="text-lg">📎</span>
                        ไฟล์แนบ
                    </label>
                    <div className="relative">
                        <input
                            type="file"
                            name="attachment_path"
                            onChange={handleFileChange}
                            className="w-full rounded-lg border border-gray-300 px-3 py-3 transition-all duration-200 file:mr-4 file:rounded-full file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                        />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">รองรับไฟล์ PDF, Word, Excel, รูปภาพ (ขนาดไม่เกิน 10MB)</p>
                    {errors.attachment_path && <p className="mt-1 text-sm text-red-500">{errors.attachment_path}</p>}
                </div>

                {/* Progress Bar */}
                {processing && (
                    <div className="h-2 w-full rounded-full bg-gray-200">
                        <div className="h-2 animate-pulse rounded-full bg-gradient-to-r from-blue-500 to-purple-600"></div>
                    </div>
                )}

                {/* Submit Button */}
                <div className="flex justify-end gap-3 border-t border-gray-200 pt-6 font-anuphan">
                    <Button
                        type="button"
                        variant="gray"
                        onClick={onClose}
                        disabled={processing}
                        className="px-6 py-2.5 transition-all duration-200 hover:scale-105 active:scale-95"
                    >
                        <span className="flex items-center gap-2">
                            <span>❌</span>
                            ยกเลิก
                        </span>
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        disabled={processing}
                        loading={processing}
                        className="px-6 py-2.5 shadow-lg transition-all duration-200 hover:scale-105 hover:from-blue-700 hover:to-purple-700 hover:shadow-xl active:scale-95"
                    >
                        <span className="flex items-center gap-2">
                            {mode === 'create' ? (
                                <>
                                    <span>💾</span>
                                    บันทึกข้อมูล
                                </>
                            ) : (
                                <>
                                    <span>🔄</span>
                                    อัปเดตข้อมูล
                                </>
                            )}
                        </span>
                    </Button>
                </div>
            </form>

            {/* Form Tips */}
            <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4 font-anuphan">
                <h3 className="mb-2 flex items-center gap-2 font-semibold text-blue-800">
                    <span>💡</span>
                    คำแนะนำ
                </h3>
                <ul className="space-y-1 text-sm text-blue-700">
                    <li>• กรุณาตรวจสอบข้อมูลให้ถูกต้องก่อนบันทึก</li>
                    <li>• ไฟล์แนบควรเป็นไฟล์ที่เกี่ยวข้องกับเอกสารเท่านั้น</li>
                    <li>• เลขที่เอกสารควรเป็นไปตามรูปแบบที่กำหนด</li>
                    <li>
                        • ช่องที่มี <span className="text-red-500">*</span> เป็นช่องที่ต้องกรอก
                    </li>
                </ul>
            </div>
        </div>
    );
}
