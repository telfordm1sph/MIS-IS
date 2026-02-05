import React, { useEffect } from "react";
import { Form, Select, Row, Col, Input } from "antd";

const CascadingPartFields = ({
    fieldPrefix,
    form,
    initialValues = {},
    disabled = {},
    layout = "vertical", // "vertical" | "horizontal"
    showLabels = true,
    onFieldChange,
    partsHooks,
}) => {
    const { partsOptions, loadBrands, loadModels, loadSpecifications } =
        partsHooks;

    const handlePartTypeChange = (val) => {
        const resetFields = {
            [`${fieldPrefix}_brand`]: undefined,
            [`${fieldPrefix}_model`]: undefined,
            [`${fieldPrefix}_specifications`]: undefined,
        };
        form.setFieldsValue(resetFields);
        if (val) {
            loadBrands(val, fieldPrefix);
        }
        if (onFieldChange) onFieldChange("part_type", val);
    };

    const handleBrandChange = (val) => {
        const resetFields = {
            [`${fieldPrefix}_model`]: undefined,
            [`${fieldPrefix}_specifications`]: undefined,
        };
        form.setFieldsValue(resetFields);
        if (val) {
            const partType = form.getFieldValue(`${fieldPrefix}_part_type`);
            loadModels(partType, val, fieldPrefix);
        }
        if (onFieldChange) onFieldChange("brand", val);
    };

    const handleModelChange = (val) => {
        form.setFieldsValue({
            [`${fieldPrefix}_specifications`]: undefined,
        });
        if (val) {
            const partType = form.getFieldValue(`${fieldPrefix}_part_type`);
            const brand = form.getFieldValue(`${fieldPrefix}_brand`);
            loadSpecifications(partType, brand, val, fieldPrefix, 0);
        }
        if (onFieldChange) onFieldChange("model", val);
    };

    const fields = [
        {
            name: `${fieldPrefix}_part_type`,
            label: "Part Type",
            options: partsOptions.types || [],
            disabled: disabled.part_type || false,
            onChange: handlePartTypeChange,
            span: layout === "horizontal" ? 8 : 24,
        },
        {
            name: `${fieldPrefix}_brand`,
            label: "Brand",
            options: partsOptions.brands[fieldPrefix] || [],
            disabled: disabled.brand || false,
            onFocus: async () => {
                const partType = form.getFieldValue(`${fieldPrefix}_part_type`);
                if (partType) {
                    await loadBrands(partType, fieldPrefix);
                }
            },
            onChange: handleBrandChange,
            span: layout === "horizontal" ? 8 : 24,
        },
        {
            name: `${fieldPrefix}_model`,
            label: "Model",
            options: partsOptions.models[fieldPrefix] || [],
            disabled: disabled.model || false,
            onFocus: async () => {
                const partType = form.getFieldValue(`${fieldPrefix}_part_type`);
                const brand = form.getFieldValue(`${fieldPrefix}_brand`);
                if (partType && brand) {
                    await loadModels(partType, brand, fieldPrefix);
                }
            },
            onChange: handleModelChange,
            span: layout === "horizontal" ? 8 : 24,
        },
        {
            name: `${fieldPrefix}_specifications`,
            label: "Specifications",
            options: partsOptions.specifications[fieldPrefix] || [],
            disabled: disabled.specifications || false,
            onFocus: async () => {
                const partType = form.getFieldValue(`${fieldPrefix}_part_type`);
                const brand = form.getFieldValue(`${fieldPrefix}_brand`);
                const model = form.getFieldValue(`${fieldPrefix}_model`);
                if (partType && brand && model) {
                    await loadSpecifications(
                        partType,
                        brand,
                        model,
                        fieldPrefix,
                        0,
                    );
                }
            },
            span: layout === "horizontal" ? 8 : 24,
        },
        {
            name: `${fieldPrefix}_serial_number`,
            label: "Serial Number",
            type: "input",
            disabled: disabled.serial_number || false,
            span: layout === "horizontal" ? 8 : 24,
        },
    ];

    if (layout === "inline") {
        // Inline layout for dynamic list (HardwareFormDrawer)
        return (
            <>
                {fields.map((field) => (
                    <Form.Item
                        key={field.name}
                        name={field.name}
                        rules={[
                            {
                                required: !field.disabled,
                                message: `Please ${field.type === "input" ? "enter" : "select"} ${field.label.toLowerCase()}`,
                            },
                        ]}
                        style={{ margin: 0 }}
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
                        name={field.name}
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
