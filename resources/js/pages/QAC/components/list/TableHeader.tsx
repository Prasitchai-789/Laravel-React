import React from "react";
import { Calendar, FlaskConical, Filter, Beaker, BarChart3 } from "lucide-react";

interface Props {
    onSort: (field: string) => void;
    getSortIcon: (field: string) => JSX.Element | null;
}

export default function TableHeader({ onSort, getSortIcon }: Props) {
    return (
        <thead className="border-b border-gray-200/50 bg-gradient-to-r from-gray-50 to-amber-50/30">
            <tr>
                <th
                    className="cursor-pointer px-6 py-5 text-left text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100/50"
                    onClick={() => onSort("date")}
                >
                    <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        <span>วันที่บันทึก</span>
                        {getSortIcon("date")}
                    </div>
                </th>

                <th className="px-6 py-5 text-left text-sm font-semibold text-gray-700">
                    <div className="flex items-center space-x-2">
                        <FlaskConical className="h-4 w-4 text-amber-600" />
                        <span>ข้อมูลแทงค์</span>
                    </div>
                </th>

                <th className="px-6 py-5 text-left text-sm font-semibold text-gray-700">
                    <div className="flex items-center space-x-2">
                        <Filter className="h-4 w-4 text-red-600" />
                        <span>คุณภาพน้ำมัน</span>
                    </div>
                </th>

                <th className="px-6 py-5 text-left text-sm font-semibold text-gray-700">
                    <div className="flex items-center space-x-2">
                        <Beaker className="h-4 w-4 text-purple-600" />
                        <span>ข้อมูล Oil Room</span>
                    </div>
                </th>

                <th className="px-6 py-5 text-left text-sm font-semibold text-gray-700">
                    <div className="flex items-center space-x-2">
                        <BarChart3 className="h-4 w-4 text-gray-600" />
                        <span>สรุปผลลัพธ์</span>
                    </div>
                </th>

                <th className="px-6 py-5 text-left text-sm font-semibold text-gray-700">การจัดการ</th>
            </tr>
        </thead>
    );
}
