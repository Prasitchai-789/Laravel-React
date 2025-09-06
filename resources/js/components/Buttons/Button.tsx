import React from "react";

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "secondary" | "success" | "danger" | "warning";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  disabled?: boolean;
  className?: string;
  gradient?: boolean;
  shadow?: boolean;
  hoverEffect?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  type = "button",
  variant = "primary",
  size = "md",
  icon,
  iconPosition = "left",
  disabled = false,
  className = "",
  gradient = true,
  shadow = true,
  hoverEffect = true,
}) => {
  // Base classes
  const baseClasses = "flex items-center justify-center rounded-3xl font-medium text-white transition-all focus:outline-none focus:ring-1 focus:ring-offset-2 hover:cursor-pointer";

  // Variant classes
  const variantClasses = {
    primary: gradient
      ? "from-blue-600 to-indigo-600 hover:from-indigo-700 hover:to-purple-700 focus:ring-indigo-500"
      : "bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500",
    secondary: gradient
      ? "from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 focus:ring-gray-500"
      : "bg-gray-600 hover:bg-gray-700 focus:ring-gray-500",
    success: gradient
      ? "from-green-600 to-emerald-600 hover:from-emerald-700 hover:to-green-700 focus:ring-emerald-500"
      : "bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500",
    danger: gradient
      ? "from-red-600 to-rose-600 hover:from-rose-700 hover:to-red-700 focus:ring-rose-500"
      : "bg-rose-600 hover:bg-rose-700 focus:ring-rose-500",
    warning: gradient
      ? "from-amber-600 to-orange-600 hover:from-orange-700 hover:to-amber-700 focus:ring-orange-500"
      : "bg-orange-600 hover:bg-orange-700 focus:ring-orange-500",
  };

  // Size classes
  const sizeClasses = {
    sm: "px-3 py-2 text-xs",
    md: "px-5 py-3 text-sm",
    lg: "px-6 py-4 text-base",
  };

  // Additional effect classes
  const effectClasses = `
    ${shadow ? "shadow-md hover:shadow-xl" : ""}
    ${hoverEffect ? "hover:scale-102" : ""}
    ${disabled ? "opacity-50 cursor-not-allowed" : ""}
  `;

  // Gradient or solid background
  const backgroundClass = gradient
    ? `bg-gradient-to-r ${variantClasses[variant]}`
    : `${variantClasses[variant]}`;

  // Combine all classes
  const buttonClasses = `
    ${baseClasses}
    ${sizeClasses[size]}
    ${backgroundClass}
    ${effectClasses}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={buttonClasses}
    >
      {icon && iconPosition === "left" && (
        <span className="mr-2">{icon}</span>
      )}

      {children}

      {icon && iconPosition === "right" && (
        <span className="ml-2">{icon}</span>
      )}
    </button>
  );
};

export default Button;


//
 {/* ปุ่มแบบมี icon ด้านซ้าย (เหมือนตัวอย่างเดิม) */}
    //   <Button
    //     onClick={handleClick}
    //     icon={<PlusIcon className="h-5 w-5" />}
    //     iconPosition="left"
    //   >
    //     Create
    //   </Button>

    //   {/* ปุ่มแบบมี icon ด้านขวา */}
    //   <Button
    //     onClick={handleClick}
    //     icon={<ArrowRightIcon className="h-5 w-5" />}
    //     iconPosition="right"
    //     variant="success"
    //   >
    //     Continue
    //   </Button>

    //   {/* ปุ่มแบบไม่มี icon */}
    //   <Button onClick={handleClick} variant="secondary">
    //     Cancel
    //   </Button>

    //   {/* ปุ่มแบบ disabled */}
    //   <Button onClick={handleClick} disabled={true} variant="danger">
    //     Delete
    //   </Button>

    //   {/* ปุ่มขนาดเล็ก */}
    //   <Button
    //     onClick={handleClick}
    //     size="sm"
    //     icon={<TrashIcon className="h-4 w-4" />}
    //     variant="danger"
    //   >
    //     Remove
    //   </Button>

    //   {/* ปุ่มขนาดใหญ่ */}
    //   <Button
    //     onClick={handleClick}
    //     size="lg"
    //     icon={<CheckIcon className="h-6 w-6" />}
    //     variant="success"
    //   >
    //     Confirm
    //   </Button>

    //   {/* ปุ่มแบบไม่มี gradient */}
    //   <Button
    //     onClick={handleClick}
    //     gradient={false}
    //     icon={<PlusIcon className="h-5 w-5" />}
    //   >
    //     Add Item
    //   </Button>

    //   {/* ปุ่มแบบไม่มี shadow และ hover effect */}
    //   <Button
    //     onClick={handleClick}
    //     shadow={false}
    //     hoverEffect={false}
    //     variant="warning"
    //   >
    //     Simple Button
    //   </Button>
      //
