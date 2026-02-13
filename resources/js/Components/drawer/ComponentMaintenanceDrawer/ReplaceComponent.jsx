import React, { useState, useEffect, useCallback } from "react";
import { Form, Select, Card, Button, Input, message, Tag } from "antd";
import { CirclePlusIcon } from "lucide-react";

import InventoryTable from "./InventoryTable";
import ComponentsReviewTable from "./ComponentsReviewTable";

const ReplaceComponent = ({ form, componentOptions, hardware }) => {
    const [selectedOldComponent, setSelectedOldComponent] = useState(null);
    const [componentType, setComponentType] = useState(null);
    const [selectedComponentInfo, setSelectedComponentInfo] = useState(null);
    const [replacements, setReplacements] = useState([]);
    const [selectedPartType, setSelectedPartType] = useState(null);

    // Initialize replacements array if it doesn't exist
    useEffect(() => {
        const existingReplacements = form.getFieldValue("replacements");
        if (!existingReplacements) {
            form.setFieldsValue({ replacements: [] });
            setReplacements([]);
        } else {
            setReplacements(existingReplacements);
        }
    }, [form]);

    // Watch for form changes and update local state
    useEffect(() => {
        const values = form.getFieldsValue();
        if (values.replacements) {
            setReplacements(values.replacements);
        }
    }, [form, form.getFieldValue("replacements")]);

    // Get component data
    const getComponentData = useCallback(
        (componentId) => {
            if (!componentId) return null;
            const [type, id] = componentId.split("_");
            if (type === "part") {
                const data = hardware?.parts?.find((p) => p.id == id);
                return {
                    type: "part",
                    data: data,
                };
            } else {
                const data = hardware?.software?.find((s) => s.id == id);
                return {
                    type: "software",
                    data: data,
                };
            }
        },
        [hardware],
    );

    // Handle component selection change
    const handleOldComponentChange = (value) => {
        setSelectedOldComponent(value);
        if (value) {
            const componentInfo = getComponentData(value);
            setComponentType(componentInfo?.type || null);
            setSelectedComponentInfo(componentInfo);

            // Pass part type if it's a part
            if (componentInfo?.type === "part") {
                setSelectedPartType(componentInfo.data.part_info.part_type);
            } else {
                setSelectedPartType(componentInfo.data.inventory.software_name);
            }
        } else {
            setComponentType(null);
            setSelectedComponentInfo(null);
            setSelectedPartType(null);
        }
    };

    // Handle selecting a replacement from InventoryTable
    const handleSelectReplacement = (record) => {
        const currentReplacements = form.getFieldValue("replacements") || [];
        const componentInfo = selectedComponentInfo;

        if (!componentInfo) {
            message.error("Please select a component to replace first");
            return;
        }

        // Check if this replacement already exists for the same old component
        const exists = currentReplacements.find(
            (r) =>
                r.old_component_id === selectedOldComponent &&
                r.new_component_id === record.id &&
                (componentInfo.type !== "part" ||
                    r.component_data?.condition === record.condition),
        );

        const maxQty =
            componentInfo.type === "part"
                ? record.quantity
                : record.available_activations || 999;

        if (exists) {
            if (exists.quantity < maxQty) {
                const updated = currentReplacements.map((r) => {
                    if (
                        r.old_component_id === selectedOldComponent &&
                        r.new_component_id === record.id &&
                        (componentInfo.type !== "part" ||
                            r.component_data?.condition === record.condition)
                    ) {
                        return { ...r, quantity: r.quantity + 1 };
                    }
                    return r;
                });
                form.setFieldsValue({ replacements: updated });
                setReplacements(updated);
                message.success("Quantity increased by 1");
            } else {
                message.warning("Maximum quantity reached for this component");
            }
            return;
        }

        // Create new replacement entry
        const newReplacement = {
            key: `${selectedOldComponent}-${record.id}-${record.condition || "default"}-${Date.now()}-${Math.random()}`,
            old_component_id: selectedOldComponent,
            old_component_type: componentInfo.type,
            old_component_data: componentInfo.data,
            new_component_id: record.id,
            new_component_type: componentInfo.type,
            component_data: record,
            component_type: componentInfo.type,
            quantity: 1,
            serial_number: "",
            reason: "",
            remarks: "",
        };

        const updatedReplacements = [...currentReplacements, newReplacement];
        form.setFieldsValue({ replacements: updatedReplacements });
        setReplacements(updatedReplacements);
        message.success("Replacement selected");
    };

    // Step 3 handlers
    const handleQuantityChange = (index, value) => {
        const updated = [...replacements];
        const maxQty =
            updated[index]?.component_type === "part"
                ? updated[index]?.component_data?.quantity
                : updated[index]?.component_data?.available_activations || 999;

        const newQuantity = Math.max(1, Math.min(value || 1, maxQty));
        updated[index].quantity = newQuantity;
        form.setFieldsValue({ replacements: updated });
        setReplacements(updated);
    };

    const handleSerialChange = (index, value) => {
        const updated = [...replacements];
        updated[index].serial_number = value;
        form.setFieldsValue({ replacements: updated });
        setReplacements(updated);
    };

    const handleReasonChange = (index, value) => {
        const updated = [...replacements];
        updated[index].reason = value;
        form.setFieldsValue({ replacements: updated });
        setReplacements(updated);
    };

    const handleRemoveComponent = (index) => {
        const updated = [...replacements];
        updated.splice(index, 1);
        form.setFieldsValue({ replacements: updated });
        setReplacements(updated);
    };

    // Table columns for inventory
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
                    onClick={() => handleSelectReplacement(record)}
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
                    onClick={() => handleSelectReplacement(record)}
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

    return (
        <>
            {/* Hidden Form.Item to initialize the field */}
            <Form.Item name="replacements" hidden initialValue={[]}>
                <Input />
            </Form.Item>

            {/* Step 1: Select Component to Replace */}
            <Card size="small" title="Step 1: Select Component to Replace">
                <Form.Item
                    label="Select Old Component"
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
                        onSelectComponent={handleSelectReplacement}
                        columns={
                            componentType === "part"
                                ? partColumns
                                : softwareColumns
                        }
                    />
                </Card>
            )}

            {/* Step 3: Review Selected Replacements */}
            {replacements && replacements.length > 0 && (
                <Card
                    size="small"
                    title={`Step 3: Review Selected Replacements (${replacements.length})`}
                    style={{ marginTop: 16 }}
                >
                    <ComponentsReviewTable
                        components={replacements}
                        componentType="replace"
                        onQuantityChange={handleQuantityChange}
                        onSerialChange={handleSerialChange}
                        onReasonChange={handleReasonChange}
                        onRemove={handleRemoveComponent}
                    />
                </Card>
            )}
        </>
    );
};

export default ReplaceComponent;
