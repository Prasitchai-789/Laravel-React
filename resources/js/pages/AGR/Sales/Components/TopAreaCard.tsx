import React from 'react';

const TopAreaCard = ({ areas }) => {
    return (
        <div className="bg-white rounded-lg shadow p-6 font-anuphan">
            <h2 className="text-lg font-semibold mb-4">พื้นที่ที่มาซื้อมากที่สุด </h2>
            <div className="space-y-3">
                {areas.slice(0, 5).map((area, index) => (
                    <div key={area.subdistrict_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold
                                ${index === 0 ? 'bg-yellow-500' :
                                  index === 1 ? 'bg-gray-400' :
                                  index === 2 ? 'bg-orange-500' : 'bg-blue-500'}`}>
                                {index + 1}
                            </div>
                            <div>
                                <p className="font-medium text-gray-800">{area.subdistrict}</p>
                                <p className="text-xs text-gray-500">{area.total_orders} รายการ</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="font-semibold text-gray-800">{area.total_quantity?.toLocaleString()} ต้น</p>
                            <p className="text-sm text-gray-600">{area.total_amount?.toLocaleString()} บาท</p>
                        </div>
                    </div>
                ))}
            </div>

            {areas.length === 0 && (
                <div className="text-center text-gray-500 py-4">
                    ไม่มีข้อมูลพื้นที่
                </div>
            )}
        </div>
    );
};

export default TopAreaCard;
