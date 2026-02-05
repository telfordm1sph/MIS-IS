import React, { useEffect } from "react";
import { Form, Select, Row, Col, Input } from "antd";

const CascadingPartFields = ({
    fieldPrefix,
    form,
    initialValues = {},
    disabled = {},
    layout = "vertical", // "vertical" | "horizontal" | "inline"
    showLabels = true,
    onFieldChange,
    partsHooks,
    isFormList = false, // NEW: true when used inside Form.List
    rowIndex = null, // NEW: row index in Form.List
}) => {
    const { partsOptions, loadBrands, loadModels, loadSpecifications } =
        partsHooks;

    // Helper to work with both flat names and Form.List array notation
    const getFieldValue = (fieldKey) => {
        if (isFormList) {
            const allParts = form.getFieldValue("parts") || [];
            return allParts[rowIndex]?.[fieldKey];
        }
        return form.getFieldValue(`${fieldPrefix}_${fieldKey}`);
    };

    const setFieldValues = (updates) => {
        if (isFormList) {
            const allParts = form.getFieldValue("parts") || [];
            allParts[rowIndex] = { ...allParts[rowIndex], ...updates };
            form.setFieldsValue({ parts: allParts });
        } else {
            const flatUpdates = {};
            Object.entries(updates).forEach(([key, value]) => {
                flatUpdates[`${fieldPrefix}_${key}`] = value;
            });
            form.setFieldsValue(flatUpdates);
        }
    };

    const handlePartTypeChange = (val) => {
        setFieldValues({
            part_type: val,
            brand: undefined,
            model: undefined,
            specifications: undefined,
            condition: undefined,
        });
        if (val) {
            loadBrands(val, fieldPrefix);
        }
        if (onFieldChange) onFieldChange("part_type", val);
    };

    const handleBrandChange = (val) => {
        setFieldValues({
            brand: val,
            model: undefined,
            specifications: undefined,
        });
        if (val) {
            const partType = getFieldValue("part_type");
            loadModels(partType, val, fieldPrefix);
        }
        if (onFieldChange) onFieldChange("brand", val);
    };

    const handleModelChange = (val) => {
        setFieldValues({
            model: val,
            specifications: undefined,
        });
        if (val) {
            const partType = getFieldValue("part_type");
            const brand = getFieldValue("brand");
            loadSpecifications(
                partType,
                brand,
                val,
                fieldPrefix,
                rowIndex || 0,
            );
        }
        if (onFieldChange) onFieldChange("model", val);
    };

    const fields = [
        {
            name: "part_type",
            label: "Part Type",
            options: partsOptions.types || [],
            disabled: disabled.part_type || false,
            onChange: handlePartTypeChange,
            span: layout === "horizontal" ? 8 : 24,
        },
        {
            name: "brand",
            label: "Brand",
            options: partsOptions.brands[fieldPrefix] || [],
            disabled: disabled.brand || false,
            onFocus: async () => {
                const partType = getFieldValue("part_type");
                if (partType) {
                    await loadBrands(partType, fieldPrefix);
                }
            },
            onChange: handleBrandChange,
            span: layout === "horizontal" ? 8 : 24,
        },
        {
            name: "model",
            label: "Model",
            options: partsOptions.models[fieldPrefix] || [],
            disabled: disabled.model || false,
            onFocus: async () => {
                const partType = getFieldValue("part_type");
                const brand = getFieldValue("brand");
                if (partType && brand) {
                    await loadModels(partType, brand, fieldPrefix);
                }
            },
            onChange: handleModelChange,
            span: layout === "horizontal" ? 8 : 24,
        },
        {
            name: "specifications",
            label: "Specifications",
            options: partsOptions.specifications[fieldPrefix] || [],
            disabled: disabled.specifications || false,
            onFocus: async () => {
                const partType = getFieldValue("part_type");
                const brand = getFieldValue("brand");
                const model = getFieldValue("model");
                if (partType && brand && model) {
                    await loadSpecifications(
                        partType,
                        brand,
                        model,
                        fieldPrefix,
                        rowIndex || 0,
                    );
                }
            },
            span: layout === "horizontal" ? 8 : 24,
        },
        {
            name: "serial_number",
            label: "Serial Number",
            type: "input",
            disabled: disabled.serial_number || false,
            span: layout === "horizontal" ? 8 : 24,
        },
    ];

    if (layout === "inline" && isFormList) {
        // Inline layout for Form.List (HardwareFormDrawer)
        return (
            <>
                {fields.slice(0, 4).map((field) => (
                    <Col xs={24} sm={12} md={4} key={field.name}>
                        <Form.Item
                            name={[rowIndex, field.name]}
                            label={rowIndex === 0 ? field.label : ""}
                            style={{ marginBottom: 0 }}
                            rules={[
                                {
                                    required: !field.disabled,
                                    message: `Please select ${field.label.toLowerCase()}`,
                                },
                            ]}
                        >
                            <Select
                                placeholder={`Select ${field.label}`}
                                options={field.options}
                                disabled={field.disabled}
                                showSearch
                                optionFilterProp="label"
                                onFocus={field.onFocus}
                                onChange={field.onChange}
                            />
                        </Form.Item>
                    </Col>
                ))}
                <Col xs={24} sm={12} md={6}>
                    <Form.Item
                        name={[rowIndex, "serial_number"]}
                        label={rowIndex === 0 ? "Serial" : ""}
                        style={{ marginBottom: 0 }}
                        rules={[
                            {
                                required: true,
                                message: "Please enter serial number",
                            },
                        ]}
                    >
                        <Input allowClear placeholder="Enter serial number" />
                    </Form.Item>
                </Col>
            </>
        );
    } else if (layout === "inline") {
        // Inline layout for non-FormList
        return (
            <>
                {fields.map((field) => (
                    <Form.Item
                        key={field.name}
                        name={`${fieldPrefix}_${field.name}`}
                        rules={[
                            {
                                required: !field.disabled,
                                message: `Please ${field.type === "input" ? "enter" : "select"} ${field.label.toLowerCase()}`,
                            },
                        ]}
                        style={{ margin: 0 }}
                    >
                        {field.type === "input" ? (
                            <Input
                                placeholder={`Enter ${field.label}`}
                                disabled={field.disabled}
                                allowClear
                                style={{ width: "100%", minWidth: 0 }}
                            />
                        ) : (
                            <Select
                                placeholder={`Select ${field.label}`}
                                options={field.options}
                                disabled={field.disabled}
                                showSearch
                                optionFilterProp="label"
                                onFocus={field.onFocus}
                                onChange={field.onChange}
                                style={{ width: "100%", minWidth: 0 }}
                            />
                        )}
                    </Form.Item>
                ))}
            </>
        );
    }

    // Vertical or Horizontal layout
    return (
        <Row gutter={16}>
            {fields.map((field) => (
                <Col span={field.span} key={field.name}>
                    <Form.Item
                        name={`${fieldPrefix}_${field.name}`}
                        label={showLabels ? field.label : undefined}
                        rules={[
                            {
                                required: !field.disabled,
                                message: `Please ${field.type === "input" ? "enter" : "select"} ${field.label.toLowerCase()}`,
                            },
                        ]}
                        initialValue={
                            initialValues[
                                field.label.toLowerCase().replace(" ", "_")
                            ]
                        }
                    >
                        {field.type === "input" ? (
                            <Input
                                placeholder={`Enter ${field.label}`}
                                disabled={field.disabled}
                                allowClear
                            />
                        ) : (
                            <Select
                                placeholder={`Select ${field.label}`}
                                options={field.options}
                                disabled={field.disabled}
                                showSearch
                                optionFilterProp="label"
                                onFocus={field.onFocus}
                                onChange={field.onChange}
                            />
                        )}
                    </Form.Item>
                </Col>
            ))}
        </Row>
    );
};

export default CascadingPartFields;
