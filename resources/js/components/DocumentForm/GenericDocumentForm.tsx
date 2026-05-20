import React, { useState } from 'react';
import DocumentReportLayout from './DocumentReportLayout';
import { DocumentHeader } from './DocumentHeaderTable';

/**
 * Example: GenericDocumentForm Component
 * สามารถนำไปใช้กับเอกสารประเภทต่างๆ ได้
 *
 * Usage:
 * <GenericDocumentForm
 *     title="รายงานการตรวจสอบคอมพิวเตอร์"
 *     initialHeader={{...}}
 *     onSave={(header) => {...}}
 * />
 */

interface GenericDocumentFormProps {
    title: string;
    initialHeader: DocumentHeader;
    onSave?: (header: DocumentHeader) => void;
    readOnly?: boolean;
    children?: React.ReactNode;
}

export default function GenericDocumentForm({
    title,
    initialHeader,
    onSave,
    readOnly = false,
    children
}: GenericDocumentFormProps) {
    const [header, setHeader] = useState<DocumentHeader>(initialHeader);

    const handleHeaderChange = (field: keyof DocumentHeader, value: string) => {
        setHeader(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSave = () => {
        if (onSave) {
            onSave(header);
        }
    };

    return (
        <DocumentReportLayout
            title={title}
            header={header}
            onHeaderChange={handleHeaderChange}
            readOnly={readOnly}
            showPrintButton={true}
            showBackButton={true}
        >
            {/* Form Content Area */}
            <div className="space-y-6">
                {children}

                {/* Edit Mode Save Button */}
                {!readOnly && (
                    <div className="flex justify-center gap-4 mt-8 print:hidden">
                        <button
                            onClick={handleSave}
                            className="px-8 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-bold"
                        >
                            บันทึก
                        </button>
                        <button
                            onClick={() => window.history.back()}
                            className="px-8 py-2 bg-slate-400 text-white rounded-lg hover:bg-slate-500 transition-all font-bold"
                        >
                            ยกเลิก
                        </button>
                    </div>
                )}
            </div>
        </DocumentReportLayout>
    );
}
