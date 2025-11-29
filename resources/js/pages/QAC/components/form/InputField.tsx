import React from "react";
import { Calculator } from "lucide-react";

interface InputFieldProps {
    label?: string;
    value: any;
    onChange: (v: string) => void;

    required?: boolean;
    disabled?: boolean;
    readOnly?: boolean;

    icon?: any;
    compact?: boolean;
    className?: string;

    tankIndex?: number;
    fieldName?: string;

    allowDecimal?: boolean;
    showCalculator?: boolean;
    onCalculatorClick?: () => void;

    setInputRef?: (tankIndex: number, fieldName: string) => (el: HTMLInputElement | null) => void;
    formatNumberInput?: (value: string, allowDecimal?: boolean) => string;
}

export default function InputField({
    label,
    value,
    onChange,

    required = false,
    disabled = false,
    readOnly = false,

    icon: Icon,
    compact = false,
    className = "",

    tankIndex,
    fieldName,
    allowDecimal = true,

    showCalculator = false,
    onCalculatorClick,

    setInputRef,
    formatNumberInput,
}: InputFieldProps) {
    return (
        <div className={`group relative ${className}`}>
            {/* Label */}
            {label && (
                <label
                    className={`block font-medium text-gray-700
                        ${compact ? "mb-1 text-xs" : "mb-2 text-sm"}
                    `}
                >
                    {label}
                    {required && <span className="ml-1 text-red-500">*</span>}
                </label>
            )}

            <div className="relative">
                {/* Icon */}
                {Icon && (
                    <div className="absolute top-1/2 left-3 z-10 -translate-y-1/2">
                        <Icon className={`text-blue-500 ${compact ? "h-3 w-3" : "h-4 w-4"}`} />
                    </div>
                )}

                {/* Input */}
                <input
                    ref={
                        tankIndex !== undefined &&
                        fieldName &&
                        setInputRef
                            ? setInputRef(tankIndex, fieldName)
                            : undefined
                    }
                    type="text"
                    inputMode="decimal"
                    value={value ?? ""}
                    onChange={(e) =>
                        formatNumberInput
                            ? onChange(formatNumberInput(e.target.value, allowDecimal))
                            : onChange(e.target.value)
                    }
                    disabled={disabled}
                    readOnly={readOnly}
                    className={`
                        w-full border border-gray-300 bg-white transition-all duration-200
                        hover:border-gray-400 hover:shadow-sm
                        focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none
                        ${compact ? "rounded-lg px-2 py-1.5 text-sm" : "rounded-xl px-4 py-2"}
                        ${
                            Icon
                                ? compact
                                    ? "pl-8"
                                    : "pl-11"
                                : compact
                                ? "pl-2"
                                : "pl-4"
                        }
                        ${showCalculator ? "pr-10" : ""}
                        ${disabled || readOnly ? "cursor-not-allowed bg-gray-100 text-gray-600" : ""}
                    `}
                    required={required}
                    placeholder="0.000"
                    pattern={allowDecimal ? "[0-9.]*" : "[0-9]*"}
                    title={
                        allowDecimal
                            ? "กรุณากรอกตัวเลขและทศนิยมเท่านั้น"
                            : "กรุณากรอกตัวเลขเท่านั้น"
                    }
                />

                {/* Calculator Button */}
                {showCalculator && (
                    <button
                        type="button"
                        onClick={onCalculatorClick}
                        className="absolute top-1/2 right-2 -translate-y-1/2 text-blue-500 transition-colors hover:text-blue-700"
                        title="คำนวณอัตโนมัติ"
                    >
                        <Calculator className="h-4 w-4" />
                    </button>
                )}
            </div>
        </div>
    );
}
