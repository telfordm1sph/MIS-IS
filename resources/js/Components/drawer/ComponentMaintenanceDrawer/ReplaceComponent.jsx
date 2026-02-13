import React, { useState, useCallback } from "react";
import { Form, Select, Card, Input, message, Alert } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";

import InventoryTable from "./InventoryTable";
import ComponentsReviewTable from "./ComponentsReviewTable";
import { getPartColumns, getSoftwareColumns } from "@/Utils/inventoryColumns";
import { useComponentManagement } from "@/Hooks/useComponentManagement";
import { useComponentSelection } from "@/Hooks/useComponentSelection";

const ReplaceComponent = ({ form, componentOptions, hardware }) => {
    const [selectedOldComponent, setSelectedOldComponent] = useState(null);
    const [componentType, setComponentType] = useState(null);
    const [selectedComponentInfo, setSelectedComponentInfo] = useState(null);
    const [selectedPartType, setSelectedPartType] = useState(null);

    // Watch replacements array directly from the form
    const replacements = Form.useWatch("replacements", form) || [];

    // Get component data
    const getComponentData = useCallback(
        (componentId) => {
            if (!componentId) return null;
            const [type, id] = componentId.split("_");
            if (type === "part") {
                const data = hardware?.parts?.find((p) => p.id == id);
                return { type: "part", data };
            } else {
                const data = hardware?.software?.find((s) => s.id == id);
                return { type: "software", data };
            }
        },
        [hardware],
    );

    // Handle old component selection
    const handleOldComponentChange = (value) => {
        setSelectedOldComponent(value);
        if (value) {
            const componentInfo = getComponentData(value);
            setComponentType(componentInfo?.type || null);
            setSelectedComponentInfo(componentInfo);

            if (componentInfo?.type === "part") {
                setSelectedPartType(componentInfo.data.part_info?.part_type);
            } else {
                setSelectedPartType(
                    componentInfo.data.inventory?.software_name,
                );
            }
        } else {
            setComponentType(null);
            setSelectedComponentInfo(null);
            setSelectedPartType(null);
        }
    };

    // Initialize the selection hook
    const { handleSelectComponent } = useComponentSelection({
        form,
        fieldName: "replacements",
        mode: "replace",
    });

    // Wrap the handleSelectComponent to inject the context
    const handleReplacementSelect = useCallback(
        (record) => {
            if (!selectedOldComponent || !selectedComponentInfo) {
                message.error("Please select a component to replace first");
                return;
            }

            handleSelectComponent({
                record,
                selectedOldComponent,
                selectedComponentInfo,
            });
        },
        [selectedOldComponent, selectedComponentInfo, handleSelectComponent],
    );

    // Step 3 handlers
    const {
        handleQuantityChange,
        handleSerialChange,
        handleReasonChange,
        handleRemarksChange,
        handleConditionChange,
        handleRemoveComponent,
    } = useComponentManagement({
        form,
        fieldName: "replacements",
    });

    return (
        <>
            {/* Hidden Form.Item to initialize the field */}
            <Form.Item name="replacements" hidden initialValue={[]}>
                <Input />
            </Form.Item>

            {/* Info Alert */}
            <Alert
                t="Component Replacement Process"
                description="Select the old component to replace, then choose a replacement from inventory. You must specify the condition of the old component to determine how it will be returned to inventory."
                type="info"
                showIcon
                icon={<InfoCircleOutlined />}
                style={{ marginBottom: 16 }}
            />

            {/* Step 1: Select Component to Replace */}
            <Card size="small" title="Step 1: Select Component to Replace">
                <Form.Item
                    label="Old Component"
                    name="old_component_selector"
                    rules={[
                        {
                            required: true,
                            message: "Please select a component to replace",
                        },
                    ]}
                >
                    <Select
                        placeholder="Select component to replace"
                        options={componentOptions}
                        onChange={handleOldComponentChange}
                        showSearch
                        optionFilterProp="label"
                        allowClear
                    />
                </Form.Item>
            </Card>

            {/* Step 2: Select Replacement from Inventory */}
            {selectedOldComponent && componentType && (
                <Card
                    size="small"
                    title="Step 2: Select Replacement from Inventory"
                    style={{ marginTop: 16 }}
                >
                    <InventoryTable
                        key={componentType}
                        componentType={componentType}
                        fetchEndpoint={
                            componentType === "part"
                                ? route("inventory.parts.available")
                                : route("inventory.software.available")
                        }
                        selectedType={selectedPartType}
                        onSelectComponent={handleReplacementSelect}
                        columns={
                            componentType === "part"
                                ? getPartColumns(handleReplacementSelect)
                                : getSoftwareColumns(handleReplacementSelect)
                        }
                    />
                </Card>
            )}

            {/* Step 3: Review Selected Replacements */}
            {replacements.length > 0 && (
                <Card
                    size="small"
                    title={`Step 3: Review & Configure (${replacements.length} replacement${replacements.length > 1 ? "s" : ""})`}
                    style={{ marginTop: 16 }}
                    extra={
                        <span style={{ fontSize: 12, color: "#999" }}>
                            Required: Old condition, Reason
                        </span>
                    }
                >
                    <ComponentsReviewTable
                        components={replacements}
                        componentType="replace"
                        onQuantityChange={handleQuantityChange}
                        onSerialChange={handleSerialChange}
                        onReasonChange={handleReasonChange}
                        onRemarksChange={handleRemarksChange}
                        onConditionChange={handleConditionChange}
                        onRemove={handleRemoveComponent}
                    />
                </Card>
            )}
        </>
    );
};

export default ReplaceComponent;
