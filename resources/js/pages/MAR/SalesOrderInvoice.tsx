import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function SalesOrderInvoice() {
  const { docuNo } = useParams();
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetch(`/sales-order/${docuNo}/invoices`)
      .then(res => res.json())
      .then(data => setItems(data));
  }, [docuNo]);

  return (
    <div className="p-6">
      <h2 className="text-lg font-bold mb-4">
        ใบ Invoice ของ SO: {docuNo}
      </h2>

      {/* <Link to="/sales-order" className="mb-3 inline-block text-blue-600">
        ← กลับไปหน้า Sales Order
      </Link> */}

      <div className="bg-white p-4 rounded-xl shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-2">Invoice No</th>
              <th className="p-2">วันที่</th>
              <th className="p-2">สินค้า</th>
              <th className="p-2 text-right">น้ำหนัก (kg)</th>
              <th className="p-2 text-right">มูลค่า</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i, idx) => (
              <tr key={idx} className="border-b">
                <td className="p-2 font-bold">{i.InvoiceNo}</td>
                <td className="p-2">{i.DocuDate?.substring(0, 10)}</td>
                <td className="p-2">{i.GoodName}</td>
                <td className="p-2 text-right">{Number(i.qty).toLocaleString()}</td>
                <td className="p-2 text-right text-green-600 font-bold">
                  {Number(i.amount).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
