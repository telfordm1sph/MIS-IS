import React, { useEffect } from "react";
import { Form, Select, Row, Col } from "antd";

const CascadingSoftwareFields = ({
    fieldPrefix,
    form,
    initialValues = {},
    disabled = {},
    layout = "vertical",
    showLabels = true,
    onFieldChange,
    softwareHooks,
    isFormList = false,
    rowIndex = null,
    // ✅ NEW: the raw software object for this row, passed directly from
    //    Form.List so we don't race against form.setFieldsValue timing
    rowData = null,
}) => {
    const {
        softwareOptions,
        loadSoftwareTypes,
        loadSoftwareVersions,
        loadSoftwareLicenses,
    } = softwareHooks;

    const getFieldValue = (fieldKey) => {
        if (isFormList) {
            const allSoftware = form.getFieldValue("software") || [];
            return allSoftware[rowIndex]?.[fieldKey];
        }
        return form.getFieldValue(`${fieldPrefix}_${fieldKey}`);
    };

    const setFieldValues = (updates) => {
        if (isFormList) {
            const allSoftware = form.getFieldValue("software") || [];
            allSoftware[rowIndex] = { ...allSoftware[rowIndex], ...updates };
            form.setFieldsValue({ software: allSoftware });
        } else {
            const flatUpdates = {};
            Object.entries(updates).forEach(([key, value]) => {
                flatUpdates[`${fieldPrefix}_${key}`] = value;
            });
            form.setFieldsValue(flatUpdates);
        }
    };

    // ✅ FIX: Use rowData prop instead of reading from form on mount.
    //    Child component mounts before parent's useEffect runs setFieldsValue,
    //    so form values are always undefined when read at mount time.
    //    rowData comes directly from the Form.List render — always in sync.
    useEffect(() => {
        const name = rowData?.software_name;
        const type = rowData?.software_type;
        const version = rowData?.version;

        if (name) {
            loadSoftwareTypes(name, fieldPrefix);
        }
        if (name && type) {
            loadSoftwareVersions(name, type, fieldPrefix);
        }
        if (name && type && version) {
            loadSoftwareLicenses(
                name,
                type,
                version,
                fieldPrefix,
                rowIndex || 0,
            );
        }
        // Re-run when the row's key values change
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rowData?.software_name, rowData?.software_type, rowData?.version]);

    const handleNameChange = (val) => {
        setFieldValues({
            software_name: val,
            software_type: undefined,
            version: undefined,
            _license_identifier: undefined,
        });
        if (val) {
            loadSoftwareTypes(val, fieldPrefix);
        }
        if (onFieldChange) onFieldChange("software_name", val);
    };

    const handleTypeChange = (val) => {
        setFieldValues({
            software_type: val,
            version: undefined,
            _license_identifier: undefined,
        });
        if (val) {
            const name = getFieldValue("software_name");
            loadSoftwareVersions(name, val, fieldPrefix);
        }
        if (onFieldChange) onFieldChange("software_type", val);
    };

    const handleVersionChange = (val) => {
        setFieldValues({
            version: val,
            _license_identifier: undefined,
        });
        if (val) {
            const name = getFieldValue("software_name");
            const type = getFieldValue("software_type");
            loadSoftwareLicenses(name, type, val, fieldPrefix, rowIndex || 0);
        }
        if (onFieldChange) onFieldChange("version", val);
    };

    const fields = [
        {
            name: "software_name",
            label: "Software Name",
            options: softwareOptions.names || [],
            disabled: disabled.software_name || false,
            onChange: handleNameChange,
            span: layout === "horizontal" ? 12 : 24,
        },
        {
            name: "software_type",
            label: "Software Type",
            options: softwareOptions.types[fieldPrefix] || [],
            disabled: disabled.software_type || false,
            onFocus: async () => {
                const name = getFieldValue("software_name");
                if (name) await loadSoftwareTypes(name, fieldPrefix);
            },
            onChange: handleTypeChange,
            span: layout === "horizontal" ? 12 : 24,
        },
        {
            name: "version",
            label: "Version",
            options: softwareOptions.versions[fieldPrefix] || [],
            disabled: disabled.version || false,
            onFocus: async () => {
                const name = getFieldValue("software_name");
                const type = getFieldValue("software_type");
                if (name && type)
                    await loadSoftwareVersions(name, type, fieldPrefix);
            },
            onChange: handleVersionChange,
            span: layout === "horizontal" ? 12 : 24,
        },
        {
            name: "_license_identifier",
            label: "License / Account",
            options: softwareOptions.licenses[fieldPrefix] || [],
            disabled: disabled.license || false,
            onFocus: async () => {
                const name = getFieldValue("software_name");
                const type = getFieldValue("software_type");
                const version = getFieldValue("version");
                if (name && type && version) {
                    await loadSoftwareLicenses(
                        name,
                        type,
                        version,
                        fieldPrefix,
                        rowIndex || 0,
                    );
                }
            },
            span: layout === "horizontal" ? 12 : 24,
        },
    ];

    if (layout === "inline" && isFormList) {
        return (
            <>
                {fields.slice(0, 3).map((field) => (
                    <Col xs={24} sm={12} md={5} key={field.name}>
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
                <Col xs={24} sm={12} md={8}>
                    <Form.Item
                        name={[rowIndex, "_license_identifier"]}
                        label={rowIndex === 0 ? "License" : ""}
                        style={{ marginBottom: 0 }}
                    >
                        <Select
                            placeholder="Select License"
                            options={
                                softwareOptions.licenses[fieldPrefix] || []
                            }
                            allowClear
                            showSearch
                            optionFilterProp="label"
                            onChange={fields[3].onChange}
                            onFocus={fields[3].onFocus}
                        />
                    </Form.Item>
                </Col>
            </>
        );
    } else if (layout === "inline") {
        return (
            <>
                {fields.map((field) => (
                    <Form.Item
                        key={field.name}
                        name={`${fieldPrefix}_${field.name}`}
                        rules={[
                            {
                                required: !field.disabled,
                                message: `Please select ${field.label.toLowerCase()}`,
                            },
                        ]}
                        style={{ margin: 0 }}
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
