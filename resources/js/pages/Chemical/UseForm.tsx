import React, { useEffect, useState } from 'react';
import { useForm } from '@inertiajs/react';

interface UseFormProps {
    mode: 'create' | 'edit';
    data?: any[];
    shift?: 'A' | 'B';
    onClose: () => void;
    onSuccess?: () => void;
}

const getDefaultChemicals = () => [
    { chemical_name: 'ดินขาว', unit: 'กก.', quantityA: 0, quantityB: 0 },
    { chemical_name: 'Fogon 3000', unit: 'กก.', quantityA: 0, quantityB: 0 },
    { chemical_name: 'Hexon 4000', unit: 'กก.', quantityA: 0, quantityB: 0 },
    { chemical_name: 'Sumalchlor 50', unit: 'กก.', quantityA: 0, quantityB: 0 },
    { chemical_name: 'PROXITANE', unit: 'กก.', quantityA: 0, quantityB: 0 },
    { chemical_name: 'Polymer', unit: 'กก.', quantityA: 0, quantityB: 0 },
    { chemical_name: 'Soda Ash', unit: 'กก.', quantityA: 0, quantityB: 0 },
    { chemical_name: 'Salt', unit: 'กก.', quantityA: 0, quantityB: 0 },
];

export default function UseForm({ mode, data = [], shift = 'A', onClose, onSuccess }: UseFormProps) {
    const { data: formData, setData, post, put, reset, processing } = useForm({
        records: mode === 'edit' && data.length ? data : getDefaultChemicals()
    });

    const [inputErrors, setInputErrors] = useState<{[key: string]: string}>({});

    useEffect(() => {
        if (mode === 'edit' && data.length) {
            const updated = data.map(r => ({
                ...r,
                quantityA: r.quantityA ?? r.quantity ?? 0,
                quantityB: r.quantityB ?? r.quantity ?? 0,
                id: r.id,
            }));

            const filtered = updated.map(r => ({
                ...r,
                quantityA: shift === 'A' ? r.quantityA : 0,
                quantityB: shift === 'B' ? r.quantityB : 0,
            }));

            setData('records', filtered);
        }

        if (mode === 'create') {
            // ใช้ getDefaultChemicals() เพื่อให้ได้ค่าเริ่มต้นใหม่ทุกครั้ง
            setData('records', getDefaultChemicals());
        }
    }, [mode, data, shift, setData]);

    const validateInput = (value: number, chemicalName: string): string => {
        if (value < 0) return 'ค่าต้องไม่น้อยกว่า 0';
        if (value > 10000) return 'ค่าสูงเกินไป';
        if (!Number.isFinite(value)) return 'ค่าต้องเป็นตัวเลข';
        return '';
    };

    const handleChange = (index: number, field: 'quantityA' | 'quantityB', value: string) => {
        const numericValue = value === '' ? 0 : parseFloat(value);
        
        // Validate input
        const error = validateInput(numericValue, formData.records[index].chemical_name);
        setInputErrors(prev => ({
            ...prev,
            [`${index}-${field}`]: error
        }));

        const updated = [...formData.records];
        updated[index][field] = isNaN(numericValue) ? 0 : numericValue;
        setData('records', updated);
    };

    const handleBlur = (index: number, field: 'quantityA' | 'quantityB', value: string) => {
        // Format value to 2 decimal places on blur
        const numericValue = parseFloat(value);
        if (!isNaN(numericValue)) {
            const formattedValue = numericValue.toFixed(2);
            const updated = [...formData.records];
            updated[index][field] = parseFloat(formattedValue);
            setData('records', updated);
        }
    };

    const hasErrors = () => {
        return Object.values(inputErrors).some(error => error !== '');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (hasErrors()) {
            return;
        }

        const url = mode === 'create' ? '/chemical' : `/chemical/${formData.records[0].id}`;
        const action = mode === 'create' ? post : put;

        action(url, {
            data: { records: formData.records },
            onSuccess: () => {
                reset();
                onClose();
                if (onSuccess) onSuccess();
            }
        });
    };

    // Calculate totals
    const totalA = formData.records.reduce((sum, r) => sum + (r.quantityA || 0), 0);
    const totalB = formData.records.reduce((sum, r) => sum + (r.quantityB || 0), 0);

    return (
        <form onSubmit={handleSubmit} className="space-y-6 font-anuphon">
            {/* Table Container */}
            <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
                {/* Header Row */}
                <div className="grid grid-cols-12 gap-2 items-center bg-gradient-to-r from-gray-50 to-gray-100 p-3 border-b border-gray-200">
                    <div className="col-span-6 font-semibold text-gray-700 pl-4 text-sm uppercase tracking-wider">สารเคมี</div>
                    <div className="col-span-2 font-semibold text-gray-700 text-center text-sm uppercase tracking-wider">หน่วย</div>
                    {mode === 'create' ? (
                        <>
                            <div className="col-span-2 font-semibold text-gray-700 text-center text-sm uppercase tracking-wider">กะ A</div>
                            <div className="col-span-2 font-semibold text-gray-700 text-center text-sm uppercase tracking-wider">กะ B</div>
                        </>
                    ) : (
                        <div className="col-span-4 font-semibold text-gray-700 text-center text-sm uppercase tracking-wider">กะ {shift}</div>
                    )}
                </div>

                {/* Form Rows */}
                <div className="divide-y divide-gray-100 bg-white">
                    {formData.records.map((r, idx) => (
                        <div key={idx} className="grid grid-cols-12 gap-2 items-center p-3 hover:bg-blue-50/30 transition-colors duration-150 group">
                            {/* Chemical Name */}
                            <div className="col-span-6">
                                <div className="w-full border border-gray-200 p-2.5 rounded-lg bg-gray-50 text-gray-800 pl-3 font-medium flex items-center">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                                    {r.chemical_name}
                                </div>
                            </div>

                            {/* Unit */}
                            <div className="col-span-2">
                                <div className="w-full border border-gray-200 p-2.5 rounded-lg bg-gray-50 text-gray-800 text-center font-medium">
                                    {r.unit}
                                </div>
                            </div>

                            {/* Quantity Inputs */}
                            {mode === 'create' ? (
                                <>
                                    <div className="col-span-2 relative">
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={r.quantityA === 0 ? '' : r.quantityA}
                                                onChange={e => handleChange(idx, 'quantityA', e.target.value)}
                                                onBlur={e => handleBlur(idx, 'quantityA', e.target.value)}
                                                className={`w-full border p-2.5 rounded-lg text-right focus:ring-2 transition-all duration-200 font-medium ${
                                                    inputErrors[`${idx}-quantityA`] 
                                                        ? 'border-red-300 focus:ring-red-500 bg-red-50' 
                                                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                                                } ${r.quantityA > 0 ? 'bg-blue-50 border-blue-200' : ''}`}
                                                placeholder="0.00"
                                            />
                                            {r.quantityA > 0 && (
                                                <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                                </div>
                                            )}
                                        </div>
                                        {inputErrors[`${idx}-quantityA`] && (
                                            <div className="text-xs text-red-600 mt-1 ml-1">
                                                {inputErrors[`${idx}-quantityA`]}
                                            </div>
                                        )}
                                    </div>
                                    <div className="col-span-2 relative">
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={r.quantityB === 0 ? '' : r.quantityB}
                                                onChange={e => handleChange(idx, 'quantityB', e.target.value)}
                                                onBlur={e => handleBlur(idx, 'quantityB', e.target.value)}
                                                className={`w-full border p-2.5 rounded-lg text-right focus:ring-2 transition-all duration-200 font-medium ${
                                                    inputErrors[`${idx}-quantityB`] 
                                                        ? 'border-red-300 focus:ring-red-500 bg-red-50' 
                                                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                                                } ${r.quantityB > 0 ? 'bg-green-50 border-green-200' : ''}`}
                                                placeholder="0.00"
                                            />
                                            {r.quantityB > 0 && (
                                                <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                                </div>
                                            )}
                                        </div>
                                        {inputErrors[`${idx}-quantityB`] && (
                                            <div className="text-xs text-red-600 mt-1 ml-1">
                                                {inputErrors[`${idx}-quantityB`]}
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="col-span-4 relative">
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={shift === 'A' ? (r.quantityA === 0 ? '' : r.quantityA) : (r.quantityB === 0 ? '' : r.quantityB)}
                                            onChange={e => handleChange(idx, shift === 'A' ? 'quantityA' : 'quantityB', e.target.value)}
                                            onBlur={e => handleBlur(idx, shift === 'A' ? 'quantityA' : 'quantityB', e.target.value)}
                                            className={`w-full border p-2.5 rounded-lg text-right focus:ring-2 transition-all duration-200 font-medium ${
                                                inputErrors[`${idx}-${shift === 'A' ? 'quantityA' : 'quantityB'}`] 
                                                    ? 'border-red-300 focus:ring-red-500 bg-red-50' 
                                                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                                            } ${
                                                (shift === 'A' ? r.quantityA > 0 : r.quantityB > 0) 
                                                    ? shift === 'A' ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200' 
                                                    : ''
                                            }`}
                                            placeholder="0.00"
                                        />
                                        {(shift === 'A' ? r.quantityA > 0 : r.quantityB > 0) && (
                                            <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                                                <div className={`w-1.5 h-1.5 rounded-full ${shift === 'A' ? 'bg-blue-500' : 'bg-green-500'}`}></div>
                                            </div>
                                        )}
                                    </div>
                                    {inputErrors[`${idx}-${shift === 'A' ? 'quantityA' : 'quantityB'}`] && (
                                        <div className="text-xs text-red-600 mt-1 ml-1">
                                            {inputErrors[`${idx}-${shift === 'A' ? 'quantityA' : 'quantityB'}`]}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Total Row */}
                {mode === 'create' && (
                    <div className="grid grid-cols-12 gap-2 items-center p-3 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200 font-semibold">
                        <div className="col-span-6 text-right pr-4 text-gray-700">รวมทั้งหมด:</div>
                        <div className="col-span-2 text-center text-gray-700">กก.</div>
                        <div className="col-span-2 text-right pr-4 text-blue-700">
                            {totalA.toFixed(2)}
                        </div>
                        <div className="col-span-2 text-right pr-4 text-green-700">
                            {totalB.toFixed(2)}
                        </div>
                    </div>
                )}
            </div>

            {/* Summary Section */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-800 mb-2 flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    คำแนะนำในการกรอกข้อมูล
                </h3>
                <ul className="text-sm text-blue-700 space-y-1">
                    <li>• กรุณากรอกปริมาณการใช้สารเคมีเป็นตัวเลข</li>
                    <li>• สามารถกรอกทศนิยมได้ (เช่น 12.5, 25.75)</li>
                    <li>• หากไม่ได้ใช้สารเคมีชนิดใด ให้เว้นว่างหรือกรอก 0</li>
                    <li>• ระบบจะบันทึกทศนิยม 2 ตำแหน่งอัตโนมัติ</li>
                </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors shadow-sm font-medium"
                    disabled={processing}
                >
                    ยกเลิก
                </button>
                <button
                    type="submit"
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    disabled={processing || hasErrors()}
                >
                    {processing ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            กำลังบันทึก...
                        </>
                    ) : mode === 'create' ? 'บันทึกข้อมูล' : 'อัปเดตข้อมูล'}
                </button>
            </div>
        </form>
    );
}