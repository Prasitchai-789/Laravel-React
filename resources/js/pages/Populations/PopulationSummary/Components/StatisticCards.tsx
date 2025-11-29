import React, { useMemo } from 'react';
import { Users, User, UserCheck, HelpCircle } from 'lucide-react';
import { Perple } from '../types/Perple';

interface StatisticCardsProps {
    perples?: Perple[];
    setShowUnspecifiedDetails: (show: boolean) => void;
    fmt: (n: number) => string;
}

const StatisticCards: React.FC<StatisticCardsProps> = ({
    perples = [],
    setShowUnspecifiedDetails,
    fmt
}) => {
    // สรุปข้อมูลประชากร
    const totalSummary = useMemo(() => {
        return perples.reduce(
            (acc, p) => {
                const title = p.title?.trim() ?? "";
                if (title === "นาย") acc.male += 1;
                else if (["นาง", "นางสาว", "น.ส."].includes(title)) acc.female += 1;
                else acc.unspecified += 1;
                acc.total += 1;
                return acc;
            },
            { total: 0, male: 0, female: 0, unspecified: 0 }
        );
    }, [perples]);

    const { total, male, female, unspecified } = totalSummary;

    const cards = [
        { key: "total", label: "รวมทั้งหมด", value: total, icon: Users, color: "from-blue-500 to-blue-600" },
        { key: "male", label: "ชาย", value: male, icon: User, color: "from-green-500 to-green-600" },
        { key: "female", label: "หญิง", value: female, icon: UserCheck, color: "from-pink-500 to-pink-600" },
        { key: "unspecified", label: "ไม่ระบุ", value: unspecified, icon: HelpCircle, color: "from-purple-500 to-purple-600" },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {cards.map((item) => {
                const IconComponent = item.icon;
                const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : "0.0";

                return (
                    <div
                        key={item.key}
                        className={`bg-gradient-to-r ${item.color} rounded-2xl p-6 text-white shadow-xl cursor-pointer transform hover:scale-105 transition-all duration-300`}
                        onClick={() => item.key === "unspecified" && setShowUnspecifiedDetails(true)}
                    >
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm opacity-90 mb-2">{item.label}</p>
                                <p className="text-3xl font-bold mb-1">{fmt(item.value)}</p>
                                {item.key !== "total" && total > 0 && (
                                    <p className="text-sm opacity-80">{percentage}% ของทั้งหมด</p>
                                )}
                            </div>
                            <IconComponent className="text-4xl opacity-90" />
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default StatisticCards;
