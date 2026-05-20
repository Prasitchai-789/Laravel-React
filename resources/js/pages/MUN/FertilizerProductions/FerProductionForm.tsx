// @ts-nocheck
import Button from '@/components/Buttons/Button';
import InputLabel from '@/components/Inputs/InputLabel';
import Select from '@/components/Inputs/Select';
import { router, useForm } from '@inertiajs/react';
import dayjs from 'dayjs';
import 'dayjs/locale/th';
import { Calendar, Clock, Factory, Leaf, Moon, Package, Sun, Target, TrendingUp, Users, Zap } from 'lucide-react';
import { useState } from 'react';
import Swal from 'sweetalert2';

interface Line {
    id: number;
    name: string;
}

interface Production {
    id: number;
    date: string;
    line_id: number;
    shift: string;
    product_qty: number;
    target_qty: number;
}

interface Labor {
    id: number;
    production_id: number;
    workers?: number | string;
    hours: number;
    ot_hours: number;
    labor_cost: number;
}

interface Energy {
    production_id: number;
    type: string;
    quantity: number | string;
    price: number | string;
    total: number | string;
    number_kwh?: number | string;
}

interface ProductionFormData {
    date: string;
    shift: string;
    line_id: number | string;
    product_qty: number | string;
    target_qty: number | string;
    workers?: number;
    energies?: number;
    hours?: number;
    ot_hours?: number;
    electricity_kwh?: number;
    palm_fiber?: number;
    number_kwh?: number;
}

interface FerProductionFormProps {
    mode?: 'create' | 'edit';
    production?: Production;
    onClose: () => void;
    onSuccess?: () => void;
    lines: Line[];
    labors?: Labor[];
    energies?: Energy[];
}

