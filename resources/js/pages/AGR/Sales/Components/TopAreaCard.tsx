import React from 'react';
import { formatNumberWithCommas } from '../utils/formatters';

interface AreaData {
    subdistrict_id: string | number;
    subdistrict: string;
    total_orders?: number;
    total_quantity?: number;
    total_amount?: number;
}

interface TopAreaCardProps {
    areas: AreaData[];
    formatQuantity: (value: number | undefined) => string;
    formatCurrency: (value: number | undefined) => string;
    formatOrders: (value: number | undefined) => string;
}

const TopAreaCard: React.FC<TopAreaCardProps> = ({ areas, formatQuantity, formatCurrency, formatOrders }) => {
    return (
        <div className="rounded-2xl bg-white p-6 font-anuphan shadow-sm">
            <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">พื้นที่ที่มาซื้อมากที่สุด</h2>
                <div className="text-sm text-gray-500">{areas.length > 0 ? `${Math.min(areas.length, 5)} พื้นที่` : 'ไม่มีข้อมูล'}</div>
            </div>

            <div className="space-y-3">
                {areas.slice(0, 5).map((area, index) => (
                    <div
                        key={area.subdistrict_id}
                        className="flex items-center justify-between rounded-xl bg-gray-50 p-4 transition-colors hover:bg-gray-100"
                    >
                        <div className="flex flex-1 items-center space-x-4">
                            <div
                                className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white ${
                                    index === 0
                                        ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                                        : index === 1
                                          ? 'bg-gradient-to-br from-orange-500 to-red-500'
                                          : index === 2
                                            ? 'bg-gradient-to-br from-yellow-500 to-orange-500'
                                            : 'bg-gradient-to-br from-gray-500 to-gray-600'
                                }`}
                            >
                                {index + 1}
                            </div>
                            <div className="flex-1">
                                <p className="text-lg font-semibold text-gray-800">{area.subdistrict}</p>
                                <p className="mt-1 text-sm text-gray-500">{formatOrders(area.total_orders)} รายการ</p>
                            </div>
                        </div>
                        <div className="ml-4 text-right">
                            <p className="text-lg font-bold text-gray-800">{formatQuantity(area.total_quantity)} ต้น</p>
                            <p className="mt-1 text-sm font-medium text-green-600">{formatNumberWithCommas(area.total_amount)} บาท</p>
                        </div>
                    </div>
                ))}
            </div>

            {areas.length === 0 && (
                <div className="py-8 text-center">
                    <div className="mb-2 text-gray-400">
                        <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1}
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                    <p className="text-lg text-gray-500">ไม่มีข้อมูลพื้นที่</p>
                    <p className="mt-1 text-sm text-gray-400">ไม่พบข้อมูลการขายในช่วงวันที่นี้</p>
                </div>
            )}

            {/* Summary for top areas */}
            {/* {areas.length > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <p className="text-gray-600 text-sm">พื้นที่ทั้งหมด</p>
                            <p className="font-bold text-gray-800 text-lg">{areas.length} พื้นที่</p>
                        </div>
                        <div>
                            <p className="text-gray-600 text-sm">ยอดขายรวม</p>
                            <p className="font-bold text-blue-600 text-lg">
                                {formatQuantity(areas.reduce((sum, area) => sum + (area.total_quantity || 0), 0))} ต้น
                            </p>
                        </div>
                        <div>
                            <p className="text-gray-600 text-sm">มูลค่ารวม</p>
                            <p className="font-bold text-green-600 text-lg">
                                {formatCurrency(areas.reduce((sum, area) => sum + (area.total_amount || 0), 0))}
                            </p>
                        </div>
                    </div>
                </div>
            )} */}
        </div>
    );
};

export default TopAreaCard;
