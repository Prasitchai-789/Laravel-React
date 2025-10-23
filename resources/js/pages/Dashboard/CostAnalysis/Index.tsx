import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

interface LotDataItem {
  productionDate?: string;
  DocuNo?: string;
  productionQty?: number;
  totalCost?: number;
  unitCost?: number;
}

interface SalesItem {
  GoodID: number;
  GoodName: string;
  total_qty?: number;
  total_amnt?: number;
}

interface GroupedSales {
  [key: string]: {
    GoodID: number;
    GoodName: string;
    total_qty: number;
    total_amnt: number;
    avg_price: number;
    sales: SalesItem[];
  };
}

interface CostAnalysisProps {
  auth: any;
}

interface FormData {
  startDate: string;
  endDate: string;
}

export default function CostAnalysis({ auth }: CostAnalysisProps) {
  const { props } = usePage();
  const {
    lotData: initialLotData,
    sales: initialSales,
    startDate: propStart,
    endDate: propEnd
  } = props as {
    lotData?: LotDataItem[] | Record<string, LotDataItem>;
    sales?: SalesItem[] | Record<string, SalesItem>;
    startDate?: string;
    endDate?: string;
  };

  const [lotData, setLotData] = useState<LotDataItem[]>([]);
  const [sales, setSales] = useState<SalesItem[]>([]);

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

  function formatDateLocal(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const defaultStart = formatDateLocal(new Date(today.getFullYear(), today.getMonth(), 1));
  const defaultEnd = formatDateLocal(new Date(today.getFullYear(), today.getMonth() + 1, 0));

  const { data, setData, processing, errors } = useForm<FormData>({
    startDate: propStart ?? defaultStart,
    endDate: propEnd ?? defaultEnd,
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.startDate || !data.endDate) {
      alert('กรุณาเลือกช่วงวันที่');
      return;
    }
    router.get(route('cost-analysis.dashboard.index'), data);
  };

  // คำนวณยอดรวมต่างๆ
  const totalProduction = lotData.reduce((sum: number, item: LotDataItem) =>
    sum + (Number(item.productionQty) || 0), 0
  );

  const totalProductionCost = lotData.reduce((sum: number, item: LotDataItem) =>
    sum + (Number(item.totalCost) || 0), 0
  );

  const totalSales = sales.reduce((sum: number, item: SalesItem) =>
    sum + (Number(item.total_amnt) || 0), 0
  );

  const totalSalesQty = sales.reduce((sum: number, item: SalesItem) =>
    sum + (Number(item.total_qty) || 0), 0
  );

  // จัดกลุ่มข้อมูลขายตาม GoodID
  const groupedSales: GroupedSales = sales.reduce((acc: GroupedSales, item: SalesItem) => {
    const key = String(item.GoodID);
    if (!acc[key]) {
      acc[key] = {
        GoodID: item.GoodID,
        GoodName: item.GoodName,
        total_qty: 0,
        total_amnt: 0,
        avg_price: 0,
        sales: [],
      };
    }
    acc[key].total_qty += Number(item.total_qty) || 0;
    acc[key].total_amnt += Number(item.total_amnt) || 0;
    acc[key].sales.push(item);
    return acc;
  }, {});

  // คำนวณราคาขายเฉลี่ยต่อสินค้า
  Object.keys(groupedSales).forEach((key) => {
    const item = groupedSales[key];
    item.avg_price = item.total_qty > 0 ? item.total_amnt / item.total_qty : 0;
  });

  // คำนวณค่าต่างๆ
  const avgCostPerUnit = totalProduction > 0 ? totalProductionCost / totalProduction : 0;
  const avgPrice2147 = groupedSales['2147'] ? groupedSales['2147'].avg_price : 0;
  const total_qty2147 = groupedSales['2147'] ? groupedSales['2147'].total_qty : 0;
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 font-anuphan">
        <div className="mx-auto max-w-7xl">
          <div className="overflow-hidden rounded-2xl bg-white shadow-xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-8 py-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold">การวิเคราะห์ต้นทุนการผลิต</h1>
                  <p className="mt-2 text-emerald-100">
                    ข้อมูลระหว่างวันที่ {data.startDate} ถึง {data.endDate}
                  </p>
                </div>
                <div className="rounded-full bg-white/20 p-3">
                  <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* ฟอร์มเลือกช่วงเวลา */}
            <div className="border-b border-gray-200 bg-white px-8 py-6">
              <form onSubmit={submit} className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-1 flex-col gap-4 sm:flex-row">
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-gray-700">จากวันที่</label>
                    <input
                      type="date"
                      className="flex-1 rounded-lg border border-gray-300 px-4 py-3 shadow-sm transition-all duration-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:outline-none"
                      value={data.startDate}
                      onChange={(e) => setData('startDate', e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-gray-700">ถึงวันที่</label>
                    <input
                      type="date"
                      className="flex-1 rounded-lg border border-gray-300 px-4 py-3 shadow-sm transition-all duration-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:outline-none"
                      value={data.endDate}
                      onChange={(e) => setData('endDate', e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex items-center gap-2 rounded-lg bg-green-500 px-6 py-3 font-medium text-white shadow-lg transition-all duration-200 hover:bg-green-600 hover:shadow-xl disabled:opacity-50"
                    disabled={processing}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    ค้นหาข้อมูล
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-gray-300 bg-white px-6 py-3 font-medium text-gray-700 transition-all duration-200 hover:bg-gray-50"
                    onClick={() => setData({ startDate: '', endDate: '' })}
                  >
                    ล้างค่า
                  </button>
                </div>
              </form>
            </div>

            {/* สรุปข้อมูล */}
            <div className="grid grid-cols-1 gap-6 p-8 md:grid-cols-2 lg:grid-cols-4">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-2xl">
                <div className="relative z-10">
                  <h3 className="text-sm font-medium opacity-90">ราคารับซื้อผลปาล์ม</h3>
                  <p className="mt-2 text-3xl font-bold">
                    {CostFFB.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="mt-1 text-sm opacity-80">บาท</p>
                </div>
                <div className="absolute right-4 top-4 rounded-full bg-white/20 p-3">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 p-6 text-white shadow-2xl">
                <div className="relative z-10">
                  <h3 className="text-sm font-medium opacity-90">ต้นทุน CPO</h3>
                  <p className="mt-2 text-3xl font-bold">
                    {CostCPO.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="mt-1 text-sm opacity-80">บาท/กิโลกรัม</p>
                </div>
                <div className="absolute right-4 top-4 rounded-full bg-white/20 p-3">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 p-6 text-white shadow-2xl">
                <div className="relative z-10">
                  <h3 className="text-sm font-medium opacity-90">ส่วนต่างราคา CPO</h3>
                  <p className="mt-2 text-3xl font-bold">
                    {lostPrice.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="mt-1 text-sm opacity-80">บาท</p>
                </div>
                <div className="absolute right-4 top-4 rounded-full bg-white/20 p-3">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 text-white shadow-2xl">
                <div className="relative z-10">
                  <h3 className="text-sm font-medium opacity-90">ยอดขายทั้งหมด</h3>
                  <p className="mt-2 text-3xl font-bold">
                    {totalSales.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="mt-1 text-sm opacity-80">บาท</p>
                </div>
                <div className="absolute right-4 top-4 rounded-full bg-white/20 p-3">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
            </div>

            {/* ตารางยอดขายตามสินค้า */}
            <div className="px-8 pb-8">
              <div className="mb-6 rounded-2xl bg-white p-6 shadow-lg">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">ตารางยอดขายแยกตามสินค้า</h3>
                    <p className="mt-1 text-sm text-gray-600">รายละเอียดการขายทั้งหมด {Object.keys(groupedSales).length} สินค้า</p>
                  </div>
                  <span className="rounded-full bg-green-100 px-4 py-2 text-sm font-medium text-green-800">
                    {Object.keys(groupedSales).length} สินค้า
                  </span>
                </div>

                <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                          รหัสสินค้า
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                          ชื่อสินค้า
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-700">
                          จำนวนขาย
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-700">
                          ยอดขาย
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-700">
                          ราคาขายเฉลี่ย
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {Object.keys(groupedSales).length > 0 ? (
                        Object.values(groupedSales).map((product, index) => (
                          <tr
                            key={product.GoodID}
                            className="transition-colors duration-200 hover:bg-gray-50"
                          >
                            <td className="whitespace-nowrap px-6 py-4">
                              <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                                {product.GoodID || 'N/A'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                              {product.GoodName || 'N/A'}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-900">
                              {product.total_qty.toLocaleString('th-TH')}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-semibold text-gray-900">
                              {product.total_amnt.toLocaleString('th-TH', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })} บาท
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-semibold text-green-600">
                              {product.avg_price.toLocaleString('th-TH', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })} บาท
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                            <div className="flex flex-col items-center justify-center">
                              <svg className="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <p className="mt-2">ไม่พบข้อมูลการขาย</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                    {Object.keys(groupedSales).length > 0 && (
                      <tfoot className="bg-gradient-to-r from-gray-50 to-gray-100">
                        <tr>
                          <td colSpan={2} className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                            รวมทั้งหมด
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-semibold text-gray-900">
                            {totalSalesQty.toLocaleString('th-TH')}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-semibold text-gray-900">
                            {totalSales.toLocaleString('th-TH', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })} บาท
                          </td>
                          <td className="px-6 py-4 text-right text-sm font-semibold text-gray-900">-</td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>

              {/* ตารางต้นทุนการผลิต */}
              <div className="rounded-2xl bg-white p-6 shadow-lg">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">ตารางต้นทุนการผลิต</h3>
                    <p className="mt-1 text-sm text-gray-600">รายละเอียดต้นทุนการผลิตทั้งหมด {lotData.length} รายการ</p>
                  </div>
                  <span className="rounded-full bg-amber-100 px-4 py-2 text-sm font-medium text-amber-800">
                    {lotData.length} รายการ
                  </span>
                </div>

                <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                          วันที่ผลิต
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                          COA Number
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-700">
                          ปริมาณการผลิต
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-700">
                          ต้นทุนรวม
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-700">
                          ต้นทุนต่อหน่วย
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {lotData.length > 0 ? (
                        lotData.map((item, index) => (
                          <tr
                            key={index}
                            className="transition-colors duration-200 hover:bg-gray-50"
                          >
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                              {item.productionDate ?
                                new Date(item.productionDate).toLocaleDateString('th-TH') :
                                'N/A'
                              }
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                              <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-800">
                                {item.DocuNo || 'N/A'}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-900">
                              {Number(item.productionQty || 0).toLocaleString('th-TH')}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-semibold text-gray-900">
                              {Number(item.totalCost || 0).toLocaleString('th-TH', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })} บาท
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-semibold text-rose-600">
                              {Number(item.unitCost || 0).toLocaleString('th-TH', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })} บาท
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                            <div className="flex flex-col items-center justify-center">
                              <svg className="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <p className="mt-2">ไม่พบข้อมูลการผลิต</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                    {lotData.length > 0 && (
                      <tfoot className="bg-gradient-to-r from-gray-50 to-gray-100">
                        <tr>
                          <td colSpan={2} className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                            รวมทั้งหมด
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-semibold text-gray-900">
                            {totalProduction.toLocaleString('th-TH')}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-semibold text-gray-900">
                            {totalProductionCost.toLocaleString('th-TH', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })} บาท
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-semibold text-gray-900">
                            {totalProduction > 0 ?
                              (totalProductionCost / totalProduction).toLocaleString('th-TH', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }) :
                              '0.00'
                            } บาท
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
      </div>
    </AppLayout>
  );
}
