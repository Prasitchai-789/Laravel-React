// @ts-nocheck
import { usePage } from '@inertiajs/react';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import { Beaker, CheckSquare, Filter, FlaskConical, Save, Waves } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { CPORecord } from './CPORecordList';

import OilRoomSection from '../components/form/OilRoomSection';
import TankQualitySection from '../components/form/TankQualitySection';
import TankSection from '../components/form/TankSection';
import TankSectionNoProduction from '../components/form/TankSectionNoProduction';
import TankSelector from '../components/form/TankSelector';
import TotalCPOSummary from '../components/form/TotalCPOSummary';
import ProductionSwitch from '../components/ProductionSwitch';
interface CPORecordFormProps {
    record?: CPORecord | null;
    onSave: (data: any) => void;
    onCancel: () => void;
}

const CPORecordForm = ({ record, onSave, onCancel }: CPORecordFormProps) => {
    const { props } = usePage();

    // helper ปลอดภัยสำหรับ parse number
    const safeParseNumber = (value: any): number | null => {
        if (value === null || value === undefined) return null;

        // แปลง input เป็น string ปลอดภัย
        const v = String(value).replace(/,/g, '').trim();

        // ป้องกัน 'null', '-', ''
        if (v === '' || v.toLowerCase() === 'null' || v === '-') return null;

        // ถ้าเป็นตัวเลขล้วนหรือทศนิยม
        const num = Number(v);
        return isNaN(num) ? null : num;
    };

    const densityData = props.cpoDensityRef?.map((item) => [safeParseNumber(item.temperature_c), safeParseNumber(item.density)]) || [];

    const tankData =
        props.cpoTankInfo?.map((item) => ({
            tank_no: safeParseNumber(item.tank_no),
            height_m: safeParseNumber(item.height_m),
            volume_m3: safeParseNumber(item.volume_m3),
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
            const tanksArray = Array.isArray(record.tanks) ? record.tanks : Array.from(record.tanks as any);
            return tanksArray.map((t: any) => t.tank_no).filter((no: number) => [1, 2, 3, 4].includes(no));
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
                      sale: '',
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
                      sale: '',
                  }));

        return {
            date: getYesterdayDate(),
            purge_system_status: false,
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
                purge_system: '',
                adjustment: '',
            },
        };
    };

    const [formData, setFormData] = useState(() => createInitialFormData());
    const [isProducing, setIsProducing] = useState(true);

    // ใช้ useRef เพื่อเก็บค่า input ก่อน re-render
    const inputRefs = useRef<{ [key: string]: HTMLInputElement }>({});

    // ฟังก์ชันสำหรับเก็บ reference ของ input
    const setInputRef = (tankIndex: number, fieldName: string) => (el: HTMLInputElement | null) => {
        if (el) {
            inputRefs.current[`${tankIndex}-${fieldName}`] = el;
        }
    };

    // ฟังก์ชันตรวจสอบและฟอร์แมตค่าตัวเลข
    const formatNumberInput = (value: string, allowDecimal: boolean = true) => {
        if (value == null) return '';

        // ตัดช่องว่างและคอมม่าออกก่อน
        let formatted = String(value).replace(/,/g, '').trim();

        // อนุญาตเฉพาะตัวเลขและจุดทศนิยม
        formatted = formatted.replace(/[^\d.]/g, '');

        // อนุญาตให้มีจุดเดียว
        const parts = formatted.split('.');
        if (parts.length > 2) {
            formatted = parts[0] + '.' + parts.slice(1).join('');
        }

        // ถ้าไม่อนุญาตทศนิยม ให้ลบจุดออก
        if (!allowDecimal) {
            formatted = formatted.replace(/\./g, '');
        }

        return formatted;
    };

    // ดึงค่าความหนาแน่นจาก temp (รองรับทศนิยม และ data จาก props)
    const getDensityByTemperature = useCallback(
        (temperature: number | null) => {
            if (temperature == null) return null;

            const tempRounded = Math.round(temperature);

            const densityItem = densityData.find(([t]) => {
                return safeParseNumber(t) === tempRounded;
            });

            return densityItem ? densityItem[1] : null;
        },
        [densityData],
    );

    // คำนวณปริมาตร CPO (กัน NaN / null / string)
    const calculateCPOVolume = useCallback(
        (tankNo: number, oilLevel: string, temperature: string) => {
            const lvl = safeParseNumber(oilLevel);
            const tempVal = safeParseNumber(temperature);

            if (lvl == null || tempVal == null) return '';

            const tankInfo = tankData.find((t) => t.tank_no === tankNo);
            if (!tankInfo) return '';

            const density = getDensityByTemperature(tempVal);
            if (density == null) return '';

            const height = tankInfo.height_m;
            const vol = tankInfo.volume_m3;

            if (height == null || vol == null || height === 0) return '';

            const volumePerCm = (vol * density) / (height * 100);
            const totalVolume = lvl * volumePerCm;

            return Number(totalVolume).toFixed(3);
        },
        [getDensityByTemperature, tankData],
    );

    // คำนวณ Total CPO จากปริมาณ CPO ของทุกแทงค์ที่เลือก (กัน NaN)
    const calculateTotalCPO = useCallback(
        (tanks: any[]) => {
            const total = tanks
                .filter((tank) => selectedTanks.includes(Number(tank.tank_no)))
                .reduce((sum, tank) => {
                    const v = safeParseNumber(tank.cpo_volume);
                    return sum + (v === null ? 0 : v);
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
                        tank.cpo_volume = calculateCPOVolume(tank.tank_no, tank.oil_level, tank.temperature);
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
            const newSelectedTanks = prev.includes(tankNo) ? prev.filter((t) => t !== tankNo) : [...prev, tankNo];

            // คำนวณ Total CPO ใหม่เมื่อมีการเปลี่ยนการเลือกแทงค์ โดยใช้ selected ใหม่
            setFormData((prevFormData) => {
                const totalCPO = tanksTotalWithSelection(prevFormData.tanks, newSelectedTanks);
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

    // helper ใช้คำนวณ total จากแทงค์ตาม selectedTanks ที่ส่งมา (ป้องกันค่า stale ใน useCallback)
    const tanksTotalWithSelection = (tanks: any[], selected: number[]): string => {
        const total = tanks
            .filter((tank) => selected.includes(Number(tank.tank_no)))
            .reduce((sum, tank) => {
                const v = safeParseNumber(tank.cpo_volume);
                return sum + (v === null ? 0 : v);
            }, 0);

        return total > 0 ? total.toFixed(3) : '';
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
            setSelectedTanks([1, 2]);
            setIsProducing(true);
            return;
        }

        const initialData = createInitialFormData();
        const isNoProduction = record.production_mode === 'no_production';

        // ---- แก้วันที่ ----
        if (record.date) {
            initialData.date = formatDateForInput(record.date);
        }
        initialData.purge_system_status = Boolean(record.purge_system_status);

        // ---- MAP TANKS ----
        const tankNumbers = [1, 2, 3, 4];

        tankNumbers.forEach((no) => {
            const idx = initialData.tanks.findIndex((t: any) => t.tank_no === no);
            if (idx === -1) return;

            const cpoVolume = record[`tank${no}_cpo_volume`] ? Number(record[`tank${no}_cpo_volume`]) : 0;
            const sale = record[`tank${no}_sale`] ? Number(record[`tank${no}_sale`]) : 0;
            const temperature = record[`tank${no}_temperature`] ? Number(record[`tank${no}_temperature`]) : 0;
            const oilLevel = record[`tank${no}_oil_level`] ? Number(record[`tank${no}_oil_level`]) : 0;

            // คำนวณ prev_cpo = cpo_volume + sale (เพราะ cpo_volume ที่บันทึกคือ หลังหักขาย)
            const prevCpo = isNoProduction ? (cpoVolume + sale) : 0;

            initialData.tanks[idx] = {
                tank_no: no,
                oil_level: oilLevel || '',
                temperature: temperature || '',
                cpo_volume: cpoVolume ? cpoVolume.toFixed(3) : '',
                ffa: record[`tank${no}_ffa`] ?? '',
                moisture: record[`tank${no}_moisture`] ?? '',
                dobi: record[`tank${no}_dobi`] ?? '',
                top_ffa: record[`tank${no}_top_ffa`] ?? '',
                top_moisture: record[`tank${no}_top_moisture`] ?? '',
                top_dobi: record[`tank${no}_top_dobi`] ?? '',
                bottom_ffa: record[`tank${no}_bottom_ffa`] ?? '',
                bottom_moisture: record[`tank${no}_bottom_moisture`] ?? '',
                bottom_dobi: record[`tank${no}_bottom_dobi`] ?? '',
                sale: sale || '',
                // ข้อมูลสำหรับโหมดไม่ผลิต
                prev_cpo: prevCpo,
                prev_temp: temperature,
                cpo_after_sale: cpoVolume,
                cm_after_calc: oilLevel,
            };
        });

        // ---- MAP OIL ROOM ----
        initialData.oil_room = {
            total_cpo: record.total_cpo ? Number(record.total_cpo).toFixed(3) : '',
            ffa_cpo: record.ffa_cpo ?? '',
            dobi_cpo: record.dobi_cpo ?? '',
            cs1_cm: record.cs1_cm ?? '',
            undilute_1: record.undilute_1 ?? '',
            undilute_2: record.undilute_2 ?? '',
            setting: record.setting ?? '',
            clean_oil: record.clean_oil ?? '',
            skim: record.skim ?? '',
            mix: record.mix ?? '',
            loop_back: record.loop_back ?? '',
            purge_system: record.purge_system ?? '',
            adjustment: record.adjustment ?? '',
        };

        // ---- SET FORM ----
        setFormData(initialData);

        // ---- SET PRODUCTION MODE ----
        setIsProducing(!isNoProduction);

        // ---- SELECT TANKS ที่มีข้อมูล ----
        const tanksSelected = tankNumbers.filter((no) => record[`tank${no}_oil_level`] !== null && record[`tank${no}_oil_level`] !== undefined);
        setSelectedTanks(tanksSelected);
    }, [record]);

    // ดึงข้อมูล Skim/Mix prefill เมื่อสร้างใหม่ (ไม่ใช่ edit)
    const loadSkimMixPrefill = async (date: string) => {
        try {
            const res = await axios.get('/skim-mix/prefill', { params: { date } });
            if (res.data.success && res.data.has_data) {
                setFormData((prev) => {
                    const updatedTanks = [...prev.tanks];
                    // อัพเดท Tank 1
                    const tank1Index = updatedTanks.findIndex((t) => t.tank_no === 1);
                    if (tank1Index !== -1 && res.data.tank1_oil_level !== null) {
                        const oilLevel = String(res.data.tank1_oil_level);
                        const temperature = String(res.data.tank1_temperature);
                        const cpoVolume = res.data.tank1_cpo_volume ? Number(res.data.tank1_cpo_volume).toFixed(3) : '';
                        updatedTanks[tank1Index] = {
                            ...updatedTanks[tank1Index],
                            oil_level: oilLevel,
                            temperature: temperature,
                            cpo_volume: cpoVolume,
                        };
                    }

                    // คำนวณ totalCPO ใหม่
                    const totalCPO = updatedTanks
                        .filter((tank) => selectedTanks.includes(Number(tank.tank_no)))
                        .reduce((sum, tank) => {
                            const v = safeParseNumber(tank.cpo_volume);
                            return sum + (v === null ? 0 : v);
                        }, 0);

                    return {
                        ...prev,
                        tanks: updatedTanks,
                        oil_room: {
                            ...prev.oil_room,
                            total_cpo: totalCPO > 0 ? totalCPO.toFixed(3) : '',
                            skim: res.data.skim_total ? String(res.data.skim_total) : '',
                            mix: res.data.mix_total ? String(res.data.mix_total) : '',
                        },
                    };
                });
            }
        } catch (err) {
            console.error('loadSkimMixPrefill error', err);
        }
    };

    // เรียก prefill เมื่อสร้างใหม่ หรือเมื่อเปลี่ยนวันที่ (เฉพาะ create mode)
    useEffect(() => {
        if (!record && formData.date) {
            loadSkimMixPrefill(formData.date);
        }
    }, [record, formData.date]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // สร้างข้อมูลสำหรับส่งไป backend
        let totalCPO = 0;
        
        const updatedTanks = formData.tanks.map((tank: any, index: number) => {
            const tankNo = tank.tank_no;
            const isSelected = selectedTanks.includes(tankNo);
            
            // ถ้าแทงค์ไม่ถูกเลือก ให้ค่าเป็น null ทั้งหมด
            if (!isSelected) {
                return {
                    ...tank,
                    oil_level: null,
                    temperature: null,
                    cpo_volume: null,
                    sale: null,
                    ffa: null,
                    moisture: null,
                    dobi: null,
                    top_ffa: null,
                    top_moisture: null,
                    top_dobi: null,
                    bottom_ffa: null,
                    bottom_moisture: null,
                    bottom_dobi: null,
                };
            }
            
            // ถ้าเป็นโหมดไม่ผลิต
            if (!isProducing) {
                const oilLevel = tank.cm_after_calc || tank.oil_level || 0;
                const temperature = tank.prev_temp || tank.temperature || 0;
                const cpoVolume = tank.cpo_after_sale || tank.cpo_volume || 0;
                const sale = tank.sale || 0;
                
                totalCPO += Number(cpoVolume) || 0;
                
                return {
                    ...tank,
                    oil_level: oilLevel,
                    temperature: temperature,
                    cpo_volume: cpoVolume,
                    sale: sale,
                };
            }
            
            // โหมดผลิต
            totalCPO += Number(tank.cpo_volume) || 0;
            
            return {
                ...tank,
                sale: null, // โหมดผลิตไม่มียอดขาย
            };
        });
        
        const submitData = {
            ...formData,
            purge_system_status: Boolean(formData.purge_system_status),
            production_mode: isProducing ? 'production' : 'no_production',
            tanks: updatedTanks,
            oil_room: {
                ...formData.oil_room,
                total_cpo: totalCPO.toFixed(3),
            },
        };
        
        if (onSave) onSave(submitData);
    };

    const isTankSelected = (tankNo: number) => selectedTanks.includes(tankNo);

    // คำนวณรายละเอียด Total CPO (กัน tank.volume undefined)
    const getTotalCPODetails = () => {
        const tankDetails = formData.tanks
            .filter((tank: any) => {
                if (!selectedTanks.includes(tank.tank_no)) return false;
                
                // สำหรับโหมดไม่ผลิต ตรวจสอบ cpo_after_sale
                if (!isProducing) {
                    return tank.cpo_after_sale !== null && 
                           tank.cpo_after_sale !== undefined &&
                           String(tank.cpo_after_sale).trim() !== '';
                }
                
                // สำหรับโหมดผลิต ตรวจสอบ cpo_volume
                return tank.cpo_volume !== null &&
                       tank.cpo_volume !== undefined &&
                       String(tank.cpo_volume).trim() !== '';
            })
            .map((tank: any) => {
                // ใช้ cpo_after_sale ในโหมดไม่ผลิต, cpo_volume ในโหมดผลิต
                const volume = isProducing 
                    ? (safeParseNumber(tank.cpo_volume) ?? 0)
                    : (safeParseNumber(tank.cpo_after_sale) ?? 0);
                    
                return {
                    tank_no: tank.tank_no,
                    volume,
                    oil_level: isProducing ? tank.oil_level : tank.cm_after_calc,
                    temperature: tank.temperature,
                };
            });

        const totalVolume = tankDetails.reduce((sum: number, tank: any) => sum + (isNaN(tank.volume) ? 0 : tank.volume), 0);

        return {
            tankDetails,
            totalVolume,
            tankCount: tankDetails.length,
        };
    };

    const totalCPODetails = getTotalCPODetails();

    // โหลดข้อมูลวันก่อนหน้าเพื่อนำมาใช้ตอน "ไม่ผลิต"
    useEffect(() => {
        if (!isProducing && formData.date) {
            loadPreviousDayData();
        }
    }, [isProducing, formData.date]);

    const handleSwitchMode = (v: boolean) => {
        setIsProducing(v);
        // ไม่ต้อง loadPreviousDayData() ตรงนี้แล้ว เพราะ useEffect จะทำงานเอง
    };

    const loadPreviousDayData = async () => {
        try {
            const res = await fetch(`/cpo/previous/date/${formData.date}`);
            const result = await res.json();

            if (!result.success) return;

            // 🔥 แปลง key ของ tanks เป็นตัวเลข
            const tankMap = Object.fromEntries(Object.entries(result.tanks).map(([k, v]) => [Number(k), v]));

            const saleTon = Number(result.sales || 0) / 1000; // kg → ton

            setFormData((prev) => {
                const updated = { ...prev };

                updated.tanks = prev.tanks.map((t) => {
                    const item = tankMap[t.tank_no] || {};

                    const prevCPO = Number(item.prev_cpo || 0);
                    const prevTemp = Number(item.prev_temp || 0);

                    // คงเหลือหลังขาย (ลบครั้งเดียวทุกแทงค์)
                    const afterSale = prevCPO - saleTon;

                    // 🔥 คำนวณระดับน้ำมัน (cm.) จากสูตร Reverse จริง
                    const cm = reverseCalculateOilLevel(t.tank_no, afterSale.toString(), prevTemp.toString());

                    return {
                        ...t,
                        prev_cpo: prevCPO,
                        prev_temp: prevTemp,
                        sale: saleTon,
                        cpo_after_sale: afterSale,
                        cm_after_calc: cm, // ←🔥 ใส่เลยทันที ไม่ต้องรอ Tank 1
                    };
                });

                return updated;
            });
        } catch (err) {
            console.error('❌ loadPreviousDayData error', err);
        }
    };

    const handleNoProductionChange = (index: number, field: string, value: string) => {
        setFormData((prev) => {
            const tanks = [...prev.tanks];
            tanks[index] = {
                ...tanks[index],
                [field]: value,
            };

            const prevCPO = Number(tanks[index].prev_cpo || 0);
            const sale = Number(tanks[index].sale || 0);

            // คำนวณคงเหลือ
            const afterSale = prevCPO - sale;
            tanks[index].cpo_after_sale = afterSale;

            // Reverse → คำนวณระดับน้ำมัน
            const temp = Number(tanks[index].prev_temp || 0);

            tanks[index].cm_after_calc = reverseCalculateOilLevel(tanks[index].tank_no, afterSale.toString(), temp.toString());

            return { ...prev, tanks };
        });
    };

    const reverseCalculateOilLevel = useCallback(
        (tankNo: number, cpoVolume: string, temperature: string) => {
            const volVal = safeParseNumber(cpoVolume);
            const tempVal = safeParseNumber(temperature);

            if (volVal == null || tempVal == null) return '';

            const tankInfo = tankData.find((t) => t.tank_no === tankNo);
            if (!tankInfo) return '';

            const density = getDensityByTemperature(tempVal);
            if (density == null) return '';

            const height = tankInfo.height_m;
            const vol = tankInfo.volume_m3;

            if (!height || !vol) return '';

            const cm = (volVal * height * 100) / (vol * density);

            return Number(cm).toFixed(2);
        },
        [getDensityByTemperature, tankData],
    );

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
                                        {record ? 'แก้ไขข้อมูล Stock CPO' : 'บันทึกข้อมูล Stock CPO'}
                                    </h1>
                                    <p className="mt-1 text-sm text-blue-100/90">ระบบบันทึกข้อมูลน้ำมันปาล์มดิบแบบเรียลไทม์</p>
                                </div>
                            </div>
                            <div className="rounded-xl border border-white/20 bg-white/20 px-4 py-2 text-white backdrop-blur-sm">
                                <span className="text-sm text-blue-100/90">วันที่บันทึก:</span>
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
                            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-2 flex items-center space-x-3">
                                <div className="rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 p-2 shadow-lg">
                                    <CheckSquare className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800">เลือกแทงค์ที่ต้องการบันทึกข้อมูล</h2>
                                    <p className="text-sm text-gray-600">เลือกแทงค์ที่ต้องการบันทึกข้อมูลน้ำมันปาล์มดิบ</p>
                                </div>
                            </motion.div>

                            <TankSelector selectedTanks={selectedTanks} onSelect={toggleTankSelection} />
                        </div>

                        {/* Tanks Data Section */}
                        <div className="mb-6">
                            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-4 flex items-center space-x-3">
                                <div className="rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 p-2 shadow-lg">
                                    <Beaker className="h-6 w-6 text-white" />
                                </div>
                                <div className="flex items-center space-x-4">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-800">ข้อมูลแทงค์น้ำมัน</h2>
                                        <p className="text-sm text-gray-600">กรอกข้อมูลน้ำมันปาล์มดิบในแทงค์ที่เลือก</p>
                                    </div>
                                    <span className="rounded-full bg-gradient-to-r from-green-100 to-emerald-100 px-4 py-1.5 text-sm font-medium text-green-700 shadow-sm">
                                        {selectedTanks.length} แทงค์ที่เลือก
                                    </span>
                                </div>
                            </motion.div>
                            <ProductionSwitch isProducing={isProducing} onChange={handleSwitchMode} />

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
                                                {isProducing ? (
                                                    <TankSection
                                                        tankNo={tank.tank_no}
                                                        oilLevel={tank.oil_level}
                                                        temperature={tank.temperature}
                                                        cpoVolume={tank.cpo_volume}
                                                        onFieldChange={(field, v) =>
                                                            handleTankChange(tankIndex, field.replace(`tank${tank.tank_no}_`, ''), v)
                                                        }
                                                        onRemove={() => toggleTankSelection(tank.tank_no)}
                                                    />
                                                ) : (
                                                    <TankSectionNoProduction
                                                        tankNo={tank.tank_no}
                                                        sale={tank.sale}
                                                        previousCPO={tank.prev_cpo}
                                                        previousTemp={tank.prev_temp}
                                                        resultCPO={tank.cpo_after_sale}
                                                        resultOilLevel={tank.cm_after_calc}
                                                        onChange={(field, value) => handleNoProductionChange(tankIndex, field, value)}
                                                    />
                                                )}

                                                {/* Quality Data */}
                                                <TankQualitySection
                                                    tankNo={tank.tank_no}
                                                    fields={{
                                                        ffa: tank.ffa,
                                                        moisture: tank.moisture,
                                                        dobi: tank.dobi,

                                                        // Top
                                                        top_ffa: tank.top_ffa,
                                                        top_moisture: tank.top_moisture,
                                                        top_dobi: tank.top_dobi,

                                                        // Bottom
                                                        bottom_ffa: tank.bottom_ffa,
                                                        bottom_moisture: tank.bottom_moisture,
                                                        bottom_dobi: tank.bottom_dobi,
                                                    }}
                                                    onFieldChange={(field: string, value: string) =>
                                                        handleTankChange(tankIndex, field.replace(`tank${tank.tank_no}_`, ''), value)
                                                    }
                                                />
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
                                    <h3 className="mb-3 text-xl font-medium text-gray-600">ยังไม่มีแทงค์ที่เลือก</h3>
                                    <p className="mx-auto max-w-md text-gray-500">
                                        กรุณาเลือกแทงค์ที่ต้องการบันทึกข้อมูลจากเมนูด้านบน เพื่อเริ่มต้นการบันทึกข้อมูลน้ำมันปาล์มดิบ
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
                                            <h2 className="text-xl font-bold text-gray-800">ข้อมูลน้ำมันปาล์มดิบ</h2>
                                            <p className="text-sm text-gray-600">กรอกข้อมูลเพิ่มเติมเกี่ยวกับน้ำมันปาล์มดิบ</p>
                                        </div>
                                    </motion.div>

                                    <div className="rounded-2xl border border-purple-200/80 bg-gradient-to-br from-purple-50/50 to-pink-50/30 p-6 shadow-lg backdrop-blur-sm">
                                        {/* Total CPO Summary */}
                                        {totalCPODetails.tankCount > 0 && (
                                            <TotalCPOSummary
                                                totalVolume={totalCPODetails.totalVolume}
                                                tankCount={totalCPODetails.tankCount}
                                                tankDetails={totalCPODetails.tankDetails}
                                            />
                                        )}

                                        <label className="mb-5 flex cursor-pointer items-center gap-3 rounded-xl border border-rose-200 bg-white/80 px-4 py-3 shadow-sm transition-all duration-200 hover:border-rose-300 hover:bg-rose-50/60">
                                            <input
                                                type="checkbox"
                                                checked={Boolean(formData.purge_system_status)}
                                                onChange={(e) =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        purge_system_status: e.target.checked,
                                                    }))
                                                }
                                                className="h-5 w-5 rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                                            />
                                            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-sm">
                                                <Waves className="h-4 w-4" />
                                            </span>
                                            <span>
                                                <span className="block text-sm font-semibold text-gray-800">บันทึกการไล่ระบบน้ำมัน</span>
                                                <span className="block text-xs text-gray-500">ติ๊กเพื่อเก็บสถานะเป็น 1, ไม่ติ๊กเก็บเป็น 0</span>
                                            </span>
                                        </label>

                                        {/* OilRoomSection */}
                                        <OilRoomSection oilRoom={formData.oil_room} onChange={(field, value) => handleOilRoomChange(field, value)} />
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
                                            {record ? 'อัพเดทข้อมูล' : 'บันทึกข้อมูล'} ({selectedTanks.length} แทงค์)
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
