'use client';

import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Search } from 'lucide-react';
import * as React from 'react';

type Product = {
    id: number;
    name: string;
    category?: string;
    price?: number;
    stock?: number;
};

interface ProductSelectProps {
    products: Product[];
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    className?: string;
    showSearch?: boolean;
    showClear?: boolean;
    disabled?: boolean;
    labelClassName?: string;
    label: string;
    required?: boolean;
}

export default function ProductSelect({
    products,
    value,
    onChange,
    placeholder = 'เลือกสินค้า',
    className,
    showSearch = true,
    showClear = true,
    disabled = false,
    labelClassName = '',
    label,
    required = false,
}: ProductSelectProps) {
    const [searchTerm, setSearchTerm] = React.useState('');
    const [open, setOpen] = React.useState(false);

    const filteredProducts = React.useMemo(() => {
        if (!searchTerm) return products;
        return products.filter((product) => product.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [products, searchTerm]);

    const selectedProduct = React.useMemo(() => {
        return products.find((product) => product.id.toString() === value);
    }, [products, value]);

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
                        {selectedProduct ? (
                            <>
                                <div className="flex-1 truncate">
                                    <span className="font-medium">{selectedProduct.name}</span>
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
                                placeholder="ค้นหาสินค้า..."
                                className="w-full rounded-md border border-gray-300 py-2 pr-3 pl-9 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    )}

                    {filteredProducts.length > 0 ? (
                        filteredProducts.map((product) => (
                            <SelectItem
                                key={product.id}
                                value={product.id.toString()}
                                className={cn(
                                    'mt-1 cursor-pointer rounded-md px-3 py-3 transition-colors',
                                    'hover:bg-green-50 focus:bg-green-50',
                                    'flex items-center justify-between font-anuphan',
                                )}
                            >
                                <div className="flex-1">
                                    <div className="font-medium">{product.name}</div>
                                    {product.category && <div className="mt-1 text-xs text-gray-500">{product.category}</div>}
                                    <div className="mt-1 flex items-center gap-3">
                                        {product.price && <span className="text-sm text-green-600">฿{product.price.toLocaleString()}</span>}
                                        {product.stock !== undefined && (
                                            <span
                                                className={cn(
                                                    'rounded-full px-2 py-1 text-xs',
                                                    product.stock > 10
                                                        ? 'bg-green-100 text-green-800'
                                                        : product.stock > 0
                                                          ? 'bg-yellow-100 text-yellow-800'
                                                          : 'bg-red-100 text-red-800',
                                                )}
                                            >
                                                {product.stock > 0 ? `มีสต็อก ${product.stock.toLocaleString('th-TH')}` : 'สินค้าหมด'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {/* {value === product.id.toString() && <Check size={16} className="ml-2 flex-shrink-0 text-green-600" />} */}
                                {value === product.id.toString()}
                            </SelectItem>
                        ))
                    ) : (
                        <div className="px-3 py-4 text-center font-anuphan text-gray-500">{searchTerm ? 'ไม่พบสินค้าที่ค้นหา' : 'ไม่มีสินค้า'}</div>
                    )}
                </SelectContent>
            </Select>

            {/* Extra Info when selected */}
            {/* {selectedProduct && (
                <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <div className="flex items-start justify-between">
                        <div>
                            <h4 className="font-medium text-gray-800">{selectedProduct.name}</h4>
                            {selectedProduct.category && <p className="text-sm text-gray-600">หมวดหมู่: {selectedProduct.category}</p>}
                        </div>
                        {selectedProduct.price && <span className="text-lg font-bold text-green-600">฿{selectedProduct.price.toLocaleString()}</span>}
                    </div>
                    {selectedProduct.stock !== undefined && (
                        <div className="mt-2 flex items-center">
                            <span
                                className={cn(
                                    'text-sm',
                                    selectedProduct.stock > 10 ? 'text-green-600' : selectedProduct.stock > 0 ? 'text-yellow-600' : 'text-red-600',
                                )}
                            >
                                {selectedProduct.stock > 0 ? `มีสินค้าในสต็อก ${selectedProduct.stock} ชิ้น` : 'สินค้าหมด'}
                            </span>
                        </div>
                    )}
                </div>
            )} */}
        </div>
    );
}
