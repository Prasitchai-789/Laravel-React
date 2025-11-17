interface FileInfoProps {
  fileName: string;
  recordCount: number;
  onClear: () => void;
}

export const FileInfo: React.FC<FileInfoProps> = ({ fileName, recordCount, onClear }) => {
  if (!fileName) return null;

  return (
    <div className="mt-4 p-4 bg-green-50 rounded-xl border border-green-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span className="text-green-700 font-medium">ไฟล์ที่เลือก</span>
        </div>
        <button
          onClick={onClear}
          className="text-red-500 hover:text-red-700 text-sm"
        >
          ลบ
        </button>
      </div>
      <p className="text-sm text-green-600 mt-1 truncate">{fileName}</p>
      <p className="text-xs text-green-500 mt-1">
        {recordCount} กะงานที่พบ
      </p>
    </div>
  );
};
