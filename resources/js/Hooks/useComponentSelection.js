import { useCallback } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

export const useComponentSelection = ({ form, fieldName, mode = "add" }) => {
    const handleSelectComponent = useCallback(
        ({
            record,
            selectedComponentType,
            selectedOldComponent,
            selectedComponentInfo,
        }) => {
            // react-hook-form: getValues() replaces form.getFieldValue()
            const currentItems = form.getValues(fieldName) || [];

            if (mode === "replace" && !selectedComponentInfo) {
                toast.error("Please select a component to replace first");
                return;
            }

            const componentType =
                mode === "replace"
                    ? selectedComponentInfo?.type
                    : selectedComponentType;

            // Check if already in list
            const exists = currentItems.find((item) => {
                if (mode === "replace") {
                    return (
                        item.component_id === record.id &&
                        item.old_component_id === selectedOldComponent &&
                        item.component_data?.condition === record.condition
                    );
                }
                return (
                    item.component_id === record.id &&
                    item.component_type === selectedComponentType &&
                    item.component_data?.condition === record.condition
                );
            });

            const maxQty =
                componentType === "part"
                    ? record.quantity
                    : record.available_activations || 999;

            if (exists) {
                if (exists.quantity < maxQty) {
                    const updated = currentItems.map((item) => {
                        const match =
                            mode === "replace"
                                ? item.component_id === record.id &&
                                  item.old_component_id ===
                                      selectedOldComponent &&
                                  item.component_data?.condition ===
                                      record.condition
                                : item.component_id === record.id &&
                                  item.component_type ===
                                      selectedComponentType &&
                                  item.component_data?.condition ===
                                      record.condition;

                        return match
                            ? { ...item, quantity: item.quantity + 1 }
                            : item;
                    });
                    // react-hook-form: setValue() replaces form.setFieldsValue()
                    form.setValue(fieldName, updated, { shouldDirty: true });
                    toast.success("Quantity increased by 1");
                } else {
                    toast.warning("Maximum quantity reached");
                }
                return;
            }

            const componentId = parseInt(
                selectedOldComponent?.split("_")[1],
                10,
            );

            let newItem;
            if (mode === "replace") {
                const oldData = selectedComponentInfo?.data;
                newItem = {
                    key: uuidv4(),
                    component_id: componentId,
                    old_component_id: selectedOldComponent,
                    component_to_replace: selectedOldComponent,
                    component_type: componentType,
                    quantity: 1,
                    old_component_condition: "",
                    reason: "",
                    remarks: "",
                    old_component_data: oldData,
                    ...(componentType === "part"
                        ? {
                              replacement_part_type: record.part_type || "",
                              replacement_brand: record.brand || "",
                              replacement_model: record.model || "",
                              replacement_specifications:
                                  record.specifications || "",
                              replacement_condition: record.condition || "New",
                              replacement_serial_number: "",
                          }
                        : {
                              replacement_software_name:
                                  record.software_name || "",
                              replacement_software_type:
                                  record.software_type || "",
                              replacement_version: record.version || "",
                          }),
                    component_data: record,
                };
            } else {
                newItem = {
                    key: uuidv4(),
                    component_id: componentId,
                    component_type: selectedComponentType,
                    quantity: 1,
                    remarks: "",
                    ...(selectedComponentType === "part"
                        ? {
                              new_part_type: record.part_type || "",
                              new_brand: record.brand || "",
                              new_model: record.model || "",
                              new_specifications: record.specifications || "",
                              new_condition: record.condition || "New",
                              new_serial_number: "",
                          }
                        : {
                              new_software_name: record.software_name || "",
                              new_software_type: record.software_type || "",
                              new_version: record.version || "",
                              new_license_key: record.license_key || "",
                              new_account_user: record.account_user || "",
                              new_account_password:
                                  record.account_password || "",
                          }),
                    component_data: record,
                };
            }

            const updatedItems = [...currentItems, newItem];
            form.setValue(fieldName, updatedItems, { shouldDirty: true });
            toast.success(
                mode === "replace" ? "Replacement selected" : "Component added",
            );

            return updatedItems;
        },
        [form, fieldName, mode],
    );

    const resetSelection = useCallback(() => {
        form.setValue(fieldName, [], { shouldDirty: true });
    }, [form, fieldName]);

    return { handleSelectComponent, resetSelection };
};
