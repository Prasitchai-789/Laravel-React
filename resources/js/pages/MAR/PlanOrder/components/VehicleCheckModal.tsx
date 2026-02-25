import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { PlanOrder } from './PlanOrderTable';
import axios from 'axios';
import Swal from 'sweetalert2';
import { FileText, Loader2, Save, ClipboardCheck } from 'lucide-react';
import { Check } from 'lucide-react';

interface VehicleCheckModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: any | null;
    onGenerateCAR: (order: any) => void;
    autoDownload?: boolean;
}

import { router, usePage } from '@inertiajs/react';

export default function VehicleCheckModal({
    isOpen,
    onClose,
    order,
    onGenerateCAR,
    autoDownload = true,
}: VehicleCheckModalProps) {
    const { auth } = usePage<any>().props;
    const currentUserName = auth?.employee_name || auth?.user?.name || '';

    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [form, setForm] = useState({
        is_clean: false,
        is_covered: false,
        is_no_smell: false,
        is_doc_valid: false,
        remark: '',
        inspector_name: '',
    });

    // ดึงข้อมูลเดิมจาก API ถ้ามี (ใช้ SOP_ID อ้างอิง)
    useEffect(() => {
        if (isOpen && order) {
            const fetchInspection = async () => {
                setIsLoading(true);
                const rawSopId = order.rawData?.sopId || order.id || order.orderNumber;
                const sopId = String(rawSopId);
                try {
                    const res = await axios.get(`/mar/vehicle-inspections/${sopId}`);
                    if (res.data.success && res.data.data) {
                        const data = res.data.data;
                        setForm({
                            is_clean: data.is_clean ?? false,
                            is_covered: data.is_covered ?? false,
                            is_no_smell: data.is_no_smell ?? false,
                            is_doc_valid: data.is_doc_valid ?? false,
                            remark: data.remark || '',
                            inspector_name: data.inspector_name || currentUserName, // ใช้ชื่อจริงถ้าใน DB ไม่มี
                        });
                    } else {
                        // ไม่พบข้อมูล ตั้งค่า Default พร้อมชื่อคนล็อกอิน
                        setForm({
                            is_clean: false,
                            is_covered: false,
                            is_no_smell: false,
                            is_doc_valid: false,
                            remark: '',
                            inspector_name: currentUserName,
                        });
                    }
                } catch (error) {
                    console.error('Failed to fetch vehicle inspection', error);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchInspection();
        }
    }, [isOpen, order]);

    const handleChange = (field: string, value: any) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleSaveAndGenerate = async () => {
        if (!order) return;
        setIsSaving(true);

        // มั่นใจว่าเป็น String และเลือกค่าที่ถูกต้องที่สุด
        const rawSopId = order.rawData?.sopId || order.id || order.orderNumber;
        const sopId = String(rawSopId);

        try {
            const res = await axios.post('/mar/vehicle-inspections', {
                sop_id: sopId,
                ...form,
            });

            if (res.data.success) {
                // เซฟเสร็จแล้ว เรียก Function สร้าง CAR PDF (ถ้าอนุญาตให้ auto download)
                if (autoDownload) {
                    onGenerateCAR(order);
                }
                onClose();
            }
        } catch (error: any) {
            console.error('Error saving vehicle inspection:', error);

            let errorMessage = 'ไม่สามารถบันทึกข้อมูลตรวจสภาพรถได้';
            if (error.response?.data?.errors) {
                // ดึงรายการ error มาแสดงถ้ามี
                const errors = error.response.data.errors;
                errorMessage = Object.values(errors).flat().join('\n');
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            }

            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด (422)',
                text: errorMessage,
            });
        } finally {
            setIsSaving(false);
        }
    };

    if (!order) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md font-anuphut">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-purple-600" />
                        แบบฟอร์มตรวจสอบสภาพรถ (CAR)
                    </DialogTitle>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex justify-center items-center py-10">
                        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                        <span className="ml-2">กำลังโหลดข้อมูล...</span>
                    </div>
                ) : (
                    <div className="space-y-6 pt-4">
                        <div className="grid gap-2 text-sm bg-gray-50 p-3 rounded-lg border">
                            <div className="flex justify-between">
                                <span className="text-gray-500">หมายเลขอ้างอิง:</span>
                                <span className="font-medium">{order.orderNumber || order.coaNumber || order.coa_no || order.id || '-'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">ทะเบียนรถ:</span>
                                <span className="font-medium text-blue-600">{order.licensePlate || order.license_plate || '-'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">ชื่อคนขับ:</span>
                                <span className="font-medium">{order.driverName || order.driver_name || '-'}</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="font-semibold text-gray-900 border-b pb-2">รายการตรวจสอบ</h4>

                            {[
                                { id: 'is_clean', label: '1. สภาพรถสะอาด ไม่มีคราบสกปรก' },
                                { id: 'is_covered', label: '2. มีผ้าใบคลุมมิดชิด (ถ้ามีกระบะ)' },
                                { id: 'is_no_smell', label: '3. ไม่มีกลิ่นเหม็น หรือกลิ่นแปลกปลอม' },
                                { id: 'is_doc_valid', label: '4. เอกสารประจำรถและใบขับขี่ถูกต้องตรงกัน' },
                            ].map((item) => (
                                <div key={item.id} className="flex flex-col gap-2 p-3 bg-white rounded-lg border shadow-sm">
                                    <span className="text-sm font-medium text-gray-700">{item.label}</span>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant={form[item.id as keyof typeof form] === true ? 'default' : 'outline'}
                                            className={`flex-1 transition-all ${form[item.id as keyof typeof form] === true ? 'bg-green-600 hover:bg-green-700 text-white' : 'hover:bg-green-50 hover:text-green-600'}`}
                                            onClick={() => handleChange(item.id, true)}
                                        >
                                            ใช่
                                        </Button>
                                        <Button
                                            type="button"
                                            variant={form[item.id as keyof typeof form] === false ? 'default' : 'outline'}
                                            className={`flex-1 transition-all ${form[item.id as keyof typeof form] === false ? 'bg-red-600 hover:bg-red-700 text-white' : 'hover:bg-red-50 hover:text-red-600'}`}
                                            onClick={() => handleChange(item.id, false)}
                                        >
                                            ไม่ใช่
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold">ชื่อผู้ตรวจสอบ</label>
                            <Input
                                placeholder="ระบุชื่อผู้ตรวจสอบรถ..."
                                value={form.inspector_name}
                                onChange={(e) => handleChange('inspector_name', e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold">หมายเหตุ (ถ้ามี)</label>
                            <Textarea
                                placeholder="รายละเอียดเพิ่มเติม..."
                                value={form.remark}
                                onChange={(e) => handleChange('remark', e.target.value)}
                                rows={2}
                            />
                        </div>
                    </div>
                )}

                <DialogFooter className="mt-6 border-t pt-4">
                    <Button variant="outline" onClick={onClose} disabled={isSaving}>ยกเลิก</Button>
                    <Button
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        onClick={handleSaveAndGenerate}
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <ClipboardCheck className="mr-2 h-4 w-4" />
                        )}
                        {autoDownload ? 'บันทึกและออกเอกสาร CAR' : 'บันทึกข้อมูลตรวจสภาพรถ'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
