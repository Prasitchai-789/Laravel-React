import Button from '@/components/Buttons/Button';
import InputLabel from '@/components/Inputs/InputLabel';
import Select from '@/components/Inputs/Select';
import Textarea from '@/components/Inputs/Textarea';
import { router, useForm } from '@inertiajs/react';
import Swal from 'sweetalert2';
import { useEffect } from 'react';

interface CustomerFormProps {
    onClose: () => void;
    onSuccess: () => void;
    cities: {
        ProvinceID: number;
        ProvinceName: string;
        DistrictID: number;
        DistrictName: string;
        SubDistrictID: number;
        SubDistrictName: string;
    }[];
    customer?: {
        id: number;
        name: string;
        id_card?: string;
        phone?: string;
        address?: string;
        province?: string;
        district?: string;
        subdistrict?: string;
        notes?: string;
        cityProvince?: { ProvinceID: number; ProvinceName: string };
        cityDistrict?: { DistrictID: number; DistrictName: string };
        citySubdistrict?: { SubDistrictID: number; SubDistrictName: string };
    } | null;
    mode?: 'create' | 'edit';
}

export default function CustomerForm({ onClose, onSuccess, cities, customer, mode = 'create' }: CustomerFormProps) {
    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: customer?.name || '',
        id_card: customer?.id_card || '',
        phone: customer?.phone || '',
        address: customer?.address || '',
        province: customer?.cityProvince?.ProvinceID?.toString() || customer?.province || '',
        district: customer?.cityDistrict?.DistrictID?.toString() || customer?.district || '',
        subdistrict: customer?.citySubdistrict?.SubDistrictID?.toString() || customer?.subdistrict || '',
        notes: customer?.notes || '',
    });

    // อัปเดตฟอร์มเมื่อ customer เปลี่ยน
    useEffect(() => {
        if (customer) {
            setData({
                name: customer.name || '',
                id_card: customer.id_card || '',
                phone: customer.phone || '',
                address: customer.address || '',
                province: customer.cityProvince?.ProvinceID?.toString() || customer.province || '',
                district: customer.cityDistrict?.DistrictID?.toString() || customer.district || '',
                subdistrict: customer.citySubdistrict?.SubDistrictID?.toString() || customer.subdistrict || '',
                notes: customer.notes || '',
            });
        }
    }, [customer]);

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
            router.post(route('customers.store'), data, {
                onSuccess: () => {
                    Toast.fire({ icon: 'success', title: 'บันทึกลูกค้าเรียบร้อยแล้ว' });
                    onSuccess();
                    reset();
                },
                onError: () => {
                    Toast.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' });
                },
                preserveScroll: true,
            });
        } else if (mode === 'edit' && customer) {
            router.put(route('customers.update', customer.id), data, {
                onSuccess: () => {
                    Toast.fire({ icon: 'success', title: 'อัปเดตลูกค้าเรียบร้อยแล้ว' });
                    onSuccess();
                },
                onError: () => {
                    Toast.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' });
                },
                preserveScroll: true,
            });
        }
    };

    // สร้าง options ของจังหวัด, อำเภอ, ตำบล แบบไม่ซ้ำ
    const uniqueProvinces = Array.from(new Map(cities.map((c) => [c.ProvinceID, c])).values());
    const ProvinceOptions = [
        { value: '', label: 'เลือกจังหวัด ...', disabled: true },
        ...uniqueProvinces.map((p) => ({ value: p.ProvinceID.toString(), label: p.ProvinceName })),
    ];

    const filteredDistricts = cities.filter(c => Number(c.ProvinceID) === Number(data.province));
    const uniqueDistricts = Array.from(new Map(filteredDistricts.map((d) => [d.DistrictID, d])).values());
    const DistrictOptions = [
        { value: '', label: 'เลือกอำเภอ ...', disabled: true },
        ...uniqueDistricts.map((d) => ({ value: d.DistrictID.toString(), label: d.DistrictName })),
    ];

    const filteredSubdistricts = cities.filter(c => Number(c.DistrictID) === Number(data.district));
    const uniqueSubdistricts = Array.from(new Map(filteredSubdistricts.map((s) => [s.SubDistrictID, s])).values());
    const SubdistrictOptions = [
        { value: '', label: 'เลือกตำบล ...', disabled: true },
        ...uniqueSubdistricts.map((s) => ({ value: s.SubDistrictID.toString(), label: s.SubDistrictName })),
    ];

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <InputLabel
                label="ชื่อลูกค้า"
                placeholder="ชื่อลูกค้า"
                name="name"
                value={data.name}
                onChange={(e) => setData('name', e.target.value)}
                required
                error={errors.name}
                disabled={processing}
                type="text"
                className="font-anuphan"
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <InputLabel
                    label="เลขบัตรประชาชน"
                    placeholder="(ไม่ต้องเว้นวรรคหรือใส่ขีดเครื่องหมาย)"
                    name="id_card"
                    value={data.id_card}
                    onChange={(e) => setData('id_card', e.target.value)}
                    error={errors.id_card}
                    disabled={processing}
                    type="text"
                    className="font-anuphan"
                />
                <InputLabel
                    label="เบอร์โทร"
                    placeholder="0123456789"
                    name="phone"
                    value={data.phone}
                    onChange={(e) => setData('phone', e.target.value)}
                    error={errors.phone}
                    disabled={processing}
                    type="text"
                    className="font-anuphan"
                />
            </div>

            <Textarea
                label="ที่อยู่"
                placeholder=""
                name="address"
                value={data.address}
                onChange={(e) => setData('address', e.target.value)}
                error={errors.address}
                disabled={processing}
                className="font-anuphan"
                rows={2}
            />

            <Select
                label="จังหวัด"
                value={data.province}
                onChange={(e) => {
                    setData('province', e.target.value);
                    setData('district', '');
                    setData('subdistrict', '');
                }}
                options={ProvinceOptions}
                className='font-anuphan'
                error={errors.province}
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Select
                    label="อำเภอ/เขต"
                    value={data.district}
                    onChange={(e) => {
                        setData('district', e.target.value);
                        setData('subdistrict', '');
                    }}
                    options={DistrictOptions}
                    disabled={!data.province}
                    className='font-anuphan'
                    error={errors.district}
                />
                <Select
                    label="ตำบล/แขวง"
                    value={data.subdistrict}
                    onChange={(e) => setData('subdistrict', e.target.value)}
                    options={SubdistrictOptions}
                    disabled={!data.district}
                    className='font-anuphan'
                    error={errors.subdistrict}
                />
            </div>

            <Textarea
                label="หมายเหตุ"
                placeholder="หมายเหตุ"
                name="notes"
                value={data.notes}
                onChange={(e) => setData('notes', e.target.value)}
                error={errors.notes}
                disabled={processing}
                className="font-anuphan"
                rows={2}
            />

            <div className="flex justify-end gap-2 pt-4 font-anuphan">
                <Button type="button" variant="secondary" onClick={onClose}>
                    ยกเลิก
                </Button>
                <Button type="submit" variant="primary" disabled={processing}>
                    {mode === 'create' ? 'บันทึก' : 'อัปเดต'}
                </Button>
            </div>
        </form>
    );
}
