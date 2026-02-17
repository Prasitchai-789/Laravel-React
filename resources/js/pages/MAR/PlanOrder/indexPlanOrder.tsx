import React, { useState, useMemo } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';  
import { 
    PlanOrderHeader,
    PlanOrderFilters,
    PlanOrderTable,
    PlanOrder,
    PlanOrderSummary,
    PlanOrderActions,
    CreatePlanOrderModal
} from './components';
import { Package, Droplets, Leaf, Trees, Flower2 } from 'lucide-react';

// Interface for CreatePlanOrderModal submit data
interface CreateOrderFormData {
    receiveDate: string;
    productName: string;
    vehicles: Array<{ licensePlate: string; driverName: string }>;
    customerName: string;
    customerCode: string;
    weight: string;
    destination: string;
}

// Mock Data ใหม่ ให้สอดคล้องกับสินค้า 5 ประเภท
const mockOrders: PlanOrder[] = [
    // น้ำมันปาล์มดิบ (CPO)
    {
        id: 1,
        orderNumber: 'PO-20240217-001',
        orderDate: '2024-02-17',
        productType: 'cpo',
        productName: 'น้ำมันปาล์มดิบ (CPO)',
        licensePlate: 'กล 1234',
        driverName: 'สมชาย ใจดี',
        customerName: 'บริษัท สยามปาล์ม จำกัด',
        customerCode: 'CUST001',
        netWeight: 5000,
        unit: 'ตัน',
        status: 'pending',
        priority: 'urgent',
        destination: 'กรุงเทพฯ'
    },
    {
        id: 2,
        orderNumber: 'PO-20240217-002',
        orderDate: '2024-02-17',
        productType: 'cpo',
        productName: 'น้ำมันปาล์มดิบ (CPO)',
        licensePlate: 'กล 5678',
        driverName: 'สมหญิง รักดี',
        customerName: 'บริษัท ไทยออยล์ จำกัด',
        customerCode: 'CUST002',
        netWeight: 8000,
        unit: 'ตัน',
        status: 'production',
        priority: 'high',
        destination: 'ชลบุรี'
    },
    
    // เมล็ดในปาล์ม
    {
        id: 3,
        orderNumber: 'PO-20240217-003',
        orderDate: '2024-02-17',
        productType: 'kernel',
        productName: 'เมล็ดในปาล์ม',
        licensePlate: 'นฐ 9101',
        driverName: 'ประสงค์ มีทรัพย์',
        customerName: 'ห้างหุ้นส่วนจำกัด เกษตรพัฒนา',
        customerCode: 'CUST003',
        netWeight: 2000,
        unit: 'กก.',
        status: 'confirmed',
        priority: 'normal',
        destination: 'ราชบุรี'
    },
    {
        id: 4,
        orderNumber: 'PO-20240216-004',
        orderDate: '2024-02-16',
        productType: 'kernel',
        productName: 'เมล็ดในปาล์ม',
        licensePlate: 'นฐ 1122',
        driverName: 'วิชัย การดี',
        customerName: 'บริษัท พืชผลไทย จำกัด',
        customerCode: 'CUST004',
        netWeight: 1500,
        unit: 'กก.',
        status: 'completed',
        priority: 'normal',
        destination: 'นครปฐม'
    },
    
    // กะลาปาล์ม (Shell)
    {
        id: 5,
        orderNumber: 'PO-20240216-005',
        orderDate: '2024-02-16',
        productType: 'shell',
        productName: 'กะลาปาล์ม (เพียว)',
        licensePlate: 'อช 3344',
        driverName: 'สมศักดิ์ ทรัพย์ทวี',
        customerName: 'บริษัท พลังงานสะอาด จำกัด',
        customerCode: 'CUST005',
        netWeight: 3000,
        unit: 'ตัน',
        status: 'pending',
        priority: 'urgent',
        destination: 'ฉะเชิงเทรา'
    },
    
    // ทะลายสับ (EFB)
    {
        id: 6,
        orderNumber: 'PO-20240215-006',
        orderDate: '2024-02-15',
        productType: 'efb',
        productName: 'ทะลายสับ (EFB Fiber)',
        licensePlate: 'ขจ 5566',
        driverName: 'มานะ ขยันดี',
        customerName: 'โรงงานผลิตปุ๋ยอินทรีย์',
        customerCode: 'CUST006',
        netWeight: 4000,
        unit: 'ตัน',
        status: 'production',
        priority: 'high',
        destination: 'สระบุรี'
    },
    
    // ใยปาล์ม (Fiber)
    {
        id: 7,
        orderNumber: 'PO-20240215-007',
        orderDate: '2024-02-15',
        productType: 'fiber',
        productName: 'ใยปาล์ม',
        licensePlate: 'นม 7788',
        driverName: 'สำรวย รวยทรัพย์',
        customerName: 'บริษัท เกษตรอินทรีย์',
        customerCode: 'CUST007',
        netWeight: 1000,
        unit: 'กก.',
        status: 'completed',
        priority: 'normal',
        destination: 'นครราชสีมา'
    },
    {
        id: 8,
        orderNumber: 'PO-20240214-008',
        orderDate: '2024-02-14',
        productType: 'fiber',
        productName: 'ใยปาล์ม',
        licensePlate: 'นม 9900',
        driverName: 'สายใจ รักดี',
        customerName: 'วิสาหกิจชุมชนบ้านไร่',
        customerCode: 'CUST008',
        netWeight: 500,
        unit: 'กก.',
        status: 'pending',
        priority: 'high',
        destination: 'ขอนแก่น'
    }
];

