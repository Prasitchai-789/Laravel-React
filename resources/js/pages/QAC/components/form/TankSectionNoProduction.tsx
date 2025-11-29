import { motion } from 'framer-motion';
import { Calculator } from 'lucide-react';
import InputField from './InputField';

interface Props {
    tankNo: number;
    sale: string;
    previousCPO: number;
    previousTemp: number;
    resultCPO: number;
    resultOilLevel: number;
    onChange: (field: string, value: string) => void;
}

export default function TankSectionNoProduction({ tankNo, sale, previousCPO, previousTemp, resultCPO, resultOilLevel, onChange }: Props) {
    // ป้องกัน undefined
    previousCPO = Number(previousCPO) || 0;
    previousTemp = Number(previousTemp) || 0;
    resultCPO = Number(resultCPO) || 0;
    resultOilLevel = Number(resultOilLevel) || 0;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-4 rounded-2xl border border-red-200 bg-red-50/60 p-6 shadow-sm mb-2"
        >
            {/* Header */}
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <div className="flex items-center space-x-3">
                    <div className="rounded-xl bg-gradient-to-r from-red-500 to-pink-500 p-3 shadow-lg">
                        <Calculator className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-800">Tank No. {tankNo}</h3>
                        <p className="text-sm text-gray-600">โหมด: ไม่ผลิต</p>
                    </div>
                </div>

                {/* แสดงข้อมูลก่อนหน้า */}
                <div className="grid grid-cols-2 gap-4 rounded-xl border border-gray-200 bg-white/70 p-4">
                    <div>
                        <p className="text-xs text-gray-500">CPO วันก่อน</p>
                        <p className="font-semibold text-gray-800">{previousCPO.toFixed(3)} ตัน</p>
                    </div>

                    <div>
                        <p className="text-xs text-gray-500">อุณหภูมิวันก่อน</p>
                        <p className="text-center font-semibold text-gray-800">{previousTemp} °C</p>
                    </div>
                </div>
            </div>

            {/* Input ยอดขาย */}
            <InputField label="ยอดขาย (ตัน)" value={sale} onChange={(v) => onChange('sale', v)} icon={Calculator} required />

            <div className='grid grid-cols-2 gap-4'>
            {/* คำนวณคงเหลือ */}
            <div className="rounded-xl border border-green-200 bg-green-50 p-2 pl-4">
                <p className="text-xs text-green-700">CPO คงเหลือ</p>
                <p className="text-xl font-bold text-green-800">{resultCPO.toFixed(3)} ตัน</p>
            </div>

            {/* คำนวณระดับน้ำมัน */}
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-2 pl-4">
                <p className="text-xs text-blue-700">ระดับน้ำมัน (cm.)</p>
                <p className="text-xl font-bold text-blue-800">{resultOilLevel.toFixed(2)} cm.</p>
            </div>
            </div>
        </motion.div>
    );
}
