import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import { useEffect, useState } from 'react';
export default function ExpenseByMonth({ selectedYear, selectedDept }) {
  const [data, setData] = useState([]);

  useEffect(() => {
    axios.get('/purchase/po/chart', {
      params: { year: selectedYear, dept_id: selectedDept }
    }).then(res => setData(res.data.byMonth));
  }, [selectedYear, selectedDept]);

  const monthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  const chartData = data.map(item => ({
    name: monthNames[item.month - 1],
    total: item.total
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip formatter={(val) => `${val.toLocaleString()} บาท`} />
        <Bar dataKey="total" fill="#0d6efd" />
      </BarChart>
    </ResponsiveContainer>
  );
}
