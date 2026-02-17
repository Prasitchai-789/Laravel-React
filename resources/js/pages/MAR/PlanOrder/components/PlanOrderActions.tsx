import React from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { FileText, CheckCircle, XCircle, Calendar } from 'lucide-react';

interface Props {
    selectedOrders: number[];
    onActionComplete: () => void;
}

export default function PlanOrderActions({ selectedOrders, onActionComplete }: Props) {
    const [showCreatePlan, setShowCreatePlan] = React.useState(false);
    const [showUpdateStatus, setShowUpdateStatus] = React.useState(false);

    const handleCreatePlan = () => {
        console.log('สร้างแผนการผลิตสำหรับคำสั่งซื้อ:', selectedOrders);
        setShowCreatePlan(false);
        onActionComplete();
    };

    const handleUpdateStatus = (status: string) => {
        console.log(`อัปเดตสถานะเป็น ${status} สำหรับคำสั่งซื้อ:`, selectedOrders);
        setShowUpdateStatus(false);
        onActionComplete();
    };

    return (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg border p-2 flex items-center gap-2 z-50">
            <span className="text-sm text-gray-600 px-3">
                เลือก {selectedOrders.length} รายการ
            </span>

            <div className="h-4 w-px bg-gray-300" />

            {/* ปุ่มสร้างแผนการผลิต */}
            <Dialog open={showCreatePlan} onOpenChange={setShowCreatePlan}>
                <DialogTrigger asChild>
                    <Button variant="default" size="sm" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span>สร้างแผนการผลิต</span>
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>สร้างแผนการผลิต</DialogTitle>
                        <DialogDescription>
                            ยืนยันการสร้างแผนการผลิตสำหรับคำสั่งซื้อที่เลือก {selectedOrders.length} รายการ
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="py-4">
                        <p className="text-sm text-gray-500">
                            ระบบจะสร้างแผนการผลิตจากคำสั่งซื้อที่เลือกทั้งหมด
                        </p>
                    </div>
                    
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCreatePlan(false)}>
                            ยกเลิก
                        </Button>
                        <Button onClick={handleCreatePlan}>
                            ยืนยัน
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ปุ่มอัปเดตสถานะ */}
            <Dialog open={showUpdateStatus} onOpenChange={setShowUpdateStatus}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        <span>อัปเดตสถานะ</span>
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>อัปเดตสถานะคำสั่งซื้อ</DialogTitle>
                        <DialogDescription>
                            เลือกสถานะที่ต้องการอัปเดตสำหรับคำสั่งซื้อ {selectedOrders.length} รายการ
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid grid-cols-2 gap-2 py-4">
                        <Button
                            variant="outline"
                            className="flex flex-col items-center p-4 h-auto"
                            onClick={() => handleUpdateStatus('confirmed')}
                        >
                            <CheckCircle className="h-6 w-6 text-blue-500 mb-2" />
                            <span>ยืนยันคำสั่งซื้อ</span>
                        </Button>
                        
                        <Button
                            variant="outline"
                            className="flex flex-col items-center p-4 h-auto"
                            onClick={() => handleUpdateStatus('production')}
                        >
                            <Calendar className="h-6 w-6 text-purple-500 mb-2" />
                            <span>เริ่มการผลิต</span>
                        </Button>
                        
                        <Button
                            variant="outline"
                            className="flex flex-col items-center p-4 h-auto"
                            onClick={() => handleUpdateStatus('completed')}
                        >
                            <CheckCircle className="h-6 w-6 text-green-500 mb-2" />
                            <span>เสร็จสิ้น</span>
                        </Button>
                        
                        <Button
                            variant="outline"
                            className="flex flex-col items-center p-4 h-auto"
                            onClick={() => handleUpdateStatus('cancelled')}
                        >
                            <XCircle className="h-6 w-6 text-red-500 mb-2" />
                            <span>ยกเลิก</span>
                        </Button>
                    </div>
                    
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowUpdateStatus(false)}>
                            ปิด
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}