export default function FerProductionForm({ mode, production, onClose, onSuccess, lines, labors, energies }: FerProductionFormProps) {
    const { data, setData, reset, processing } = useForm<ProductionFormData>({
        date: production?.date ? dayjs(production.date).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
        shift: production?.shift || '',
        line_id: production?.line_id || '',
        product_qty: production?.product_qty || '',
        target_qty: production?.target_qty || '',
        workers: production?.labors?.find((l) => l.production_id === production?.id)?.workers || '',
        hours: production?.labors?.find((l) => l.production_id === production?.id)?.hours || '',
        ot_hours: production?.labors?.find((l) => l.production_id === production?.id)?.ot_hours || '',
        number_kwh: production?.energies?.find((e) => e.production_id === production?.id)?.number_kwh || '',
        palm_fiber: production?.energies?.find((e) => e.production_id === production?.id)?.cost || '',
    });

    const [formErrors, setFormErrors] = useState<Partial<Record<string, string>>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setData(name as keyof ProductionFormData, value);
        if (formErrors[name]) {
            setFormErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };
    const validateForm = () => {
        const newErrors: Partial<Record<string, string>> = {};
        if (!data.date) newErrors.date = 'กรุณาระบุวันที่';
        if (!data.shift) newErrors.shift = 'กรุณาเลือกกะทำงาน';
        if (!data.line_id) newErrors.line_id = 'กรุณาเลือกไลน์การผลิต';
        if (!data.product_qty || parseFloat(data.product_qty as string) < 0) newErrors.product_qty = 'กรุณาระบุจำนวนผลิตภัณฑ์ที่ถูกต้อง';
        if (!data.target_qty || parseFloat(data.target_qty as string) < 0) newErrors.target_qty = 'กรุณาระบุจำนวนเป้าหมายที่ถูกต้อง';
        if (!data.workers) newErrors.workers = 'กรุณาระบุจํานวนพนักงาน';
        if (!data.hours) newErrors.hours = 'กรุณาระบุจํานวนชั่วโมง';
        if (!data.ot_hours) newErrors.ot_hours = 'กรุณาระบุจํานวนชั่วโมง Overtime';
        if (!data.number_kwh) newErrors.number_kwh = 'กรุณาระบุจํานวนไฟฟ้า (kWh)';
        if (!data.palm_fiber) newErrors.palm_fiber = 'กรุณาระบุจํานวนกะลาปาล์ม (kg)';

        setFormErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSubmitting(true);

        const payload = {
            date: data.date,
            shift: data.shift,
            line_id: data.line_id,
            product_qty: parseFloat(data.product_qty as string),
            target_qty: parseFloat(data.target_qty as string),
            workers: data.workers,
            hours: data.hours,
            ot_hours: data.ot_hours,
            number_kwh: data.number_kwh,
            palm_fiber: data.palm_fiber,
        };

        if (mode === 'create') {
            router.post(route('fertilizer.productions.store'), payload, {
                onSuccess: () => {
                    Swal.fire({
                        icon: 'success',
                        title: 'สร้างการผลิตเรียบร้อยแล้ว',
                        toast: true,
                        position: 'top-end',
                        showConfirmButton: false,
                        timer: 3000,
                        timerProgressBar: true,
                    });
                    reset();
                    onClose?.();
                    onSuccess?.();
                },
                onError: (errors) => {
                    console.error(errors);
                    Swal.fire({
                        icon: 'error',
                        title: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง',
                        toast: true,
                        position: 'top-end',
                        showConfirmButton: false,
                        timer: 3000,
                        timerProgressBar: true,
                    });
                    setFormErrors(errors);
                },
                onFinish: () => setIsSubmitting(false),
            });
        } else if (mode === 'edit' && production?.id) {
            router.put(route('fertilizer.productions.update', production.id), payload, {
                onSuccess: (page) => {
                    Swal.fire({
                        icon: 'success',
                        title: page.props?.flash?.message || 'อัปเดตการผลิตเรียบร้อยแล้ว',
                        toast: true,
                        position: 'top-end',
                        showConfirmButton: false,
                        timer: 3000,
                        timerProgressBar: true,
                    });
                    reset();
                    onClose?.();
                    onSuccess?.();
                },
                onError: (errors) => {
                    console.error(errors);
                    Swal.fire({
                        icon: 'error',
                        title: 'เกิดข้อผิดพลาดในการอัปเดต กรุณาลองใหม่อีกครั้ง',
                        toast: true,
                        position: 'top-end',
                        showConfirmButton: false,
                        timer: 3000,
                        timerProgressBar: true,
                    });
                    setFormErrors(errors);
                },
                onFinish: () => setIsSubmitting(false),
            });
        }
    };

    const achievementRate =
        data.target_qty && data.product_qty && parseFloat(data.target_qty as string) > 0
            ? ((parseFloat(data.product_qty as string) / parseFloat(data.target_qty as string)) * 100).toFixed(2)
            : null;

    const linesOptions = [
        { value: '', label: '-- เลือกไลน์การผลิต --', disabled: true },
        ...lines.map((line) => ({ value: line.id, label: line.name })),
    ];

    const shiftOptions = [
        { value: '', label: '-- เลือกกะทำงาน --', disabled: true },
        { value: 'กลางวัน', label: '🌞 กลางวัน' },
        { value: 'กลางคืน', label: '🌙 กลางคืน' },
    ];

    const getAchievementColor = (rate: string | null) => {
        if (!rate) return 'text-gray-600';
        const numericRate = parseFloat(rate);
        if (numericRate >= 100) return 'text-green-600';
        if (numericRate >= 80) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getAchievementBgColor = (rate: string | null) => {
        if (!rate) return 'bg-gray-100';
        const numericRate = parseFloat(rate);
        if (numericRate >= 100) return 'bg-green-50 border-green-200';
        if (numericRate >= 80) return 'bg-yellow-50 border-yellow-200';
        return 'bg-red-50 border-red-200';
    };

    const getShiftIcon = (shift: string) => {
        return shift === 'กลางวัน' ? <Sun size={20} className="text-yellow-500" /> : <Moon size={20} className="text-blue-500" />;
    };

    return (
        <div className="font-anuphan">
            {/* Header */}
            <div className="mb-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white shadow-lg">
                <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-white/20 p-2 backdrop-blur-sm">
                        <Factory size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">{mode === 'create' ? 'เพิ่มข้อมูลการผลิตใหม่' : 'แก้ไขข้อมูลการผลิต'}</h2>
                        <p className="text-green-100">กรอกข้อมูลการผลิตปุ๋ยครบถ้วนเพื่อบันทึกลงระบบ</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* ข้อมูลพื้นฐาน */}
                <div className="rounded-2xl border border-green-200 bg-white shadow-sm">
                    <div className="rounded-t-2xl bg-gradient-to-r from-green-50 to-emerald-50 p-5">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-green-100 p-2">
                                <Calendar className="text-green-600" size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-green-800">ข้อมูลพื้นฐานการผลิต</h3>
                                <p className="text-sm text-green-600">กรอกข้อมูลพื้นฐานของการผลิต</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div className="space-y-4">
                                <InputLabel
                                    label="วันที่ผลิต"
                                    name="date"
                                    value={data.date}
                                    onChange={handleChange}
                                    error={formErrors.date}
                                    disabled={processing || isSubmitting}
                                    type="date"
                                    icon={<Calendar size={18} className="text-gray-400" />}
                                />
                                <Select
                                    label="กะทำงาน"
                                    name="shift"
                                    value={data.shift}
                                    onChange={handleChange}
                                    options={shiftOptions}
                                    error={formErrors.shift}
                                    disabled={processing || isSubmitting}
                                    icon={data.shift ? getShiftIcon(data.shift) : <Clock size={18} className="text-gray-400" />}
                                />
                                <Select
                                    label="ไลน์การผลิต"
                                    name="line_id"
                                    value={data.line_id}
                                    onChange={handleChange}
                                    options={linesOptions}
                                    error={formErrors.line_id}
                                    disabled={processing || isSubmitting}
                                    type="text"
                                    icon={<Factory size={18} className="text-gray-400" />}
                                />
                            </div>
                            <div className="space-y-4">
                                <InputLabel
                                    label="เป้าหมายการผลิต (กระสอบ)"
                                    placeholder="0.00"
                                    name="target_qty"
                                    value={data.target_qty ? Number(data.target_qty).toLocaleString('th-TH', { maximumFractionDigits: 2 }) : ''}
                                    onChange={(e) => {
                                        const rawValue = e.target.value.replace(/,/g, ''); // ลบ comma ออก
                                        setData('target_qty', rawValue);
                                    }}
                                    error={formErrors.target_qty}
                                    disabled={processing || isSubmitting}
                                    type="text"
                                />
                                <InputLabel
                                    label="จำนวนที่ผลิตได้ (กระสอบ)"
                                    placeholder="0.00"
                                    type="text"
                                    name="product_qty"
                                    value={data.product_qty ? Number(data.product_qty).toLocaleString('th-TH', { maximumFractionDigits: 2 }) : ''}
                                    onChange={(e) => {
                                        const rawValue = e.target.value.replace(/,/g, ''); // ลบ comma ออก
                                        setData('product_qty', rawValue);
                                    }}
                                    error={formErrors.product_qty}
                                    disabled={processing || isSubmitting}
                                />
                                {achievementRate && (
                                    <div className={`rounded-xl border-2 p-4 ${getAchievementBgColor(achievementRate)}`}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <TrendingUp size={20} className={getAchievementColor(achievementRate)} />
                                                <span className="text-sm font-medium text-gray-700">อัตราการบรรลุเป้าหมาย:</span>
                                            </div>
                                            <span className={`text-xl font-bold ${getAchievementColor(achievementRate)}`}>{achievementRate}%</span>
                                        </div>
                                        <div className="mt-3 h-3 w-full rounded-full bg-gray-200">
                                            <div
                                                className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                                                style={{ width: `${Math.min(parseFloat(achievementRate), 100)}%` }}
                                            ></div>
                                        </div>
                                        <div className="mt-2 flex justify-between text-xs text-gray-500">
                                            <span>0%</span>
                                            <span>100%</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ข้อมูลแรงงาน */}
                <div className="rounded-2xl border border-blue-200 bg-white shadow-sm">
                    <div className="rounded-t-2xl bg-gradient-to-r from-blue-50 to-cyan-50 p-5">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-blue-100 p-2">
                                <Users className="text-blue-600" size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-blue-800">ข้อมูลแรงงานและเวลา</h3>
                                <p className="text-sm text-blue-600">กรอกข้อมูลเกี่ยวกับพนักงานและเวลาการทำงาน</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                            <InputLabel
                                label="จำนวนพนักงาน"
                                placeholder="0"
                                name="workers"
                                value={data.workers?.toString() ?? ''}
                                onChange={handleChange}
                                error={formErrors.workers}
                                disabled={processing || isSubmitting}
                                type="number"
                                min={0}
                                icon={<Users size={18} className="text-gray-400" />}
                            />
                            <InputLabel
                                label="เวลาที่ใช้ในการผลิต (ชั่วโมง)"
                                placeholder="0.00"
                                name="hours"
                                value={data.hours}
                                onChange={handleChange}
                                error={formErrors.hours}
                                disabled={processing || isSubmitting}
                                type="number"
                                min={0}
                                icon={<Clock size={18} className="text-gray-400" />}
                            />
                            <InputLabel
                                label="ทำงานล่วงเวลา (ชั่วโมง)"
                                placeholder="0.00"
                                name="ot_hours"
                                value={data.ot_hours}
                                onChange={handleChange}
                                error={formErrors.ot_hours}
                                disabled={processing || isSubmitting}
                                type="number"
                                min={0}
                                icon={<Zap size={18} className="text-gray-400" />}
                            />
                        </div>
                    </div>
                </div>

                {/* ข้อมูลพลังงานและวัตถุดิบ */}
                <div className="rounded-2xl border border-amber-200 bg-white shadow-sm">
                    <div className="rounded-t-2xl bg-gradient-to-r from-amber-50 to-orange-50 p-5">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-amber-100 p-2">
                                <Leaf className="text-amber-600" size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-amber-800">ข้อมูลพลังงานและวัตถุดิบ</h3>
                                <p className="text-sm text-amber-600">กรอกข้อมูลเกี่ยวกับพลังงานและวัตถุดิบที่ใช้</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <InputLabel
                                label="เลขมิเตอร์ไฟฟ้า (กิโลวัตต์)"
                                placeholder="0.00"
                                name="number_kwh"
                                value={data.number_kwh ? Number(data.number_kwh).toLocaleString('th-TH', { maximumFractionDigits: 2 }) : ''}
                                onChange={(e) => {
                                    const rawValue = e.target.value.replace(/,/g, ''); // ลบ comma ออก
                                    setData('number_kwh', rawValue);
                                }}
                                error={formErrors.number_kwh}
                                disabled={processing || isSubmitting}
                                type="text"
                                icon={<Zap size={18} className="text-gray-400" />}
                            />
                            <InputLabel
                                label="กะลาปาล์ม (กิโลกรัม)"
                                placeholder="0.00"
                                name="palm_fiber"
                                value={data.palm_fiber ? Number(data.palm_fiber).toLocaleString('th-TH', { maximumFractionDigits: 2 }) : ''}
                                onChange={(e) => {
                                    const rawValue = e.target.value.replace(/,/g, ''); // ลบ comma ออก
                                    setData('palm_fiber', rawValue);
                                }}
                                error={formErrors.palm_fiber}
                                disabled={processing || isSubmitting}
                                type="text"
                                icon={<Leaf size={18} className="text-gray-400" />}
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-sm text-gray-600">
                            {mode === 'create' ? 'ตรวจสอบข้อมูลให้ครบถ้วนก่อนบันทึก' : 'ตรวจสอบข้อมูลก่อนอัปเดต'}
                        </div>
                        <div className="flex gap-3">
                            <Button type="button" variant="gray" onClick={onClose} disabled={isSubmitting} className="min-w-[100px]">
                                ยกเลิก
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                disabled={isSubmitting}
                                loading={isSubmitting}
                                className="min-w-[140px] bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                            >
                                {mode === 'create' ? 'บันทึกข้อมูล' : 'อัปเดตข้อมูล'}
                            </Button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
