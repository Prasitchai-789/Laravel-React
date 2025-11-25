// resources/js/Components/Preplo/components/FileUploadSection.jsx
import React from 'react';
import FileInfo from './FileInfo';

const FileUploadSection = ({ loading, submitting, fileName, rows, parsedData, onFileChange }) => (
  <div className="mb-6 p-6 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-blue-400 transition-colors">
    <div className="mb-4">
      <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
      </svg>
    </div>

    <input
      type="file"
      accept=".xlsx,.xls"
      onChange={onFileChange}
      disabled={loading || submitting}
      className="hidden"
      id="file-upload"
    />

    <label
      htmlFor="file-upload"
      className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer ${
        (loading || submitting) ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      {loading ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          กำลังอ่านไฟล์...
        </>
      ) : (
        'เลือกไฟล์ Excel'
      )}
    </label>

    <p className="mt-2 text-sm text-gray-500">
      รองรับไฟล์ .xlsx, .xls
    </p>

    {fileName && (
      <FileInfo fileName={fileName} rows={rows} parsedData={parsedData} />
    )}
  </div>
);

export default FileUploadSection;
