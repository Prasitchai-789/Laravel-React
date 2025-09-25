import React from "react";

interface InputProps {
  label: React.ReactNode;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  labelClassName?: string;
  inputClassName?: string;
  errorClassName?: string;
  min?: number;
  step?: number
}

const InputLabel: React.FC<InputProps> = ({
  label,
  name,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder,
  error,
  disabled = false,
  className = "",
  labelClassName = "",
  inputClassName = "",
  errorClassName = "",
  min,
  step
}) => {
  return (
    <div className={className}>
      <label
        htmlFor={name}
        className={`mb-2 block text-sm font-medium text-gray-700 ${labelClassName}`}
      >
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        min={min}
        step={step}
        className={`block w-full rounded-lg border border-gray-300 px-4 py-3 font-anuphan shadow-sm transition duration-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100 ${inputClassName} ${
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

export default InputLabel;
