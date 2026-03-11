import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { usePage } from "@inertiajs/react";
import { useComponentSelection } from "@/Hooks/useComponentSelection";
import { useComponentManagement } from "@/Hooks/useComponentManagement";
import { useHardwareParts } from "@/Hooks/useHardwareParts";
import { useHardwareSoftware } from "@/Hooks/useHardwareSoftware";

const DEFAULT_VALUES = {
    components: [],
    replacements: [],
    components_to_remove: [{}],
};

export const useComponentMaintenance = (
    form,
    open,
    entity, // formerly "hardware"
    action,
    onSave,
    onClose,
) => {
    const [loading, setLoading] = useState(false);
    const [selectedComponentType, setSelectedComponentType] = useState(null);
    const { emp_data } = usePage().props;

    // Always call these unconditionally — they read from Zustand stores
    const partsHooks = useHardwareParts();
    const softwareHooks = useHardwareSoftware();

    // Always call unconditionally — hooks must never be conditional
    const {
        handleSelectComponent: handleAddSelect,
        resetSelection: resetAddSelection,
    } = useComponentSelection({ form, fieldName: "components", mode: "add" });

    const {
        handleSelectComponent: handleReplaceSelect,
        resetSelection: resetReplaceSelection,
    } = useComponentSelection({
        form,
        fieldName: "replacements",
        mode: "replace",
    });

    const addManagement = useComponentManagement({
        form,
        fieldName: "components",
    });
    const replaceManagement = useComponentManagement({
        form,
        fieldName: "replacements",
    });

    // Reset and load inventory when drawer opens — guard inside effect, not around hooks
    useEffect(() => {
        if (!open || !entity) return;

        form.reset(DEFAULT_VALUES);
        resetAddSelection();
        resetReplaceSelection();
        setSelectedComponentType(null);
        partsHooks.loadPartTypes();
        softwareHooks.loadSoftwareNames();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, entity?.id, action]);

    const getComponentOptions = useCallback(() => {
        const options = [];
        entity?.parts?.forEach((part) => {
            options.push({
                label: `[Part] ${part.part_info?.part_type || "Part"}: ${part.part_info?.brand || ""} ${part.part_info?.model || ""} - ${part.part_info?.specifications || ""} - ${part?.serial_number || ""}`,
                value: `part_${part.id}`,
            });
        });
        entity?.software?.forEach((sw) => {
            options.push({
                label: `[Software] ${sw.inventory?.software_name || "Software"} ${sw.inventory?.version || ""} (${sw.inventory?.software_type || ""})`,
                value: `software_${sw.id}`,
            });
        });
        return options;
    }, [entity]);

    const handleComponentTypeSelect = useCallback((componentType) => {
        setSelectedComponentType(componentType);
    }, []);

    const handleClose = useCallback(() => {
        form.reset(DEFAULT_VALUES);
        resetAddSelection();
        resetReplaceSelection();
        setSelectedComponentType(null);
        onClose?.();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [onClose]);

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
                } catch {
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

    const handleFinish = useCallback(
        async (values) => {
            setLoading(true);
            try {
                let payload = {
                    // maintain the old field for backward compatibility
                    hardware_id: entity?.id,
                    entity_id: entity?.id,
                    hostname: entity?.hostname,
                    action,
                    component_type: selectedComponentType,
                    employee_id: emp_data?.emp_id,
                    ...values,
                };
                payload = parseSpecsAndCondition(payload);
                toast.success(`Item ${action}d successfully`);
                onSave?.(payload);
                handleClose();
            } catch (err) {
                console.error("Error:", err);
                toast.error(`Failed to ${action}`);
            } finally {
                setLoading(false);
            }
            // eslint-disable-next-line react-hooks/exhaustive-deps
        },
        [entity, action, selectedComponentType, emp_data],
    );

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
