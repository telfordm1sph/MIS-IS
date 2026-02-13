import { useCallback } from "react";
import { message } from "antd";
import { v4 as uuidv4 } from "uuid";

export const useComponentSelection = ({ form, fieldName, mode = "add" }) => {
    const handleSelectComponent = useCallback(
        ({
            record,
            selectedComponentType,
            selectedOldComponent,
            selectedComponentInfo,
        }) => {
            console.log("record", record);

            const currentItems = form.getFieldValue(fieldName) || [];

            if (mode === "replace" && !selectedComponentInfo) {
                message.error("Please select a component to replace first");
                return;
            }

            const componentType =
                mode === "replace"
                    ? selectedComponentInfo?.type
                    : selectedComponentType;

            // Check if exists (same component + same condition if applicable)
            const exists = currentItems.find((item) => {
                if (mode === "replace") {
                    return (
                        item.component_id === record.id &&
                        item.old_component_id === selectedOldComponent &&
                        item.component_data?.condition === record.condition
                    );
                } else {
                    return (
                        item.component_id === record.id &&
                        item.component_type === selectedComponentType &&
                        item.component_data?.condition === record.condition
                    );
                }
            });

            // Get max quantity available
            const maxQty =
                componentType === "part"
                    ? record.quantity
                    : record.available_activations || 999;

            if (exists) {
                // Increment quantity if not at max
                if (exists.quantity < maxQty) {
                    const updated = currentItems.map((item) => {
                        if (mode === "replace") {
                            if (
                                item.component_id === record.id &&
                                item.old_component_id ===
                                    selectedOldComponent &&
                                item.component_data?.condition ===
                                    record.condition
                            ) {
                                return { ...item, quantity: item.quantity + 1 };
                            }
                        } else {
                            if (
                                item.component_id === record.id &&
                                item.component_type === selectedComponentType &&
                                item.component_data?.condition ===
                                    record.condition
                            ) {
                                return { ...item, quantity: item.quantity + 1 };
                            }
                        }
                        return item;
                    });
                    form.setFieldsValue({ [fieldName]: updated });
                    message.success("Quantity increased by 1");
                } else {
                    message.warning("Maximum quantity reached");
                }
                return;
            }

            // Create new entry
            let newItem;
            if (mode === "replace") {
                // Build replacement payload matching backend validation
                const oldData = selectedComponentInfo?.data;

                newItem = {
                    key: uuidv4(),
                    // Required fields
                    component_id: record.id,
                    old_component_id: selectedOldComponent,
                    component_to_replace: selectedOldComponent,
                    component_type: componentType,
                    quantity: 1,
                    old_component_condition: "", // User must fill - working/faulty/defective/damaged
                    reason: "", // User must fill
                    remarks: "",

                    // Store old component data for display
                    old_component_data: oldData,

                    // New component fields (from inventory record)
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

                    // Store full record for display
                    component_data: record,
                };
            } else {
                // Build add payload matching backend validation
                newItem = {
                    key: uuidv4(),
                    component_id: record.id,
                    component_type: selectedComponentType,
                    quantity: 1,
                    remarks: "", // Optional for add

                    // New component fields (from inventory record)
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

                    // Store full record for display
                    component_data: record,
                };
            }

            const updatedItems = [...currentItems, newItem];
            form.setFieldsValue({ [fieldName]: updatedItems });
            message.success(
                mode === "replace" ? "Replacement selected" : "Component added",
            );

            return updatedItems;
        },
        [form, fieldName, mode],
    );

    const resetSelection = useCallback(() => {
        form.setFieldsValue({ [fieldName]: [] });
    }, [form, fieldName]);

    return { handleSelectComponent, resetSelection };
};
