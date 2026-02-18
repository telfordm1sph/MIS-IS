import { useState, useEffect } from "react";
import { message } from "antd";
import { usePage } from "@inertiajs/react";
import { useComponentSelection } from "@/Hooks/useComponentSelection";
import { useComponentManagement } from "@/Hooks/useComponentManagement";
import { useHardwareParts } from "@/Hooks/useHardwareParts";
import { useHardwareSoftware } from "@/Hooks/useHardwareSoftware";

export const useComponentMaintenance = (
    form,
    open,
    hardware,
    action,
    onSave,
    onClose,
) => {
    const [loading, setLoading] = useState(false);
    const [selectedComponentType, setSelectedComponentType] = useState(null);
    const { emp_data } = usePage().props;

    // Hooks for inventory dropdowns
    const partsHooks = useHardwareParts(form);
    const softwareHooks = useHardwareSoftware(form);

    // --- Initialize selection hooks for replace and add ---
    const {
        handleSelectComponent: handleAddSelect,
        resetSelection: resetAddSelection,
    } = useComponentSelection({
        form,
        fieldName: "components",
        mode: "add",
    });

    const {
        handleSelectComponent: handleReplaceSelect,
        resetSelection: resetReplaceSelection,
    } = useComponentSelection({
        form,
        fieldName: "replacements",
        mode: "replace",
    });

    // --- Management hooks ---
    const addManagement = useComponentManagement({
        form,
        fieldName: "components",
    });
    const replaceManagement = useComponentManagement({
        form,
        fieldName: "replacements",
    });

    // Reset selections and load inventory when drawer opens
    useEffect(() => {
        if (open && hardware) {
            form.resetFields();
            resetAddSelection();
            resetReplaceSelection();
            setSelectedComponentType(null);

            partsHooks.loadPartTypes();
            softwareHooks.loadSoftwareNames();
        }
    }, [open, hardware, action]);

    // Generate component options for Select dropdowns
    const getComponentOptions = () => {
        const options = [];

        hardware?.parts?.forEach((part) => {
            options.push({
                label: `[Part] ${part.part_info?.part_type || "Part"}: ${part.part_info?.brand || ""} ${part.part_info?.model || ""} - ${part.part_info?.specifications || ""} - ${part?.serial_number || ""}`,
                value: `part_${part.id}`,
            });
        });

        hardware?.software?.forEach((software) => {
            options.push({
                label: `[Software] ${software.inventory?.software_name || "Software"} ${software.inventory?.version || ""} (${software.inventory?.software_type || ""})`,
                value: `software_${software.id}`,
            });
        });

        return options;
    };

    // Simple handler to just set the component type (for Add mode)
    const handleComponentTypeSelect = (componentType) => {
        console.log("Selected component type:", componentType);
        setSelectedComponentType(componentType);
    };

    // Reset everything on close
    const handleClose = () => {
        form.resetFields();
        resetAddSelection();
        resetReplaceSelection();
        setSelectedComponentType(null);
        onClose?.();
    };

    // Parse specs to extract condition
    const parseSpecsAndCondition = (payload) => {
        const extract = (specs) => {
            if (!specs) return { condition: null, specifications: specs };
            if (typeof specs === "string") {
                try {
                    const parsed = JSON.parse(specs);
                    return {
                        condition: parsed.condition || null,
                        specifications: parsed.specifications || specs,
                    };
                } catch (e) {
                    return { condition: null, specifications: specs.trim() };
                }
            }
            if (typeof specs === "object") {
                return {
                    condition: specs.condition || null,
                    specifications: specs.specifications || specs,
                };
            }
            return { condition: null, specifications: specs };
        };

        if (payload.replacement_specifications) {
            const { condition, specifications } = extract(
                payload.replacement_specifications,
            );
            payload.replacement_specifications = specifications;
            if (condition && !payload.replacement_condition)
                payload.replacement_condition = condition;
        }

        if (payload.new_specifications) {
            const { condition, specifications } = extract(
                payload.new_specifications,
            );
            payload.new_specifications = specifications;
            if (condition && !payload.new_condition)
                payload.new_condition = condition;
        }

        return payload;
    };

    // Handle form submission
    const handleFinish = async (values) => {
        setLoading(true);
        try {
            let payload = {
                hardware_id: hardware.id,
                hostname: hardware.hostname,
                action,
                component_type: selectedComponentType,
                employee_id: emp_data?.emp_id,
                ...values,
            };

            payload = parseSpecsAndCondition(payload);

            console.log("🔍 FINAL PAYLOAD:", payload);

            // API call (mocked)
            // const { data } = await axios.post("/hardware/maintenance", payload);

            message.success(`Hardware ${action}d successfully`);
            onSave?.(payload);
            handleClose();
        } catch (err) {
            console.error("Error:", err);
            message.error(`Failed to ${action}`);
        } finally {
            setLoading(false);
        }
    };

    return {
        loading,
        partsHooks,
        softwareHooks,
        selectedComponentType,
        handleComponentTypeSelect,
        addManagement,
        replaceManagement,
        getComponentOptions,
        handleFinish,
        handleClose,
    };
};
