import React from "react";
import { Search, Filter } from "lucide-react";

interface Props {
    searchTerm: string;
    onSearch: (v: string) => void;
}

export default function SearchBar({ searchTerm, onSearch }: Props) {
    return (
        <div className="rounded-3xl border border-white/50 bg-white/70 p-4 shadow-2xl backdrop-blur-sm">
            <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
                <div className="max-w-md flex-1">
                    <div className="relative">
                        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                        <input
                            type="text"
                            placeholder="ค้นหาตามวันที่..."
                            value={searchTerm}
                            onChange={(e) => onSearch(e.target.value)}
                            className="w-full rounded-2xl border border-gray-200 bg-white py-3 pr-4 pl-10 text-sm transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200/50"
                        />
                    </div>
                </div>

                <button className="flex items-center justify-center rounded-2xl border border-blue-200/50 bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-3 text-blue-700 shadow-sm transition-all duration-200 hover:shadow-md">
                    <Filter className="mr-2 h-4 w-4" />
                    กรองข้อมูล
                </button>
            </div>
        </div>
    );
}
