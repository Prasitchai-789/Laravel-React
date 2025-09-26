import React, { useState } from 'react';
import { X, FileText, Calendar, User, Package, ChevronDown, ChevronUp, TrendingUp, TrendingDown, History } from 'lucide-react';

interface HistoryItem {
  movement_type: 'เบิก' | 'คืน';
  quantity: number;
  docu_no: string;
  docu_date: string;
  user_id: string;
}

interface OrderItem {
  id: number;
  product_name: string;
  product_code: string;
  quantity: number;
  unit: string;
  history?: HistoryItem[];
}

interface Order {
  id: number;
  document_number: string;
  order_date: string;
  requester: string;
  items?: OrderItem[];
}

interface Props {
  order: Order;
  onClose: () => void;
  showHistory?: boolean;
}

export default function StoreOrderDetail({ order, onClose, showHistory = true }: Props) {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  const toggleItemExpansion = (itemId: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const calculateHistoryTotals = (history: HistoryItem[] = []) => {
    const issuedFromHistory = history.filter(h => h.movement_type === 'เบิก')
      .reduce((sum, h) => sum + h.quantity, 0);
    const returnedFromHistory = history.filter(h => h.movement_type === 'คืน')
      .reduce((sum, h) => sum + h.quantity, 0);

    return { issuedFromHistory, returnedFromHistory };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 font-anuphan">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-3 rounded-xl shadow-md">
              <FileText className="text-white h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">รายละเอียดการเบิกสินค้า</h2>
              <div className="flex flex-wrap items-center text-sm text-gray-600 mt-2 space-x-4">
                <div className="flex items-center bg-white/70 px-3 py-1 rounded-lg shadow-sm">
                  <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                  <span className="font-medium">เลขที่เอกสาร: </span>
                  <span className="ml-1 text-blue-700">{order.document_number}</span>
                </div>
                <div className="flex items-center bg-white/70 px-3 py-1 rounded-lg shadow-sm">
                  <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                  <span className="font-medium">วันที่เบิก: </span>
                  <span className="ml-1">{new Date(order.order_date).toLocaleDateString('th-TH')}</span>
                </div>
                <div className="flex items-center bg-white/70 px-3 py-1 rounded-lg shadow-sm">
                  <User className="h-4 w-4 mr-2 text-blue-500" />
                  <span className="font-medium">ผู้เบิก: </span>
                  <span className="ml-1">{order.requester}</span>
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-white text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-all duration-200 shadow-sm border border-gray-200 hover:shadow-md"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto px-6 py-4 flex-grow">
          {/* รายการสินค้า */}
          <div className="mb-6">
            <div className="flex items-center mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
              <div className="bg-blue-100 p-2 rounded-lg mr-3 shadow-sm">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">รายการสินค้า</h3>
              <span className="ml-2 bg-blue-500 text-white text-xs font-medium px-2.5 py-0.5 rounded-full shadow-sm">
                {order.items?.length || 0} รายการ
              </span>
            </div>

            {order.items && order.items.length > 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
                        <th className="px-4 py-3 text-left font-medium rounded-tl-xl">สินค้า</th>
                        <th className="px-4 py-3 text-center font-medium">รหัสสินค้า</th>
                        <th className="px-4 py-3 text-center font-medium">จำนวนที่เบิก</th>
                        <th className="px-4 py-3 text-center font-medium">หน่วย</th>
                        {showHistory && (
                          <>
                            <th className="px-4 py-3 text-center font-medium">คืนแล้ว</th>
                            <th className="px-4 py-3 text-center font-medium">คงค้าง</th>
                            <th className="px-4 py-3 text-center font-medium rounded-tr-xl">ประวัติ</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {order.items.map((item) => {
                        const { issuedFromHistory, returnedFromHistory } = calculateHistoryTotals(item.history);
                        const totalIssued = item.quantity + issuedFromHistory;
                        const pendingQty = totalIssued - returnedFromHistory;
                        const isExpanded = expandedItems.has(item.id);
                        const hasHistory = item.history && item.history.length > 0;

                        return (
                          <React.Fragment key={item.id}>
                            <tr className="hover:bg-blue-50/50 transition-colors duration-150 group">
                              <td className="px-4 py-3 font-medium text-gray-800">
                                <div className="flex items-center">
                                  <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                                  {item.product_name}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-xs font-mono">
                                  {item.product_code || '-'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded-md">
                                  {item.quantity.toLocaleString()}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center text-gray-600">
                                <span className="bg-gray-100 px-2 py-1 rounded-md text-xs">
                                  {item.unit || '-'}
                                </span>
                              </td>

                              {showHistory && (
                                <>
                                  <td className="px-4 py-3 text-center">
                                    <div className="flex items-center justify-center">
                                      <TrendingDown className="h-4 w-4 text-green-500 mr-1" />
                                      <span className="text-green-600 font-medium bg-green-50 px-2 py-1 rounded-md">
                                        {returnedFromHistory > 0 ? returnedFromHistory.toLocaleString() : '-'}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <div className="flex items-center justify-center">
                                      <TrendingUp className="h-4 w-4 text-red-500 mr-1" />
                                      <span className={`font-bold px-2 py-1 rounded-md ${
                                        pendingQty > 0 
                                          ? 'text-red-600 bg-red-50' 
                                          : pendingQty === 0 
                                            ? 'text-green-600 bg-green-50' 
                                            : 'text-gray-600 bg-gray-50'
                                      }`}>
                                        {pendingQty.toLocaleString()}
                                        {pendingQty === 0 && ' ✓'}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    {hasHistory ? (
                                      <button
                                        onClick={() => toggleItemExpansion(item.id)}
                                        className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center justify-center mx-auto transition-all duration-200 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg"
                                      >
                                        {isExpanded ? (
                                          <>
                                            <ChevronUp size={16} className="mr-1" />
                                            <span>ย่อข้อมูล</span>
                                          </>
                                        ) : (
                                          <>
                                            <History size={16} className="mr-1" />
                                            <span>ดูประวัติ ({item.history?.length})</span>
                                          </>
                                        )}
                                      </button>
                                    ) : (
                                      <span className="text-gray-400 bg-gray-100 px-3 py-1.5 rounded-lg">ไม่มีประวัติ</span>
                                    )}
                                  </td>
                                </>
                              )}
                            </tr>

                            {/* Expanded history */}
                            {isExpanded && hasHistory && (
                              <>
                                <tr className="bg-blue-50/30">
                                  <td colSpan={showHistory ? 7 : 4} className="px-4 py-3">
                                    <div className="flex justify-between items-center">
                                      <div className="flex items-center text-blue-800 font-medium">
                                        <History className="h-4 w-4 mr-2" />
                                        ประวัติการเบิก-คืนหลังจากเอกสารนี้
                                      </div>
                                      <span className="text-blue-700 bg-blue-100 px-2 py-1 rounded-md text-xs font-medium">
                                        จำนวนรายการ: {item.history?.length ?? 0}
                                      </span>
                                    </div>
                                  </td>
                                </tr>

                                {item.history?.map((h, idx) => (
                                  <tr
                                    key={`${item.id}-${idx}`}
                                    className={`transition-colors duration-150 ${
                                      h.movement_type === "เบิก"
                                        ? "bg-orange-50 hover:bg-orange-100"
                                        : "bg-green-50 hover:bg-green-100"
                                    }`}
                                  >
                                    <td className="px-4 py-2 text-gray-700 text-sm font-medium pl-8" colSpan={2}>
                                      <div className="flex items-center">
                                        <div className={`w-2 h-2 rounded-full mr-2 ${
                                          h.movement_type === "เบิก" ? "bg-orange-500" : "bg-green-500"
                                        }`}></div>
                                        {item.product_code} - {item.product_name}
                                      </div>
                                    </td>

                                    <td className="px-4 py-2 text-center">
                                      <span
                                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                          h.movement_type === "เบิก"
                                            ? "bg-orange-100 text-orange-800 border border-orange-200"
                                            : "bg-green-100 text-green-800 border border-green-200"
                                        }`}
                                      >
                                        {h.movement_type === "เบิก" ? 
                                          <TrendingUp className="h-3 w-3 mr-1" /> : 
                                          <TrendingDown className="h-3 w-3 mr-1" />
                                        }
                                        {h.movement_type} {h.quantity.toLocaleString()}
                                      </span>
                                    </td>

                                    <td className="px-4 py-2 text-center text-gray-600 text-sm">
                                      {item.unit}
                                    </td>

                                    {showHistory && (
                                      <>
                                        <td className="px-4 py-2 text-center">
                                          <a
                                            href="#"
                                            className="text-blue-600 hover:text-blue-800 underline text-sm font-medium"
                                            title={`เปิดเอกสาร: ${h.docu_no}`}
                                          >
                                            {h.docu_no}
                                          </a>
                                        </td>
                                        <td className="px-4 py-2 text-center text-gray-600 text-sm">
                                          {new Date(h.docu_date).toLocaleDateString("th-TH", {
                                            day: "2-digit",
                                            month: "short",
                                            year: "numeric",
                                          })}
                                        </td>
                                        <td className="px-4 py-2 text-center text-gray-600 text-sm font-medium">
                                          {h.user_id}
                                        </td>
                                      </>
                                    )}
                                  </tr>
                                ))}

                                {/* Summary row */}
                                <tr className="bg-gradient-to-r from-gray-100 to-gray-200 border-t border-gray-300 font-medium">
                                  <td colSpan={2} className="px-4 py-3 text-right text-sm text-gray-700 rounded-bl-xl">
                                    สรุป:
                                  </td>

                                  <td className="px-4 py-3 text-center text-sm">
                                    <span className="text-orange-700 bg-orange-50 px-2 py-1 rounded-md">
                                      เบิกทั้งหมด: {totalIssued.toLocaleString()}
                                    </span>
                                  </td>

                                  <td className="px-4 py-3 text-center text-sm text-gray-600">
                                    {item.unit}
                                  </td>

                                  <td colSpan={showHistory ? 3 : 0} className="px-4 py-3 text-center text-sm rounded-br-xl">
                                    <div className="flex justify-center space-x-4">
                                      <span className="text-green-700 bg-green-50 px-2 py-1 rounded-md">
                                        คืนทั้งหมด: {returnedFromHistory.toLocaleString()}
                                      </span>
                                      <span className="text-blue-700 bg-blue-50 px-2 py-1 rounded-md">
                                        คงเหลือสุทธิ: {(totalIssued - returnedFromHistory).toLocaleString()} {item.unit}
                                      </span>
                                    </div>
                                  </td>
                                </tr>
                              </>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl border border-gray-200 p-8 text-center shadow-sm">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-lg">ไม่มีรายการสินค้า</p>
                <p className="text-gray-400 text-sm mt-1">ไม่พบข้อมูลสินค้าในเอกสารนี้</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 border-t border-gray-200 bg-white">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 shadow-md hover:shadow-lg font-medium flex items-center"
          >
            <X size={18} className="mr-2" />
            ปิดหน้าต่าง
          </button>
        </div>

      </div>
      
    </div>
  );
}