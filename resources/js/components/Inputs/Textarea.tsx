import React from "react";

interface TextareaProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  required?: boolean;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  rows?: number;
  className?: string;
  labelClassName?: string;
  textareaClassName?: string;
  errorClassName?: string;
}

const Textarea: React.FC<TextareaProps> = ({
  label,
  name,
  value,
  onChange,
  required = false,
  placeholder,
  error,
  disabled = false,
  rows = 3,
  className = "",
  labelClassName = "",
  textareaClassName = "",
  errorClassName = "",
}) => {
  return (
    <div className={className}>
      <label
        htmlFor={name}
        className={`block text-sm font-medium text-gray-700 pb-2 ${labelClassName}`}
      >
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        rows={rows}
        className={`block w-full rounded-md border border-gray-300 px-4 py-2.5 shadow-sm transition duration-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100 ${textareaClassName} ${
          error ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
        }`}
      />
      {error && (
        <p className={`mt-1 text-sm text-red-600 ${errorClassName}`}>
          {error}
        </p>
      )}
    </div>
  );
};

export default Textarea;
