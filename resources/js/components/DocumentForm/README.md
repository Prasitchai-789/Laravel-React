# 📄 Document Form Components

Reusable components สำหรับสร้างเอกสารรูปแบบต่างๆ ที่สามารถปรับแต่งได้ง่าย

## Components

### 1. **DocumentHeaderTable**
Header ของเอกสารที่มีข้อมูล:
- ประเภทเอกสาร (Document Type)
- ชื่อเอกสาร (Document Name)
- วันที่บังคับใช้ (Effective Date)
- รหัสเอกสาร (Document Code)
- แก้ไขครั้งที่ (Revision)

**Props:**
```typescript
interface DocumentHeaderTableProps {
    header: DocumentHeader;
    logoSrc?: string;                    // Default: '/images/isp-touch-icon.png'
    companyName?: string;               // Default: 'บริษัท อีสานปาล์ม จำกัด'
    onHeaderChange?: (field, value) => void;
    readOnly?: boolean;                 // Default: false
}
```

**Usage:**
```tsx
import { DocumentHeaderTable, DocumentHeader } from '@/components/DocumentForm';

const MyComponent = () => {
    const [header, setHeader] = useState<DocumentHeader>({
        documentType: 'แบบฟอร์ม',
        documentName: 'รายงานตรวจสอบ',
        effectiveDate: '01-01-2569',
        documentCode: 'FM-IT-69-0001',
        revision: '01'
    });

    return (
        <DocumentHeaderTable
            header={header}
            onHeaderChange={(field, value) => {
                setHeader(prev => ({ ...prev, [field]: value }));
            }}
            readOnly={false}
        />
    );
};
```

---

### 2. **DocumentReportLayout**
Wrapper layout สำหรับเอกสารที่มี:
- Control bar (Print, Back buttons)
- A4 size container
- Print styling
- Footer information

**Props:**
```typescript
interface DocumentReportLayoutProps {
    title: string;                               // Document title
    header: DocumentHeader;                     // Document header
    children: ReactNode;                        // Content
    onHeaderChange?: (field, value) => void;   // Header change handler
    readOnly?: boolean;                        // Default: true (read-only mode)
    showPrintButton?: boolean;                 // Default: true
    showBackButton?: boolean;                  // Default: true
    onBack?: () => void;                       // Back button handler
}
```

**Usage:**
```tsx
import { DocumentReportLayout, DocumentHeader } from '@/components/DocumentForm';

const MyDocumentPage = () => {
    const header: DocumentHeader = {
        documentType: 'แบบฟอร์ม',
        documentName: 'รายงานตรวจสอบ',
        effectiveDate: '01-01-2569',
        documentCode: 'FM-IT-69-0001',
        revision: '01'
    };

    return (
        <DocumentReportLayout
            title="รายงานตรวจสอบ"
            header={header}
            readOnly={true}
            showPrintButton={true}
            showBackButton={true}
        >
            {/* Your content here */}
            <div className="grid grid-cols-2 gap-4">
                <div>Column 1</div>
                <div>Column 2</div>
            </div>
        </DocumentReportLayout>
    );
};

export default MyDocumentPage;
```

---

### 3. **GenericDocumentForm**
High-level wrapper ที่รวม DocumentReportLayout กับ form functionality

**Props:**
```typescript
interface GenericDocumentFormProps {
    title: string;
    initialHeader: DocumentHeader;
    onSave?: (header: DocumentHeader) => void;
    readOnly?: boolean;
    children?: React.ReactNode;
}
```

**Usage:**
```tsx
import { GenericDocumentForm } from '@/components/DocumentForm';

const MyDocumentForm = () => {
    const handleSave = (header) => {
        console.log('Saved:', header);
        // Submit to API
    };

    return (
        <GenericDocumentForm
            title="รายงานใหม่"
            initialHeader={{
                documentType: 'แบบฟอร์ม',
                documentName: 'รายงานตรวจสอบ',
                effectiveDate: '01-01-2569',
                documentCode: 'FM-NEW-69-0001',
                revision: '01'
            }}
            onSave={handleSave}
            readOnly={false}
        >
            {/* Form fields here */}
            <input type="text" placeholder="Enter data" />
        </GenericDocumentForm>
    );
};
```

---

## 🎯 Use Cases

### 1. **Computer Inspection Report**
```tsx
<DocumentReportLayout
    title="Inspection Report"
    header={{
        documentType: 'แบบฟอร์ม',
        documentName: 'รายงานการตรวจสอบคอมพิวเตอร์',
        effectiveDate: '01-01-2569',
        documentCode: 'FM-IT-69-0001',
        revision: '01'
    }}
>
    {/* Inspection content */}
</DocumentReportLayout>
```

### 2. **Maintenance Report**
```tsx
<DocumentReportLayout
    title="Maintenance Report"
    header={{
        documentType: 'แบบฟอร์ม',
        documentName: 'รายงานการบำรุงรักษา',
        effectiveDate: '01-01-2569',
        documentCode: 'FM-MAINT-69-0001',
        revision: '01'
    }}
>
    {/* Maintenance content */}
</DocumentReportLayout>
```

### 3. **Audit Report**
```tsx
<DocumentReportLayout
    title="Audit Report"
    header={{
        documentType: 'แบบฟอร์ม',
        documentName: 'รายงานการตรวจสอบภายใน',
        effectiveDate: '01-01-2569',
        documentCode: 'FM-AUDIT-69-0001',
        revision: '01'
    }}
>
    {/* Audit content */}
</DocumentReportLayout>
```

---

## 🎨 Styling Features

- ✅ **Responsive Design** - Work on desktop and mobile
- ✅ **Print-Ready** - Optimized for PDF printing (A4 size)
- ✅ **Editable Headers** - Can be switched to edit mode
- ✅ **Professional Layout** - Header table, footer, signature area
- ✅ **Tailwind CSS** - Built with Tailwind utilities

---

## 📱 Print Styles

Components มี built-in print styles ที่:
- ซ่อน UI controls
- ตั้งค่า page size เป็น A4
- ปรับ margins และ spacing
- เลขหน้าและข้อมูลเอกสาร

---

## 🔧 Customization

### เปลี่ยน Logo
```tsx
<DocumentHeaderTable
    header={header}
    logoSrc="/images/my-logo.png"
    companyName="บริษัทของฉัน"
/>
```

### Edit Mode vs Read-Only Mode
```tsx
// Edit mode - สามารถแก้ไข header ได้
<DocumentReportLayout
    header={header}
    onHeaderChange={handleChange}
    readOnly={false}
/>

// Read-only mode - เฉพาะดู
<DocumentReportLayout
    header={header}
    readOnly={true}
/>
```

### Hide Buttons
```tsx
<DocumentReportLayout
    header={header}
    showPrintButton={false}
    showBackButton={false}
/>
```

---

## 📦 Export & Import

```tsx
// Export all components
export { 
    DocumentHeaderTable, 
    DocumentReportLayout, 
    GenericDocumentForm,
    type DocumentHeader 
} from '@/components/DocumentForm';

// Or import individually
import DocumentReportLayout from '@/components/DocumentForm/DocumentReportLayout';
import { DocumentHeader } from '@/components/DocumentForm/DocumentHeaderTable';
```

---

## 🚀 Next Steps

1. ✅ สร้าง component พื้นฐาน
2. 📋 Refactor existing forms ให้ใช้ components เหล่านี้
3. 🎨 สร้าง variants (สีแตกต่าง, layout แตกต่าง)
4. 📊 สร้าง table/data display components
5. 💾 สร้าง save/export functionality
