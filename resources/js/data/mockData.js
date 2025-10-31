// src/data/mockData.js
export const mockData = {
  salesTrend: {
    labels: ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'],
    sales: [850000, 920000, 780000, 1100000, 950000, 1250000, 1150000, 1300000, 1200000, 1350000, 1400000, 1450000],
    volume: [580, 620, 530, 750, 640, 850, 780, 880, 820, 920, 950, 980]
  },
  productDistribution: {
    labels: ['น้ำมันปาล์มดิบ', 'เมล็ดในปาล์ม', 'กะลาปาล์ม', 'ทะลายสับ', 'ทะลายปาล์มเปล่า', 'ใยปาล์ม'],
    values: [35, 20, 15, 12, 10, 8]
  },
  recentSales: [
    { product: 'น้ำมันปาล์มดิบ', date: '15 ต.ค. 2023', quantity: '50 ตัน', amount: '75,000 บาท', status: 'completed' },
    { product: 'เมล็ดในปาล์ม', date: '14 ต.ค. 2023', quantity: '30 ตัน', amount: '45,000 บาท', status: 'completed' },
    { product: 'กะลาปาล์ม', date: '14 ต.ค. 2023', quantity: '25 ตัน', amount: '32,500 บาท', status: 'pending' },
    { product: 'ทะลายสับ', date: '13 ต.ค. 2023', quantity: '40 ตัน', amount: '48,000 บาท', status: 'completed' },
    { product: 'ใยปาล์ม', date: '12 ต.ค. 2023', quantity: '15 ตัน', amount: '19,500 บาท', status: 'completed' }
  ],
  productPerformance: [
    { name: 'น้ำมันปาล์มดิบ', volume: '350 ตัน', revenue: '525,000 บาท', change: 12.5 },
    { name: 'เมล็ดในปาล์ม', volume: '200 ตัน', revenue: '300,000 บาท', change: 8.3 },
    { name: 'กะลาปาล์ม', volume: '150 ตัน', revenue: '195,000 บาท', change: 5.7 },
    { name: 'ทะลายสับ', volume: '120 ตัน', revenue: '144,000 บาท', change: -2.1 },
    { name: 'ทะลายปาล์มเปล่า', volume: '100 ตัน', revenue: '120,000 บาท', change: 3.4 },
    { name: 'ใยปาล์ม', volume: '80 ตัน', revenue: '104,000 บาท', change: 7.2 }
  ]
};
