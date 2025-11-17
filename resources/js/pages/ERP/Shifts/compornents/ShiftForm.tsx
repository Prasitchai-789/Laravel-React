import React from "react";

interface ShiftFormProps {
  shift: any;
  isAddingNew: boolean;
  departments: any[];
  onSave: (shift: any) => void;
  onCancel: () => void;
  onFieldChange: (field: string, value: any) => void;
}

const ShiftForm: React.FC<ShiftFormProps> = ({ shift, onSave, onCancel }) => {
  return (
    <div className="border p-4 my-4">
      <p>ShiftForm: {shift.shiftName}</p>
      <button onClick={() => onSave(shift)}>บันทึก</button>
      <button onClick={onCancel}>ยกเลิก</button>
    </div>
  );
};

export default ShiftForm;
