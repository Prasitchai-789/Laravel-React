import React from 'react';

interface ButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
    type?: 'button' | 'submit' | 'reset';
    variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning';
    size?: 'sm' | 'md' | 'lg';
    icon?: React.ReactNode;
    iconPosition?: 'left' | 'right';
    disabled?: boolean;
    loading?: boolean;
    className?: string;
    gradient?: boolean;
    shadow?: boolean;
    hoverEffect?: boolean;
}

const Button: React.FC<ButtonProps> = ({
    children,
    onClick,
    type = 'button',
    variant = 'primary',
    size = 'md',
    icon,
    iconPosition = 'left',
    disabled = false,
    loading = false,
    className = '',
    gradient = true,
    shadow = true,
    hoverEffect = true,
}) => {
    // Base classes
    const baseClasses = 'inline-flex items-center justify-center rounded-3xl font-medium text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';

    // Variant classes
    const variantClasses = {
        primary: gradient
            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-indigo-700 hover:to-purple-700 focus:ring-indigo-500'
            : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500',
        secondary: gradient
            ? 'bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 focus:ring-gray-500'
            : 'bg-gray-600 hover:bg-gray-700 focus:ring-gray-500',
        success: gradient
            ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-emerald-700 hover:to-green-700 focus:ring-emerald-500'
            : 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500',
        danger: gradient
            ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-rose-700 hover:to-red-700 focus:ring-rose-500'
            : 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500',
        warning: gradient
            ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-orange-700 hover:to-amber-700 focus:ring-orange-500'
            : 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500',
    };

    // Size classes
    const sizeClasses = {
        sm: 'px-3 py-1.5 text-xs',
        md: 'px-5 py-2.5 text-sm',
        lg: 'px-6 py-3 text-base',
    };

    // Effect classes
    const effectClasses = `
        ${shadow ? 'shadow-md hover:shadow-lg' : ''}
        ${hoverEffect && !disabled && !loading ? 'hover:scale-105 transform' : ''}
    `;

    // Disabled state
    const disabledClasses = disabled || loading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer';

    const LoadingSpinner = () => (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
        </svg>
    );

    // Combine all classes
    const buttonClasses = `
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${effectClasses}
        ${disabledClasses}
        ${className}
    `.replace(/\s+/g, ' ').trim();

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            className={buttonClasses}
        >
            {loading && <LoadingSpinner />}

            {/* แสดง icon เฉพาะเมื่อไม่ loading หรือต้องการแสดง icon พร้อม loading */}
            {!loading && icon && iconPosition === 'left' && (
                <span className="mr-2">{icon}</span>
            )}

            {/* แสดง children หรือ loading text */}
            {loading ? 'กำลังประมวลผล...' : children}

            {!loading && icon && iconPosition === 'right' && (
                <span className="ml-2">{icon}</span>
            )}
        </button>
    );
};

export default Button;
