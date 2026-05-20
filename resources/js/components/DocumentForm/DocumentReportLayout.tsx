import React, { ReactNode } from 'react';
import { Printer, ChevronLeft } from 'lucide-react';
import DocumentHeaderTable, { DocumentHeader } from './DocumentHeaderTable';

interface DocumentReportLayoutProps {
    title: string;
    header: DocumentHeader;
    children: ReactNode;
    onHeaderChange?: (field: keyof DocumentHeader, value: string) => void;
    readOnly?: boolean;
    showPrintButton?: boolean;
    showBackButton?: boolean;
    onBack?: () => void;
}

/**
 * Reusable Document Report Layout Component
 * ใช้สำหรับเอกสารรูปแบบต่างๆ (Computer Inspection, Maintenance, etc.)
 */
export default function DocumentReportLayout({
    title,
    header,
    children,
    onHeaderChange,
    readOnly = true,
    showPrintButton = true,
    showBackButton = true,
    onBack
}: DocumentReportLayoutProps) {

    const handlePrint = () => {
        window.print();
    };

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            window.history.back();
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 font-anuphan p-4 md:p-8 print:bg-white print:p-0">
            {/* Control Bar - Hidden on print */}
            {(showBackButton || showPrintButton) && (
                <div className="max-w-[800px] mx-auto mb-6 flex items-center justify-between bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-white print:hidden">
                    {showBackButton && (
                        <button
                            onClick={handleBack}
                            className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-xl transition-all font-bold"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            <span>กลับไป</span>
                        </button>
                    )}

                    {showPrintButton && (
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 font-bold ml-auto"
                        >
                            <Printer className="w-4 h-4" />
                            <span>พิมพ์รายงาน (PDF)</span>
                        </button>
                    )}
                </div>
            )}

            {/* Report Container */}
            <div className="report-container bg-white mx-auto shadow-2xl relative print:shadow-none print:w-full print:mx-0">
                <style dangerouslySetInnerHTML={{ __html: `
                    @media screen {
                        .report-container {
                            width: 210mm;
                            min-height: 297mm;
                            padding: 15mm;
                        }
                    }
                    @media print {
                        @page {
                            size: A4;
                            margin: 7mm;
                        }
                        body {
                            margin: 0;
                            -webkit-print-color-adjust: exact;
                        }
                        .print-hidden {
                            display: none !important;
                        }
                        nav, aside, header, footer {
                            display: none !important;
                        }
                        .report-container {
                            width: 100% !important;
                            max-width: 100% !important;
                            min-height: calc(297mm - 14mm) !important;
                            margin: 0 !important;
                            padding: 0 0 8mm 0 !important;
                            box-shadow: none !important;
                            box-sizing: border-box !important;
                        }
                        .document-content {
                            padding-bottom: 5mm !important;
                        }
                        .document-footer {
                            bottom: 0 !important;
                        }
                    }
                ` }} />

                {/* Document Header */}
                <DocumentHeaderTable
                    header={header}
                    onHeaderChange={onHeaderChange}
                    readOnly={readOnly}
                />

                {/* Main Content */}
                <div className="document-content">
                    {children}
                </div>

                {/* Footer Info */}
                <div className="document-footer absolute bottom-4 left-0 right-0 flex justify-between px-8 text-[9px] text-slate-400">
                    <span>พิมพ์เมื่อ: {new Date().toLocaleString('th-TH')}</span>
                    <div className="flex gap-4">
                        {/* <span>หน้า 1/1</span> */}
                        <span>{header.documentCode} - Rev.{header.revision}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
