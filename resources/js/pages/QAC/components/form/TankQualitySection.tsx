import { motion } from "framer-motion";
import InputField from "./InputField";
import { Filter } from "lucide-react";

interface Props {
    tankNo: number;
    fields: any;
    onFieldChange: (field: string, value: string) => void;
}

export default function TankQualitySection({ tankNo, fields, onFieldChange }: Props) {
    const base = `tank${tankNo}_`;

    return (
        <div>
            {/* Header เหมือนเดิม 100% */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-2 flex items-center space-x-2"
            >
                <div className="rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 p-1.5">
                    <Filter className="h-4 w-4 text-white" />
                </div>
                <h4 className="text-sm font-semibold text-gray-700">ข้อมูลคุณภาพน้ำมัน</h4>
            </motion.div>

            {/* Tank 1 (Single Section) */}
            {tankNo === 1 ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3 rounded-2xl border border-blue-200/80 bg-gradient-to-br from-blue-50/80 to-indigo-50/50 p-5 backdrop-blur-sm">
                    <InputField
                        label="%FFA"
                        value={fields.ffa}
                        onChange={(v) => onFieldChange(base + "ffa", v)}
                        required
                        compact
                    />

                    <InputField
                        label="%Moisture"
                        value={fields.moisture}
                        onChange={(v) => onFieldChange(base + "moisture", v)}
                        required
                        compact
                    />

                    <InputField
                        label="DOBI"
                        value={fields.dobi}
                        onChange={(v) => onFieldChange(base + "dobi", v)}
                        required
                        compact
                    />
                </div>
            ) : (
                // Tanks 2, 3, 4 (Top + Bottom UI)
                <div className="space-y-2">
                    {/* 🔵 TOP Section */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="rounded-2xl border border-blue-200/80 bg-gradient-to-br from-blue-50/80 to-indigo-50/50 p-2 backdrop-blur-sm"
                    >
                        <h5 className=" flex items-center space-x-2 text-sm font-semibold text-blue-800">
                            <div className="h-2 w-2 rounded-full bg-blue-500 shadow-sm"></div>
                            <span>ข้อมูลส่วนบน (Top)</span>
                        </h5>

                        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                            <InputField
                                label="%FFA"
                                value={fields.top_ffa}
                                onChange={(v) => onFieldChange(base + "top_ffa", v)}
                                required
                                compact
                            />
                            <InputField
                                label="%Moisture"
                                value={fields.top_moisture}
                                onChange={(v) => onFieldChange(base + "top_moisture", v)}
                                required
                                compact
                            />
                            <InputField
                                label="DOBI"
                                value={fields.top_dobi}
                                onChange={(v) => onFieldChange(base + "top_dobi", v)}
                                required
                                compact
                            />
                        </div>
                    </motion.div>

                    {/* 🟠 BOTTOM Section */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/80 to-orange-50/50 p-2 backdrop-blur-sm"
                    >
                        <h5 className=" flex items-center space-x-2 text-sm font-semibold text-amber-800">
                            <div className="h-2 w-2 rounded-full bg-amber-500 shadow-sm"></div>
                            <span>ข้อมูลส่วนล่าง (Bottom)</span>
                        </h5>

                        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                            <InputField
                                label="%FFA"
                                value={fields.bottom_ffa}
                                onChange={(v) => onFieldChange(base + "bottom_ffa", v)}
                                required
                                compact
                            />
                            <InputField
                                label="%Moisture"
                                value={fields.bottom_moisture}
                                onChange={(v) => onFieldChange(base + "bottom_moisture", v)}
                                required
                                compact
                            />
                            <InputField
                                label="DOBI"
                                value={fields.bottom_dobi}
                                onChange={(v) => onFieldChange(base + "bottom_dobi", v)}
                                required
                                compact
                            />
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
