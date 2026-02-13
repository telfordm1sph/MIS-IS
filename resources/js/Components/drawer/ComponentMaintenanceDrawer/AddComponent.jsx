import React, { useState, useEffect, useCallback } from "react";
import { Form, Select, Input, Button, Card, Table, Tag, message } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { v4 as uuidv4 } from "uuid";
import { CirclePlusIcon } from "lucide-react";

import InventoryTable from "./InventoryTable";
import ComponentsReviewTable from "./ComponentsReviewTable";

const { Search } = Input;

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

    // Handle selecting a component
    const handleSelectComponent = (record) => {
        const components = form.getFieldValue("components") || [];
        const exists = components.find(
            (c) =>
                c.component_id === record.id &&
                c.component_type === selectedComponentType &&
                c.component_data.condition === record.condition,
        );

        const maxQty =
            selectedComponentType === "part"
                ? record.quantity
                : record.available_activations || 999;

        if (exists) {
            if (exists.quantity < maxQty) {
                const updated = components.map((c) =>
                    c.component_id === record.id &&
                    c.component_type === selectedComponentType &&
                    c.component_data.condition === record.condition
                        ? { ...c, quantity: c.quantity + 1 }
                        : c,
                );
                form.setFieldsValue({ components: updated });
                message.success("Quantity increased by 1");
            } else {
                message.warning("Maximum quantity reached for this component");
            }
            return;
        }

        const updatedComponents = [
            ...components,
            {
                key: uuidv4(),
                component_id: record.id,
                component_type: selectedComponentType,
                component_data: record,
                quantity: 1,
                serial_number: "",
                reason: "",
            },
        ];
        form.setFieldsValue({ components: updatedComponents });
        message.success("Component added");
    };

    const handleRemoveComponent = (index) => {
        const components = form.getFieldValue("components") || [];
        form.setFieldsValue({
            components: components.filter((_, i) => i !== index),
        });
    };

    const handleQuantityChange = (index, value) => {
        const components = form.getFieldValue("components") || [];
        const maxQty =
            components[index]?.component_type === "part"
                ? components[index]?.component_data?.quantity
                : components[index]?.component_data?.available_activations ||
                  999;
        const newQuantity = Math.max(1, Math.min(value || 1, maxQty));
        const updated = [...components];
        updated[index] = { ...updated[index], quantity: newQuantity };
        form.setFieldsValue({ components: updated });
    };

    const handleSerialChange = (index, value) => {
        const components = form.getFieldValue("components") || [];
        const updated = [...components];
        updated[index] = { ...updated[index], serial_number: value };
        form.setFieldsValue({ components: updated });
    };

    const handleReasonChange = (index, value) => {
        const components = form.getFieldValue("components") || [];
        const updated = [...components];
        updated[index] = { ...updated[index], reason: value };
        form.setFieldsValue({ components: updated });
    };

    const partColumns = [
        {
            title: "Add",
            key: "add",
            fixed: "left",
            width: 60,
            render: (_, record) => (
                <Button
                    type="text"
                    size="small"
                    icon={<CirclePlusIcon size={16} />}
                    onClick={() => handleSelectComponent(record)}
                    disabled={record.quantity <= 0}
                />
            ),
        },
        { title: "Part Type", dataIndex: "part_type", width: 120 },
        { title: "Brand", dataIndex: "brand", width: 120 },
        { title: "Model", dataIndex: "model", width: 120 },
        { title: "Specifications", dataIndex: "specifications", width: 150 },
        {
            title: "Condition",
            dataIndex: "condition",
            width: 100,
            render: (condition) => <Tag color="green">{condition}</Tag>,
        },
        { title: "Qty Available", dataIndex: "quantity", width: 100 },
        { title: "Location", dataIndex: "location", width: 120 },
    ];

    const softwareColumns = [
        {
            title: "Add",
            key: "add",
            fixed: "left",
            width: 60,
            render: (_, record) => (
                <Button
                    type="text"
                    size="small"
                    icon={<CirclePlusIcon size={16} />}
                    onClick={() => handleSelectComponent(record)}
                    disabled={record.available_activations <= 0}
                />
            ),
        },
        { title: "Software Name", dataIndex: "software_name", width: 150 },
        { title: "Type", dataIndex: "software_type", width: 120 },
        { title: "Version", dataIndex: "version", width: 100 },
        {
            title: "Identifier",
            dataIndex: "identifier",
            width: 150,
            render: (text, record) => (
                <div>
                    <div>{text}</div>
                    <small style={{ color: "#888" }}>
                        {record.identifier_type}
                    </small>
                </div>
            ),
        },
        {
            title: "Available Activations",
            dataIndex: "available_activations",
            width: 130,
        },
    ];

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
                    title="Step 2: Select Components"
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
                        onSelectComponent={handleSelectComponent}
                        columns={
                            selectedComponentType === "part"
                                ? partColumns
                                : softwareColumns
                        }
                    />
                </Card>
            )}

            {selectedComponents.length > 0 && (
                <Card
                    size="small"
                    title={`Step 3: Review Selected Components (${selectedComponents.length})`}
                    style={{ marginTop: 16 }}
                >
                    <ComponentsReviewTable
                        components={selectedComponents}
                        componentType="add"
                        onQuantityChange={handleQuantityChange}
                        onSerialChange={handleSerialChange}
                        onReasonChange={handleReasonChange}
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
