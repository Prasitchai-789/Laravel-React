// resources/js/pages/MAR/PlanOrder/components/CreatePlanOrderModal.tsx

import React, { useState, useEffect, useRef } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Plus, Trash2, Calendar, Loader2, AlertCircle,
    Package, Building2, MapPin, Truck, User, Search,
    X, Save, FilePlus2, CheckCircle2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Swal from 'sweetalert2';

interface CreateOrderProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => void;
    editData?: any;
    products?: any[];
    customers?: any[];
    destinations?: string[];
    vehicles?: any[];
}

const SearchResults = ({ results, onSelect, type, loading }: any) => {
    if (loading) return (
        <div className="absolute z-50 mt-1 w-full bg-white border rounded-lg shadow-lg p-4 text-center">
            <Loader2 className="h-5 w-5 animate-spin mx-auto text-blue-500" />
            <p className="text-xs text-gray-500 mt-1">กำลังค้นหา...</p>
        </div>
    );

    if (!results?.length) return null;

    return (
        <div className="absolute z-50 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {results.map((item: any, i: number) => (
                <button
                    key={i}
                    className="w-full px-4 py-2.5 text-left hover:bg-gray-50 border-b last:border-0 text-sm"
                    onMouseDown={(e) => {
                        e.preventDefault(); // Prevent blur before selection
                        onSelect(item);
                    }}
                >
                    <div className="font-medium">
                        {item.goodName || item.custName || item.destination || item.numberCar}
                    </div>
                    {(item.goodID || item.custCode || item.driverName) && (
                        <div className="text-xs text-gray-400 mt-0.5">
                            {item.goodID || item.custCode || item.driverName}
                        </div>
                    )}
                </button>
            ))}
        </div>
    );
};

