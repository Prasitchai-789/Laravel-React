// resources/js/pages/ERP/Overtime/components/SimpleSwitch.tsx
import React, { useState } from "react";

interface SimpleSwitchProps {
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  id?: string;
}

const SimpleSwitch: React.FC<SimpleSwitchProps> = ({
  defaultChecked = false,
  onChange,
  id,
  ...props
}) => {
  const [checked, setChecked] = useState(defaultChecked);

  const handleToggle = () => {
    const newChecked = !checked;
    setChecked(newChecked);
    if (onChange) {
      onChange(newChecked);
    }
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
        checked ? 'bg-blue-600' : 'bg-gray-300'
      }`}
      onClick={handleToggle}
      id={id}
      {...props}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
};

export default SimpleSwitch;
