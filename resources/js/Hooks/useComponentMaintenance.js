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
    mode,
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
        });

        // Handle PARTS
        if (componentType === "part" && componentData) {
            const partData = componentData.part_info;

            if (mode === "replace") {
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
            } else if (mode === "upgrade" && upgradeAction === "replace") {
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

            if (mode === "replace") {
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
            } else if (mode === "upgrade" && upgradeAction === "replace") {
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

    const handleFinish = async (values) => {
        try {
            setLoading(true);

            const payload = {
                hardware_id: hardware.id,
                hostname: hardware.hostname,
                mode: mode,
                upgrade_action: upgradeAction,
                component_type: selectedComponentType,
                employee_id: emp_data?.emp_id,
                ...values,
            };

            if (selectedComponent) {
                const componentId = selectedComponent.split("_")[1];
                payload.component_id = componentId;
            }

            if (mode === "upgrade") {
                payload.upgrade_action = upgradeAction;
            }

            // Parse replacement_specifications if it's a JSON string
            if (payload.replacement_specifications) {
                try {
                    const specObj = JSON.parse(
                        payload.replacement_specifications,
                    );
                    payload.replacement_specifications = specObj.specifications;
                } catch (e) {
                    // If not JSON, keep as is
                }
            }

            // Parse upgrade_specifications if it's a JSON string
            if (payload.upgrade_specifications) {
                try {
                    const specObj = JSON.parse(payload.upgrade_specifications);
                    payload.upgrade_specifications = specObj.specifications;
                } catch (e) {
                    // If not JSON, keep as is
                }
            }

            // Parse new_specifications if it's a JSON string
            if (payload.new_specifications) {
                try {
                    const specObj = JSON.parse(payload.new_specifications);
                    payload.new_specifications = specObj.specifications;
                } catch (e) {
                    // If not JSON, keep as is
                }
            }

            console.log("Payload", payload);

            const endpoint =
                mode === "replace" ||
                (mode === "upgrade" && upgrade_action === "replace")
                    ? route("hardware.replace.component")
                    : route("hardware.component.upgrade");

            const response = await axios.post(endpoint, payload);

            if (response.data?.success) {
                message.success(
                    response.data.message || `Component ${mode}d successfully`,
                );
                if (onSave) onSave(response.data);
                handleClose();
            } else {
                message.error(
                    response.data?.message || `Failed to ${mode} component`,
                );
            }
        } catch (error) {
            console.error(`Error ${mode}ing component:`, error);
            message.error(
                error.response?.data?.message ||
                    `An error occurred while ${mode}ing component`,
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
