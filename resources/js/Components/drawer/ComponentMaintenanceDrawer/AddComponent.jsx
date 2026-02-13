import React, { useEffect, useCallback } from "react";
import { Form, Select, Input, Card, message } from "antd";

import InventoryTable from "./InventoryTable";
import ComponentsReviewTable from "./ComponentsReviewTable";
import { getPartColumns, getSoftwareColumns } from "@/Utils/inventoryColumns";
import { useComponentManagement } from "@/Hooks/useComponentManagement";
import { useComponentSelection } from "@/Hooks/useComponentSelection";

const AddComponent = ({
    form,
    selectedComponentType,
    onComponentTypeSelect,
}) => {
    const componentTypes = [
        { label: "Hardware Part", value: "part" },
        { label: "Software", value: "software" },
    ];

    // Initialize components array if it doesn't exist
    useEffect(() => {
        const components = form.getFieldValue("components");
        if (!components) form.setFieldsValue({ components: [] });
    }, [form]);

    const { handleSelectComponent } = useComponentSelection({
        form,
        fieldName: "components",
        operation: "add",
    });

    const {
        handleQuantityChange,
        handleSerialChange,
        handleReasonChange,
        handleRemoveComponent,
        handleRemarksChange,
    } = useComponentManagement({
        form,
        fieldName: "components",
    });

    // Wrap handleSelectComponent to provide the correct parameters
    const handleAddSelect = useCallback(
        (record) => {
            if (!record) {
                message.error("No component selected");
                return;
            }
            if (!selectedComponentType) {
                message.error("Please select component type first");
                return;
            }

            handleSelectComponent({
                record,
                selectedComponentType,
            });
        },
        [selectedComponentType, handleSelectComponent],
    );

    const selectedComponents = Form.useWatch("components", form) || [];

    return (
        <>
            <Card size="small" title="Step 1: Select Component Type">
                <Form.Item
                    label="Component Type"
                    name="component_type"
                    rules={[
                        {
                            required: true,
                            message: "Please select component type",
                        },
                    ]}
                >
                    <Select
                        placeholder="Select type"
                        options={componentTypes}
                        onChange={onComponentTypeSelect}
                        allowClear
                    />
                </Form.Item>
            </Card>

            {selectedComponentType && (
                <Card
                    size="small"
                    title="Step 2: Select Components from Inventory"
                    style={{ marginTop: 16 }}
                >
                    <InventoryTable
                        key={selectedComponentType}
                        componentType={selectedComponentType}
                        fetchEndpoint={
                            selectedComponentType === "part"
                                ? route("inventory.parts.available")
                                : route("inventory.software.available")
                        }
                        onSelectComponent={handleAddSelect}
                        columns={
                            selectedComponentType === "part"
                                ? getPartColumns(handleAddSelect)
                                : getSoftwareColumns(handleAddSelect)
                        }
                    />
                </Card>
            )}

            {selectedComponents.length > 0 && (
                <Card
                    size="small"
                    title={`Step 3: Review & Configure (${selectedComponents.length} item${selectedComponents.length > 1 ? "s" : ""})`}
                    style={{ marginTop: 16 }}
                >
                    <ComponentsReviewTable
                        components={selectedComponents}
                        componentType="add"
                        onQuantityChange={handleQuantityChange}
                        onSerialChange={handleSerialChange}
                        onReasonChange={handleReasonChange}
                        onRemarksChange={handleRemarksChange}
                        onRemove={handleRemoveComponent}
                    />
                </Card>
            )}

            {/* Hidden Form.Item */}
            <Form.Item name="components" hidden initialValue={[]}>
                <Input />
            </Form.Item>
        </>
    );
};

export default AddComponent;
