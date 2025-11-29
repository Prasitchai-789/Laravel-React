import { motion } from 'framer-motion';
import { Droplets, FlaskConical, Thermometer, Trash2 } from 'lucide-react';
import InputField from './InputField';

interface Props {
    tankNo: number;
    oilLevel: string;
    temperature: string;
    cpoVolume: string;
    onFieldChange: (field: string, value: string) => void;
    onRemove: () => void; // กดปุ่ม “ยกเลิก”
}

export default function TankSection({ tankNo, oilLevel, temperature, cpoVolume, onFieldChange, onRemove }: Props) {
    const prefix = `tank${tankNo}_`;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="rounded-2xl bg-gradient-to-br from-white to-gray-50/50 p-0 backdrop-blur-sm"
        >
            {/* Header */}
            <div className="mb-4 flex items-center justify-between border-b border-gray-200/60 pb-4">
                <div className="flex items-center space-x-3">
                    <div className="rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 p-3 shadow-lg">
                        <FlaskConical className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-800">Tank No. {tankNo}</h3>
                        <p className="text-sm text-gray-500">กรอกข้อมูลแทงค์น้ำมัน</p>
                    </div>
                </div>

                {/* ปุ่มยกเลิก */}
                <motion.button
                    type="button"
                    whileHover={{ scale: 1.05, backgroundColor: '#fef2f2' }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onRemove}
                    className="flex items-center space-x-2 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition-all duration-200 hover:bg-red-100 hover:text-red-700 hover:shadow-sm"
                >
                    <Trash2 className="h-4 w-4" />
                    <span>ยกเลิก</span>
                </motion.button>
            </div>

            {/* Basic Information (เหมือนเดิม 100%) */}
            <div className="mb-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <InputField
                        label="ระดับน้ำมัน (cm.)"
                        value={oilLevel}
                        onChange={(v) => onFieldChange(prefix + 'oil_level', v)}
                        icon={Droplets}
                        required
                        compact={false}
                    />

                    <InputField
                        label="อุณหภูมิ (°C)"
                        value={temperature}
                        onChange={(v) => onFieldChange(prefix + 'temperature', v)}
                        icon={Thermometer}
                        required
                    />

                    <InputField
                        label="ปริมาณ CPO"
                        value={cpoVolume}
                        onChange={(v) => onFieldChange(prefix + 'cpo_volume', v)}
                        icon={FlaskConical}
                        readOnly
                        required
                    />
                </div>

                {/* คำนวณอัตโนมัติ */}
                {oilLevel && temperature && cpoVolume && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mt-3 rounded-lg bg-green-50 p-3">
                        <p className="text-sm text-green-700">
                            <strong>คำนวณอัตโนมัติ:</strong> ระดับ {oilLevel} cm. ที่อุณหภูมิ {temperature}°C = {cpoVolume} ตัน
                        </p>
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
}
