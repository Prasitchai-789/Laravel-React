import React from "react";
import { motion } from "framer-motion";
import {
    Beaker,
    Droplets,
    FlaskConical,
    Gauge
} from "lucide-react";

interface Props {
    oilRoom: any;
    onChange: (field: string, value: string) => void;
}

export default function OilRoomSection({ oilRoom, onChange }: Props) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 mb-6"
        >

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {/* %FFA CPO */}
                <OilRoomItem
                    label="%FFA CPO"
                    iconBg="from-red-500 to-pink-500"
                    icon={Gauge}
                    value={oilRoom.ffa_cpo}
                    onChange={(v) => onChange("ffa_cpo", v)}
                    focusColor="pink"
                />

                {/* DOBI CPO */}
                <OilRoomItem
                    label="DOBI CPO"
                    iconBg="from-green-500 to-emerald-500"
                    icon={Gauge}
                    value={oilRoom.dobi_cpo}
                    onChange={(v) => onChange("dobi_cpo", v)}
                    focusColor="green"
                />

                {/* CS1 CM */}
                <OilRoomItem
                    label="CS1 CM"
                    iconBg="from-blue-500 to-indigo-500"
                    icon={Droplets}
                    value={oilRoom.cs1_cm}
                    onChange={(v) => onChange("cs1_cm", v)}
                    focusColor="indigo"
                />

                {/* Skim */}
                <OilRoomItem
                    label="Skim"
                    iconBg="from-blue-500 to-cyan-500"
                    icon={FlaskConical}
                    value={oilRoom.skim}
                    onChange={(v) => onChange("skim", v)}
                    focusColor="blue"
                />

                {/* Undilute 1 */}
                <OilRoomItem
                    label="Undilute 1 (แผ่น)"
                    iconBg="from-purple-500 to-fuchsia-500"
                    icon={Beaker}
                    value={oilRoom.undilute_1}
                    onChange={(v) => onChange("undilute_1", v)}
                    focusColor="fuchsia"
                />

                {/* Undilute 2 */}
                <OilRoomItem
                    label="Undilute 2 (แผ่น)"
                    iconBg="from-purple-500 to-fuchsia-500"
                    icon={Beaker}
                    value={oilRoom.undilute_2}
                    onChange={(v) => onChange("undilute_2", v)}
                    focusColor="fuchsia"
                />

                {/* Setting */}
                <OilRoomItem
                    label="Setting (แผ่น)"
                    iconBg="from-orange-500 to-amber-500"
                    icon={Beaker}
                    value={oilRoom.setting}
                    onChange={(v) => onChange("setting", v)}
                    focusColor="amber"
                />

                {/* Clean Oil */}
                <OilRoomItem
                    label="Clean Oil (แผ่น)"
                    iconBg="from-emerald-500 to-teal-500"
                    icon={Beaker}
                    value={oilRoom.clean_oil}
                    onChange={(v) => onChange("clean_oil", v)}
                    focusColor="teal"
                />

                {/* Mix */}
                <OilRoomItem
                    label="Mix (ตัน)"
                    iconBg="from-yellow-500 to-teal-500"
                    icon={Beaker}
                    value={oilRoom.mix}
                    onChange={(v) => onChange("mix", v)}
                    focusColor="teal"
                />

                {/* Loop Back */}
                <OilRoomItem
                    label="Loop Back (ตัน)"
                    iconBg="from-yellow-500 to-teal-500"
                    icon={Beaker}
                    value={oilRoom.loop_back}
                    onChange={(v) => onChange("loop_back", v)}
                    focusColor="teal"
                />
            </div>
        </motion.div>
    );
}

/* ----------------------------- Sub Component ----------------------------- */

function OilRoomItem({ label, icon: Icon, iconBg, value, onChange, focusColor }: any) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="group relative"
        >
            <div className="relative rounded-xl border border-gray-200/60 bg-white/80 p-4 backdrop-blur-sm
                transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg"
            >
                {/* Icon */}
                <div className={`absolute -top-2 -left-2 rounded-xl bg-gradient-to-r ${iconBg} p-2 shadow-lg`}>
                    <Icon className="h-4 w-4 text-white" />
                </div>

                {/* Label */}
                <label className="mb-1 block pl-2.5 text-sm font-medium text-gray-700">{label}</label>

                {/* Input */}
                <input
                    type="text"
                    inputMode="decimal"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className={`w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                        focus:border-${focusColor}-500 focus:ring-2 focus:ring-${focusColor}-500 focus:outline-none`}
                    placeholder="0.00"
                />
            </div>
        </motion.div>
    );
}
