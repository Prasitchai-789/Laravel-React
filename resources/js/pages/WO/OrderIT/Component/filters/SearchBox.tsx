import React from 'react';
import { Search } from 'lucide-react';

interface SearchBoxProps {
    value: string;
    onChange: (value: string) => void;
    onSearch: () => void;
    placeholder?: string;
    disabled?: boolean;
}

export const SearchBox: React.FC<SearchBoxProps> = ({
    value,
    onChange,
    onSearch,
    placeholder = "ค้นหาหมายเลข Order, ผู้ขอ, สินค้า, แผนก...",
    disabled = false
}) => {
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            onSearch();
        }
    };

    return (
        <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
                type="text"
                className="block w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-200 text-base disabled:opacity-50"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={disabled}
            />
        </div>
    );
};
