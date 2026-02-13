import { useCallback } from "react";

export const useComponentManagement = ({ form, fieldName }) => {
    const handleQuantityChange = useCallback(
        (index, value) => {
            const items = form.getFieldValue(fieldName) || [];
            const item = items[index];

            // Get max quantity from component data
            const maxQty =
                item?.component_type === "part"
                    ? item?.component_data?.quantity
                    : item?.component_data?.available_activations || 999;

            // Clamp value between 1 and maxQty
            const newQuantity = Math.max(1, Math.min(value || 1, maxQty));

            // Update the array
            const updated = [...items];
            updated[index] = { ...updated[index], quantity: newQuantity };

            form.setFieldsValue({ [fieldName]: updated });
        },
        [form, fieldName],
    );

    const handleSerialChange = useCallback(
        (index, value) => {
            const items = form.getFieldValue(fieldName) || [];
            const updated = [...items];
            const item = updated[index];

            // Update the correct field based on context
            if (fieldName === "replacements") {
                updated[index] = {
                    ...item,
                    replacement_serial_number: value,
                };
            } else {
                updated[index] = {
                    ...item,
                    new_serial_number: value,
                };
            }

            form.setFieldsValue({ [fieldName]: updated });
        },
        [form, fieldName],
    );

    const handleReasonChange = useCallback(
        (index, value) => {
            const items = form.getFieldValue(fieldName) || [];
            const updated = [...items];
            updated[index] = { ...updated[index], reason: value };
            form.setFieldsValue({ [fieldName]: updated });
        },
        [form, fieldName],
    );

    const handleRemarksChange = (index, value) => {
        const components = form.getFieldValue(fieldName) || [];
        const updated = [...components];
        updated[index] = { ...updated[index], remarks: value };
        form.setFieldsValue({ [fieldName]: updated });
    };

    const handleConditionChange = useCallback(
        (index, value) => {
            const items = form.getFieldValue(fieldName) || [];
            const updated = [...items];
            updated[index] = {
                ...updated[index],
                old_component_condition: value,
            };
            form.setFieldsValue({ [fieldName]: updated });
        },
        [form, fieldName],
    );

    const handleRemoveComponent = useCallback(
        (index) => {
            const items = form.getFieldValue(fieldName) || [];
            const updated = items.filter((_, i) => i !== index);
            form.setFieldsValue({ [fieldName]: updated });
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