export default function IndexPlanOrder() {
    const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
    const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');
    const [orders, setOrders] = useState(mockOrders);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedProductType, setSelectedProductType] = useState<string | null>(null);
    const [filters, setFilters] = useState({
        search: '',
        status: 'all',
        priority: 'all',
        productType: 'all',
        dateFrom: '',
        dateTo: '',
    });

    // คำนวณสถิติรวมทั้งหมด (สำหรับใช้ต่ออนาคต)
    // const totalStats = useMemo(() => {
    //     const pending = orders.filter(o => o.status === 'pending').length;
    //     const completed = orders.filter(o => o.status === 'completed').length;
    //     ...
    // }, [orders]);

    // ฟังก์ชันกรองข้อมูลตาม filters - ทำการกรองในครั้งเดียว
    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
            // ค้นหา
            if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                const matchSearch = 
                    order.orderNumber.toLowerCase().includes(searchLower) ||
                    order.customerName.toLowerCase().includes(searchLower) ||
                    order.productName.toLowerCase().includes(searchLower) ||
                    (order.licensePlate && order.licensePlate.toLowerCase().includes(searchLower)) ||
                    (order.driverName && order.driverName.toLowerCase().includes(searchLower)) ||
                    (order.customerCode && order.customerCode.toLowerCase().includes(searchLower));
                
                if (!matchSearch) return false;
            }

            // กรองตามสถานะ
            if (filters.status && filters.status !== 'all') {
                if (order.status !== filters.status) return false;
            }

            // กรองตามความสำคัญ
            if (filters.priority && filters.priority !== 'all') {
                if (order.priority !== filters.priority) return false;
            }

            // กรองตามประเภทสินค้า
            if (filters.productType && filters.productType !== 'all') {
                if (order.productType !== filters.productType) return false;
            }

            // กรองตามวันที่
            if (filters.dateFrom && order.orderDate < filters.dateFrom) return false;
            if (filters.dateTo && order.orderDate > filters.dateTo) return false;

            return true;
        });
    }, [orders, filters]);

    const handleSelectOrder = (orderId: number) => {
        setSelectedOrders(prev =>
            prev.includes(orderId)
                ? prev.filter(id => id !== orderId)
                : [...prev, orderId]
        );
    };

    const handleSelectAll = () => {
        if (selectedOrders.length === filteredOrders.length) {
            setSelectedOrders([]);
        } else {
            setSelectedOrders(filteredOrders.map(order => order.id));
        }
    };

    const handleFilterChange = (newFilters: Partial<typeof filters>) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    };

    const handleProductSelect = (productType: string | null) => {
        setSelectedProductType(productType);
        if (productType) {
            setFilters(prev => ({ ...prev, productType }));
        }
    };

    // คำนวณสถิติของข้อมูลที่ผ่านการกรอง
    const filteredStats = useMemo(() => {
        const total = filteredOrders.length;
        const pending = filteredOrders.filter(o => o.status === 'pending').length;
        const completed = filteredOrders.filter(o => o.status === 'completed').length;
        const production = filteredOrders.filter(o => o.status === 'production').length;
        const confirmed = filteredOrders.filter(o => o.status === 'confirmed').length;
        const cancelled = filteredOrders.filter(o => o.status === 'cancelled').length;
        const totalWeight = filteredOrders.reduce((sum, o) => sum + o.netWeight, 0);

        return {
            total,
            pending,
            completed,
            production,
            confirmed,
            cancelled,
            totalWeight
        };
    }, [filteredOrders]);

    const handleActionComplete = () => {
        setSelectedOrders([]);
        alert('ดำเนินการเรียบร้อย (เป็นเพียงตัวอย่าง UI)');
    };

    const handleCreatePlanOrder = (data: CreateOrderFormData) => {
        // สร้าง ID ใหม่
        const newId = Math.max(...orders.map(o => o.id), 0) + 1;
        
        // สร้างเลขที่คำสั่งซื้อใหม่
        const today = new Date();
        const dateStr = today.toISOString().slice(0,10).replace(/-/g, '');
        const orderNumber = `PO-${dateStr}-${String(newId).padStart(3, '0')}`;
        
        // แปลง productName จาก value เป็นชื่อเต็ม
        const productMap: { [key: string]: string } = {
            'cpo': 'น้ำมันปาล์มดิบ (CPO)',
            'palm-kernel': 'เมล็ดในปาล์ม',
            'fertilizer': 'ปุ๋ยอินทรีย์',
            'palm-oil': 'น้ำมันปาล์มบริสุทธิ์',
            'palm-fiber': 'ใยปาล์ม',
            'shell': 'กะลาปาล์ม (เพียว)',
            'efb': 'ทะลายสับ (EFB Fiber)',
            'fiber': 'ใยปาล์ม'
        };

        // แปลง destination จาก value เป็นชื่อเต็ม
        const destinationMap: { [key: string]: string } = {
            'bangkok': 'กรุงเทพฯ',
            'chonburi': 'ชลบุรี',
            'rayong': 'ระยอง',
            'samutprakarn': 'สมุทรปราการ',
            'ayutthaya': 'พระนครศรีอยุธยา'
        };

        // แปลง unit ตามน้ำหนัก
        const weight = parseFloat(data.weight) || 0;
        const unit = weight > 100 ? 'ตัน' : 'กก.';

        // สร้างรายการใหม่จากข้อมูลใน modal
        const newOrder: PlanOrder = {
            id: newId,
            orderNumber: orderNumber,
            orderDate: data.receiveDate,
            productType: data.productName,
            productName: productMap[data.productName] || data.productName,
            licensePlate: data.vehicles[0]?.licensePlate || '',
            driverName: data.vehicles[0]?.driverName || '',
            customerName: data.customerName,
            customerCode: data.customerCode,
            netWeight: weight,
            unit: unit,
            status: 'pending' as const,
            priority: 'normal' as const,
            destination: destinationMap[data.destination] || data.destination,
        };
        
        // เพิ่มเข้าไปในรายการ
        setOrders([...orders, newOrder]);
        
        // ปิด modal
        setIsCreateModalOpen(false);
        
        // แสดงข้อความสำเร็จ
        alert('เพิ่มแผนการขนส่งเรียบร้อย');
        
        console.log('สร้างแผนการขนส่ง:', newOrder);
    };

    // คำนวณสถิติแยกตามประเภทสินค้า
    const productStats = useMemo(() => {
        const products = ['cpo', 'kernel', 'shell', 'efb', 'fiber'];
        return products.map(type => ({
            type,
            total: orders.filter(o => o.productType === type).length,
            completed: orders.filter(o => o.productType === type && o.status === 'completed').length
        }));
    }, [orders]);

    return (
        <AppLayout>
            <Head title="วางแผนการขนส่ง" />
            
            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <PlanOrderHeader
                        viewMode={viewMode}
                        onViewModeChange={setViewMode}
                        selectedCount={selectedOrders.length}
                        onCreateClick={() => setIsCreateModalOpen(true)}
                    />

                    {/* Filters */}
                    <PlanOrderFilters
                        filters={filters}
                        onFilterChange={handleFilterChange}
                        totalCount={filteredOrders.length}
                        stats={filteredStats}
                        onProductSelect={handleProductSelect}
                    />

                    {/* Summary */}
                    <PlanOrderSummary 
                        orders={filteredOrders}
                        onProductSelect={handleProductSelect}
                        selectedProduct={selectedProductType}
                    />

                    {/* Main Content */}
                    <div className="mt-6">
                        {viewMode === 'table' ? (
                            <PlanOrderTable
                                orders={filteredOrders}
                                selectedOrders={selectedOrders}
                                onSelectOrder={handleSelectOrder}
                                onSelectAll={handleSelectAll}
                                stats={filteredStats}
                            />
                        ) : (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                                <div className="flex justify-center mb-4">
                                    <div className="grid grid-cols-5 gap-2">
                                        <div className="bg-amber-50 p-3 rounded-lg">
                                            <Droplets className="h-8 w-8 text-amber-500" />
                                        </div>
                                        <div className="bg-emerald-50 p-3 rounded-lg">
                                            <Flower2 className="h-8 w-8 text-emerald-500" />
                                        </div>
                                        <div className="bg-stone-50 p-3 rounded-lg">
                                            <Package className="h-8 w-8 text-stone-500" />
                                        </div>
                                        <div className="bg-lime-50 p-3 rounded-lg">
                                            <Trees className="h-8 w-8 text-lime-500" />
                                        </div>
                                        <div className="bg-orange-50 p-3 rounded-lg">
                                            <Leaf className="h-8 w-8 text-orange-500" />
                                        </div>
                                    </div>
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    มุมมองปฏิทิน
                                </h3>
                                <p className="text-gray-500 mb-4">
                                    กำลังอยู่ในระหว่างการพัฒนา
                                </p>
                                <div className="text-sm text-gray-400">
                                    สินค้าทั้ง 5 ประเภท: 
                                    {productStats.map((p, i) => (
                                        <span key={p.type} className="mx-1">
                                            {p.total} {['CPO', 'Kernel', 'Shell', 'EFB', 'Fiber'][i]}
                                            {i < 4 ? ',' : ''}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    {selectedOrders.length > 0 && (
                        <PlanOrderActions
                            selectedOrders={selectedOrders}
                            onActionComplete={handleActionComplete}
                        />
                    )}
                </div>
            </div>

            {/* Create Modal */}
            <CreatePlanOrderModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSubmit={handleCreatePlanOrder}
            />
        </AppLayout>
    );
}