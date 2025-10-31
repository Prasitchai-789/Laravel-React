import React from 'react';

interface CategoryData {
    category: string;
    itemCount: number;
    percentage: number;
    code?: string;
}

const CategoryUsageStats: React.FC = () => {
    const productUsageByCategory: CategoryData[] = [
        { category: 'เทคโนโลยีสารสนเทศ', itemCount: 245, percentage: 28 },
        { category: 'เครื่องเขียนและวัสดุสำนักงาน', itemCount: 189, percentage: 22 },
        { category: 'อุปกรณ์ไฟฟ้าและอิเล็กทรอนิกส์', itemCount: 156, percentage: 18 },
        { category: 'อะไหล่และเครื่องมือ', itemCount: 134, percentage: 15 },
        { category: 'เฟอร์นิเจอร์และของใช้ในสำนักงาน', itemCount: 98, percentage: 11 },
        { category: 'อุปกรณ์ความปลอดภัย', itemCount: 45, percentage: 5 },
        { category: 'วัสดุสิ้นเปลือง', itemCount: 32, percentage: 4 }
    ];

    // ฟังก์ชันเลือก icon ตามประเภท
    const getCategoryIcon = (categoryName: string) => {
        if (!categoryName) return '📦';

        const name = categoryName.toLowerCase();

        if (name.includes('เทคโนโลยี') || name.includes('tech') || name.includes('it') || name.includes('คอมพิวเตอร์')) return '💻';
        if (name.includes('เครื่องเขียน') || name.includes('stationery')) return '✏️';
        if (name.includes('อุปกรณ์') || name.includes('equipment') || name.includes('เครื่องมือ')) return '🛠️';
        if (name.includes('ไฟฟ้า') || name.includes('electronic')) return '🔌';
        if (name.includes('สำนักงาน') || name.includes('office')) return '🏢';
        if (name.includes('กระดาษ') || name.includes('paper')) return '📄';
        if (name.includes('เฟอร์นิเจอร์') || name.includes('furniture')) return '🪑';
        if (name.includes('ยานพาหนะ') || name.includes('vehicle')) return '🚗';
        if (name.includes('สื่อ') || name.includes('media')) return '📱';
        if (name.includes('เครื่องพิมพ์') || name.includes('printer')) return '🖨️';
        if (name.includes('เครือข่าย') || name.includes('network')) return '🌐';
        if (name.includes('ความปลอดภัย') || name.includes('security')) return '🔒';
        if (name.includes('สื่อสาร') || name.includes('communication')) return '📞';
        if (name.includes('เก็บข้อมูล') || name.includes('storage')) return '💾';
        if (name.includes('เซิร์ฟเวอร์') || name.includes('server')) return '🖥️';
        if (name.includes('ซอฟต์แวร์') || name.includes('software')) return '📀';
        if (name.includes('การแพทย์') || name.includes('medical')) return '🏥';
        if (name.includes('การศึกษา') || name.includes('education')) return '🎓';
        if (name.includes('ครัว') || name.includes('kitchen')) return '🍳';
        if (name.includes('ทำความสะอาด') || name.includes('cleaning')) return '🧹';
        if (name.includes('ก่อสร้าง') || name.includes('construction')) return '🏗️';
        if (name.includes('วัสดุ') || name.includes('material')) return '📦';

        return '📦'; // default icon
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                        <span className="text-white text-lg">📊</span>
                    </div>
                    <div>
                        <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                            จำนวนรายการสินค้าแยกตามประเภท
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            การใช้งานสินค้าแบ่งตามหมวดหมู่
                        </p>
                    </div>
                </div>
                <div className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 rounded-full">
                    <span className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                        {productUsageByCategory.reduce((sum, cat) => sum + (cat.itemCount || 0), 0)} รายการ
                    </span>
                </div>
            </div>

            <div className="space-y-4">
                {productUsageByCategory.map((category, index) => {
                    const colors = [
                        'from-blue-500 to-cyan-500',
                        'from-purple-500 to-pink-500',
                        'from-green-500 to-emerald-500',
                        'from-orange-500 to-red-500',
                        'from-indigo-500 to-purple-500',
                        'from-teal-500 to-blue-500',
                        'from-rose-500 to-pink-500',
                        'from-amber-500 to-orange-500'
                    ];
                    const color = colors[index % colors.length];
                    const categoryIcon = getCategoryIcon(category.category);

                    return (
                        <div
                            key={category.code || index}
                            className="group p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition-all duration-300 border border-transparent hover:border-gray-200 dark:hover:border-gray-600"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center space-x-4 flex-1">
                                    <div className={`w-12 h-12 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300`}>
                                        <span className="text-white text-xl">
                                            {categoryIcon}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-900 dark:text-white truncate">
                                            {category.category || 'ไม่ระบุประเภท'}
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                            {category.itemCount ?? 0} รายการ • {category.percentage ?? 0}%
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {category.itemCount ?? 0}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        รายการ
                                    </div>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="relative pt-2">
                                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                                    <span>ความถี่การใช้งาน</span>
                                    <span>{category.percentage ?? 0}%</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                                    <div
                                        className={`h-3 rounded-full bg-gradient-to-r ${color} transition-all duration-1000 ease-out transform origin-left group-hover:scale-y-110`}
                                        style={{
                                            width: `${Math.max(category.percentage ?? 0, 3)}%`,
                                            boxShadow: `0 0 20px ${color.split(' ')[0].replace('from-', '')}40`
                                        }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Summary Footer */}
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 dark:text-gray-400">
                        อัพเดตล่าสุด {new Date().toLocaleDateString('th-TH')}
                    </span>
                    <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-green-600 dark:text-green-400 font-medium">
                            ข้อมูลเรียลไทม์
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CategoryUsageStats;
