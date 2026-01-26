import { useState } from "react";
import { Form } from "antd";

export const useRemovalModal = (form, setRemovedItems) => {
    const [removalModalVisible, setRemovalModalVisible] = useState(false);
    const [pendingRemoval, setPendingRemoval] = useState(null);
    const [removalForm] = Form.useForm();

    const handleRemoveWithReason = (fieldDataIndex, fieldName, row) => {
        if (row?.id) {
            setPendingRemoval({ fieldDataIndex, fieldName, row });
            setRemovalModalVisible(true);
        } else {
            const fields = form.getFieldValue(fieldDataIndex) || [];
            form.setFieldsValue({
                [fieldDataIndex]: fields.filter((_, idx) => idx !== fieldName),
            });
        }
    };

    const confirmRemoval = () => {
        removalForm
            .validateFields()
            .then((values) => {
                const { fieldDataIndex, fieldName, row } = pendingRemoval;

                setRemovedItems((prev) => ({
                    ...prev,
                    [fieldDataIndex]: [
                        ...(prev[fieldDataIndex] || []),
                        {
                            id: row.id,
                            reason: values.reason,
                            condition: values.condition,
                            remarks: values.remarks || null,
                        },
                    ],
                }));

                const fields = form.getFieldValue(fieldDataIndex) || [];
                form.setFieldsValue({
                    [fieldDataIndex]: fields.filter(
                        (_, idx) => idx !== fieldName,
                    ),
                });

                setRemovalModalVisible(false);
                setPendingRemoval(null);
                removalForm.resetFields();
            })
            .catch((error) => {
                console.error("Validation failed:", error);
            });
    };

    const cancelRemoval = () => {
        setRemovalModalVisible(false);
        setPendingRemoval(null);
        removalForm.resetFields();
    };

    return {
        removalModalVisible,
        pendingRemoval,
        removalForm,
        handleRemoveWithReason,
        confirmRemoval,
        cancelRemoval,
    };
};
