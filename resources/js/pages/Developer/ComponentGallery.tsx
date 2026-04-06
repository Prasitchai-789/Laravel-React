import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { DetailedPalmCard, RemainingStockCard } from '@/components/Production/ProductionKPICards';
import { Leaf, Code } from 'lucide-react';

export default function ComponentGallery() {
    // Mock data for DetailedPalmCard
    const [mockPalmData, setMockPalmData] = useState({
        total: 154200,
        carry: 45000,
        incoming: 109200,
        progress: 85
    });

    // Mock data for RemainingStockCard
    const [mockStockData, setMockStockData] = useState({
        value: 120500,
        progress: 65
    });

    return (
        <AppLayout breadcrumbs={[{ title: 'Developer', href: '#' }, { title: 'Component Gallery', href: '#' }]}>
            <Head title="Component Gallery" />
            <div className="flex h-full w-full flex-col gap-6 p-6 font-primary min-h-screen bg-slate-50/50">
                <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2 font-prompt">
                            <Code className="w-6 h-6 text-indigo-500" />
                            Component Gallery (Developer Zone)
                        </h1>
                        <p className="text-slate-500 mt-1 font-anuphan">
                            ศูนย์รวม UI Component แบบ Reusable สำหรับนักพัฒนา 
                            ไว้สามารถ Copy Source Code หรือ Import ไปประกอบลงหน้ารายงานอื่นได้ทันที
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {/* Section 1: Palm Quantity Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                        <div className="bg-slate-800 text-white p-4 font-mono text-sm flex justify-between items-center">
                            <span>{'<DetailedPalmCard />'}</span>
                            <span className="px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded text-xs">Production UI</span>
                        </div>
                        <div className="p-6 bg-slate-100 flex-1 flex flex-col items-center justify-center min-h-[300px]">
                            {/* Render the component exactly as it would appear */}
                            <div className="w-full">
                                <DetailedPalmCard 
                                    total={mockPalmData.total}
                                    carry={mockPalmData.carry}
                                    incoming={mockPalmData.incoming}
                                    progress={mockPalmData.progress}
                                />
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-100 bg-white">
                            <h3 className="font-bold text-slate-800 mb-2 font-prompt">Props Control</h3>
                            <ul className="text-sm text-slate-600 space-y-2 font-mono bg-slate-50 rounded-lg p-4 border border-slate-100">
                                <li><span className="text-emerald-600">total:</span> {"number - ผลรวม kg."}</li>
                                <li><span className="text-blue-600">carry:</span> {"number - พันธ์ุยกมา kg."}</li>
                                <li><span className="text-amber-600">incoming:</span> {"number - รับเข้า kg."}</li>
                                <li><span className="text-purple-600">progress:</span> {"number (0-100) - สถานะตุนของ"}</li>
                            </ul>
                            <div className="mt-4 pt-4 border-t border-slate-100">
                                <h3 className="font-bold text-slate-800 mb-2 font-prompt">Usage</h3>
                                <div className="text-xs text-slate-500 font-mono bg-slate-800 text-slate-300 p-3 rounded-lg overflow-x-auto whitespace-pre">
                                    {`import { DetailedPalmCard } from '@/components/Production/ProductionKPICards';\n\n<DetailedPalmCard \n  total={154200}\n  carry={45000}\n  incoming={109200}\n  progress={85}\n/>`}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Remaining Stock Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                        <div className="bg-slate-800 text-white p-4 font-mono text-sm flex justify-between items-center">
                            <span>{'<RemainingStockCard />'}</span>
                            <span className="px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded text-xs">Production UI</span>
                        </div>
                        <div className="p-6 bg-slate-100 flex-1 flex flex-col items-center justify-center min-h-[300px]">
                            {/* Render the component exactly as it would appear */}
                            <div className="w-full">
                                <RemainingStockCard 
                                    value={mockStockData.value}
                                    progress={mockStockData.progress}
                                />
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-100 bg-white">
                            <h3 className="font-bold text-slate-800 mb-2 font-prompt">Props Control</h3>
                            <ul className="text-sm text-slate-600 space-y-2 font-mono bg-slate-50 rounded-lg p-4 border border-slate-100">
                                <li><span className="text-emerald-600">value:</span> {"number - ผลปาล์มคงเหลือ kg."}</li>
                                <li><span className="text-purple-600">progress:</span> {"number (0-100) - สถานะตุนของในลาน"}</li>
                            </ul>
                            <div className="mt-4 pt-4 border-t border-slate-100">
                                <h3 className="font-bold text-slate-800 mb-2 font-prompt">Usage</h3>
                                <div className="text-xs text-slate-500 font-mono bg-slate-800 text-slate-300 p-3 rounded-lg overflow-x-auto whitespace-pre">
                                    {`import { RemainingStockCard } from '@/components/Production/ProductionKPICards';\n\n<RemainingStockCard \n  value={120500}\n  progress={65}\n/>`}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Placeholder for future cards */}
                    <div className="border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center min-h-[400px] text-slate-400 font-anuphan flex-col gap-4">
                        <Leaf className="w-8 h-8 text-slate-300" />
                        <p>รอ Component อื่นๆ จากนักพัฒนา...</p>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
