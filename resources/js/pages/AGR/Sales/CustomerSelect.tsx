'use client';

import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Search } from 'lucide-react';
import * as React from 'react';

type Customer = {
    id: number;
    name: string;
    phone?: string;
};

interface CustomerSelectProps {
    customers: Customer[];
    label?: string;
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    className?: string;
    showSearch?: boolean;
    showClear?: boolean;
    disabled?: boolean;
    labelClassName?: string;
    required?: boolean;
}

export default function CustomerSelect({
    customers,
    label,
    value,
    onChange,
    placeholder = 'เลือกลูกค้า',
    className,
    showSearch = true,
    showClear = true,
    disabled = false,
    labelClassName = '',
    required = false,
}: CustomerSelectProps) {
    const [searchTerm, setSearchTerm] = React.useState('');
    const [open, setOpen] = React.useState(false);

    const filteredCustomers = React.useMemo(() => {
        if (!searchTerm) return customers;
        return customers.filter((customer) => customer.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [customers, searchTerm]);

    const filteredCustomer = React.useMemo(() => {
        return customers.find((customer) => customer.id.toString() === value);
    }, [customers, value]);

    const clearSelection = () => {
        if (onChange) onChange('');
        setOpen(true); // เปิด dropdown อีกครั้งหลังเคลียร์
    };

    return (
        <div className={cn('relative', className)}>
            <label htmlFor={name} className={`mb-2 block text-sm font-medium text-gray-700 ${labelClassName}`}>
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <Select value={value} onValueChange={onChange} open={open} onOpenChange={setOpen} disabled={disabled}>
                {/* Trigger */}
                <SelectTrigger
                    className={cn(
                        'text-md w-full min-w-[240px] rounded-lg border border-gray-300 bg-white px-3 py-6 pl-4 text-left text-gray-700 shadow-sm',
                        'focus:border-blue-700 focus:ring-1 focus:ring-blue-700 focus:outline-none',
                        'transition-colors duration-200 hover:border-gray-400',
                        disabled && 'cursor-not-allowed bg-gray-100 shadow-sm',
                        'flex items-center justify-between',
                    )}
                >
                    <div className="flex flex-1 items-center gap-2 overflow-hidden">
                        {filteredCustomer ? (
                            <>
                                <div className="flex-1 truncate">
                                    <span className="font-medium">{filteredCustomer.name}</span>
                                    {/* {selectedProduct.price && (
                                        <span className="ml-2 text-sm text-gray-500">฿{selectedProduct.price.toLocaleString()}</span>
                                    )} */}
                                </div>
                            </>
                        ) : (
                            <span className="text-gray-500">{placeholder}</span>
                        )}
                    </div>
                    {/* <ChevronDown size={16} className={cn('text-gray-500 transition-transform duration-200', open && 'rotate-180 transform')} /> */}
                </SelectTrigger>

                {/* Dropdown Content */}
                <SelectContent
                    className="max-h-[300px] overflow-y-auto rounded-lg border border-gray-200 bg-white p-2 shadow-lg"
                    position="popper"
                    sideOffset={4}
                >
                    {showSearch && (
                        <div className="relative font-anuphan">
                            <Search className="absolute top-4.5 left-3 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="ค้นหาลูกค้า..."
                                className="w-full rounded-md border border-gray-300 py-2 pr-3 pl-9 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    )}

                    {filteredCustomers.length > 0 ? (
                        filteredCustomers.map((customer) => (
                            <SelectItem
                                key={customer.id}
                                value={customer.id.toString()}
                                className={cn(
                                    'mt-1 cursor-pointer rounded-md px-3 py-3 transition-colors',
                                    'hover:bg-green-50 focus:bg-green-50',
                                    'flex items-center justify-between font-anuphan',
                                )}
                            >
                                <div className="flex-1">
                                    <div className="font-medium">{customer.name}</div>
                                    {customer.phone && <div className="mt-1 text-xs text-gray-500">{customer.phone}</div>}
                                </div>
                                {value === customer.id.toString()}
                            </SelectItem>
                        ))
                    ) : (
                        <div className="px-3 py-4 text-center font-anuphan text-gray-500">{searchTerm ? 'ไม่พบสินค้าที่ค้นหา' : 'ไม่มีสินค้า'}</div>
                    )}
                </SelectContent>
            </Select>
        </div>
    );
}
