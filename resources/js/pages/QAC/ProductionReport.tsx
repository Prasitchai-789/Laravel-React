// ProductionReport.tsx
import React from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  BarChart3,
  Package,
  TrendingUp,
  Droplets,
  Sprout,
  Warehouse,
} from "lucide-react";

export default function ProductionReport() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-white to-blue-50/30 rounded-2xl shadow-lg p-4 sm:p-6 max-w-6xl mx-auto border border-blue-100/50"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-blue-200/50 pb-3 sm:pb-4 mb-4 sm:mb-6">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
            รายงานการผลิต
          </h2>
          <p className="text-gray-500 text-sm mt-1 flex items-center">
            <BarChart3 size={14} className="mr-1" />
            ข้อมูลการผลิตประจำวัน
          </p>
        </div>
        <div className="flex items-center space-x-2 bg-blue-50 px-3 py-2 mt-3 sm:mt-0 rounded-xl border border-blue-200">
          <Calendar size={18} className="text-blue-600" />
          <p className="text-sm sm:text-lg font-semibold text-blue-700">
            21 ตุลาคม 2025
          </p>
        </div>
      </div>

      {/* ปริมาณผลปาล์ม (สรุปต้นน้ำ) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/50 rounded-2xl p-4 shadow-sm"
        >
          <div className="flex items-center space-x-2 mb-3">
            <Package size={18} className="text-blue-600" />
            <p className="font-bold text-gray-700">ปริมาณผลปาล์ม</p>
          </div>
          <div className="space-y-3">
            <Row label="ยกมา" value="-" tone="neutral" />
            <Row label="รับเข้า" value="708.610" tone="info" />
            <Row label="เบิกผลิต" value="565.340" tone="danger" />
            <Row label="ยกไป" value="143.270" tone="success" />
          </div>
        </motion.div>

        {/* แนวโน้มการผลิต (placeholder) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.05 }}
          className="lg:col-span-4 flex flex-col justify-center bg-gradient-to-br from-gray-50 to-white border border-gray-200/60 rounded-2xl p-4 shadow-sm"
        >
          <div className="flex items-center space-x-2 mb-3">
            <TrendingUp size={18} className="text-emerald-600" />
            <p className="font-bold text-gray-700">แนวโน้มการผลิต</p>
          </div>
          <div className="h-28 sm:h-32 w-full rounded-lg border border-emerald-200/40 bg-gradient-to-t from-emerald-200/25 via-emerald-100/15 to-transparent grid place-content-center">
            <BarChart3 size={28} className="mx-auto text-emerald-600" />
            <p className="text-gray-400 text-xs mt-1 text-center">
              Production Chart
            </p>
          </div>
        </motion.div>

        {/* ยอดค้าง/ยอดเบิกในเดือน */}
        <div className="lg:col-span-4 grid grid-cols-2 gap-4">
          <CardNumber
            title="รอยอดค้างเดือนก่อน"
            value="15,022.37"
            tone="emerald"
          />
          <CardNumber title="ยอดเบิกเดือนนี้" value="14,870.42" tone="teal" />
        </div>
      </div>

      {/* === SECTION: น้ำมันปาล์มดิบ (CPO) === */}
      <SectionTwoPane
        icon={<Droplets size={18} className="text-yellow-600" />}
        title="น้ำมันปาล์มดิบ (CPO)"
        leftRows={[
          { label: "ยอดยกมา", value: "184.680", className: "bg-white/60" },
          { label: "Skim", value: "10.007", className: "bg-white/60" },
          { label: "ผลิตได้", value: "78.540", className: "bg-yellow-100/50 text-yellow-700" },
          { label: "ขาย", value: "15.000", className: "bg-emerald-100/50 text-emerald-700" },
          { label: "ยกไป", value: "161.030", className: "bg-amber-100/50 text-amber-700" },
        ]}
        rightCard={
          <RightMetrics
            items={[
              { label: "%Yield", value: "13.89", color: "text-yellow-700", bg: "bg-yellow-100/60" },
              { label: "%FFA", value: "4.03", color: "text-amber-700", bg: "bg-amber-100/60" },
              { label: "DOBI", value: "2.33", color: "text-orange-700", bg: "bg-orange-100/60" },
            ]}
          />
        }
        wrapperTone="from-yellow-50 to-amber-50 border-yellow-200/50"
      />

      {/* === SECTION: เมล็ดในปาล์ม (Kernel) === */}
      <SectionTwoPane
        icon={<Sprout size={18} className="text-teal-600" />}
        title="เมล็ดในปาล์ม (Kernel)"
        leftRows={[
          { label: "ยอดยกมา", value: "62.616", className: "bg-white/60" },
          { label: "ผลิตได้", value: "30.106", className: "bg-teal-100/50 text-teal-700" },
          { label: "ขาย", value: "15.360", className: "bg-emerald-100/50 text-emerald-700" },
          { label: "ยกไป", value: "31.362", className: "bg-cyan-100/50 text-cyan-700" },
        ]}
        rightCard={
          <RightMetrics
            items={[
              { label: "%Yield", value: "5.33", color: "text-teal-700", bg: "bg-teal-100/60" },
              { label: "%Moist", value: "6.94", color: "text-cyan-700", bg: "bg-cyan-100/60" },
              { label: "%Dirt", value: "6.21", color: "text-sky-700", bg: "bg-sky-100/60" },
            ]}
          />
        }
        wrapperTone="from-teal-50 to-cyan-50 border-teal-200/50"
      />

      {/* ตัวอย่างส่วนท้ายอื่น ๆ (คงเดิม/เพิ่มภายหลัง) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50/30 border border-blue-200/50 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center space-x-2 mb-3">
            <Warehouse size={18} className="text-blue-600" />
            <p className="font-bold text-gray-700">Stock By Products</p>
          </div>
          <ul className="space-y-2">
            <StockRow name="Kernel (ใน Silo)" value="61.362" />
            <StockRow name="EFB FIBER" value="182.948" />
            <StockRow name="Shell" value="413.239" />
            <StockRow name="NUT (Silo)" value="33.103" />
          </ul>
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-slate-50 border border-gray-200/50 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center space-x-2 mb-3">
            <Warehouse size={18} className="text-gray-600" />
            <p className="font-bold text-gray-700">Silo Stock</p>
          </div>
          <ul className="space-y-2 mb-3">
            <StockRow name="Silo 1" value="14.504" tone="slate" />
            <StockRow name="Silo 2" value="4.440" tone="slate" />
          </ul>
          <div className="bg-yellow-100/70 border border-yellow-200/50 rounded-lg p-3 text-center">
            <p className="text-yellow-800 font-semibold">NUT กองนอก = 0.00 ตัน</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ---------- Sub Components ---------- */

type Tone = "neutral" | "info" | "danger" | "success";

function Row({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: Tone;
}) {
  const toneClass: Record<Tone, string> = {
    neutral:
      "bg-white/60 text-gray-600",
    info:
      "bg-blue-100/60 text-blue-700",
    danger:
      "bg-rose-100/60 text-rose-700",
    success:
      "bg-emerald-100/60 text-emerald-700",
  };
  return (
    <div className={`flex justify-between items-center p-2 rounded-lg ${toneClass[tone]}`}>
      <span>{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function CardNumber({
  title,
  value,
  tone = "emerald",
}: {
  title: string;
  value: string;
  tone?: "emerald" | "teal";
}) {
  const map = {
    emerald: {
      wrap: "from-green-50 to-emerald-50 border-green-200/50",
      text: "text-green-700",
      value: "text-green-800",
    },
    teal: {
      wrap: "from-emerald-50 to-teal-50 border-emerald-200/50",
      text: "text-emerald-700",
      value: "text-emerald-800",
    },
  }[tone];

  return (
    <div
      className={`bg-gradient-to-br ${map.wrap} rounded-2xl p-4 shadow-sm text-center border`}
    >
      <p className={`font-bold ${map.text} text-sm`}>{title}</p>
      <p className={`text-2xl font-bold ${map.value} bg-white/50 py-2 rounded-lg`}>
        {value}
      </p>
      <p className={`${map.text} text-xs mt-1`}>ตัน</p>
    </div>
  );
}

/** ส่วนกล่อง 2 คอลัมน์: ซ้าย (รายการ) + ขวา (การ์ดสรุปค่า) */
function SectionTwoPane({
  icon,
  title,
  leftRows,
  rightCard,
  wrapperTone,
}: {
  icon: React.ReactNode;
  title: string;
  leftRows: { label: string; value: string; className?: string }[];
  rightCard: React.ReactNode;
  wrapperTone: string; // tailwind tone string
}) {
  return (
    <div
      className={`bg-gradient-to-br ${wrapperTone} border rounded-2xl p-4 shadow-sm mb-4`}
    >
      <div className="flex items-center space-x-2 mb-3">
        {icon}
        <p className="font-bold text-gray-700">{title}</p>
      </div>

      {/* mobile: ซ้อนแนวตั้ง / md+: ซ้าย-ขวา */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* LEFT: รายการตัวเลข */}
        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {leftRows.map((r) => (
            <div
              key={r.label}
              className={`flex justify-between items-center p-2 rounded-lg border border-white/40 ${r.className ?? "bg-white/60"}`}
            >
              <span className="text-gray-600">{r.label}</span>
              <span className="font-semibold">{r.value}</span>
            </div>
          ))}
        </div>

        {/* RIGHT: การ์ดสรุป (%) เคียงข้างเหมือนในภาพ */}
        <div className="md:col-span-1">{rightCard}</div>
      </div>
    </div>
  );
}

/** การ์ดสรุปค่า % ด้านขวา */
function RightMetrics({
  items,
}: {
  items: { label: string; value: string; color: string; bg: string }[];
}) {
  return (
    <div className="grid grid-cols-3 md:grid-cols-1 gap-3">
      {items.map((m) => (
        <div
          key={m.label}
          className={`text-center ${m.bg} border border-white/50 rounded-xl p-3`}
        >
          <p className={`text-xs font-semibold ${m.color}`}>{m.label}</p>
          <p className={`text-xl font-bold ${m.color}`}>{m.value}</p>
        </div>
      ))}
    </div>
  );
}

function StockRow({
  name,
  value,
  tone = "blue",
}: {
  name: string;
  value: string;
  tone?: "blue" | "slate";
}) {
  const color = tone === "blue" ? "text-blue-700" : "text-slate-700";
  return (
    <li className="flex justify-between items-center p-2 rounded-lg bg-white/60 border border-white/40">
      <span className="text-gray-600">{name}</span>
      <span className={`font-semibold ${color}`}>{value}</span>
    </li>
  );
}
