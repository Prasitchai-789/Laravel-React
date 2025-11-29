import React from 'react';
import { BarChart3, List } from 'lucide-react';

interface ViewSwitchProps {
    currentView: 'summary' | 'details';
    setCurrentView: (view: 'summary' | 'details') => void;
    filteredPerplesCount: number;
    fmt: (n: number) => string;
}

const ViewSwitch: React.FC<ViewSwitchProps> = ({
    currentView,
    setCurrentView,
    filteredPerplesCount,
    fmt
}) => {
    return (
        <div className="flex bg-slate-100 rounded-2xl p-2 mb-8">
            <button
                className={`flex-1 px-6 py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-3 ${
                    currentView === "summary"
                        ? "bg-white text-blue-600 shadow-lg"
                        : "text-slate-600 hover:text-slate-800"
                }`}
                onClick={() => setCurrentView("summary")}
            >
                <BarChart3 className="w-5 h-5" />
                สรุปภาพรวม
            </button>
            <button
                className={`flex-1 px-6 py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-3 ${
                    currentView === "details"
                        ? "bg-white text-blue-600 shadow-lg"
                        : "text-slate-600 hover:text-slate-800"
                }`}
                onClick={() => setCurrentView("details")}
            >
                <List className="w-5 h-5" />
                รายชื่อประชากร ({fmt(filteredPerplesCount)})
            </button>
        </div>
    );
};

export default ViewSwitch;
