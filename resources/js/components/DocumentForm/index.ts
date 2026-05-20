export { default as DocumentHeaderTable, type DocumentHeader } from './DocumentHeaderTable';
export { default as DocumentReportLayout } from './DocumentReportLayout';
export { default as GenericDocumentForm } from './GenericDocumentForm';

/**
 * Document Form Components - Reusable Components for Document Forms
 *
 * Usage Example:
 *
 * import { DocumentReportLayout, DocumentHeader } from '@/components/DocumentForm';
 *
 * const MyDocumentPage = () => {
 *   const [header, setHeader] = useState<DocumentHeader>({
 *     documentType: 'แบบฟอร์ม',
 *     documentName: 'รายงานตรวจสอบ',
 *     effectiveDate: '01-01-2569',
 *     documentCode: 'FM-IT-69-0001',
 *     revision: '01'
 *   });
 *
 *   return (
 *     <DocumentReportLayout
 *       title="รายงาน"
 *       header={header}
 *       onHeaderChange={(field, value) => {
 *         setHeader(prev => ({ ...prev, [field]: value }));
 *       }}
 *     >
 *       {/* Your content here */}
 *     </DocumentReportLayout>
 *   );
 * };
 *
 * export default MyDocumentPage;
 */
