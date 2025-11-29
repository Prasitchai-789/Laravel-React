import React from "react";
import { Edit, Trash2 } from "lucide-react";
import { CPORecord } from "../../types";

interface Props {
    record: CPORecord;
    onEdit: (record: CPORecord) => void;
    onDelete: (id: number) => void;
}

export default function ActionsColumn({ record, onEdit, onDelete }: Props) {
    return (
        <div className="flex flex-col space-y-2">
            <button
                onClick={() => onEdit(record)}
                className="flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2 text-white shadow-sm transition-all duration-200 hover:scale-105 hover:shadow-md"
            >
                <Edit className="mr-1 h-4 w-4" />
                แก้ไข
            </button>

            <button
                onClick={() => onDelete(record.id)}
                className="flex items-center justify-center rounded-xl bg-gradient-to-r from-red-500 to-red-600 px-4 py-2 text-white shadow-sm transition-all duration-200 hover:scale-105 hover:shadow-md"
            >
                <Trash2 className="mr-1 h-4 w-4" />
                ลบ
            </button>
        </div>
    );
}
