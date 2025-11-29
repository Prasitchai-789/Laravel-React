import { useState } from "react";
import { router } from "@inertiajs/react";
import { sanitizeNumberInput } from "../utils/number";
import { CPORecord } from "../types";

interface UseCPOFormProps {
    record?: CPORecord | null;
    onSave: (data: any) => void;
    onCancel: () => void;
}

export const useCPOForm = ({ record, onSave, onCancel }: UseCPOFormProps) => {

    const [form, setForm] = useState<any>(record || {});

    const updateField = (field: string, value: any) => {
        setForm((prev: any) => ({
            ...prev,
            [field]: sanitizeNumberInput(value)
        }));
    };

    const handleSubmit = async () => {
        await onSave(form);
    };

    return {
        form,
        updateField,
        handleSubmit,
        onCancel,
    };
};
