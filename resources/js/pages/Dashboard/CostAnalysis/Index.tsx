import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

export default function CostAnalysis({ auth }) {
    const { props } = usePage();
    const { lotData: initialLotData, sales: initialSales } = props;

    // แปลงข้อมูลให้เป็น array หากไม่ใช่
    const [lotData, setLotData] = useState([]);
    const [sales, setSales] = useState([]);

    useEffect(() => {
        // แปลง lotData ให้เป็น array
        if (Array.isArray(initialLotData)) {
            setLotData(initialLotData);
        } else if (initialLotData && typeof initialLotData === 'object') {
            setLotData(Object.values(initialLotData));
        } else {
            setLotData([]);
        }

        // แปลง sales ให้เป็น array
        if (Array.isArray(initialSales)) {
            setSales(initialSales);
        } else if (initialSales && typeof initialSales === 'object') {
            setSales(Object.values(initialSales));
        } else {
            setSales([]);
        }
    }, [initialLotData, initialSales]);

    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]; // YYYY-MM-DD
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0]; // YYYY-MM-DD

    const { data, setData, processing, errors } = useForm({
        startDate: firstDayOfMonth,
        endDate: lastDayOfMonth,
    });

    const submit = (e) => {
        e.preventDefault();
        console.log('Submitting with data:', data);
        if (!data.startDate || !data.endDate) {
            alert('กรุณาเลือกช่วงวันที่');
            return;
        }
        router.get(route('cost-analysis.dashboard.index'), data);
    };

    // คำนวณยอดรวมต่างๆ
    const totalProduction = Array.isArray(lotData) ? lotData.reduce((sum, item) => sum + (item.productionQty || 0), 0) : 0;

    const totalProductionCost = Array.isArray(lotData) ? lotData.reduce((sum, item) => sum + (item.totalCost || 0), 0) : 0;

    const totalSales = Array.isArray(sales) ? sales.reduce((sum, item) => sum + (item.total_amnt || 0), 0) : 0;

    const totalSalesQty = Array.isArray(sales) ? sales.reduce((sum, item) => sum + (item.total_qty || 0), 0) : 0;

    // จัดกลุ่มข้อมูลขายตาม GoodID
    const groupedSales = Array.isArray(sales)
        ? sales.reduce((acc, item) => {
              const key = item.GoodID;
              if (!acc[key]) {
                  acc[key] = {
                      GoodID: item.GoodID,
                      GoodName: item.GoodName,
                      total_qty: 0,
                      total_amnt: 0,
                      sales: [],
                  };
              }
              acc[key].total_qty += item.total_qty || 0;
              acc[key].total_amnt += item.total_amnt || 0;
              acc[key].sales.push(item);
              return acc;
          }, {})
        : {};

    // คำนวณราคาขายเฉลี่ยต่อสินค้า
    Object.keys(groupedSales).forEach((key) => {
        groupedSales[key].avg_price = groupedSales[key].total_qty > 0 ? groupedSales[key].total_amnt / groupedSales[key].total_qty : 0;
    });

    const avgCostPerUnit = totalProduction > 0 ? totalProductionCost / totalProduction : 0;
    const avgPrice2147 = groupedSales[2147] ? groupedSales[2147].avg_price : 0;
    const total_qty2147 = groupedSales[2147] ? groupedSales[2147].total_qty : 0;
    const CostCPO = (avgCostPerUnit / 18) * 100;
    const CostLostCPO = avgPrice2147 - CostCPO;
    const lostPrice = CostLostCPO * total_qty2147;

    const CostFFB = (total_qty2147 / 18) * 100 * avgCostPerUnit;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'การวิเคราะห์ต้นทุน', href: '/roles' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="การวิเคราะห์ต้นทุน" />
            <div className="p-4 font-anuphan">
                <div className="mx-auto ">
                    <div className="overflow-hidden bg-white">
                        {/* Header */}
                        <div className="mb-4 border-b border-gray-200 pb-4">
                            <h1 className="text-2xl font-bold text-gray-900">การวิเคราะห์ต้นทุนการผลิต</h1>
                            <p className="mt-1 text-sm text-gray-600">
                                ข้อมูลระหว่างวันที่ {data.startDate} ถึง {data.endDate}
                            </p>
                        </div>

                        {/* ฟอร์มเลือกช่วงเวลา */}
                        <form onSubmit={submit} className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-3">
                            <div className="flex items-center gap-2">
                                <input
                                    type="date"
                                    className="flex-1 rounded-lg border border-gray-200 px-3 py-2 focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:outline-none"
                                    value={data.startDate}
                                    onChange={(e) => setData('startDate', e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-gray-400">ถึง</span>
                                <input
                                    type="date"
                                    className="flex-1 rounded-lg border border-gray-200 px-3 py-2 focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:outline-none"
                                    value={data.endDate}
                                    onChange={(e) => setData('endDate', e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="submit"
                                    className="rounded-lg bg-green-500 px-4 py-2 text-white hover:bg-green-600"
                                    disabled={processing}
                                >
                                    ค้นหา
                                </button>
                                <button
                                    type="button"
                                    className="rounded-lg bg-gray-100 px-4 py-2 text-gray-700 hover:bg-gray-200"
                                    onClick={() => setData({ startDate: '', endDate: '' })}
                                >
                                    ล้างช่วงวันที่
                                </button>
                            </div>
                        </form>
                        {/* สรุปข้อมูล */}
                        <div className="mt-2 mb-4 grid grid-cols-1 gap-4 md:grid-cols-4">
                            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 shadow-sm">
                                <h3 className="text-sm font-medium text-blue-800">ราคารับซื้อผลปาล์ม</h3>
                                <p className="text-2xl font-bold text-blue-900">
                                    {CostFFB.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                                <p className="mt-1 text-xs text-blue-600">บาท</p>
                            </div>
                            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 shadow-sm">
                                <h3 className="text-sm font-medium text-yellow-800">ต้นทุน CPO</h3>
                                <p className="text-2xl font-bold text-yellow-900">
                                    {CostCPO.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                                <p className="mt-1 text-xs text-yellow-600">บาท/กิโลกรัม</p>
                            </div>
                            <div className="rounded-lg border border-red-200 bg-red-50 p-4 shadow-sm">
                                <h3 className="text-sm font-medium text-red-800">ส่วนต่างราคา CPO</h3>
                                <p className="text-2xl font-bold text-red-900">
                                    {lostPrice.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                                <p className="mt-1 text-xs text-red-600">บาท</p>
                            </div>
                            <div className="rounded-lg border border-green-200 bg-green-50 p-4 shadow-sm">
                                <h3 className="text-sm font-medium text-green-800">ยอดขายทั้งหมด</h3>
                                <p className="text-2xl font-bold text-green-900">
                                    {totalSales.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                                <p className="mt-1 text-xs text-green-600">บาท</p>
                            </div>
                        </div>
                        {/* ตารางยอดขายตามสินค้า */}
                        <div className="mb-4">
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900">ตารางยอดขายแยกตามสินค้า</h3>
                                <span className="text-sm text-gray-500">ทั้งหมด {Object.keys(groupedSales).length} สินค้า</span>
                            </div>
                            <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                                รหัสสินค้า
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                                ชื่อสินค้า
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                                จำนวนขาย
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">ยอดขาย</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                                ราคาขายเฉลี่ย
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {Object.keys(groupedSales).length > 0 ? (
                                            Object.values(groupedSales).map((product, index) => (
                                                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50 hover:bg-gray-100'}>
                                                    <td className="px-6 py-4 text-sm font-medium whitespace-nowrap text-gray-900">
                                                        {product.GoodID || 'N/A'}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-900">{product.GoodName || 'N/A'}</td>
                                                    <td className="px-6 py-4 text-right text-sm whitespace-nowrap text-gray-500">
                                                        {product.total_qty.toLocaleString('th-TH', {
                                                            minimumFractionDigits: 0,
                                                            maximumFractionDigits: 0,
                                                        })}
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-sm whitespace-nowrap text-gray-500">
                                                        {product.total_amnt.toLocaleString('th-TH', {
                                                            minimumFractionDigits: 0,
                                                            maximumFractionDigits: 0,
                                                        })}{' '}
                                                        บาท
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-sm whitespace-nowrap text-gray-500">
                                                        {product.avg_price.toLocaleString('th-TH', {
                                                            minimumFractionDigits: 2,
                                                            maximumFractionDigits: 2,
                                                        })}{' '}
                                                        บาท
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                                                    ไม่มีข้อมูลการขาย
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                    {Object.keys(groupedSales).length > 0 && (
                                        <tfoot className="bg-gray-50">
                                            <tr>
                                                <td colSpan="2" className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                                                    รวมทั้งหมด
                                                </td>
                                                <td className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                                                    {totalSalesQty.toLocaleString()}
                                                </td>
                                                <td className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                                                    {totalSales.toLocaleString()} บาท
                                                </td>
                                                <td className="px-6 py-3 text-right text-sm font-medium text-gray-900">-</td>
                                            </tr>
                                        </tfoot>
                                    )}
                                </table>
                            </div>
                        </div>

                        {/* ตารางต้นทุนการผลิต */}
                        <div className="mb-4">
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900">ตารางต้นทุนการผลิต</h3>
                                <span className="text-sm text-gray-500">ทั้งหมด {lotData.length} รายการ</span>
                            </div>
                            <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                                วันที่ผลิต
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                                COA Number
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                                ปริมาณการผลิต
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                                ต้นทุนรวม
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                                ต้นทุนต่อหน่วย
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {lotData.length > 0 ? (
                                            lotData.map((item, index) => (
                                                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50 hover:bg-gray-100'}>
                                                    <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
                                                        {item.productionDate ? new Date(item.productionDate).toLocaleDateString('th-TH') : 'N/A'}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm font-medium whitespace-nowrap text-gray-900">
                                                        {item.DocuNo || 'N/A'}
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-sm whitespace-nowrap text-gray-500">
                                                        {item.productionQty
                                                            ? item.productionQty.toLocaleString('th-TH', {
                                                                  minimumFractionDigits: 0,
                                                                  maximumFractionDigits: 0,
                                                              })
                                                            : '0'}
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-sm whitespace-nowrap text-gray-500">
                                                        {item.totalCost
                                                            ? item.totalCost.toLocaleString('th-TH', {
                                                                  minimumFractionDigits: 0,
                                                                  maximumFractionDigits: 0,
                                                              })
                                                            : '0'}{' '}
                                                        บาท
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-sm whitespace-nowrap text-gray-500">
                                                        {item.unitCost
                                                            ? item.unitCost.toLocaleString('th-TH', {
                                                                  minimumFractionDigits: 2,
                                                                  maximumFractionDigits: 2,
                                                              })
                                                            : '0'}{' '}
                                                        บาท
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                                                    ไม่มีข้อมูลการผลิต
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                    {lotData.length > 0 && (
                                        <tfoot className="bg-gray-50">
                                            <tr>
                                                <td colSpan="2" className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                                                    รวมทั้งหมด
                                                </td>
                                                <td className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                                                    {totalProduction.toLocaleString()}
                                                </td>
                                                <td className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                                                    {totalProductionCost.toLocaleString()} บาท
                                                </td>
                                                <td className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                                                    {totalProduction > 0 ? (totalProductionCost / totalProduction).toFixed(2) : '0'} บาท
                                                </td>
                                            </tr>
                                        </tfoot>
                                    )}
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
