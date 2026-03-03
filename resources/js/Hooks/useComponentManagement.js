import { useCallback } from "react";

export const useComponentManagement = ({ form, fieldName }) => {
    const handleQuantityChange = useCallback(
        (index, value) => {
            const items = form.getValues(fieldName) || [];
            const item = items[index];

            const maxQty =
                item?.component_type === "part"
                    ? item?.component_data?.quantity
                    : item?.component_data?.available_activations || 999;

            const newQuantity = Math.max(1, Math.min(value || 1, maxQty));

            const updated = [...items];
            updated[index] = { ...updated[index], quantity: newQuantity };
            form.setValue(fieldName, updated, { shouldDirty: true });
        },
        [form, fieldName],
    );

    const handleSerialChange = useCallback(
        (index, value) => {
            const items = form.getValues(fieldName) || [];
            const updated = [...items];

            updated[index] =
                fieldName === "replacements"
                    ? { ...updated[index], replacement_serial_number: value }
                    : { ...updated[index], new_serial_number: value };

            form.setValue(fieldName, updated, { shouldDirty: true });
        },
        [form, fieldName],
    );

    const handleReasonChange = useCallback(
        (index, value) => {
            const items = form.getValues(fieldName) || [];
            const updated = [...items];
            updated[index] = { ...updated[index], reason: value };
            form.setValue(fieldName, updated, { shouldDirty: true });
        },
        [form, fieldName],
    );

    const handleRemarksChange = useCallback(
        (index, value) => {
            const items = form.getValues(fieldName) || [];
            const updated = [...items];
            updated[index] = { ...updated[index], remarks: value };
            form.setValue(fieldName, updated, { shouldDirty: true });
        },
        [form, fieldName],
    );

    const handleConditionChange = useCallback(
        (index, value) => {
            const items = form.getValues(fieldName) || [];
            const updated = [...items];
            updated[index] = {
                ...updated[index],
                old_component_condition: value,
            };
            form.setValue(fieldName, updated, { shouldDirty: true });
        },
        [form, fieldName],
    );

    const handleRemoveComponent = useCallback(
        (index) => {
            const items = form.getValues(fieldName) || [];
            form.setValue(
                fieldName,
                items.filter((_, i) => i !== index),
                { shouldDirty: true },
            );
        },
        [form, fieldName],
    );

    return {
        handleQuantityChange,
        handleSerialChange,
        handleReasonChange,
        handleRemarksChange,
        handleConditionChange,
        handleRemoveComponent,
    };
};
