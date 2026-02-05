import React, { useEffect } from "react";
import { Form, Select, Row, Col } from "antd";
import { useHardwareSoftware } from "@/Hooks/useHardwareSoftware";

/**
 * Reusable cascading software fields component
 * Handles Name → Type → Version → License cascade
 */
const CascadingSoftwareFields = ({
    fieldPrefix,
    form,
    initialValues = {},
    disabled = {},
    layout = "vertical", // "vertical" | "horizontal"
    showLabels = true,
    onFieldChange,
    softwareHooks,
}) => {
    const {
        softwareOptions,
        loadSoftwareTypes,
        loadSoftwareVersions,
        loadSoftwareLicenses,
    } = softwareHooks;

    const handleNameChange = (val) => {
        const resetFields = {
            [`${fieldPrefix}_software_type`]: undefined,
            [`${fieldPrefix}_version`]: undefined,
            [`${fieldPrefix}_license`]: undefined,
        };
        form.setFieldsValue(resetFields);
        if (val) {
            loadSoftwareTypes(val, fieldPrefix);
        }
        if (onFieldChange) onFieldChange("software_name", val);
    };

    const handleTypeChange = (val) => {
        const resetFields = {
            [`${fieldPrefix}_version`]: undefined,
            [`${fieldPrefix}_license`]: undefined,
        };
        form.setFieldsValue(resetFields);
        if (val) {
            const name = form.getFieldValue(`${fieldPrefix}_software_name`);
            loadSoftwareVersions(name, val, fieldPrefix);
        }
        if (onFieldChange) onFieldChange("software_type", val);
    };

    const handleVersionChange = (val) => {
        form.setFieldsValue({
            [`${fieldPrefix}_license`]: undefined,
        });
        if (val) {
            const name = form.getFieldValue(`${fieldPrefix}_software_name`);
            const type = form.getFieldValue(`${fieldPrefix}_software_type`);
            loadSoftwareLicenses(name, type, val, fieldPrefix, 0);
        }
        if (onFieldChange) onFieldChange("version", val);
    };

    // Load options based on current form values (not just initialValues)
    useEffect(() => {
        const name = form.getFieldValue(`${fieldPrefix}_software_name`);
        const type = form.getFieldValue(`${fieldPrefix}_software_type`);
        const version = form.getFieldValue(`${fieldPrefix}_version`);

        if (name) {
            loadSoftwareTypes(name, fieldPrefix);
            if (type) {
                loadSoftwareVersions(name, type, fieldPrefix);
                if (version) {
                    loadSoftwareLicenses(name, type, version, fieldPrefix, 0);
                }
            }
        }
    }, [
        form.getFieldValue(`${fieldPrefix}_software_name`),
        form.getFieldValue(`${fieldPrefix}_software_type`),
        form.getFieldValue(`${fieldPrefix}_version`),
        fieldPrefix,
        // ❌ REMOVE these dependencies to prevent infinite loop:
        // loadSoftwareTypes,
        // loadSoftwareVersions,
        // loadSoftwareLicenses,
    ]);

    const fields = [
        {
            name: `${fieldPrefix}_software_name`,
            label: "Software Name",
            options: softwareOptions.names || [],
            disabled: disabled.software_name || false,
            onChange: handleNameChange,
            span: layout === "horizontal" ? 12 : 24,
        },
        {
            name: `${fieldPrefix}_software_type`,
            label: "Software Type",
            options: softwareOptions.types[fieldPrefix] || [],
            disabled: disabled.software_type || false,
            onFocus: async () => {
                const name = form.getFieldValue(`${fieldPrefix}_software_name`);
                if (name) {
                    await loadSoftwareTypes(name, fieldPrefix);
                }
            },
            onChange: handleTypeChange,
            span: layout === "horizontal" ? 12 : 24,
        },
        {
            name: `${fieldPrefix}_version`,
            label: "Version",
            options: softwareOptions.versions[fieldPrefix] || [],
            disabled: disabled.version || false,
            onFocus: async () => {
                const name = form.getFieldValue(`${fieldPrefix}_software_name`);
                const type = form.getFieldValue(`${fieldPrefix}_software_type`);
                if (name && type) {
                    await loadSoftwareVersions(name, type, fieldPrefix);
                }
            },
            onChange: handleVersionChange,
            span: layout === "horizontal" ? 12 : 24,
        },
        {
            name: `${fieldPrefix}_license`,
            label: "License / Account",
            options: softwareOptions.licenses[fieldPrefix] || [],
            disabled: disabled.license || false,
            onFocus: async () => {
                const name = form.getFieldValue(`${fieldPrefix}_software_name`);
                const type = form.getFieldValue(`${fieldPrefix}_software_type`);
                const version = form.getFieldValue(`${fieldPrefix}_version`);
                if (name && type && version) {
                    await loadSoftwareLicenses(
                        name,
                        type,
                        version,
                        fieldPrefix,
                        0,
                    );
                }
            },
            span: layout === "horizontal" ? 12 : 24,
        },
    ];

    if (layout === "inline") {
        // Inline layout for dynamic list
        return (
            <>
                {fields.map((field) => (
                    <Form.Item
                        key={field.name}
                        name={field.name}
                        rules={[
                            {
                                required: !field.disabled,
                                message: `Please select ${field.label.toLowerCase()}`,
                            },
                        ]}
                        style={{ margin: 0 }}
                        initialValue={
                            initialValues[
                                field.label.toLowerCase().replace(" ", "_")
                            ]
                        }
                    >
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
                                message: `Please select ${field.label.toLowerCase()}`,
                            },
                        ]}
                        initialValue={
                            initialValues[
                                field.label.toLowerCase().replace(" ", "_")
                            ]
                        }
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
        </Row>
    );
};

export default CascadingSoftwareFields;
