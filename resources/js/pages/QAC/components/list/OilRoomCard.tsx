import React from "react";

interface Props {
    oil: any; // transformed.oil_room
}

export default function OilRoomCard({ oil }: Props) {
    const items = [
        { label: "Skim (Ton)", value: oil.skim, color: "text-red-700" },
        { label: "CS1 (cm.)", value: oil.cs1_cm, color: "text-blue-700" },
        { label: "Undilute 1", value: oil.undilute_1, color: "text-purple-700" },
        { label: "Undilute 2", value: oil.undilute_2, color: "text-purple-700" },
        { label: "Setting", value: oil.setting, color: "text-amber-700" },
        { label: "Clean Oil", value: oil.clean_oil, color: "text-green-700" },
        { label: "Mix (Ton)", value: oil.mix, color: "text-red-700" },
        { label: "Loop Back (Ton)", value: oil.loop_back, color: "text-red-700" },
    ];

    return (
        <div className="grid grid-cols-2 gap-2">
            {items
                .filter((i) => i.value !== "" && i.value !== null && i.value !== undefined)
                .map((item, idx) => (
                    <div key={idx} className="rounded-xl border border-gray-100 bg-gray-50/50 p-2">
                        <div className="text-xs text-gray-600">{item.label}</div>
                        <div className={`text-sm font-bold ${item.color}`}>
                            {item.value}
                            {["Undilute 1", "Undilute 2", "Setting", "Clean Oil"].includes(item.label)
                                ? " แผ่น"
                                : ""}
                        </div>
                    </div>
                ))}
        </div>
    );
}
