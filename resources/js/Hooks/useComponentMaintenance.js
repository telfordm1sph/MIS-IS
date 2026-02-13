import { useState, useEffect } from "react";
import { message } from "antd";
import axios from "axios";
import { usePage } from "@inertiajs/react";
import { useComponentSelection } from "@/Hooks/useComponentSelection";
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
    const [upgradeAction, setUpgradeAction] = useState("replace");
    const { emp_data } = usePage().props;

    const partsHooks = useHardwareParts(form);
    const softwareHooks = useHardwareSoftware(form);
    const {
        selectedComponent,
        selectedComponentType,
        selectedComponentData,
        handleComponentSelect,
        resetSelection,
    } = useComponentSelection();

    // Helper function to extract condition and specifications
    const extractConditionAndSpecs = (specs) => {
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

        if (typeof specs === "object" && specs !== null) {
            return {
                condition: specs.condition || null,
                specifications: specs.specifications || specs,
            };
        }

        return { condition: null, specifications: specs };
    };

    // Helper function to extract specifications only (for backward compatibility)
    const extractSpecifications = (specs) => {
        if (!specs) return specs;
        if (typeof specs === "string") {
            try {
                const parsed = JSON.parse(specs);
                return parsed.specifications || specs;
            } catch (e) {
                return specs.trim();
            }
        }
        return specs;
    };

    useEffect(() => {
        if (open && hardware) {
            form.resetFields();
            resetSelection();
            setUpgradeAction("replace");
            partsHooks.loadPartTypes();
            softwareHooks.loadSoftwareNames();
        }
    }, [open, hardware]);

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

    const handleComponentSelectWrapper = (value, option) => {
        let componentType;
        let componentId;
        let componentData = null;

        if (value) {
            componentType = value.startsWith("part_") ? "part" : "software";
            componentId = value.split("_")[1];

            if (componentType === "part") {
                componentData = hardware?.parts?.find(
                    (p) => p.id == componentId,
                );
            } else {
                componentData = hardware?.software?.find(
                    (s) => s.id == componentId,
                );
            }
        } else {
            componentType = option?.componentType;
        }

        const cleanOption = { componentType, data: componentData };
        handleComponentSelect(value, cleanOption);

        // Reset all fields
        form.setFieldsValue({
            replacement_part_type: undefined,
            replacement_brand: undefined,
            replacement_model: undefined,
            replacement_specifications: undefined,
            replacement_condition: undefined, // Reset condition
            replacement_sw_software_name: undefined,
            replacement_sw_software_type: undefined,
            replacement_sw_version: undefined,
            replacement_sw_license: undefined,
            upgrade_part_type: undefined,
            upgrade_brand: undefined,
            upgrade_model: undefined,
            upgrade_specifications: undefined,
            upgrade_sw_software_name: undefined,
            upgrade_sw_software_type: undefined,
            upgrade_sw_version: undefined,
            upgrade_sw_license: undefined,
            reason: undefined,
            remarks: undefined,
            old_component_condition: undefined,
            new_condition: undefined, // Reset condition for add
        });

        // Handle PARTS
        if (componentType === "part" && componentData) {
            const partData = componentData.part_info;

            if (action === "replace") {
                form.setFieldsValue({
                    replacement_part_type: partData?.part_type,
                });
                setTimeout(() => {
                    if (partData?.part_type) {
                        partsHooks.loadBrands(
                            partData.part_type,
                            "replacement",
                        );
                    }
                }, 0);
            } else if (action === "upgrade" && upgradeAction === "replace") {
                form.setFieldsValue({ upgrade_part_type: partData?.part_type });
                setTimeout(() => {
                    if (partData?.part_type) {
                        partsHooks.loadBrands(partData.part_type, "upgrade");
                    }
                }, 0);
            }
        }

        // Handle SOFTWARE
        if (componentType === "software" && componentData) {
            const softwareData = componentData.inventory;

            if (action === "replace") {
                form.setFieldsValue({
                    replacement_sw_software_name: softwareData?.software_name,
                    replacement_sw_software_type: softwareData?.software_type,
                });

                setTimeout(() => {
                    if (softwareData?.software_name) {
                        softwareHooks.loadSoftwareTypes(
                            softwareData.software_name,
                            "replacement_sw",
                        );
                    }
                    if (
                        softwareData?.software_name &&
                        softwareData?.software_type
                    ) {
                        softwareHooks.loadSoftwareVersions(
                            softwareData.software_name,
                            softwareData.software_type,
                            "replacement_sw",
                        );
                    }
                }, 0);
            } else if (action === "upgrade" && upgradeAction === "replace") {
                form.setFieldsValue({
                    upgrade_sw_software_name: softwareData?.software_name,
                    upgrade_sw_software_type: softwareData?.software_type,
                });

                setTimeout(() => {
                    if (softwareData?.software_name) {
                        softwareHooks.loadSoftwareTypes(
                            softwareData.software_name,
                            "upgrade_sw",
                        );
                    }
                    if (
                        softwareData?.software_name &&
                        softwareData?.software_type
                    ) {
                        softwareHooks.loadSoftwareVersions(
                            softwareData.software_name,
                            softwareData.software_type,
                            "upgrade_sw",
                        );
                    }
                }, 0);
            }
        }
    };

    const handleUpgradeActionChange = (e) => {
        const newValue = e.target.value;
        setUpgradeAction(newValue);
        resetSelection();
        form.resetFields();
        form.setFieldsValue({ upgrade_action: newValue });
    };

    /**
     * CRITICAL FIX: Parse specifications and extract condition
     * This extracts condition from the specs object and adds it as a separate field
     */
    const parseSpecsAndCondition = (payload) => {
        // Process replacement_specifications
        if (payload.replacement_specifications) {
            const { condition, specifications } = extractConditionAndSpecs(
                payload.replacement_specifications,
            );
            payload.replacement_specifications = specifications;
            if (condition && !payload.replacement_condition) {
                payload.replacement_condition = condition;
            }
        }

        // Process new_specifications (for add action)
        if (payload.new_specifications) {
            const { condition, specifications } = extractConditionAndSpecs(
                payload.new_specifications,
            );
            payload.new_specifications = specifications;
            if (condition && !payload.new_condition) {
                payload.new_condition = condition;
            }
        }

        return payload;
    };

    const endpoints = (hardwareId) => ({
        edit: ["put", route("hardware.update", hardwareId)],
        replace: ["post", route("hardware.replace.component")],
        add: ["post", route("hardware.component.add")],
        remove: ["post", route("hardware.component.remove")],
    });

    const handleFinish = async (values) => {
        setLoading(true);
        try {
            // First, build the base payload
            let payload = {
                hardware_id: hardware.id,
                hostname: hardware.hostname,
                action,
                component_type: selectedComponentType,
                employee_id: emp_data?.emp_id,
                ...(selectedComponent && {
                    component_id: selectedComponent.split("_")[1],
                }),
                ...values,
            };

            // CRITICAL: Extract condition from specs FIRST, then parse specs
            payload = parseSpecsAndCondition(payload);

            console.log("🔍 FINAL PAYLOAD:", JSON.stringify(payload, null, 2));

            // const [method, url] = endpoints(hardware.id)[action];
            // const { data } = await axios[method](url, payload);

            if (!data?.success)
                return message.error(data?.message || `Failed to ${action}`);

            message.success(data.message || `Hardware ${action}d successfully`);
            onSave?.(data);
            handleClose();
        } catch (err) {
            console.error("Error details:", err.response?.data);
            message.error(
                err.response?.data?.message ||
                    `An error occurred while ${action}ing`,
            );
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        form.resetFields();
        resetSelection();
        setUpgradeAction("replace");
        onClose();
    };

    return {
        loading,
        upgradeAction,
        partsHooks,
        softwareHooks,
        selectedComponent,
        selectedComponentType,
        selectedComponentData,
        getComponentOptions,
        handleComponentSelectWrapper,
        handleUpgradeActionChange,
        handleFinish,
        handleClose,
    };
};
