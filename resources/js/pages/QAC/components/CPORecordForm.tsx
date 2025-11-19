import { usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Beaker,
    Calculator,
    CheckSquare,
    Droplets,
    Filter,
    FlaskConical,
    Gauge,
    Save,
    Square,
    Thermometer,
    Trash2,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { CPORecord } from './CPORecordList';

interface CPORecordFormProps {
    record?: CPORecord | null;
    onSave: (data: any) => void;
    onCancel: () => void;
}

const CPORecordForm = ({ record, onSave, onCancel }: CPORecordFormProps) => {
    const { props } = usePage();

    const densityData =
        props.cpoDensityRef?.map((item) => [item.temperature_c, item.density]) || [];

    const tankData =
        props.cpoTankInfo?.map((item) => ({
            tank_no: item.tank_no,
            height_m: item.height_m,
            volume_m3: item.volume_m3,
        })) || [];

    function getYesterdayDate() {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return yesterday.toISOString().split('T')[0];
    }

    const formatDateForInput = (dateString: string) => {
        if (!dateString) return new Date().toISOString().split('T')[0];

        const date = new Date(dateString);
        if (isNaN(date.getTime())) return new Date().toISOString().split('T')[0];

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    };

    // กำหนด selectedTanks เริ่มต้นจาก record หรือ [1, 2]
    const [selectedTanks, setSelectedTanks] = useState<number[]>(() => {
        if (record?.tanks) {
            // เผื่อกรณีเป็น proxy / iterable
            const tanksArray = Array.isArray(record.tanks)
                ? record.tanks
                : Array.from(record.tanks as any);
            return tanksArray
                .map((t: any) => t.tank_no)
                .filter((no: number) => [1, 2, 3, 4].includes(no));
        }
        return [1, 2];
    });

    // ฟังก์ชันสร้าง formData เริ่มต้น
    const createInitialFormData = () => {
        // ถ้าไม่มี tankData จาก props ให้สร้าง 4 แทงค์พื้นฐาน
        const baseTanks =
            tankData.length > 0
                ? tankData.map((t) => ({
                      tank_no: t.tank_no,
                      oil_level: '',
                      temperature: '',
                      cpo_volume: '',
                      ffa: '',
                      moisture: '',
                      dobi: '',
                      top_ffa: '',
                      top_moisture: '',
                      top_dobi: '',
                      bottom_ffa: '',
                      bottom_moisture: '',
                      bottom_dobi: '',
                  }))
                : [1, 2, 3, 4].map((no) => ({
                      tank_no: no,
                      oil_level: '',
                      temperature: '',
                      cpo_volume: '',
                      ffa: '',
                      moisture: '',
                      dobi: '',
                      top_ffa: '',
                      top_moisture: '',
                      top_dobi: '',
                      bottom_ffa: '',
                      bottom_moisture: '',
                      bottom_dobi: '',
                  }));

        return {
            date: getYesterdayDate(),
            tanks: baseTanks,
            oil_room: {
                total_cpo: '',
                ffa_cpo: '',
                dobi_cpo: '',
                cs1_cm: '',
                undilute_1: '',
                undilute_2: '',
                setting: '',
                clean_oil: '',
                skim: '',
                mix: '',
                loop_back: '',
            },
        };
    };

    const [formData, setFormData] = useState(() => createInitialFormData());

    // ใช้ useRef เพื่อเก็บค่า input ก่อน re-render
    const inputRefs = useRef<{ [key: string]: HTMLInputElement }>({});

    // ฟังก์ชันสำหรับเก็บ reference ของ input
    const setInputRef =
        (tankIndex: number, fieldName: string) =>
        (el: HTMLInputElement | null) => {
            if (el) {
                inputRefs.current[`${tankIndex}-${fieldName}`] = el;
            }
        };

    // ฟังก์ชันตรวจสอบและฟอร์แมตค่าตัวเลข
    const formatNumberInput = (value: string, allowDecimal: boolean = true) => {
        // อนุญาตเฉพาะตัวเลขและจุดทศนิยม
        let formatted = value.replace(/[^\d.]/g, '');

        // อนุญาตให้มีจุดเดียว
        const parts = formatted.split('.');
        if (parts.length > 2) {
            formatted = parts[0] + '.' + parts.slice(1).join('');
        }

        // ถ้าไม่อนุญาตทศนิยม ให้ลบจุดออก
        if (!allowDecimal) {
            formatted = formatted.replace('.', '');
        }

        return formatted;
    };

    // ดึงค่าความหนาแน่นจาก temp
    const getDensityByTemperature = useCallback(
        (temperature: number) => {
            if (!temperature || temperature < 20 || temperature > 71) return null;
            const temp = Math.round(temperature);
            const densityItem = densityData.find(([t]) => t === temp);
            return densityItem ? densityItem[1] : null;
        },
        [densityData],
    );

    // คำนวณปริมาตร CPO
    const calculateCPOVolume = useCallback(
        (tankNo: number, oilLevel: string, temperature: string) => {
            if (!oilLevel || !temperature) return '';
            const tankInfo = tankData.find((t) => t.tank_no === tankNo);
            if (!tankInfo) return '';
            const density = getDensityByTemperature(parseFloat(temperature));
            if (!density) return '';
            const volumePerCm =
                (tankInfo.volume_m3 * density) / (tankInfo.height_m * 100);
            const totalVolume = parseFloat(oilLevel) * volumePerCm;
            return totalVolume.toFixed(3);
        },
        [getDensityByTemperature, tankData],
    );

    // คำนวณ Total CPO จากปริมาณ CPO ของทุกแทงค์ที่เลือก
    const calculateTotalCPO = useCallback(
        (tanks: any[]) => {
            const total = tanks
                .filter((tank) => selectedTanks.includes(tank.tank_no)) // เฉพาะแทงค์ที่เลือก
                .reduce((sum, tank) => {
                    const volume = parseFloat(tank.cpo_volume) || 0;
                    return sum + volume;
                }, 0);

            return total > 0 ? total.toFixed(3) : '';
        },
        [selectedTanks],
    );

    // เปลี่ยนค่าภายในถัง - ใช้ functional update และเก็บ focus
    const handleTankChange = useCallback(
        (tankIndex: number, field: string, value: string) => {
            // ฟอร์แมตค่าก่อนอัพเดท
            const formattedValue = formatNumberInput(value, true);

            setFormData((prev) => {
                const updatedTanks = [...prev.tanks];
                const tank = { ...updatedTanks[tankIndex], [field]: formattedValue };

                // คำนวณปริมาณ CPO ทันทีเมื่อมีการเปลี่ยนแปลงระดับน้ำมันหรืออุณหภูมิ
                if (field === 'oil_level' || field === 'temperature') {
                    if (tank.oil_level && tank.temperature) {
                        tank.cpo_volume = calculateCPOVolume(
                            tank.tank_no,
                            tank.oil_level,
                            tank.temperature,
                        );
                    } else {
                        tank.cpo_volume = '';
                    }
                }

                updatedTanks[tankIndex] = tank;

                // คำนวณ Total CPO ใหม่
                const totalCPO = calculateTotalCPO(updatedTanks);

                return {
                    ...prev,
                    tanks: updatedTanks,
                    oil_room: {
                        ...prev.oil_room,
                        total_cpo: totalCPO,
                    },
                };
            });

            // โฟกัสกลับไปที่ input เดิมหลังจากอัพเดท state
            setTimeout(() => {
                const inputKey = `${tankIndex}-${field}`;
                const inputEl = inputRefs.current[inputKey];
                if (inputEl) {
                    inputEl.focus();
                }
            }, 10);
        },
        [calculateCPOVolume, calculateTotalCPO],
    );

    const handleOilRoomChange = (field: string, value: string) => {
        const formattedValue = formatNumberInput(value, true);
        setFormData((prev) => ({
            ...prev,
            oil_room: { ...prev.oil_room, [field]: formattedValue },
        }));
    };

    const toggleTankSelection = (tankNo: number) => {
        setSelectedTanks((prev) => {
            const newSelectedTanks = prev.includes(tankNo)
                ? prev.filter((t) => t !== tankNo)
                : [...prev, tankNo];

            // คำนวณ Total CPO ใหม่เมื่อมีการเปลี่ยนการเลือกแทงค์
            setFormData((prevFormData) => {
                const totalCPO = calculateTotalCPO(prevFormData.tanks);
                return {
                    ...prevFormData,
                    oil_room: {
                        ...prevFormData.oil_room,
                        total_cpo: totalCPO,
                    },
                };
            });

            return newSelectedTanks;
        });
    };

    // คำนวณ Total CPO เมื่อ component โหลดครั้งแรกหรือเมื่อมีการเปลี่ยนแปลงข้อมูล
    useEffect(() => {
        const totalCPO = calculateTotalCPO(formData.tanks);
        if (totalCPO !== formData.oil_room.total_cpo) {
            setFormData((prev) => ({
                ...prev,
                oil_room: {
                    ...prev.oil_room,
                    total_cpo: totalCPO,
                },
            }));
        }
    }, [formData.tanks, calculateTotalCPO]);

    // อัพเดท formData เมื่อ record เปลี่ยน (เช่น เมื่อกด edit)
    useEffect(() => {
    if (!record) {
        setFormData(createInitialFormData());
        setSelectedTanks([1,2]);
        return;
    }

    console.log("Record received:", record);

    const initialData = createInitialFormData();

    // ---- แก้วันที่ ----
    if (record.date) {
        initialData.date = formatDateForInput(record.date);
    }

    // ---- MAP TANKS ----
    const tankNumbers = [1,2,3,4];

    tankNumbers.forEach((no) => {
        const idx = initialData.tanks.findIndex(t => t.tank_no === no);
        if (idx === -1) return;

        initialData.tanks[idx] = {
            tank_no: no,
            oil_level: record[`tank${no}_oil_level`] ?? "",
            temperature: record[`tank${no}_temperature`] ?? "",
            cpo_volume: record[`tank${no}_cpo_volume`]
                ? Number(record[`tank${no}_cpo_volume`]).toFixed(3)
                : "",
            ffa: record[`tank${no}_ffa`] ?? "",
            moisture: record[`tank${no}_moisture`] ?? "",
            dobi: record[`tank${no}_dobi`] ?? "",
            top_ffa: record[`tank${no}_top_ffa`] ?? "",
            top_moisture: record[`tank${no}_top_moisture`] ?? "",
            top_dobi: record[`tank${no}_top_dobi`] ?? "",
            bottom_ffa: record[`tank${no}_bottom_ffa`] ?? "",
            bottom_moisture: record[`tank${no}_bottom_moisture`] ?? "",
            bottom_dobi: record[`tank${no}_bottom_dobi`] ?? "",
        };
    });

    // ---- MAP OIL ROOM ----
    initialData.oil_room = {
        total_cpo: record.total_cpo ? Number(record.total_cpo).toFixed(3) : "",
        ffa_cpo: record.ffa_cpo ?? "",
        dobi_cpo: record.dobi_cpo ?? "",
        cs1_cm: record.cs1_cm ?? "",
        undilute_1: record.undilute_1 ?? "",
        undilute_2: record.undilute_2 ?? "",
        setting: record.setting ?? "",
        clean_oil: record.clean_oil ?? "",
        skim: record.skim ?? "",
        mix: record.mix ?? "",
        loop_back: record.loop_back ?? "",
    };

    // ---- SET FORM ----
    setFormData(initialData);

    // ---- SELECT TANKS ที่มีข้อมูล ----
    const tanksSelected = tankNumbers.filter(no =>
        record[`tank${no}_oil_level`] !== null &&
        record[`tank${no}_oil_level`] !== undefined
    );
    setSelectedTanks(tanksSelected);

}, [record]);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (onSave) onSave(formData);
    };

    const isTankSelected = (tankNo: number) => selectedTanks.includes(tankNo);

    // 🔹 Input Field ที่ใช้ type="text" แทน type="number"
    const InputField = ({
        label,
        value,
        onChange,
        step = '0.001',
        icon: Icon,
        required = false,
        className = '',
        compact = false,
        disabled = false,
        readOnly = false,
        tankIndex,
        fieldName,
        allowDecimal = true,
        showCalculator = false,
        onCalculatorClick,
    }: any) => (
        <div className={`group relative ${className}`}>
            <label
                className={`block font-medium text-gray-700 ${
                    compact ? 'mb-1 text-xs' : 'mb-2 text-sm'
                }`}
            >
                {label}
                {required && <span className="ml-1 text-red-500">*</span>}
            </label>
            <div className="relative">
                {Icon && (
                    <div className="absolute top-1/2 left-3 z-10 -translate-y-1/2">
                        <Icon
                            className={`text-blue-500 ${
                                compact ? 'h-3 w-3' : 'h-4 w-4'
                            }`}
                        />
                    </div>
                )}
                <input
                    ref={setInputRef(tankIndex, fieldName)}
                    type="text"
                    inputMode="decimal"
                    value={value}
                    onChange={(e) => {
                        const formattedValue = formatNumberInput(
                            e.target.value,
                            allowDecimal,
                        );
                        onChange(formattedValue);
                    }}
                    disabled={disabled}
                    readOnly={readOnly}
                    className={`w-full border border-gray-300 bg-white transition-all duration-200 hover:border-gray-400 hover:shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                        disabled || readOnly
                            ? 'cursor-not-allowed bg-gray-100 text-gray-600'
                            : ''
                    } ${
                        compact
                            ? 'rounded-lg px-2 py-1.5 text-sm'
                            : 'rounded-xl px-4 py-2'
                    } ${
                        Icon
                            ? compact
                                ? 'pl-8'
                                : 'pl-11'
                            : compact
                            ? 'pl-2'
                            : 'pl-4'
                    } ${showCalculator ? 'pr-10' : ''}`}
                    required={required}
                    placeholder="0.000"
                    pattern={allowDecimal ? '[0-9.]*' : '[0-9]*'}
                    title={
                        allowDecimal
                            ? 'กรุณากรอกตัวเลขและทศนิยมเท่านั้น'
                            : 'กรุณากรอกตัวเลขเท่านั้น'
                    }
                />
                {showCalculator && (
                    <button
                        type="button"
                        onClick={onCalculatorClick}
                        className="absolute top-1/2 right-2 -translate-y-1/2 text-blue-500 transition-colors hover:text-blue-700"
                        title="คำนวณอัตโนมัติ"
                    >
                        <Calculator className="h-4 w-4" />
                    </button>
                )}
            </div>
        </div>
    );

    // คำนวณรายละเอียด Total CPO
    const getTotalCPODetails = () => {
        const tankDetails = formData.tanks
            .filter(
                (tank: any) =>
                    selectedTanks.includes(tank.tank_no) && tank.cpo_volume,
            )
            .map((tank: any) => ({
                tank_no: tank.tank_no,
                volume: parseFloat(tank.cpo_volume),
                oil_level: tank.oil_level,
                temperature: tank.temperature,
            }));

        const totalVolume = tankDetails.reduce(
            (sum, tank) => sum + tank.volume,
            0,
        );

        return {
            tankDetails,
            totalVolume: totalVolume.toFixed(3),
            tankCount: tankDetails.length,
        };
    };

    const totalCPODetails = getTotalCPODetails();

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-6 font-anuphan">
            <div className="mx-auto max-w-7xl px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="overflow-hidden rounded-3xl border border-white/50 bg-white/80 shadow-2xl backdrop-blur-sm"
                >
                    {/* Header */}
                    <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20"></div>
                        <div className="relative flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <div className="rounded-2xl bg-white/20 p-3 shadow-lg backdrop-blur-sm">
                                    <FlaskConical className="h-8 w-8 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-white drop-shadow-lg">
                                        {record
                                            ? 'แก้ไขข้อมูล Stock CPO'
                                            : 'บันทึกข้อมูล Stock CPO'}
                                    </h1>
                                    <p className="mt-1 text-sm text-blue-100/90">
                                        ระบบบันทึกข้อมูลน้ำมันปาล์มดิบแบบเรียลไทม์
                                    </p>
                                </div>
                            </div>
                            <div className="rounded-xl border border-white/20 bg-white/20 px-4 py-2 text-white backdrop-blur-sm">
                                <span className="text-sm text-blue-100/90">
                                    วันที่บันทึก:
                                </span>
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            date: e.target.value,
                                        })
                                    }
                                    className="ml-2 border-none bg-transparent font-medium text-white focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 pt-6">
                        {/* Tank Selection */}
                        <div className="mb-6">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="mb-2 flex items-center space-x-3"
                            >
                                <div className="rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 p-2 shadow-lg">
                                    <CheckSquare className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800">
                                        เลือกแทงค์ที่ต้องการบันทึกข้อมูล
                                    </h2>
                                    <p className="text-sm text-gray-600">
                                        เลือกแทงค์ที่ต้องการบันทึกข้อมูลน้ำมันปาล์มดิบ
                                    </p>
                                </div>
                            </motion.div>

                            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                                {[1, 2, 3, 4].map((tankNo) => (
                                    <motion.div
                                        key={tankNo}
                                        whileHover={{ scale: 1.02, y: -2 }}
                                        whileTap={{ scale: 0.98 }}
                                        className={`relative transform-gpu cursor-pointer rounded-2xl border-2 p-4 transition-all duration-300 hover:shadow-lg ${
                                            isTankSelected(tankNo)
                                                ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100/80 shadow-md shadow-blue-200/30'
                                                : 'border-gray-200/80 bg-white/60 hover:border-blue-300/50 hover:bg-blue-50/30'
                                        } `}
                                        onClick={() => toggleTankSelection(tankNo)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <div
                                                    className={`rounded-xl p-2 shadow-sm transition-all duration-300 ${
                                                        isTankSelected(tankNo)
                                                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                                                            : 'bg-gray-100 text-gray-400'
                                                    } `}
                                                >
                                                    <FlaskConical className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <span
                                                        className={`font-semibold ${
                                                            isTankSelected(tankNo)
                                                                ? 'text-blue-700'
                                                                : 'text-gray-600'
                                                        } `}
                                                    >
                                                        Tank {tankNo}
                                                    </span>
                                                    <div
                                                        className={`mt-0.5 text-xs ${
                                                            isTankSelected(tankNo)
                                                                ? 'font-medium text-blue-600'
                                                                : 'text-gray-500'
                                                        } `}
                                                    >
                                                        {isTankSelected(tankNo)
                                                            ? '✓ เลือกแล้ว'
                                                            : 'คลิกเพื่อเลือก'}
                                                    </div>
                                                </div>
                                            </div>
                                            {isTankSelected(tankNo) ? (
                                                <CheckSquare className="h-5 w-5 text-blue-500" />
                                            ) : (
                                                <Square className="h-5 w-5 text-gray-300" />
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* Tanks Data Section */}
                        <div className="mb-6">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="mb-4 flex items-center space-x-3"
                            >
                                <div className="rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 p-2 shadow-lg">
                                    <Beaker className="h-6 w-6 text-white" />
                                </div>
                                <div className="flex items-center space-x-4">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-800">
                                            ข้อมูลแทงค์น้ำมัน
                                        </h2>
                                        <p className="text-sm text-gray-600">
                                            กรอกข้อมูลน้ำมันปาล์มดิบในแทงค์ที่เลือก
                                        </p>
                                    </div>
                                    <span className="rounded-full bg-gradient-to-r from-green-100 to-emerald-100 px-4 py-1.5 text-sm font-medium text-green-700 shadow-sm">
                                        {selectedTanks.length} แทงค์ที่เลือก
                                    </span>
                                </div>
                            </motion.div>

                            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                                {formData.tanks.map((tank: any, tankIndex: number) => (
                                    <AnimatePresence key={tank.tank_no}>
                                        {isTankSelected(tank.tank_no) && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                                                transition={{ duration: 0.3 }}
                                                className="rounded-2xl border border-gray-200/80 bg-gradient-to-br from-white to-gray-50/50 p-6 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl"
                                            >
                                                {/* Tank Header */}
                                                <div className="mb-4 flex items-center justify-between border-b border-gray-200/60 pb-4">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 p-3 shadow-lg">
                                                            <FlaskConical className="h-6 w-6 text-white" />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-lg font-bold text-gray-800">
                                                                Tank No. {tank.tank_no}
                                                            </h3>
                                                            <p className="text-sm text-gray-500">
                                                                กรอกข้อมูลแทงค์น้ำมัน
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <motion.button
                                                        type="button"
                                                        whileHover={{
                                                            scale: 1.05,
                                                            backgroundColor: '#fef2f2',
                                                        }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() =>
                                                            toggleTankSelection(
                                                                tank.tank_no,
                                                            )
                                                        }
                                                        className="flex items-center space-x-2 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition-all duration-200 hover:bg-red-100 hover:text-red-700 hover:shadow-sm"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                        <span>ยกเลิก</span>
                                                    </motion.button>
                                                </div>

                                                {/* Basic Information */}
                                                <div className="mb-4">
                                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                                        <InputField
                                                            label="ระดับน้ำมัน (cm.)"
                                                            value={tank.oil_level}
                                                            onChange={(value: string) =>
                                                                handleTankChange(
                                                                    tankIndex,
                                                                    'oil_level',
                                                                    value,
                                                                )
                                                            }
                                                            icon={Droplets}
                                                            required
                                                            tankIndex={tankIndex}
                                                            fieldName="oil_level"
                                                        />
                                                        <InputField
                                                            label="อุณหภูมิ (°C)"
                                                            value={tank.temperature}
                                                            onChange={(value: string) =>
                                                                handleTankChange(
                                                                    tankIndex,
                                                                    'temperature',
                                                                    value,
                                                                )
                                                            }
                                                            icon={Thermometer}
                                                            required
                                                            tankIndex={tankIndex}
                                                            fieldName="temperature"
                                                        />
                                                        <InputField
                                                            label="ปริมาณ CPO"
                                                            value={tank.cpo_volume}
                                                            onChange={(value: string) =>
                                                                handleTankChange(
                                                                    tankIndex,
                                                                    'cpo_volume',
                                                                    value,
                                                                )
                                                            }
                                                            icon={FlaskConical}
                                                            required
                                                            readOnly
                                                            tankIndex={tankIndex}
                                                            fieldName="cpo_volume"
                                                        />
                                                    </div>
                                                    {tank.oil_level &&
                                                        tank.temperature &&
                                                        tank.cpo_volume && (
                                                            <motion.div
                                                                initial={{
                                                                    opacity: 0,
                                                                    scale: 0.95,
                                                                }}
                                                                animate={{
                                                                    opacity: 1,
                                                                    scale: 1,
                                                                }}
                                                                className="mt-3 rounded-lg bg-green-50 p-3"
                                                            >
                                                                <p className="text-sm text-green-700">
                                                                    <strong>
                                                                        คำนวณอัตโนมัติ:
                                                                    </strong>{' '}
                                                                    ระดับ {tank.oil_level}{' '}
                                                                    cm. ที่อุณหภูมิ{' '}
                                                                    {
                                                                        tank.temperature
                                                                    }
                                                                    °C = {tank.cpo_volume}{' '}
                                                                    ตัน
                                                                </p>
                                                            </motion.div>
                                                        )}
                                                </div>

                                                {/* Quality Data */}
                                                <div>
                                                    <motion.div
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        className="mb-2 flex items-center space-x-2"
                                                    >
                                                        <div className="rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 p-1.5">
                                                            <Filter className="h-4 w-4 text-white" />
                                                        </div>
                                                        <h4 className="text-sm font-semibold text-gray-700">
                                                            ข้อมูลคุณภาพน้ำมัน
                                                        </h4>
                                                    </motion.div>

                                                    {tank.tank_no === 1 ? (
                                                        // Tank 1 - Single values
                                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                                            <InputField
                                                                label="%FFA"
                                                                value={tank.ffa}
                                                                onChange={(value: string) =>
                                                                    handleTankChange(
                                                                        tankIndex,
                                                                        'ffa',
                                                                        value,
                                                                    )
                                                                }
                                                                required
                                                                tankIndex={tankIndex}
                                                                fieldName="ffa"
                                                            />
                                                            <InputField
                                                                label="%Moisture"
                                                                value={tank.moisture}
                                                                onChange={(value: string) =>
                                                                    handleTankChange(
                                                                        tankIndex,
                                                                        'moisture',
                                                                        value,
                                                                    )
                                                                }
                                                                required
                                                                tankIndex={tankIndex}
                                                                fieldName="moisture"
                                                            />
                                                            <InputField
                                                                label="DOBI"
                                                                value={tank.dobi}
                                                                onChange={(value: string) =>
                                                                    handleTankChange(
                                                                        tankIndex,
                                                                        'dobi',
                                                                        value,
                                                                    )
                                                                }
                                                                required
                                                                tankIndex={tankIndex}
                                                                fieldName="dobi"
                                                            />
                                                        </div>
                                                    ) : (
                                                        // Tanks 2,3,4 - Top/Bottom values
                                                        <div className="space-y-4">
                                                            {/* Top Section */}
                                                            <motion.div
                                                                initial={{
                                                                    opacity: 0,
                                                                    x: -20,
                                                                }}
                                                                animate={{
                                                                    opacity: 1,
                                                                    x: 0,
                                                                }}
                                                                className="rounded-2xl border border-blue-200/80 bg-gradient-to-br from-blue-50/80 to-indigo-50/50 p-5 backdrop-blur-sm"
                                                            >
                                                                <h5 className="mb-2 flex items-center space-x-2 text-sm font-semibold text-blue-800">
                                                                    <div className="h-2 w-2 rounded-full bg-blue-500 shadow-sm"></div>
                                                                    <span>
                                                                        ข้อมูลส่วนบน (Top)
                                                                    </span>
                                                                </h5>
                                                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                                                    <InputField
                                                                        label="%FFA"
                                                                        value={
                                                                            tank.top_ffa
                                                                        }
                                                                        onChange={(
                                                                            value: string,
                                                                        ) =>
                                                                            handleTankChange(
                                                                                tankIndex,
                                                                                'top_ffa',
                                                                                value,
                                                                            )
                                                                        }
                                                                        required
                                                                        compact
                                                                        tankIndex={
                                                                            tankIndex
                                                                        }
                                                                        fieldName="top_ffa"
                                                                    />
                                                                    <InputField
                                                                        label="%Moisture"
                                                                        value={
                                                                            tank.top_moisture
                                                                        }
                                                                        onChange={(
                                                                            value: string,
                                                                        ) =>
                                                                            handleTankChange(
                                                                                tankIndex,
                                                                                'top_moisture',
                                                                                value,
                                                                            )
                                                                        }
                                                                        required
                                                                        compact
                                                                        tankIndex={
                                                                            tankIndex
                                                                        }
                                                                        fieldName="top_moisture"
                                                                    />
                                                                    <InputField
                                                                        label="DOBI"
                                                                        value={
                                                                            tank.top_dobi
                                                                        }
                                                                        onChange={(
                                                                            value: string,
                                                                        ) =>
                                                                            handleTankChange(
                                                                                tankIndex,
                                                                                'top_dobi',
                                                                                value,
                                                                            )
                                                                        }
                                                                        required
                                                                        compact
                                                                        tankIndex={
                                                                            tankIndex
                                                                        }
                                                                        fieldName="top_dobi"
                                                                    />
                                                                </div>
                                                            </motion.div>

                                                            {/* Bottom Section */}
                                                            <motion.div
                                                                initial={{
                                                                    opacity: 0,
                                                                    x: 20,
                                                                }}
                                                                animate={{
                                                                    opacity: 1,
                                                                    x: 0,
                                                                }}
                                                                className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/80 to-orange-50/50 p-5 backdrop-blur-sm"
                                                            >
                                                                <h5 className="mb-2 flex items-center space-x-2 text-sm font-semibold text-amber-800">
                                                                    <div className="h-2 w-2 rounded-full bg-amber-500 shadow-sm"></div>
                                                                    <span>
                                                                        ข้อมูลส่วนล่าง
                                                                        (Bottom)
                                                                    </span>
                                                                </h5>
                                                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                                                    <InputField
                                                                        label="%FFA"
                                                                        value={
                                                                            tank.bottom_ffa
                                                                        }
                                                                        onChange={(
                                                                            value: string,
                                                                        ) =>
                                                                            handleTankChange(
                                                                                tankIndex,
                                                                                'bottom_ffa',
                                                                                value,
                                                                            )
                                                                        }
                                                                        required
                                                                        compact
                                                                        tankIndex={
                                                                            tankIndex
                                                                        }
                                                                        fieldName="bottom_ffa"
                                                                    />
                                                                    <InputField
                                                                        label="%Moisture"
                                                                        value={
                                                                            tank.bottom_moisture
                                                                        }
                                                                        onChange={(
                                                                            value: string,
                                                                        ) =>
                                                                            handleTankChange(
                                                                                tankIndex,
                                                                                'bottom_moisture',
                                                                                value,
                                                                            )
                                                                        }
                                                                        required
                                                                        compact
                                                                        tankIndex={
                                                                            tankIndex
                                                                        }
                                                                        fieldName="bottom_moisture"
                                                                    />
                                                                    <InputField
                                                                        label="DOBI"
                                                                        value={
                                                                            tank.bottom_dobi
                                                                        }
                                                                        onChange={(
                                                                            value: string,
                                                                        ) =>
                                                                            handleTankChange(
                                                                                tankIndex,
                                                                                'bottom_dobi',
                                                                                value,
                                                                            )
                                                                        }
                                                                        required
                                                                        compact
                                                                        tankIndex={
                                                                            tankIndex
                                                                        }
                                                                        fieldName="bottom_dobi"
                                                                    />
                                                                </div>
                                                            </motion.div>
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                ))}
                            </div>

                            {/* No Tanks Selected Message */}
                            {selectedTanks.length === 0 && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="rounded-2xl border-2 border-dashed border-gray-300/80 bg-gradient-to-br from-gray-50/50 to-white/30 py-16 text-center backdrop-blur-sm"
                                >
                                    <FlaskConical className="mx-auto mb-4 h-20 w-20 text-gray-400/60" />
                                    <h3 className="mb-3 text-xl font-medium text-gray-600">
                                        ยังไม่มีแทงค์ที่เลือก
                                    </h3>
                                    <p className="mx-auto max-w-md text-gray-500">
                                        กรุณาเลือกแทงค์ที่ต้องการบันทึกข้อมูลจากเมนูด้านบน
                                        เพื่อเริ่มต้นการบันทึกข้อมูลน้ำมันปาล์มดิบ
                                    </p>
                                </motion.div>
                            )}
                        </div>

                        {/* Oil Room Section */}
                        <AnimatePresence>
                            {selectedTanks.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 20 }}
                                    className="mb-8"
                                >
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="mb-4 flex items-center space-x-3"
                                    >
                                        <div className="rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 p-2 shadow-lg">
                                            <Filter className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-800">
                                                ข้อมูลน้ำมันปาล์มดิบ
                                            </h2>
                                            <p className="text-sm text-gray-600">
                                                กรอกข้อมูลเพิ่มเติมเกี่ยวกับน้ำมันปาล์มดิบ
                                            </p>
                                        </div>
                                    </motion.div>

                                    <div className="rounded-2xl border border-purple-200/80 bg-gradient-to-br from-purple-50/50 to-pink-50/30 p-6 shadow-lg backdrop-blur-sm">
                                        {/* Total CPO Summary */}
                                        {totalCPODetails.tankCount > 0 && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="mb-6 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50 p-4"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-3">
                                                        <Calculator className="h-5 w-5 text-blue-600" />
                                                        <h3 className="font-semibold text-blue-800">
                                                            สรุป Total CPO
                                                        </h3>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-2xl font-bold text-blue-700">
                                                            {(
                                                                parseFloat(
                                                                    totalCPODetails.totalVolume,
                                                                ) 
                                                            ).toFixed(3)}{' '}
                                                            ตัน
                                                        </p>
                                                        <p className="text-sm text-blue-600">
                                                            รวมจาก{' '}
                                                            {
                                                                totalCPODetails.tankCount
                                                            }{' '}แทงค์
                                                            
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="mt-3 grid grid-cols-2 gap-2 text-xs md:grid-cols-4">
                                                    {totalCPODetails.tankDetails.map(
                                                        (tank) => (
                                                            <div
                                                                key={tank.tank_no}
                                                                className="rounded-lg bg-white/50 p-2 text-center"
                                                            >
                                                                <p className="font-medium text-blue-700">
                                                                    Tank{' '}
                                                                    {tank.tank_no}
                                                                </p>
                                                                <p className="text-blue-600">
                                                                    {tank.volume.toFixed(
                                                                        3,
                                                                    )}{' '}
                                                                    ตัน
                                                                </p>
                                                            </div>
                                                        ),
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}

                                        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                                            {/* %FFA CPO */}
                                            <motion.div
                                                initial={{
                                                    opacity: 0,
                                                    scale: 0.9,
                                                    y: 20,
                                                }}
                                                animate={{
                                                    opacity: 1,
                                                    scale: 1,
                                                    y: 0,
                                                }}
                                                className="group relative"
                                            >
                                                <div className="relative rounded-xl border border-gray-200/60 bg-white/80 p-4 backdrop-blur-sm transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg">
                                                    <div className="absolute -top-2 -left-2 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 p-2 shadow-lg">
                                                        <Filter className="h-4 w-4 text-white" />
                                                    </div>
                                                    <label className="mb-1 block pl-2.5 text-sm font-medium text-gray-700">
                                                        %FFA CPO
                                                    </label>
                                                    <input
                                                        type="text"
                                                        inputMode="decimal"
                                                        value={formData.oil_room.ffa_cpo}
                                                        onChange={(e) =>
                                                            handleOilRoomChange(
                                                                'ffa_cpo',
                                                                e.target.value,
                                                            )
                                                        }
                                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pink-500 focus:ring-2 focus:ring-pink-500 focus:outline-none"
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                            </motion.div>

                                            {/* DOBI CPO */}
                                            <motion.div
                                                initial={{
                                                    opacity: 0,
                                                    scale: 0.9,
                                                    y: 20,
                                                }}
                                                animate={{
                                                    opacity: 1,
                                                    scale: 1,
                                                    y: 0,
                                                }}
                                                className="group relative"
                                            >
                                                <div className="relative rounded-xl border border-gray-200/60 bg-white/80 p-4 backdrop-blur-sm transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg">
                                                    <div className="absolute -top-2 -left-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 p-2 shadow-lg">
                                                        <Gauge className="h-4 w-4 text-white" />
                                                    </div>
                                                    <label className="mb-1 block pl-2.5 text-sm font-medium text-gray-700">
                                                        DOBI CPO
                                                    </label>
                                                    <input
                                                        type="text"
                                                        inputMode="decimal"
                                                        value={formData.oil_room.dobi_cpo}
                                                        onChange={(e) =>
                                                            handleOilRoomChange(
                                                                'dobi_cpo',
                                                                e.target.value,
                                                            )
                                                        }
                                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-500 focus:outline-none"
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                            </motion.div>

                                            {/* CS1 CM */}
                                            <motion.div
                                                initial={{
                                                    opacity: 0,
                                                    scale: 0.9,
                                                    y: 20,
                                                }}
                                                animate={{
                                                    opacity: 1,
                                                    scale: 1,
                                                    y: 0,
                                                }}
                                                className="group relative"
                                            >
                                                <div className="relative rounded-xl border border-gray-200/60 bg-white/80 p-4 backdrop-blur-sm transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg">
                                                    <div className="absolute -top-2 -left-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 p-2 shadow-lg">
                                                        <Droplets className="h-4 w-4 text-white" />
                                                    </div>
                                                    <label className="mb-1 block pl-2.5 text-sm font-medium text-gray-700">
                                                        CS1 CM
                                                    </label>
                                                    <input
                                                        type="text"
                                                        inputMode="decimal"
                                                        value={formData.oil_room.cs1_cm}
                                                        onChange={(e) =>
                                                            handleOilRoomChange(
                                                                'cs1_cm',
                                                                e.target.value,
                                                            )
                                                        }
                                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                            </motion.div>

                                            {/* Skim */}
                                            <motion.div
                                                initial={{
                                                    opacity: 0,
                                                    scale: 0.9,
                                                    y: 20,
                                                }}
                                                animate={{
                                                    opacity: 1,
                                                    scale: 1,
                                                    y: 0,
                                                }}
                                                className="group relative"
                                            >
                                                <div className="relative rounded-xl border border-gray-200/60 bg-white/80 p-4 backdrop-blur-sm transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg">
                                                    <div className="absolute -top-2 -left-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 p-2 shadow-lg">
                                                        <FlaskConical className="h-4 w-4 text-white" />
                                                    </div>
                                                    <label className="mb-1 block pl-2.5 text-sm font-medium text-gray-700">
                                                        Skim
                                                    </label>
                                                    <input
                                                        type="text"
                                                        inputMode="decimal"
                                                        value={formData.oil_room.skim}
                                                        onChange={(e) =>
                                                            handleOilRoomChange(
                                                                'skim',
                                                                e.target.value,
                                                            )
                                                        }
                                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                        placeholder="0.000"
                                                    />
                                                </div>
                                            </motion.div>

                                            {/* Undilute 1 */}
                                            <motion.div
                                                initial={{
                                                    opacity: 0,
                                                    scale: 0.9,
                                                    y: 20,
                                                }}
                                                animate={{
                                                    opacity: 1,
                                                    scale: 1,
                                                    y: 0,
                                                }}
                                                className="group relative"
                                            >
                                                <div className="relative rounded-xl border border-gray-200/60 bg-white/80 p-4 backdrop-blur-sm transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg">
                                                    <div className="absolute -top-2 -left-2 rounded-xl bg-gradient-to-r from-purple-500 to-fuchsia-500 p-2 shadow-lg">
                                                        <Beaker className="h-4 w-4 text-white" />
                                                    </div>
                                                    <label className="mb-1 block pl-2.5 text-sm font-medium text-gray-700">
                                                        Undilute 1 (แผ่น)
                                                    </label>
                                                    <input
                                                        type="text"
                                                        inputMode="decimal"
                                                        value={
                                                            formData.oil_room
                                                                .undilute_1
                                                        }
                                                        onChange={(e) =>
                                                            handleOilRoomChange(
                                                                'undilute_1',
                                                                e.target.value,
                                                            )
                                                        }
                                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-500 focus:outline-none"
                                                        placeholder="0"
                                                    />
                                                </div>
                                            </motion.div>

                                            {/* Undilute 2 */}
                                            <motion.div
                                                initial={{
                                                    opacity: 0,
                                                    scale: 0.9,
                                                    y: 20,
                                                }}
                                                animate={{
                                                    opacity: 1,
                                                    scale: 1,
                                                    y: 0,
                                                }}
                                                className="group relative"
                                            >
                                                <div className="relative rounded-xl border border-gray-200/60 bg-white/80 p-4 backdrop-blur-sm transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg">
                                                    <div className="absolute -top-2 -left-2 rounded-xl bg-gradient-to-r from-purple-500 to-fuchsia-500 p-2 shadow-lg">
                                                        <Beaker className="h-4 w-4 text-white" />
                                                    </div>
                                                    <label className="mb-1 block pl-2.5 text-sm font-medium text-gray-700">
                                                        Undilute 2 (แผ่น)
                                                    </label>
                                                    <input
                                                        type="text"
                                                        inputMode="decimal"
                                                        value={
                                                            formData.oil_room
                                                                .undilute_2
                                                        }
                                                        onChange={(e) =>
                                                            handleOilRoomChange(
                                                                'undilute_2',
                                                                e.target.value,
                                                            )
                                                        }
                                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-500 focus:outline-none"
                                                        placeholder="0"
                                                    />
                                                </div>
                                            </motion.div>

                                            {/* Setting */}
                                            <motion.div
                                                initial={{
                                                    opacity: 0,
                                                    scale: 0.9,
                                                    y: 20,
                                                }}
                                                animate={{
                                                    opacity: 1,
                                                    scale: 1,
                                                    y: 0,
                                                }}
                                                className="group relative"
                                            >
                                                <div className="relative rounded-xl border border-gray-200/60 bg-white/80 p-4 backdrop-blur-sm transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg">
                                                    <div className="absolute -top-2 -left-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 p-2 shadow-lg">
                                                        <Beaker className="h-4 w-4 text-white" />
                                                    </div>
                                                    <label className="mb-1 block pl-2.5 text-sm font-medium text-gray-700">
                                                        Setting (แผ่น)
                                                    </label>
                                                    <input
                                                        type="text"
                                                        inputMode="decimal"
                                                        value={
                                                            formData.oil_room
                                                                .setting
                                                        }
                                                        onChange={(e) =>
                                                            handleOilRoomChange(
                                                                'setting',
                                                                e.target.value,
                                                            )
                                                        }
                                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                                                        placeholder="0"
                                                    />
                                                </div>
                                            </motion.div>

                                            {/* Clean Oil */}
                                            <motion.div
                                                initial={{
                                                    opacity: 0,
                                                    scale: 0.9,
                                                    y: 20,
                                                }}
                                                animate={{
                                                    opacity: 1,
                                                    scale: 1,
                                                    y: 0,
                                                }}
                                                className="group relative"
                                            >
                                                <div className="relative rounded-xl border border-gray-200/60 bg-white/80 p-4 backdrop-blur-sm transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg">
                                                    <div className="absolute -top-2 -left-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 p-2 shadow-lg">
                                                        <Beaker className="h-4 w-4 text-white" />
                                                    </div>
                                                    <label className="mb-1 block pl-2.5 text-sm font-medium text-gray-700">
                                                        Clean Oil (แผ่น)
                                                    </label>
                                                    <input
                                                        type="text"
                                                        inputMode="decimal"
                                                        value={
                                                            formData.oil_room
                                                                .clean_oil
                                                        }
                                                        onChange={(e) =>
                                                            handleOilRoomChange(
                                                                'clean_oil',
                                                                e.target.value,
                                                            )
                                                        }
                                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                                                        placeholder="0"
                                                    />
                                                </div>
                                            </motion.div>

                                            {/* Mix */}
                                            <motion.div
                                                initial={{
                                                    opacity: 0,
                                                    scale: 0.9,
                                                    y: 20,
                                                }}
                                                animate={{
                                                    opacity: 1,
                                                    scale: 1,
                                                    y: 0,
                                                }}
                                                className="group relative"
                                            >
                                                <div className="relative rounded-xl border border-gray-200/60 bg-white/80 p-4 backdrop-blur-sm transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg">
                                                    <div className="absolute -top-2 -left-2 rounded-xl bg-gradient-to-r from-yellow-500 to-teal-500 p-2 shadow-lg">
                                                        <Beaker className="h-4 w-4 text-white" />
                                                    </div>
                                                    <label className="mb-1 block pl-2.5 text-sm font-medium text-gray-700">
                                                        Mix (ตัน)
                                                    </label>
                                                    <input
                                                        type="text"
                                                        inputMode="decimal"
                                                        value={
                                                            formData.oil_room
                                                                .mix
                                                        }
                                                        onChange={(e) =>
                                                            handleOilRoomChange(
                                                                'mix',
                                                                e.target.value,
                                                            )
                                                        }
                                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                                                        placeholder="0"
                                                    />
                                                </div>
                                            </motion.div>

                                            {/* Loop Back */}
                                            <motion.div
                                                initial={{
                                                    opacity: 0,
                                                    scale: 0.9,
                                                    y: 20,
                                                }}
                                                animate={{
                                                    opacity: 1,
                                                    scale: 1,
                                                    y: 0,
                                                }}
                                                className="group relative"
                                            >
                                                <div className="relative rounded-xl border border-gray-200/60 bg-white/80 p-4 backdrop-blur-sm transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg">
                                                    <div className="absolute -top-2 -left-2 rounded-xl bg-gradient-to-r from-yellow-500 to-teal-500 p-2 shadow-lg">
                                                        <Beaker className="h-4 w-4 text-white" />
                                                    </div>
                                                    <label className="mb-1 block pl-2.5 text-sm font-medium text-gray-700">
                                                        Loop Back (ตัน)
                                                    </label>
                                                    <input
                                                        type="text"
                                                        inputMode="decimal"
                                                        value={
                                                            formData.oil_room
                                                                .loop_back
                                                        }
                                                        onChange={(e) =>
                                                            handleOilRoomChange(
                                                                'loop_back',
                                                                e.target.value,
                                                            )
                                                        }
                                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                                                        placeholder="0"
                                                    />
                                                </div>
                                            </motion.div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Submit Button */}
                        <AnimatePresence>
                            {selectedTanks.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 30 }}
                                    className="flex justify-end space-x-4 border-t border-gray-200/60 pt-6"
                                >
                                    <motion.button
                                        type="button"
                                        onClick={onCancel}
                                        whileHover={{
                                            scale: 1.02,
                                            backgroundColor: '#f8fafc',
                                        }}
                                        whileTap={{ scale: 0.98 }}
                                        className="rounded-xl border border-gray-300 bg-white px-8 py-3 font-semibold text-gray-700 shadow-sm transition-all duration-200 hover:shadow-md"
                                    >
                                        ยกเลิก
                                    </motion.button>
                                    <motion.button
                                        type="submit"
                                        whileHover={{ scale: 1.05, y: -2 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="flex items-center space-x-3 rounded-xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 px-8 py-3 font-semibold text-white shadow-lg transition-all duration-200 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-800 hover:shadow-xl"
                                    >
                                        <Save className="h-5 w-5" />
                                        <span>
                                            {record
                                                ? 'อัพเดทข้อมูล'
                                                : 'บันทึกข้อมูล'}{' '}
                                            ({selectedTanks.length} แทงค์)
                                        </span>
                                    </motion.button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </form>
                </motion.div>
            </div>
        </div>
    );
};

export default CPORecordForm;
