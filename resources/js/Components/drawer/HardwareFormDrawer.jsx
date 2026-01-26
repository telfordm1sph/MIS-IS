import React, { useEffect, useState } from "react";
import {
    Drawer,
    Form,
    Input,
    Select,
    Button,
    DatePicker,
    Tabs,
    Spin,
} from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import axios from "axios";
import RemovalReasonModal from "../modal/RemovalReasonModal";
import { useHardwareParts } from "../hooks/useHardwareParts";
import { useHardwareSoftware } from "../hooks/useHardwareSoftware";
import { useRemovalModal } from "../hooks/useRemovalModal";
import {
    convertDatesToDayjs,
    convertDayjsToStrings,
} from "../utils/dateHelper";
const { TextArea } = Input;

const HardwareFormDrawer = ({ open, onClose, item, onSave, fieldGroups }) => {
    const [removedItems, setRemovedItems] = useState({});
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();

    const {
        removalModalVisible,
        pendingRemoval,
        removalForm,
        handleRemoveWithReason,
        confirmRemoval,
        cancelRemoval,
    } = useRemovalModal(form, setRemovedItems);

    const {
        partsOptions,
        loadPartTypes,
        loadBrands,
        loadModels,
        loadSpecifications,
        getPartsOptions,
    } = useHardwareParts(form);

    const {
        softwareOptions,
        loadSoftwareNames,
        loadSoftwareTypes,
        loadSoftwareVersions,
        loadSoftwareLicenses,
        getSoftwareOptions,
    } = useHardwareSoftware(form);

    useEffect(() => {
        if (!open) return;

        // Load dropdown options
        loadPartTypes();
        loadSoftwareNames();

        // Load item data for editing
        if (item) {
            setLoading(true);
            const formattedItem = convertDatesToDayjs({
                ...item,
                date_issued: item.date_issued ? dayjs(item.date_issued) : null,
                remarks: "",
            });

            // Handle software data - use license_key OR account_user for display
            if (
                formattedItem.software &&
                Array.isArray(formattedItem.software)
            ) {
                formattedItem.software = formattedItem.software.map((sw) => {
                    // Determine which identifier to use
                    // If license_key is null/undefined, use account_user
                    const displayValue =
                        sw.license_key !== null && sw.license_key !== undefined
                            ? sw.license_key
                            : sw.account_user;

                    return {
                        ...sw,
                        _license_identifier: displayValue,
                        license_key: displayValue, // This will be used for display in the form
                        // Keep original values for reference
                        _original_license_key: sw.license_key,
                        _original_account_user: sw.account_user,
                    };
                });
            }

            form.setFieldsValue(formattedItem);
            setLoading(false);
        } else {
            form.resetFields();
        }
    }, [open, item]);

    const handleFinish = (values) => {
        const formattedValues = convertDayjsToStrings(values);

        // Handle software data - determine whether to save as license_key or account_user
        if (
            formattedValues.software &&
            Array.isArray(formattedValues.software)
        ) {
            formattedValues.software = formattedValues.software.map(
                (sw, index) => {
                    // Get the license data from options to determine the type
                    const fieldName = `software_${index}`;
                    const licenseOptions =
                        softwareOptions.licenses?.[fieldName] || [];
                    const selectedOption = licenseOptions.find(
                        (opt) => opt.value === sw._license_identifier,
                    );

                    const licenseData = selectedOption?.license_data;

                    // Determine the type based on license data
                    // If license_data has license_key (not null), it's a license key type
                    // Otherwise, it's an account type
                    const isLicenseKey =
                        licenseData &&
                        licenseData.license_key !== null &&
                        licenseData.license_key !== undefined &&
                        licenseData.license_key !== "";

                    // Prepare the return object
                    const result = {
                        ...sw,
                        _license_identifier: undefined,
                        _original_license_key: undefined,
                        _original_account_user: undefined,
                    };

                    if (isLicenseKey) {
                        // It's a license key
                        result.license_key = sw._license_identifier;
                        result.account_user = null;
                        result.account_password = null;
                    } else if (licenseData) {
                        // It's an account
                        result.license_key = null;
                        result.account_user = sw._license_identifier;
                        result.account_password =
                            licenseData.account_password || null;
                    } else {
                        // No license data found (shouldn't happen, but handle gracefully)
                        result.license_key = sw._original_license_key || null;
                        result.account_user = sw._original_account_user || null;
                        result.account_password = sw.account_password || null;
                    }

                    return result;
                },
            );
        }

        // Handle removed items (parts and software)
        Object.entries(removedItems).forEach(([key, items]) => {
            if (items && items.length > 0) {
                formattedValues[key] = formattedValues[key] || [];
                items.forEach((item) => {
                    formattedValues[key].push({
                        id: item.id,
                        _delete: true,
                        removal_reason: item.reason,
                        removal_condition: item.condition,
                        removal_remarks: item.remarks,
                    });
                });
            }
        });

        console.log("Final formatted values:", formattedValues);
        onSave(formattedValues, item?.id);
        setRemovedItems({});
    };

    // Render field based on type with cascading logic for parts and software
    const renderField = (field, parentFieldName = null, rowIndex = null) => {
        const isDisabled = field.editable === false;
        const fieldName = parentFieldName
            ? `${parentFieldName}_${rowIndex}`
            : field.dataIndex;

        switch (field.type) {
            case "license_select":
                // Special handling for license/account select
                let licenseOptions = [];

                if (parentFieldName === "software") {
                    licenseOptions =
                        softwareOptions.licenses?.[fieldName] || [];
                }

                return (
                    <Select
                        placeholder={`Select ${field.label}`}
                        options={licenseOptions}
                        allowClear
                        disabled={isDisabled}
                        showSearch
                        optionFilterProp="label"
                        style={{ minWidth: 250 }}
                        onFocus={async () => {
                            if (parentFieldName === "software") {
                                const currentValues =
                                    form.getFieldValue("software")?.[
                                        rowIndex
                                    ] || {};
                                if (
                                    currentValues.software_name &&
                                    currentValues.software_type &&
                                    currentValues.version
                                ) {
                                    await loadSoftwareLicenses(
                                        currentValues.software_name,
                                        currentValues.software_type,
                                        currentValues.version,
                                        fieldName,
                                        rowIndex,
                                    );
                                }
                            }
                        }}
                        onChange={(val) => {
                            if (parentFieldName === "software") {
                                // Get the full license data from the selected option
                                const selectedOption = licenseOptions.find(
                                    (opt) => opt.value === val,
                                );
                                const licenseData =
                                    selectedOption?.license_data;

                                if (licenseData) {
                                    // Update all hidden fields with the license data
                                    form.setFieldValue(
                                        [
                                            "software",
                                            rowIndex,
                                            "_license_identifier",
                                        ],
                                        val,
                                    );

                                    form.setFieldValue(
                                        ["software", rowIndex, "account_user"],
                                        licenseData.account_user || null,
                                    );

                                    form.setFieldValue(
                                        [
                                            "software",
                                            rowIndex,
                                            "account_password",
                                        ],
                                        licenseData.account_password || null,
                                    );

                                    // Set the display value to the identifier
                                    form.setFieldValue(
                                        ["software", rowIndex, "license_key"],
                                        val,
                                    );
                                }
                            }
                        }}
                    />
                );

            case "select":
                let options = field.options || [];

                // Handle cascading selects for hardware parts
                if (parentFieldName === "parts") {
                    const currentValues =
                        form.getFieldValue("parts")?.[rowIndex] || {};

                    if (field.dataIndex === "part_type") {
                        options = partsOptions.types || [];
                    } else if (field.dataIndex === "brand") {
                        options = partsOptions.brands[fieldName] || [];
                    } else if (field.dataIndex === "model") {
                        options = partsOptions.models[fieldName] || [];
                    } else if (field.dataIndex === "specifications") {
                        options = partsOptions.specifications[fieldName] || [];
                    }
                }

                // Handle cascading selects for software
                if (parentFieldName === "software") {
                    const currentValues =
                        form.getFieldValue("software")?.[rowIndex] || {};

                    if (field.dataIndex === "software_name") {
                        options = softwareOptions.names || [];
                    } else if (field.dataIndex === "software_type") {
                        options = softwareOptions.types[fieldName] || [];
                    } else if (field.dataIndex === "version") {
                        options = softwareOptions.versions[fieldName] || [];
                    }
                }

                return (
                    <Select
                        placeholder={`Select ${field.label}`}
                        options={options}
                        allowClear
                        disabled={isDisabled}
                        showSearch
                        optionFilterProp="label"
                        style={{
                            minWidth:
                                parentFieldName === "software"
                                    ? 200
                                    : undefined,
                        }}
                        onFocus={async () => {
                            if (parentFieldName === "parts") {
                                const currentValues =
                                    form.getFieldValue("parts")?.[rowIndex] ||
                                    {};

                                if (
                                    field.dataIndex === "brand" &&
                                    currentValues.part_type
                                ) {
                                    await loadBrands(
                                        currentValues.part_type,
                                        fieldName,
                                    );
                                } else if (
                                    field.dataIndex === "model" &&
                                    currentValues.part_type &&
                                    currentValues.brand
                                ) {
                                    await loadModels(
                                        currentValues.part_type,
                                        currentValues.brand,
                                        fieldName,
                                    );
                                } else if (
                                    field.dataIndex === "specifications" &&
                                    currentValues.part_type &&
                                    currentValues.brand &&
                                    currentValues.model
                                ) {
                                    await loadSpecifications(
                                        currentValues.part_type,
                                        currentValues.brand,
                                        currentValues.model,
                                        fieldName,
                                        rowIndex,
                                    );
                                }
                            }

                            if (parentFieldName === "software") {
                                const currentValues =
                                    form.getFieldValue("software")?.[
                                        rowIndex
                                    ] || {};

                                if (
                                    field.dataIndex === "software_type" &&
                                    currentValues.software_name
                                ) {
                                    await loadSoftwareTypes(
                                        currentValues.software_name,
                                        fieldName,
                                    );
                                } else if (
                                    field.dataIndex === "version" &&
                                    currentValues.software_name &&
                                    currentValues.software_type
                                ) {
                                    await loadSoftwareVersions(
                                        currentValues.software_name,
                                        currentValues.software_type,
                                        fieldName,
                                    );
                                }
                            }
                        }}
                        onChange={(val) => {
                            if (parentFieldName === "parts") {
                                const parts = form.getFieldValue("parts") || [];
                                const currentPart = parts[rowIndex] || {};

                                if (field.dataIndex === "part_type") {
                                    parts[rowIndex] = {
                                        ...currentPart,
                                        part_type: val,
                                        brand: undefined,
                                        model: undefined,
                                        specifications: undefined,
                                    };
                                    form.setFieldsValue({ parts });
                                } else if (field.dataIndex === "brand") {
                                    parts[rowIndex] = {
                                        ...currentPart,
                                        brand: val,
                                        model: undefined,
                                        specifications: undefined,
                                    };
                                    form.setFieldsValue({ parts });
                                } else if (field.dataIndex === "model") {
                                    parts[rowIndex] = {
                                        ...currentPart,
                                        model: val,
                                        specifications: undefined,
                                    };
                                    form.setFieldsValue({ parts });
                                }
                            }

                            if (parentFieldName === "software") {
                                const software =
                                    form.getFieldValue("software") || [];
                                const currentSoftware =
                                    software[rowIndex] || {};

                                if (field.dataIndex === "software_name") {
                                    software[rowIndex] = {
                                        ...currentSoftware,
                                        software_name: val,
                                        software_type: undefined,
                                        version: undefined,
                                        license_key: undefined,
                                        account_user: undefined,
                                        account_password: undefined,
                                        _license_identifier: undefined,
                                    };
                                    form.setFieldsValue({ software });
                                } else if (
                                    field.dataIndex === "software_type"
                                ) {
                                    software[rowIndex] = {
                                        ...currentSoftware,
                                        software_type: val,
                                        version: undefined,
                                        license_key: undefined,
                                        account_user: undefined,
                                        account_password: undefined,
                                        _license_identifier: undefined,
                                    };
                                    form.setFieldsValue({ software });
                                } else if (field.dataIndex === "version") {
                                    software[rowIndex] = {
                                        ...currentSoftware,
                                        version: val,
                                        license_key: undefined,
                                        account_user: undefined,
                                        account_password: undefined,
                                        _license_identifier: undefined,
                                    };
                                    form.setFieldsValue({ software });
                                }
                            }
                        }}
                    />
                );

            case "date":
                return (
                    <DatePicker
                        format="YYYY-MM-DD"
                        style={{ width: "100%" }}
                        placeholder={`Select ${field.label}`}
                        disabled={isDisabled}
                    />
                );

            case "textarea":
                return (
                    <TextArea
                        rows={4}
                        placeholder={`Enter ${field.label}`}
                        maxLength={500}
                        showCount
                        disabled={isDisabled}
                    />
                );

            case "hidden":
                return <Input type="hidden" />;

            case "dynamicList":
                return (
                    <Form.List name={field.dataIndex}>
                        {(fields, { add, remove }) => (
                            <>
                                {fields.map((f, rowIndex) => (
                                    <div
                                        key={f.key}
                                        style={{
                                            display: "flex",
                                            gap: 8,
                                            alignItems: "start",
                                            marginBottom: 8,
                                            flexWrap: "wrap",
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                gap: 8,
                                                alignItems: "start",
                                                flex: 1,
                                                flexWrap: "wrap",
                                            }}
                                        >
                                            {field.subFields
                                                .filter(
                                                    (sub) =>
                                                        sub.type !== "hidden",
                                                )
                                                .map((sub) => (
                                                    <Form.Item
                                                        {...f}
                                                        key={sub.key}
                                                        name={[
                                                            f.name,
                                                            sub.dataIndex,
                                                        ]}
                                                        fieldKey={[
                                                            f.fieldKey,
                                                            sub.dataIndex,
                                                        ]}
                                                        rules={sub.rules || []}
                                                        style={{
                                                            flex: sub.flex || 1,
                                                        }}
                                                        label={
                                                            rowIndex === 0
                                                                ? sub.label
                                                                : ""
                                                        }
                                                    >
                                                        {renderField(
                                                            {
                                                                ...sub,
                                                                editable:
                                                                    sub.editable !==
                                                                    false,
                                                            },
                                                            field.dataIndex,
                                                            f.name,
                                                        )}
                                                    </Form.Item>
                                                ))}
                                            {field.subFields
                                                .filter(
                                                    (sub) =>
                                                        sub.type === "hidden",
                                                )
                                                .map((sub) => (
                                                    <Form.Item
                                                        {...f}
                                                        key={sub.key}
                                                        name={[
                                                            f.name,
                                                            sub.dataIndex,
                                                        ]}
                                                        fieldKey={[
                                                            f.fieldKey,
                                                            sub.dataIndex,
                                                        ]}
                                                        rules={sub.rules || []}
                                                        style={{
                                                            display: "none",
                                                        }}
                                                    >
                                                        {renderField(
                                                            {
                                                                ...sub,
                                                                editable:
                                                                    sub.editable !==
                                                                    false,
                                                            },
                                                            field.dataIndex,
                                                            f.name,
                                                        )}
                                                    </Form.Item>
                                                ))}
                                        </div>
                                        {!isDisabled && (
                                            <MinusCircleOutlined
                                                onClick={() => {
                                                    const row =
                                                        form.getFieldValue(
                                                            field.dataIndex,
                                                        )?.[f.name];
                                                    handleRemoveWithReason(
                                                        field.dataIndex,
                                                        f.name,
                                                        row,
                                                    );
                                                }}
                                                style={{
                                                    marginTop:
                                                        rowIndex === 0 ? 30 : 4,
                                                    cursor: "pointer",
                                                }}
                                            />
                                        )}
                                    </div>
                                ))}
                                {!isDisabled && (
                                    <Form.Item style={{ gridColumn: "1 / -1" }}>
                                        <Button
                                            type="dashed"
                                            onClick={() => add()}
                                            block
                                            icon={<PlusOutlined />}
                                        >
                                            Add {field.label}
                                        </Button>
                                    </Form.Item>
                                )}
                            </>
                        )}
                    </Form.List>
                );

            default:
                return (
                    <Input
                        allowClear
                        placeholder={`Enter ${field.label}`}
                        maxLength={field.maxLength || 255}
                        disabled={isDisabled}
                    />
                );
        }
    };

    // Build hardware parts fields dynamically
    const hardwarePartsFields = [
        {
            key: "parts",
            label: "Hardware Part",
            type: "dynamicList",
            dataIndex: "parts",
            subFields: [
                {
                    key: "part_type",
                    dataIndex: "part_type",
                    label: "Type",
                    type: "select",
                    flex: 1,
                },
                {
                    key: "brand",
                    dataIndex: "brand",
                    label: "Brand",
                    type: "select",
                    flex: 1,
                },
                {
                    key: "model",
                    dataIndex: "model",
                    label: "Model",
                    type: "select",
                    flex: 1,
                },
                {
                    key: "specifications",
                    dataIndex: "specifications",
                    label: "Specifications",
                    type: "select",
                    flex: 1.5,
                },
                {
                    key: "serial_number",
                    dataIndex: "serial_number",
                    label: "Serial Number",
                    type: "input",
                    flex: 1,
                },
            ],
        },
    ];

    // Build software fields dynamically
    const softwareFields = [
        {
            key: "software",
            label: "Software",
            type: "dynamicList",
            dataIndex: "software",
            subFields: [
                {
                    key: "software_name",
                    dataIndex: "software_name",
                    label: "Software Name",
                    type: "select",
                    flex: 1,
                },
                {
                    key: "software_type",
                    dataIndex: "software_type",
                    label: "Type",
                    type: "select",
                    flex: 1,
                },
                {
                    key: "version",
                    dataIndex: "version",
                    label: "Version",
                    type: "select",
                    flex: 1,
                },
                {
                    key: "license_key",
                    dataIndex: "license_key",
                    label: "License/Account",
                    type: "license_select",
                    flex: 1.5,
                },
                {
                    key: "_license_identifier",
                    dataIndex: "_license_identifier",
                    type: "hidden",
                },
                {
                    key: "account_user",
                    dataIndex: "account_user",
                    type: "hidden",
                },
                {
                    key: "account_password",
                    dataIndex: "account_password",
                    type: "hidden",
                },
            ],
        },
    ];

    // Update fieldGroups with cascading parts and software fields
    const updatedFieldGroups =
        fieldGroups?.map((group) => {
            if (group.title === "Hardware Parts") {
                return { ...group, fields: hardwarePartsFields };
            }
            if (group.title === "Installed Software") {
                return { ...group, fields: softwareFields };
            }
            return group;
        }) || [];

    // Tabs configuration
    const tabItems = [
        {
            key: "hardware",
            label: "Hardware",
            children: (
                <div style={{ marginBottom: 24 }}>
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(3, 1fr)",
                            gap: 16,
                        }}
                    >
                        {updatedFieldGroups
                            .find((g) => g.title === "Hardware Specifications")
                            ?.fields.map((field) => (
                                <Form.Item
                                    key={field.key}
                                    name={field.dataIndex}
                                    label={field.label}
                                    rules={field.rules || []}
                                >
                                    {renderField(field)}
                                </Form.Item>
                            ))}
                    </div>
                </div>
            ),
        },
        {
            key: "parts",
            label: "Parts",
            children: (
                <div style={{ marginBottom: 24 }}>
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr",
                            gap: 16,
                        }}
                    >
                        {updatedFieldGroups
                            .find((g) => g.title === "Hardware Parts")
                            ?.fields.map((field) => (
                                <Form.Item
                                    key={field.key}
                                    name={field.dataIndex}
                                    label={field.label}
                                    rules={field.rules || []}
                                >
                                    {renderField(field)}
                                </Form.Item>
                            ))}
                    </div>
                </div>
            ),
        },
        {
            key: "software",
            label: "Software",
            children: (
                <div style={{ marginBottom: 24 }}>
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr",
                            gap: 16,
                        }}
                    >
                        {updatedFieldGroups
                            .find((g) => g.title === "Installed Software")
                            ?.fields.map((field) => (
                                <Form.Item
                                    key={field.key}
                                    name={field.dataIndex}
                                    label={field.label}
                                    rules={field.rules || []}
                                >
                                    {renderField(field)}
                                </Form.Item>
                            ))}
                    </div>
                </div>
            ),
        },
    ];

    return (
        <>
            <Drawer
                title={
                    item
                        ? `Edit: ${item.hostname || "Hardware"}`
                        : "Create New Hardware"
                }
                size={1100}
                onClose={onClose}
                open={open}
                styles={{ body: { paddingBottom: 80 } }}
                footer={
                    <div style={{ textAlign: "right" }}>
                        <Button onClick={onClose} style={{ marginRight: 8 }}>
                            Cancel
                        </Button>
                        <Button type="primary" onClick={() => form.submit()}>
                            {item ? "Update" : "Create"}
                        </Button>
                    </div>
                }
            >
                {loading ? (
                    <div style={{ textAlign: "center", padding: "50px 0" }}>
                        <Spin size="large" />
                    </div>
                ) : (
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleFinish}
                        autoComplete="off"
                    >
                        <Tabs defaultActiveKey="hardware" items={tabItems} />
                    </Form>
                )}
            </Drawer>

            <RemovalReasonModal
                visible={removalModalVisible}
                onConfirm={confirmRemoval}
                onCancel={cancelRemoval}
                form={removalForm}
                itemType={pendingRemoval?.fieldDataIndex}
            />
        </>
    );
};

export default HardwareFormDrawer;
