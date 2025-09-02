import CardSummary from '@/components/CardSummary';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

const ProductionTable = ({ title, data }) => {
    return (
        <div className="mt-6 rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-lg font-semibold">{title}</h2>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">สินค้า</th>
                            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">ยอดยกมา</th>
                            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">การผลิต</th>
                            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">ยอดขาย</th>
                            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">ยอดคงเหลือ</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                        {data.map((item, index) => (
                            <tr key={index}>
                                <td className="px-6 py-4 whitespace-nowrap">{item.product}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{item.carrying_balance || '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{item.production}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{item.sales || '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{item.balance}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const PalmDashboard = ({ summary, products, monthlyProducts, pendingPalm }) => {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'PalmDashboard', href: '/roles' },
    ];
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="min-h-screen bg-gray-100 font-anuphan">
                <Head title="PalmDashboard" />

                <div className="p-4">
                    <div className="">
                        <h1 className="text-2xl font-semibold text-gray-900">Dashboard ปาล์มน้ำมัน</h1>
                    </div>

                    <div className="">
                        {/* Summary Cards */}
                        <div className="mt-6 grid grid-cols-2 gap-5 font-anuphan sm:grid-cols-4 lg:grid-cols-4">
                            {/* การ์ดรูปแบบใหม่ตามที่ต้องการ */}
                            <CardSummary
                                title="ปริมาณผลปาล์ม"
                                mainValue={1220.76}
                                unit="Ton."
                                percentage={99}
                                trend="up"
                                value1={345.42}
                                label1="ยอดยกมา"
                                value2={875.34}
                                label2="ผลปาล์มรับเข้า"
                                progressColor="green"
                                className="lg:col-span-1"
                            />
                            <CardSummary
                                title="จำนวนกะบะ"
                                mainValue={99}
                                unit="กะบะ"
                                percentage={85}
                                trend="up"
                                value1={3.87}
                                label1="ค่าเฉลี่ย"
                                value2={"7:30"}
                                label2="ชั่วโมงการผลิต"
                                progressColor="blue"
                            />
                            {/* การ์ดรูปแบบใหม่ตามที่ต้องการ */}
                            <div className="col-span-1 rounded-2xl bg-white p-4 shadow-lg">
                                <div className="mb-2">
                                    <span className="float-end flex items-center">
                                        <span className="text-sm text-gray-400">{99}%</span>
                                        <i className="fa-solid fa-arrow-up ms-2 text-yellow-500"></i>
                                    </span>
                                    <h5 className="card-title truncate font-semibold text-gray-800">ปริมาณการผลิต</h5>
                                </div>

                                <div className="mb-1">
                                    <h2 className="text-center text-3xl font-bold text-gray-800">
                                        926.23
                                        <span className="text-sm"> Ton.</span>
                                    </h2>
                                </div>

                                <div className="mb-4 flex items-center justify-between">
                                    <div className="mx-1 text-center">
                                        <p className="text-xl font-medium text-gray-900">
                                            <span className="text-sm">492.76</span>
                                        </p>
                                        <p className="text-sm text-gray-500">กะ A</p>
                                    </div>
                                    <div className="h-8 w-[1px] bg-gray-400"></div>
                                    <div className="mx-1 text-center">
                                        <p className="text-xl font-medium text-gray-900">
                                            <span className="text-sm">433.47</span>
                                        </p>
                                        <p className="text-sm text-gray-500">กะ B</p>
                                    </div>
                                     <div className="h-8 w-[1px] bg-gray-400"></div>
                                    <div className="mx-1 text-center">
                                        <p className="text-xl font-medium text-gray-900">
                                            <span className="text-sm">-</span>
                                        </p>
                                        <p className="text-sm text-gray-500">กะ 3</p>
                                    </div>
                                </div>

                                <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-gray-200 shadow-sm">
                                    <div
                                        className="flex flex-col justify-center overflow-hidden rounded-full bg-yellow-500"
                                        role="progressbar"
                                        aria-valuenow={99}
                                        aria-valuemin="0"
                                        aria-valuemax="100"
                                        style={{ width: `${99}%` }}
                                    ></div>
                                </div>
                            </div>
                            <CardSummary
                                title="ปริมาณคงค้าง"
                                mainValue={294.53}
                                unit="Ton."
                                percentage={85}
                                trend="up"
                                value1={100.76}
                                label1="บรรจุ"
                                value2={193.77}
                                label2="บนลาน"
                                progressColor="red"
                            />
                        </div>

                        {/* Products Table */}
                        <ProductionTable title="ข้อมูลสินค้า" data={products} />

                        {/* Monthly Products Table */}
                        <ProductionTable title="ข้อมูลสินค้า รายเดือน" data={monthlyProducts} />
                    </div>
                </div>
            </div>
        </AppLayout>
    );
};

export default PalmDashboard;
