import * as LucideIcons from 'lucide-react';
import React from 'react';

interface InputFloatingProps {
    label: string;
    name: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    icon?: keyof typeof LucideIcons; // ใช้ชื่อไอคอนจาก Lucide แทน class
    required?: boolean;
    error?: string;
    type?: string;
    disabled?: boolean;
}

const InputFloating: React.FC<InputFloatingProps> = ({
    label,
    name,
    value,
    onChange,
    icon,
    required = false,
    error,
    type = 'text',
    disabled = false,
}) => {
    // เลือกไอคอนจาก Lucide ตามชื่อที่ส่งมา
    const IconComponent = icon ? LucideIcons[icon] : null;

    return (
        <div className="mb-5 w-full font-anuphan">
            <div className="group relative flex items-center">
                {IconComponent && (
                    <div className="absolute left-3 z-10 text-gray-500 transition-colors group-focus-within:text-blue-600">
                        <IconComponent size={22} />
                    </div>
                )}

                <input
                    type={type}
                    id={name}
                    name={name}
                    value={value}
                    onChange={onChange}
                    required={required}
                    disabled={disabled}
                    className={`w-full px-4 py-3 ${icon ? 'pl-11' : 'pl-4'} peer rounded-lg border bg-white pr-4 text-blue-700 placeholder-transparent focus:border-blue-500 focus:ring-1 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100 ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
                    placeholder={label}
                />

                <label
                    htmlFor={name}
                    className={`pointer-events-none absolute left-4 origin-[0] bg-white px-1 transition-all duration-200 ease-in-out peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:scale-100 peer-focus:top-0 peer-focus:-translate-y-3 peer-focus:scale-75 ${icon ? 'left-11' : 'left-4'} ${error ? 'text-red-600' : 'text-gray-500 peer-focus:text-blue-600'} ${value ? 'top-0 -translate-y-3 scale-75' : 'top-1/2 -translate-y-1/2 scale-100'}`}
                >
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            </div>

            {error && (
                <p className="mt-2 flex items-center text-sm text-red-600">
                    <LucideIcons.AlertCircle size={16} className="mr-1" />
                    {error}
                </p>
            )}
        </div>
    );
};

export default InputFloating;


//ตัวอย่างการนำไปใช่

{/* <InputFloating
    label="ชื่อ-นามสกุล"
    name="EmpName"
    value={empName}
    onChange={(e) => setEmpName(e.target.value)}
    icon="FolderPen"
    required
    error={empName === '' ? 'กรุณากรอกชื่อ-นามสกุล' : undefined}
/>; */}
