import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BarChart3,
    Calculator,
    Calendar,
    Droplets,
    Factory,
    Nut,
    Package,
    Save,
    Search,
    Shield,
    TreePine,
    TrendingUp,
    Warehouse,
    X,
    Info,
    Zap,
    CheckCircle,
    AlertCircle,
    ArrowRightLeft,
    Power,
    PowerOff,
} from 'lucide-react';
import { useEffect, useState } from 'react';

const SiloRecordForm = ({ record, onSave, onCancel }) => {

    function getYesterdayDate() {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return yesterday.toISOString().split('T')[0];
    }

    const formatDateForInput = (dateString) => {
        if (!dateString) return new Date().toISOString().split('T')[0];

        const date = new Date(dateString);
        if (isNaN(date.getTime())) return new Date().toISOString().split('T')[0];

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    };

    // === Production Mode Toggle ===
    const [isProduction, setIsProduction] = useState(true);

    // === No-Production Data ===
    const [noProductionData, setNoProductionData] = useState({
        pkn_stock: 0,
        pkn_sold: 0,
        pkn_remaining: 0,
        shortfall: 0,
        silo_1_stock: 0,
        silo_2_stock: 0,
    });
    const [noProductionLoading, setNoProductionLoading] = useState(false);
    const [silo1TransferAmount, setSilo1TransferAmount] = useState<number>(0);
    const [silo2TransferAmount, setSilo2TransferAmount] = useState<number>(0);
    // ช่องกรอกล้านอก (ทั้ง production และ no-production)
    const [nutOutside, setNutOutside] = useState<string>('');
    const [kernelOutside, setKernelOutside] = useState<string>('');

    const [formData, setFormData] = useState({
        record_date: getYesterdayDate(),
        nut_silo_1_level: '',
        nut_silo_2_level: '',
        nut_silo_3_level: '',
        kernel_silo_1_level: '',
        kernel_silo_2_level: '',
        silo_sale_big_level: '',
        silo_sale_small_level: '',
        kernel_outside_pile: '',
        moisture_percent: '',
        shell_percent: '',
        outside_nut: '',
    });

    const [calculatedQuantities, setCalculatedQuantities] = useState({
        nut_silo_1: 0,
        nut_silo_2: 0,
        nut_silo_3: 0,
        kernel_silo_1: 0,
        kernel_silo_2: 0,
        silo_sale_big: 0,
        silo_sale_small: 0,
        kernel_total: 0,
    });

    const [hasData, setHasData] = useState(false);
    const [showFormula, setShowFormula] = useState(false);

    const constants = {
        nut_silo_1: 614,
        nut_silo_2: 614,
        nut_silo_3: 614,
        kernel_silo_1: 640,
        kernel_silo_2: 640,
        silo_sale_big: 920,
        silo_sale_small: 870,
    };

    const multipliers = {
        nut_silo_1: 0.0453,
        nut_silo_2: 0.0453,
        nut_silo_3: 0.0538,
        kernel_silo_1: 0.0296,
        kernel_silo_2: 0.0296,
        silo_sale_big: 0.228,
        silo_sale_small: 0.228,
    };

    useEffect(() => {
        if (record) {
            // ตั้ง production mode จาก record
            const recIsProduction = record.is_production === undefined ? true : Boolean(record.is_production);
            setIsProduction(recIsProduction);

            const data = {
                record_date: formatDateForInput(record.record_date),
                nut_silo_1_level: record.nut_silo_1_level || '',
                nut_silo_2_level: record.nut_silo_2_level || '',
                nut_silo_3_level: record.nut_silo_3_level || '',
                kernel_silo_1_level: record.kernel_silo_1_level || '',
                kernel_silo_2_level: record.kernel_silo_2_level || '',
                silo_sale_big_level: record.silo_sale_big_level || '',
                silo_sale_small_level: record.silo_sale_small_level || '',
                kernel_outside_pile: record.kernel_outside_pile || '',
                moisture_percent: record.moisture_percent || '',
                shell_percent: record.shell_percent || '',
                outside_nut: record.outside_nut || '',
            };
            setFormData(data);
            calculateQuantities(data);
            // โหลดค่าล้านอก
            setNutOutside(record.outside_nut ? String(record.outside_nut) : '');
            setKernelOutside(record.kernel_outside_pile ? String(record.kernel_outside_pile) : '');
        }
    }, [record]);

    // === Fetch no-production data when mode changes or date changes ===
    useEffect(() => {
        if (!isProduction && formData.record_date) {
            fetchNoProductionData(formData.record_date);
        }
    }, [isProduction, formData.record_date]);

    const fetchNoProductionData = async (date: string) => {
        try {
            setNoProductionLoading(true);
            const res = await axios.get(`/stock/kernel/no-production-data?date=${date}`);
            if (res.data.success) {
                setNoProductionData({
                    pkn_stock: Number(res.data.pkn_stock) || 0,
                    pkn_sold: Number(res.data.pkn_sold) || 0,
                    pkn_remaining: Number(res.data.pkn_remaining) || 0,
                    shortfall: Number(res.data.shortfall) || 0,
                    silo_1_stock: Number(res.data.silo_1_stock) || 0,
                    silo_2_stock: Number(res.data.silo_2_stock) || 0,
                });
                // Reset transfer fields
                setSilo1TransferAmount(0);
                setSilo2TransferAmount(0);
            }
        } catch (err) {
            console.error('Error fetching no-production data:', err);
        } finally {
            setNoProductionLoading(false);
        }
    };

    const calculateQuantity = (level, multiplier, constant, extra = 0) => {
        if (!level || level === '') return 0;
        const levelNum = parseFloat(level);
        return isNaN(levelNum) ? 0 : (constant - levelNum) * multiplier + extra;
    };

    const calculateQuantities = (data: Record<string, string>) => {
        const q: {
            nut_silo_1: number; nut_silo_2: number; nut_silo_3: number;
            kernel_silo_1: number; kernel_silo_2: number;
            silo_sale_big: number; silo_sale_small: number;
            kernel_total: number;
        } = {
            nut_silo_1: calculateQuantity(data.nut_silo_1_level, multipliers.nut_silo_1, constants.nut_silo_1),
            nut_silo_2: calculateQuantity(data.nut_silo_2_level, multipliers.nut_silo_2, constants.nut_silo_2),
            nut_silo_3: calculateQuantity(data.nut_silo_3_level, multipliers.nut_silo_3, constants.nut_silo_3),
            kernel_silo_1: calculateQuantity(data.kernel_silo_1_level, multipliers.kernel_silo_1, constants.kernel_silo_1),
            kernel_silo_2: calculateQuantity(data.kernel_silo_2_level, multipliers.kernel_silo_2, constants.kernel_silo_2),
            silo_sale_big: calculateQuantity(data.silo_sale_big_level, multipliers.silo_sale_big, constants.silo_sale_big),
            silo_sale_small: calculateQuantity(data.silo_sale_small_level, multipliers.silo_sale_small, constants.silo_sale_small),
            kernel_total: 0,
        };

        const saleTotal = q.silo_sale_big + q.silo_sale_small;
        q.kernel_total = saleTotal > 0 ? (saleTotal / 2)+ 12 : 0;

        setCalculatedQuantities(q);
        const has = Object.values(data).some((v, i) => {
            if (['record_date', 'moisture_percent', 'shell_percent', 'kernel_outside_pile', 'outside_nut'].includes(Object.keys(data)[i])) {
                return false;
            }
            return v !== '' && v !== null;
        });
        setHasData(has);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        const updated = { ...formData, [name]: value };
        setFormData(updated);
        calculateQuantities(updated);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!isProduction) {
            const payload = {
                is_production: false,
                record_date: formData.record_date,
                silo_1_transfer_amount: silo1TransferAmount || 0,
                silo_2_transfer_amount: silo2TransferAmount || 0,
                nut_outside: parseFloat(nutOutside) || 0,
                kernel_outside: parseFloat(kernelOutside) || 0,
            };
            if (onSave) onSave(payload);
        } else {
            const payload = {
                ...formData,
                is_production: true,
                // map ไปยังชื่อเดิมใน formData
                outside_nut: nutOutside !== '' ? nutOutside : formData.outside_nut,
                kernel_outside_pile: kernelOutside !== '' ? kernelOutside : formData.kernel_outside_pile,
            };
            if (onSave) onSave(payload);
        }
    };

    const formatNumber = (num) => {
        if (typeof num !== 'number' || isNaN(num)) return '0.000';
        return num.toFixed(3);
    };

    // === Computed: PKN balance after transfer ===
    const totalTransfer = silo1TransferAmount + silo2TransferAmount;
    const computedPknAfterTransfer = noProductionData.pkn_remaining + totalTransfer;
    const silo1Remaining = noProductionData.silo_1_stock - silo1TransferAmount;
    const silo2Remaining = noProductionData.silo_2_stock - silo2TransferAmount;

    const siloFields = [
        {
            name: 'nut_silo_1_level',
            label: 'Nut Silo 1',
            icon: Nut,
            type: 'nut',
            formula: '(614 - ระดับ) × 0.0453',
            description: 'Silo หมายเลข 1'
        },
        {
            name: 'nut_silo_2_level',
            label: 'Nut Silo 2',
            icon: Nut,
            type: 'nut',
            formula: '(614 - ระดับ) × 0.0453',
            description: 'Silo หมายเลข 2'
        },
        {
            name: 'nut_silo_3_level',
            label: 'Nut Silo 3',
            icon: Nut,
            type: 'nut',
            formula: '(614 - ระดับ) × 0.0538',
            description: 'Silo หมายเลข 3'
        },
        {
            name: 'kernel_silo_1_level',
            label: 'Kernel Silo 1',
            icon: Package,
            type: 'kernel',
            formula: '(640 - ระดับ) × 0.0296',
            description: 'Silo เมล็ดในหมายเลข 1'
        },
        {
            name: 'kernel_silo_2_level',
            label: 'Kernel Silo 2',
            icon: Package,
            type: 'kernel',
            formula: '(640 - ระดับ) × 0.0296',
            description: 'Silo เมล็ดในหมายเลข 2'
        },
        {
            name: 'silo_sale_big_level',
            label: 'Silo ขาย ฝาใหญ่',
            icon: Warehouse,
            type: 'sale',
            formula: '(920 - ระดับ) × 0.228',
            description: 'Silo สำหรับขายขนาดฝาใหญ่'
        },
        {
            name: 'silo_sale_small_level',
            label: 'Silo ขาย ฝาจุก',
            icon: Warehouse,
            type: 'sale',
            formula: '(870 - ระดับ) × 0.228',
            description: 'Silo สำหรับขายขนาดฝาจุก'
        },
    ];

    const qualityFields = [
        {
            name: 'moisture_percent',
            label: '% Moisture',
            icon: Droplets,
            placeholder: '0.000',
            unit: '%'
        },
        {
            name: 'shell_percent',
            label: '% Shell',
            icon: Shield,
            placeholder: '0.000',
            unit: '%'
        },
        {
            name: 'kernel_outside_pile',
            label: 'Kernel กองนอก',
            icon: Package,
            placeholder: '0.000',
            unit: 'ตัน'
        },
        {
            name: 'outside_nut',
            label: 'NUT นอก',
            icon: TreePine,
            placeholder: '0.000',
            unit: 'ตัน'
        },
    ];

    const totalNut = calculatedQuantities.nut_silo_1 + calculatedQuantities.nut_silo_2 + calculatedQuantities.nut_silo_3;
    const totalKernel = calculatedQuantities.kernel_silo_1 + calculatedQuantities.kernel_silo_2;
    const totalSale = ((calculatedQuantities.silo_sale_big + calculatedQuantities.silo_sale_small)/2)+12;

    const getFieldColor = (type) => {
        switch (type) {
            case 'nut':
                return 'border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50/80 to-white hover:from-blue-100 shadow-sm hover:shadow-md';
            case 'kernel':
                return 'border-l-4 border-l-emerald-500 bg-gradient-to-r from-emerald-50/80 to-white hover:from-emerald-100 shadow-sm hover:shadow-md';
            case 'sale':
                return 'border-l-4 border-l-purple-500 bg-gradient-to-r from-purple-50/80 to-white hover:from-purple-100 shadow-sm hover:shadow-md';
            default:
                return 'border-l-4 border-l-gray-300 bg-gradient-to-r from-gray-50/80 to-white hover:from-gray-100 shadow-sm hover:shadow-md';
        }
    };

    const getQualityColor = (index) => {
        const colors = [
            'border-l-4 border-l-amber-500 bg-gradient-to-r from-amber-50/80 to-white hover:from-amber-100 shadow-sm hover:shadow-md',
            'border-l-4 border-l-orange-500 bg-gradient-to-r from-orange-50/80 to-white hover:from-orange-100 shadow-sm hover:shadow-md',
            'border-l-4 border-l-lime-500 bg-gradient-to-r from-lime-50/80 to-white hover:from-lime-100 shadow-sm hover:shadow-md',
            'border-l-4 border-l-rose-500 bg-gradient-to-r from-rose-50/80 to-white hover:from-rose-100 shadow-sm hover:shadow-md',
        ];
        return colors[index % colors.length];
    };

    const getIconColor = (type) => {
        switch (type) {
            case 'nut':
                return 'text-blue-600 bg-blue-100';
            case 'kernel':
                return 'text-emerald-600 bg-emerald-100';
            case 'sale':
                return 'text-purple-600 bg-purple-100';
            default:
                return 'text-gray-600 bg-gray-100';
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.5
            }
        }
    };

    return (
        <form onSubmit={handleSubmit} className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 p-4 font-anuphan">
            <div className="mx-auto max-w-7xl space-y-6">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-3xl border border-white/50 bg-white/70 p-4 shadow-2xl backdrop-blur-sm"
                >
                    <div className="flex flex-col items-start justify-between lg:flex-row lg:items-center">
                        <div className="flex items-center space-x-4">
                            <div className="rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 p-4 shadow-lg">
                                <Factory className="h-8 w-8 text-white" />
                            </div>
                            <div>
                                <h1 className="bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-2xl font-bold text-transparent lg:text-3xl">
                                    {record ? 'แก้ไขข้อมูล Silo' : 'บันทึกข้อมูล Silo ใหม่'}
                                </h1>
                                <p className="mt-2 text-sm text-gray-600 flex items-center">
                                    <Zap className="h-4 w-4 mr-1 text-amber-500" />
                                    กรอกข้อมูลระดับ Silo และดูผลลัพธ์การคำนวณแบบเรียลไทม์
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 flex w-full flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 lg:mt-0 lg:w-auto">
                            {/* Production Toggle */}
                            <div className="flex-1 rounded-2xl border border-gray-100 bg-white/80 p-4 shadow-sm backdrop-blur-sm lg:min-w-[220px]">
                                <label className="mb-3 flex items-center text-sm font-semibold text-gray-700">
                                    <Factory className="mr-2 h-4 w-4" />
                                    สถานะการผลิต
                                </label>
                                <div className="flex rounded-xl bg-gray-100 p-1">
                                    <button
                                        type="button"
                                        onClick={() => setIsProduction(true)}
                                        className={`flex flex-1 items-center justify-center space-x-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                                            isProduction
                                                ? 'bg-emerald-500 text-white shadow-md'
                                                : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                    >
                                        <Power className="h-4 w-4" />
                                        <span>ผลิต</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsProduction(false)}
                                        className={`flex flex-1 items-center justify-center space-x-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                                            !isProduction
                                                ? 'bg-red-500 text-white shadow-md'
                                                : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                    >
                                        <PowerOff className="h-4 w-4" />
                                        <span>ไม่ผลิต</span>
                                    </button>
                                </div>
                            </div>

                            {/* วันที่บันทึก */}
                            <div className="flex-1 rounded-2xl border border-gray-100 bg-white/80 p-5 shadow-sm backdrop-blur-sm lg:min-w-[220px]">
                                <label className="mb-3 flex items-center text-sm font-semibold text-gray-700">
                                    <Calendar className="mr-2 h-4 w-4" />
                                    วันที่บันทึก
                                </label>
                                <input
                                    type="date"
                                    name="record_date"
                                    value={formData.record_date}
                                    onChange={handleChange}
                                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm transition-all duration-200 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200/50"
                                />
                            </div>

                            {/* Kernel Total - always visible */}
                            {/* <motion.div
                                whileHover={{ scale: 1.02 }}
                                className={`flex-1 rounded-2xl p-5 text-center shadow-lg transition-all duration-300 lg:min-w-[200px] ${
                                    hasData
                                        ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-emerald-200'
                                        : 'bg-gray-200 text-gray-500'
                                }`}
                            >
                                <div className="mb-2 flex items-center justify-center space-x-2 text-sm font-semibold">
                                    <Calculator className="h-4 w-4" />
                                    <span>Kernel Total</span>
                                </div>
                                <div className="text-2xl font-bold lg:text-3xl">{formatNumber(calculatedQuantities.kernel_total)}</div>
                                <div className="mt-2 text-xs opacity-90">(Silo ขาย ฝาใหญ่ + ฝาจุก) / 2</div>
                            </motion.div> */}
                        </div>
                    </div>
                </motion.div>

                {/* === PRODUCTION MODE === */}
                <AnimatePresence mode="wait">
                    {isProduction ? (
                        <motion.div
                            key="production"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            {/* Main Content */}
                            <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
                                {/* Silo Levels - Left Side (3 columns) */}
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="lg:col-span-3 space-y-6"
                                >
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="rounded-3xl border border-white/50 bg-white/70 p-7 shadow-2xl backdrop-blur-sm"
                                    >
                                        <div className="flex items-center justify-between mb-7">
                                            <h2 className="flex items-center text-xl font-bold text-gray-800">
                                                <div className="mr-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 p-3">
                                                    <BarChart3 className="h-6 w-6 text-white" />
                                                </div>
                                                ระดับ Silo
                                            </h2>
                                            <button
                                                type="button"
                                                onClick={() => setShowFormula(!showFormula)}
                                                className="flex items-center space-x-2 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-200 transition-colors"
                                            >
                                                <Info className="h-4 w-4" />
                                                <span>{showFormula ? 'ซ่อนสูตร' : 'แสดงสูตร'}</span>
                                            </button>
                                        </div>

                                        <motion.div
                                            variants={containerVariants}
                                            initial="hidden"
                                            animate="visible"
                                            className="space-y-2"
                                        >
                                            {siloFields.map((field, i) => {
                                                const IconComponent = field.icon;
                                                const value = calculatedQuantities[field.name.replace('_level', '')] || 0;
                                                const hasValue = !!formData[field.name];
                                                return (
                                                    <motion.div
                                                        key={field.name}
                                                        variants={itemVariants}
                                                        className={`flex items-center justify-between rounded-2xl p-5 transition-all duration-200 ${getFieldColor(field.type)}`}
                                                    >
                                                        <div className="flex min-w-0 flex-1 items-center space-x-4">
                                                            <div className={`rounded-xl p-3 shadow-sm ${getIconColor(field.type)}`}>
                                                                <IconComponent className="h-6 w-6" />
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex items-center space-x-2">
                                                                    <div className="truncate text-sm font-semibold text-gray-700">{field.label}</div>
                                                                    {hasValue && (
                                                                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                                                                    )}
                                                                </div>
                                                                {showFormula && (
                                                                    <div className="mt-1">
                                                                        <div className="font-mono text-xs text-gray-500 bg-white/50 rounded-lg px-2 py-1 inline-block">
                                                                            {field.formula}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                <div className="mt-1 text-xs text-gray-500 truncate">{field.description}</div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center space-x-4">
                                                            <input
                                                                type="number"
                                                                step="0.001"
                                                                name={field.name}
                                                                value={formData[field.name]}
                                                                onChange={handleChange}
                                                                className="w-28 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-right text-sm font-medium transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200/50 focus:outline-none shadow-sm"
                                                                placeholder="0.00"
                                                            />
                                                            <div className="min-w-[100px] text-right">
                                                                <div className={`text-lg font-bold ${
                                                                    hasValue ? 'text-emerald-700' : 'text-gray-400'
                                                                }`}>
                                                                    {formatNumber(value)} <span className="text-xs text-gray-500 mt-1"> ตัน</span>
                                                                </div>

                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </motion.div>
                                    </motion.div>
                                </motion.div>

                                {/* Right Sidebar (1 column) */}
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="lg:col-span-2 space-y-6"
                                >
                                    {/* Quality Data */}
                                    <div className="rounded-3xl border border-white/50 bg-white/70 p-6 shadow-2xl backdrop-blur-sm">
                                        <h2 className="mb-2 flex items-center text-lg font-bold text-gray-800">
                                            <div className="mr-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 p-2.5">
                                                <Search className="h-5 w-5 text-white" />
                                            </div>
                                            ข้อมูลคุณภาพ
                                        </h2>
                                        <motion.div
                                            variants={containerVariants}
                                            initial="hidden"
                                            animate="visible"
                                            className="space-y-4"
                                        >
                                            {qualityFields.map((field, index) => {
                                                const IconComponent = field.icon;
                                                return (
                                                    <motion.div
                                                        key={field.name}
                                                        variants={itemVariants}
                                                        className={`rounded-2xl p-4 transition-all duration-200 ${getQualityColor(index)}`}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center space-x-3">
                                                                <div className="rounded-lg bg-white p-2 shadow-sm">
                                                                    <IconComponent className="h-4 w-4 text-gray-700" />
                                                                </div>
                                                                <div>
                                                                    <div className="text-sm font-semibold text-gray-700">{field.label}</div>
                                                                </div>
                                                            </div>
                                                            <div className="relative">
                                                                <input
                                                                    type="number"
                                                                    step="0.001"
                                                                    name={field.name}
                                                                    value={formData[field.name]}
                                                                    onChange={handleChange}
                                                                    className="w-32 rounded-xl border border-gray-200 bg-white px-6 py-2 text-right text-sm font-medium transition-all duration-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200/50 focus:outline-none shadow-sm"
                                                                    placeholder={field.placeholder}
                                                                />
                                                                {field.unit && (
                                                                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
                                                                        {field.unit}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </motion.div>
                                    </div>

                                    {/* Summary Results */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 }}
                                        className="rounded-3xl bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white shadow-2xl"
                                    >
                                        <h3 className="mb-4 flex items-center text-lg font-bold">
                                            <TrendingUp className="mr-3 h-5 w-5" />
                                            สรุปผลลัพธ์
                                        </h3>
                                        <div className="space-y-3">
                                            <div className="rounded-2xl bg-white/20 p-4 backdrop-blur-sm">
                                                <div className="flex items-center justify-between">
                                                    <div className="text-sm opacity-90">Nut Total</div>
                                                    <div className="text-right">
                                                        <div className="text-lg font-bold">{formatNumber(totalNut)}</div>
                                                        <div className="text-xs opacity-80">Silo 1-3 รวม</div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="rounded-2xl bg-white/20 p-4 backdrop-blur-sm">
                                                <div className="flex items-center justify-between">
                                                    <div className="text-sm opacity-90">Kernel Total</div>
                                                    <div className="text-right">
                                                        <div className="text-lg font-bold">{formatNumber(totalKernel)}</div>
                                                        <div className="text-xs opacity-80">Silo 1-2 รวม</div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="rounded-2xl bg-white/20 p-4 backdrop-blur-sm">
                                                <div className="flex items-center justify-between">
                                                    <div className="text-sm opacity-90">Sale Total</div>
                                                    <div className="text-right">
                                                        <div className="text-lg font-bold">{formatNumber(totalSale)}</div>
                                                        <div className="text-xs opacity-80">((ฝาใหญ่ + ฝาจุก ) / 2 ) + 12</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                </motion.div>
                            </div>
                        </motion.div>
                    ) : (
                        /* === NO PRODUCTION MODE === */
                        <motion.div
                            key="no-production"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-6"
                        >
                            {/* Status Banner */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="rounded-3xl border-2 border-red-200 bg-gradient-to-r from-red-50 via-orange-50 to-amber-50 p-6 shadow-xl"
                            >
                                <div className="flex items-center space-x-3 mb-4">
                                    <div className="rounded-xl bg-red-100 p-3">
                                        <PowerOff className="h-6 w-6 text-red-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-red-800">โหมดไม่ผลิต</h2>
                                        <p className="text-sm text-red-600">จัดการ stock PKN จากยอด stock วันก่อนหน้าและยอดขายวันนี้</p>
                                    </div>
                                </div>

                                {noProductionLoading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-200 border-t-red-500"></div>
                                        <span className="ml-3 text-gray-600">กำลังโหลดข้อมูล...</span>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {/* PKN Stock */}
                                        <div className="rounded-2xl bg-white p-5 shadow-md border border-blue-100">
                                            <div className="flex items-center space-x-2 mb-2">
                                                <Package className="h-5 w-5 text-blue-600" />
                                                <span className="text-sm font-semibold text-gray-700">Stock PKN (วันก่อน)</span>
                                            </div>
                                            <div className="text-3xl font-bold text-blue-700">{formatNumber(noProductionData.pkn_stock)}</div>
                                            <div className="text-xs text-gray-500 mt-1">ตัน</div>
                                        </div>

                                        {/* PKN Sold */}
                                        <div className="rounded-2xl bg-white p-5 shadow-md border border-orange-100">
                                            <div className="flex items-center space-x-2 mb-2">
                                                <TrendingUp className="h-5 w-5 text-orange-600" />
                                                <span className="text-sm font-semibold text-gray-700">ยอดขาย PKN</span>
                                            </div>
                                            <div className="text-3xl font-bold text-orange-700">{formatNumber(noProductionData.pkn_sold)}</div>
                                            <div className="text-xs text-gray-500 mt-1">ตัน</div>
                                        </div>

                                        {/* PKN Remaining */}
                                        <div className={`rounded-2xl bg-white p-5 shadow-md border ${
                                            noProductionData.pkn_remaining >= 0 ? 'border-emerald-100' : 'border-red-200'
                                        }`}>
                                            <div className="flex items-center space-x-2 mb-2">
                                                {noProductionData.pkn_remaining >= 0 ? (
                                                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                                                ) : (
                                                    <AlertCircle className="h-5 w-5 text-red-600" />
                                                )}
                                                <span className="text-sm font-semibold text-gray-700">ส่วนต่าง</span>
                                            </div>
                                            <div className={`text-3xl font-bold ${
                                                noProductionData.pkn_remaining >= 0 ? 'text-emerald-700' : 'text-red-700'
                                            }`}>
                                                {formatNumber(noProductionData.pkn_remaining)}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {noProductionData.pkn_remaining >= 0 ? 'PKN เพียงพอ ✓' : `ขาดอีก ${formatNumber(noProductionData.shortfall)} ตัน`}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </motion.div>

                            {/* Silo Transfer Section - Show when PKN is insufficient */}
                            {noProductionData.shortfall > 0 && !noProductionLoading && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="rounded-3xl border-2 border-amber-200 bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 p-6 shadow-xl"
                                >
                                    <div className="flex items-center space-x-3 mb-6">
                                        <div className="rounded-xl bg-amber-100 p-3">
                                            <ArrowRightLeft className="h-6 w-6 text-amber-700" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-amber-800">ดึงยอดจาก Silo</h3>
                                            <p className="text-sm text-amber-600">PKN ไม่พอขาย — เลือก Silo ที่ต้องการดึงยอดมาเติม PKN</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        {/* Silo 1 */}
                                        <div className="rounded-2xl bg-white p-5 shadow-md border border-emerald-100">
                                            <div className="flex items-center space-x-2 mb-3">
                                                <Package className="h-5 w-5 text-emerald-600" />
                                                <span className="text-sm font-semibold text-gray-700">Kernel Silo 1</span>
                                                <span className="ml-auto text-xs text-gray-500">มี {formatNumber(noProductionData.silo_1_stock)} ตัน</span>
                                            </div>
                                            <input
                                                type="number"
                                                step="0.001"
                                                min="0"
                                                max={noProductionData.silo_1_stock}
                                                value={silo1TransferAmount || ''}
                                                onChange={(e) => setSilo1TransferAmount(Number(e.target.value) || 0)}
                                                className="w-full rounded-xl border border-emerald-200 bg-emerald-50/50 px-4 py-3 text-lg font-bold text-emerald-800 transition-all duration-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200/50 focus:outline-none"
                                                placeholder="0.000"
                                            />
                                            {silo1TransferAmount > noProductionData.silo_1_stock && (
                                                <p className="mt-1 text-xs text-red-500 font-semibold">⚠ เกินยอดใน Silo 1!</p>
                                            )}
                                            <p className="mt-1 text-xs text-gray-500">คงเหลือ: {formatNumber(silo1Remaining)} ตัน</p>
                                        </div>

                                        {/* Silo 2 */}
                                        <div className="rounded-2xl bg-white p-5 shadow-md border border-emerald-100">
                                            <div className="flex items-center space-x-2 mb-3">
                                                <Package className="h-5 w-5 text-emerald-600" />
                                                <span className="text-sm font-semibold text-gray-700">Kernel Silo 2</span>
                                                <span className="ml-auto text-xs text-gray-500">มี {formatNumber(noProductionData.silo_2_stock)} ตัน</span>
                                            </div>
                                            <input
                                                type="number"
                                                step="0.001"
                                                min="0"
                                                max={noProductionData.silo_2_stock}
                                                value={silo2TransferAmount || ''}
                                                onChange={(e) => setSilo2TransferAmount(Number(e.target.value) || 0)}
                                                className="w-full rounded-xl border border-emerald-200 bg-emerald-50/50 px-4 py-3 text-lg font-bold text-emerald-800 transition-all duration-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200/50 focus:outline-none"
                                                placeholder="0.000"
                                            />
                                            {silo2TransferAmount > noProductionData.silo_2_stock && (
                                                <p className="mt-1 text-xs text-red-500 font-semibold">⚠ เกินยอดใน Silo 2!</p>
                                            )}
                                            <p className="mt-1 text-xs text-gray-500">คงเหลือ: {formatNumber(silo2Remaining)} ตัน</p>
                                        </div>
                                    </div>

                                    {/* Preview Result */}
                                    {(silo1TransferAmount > 0 || silo2TransferAmount > 0) && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 p-5 text-white shadow-lg"
                                        >
                                            <h4 className="text-sm font-semibold opacity-90 mb-3">ผลลัพธ์หลังดึงยอด</h4>
                                            <div className="grid grid-cols-3 gap-3">
                                                <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
                                                    <div className="text-xs opacity-80">PKN ใหม่</div>
                                                    <div className={`text-xl font-bold ${computedPknAfterTransfer < 0 ? 'text-red-300' : ''}`}>
                                                        {formatNumber(computedPknAfterTransfer)}
                                                    </div>
                                                </div>
                                                <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
                                                    <div className="text-xs opacity-80">Silo 1 คงเหลือ</div>
                                                    <div className={`text-xl font-bold ${silo1Remaining < 0 ? 'text-red-300' : ''}`}>
                                                        {formatNumber(silo1Remaining)}
                                                    </div>
                                                </div>
                                                <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
                                                    <div className="text-xs opacity-80">Silo 2 คงเหลือ</div>
                                                    <div className={`text-xl font-bold ${silo2Remaining < 0 ? 'text-red-300' : ''}`}>
                                                        {formatNumber(silo2Remaining)}
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </motion.div>
                            )}

                            {/* PKN Sufficient - simple confirmation */}
                            {noProductionData.shortfall === 0 && noProductionData.pkn_sold > 0 && !noProductionLoading && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="rounded-3xl border-2 border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50 p-6 shadow-xl"
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className="rounded-xl bg-emerald-100 p-3">
                                            <CheckCircle className="h-6 w-6 text-emerald-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-emerald-800">PKN เพียงพอสำหรับขาย</h3>
                                            <p className="text-sm text-emerald-600">
                                                คงเหลือหลังหักยอดขาย: <strong>{formatNumber(noProductionData.pkn_remaining)}</strong> ตัน — สามารถบันทึกได้เลย
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* NUT กองนอก / Kernel กองนอก */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="rounded-3xl border-2 border-gray-200 bg-gradient-to-r from-gray-50 to-slate-50 p-6 shadow-xl"
                            >
                                <div className="flex items-center space-x-3 mb-5">
                                    <div className="rounded-xl bg-gray-100 p-3">
                                        <Warehouse className="h-6 w-6 text-gray-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-800">ข้อมูลกองนอก</h3>
                                        <p className="text-sm text-gray-500">บันทึก NUT และ Kernel กองนอก (อัปเดตลง stock)</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* NUT กองนอก */}
                                    <div className="rounded-2xl bg-white p-5 shadow-md border border-amber-100">
                                        <div className="flex items-center space-x-2 mb-3">
                                            <Nut className="h-5 w-5 text-amber-600" />
                                            <span className="text-sm font-semibold text-gray-700">NUT กองนอก</span>
                                        </div>
                                        <input
                                            type="number"
                                            step="0.001"
                                            min="0"
                                            value={nutOutside}
                                            onChange={(e) => setNutOutside(e.target.value)}
                                            className="w-full rounded-xl border border-amber-200 bg-amber-50/50 px-4 py-3 text-lg font-bold text-amber-800 transition-all duration-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200/50 focus:outline-none"
                                            placeholder="0.000"
                                        />
                                        <p className="mt-1 text-xs text-gray-500">ตัน</p>
                                    </div>

                                    {/* Kernel กองนอก */}
                                    <div className="rounded-2xl bg-white p-5 shadow-md border border-purple-100">
                                        <div className="flex items-center space-x-2 mb-3">
                                            <Package className="h-5 w-5 text-purple-600" />
                                            <span className="text-sm font-semibold text-gray-700">Kernel กองนอก</span>
                                        </div>
                                        <input
                                            type="number"
                                            step="0.001"
                                            min="0"
                                            value={kernelOutside}
                                            onChange={(e) => setKernelOutside(e.target.value)}
                                            className="w-full rounded-xl border border-purple-200 bg-purple-50/50 px-4 py-3 text-lg font-bold text-purple-800 transition-all duration-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200/50 focus:outline-none"
                                            placeholder="0.000"
                                        />
                                        <p className="mt-1 text-xs text-gray-500">ตัน</p>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}

                </AnimatePresence>

                {/* Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="flex flex-col space-y-4 border-t border-gray-200/50 pt-2 sm:flex-row sm:justify-between sm:space-y-0"
                >
                    <div className="flex items-center text-sm text-gray-500">
                        {isProduction ? (
                            hasData ? (
                                <>
                                    <div className="mr-2 h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                    ✅ ระบบพร้อมบันทึกข้อมูลทั้งหมด
                                </>
                            ) : (
                                <>
                                    <div className="mr-2 h-2 w-2 rounded-full bg-amber-500"></div>
                                    📝 กรุณากรอกข้อมูลระดับ Silo อย่างน้อย 1 ช่อง
                                </>
                            )
                        ) : (
                            <>
                                <div className="mr-2 h-2 w-2 rounded-full bg-red-500"></div>
                                🔴 โหมดไม่ผลิต — จะอัปเดต stock PKN ตามยอดขาย
                            </>
                        )}
                    </div>
                    <div className="flex space-x-3">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="button"
                            onClick={onCancel}
                            className="flex items-center rounded-2xl border-2 border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition-all duration-200 hover:border-gray-400 hover:bg-gray-50 hover:shadow-lg"
                        >
                            <X className="mr-2 h-4 w-4" />
                            ยกเลิก
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: (isProduction ? hasData : true) ? 1.05 : 1 }}
                            whileTap={{ scale: (isProduction ? hasData : true) ? 0.95 : 1 }}
                            type="submit"
                            disabled={isProduction && !hasData}
                            className={`flex items-center rounded-2xl px-8 py-3 font-semibold transition-all duration-200 ${
                                (isProduction ? hasData : true)
                                    ? isProduction
                                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg hover:shadow-xl'
                                        : 'bg-gradient-to-r from-red-500 to-orange-600 text-white shadow-lg hover:shadow-xl'
                                    : 'cursor-not-allowed bg-gray-300 text-gray-500'
                            }`}
                        >
                            <Save className="mr-2 h-4 w-4" />
                            {record ? 'อัพเดท' : 'บันทึก'}
                            {!isProduction && ' (ไม่ผลิต)'}
                        </motion.button>
                    </div>
                </motion.div>
            </div>
        </form>
    );
};

export default SiloRecordForm;