const CreatePlanOrderModal = ({
    isOpen, onClose, onSave, editData = null,
    products = [], customers = [], destinations = [], vehicles = []
}: CreateOrderProps) => {
    const [formData, setFormData] = useState({
        receiveDate: new Date().toISOString().split('T')[0],
        goodID: '',
        goodName: '',
        loadPlan: '',
        custID: '',
        custCode: '',
        custName: '',
        destination: '',
        notes: '',
    });

    const [vehiclesList, setVehiclesList] = useState([{ numberCar: '', driverName: '' }]);
    const [loading, setLoading] = useState({ product: false, customer: false, destination: false, vehicle: false });
    const [searchResults, setSearchResults] = useState({ product: [], customer: [], destination: [], vehicle: [] });
    const [vehicleSearchIndex, setVehicleSearchIndex] = useState<number | null>(null);
    const searchTimeout = useRef<any>();

    const formatDateForInput = (dateStr: any) => {
        if (!dateStr) return new Date().toISOString().split('T')[0];
        const base = dateStr.toString().split(' ')[0];
        if (base.includes('/')) {
            const parts = base.split('/');
            if (parts.length === 3) {
                const [d, m, y] = parts;
                return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
            }
        }
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return new Date().toISOString().split('T')[0];
            return d.toISOString().split('T')[0];
        } catch {
            return new Date().toISOString().split('T')[0];
        }
    };

    useEffect(() => {
        if (!isOpen) return;

        if (editData) {
            setFormData({
                receiveDate: formatDateForInput(editData.orderDate || editData.rawData?.orderDate),
                goodID: editData.rawData?.goodId || editData.productType || '',
                goodName: editData.productName || '',
                loadPlan: editData.rawData?.amntLoad || editData.rawData?.netWei || editData.netWeight?.toString() || '',
                custID: editData.customerID || '',
                custCode: editData.customerCode || '',
                custName: editData.customerName || '',
                destination: editData.destination || '',
                notes: editData.rawData?.remarks || '',
            });

            const cars = editData.licensePlate && editData.licensePlate !== '-' ? editData.licensePlate.split(',') : [];
            const drivers = editData.driverName && editData.driverName !== '-' ? editData.driverName.split(',') : [];
            setVehiclesList(cars.length ? cars.map((car: string, i: number) => ({
                numberCar: car.trim(),
                driverName: drivers[i]?.trim() || ''
            })) : [{ numberCar: '', driverName: '' }]);
        } else {
            // Reset for Create Mode
            setFormData({
                receiveDate: new Date().toISOString().split('T')[0],
                goodID: '',
                goodName: '',
                loadPlan: '',
                custID: '',
                custCode: '',
                custName: '',
                destination: '',
                notes: '',
            });
            setVehiclesList([{ numberCar: '', driverName: '' }]);
        }
        setSearchResults({ product: [], customer: [], destination: [], vehicle: [] });
    }, [editData, isOpen]);

    const handleSearch = (type: string, value: string, data: any[], index: number | null = null) => {
        if (searchTimeout.current) clearTimeout(searchTimeout.current);

        setLoading(prev => ({ ...prev, [type]: true }));
        if (type === 'vehicle') setVehicleSearchIndex(index);

        searchTimeout.current = setTimeout(() => {
            const results = data.filter(item => {
                const searchStr = (item.goodName || item.custName || item.destination || item.numberCar || item.driverName || '').toLowerCase();
                const codeStr = (item.goodID || item.custCode || '').toLowerCase();
                const val = value.toLowerCase();
                return searchStr.includes(val) || codeStr.includes(val);
            }).slice(0, 5);

            setSearchResults(prev => ({ ...prev, [type]: results }));
            setLoading(prev => ({ ...prev, [type]: false }));
        }, 300);
    };

    const selectItem = (type: string, item: any, index: number | null = null) => {
        if (type === 'product') {
            setFormData(prev => ({ ...prev, goodID: item.goodID, goodName: item.goodName }));
        } else if (type === 'customer') {
            setFormData(prev => ({ ...prev, custID: item.custID, custName: item.custName, custCode: item.custCode }));
        } else if (type === 'destination') {
            setFormData(prev => ({ ...prev, destination: item.destination }));
        } else if (type === 'vehicle' && index !== null) {
            const updated = [...vehiclesList];
            updated[index] = {
                numberCar: item.numberCar || updated[index].numberCar,
                driverName: item.driverName || updated[index].driverName
            };
            setVehiclesList(updated);
        }
        setSearchResults(prev => ({ ...prev, [type]: [] }));
        setVehicleSearchIndex(null);
    };

    // Close search results when clicking outside
    useEffect(() => {
        const handleClickOutside = () => {
            setSearchResults({ product: [], customer: [], destination: [], vehicle: [] });
            setVehicleSearchIndex(null);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const validateForm = () => {
        if (!formData.goodName) return Swal.fire({ icon: 'warning', title: 'กรุณาเลือกสินค้า', timer: 1500, showConfirmButton: false });
        if (!formData.custName) return Swal.fire({ icon: 'warning', title: 'กรุณาเลือกลูกค้า', timer: 1500, showConfirmButton: false });
        if (!formData.destination) return Swal.fire({ icon: 'warning', title: 'กรุณาระบุปลายทาง', timer: 1500, showConfirmButton: false });
        if (!formData.loadPlan || parseFloat(formData.loadPlan) <= 0) return Swal.fire({ icon: 'warning', title: 'กรุณาระบุน้ำหนัก', timer: 1500, showConfirmButton: false });
        return true;
    };

    const handleSubmit = () => {
        if (!validateForm()) return;
        onSave({
            ...formData,
            vehicles: vehiclesList.filter(v => v.numberCar || v.driverName)
        });
    };

    const isValid = formData.goodName && formData.custName && formData.destination && formData.loadPlan;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl p-0 overflow-hidden">
                <div className="flex flex-col h-[90vh]">
                    {/* Header */}
                    <div className="p-4 border-b flex items-center justify-between bg-white">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <FilePlus2 className="h-5 w-5 text-blue-600" />
                            </div>
                            <DialogTitle className="text-lg font-semibold">
                                {editData ? 'แก้ไขแผนการขนส่ง' : 'สร้างแผนการขนส่ง'}
                            </DialogTitle>
                        </div>

                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto p-5">
                        <div className="space-y-5">
                            {/* วันที่และน้ำหนัก */}
                            <div className="border rounded-lg p-4 bg-gray-50">
                                <div className="flex items-center gap-2 mb-3">
                                    <Calendar className="h-4 w-4 text-blue-500" />
                                    <span className="font-medium text-sm">วันที่และน้ำหนัก</span>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label className="text-xs">วันที่รับสินค้า</Label>
                                        <Input type="date" value={formData.receiveDate} onChange={e => setFormData({ ...formData, receiveDate: e.target.value })} className="h-9 text-sm" />
                                    </div>
                                    <div>
                                        <Label className="text-xs">น้ำหนัก (กก.)</Label>
                                        <Input type="number" step="0.01" placeholder="0.00" value={formData.loadPlan} onChange={e => setFormData({ ...formData, loadPlan: e.target.value })} className="h-9 text-sm" />
                                    </div>
                                </div>
                            </div>

                            {/* สินค้า */}
                            <div className="border rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <Package className="h-4 w-4 text-amber-500" />
                                    <span className="font-medium text-sm">สินค้า</span>
                                    {formData.goodID && <Badge className="bg-amber-100 text-amber-700 text-[10px]">{formData.goodID}</Badge>}
                                </div>
                                <div className="relative">
                                    <Input
                                        placeholder="ค้นหาสินค้า..."
                                        value={formData.goodName}
                                        onFocus={() => handleSearch('product', formData.goodName, products)}
                                        onChange={e => {
                                            setFormData({ ...formData, goodName: e.target.value });
                                            handleSearch('product', e.target.value, products);
                                        }}
                                        className="h-9 text-sm"
                                    />
                                    <SearchResults
                                        results={searchResults.product}
                                        loading={loading.product}
                                        onSelect={(item: any) => selectItem('product', item)}
                                        type="product"
                                    />
                                </div>
                            </div>

                            {/* ลูกค้า */}
                            <div className="border rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <Building2 className="h-4 w-4 text-green-500" />
                                    <span className="font-medium text-sm">ลูกค้า</span>
                                    {formData.custCode && <Badge className="bg-green-100 text-green-700 text-[10px]">{formData.custCode}</Badge>}
                                </div>
                                <div className="relative">
                                    <Input
                                        placeholder="ค้นหาลูกค้า..."
                                        value={formData.custName}
                                        onFocus={() => handleSearch('customer', formData.custName, customers)}
                                        onChange={e => {
                                            setFormData({ ...formData, custName: e.target.value });
                                            handleSearch('customer', e.target.value, customers);
                                        }}
                                        className="h-9 text-sm"
                                    />
                                    <SearchResults
                                        results={searchResults.customer}
                                        loading={loading.customer}
                                        onSelect={(item: any) => selectItem('customer', item)}
                                        type="customer"
                                    />
                                </div>
                            </div>

                            {/* ปลายทาง */}
                            <div className="border rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <MapPin className="h-4 w-4 text-orange-500" />
                                    <span className="font-medium text-sm">ปลายทาง</span>
                                </div>
                                <div className="relative">
                                    <Input
                                        placeholder="ค้นหาปลายทาง..."
                                        value={formData.destination}
                                        onFocus={() => handleSearch('destination', formData.destination, destinations.map(d => ({ destination: d })))}
                                        onChange={e => {
                                            setFormData({ ...formData, destination: e.target.value });
                                            handleSearch('destination', e.target.value, destinations.map(d => ({ destination: d })));
                                        }}
                                        className="h-9 text-sm"
                                    />
                                    <SearchResults
                                        results={searchResults.destination}
                                        loading={loading.destination}
                                        onSelect={(item: any) => selectItem('destination', item)}
                                        type="destination"
                                    />
                                </div>
                            </div>

                            {/* รถและคนขับ */}
                            <div className="border rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <Truck className="h-4 w-4 text-purple-500" />
                                        <span className="font-medium text-sm">รถและคนขับ</span>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => setVehiclesList([...vehiclesList, { numberCar: '', driverName: '' }])} className="h-7 text-xs">
                                        <Plus className="h-3 w-3 mr-1" /> เพิ่มรถ
                                    </Button>
                                </div>
                                <div className="space-y-2">
                                    {vehiclesList.map((v, i) => (
                                        <div key={i} className="flex gap-2">
                                            <div className="flex-1 relative">
                                                <Input
                                                    placeholder="ทะเบียนรถ"
                                                    value={v.numberCar}
                                                    onFocus={() => handleSearch('vehicle', v.numberCar, vehicles, i)}
                                                    onChange={e => {
                                                        const updated = [...vehiclesList];
                                                        updated[i].numberCar = e.target.value;
                                                        setVehiclesList(updated);
                                                        handleSearch('vehicle', e.target.value, vehicles, i);
                                                    }}
                                                    className="h-8 text-sm"
                                                />
                                                {vehicleSearchIndex === i && searchResults.vehicle.length > 0 && (
                                                    <SearchResults
                                                        results={searchResults.vehicle}
                                                        loading={loading.vehicle}
                                                        onSelect={(item: any) => selectItem('vehicle', item, i)}
                                                        type="vehicle"
                                                    />
                                                )}
                                            </div>
                                            <div className="flex-1 flex gap-1">
                                                <div className="flex-1 relative">
                                                    <Input
                                                        placeholder="ชื่อคนขับ"
                                                        value={v.driverName}
                                                        onFocus={() => handleSearch('vehicle', v.driverName, vehicles, i)}
                                                        onChange={e => {
                                                            const updated = [...vehiclesList];
                                                            updated[i].driverName = e.target.value;
                                                            setVehiclesList(updated);
                                                            handleSearch('vehicle', e.target.value, vehicles, i);
                                                        }}
                                                        className="h-8 text-sm"
                                                    />
                                                    {vehicleSearchIndex === i && searchResults.vehicle.length > 0 && (
                                                        <SearchResults
                                                            results={searchResults.vehicle}
                                                            loading={loading.vehicle}
                                                            onSelect={(item: any) => selectItem('vehicle', item, i)}
                                                            type="vehicle"
                                                        />
                                                    )}
                                                </div>
                                                {vehiclesList.length > 1 && (
                                                    <Button variant="ghost" size="icon" onClick={() => setVehiclesList(vehiclesList.filter((_, idx) => idx !== i))} className="h-8 w-8 text-red-500">
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* หมายเหตุ */}
                            <div className="border rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-sm font-medium">หมายเหตุ</span>
                                </div>
                                <Textarea
                                    placeholder="เพิ่มเติม..."
                                    value={formData.notes}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                    rows={2}
                                    className="text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t bg-white flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className={cn("w-2 h-2 rounded-full", isValid ? "bg-green-500" : "bg-gray-300")} />
                            <span className="text-xs text-gray-500">{isValid ? "พร้อมบันทึก" : "ข้อมูลไม่ครบ"}</span>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={onClose} className="h-8 px-3 text-xs">
                                ยกเลิก
                            </Button>
                            <Button onClick={handleSubmit} disabled={!isValid} className={cn("h-8 px-4 text-xs", isValid ? "bg-blue-600" : "bg-gray-300")}>
                                <Save className="h-3 w-3 mr-1" />
                                {editData ? 'บันทึก' : 'สร้าง'}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default CreatePlanOrderModal;