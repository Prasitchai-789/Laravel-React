interface UploadProgressProps {
  isLoading: boolean;
  uploadProgress: number;
}

export const UploadProgress: React.FC<UploadProgressProps> = ({ isLoading, uploadProgress }) => {
  if (!isLoading) return null;

  return (
    <div className="mt-4">
      <div className="flex justify-between text-sm text-gray-600 mb-1">
        <span>
          {uploadProgress < 100 ? 'กำลังประมวลผล...' : 'ประมวลผลเสร็จสิ้น'}
        </span>
        <span>{uploadProgress}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${uploadProgress}%` }}
        ></div>
      </div>
    </div>
  );
};
