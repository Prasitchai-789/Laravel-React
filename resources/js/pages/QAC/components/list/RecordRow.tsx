import { Calendar, Filter, Thermometer } from 'lucide-react';

import { CPORecord } from '../../types';
import { toFixed, toNumber } from '../../utils/number';
import { transformRecordData } from '../../utils/transform';
import ActionsColumn from './ActionsColumn';
import OilRoomCard from './OilRoomCard';

interface Props {
    record: CPORecord;
    index: number;
    calculateTankTotals: (record: CPORecord) => any;
    calculateQualityAverages: (record: CPORecord) => any;
    onEdit: (record: CPORecord) => void;
    onDelete: (id: number) => void;
    densityRef: any[];
    calculateVolume?: (tanks: any[]) => any;
}

export default function RecordRow({
    record,
    index,
    calculateTankTotals,
    calculateQualityAverages,
    onEdit,
    onDelete,
    densityRef,
    calculateVolume,
}: Props) {
    const tankTotals = calculateTankTotals(record);
    const quality = calculateQualityAverages(record);
    const transformed = transformRecordData(record);

    const volumeResult = calculateVolume ? calculateVolume(transformed.tanks) : { volumes: {}, total: 0 };

    return (
        <tr
            className={`group transition-all duration-300 hover:bg-gradient-to-r hover:from-amber-50/30 hover:to-orange-50/30 ${
                index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
            }`}
        >
            {/* ========================= วันที่ ========================= */}
            <td className="px-2 py-2 align-top">
                <div className="flex items-start space-x-3">
                    <div className="rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 p-2 shadow-sm">
                        <Calendar className="h-4 w-4 text-blue-600" />
                    </div>

                    <div>
                        <div className="text-sm font-semibold text-gray-900">
                            {new Date(record.date).toLocaleDateString('th-TH', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                            })}
                        </div>

                        <div className="mt-1 inline-block rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-500">
                            {new Date(record.date).toLocaleDateString('th-TH', {
                                weekday: 'long',
                            })}
                        </div>

                        {/* สถานะการผลิต */}
                        <div className="mt-1">
                            {record.production_mode === 'no_production' ? (
                                <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                                    ไม่ผลิต
                                </span>
                            ) : (
                                <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                                    ผลิต
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </td>

            {/* ========================= ข้อมูลแทงค์ ========================= */}
            <td className="px-2 py-2 align-top">
                <div className="space-y-2">
                    {transformed.tanks
                        .filter((t) => t.oil_level && t.temperature)
                        .map((tank) => {
                            const tankVolume = volumeResult.volumes?.[tank.tank_no] || tank.cpo_volume || 0;

                            const temperature = Math.round(toNumber(tank.temperature));

                            const densityData = densityRef.find((d) => d.temperature_c === temperature);

                            return (
                                <div key={tank.tank_no} className="rounded-2xl border border-amber-100 bg-amber-50/50 p-3">
                                    <div className="mb-2 flex items-center justify-between">
                                        <div className="text-xs font-medium text-amber-600">Tank {tank.tank_no}</div>

                                        <div className="flex items-center space-x-1 text-xs text-amber-500">
                                            <Thermometer className="h-3 w-3" />
                                            <span>{tank.temperature}°C</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-1 text-xs">
                                        <div className="text-gray-600">ระดับ:</div>
                                        <div className="font-medium text-gray-700">{tank.oil_level} cm</div>

                                        <div className="text-gray-600">ปริมาณ:</div>

                                        <div className="font-bold text-amber-700">{toFixed(tankVolume, 3)} ตัน</div>
                                    </div>

                                    {densityData && <div className="mt-1 text-xs text-gray-500">ความหนาแน่น: {densityData.density}</div>}
                                </div>
                            );
                        })}

                    {tankTotals.tankCount === 0 && (
                        <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-3 text-center text-xs text-gray-500">ไม่มีข้อมูลแทงค์</div>
                    )}
                </div>
            </td>

            {/* ========================= คุณภาพน้ำมัน ========================= */}
            <td className="px-2 py-2 align-top">
                <div className="space-y-2">
                    {transformed.tanks
                        .filter((t) => t.oil_level && t.temperature)
                        .map((tank) => {
                            const isTank1 = tank.tank_no === 1;

                            return (
                                <div
                                    key={`quality-${tank.tank_no}`}
                                    className={`rounded-2xl border p-3 ${
                                        isTank1 ? 'border-blue-100 bg-blue-50/50' : 'border-purple-100 bg-purple-50/50'
                                    }`}
                                >
                                    <div className="mb-2 flex items-center justify-between">
                                        <div className={`text-xs font-medium ${isTank1 ? 'text-blue-600' : 'text-purple-600'}`}>
                                            คุณภาพ Tank {tank.tank_no}
                                        </div>

                                        {!isTank1 && (
                                            <div className="flex items-center space-x-1 text-xs text-purple-500">
                                                <Filter className="h-3 w-3" />
                                                <span>Top/Bottom</span>
                                            </div>
                                        )}
                                    </div>

                                    {isTank1 ? (
                                        <div className="text-xs">
                                            <div className="mb-1 grid grid-cols-3 gap-2 font-medium text-gray-600">
                                                <div>%FFA</div>
                                                <div>%Moisture</div>
                                                <div>DOBI</div>
                                            </div>

                                            <div className="grid grid-cols-3 gap-2 font-bold text-blue-700">
                                                <div>{tank.ffa || '-'}%</div>
                                                <div>{tank.moisture || '-'}%</div>
                                                <div>{tank.dobi || '-'}</div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-2 text-xs">
                                            {/* TOP */}
                                            <div>
                                                <div className="mb-1 grid grid-cols-4 gap-2 font-medium text-gray-600">
                                                    <div></div>
                                                    <div>%FFA</div>
                                                    <div>%Moisture</div>
                                                    <div>DOBI</div>
                                                </div>
                                                <div className="grid grid-cols-4 gap-2 font-bold text-green-700">
                                                    <div className="mb-1 flex items-center space-x-1 font-medium text-green-600">
                                                        <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                                                        <span>ส่วนบน</span>
                                                    </div>

                                                    <div>{tank.top_ffa || '-'}%</div>
                                                    <div>{tank.top_moisture || '-'}%</div>
                                                    <div>{tank.top_dobi || '-'}</div>
                                                </div>
                                            </div>

                                            {/* BOTTOM */}
                                            <div>
                                                <div className="grid grid-cols-4 gap-2 font-bold text-orange-700">
                                                    <div className="mb-1 flex items-center space-x-1 font-medium text-orange-600">
                                                        <div className="h-1.5 w-1.5 rounded-full bg-orange-500"></div>
                                                        <span>ส่วนล่าง</span>
                                                    </div>

                                                    <div>{tank.bottom_ffa || '-'}%</div>
                                                    <div>{tank.bottom_moisture || '-'}%</div>
                                                    <div>{tank.bottom_dobi || '-'}</div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                    {transformed.tanks.filter((t) => t.oil_level).length === 0 && (
                        <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-3 text-center text-xs text-gray-500">
                            ไม่มีข้อมูลคุณภาพน้ำมัน
                        </div>
                    )}
                </div>
            </td>

            {/* ========================= OIL ROOM ========================= */}
            <td className="px-2 py-2 align-top">
                <OilRoomCard oil={transformed.oil_room} />
            </td>

            {/* ========================= SUMMARY ========================= */}
            <td className="px-2 py-2 align-top">
                <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-3">
                    <div className="mb-2 text-xs font-medium text-amber-600">สรุปปริมาณ (คำนวณ)</div>

                    <div className="space-y-2 text-xs">
                        {tankTotals.tankDetails.map((tank) => (
                            <div key={tank.tank_no} className="flex justify-between">
                                <span className="text-gray-500">Tank {tank.tank_no}:</span>

                                {/* ใช้ toFixed ป้องกัน floating error */}
                                <span className="text-amber-600">{toFixed(tank.volume, 3)} ตัน</span>
                            </div>
                        ))}

                        <div className="flex justify-between border-t border-amber-200 pt-1">
                            <span className="font-medium text-gray-700">รวม:</span>

                            {/* แก้ตรงนี้: ใช้ safe rounding */}
                            <span className="font-bold text-amber-800"> {toFixed(tankTotals.totalVolume, 3)} ตัน</span>
                        </div>
                    </div>
                </div>
            </td>

            {/* ========================= ACTIONS ========================= */}
            <td className="px-2 py-2 align-top">
                <ActionsColumn record={record} onEdit={onEdit} onDelete={onDelete} />
            </td>
        </tr>
    );
}
