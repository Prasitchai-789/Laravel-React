import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';

interface VehicleDriver {
    licensePlate: string;
    driverName: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
}

export default function CreatePlanOrderModal({ isOpen, onClose, onSubmit }: Props) {
    const [formData, setFormData] = useState({
        receiveDate: '',
        productName: '',
        loadPlan: '',
        customerCode: '',
        customerName: '',
        destination: '',
        notes: '',
    });

    const [vehicles, setVehicles] = useState<VehicleDriver[]>([
        { licensePlate: '', driverName: '' }
    ]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleVehicleChange = (index: number, field: keyof VehicleDriver, value: string) => {
        const updatedVehicles = [...vehicles];
        updatedVehicles[index][field] = value;
        setVehicles(updatedVehicles);
    };

    const addVehicle = () => {
        setVehicles([...vehicles, { licensePlate: '', driverName: '' }]);
    };

    const removeVehicle = (index: number) => {
        if (vehicles.length > 1) {
            setVehicles(vehicles.filter((_, i) => i !== index));
        }
    };

    const handleSubmit = () => {
        // ตรวจสอบข้อมูลที่จำเป็น
        if (!formData.receiveDate) {
            alert('กรุณาเลือกวันที่รับสินค้า');
            return;
        }
        if (!formData.productName) {
            alert('กรุณาเลือกชื่อสินค้า');
            return;
        }
        if (!formData.loadPlan) {
            alert('กรุณาเลือกแผนการโหลด');
            return;
        }
        if (!formData.customerCode) {
            alert('กรุณากรอกรหัสคู่ค้า');
            return;
        }
        if (!formData.customerName) {
            alert('กรุณากรอกชื่อคู่ค้า');
            return;
        }
        if (!formData.destination) {
            alert('กรุณาเลือกปลายทาง');
            return;
        }

        // รวมข้อมูลทั้งหมดก่อนส่ง
        const submitData = {
            ...formData,
            vehicles: vehicles.filter(v => v.licensePlate || v.driverName),
        };
        onSubmit(submitData);
        
        // Reset form
        setFormData({
            receiveDate: '',
            productName: '',
            loadPlan: '',
            customerCode: '',
            customerName: '',
            destination: '',
            notes: '',
        });
        setVehicles([{ licensePlate: '', driverName: '' }]);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>เพิ่มแผนการขนส่ง</DialogTitle>
                    <DialogDescription>
                        กรอกข้อมูลสำหรับการวางแผนการขนส่งสินค้า
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* ข้อมูลหลัก */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="receiveDate">
                                วันที่รับสินค้า <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="receiveDate"
                                name="receiveDate"
                                type="date"
                                value={formData.receiveDate}
                                onChange={handleInputChange}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="loadPlan">
                                แผนการโหลด <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={formData.loadPlan}
                                onValueChange={(value) => handleSelectChange('loadPlan', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="เลือกแผนการโหลด" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="morning">รอบเช้า (08.00 - 12.00 น.)</SelectItem>
                                    <SelectItem value="afternoon">รอบบ่าย (13.00 - 17.00 น.)</SelectItem>
                                    <SelectItem value="evening">รอบเย็น (18.00 - 22.00 น.)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="productName">
                                ชื่อสินค้า <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={formData.productName}
                                onValueChange={(value) => handleSelectChange('productName', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="เลือกสินค้า" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="cpo">น้ำมันปาล์มดิบ (CPO)</SelectItem>
                                    <SelectItem value="palm-kernel">เมล็ดปาล์ม</SelectItem>
                                    <SelectItem value="fertilizer">ปุ๋ยอินทรีย์</SelectItem>
                                    <SelectItem value="palm-oil">น้ำมันปาล์มบริสุทธิ์</SelectItem>
                                    <SelectItem value="palm-fiber">ใยปาล์ม</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="destination">
                                ปลายทาง <span className="text-red-500">*</span>
                            </Label>
                             <Input
                                id="weight"
                                name="weight"
                                placeholder="น้ำหนัก"
                                value={formData.weight}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="customerCode">
                                รหัสคู่ค้า <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="customerCode"
                                name="customerCode"
                                placeholder="เช่น CUST001"
                                value={formData.customerCode}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="customerName">
                                ชื่อคู่ค้า <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="customerName"
                                name="customerName"
                                placeholder="ชื่อบริษัท/ร้านค้า"
                                value={formData.customerName}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                    </div>

                    {/* ส่วนเพิ่มทะเบียนรถและคนขับ */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label className="text-base font-medium">ข้อมูลรถและคนขับ</Label>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addVehicle}
                                className="flex items-center gap-2"
                            >
                                <Plus className="h-4 w-4" />
                                เพิ่มรถ
                            </Button>
                        </div>

                        {vehicles.map((vehicle, index) => (
                            <div key={index} className="grid grid-cols-2 gap-4 p-4 border rounded-lg bg-gray-50">
                                <div className="space-y-2">
                                    <Label htmlFor={`licensePlate-${index}`}>ทะเบียนรถ</Label>
                                    <Input
                                        id={`licensePlate-${index}`}
                                        placeholder="เช่น กข 1234"
                                        value={vehicle.licensePlate}
                                        onChange={(e) => handleVehicleChange(index, 'licensePlate', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2 relative">
                                    <Label htmlFor={`driverName-${index}`}>ชื่อคนขับ</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id={`driverName-${index}`}
                                            placeholder="ชื่อ-นามสกุล"
                                            value={vehicle.driverName}
                                            onChange={(e) => handleVehicleChange(index, 'driverName', e.target.value)}
                                            className="flex-1"
                                        />
                                        {vehicles.length > 1 && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeVehicle(index)}
                                                className="h-10 w-10 text-red-500 hover:text-red-700 hover:bg-red-50"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* หมายเหตุ */}
                    <div className="space-y-2">
                        <Label htmlFor="notes">หมายเหตุ</Label>
                        <Textarea
                            id="notes"
                            name="notes"
                            placeholder="ระบุหมายเหตุเพิ่มเติม (ถ้ามี)"
                            value={formData.notes}
                            onChange={handleInputChange}
                            rows={3}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        ยกเลิก
                    </Button>
                    <Button onClick={handleSubmit}>
                        บันทึก
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}