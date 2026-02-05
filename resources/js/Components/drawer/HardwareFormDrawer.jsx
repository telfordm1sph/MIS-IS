import React, { useEffect, useState } from "react";
import {
    Drawer,
    Form,
    Input,
    Select,
    Button,
    Tabs,
    Spin,
    Row,
    Col,
} from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

import RemovalReasonModal from "../modal/RemovalReasonModal";
import { useHardwareParts } from "@/Hooks/useHardwareParts";
import { useHardwareSoftware } from "@/Hooks/useHardwareSoftware";
import { useRemovalModal } from "@/Hooks/useRemovalModal";
import {
    convertDatesToDayjs,
    convertDayjsToStrings,
} from "../utils/dateHelper";
import CascadingPartFields from "@/Components/forms/CascadingPartFields";
import CascadingSoftwareFields from "@/Components/forms/CascadingSoftwareFields";

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

    const partsHooks = useHardwareParts(form);
    const softwareHooks = useHardwareSoftware(form);

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

            // Handle software data
            if (
                formattedItem.software &&
                Array.isArray(formattedItem.software)
            ) {
                formattedItem.software = formattedItem.software.map((sw) => {
                    const displayValue =
                        sw.license_key !== null && sw.license_key !== undefined
                            ? sw.license_key
                            : sw.account_user;

                    return {
                        ...sw,
                        _license_identifier: displayValue,
                        license_key: displayValue,
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

        // Handle software data
        if (
            formattedValues.software &&
            Array.isArray(formattedValues.software)
        ) {
            formattedValues.software = formattedValues.software.map(
                (sw, index) => {
                    const fieldName = `software_${index}`;
                    const licenseOptions =
                        softwareOptions.licenses?.[fieldName] || [];
                    const selectedOption = licenseOptions.find(
                        (opt) => opt.value === sw._license_identifier,
                    );

                    const licenseData = selectedOption?.license_data;
                    const isLicenseKey =
                        licenseData &&
                        licenseData.license_key !== null &&
                        licenseData.license_key !== undefined &&
                        licenseData.license_key !== "";

                    const result = {
                        ...sw,
                        _license_identifier: undefined,
                        _original_license_key: undefined,
                        _original_account_user: undefined,
                    };

                    if (isLicenseKey) {
                        result.license_key = sw._license_identifier;
                        result.account_user = null;
                        result.account_password = null;
                    } else if (licenseData) {
                        result.license_key = null;
                        result.account_user = sw._license_identifier;
                        result.account_password =
                            licenseData.account_password || null;
                    } else {
                        result.license_key = sw._original_license_key || null;
                        result.account_user = sw._original_account_user || null;
                        result.account_password = sw.account_password || null;
                    }

                    return result;
                },
            );
        }

        // Handle parts data
        if (formattedValues.parts && Array.isArray(formattedValues.parts)) {
            formattedValues.parts = formattedValues.parts.map((part) => {
                if (
                    part.specifications &&
                    typeof part.specifications === "string"
                ) {
                    try {
                        const parsed = JSON.parse(part.specifications);
                        return {
                            ...part,
                            specifications:
                                parsed.specifications || part.specifications,
                            condition: parsed.condition || "Used",
                        };
                    } catch (error) {
                        return {
                            ...part,
                            condition: "Used",
                        };
                    }
                }
                return {
                    ...part,
                    condition: part.condition || "Used",
                };
            });
        }

        // Handle removed items
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

        onSave(formattedValues, item?.id);
        setRemovedItems({});
    };

    const tabItems = [
        {
            key: "hardware",
            label: "Hardware",
            children: (
                <Row gutter={16}>
                    {fieldGroups
                        ?.find((g) => g.title === "Hardware Specifications")
                        ?.fields.map((field) =>
                            field.type === "hidden" ? (
                                <Form.Item
                                    key={field.key}
                                    name={field.dataIndex}
                                    style={{ display: "none" }}
                                >
                                    <Input type="hidden" />
                                </Form.Item>
                            ) : (
                                <Col xs={24} sm={12} md={8} key={field.key}>
                                    <Form.Item
                                        name={field.dataIndex}
                                        label={field.label}
                                        rules={field.rules || []}
                                    >
                                        {field.type === "select" ? (
                                            <Select
                                                options={field.options}
                                                placeholder={`Select ${field.label}`}
                                            />
                                        ) : (
                                            <Input
                                                placeholder={`Enter ${field.label}`}
                                            />
                                        )}
                                    </Form.Item>
                                </Col>
                            ),
                        )}
                </Row>
            ),
        },
        {
            key: "parts",
            label: "Parts",
            children: (
                <Form.List name="parts">
                    {(fields, { add, remove }) => (
                        <>
                            {fields.map(({ key, name }, index) => (
                                <Row
                                    key={key}
                                    gutter={12}
                                    align="middle"
                                    style={{ marginBottom: 8 }}
                                >
                                    <Form.Item name={[name, "id"]} hidden>
                                        <Input type="hidden" />
                                    </Form.Item>
                                    <Form.Item
                                        name={[name, "condition"]}
                                        hidden
                                    >
                                        <Input type="hidden" />
                                    </Form.Item>

                                    {/* Part Type */}
                                    <Col xs={24} sm={12} md={4}>
                                        <Form.Item
                                            name={[name, "part_type"]}
                                            label={
                                                index === 0 ? "Part Type" : ""
                                            }
                                            style={{ marginBottom: 0 }}
                                            rules={[
                                                {
                                                    required: true,
                                                    message:
                                                        "Please select part type",
                                                },
                                            ]}
                                        >
                                            <Select
                                                placeholder="Select Part Type"
                                                options={
                                                    partsOptions.types || []
                                                }
                                                allowClear
                                                showSearch
                                                optionFilterProp="label"
                                                onChange={(val) => {
                                                    const parts =
                                                        form.getFieldValue(
                                                            "parts",
                                                        ) || [];
                                                    parts[name] = {
                                                        ...parts[name],
                                                        part_type: val,
                                                        brand: undefined,
                                                        model: undefined,
                                                        specifications:
                                                            undefined,
                                                        condition: undefined,
                                                    };
                                                    form.setFieldsValue({
                                                        parts,
                                                    });
                                                }}
                                            />
                                        </Form.Item>
                                    </Col>

                                    {/* Brand */}
                                    <Col xs={24} sm={12} md={4}>
                                        <CascadingPartFields
                                            fieldPrefix={`parts_${name}`}
                                            form={form}
                                            partsHooks={partsHooks} // ✅ ADD THIS
                                            layout="inline"
                                            showLabels={index === 0}
                                        />
                                    </Col>

                                    {/* Serial Number */}
                                    <Col xs={24} sm={12} md={4}>
                                        <Form.Item
                                            name={[name, "serial_number"]}
                                            label={index === 0 ? "Serial" : ""}
                                            style={{ marginBottom: 0 }}
                                            rules={[
                                                {
                                                    required: true,
                                                    message:
                                                        "Please enter serial number",
                                                },
                                            ]}
                                        >
                                            <Input
                                                allowClear
                                                placeholder="Enter serial number"
                                            />
                                        </Form.Item>
                                    </Col>

                                    {/* Remove Button */}
                                    <Col
                                        xs={24}
                                        sm={24}
                                        md={4}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            marginTop: index === 0 ? 24 : 0,
                                        }}
                                    >
                                        <MinusCircleOutlined
                                            style={{
                                                fontSize: 20,
                                                color: "#ff4d4f",
                                                cursor: "pointer",
                                            }}
                                            onClick={() => {
                                                const row =
                                                    form.getFieldValue(
                                                        "parts",
                                                    )?.[name];
                                                handleRemoveWithReason(
                                                    "parts",
                                                    name,
                                                    row,
                                                );
                                            }}
                                        />
                                    </Col>
                                </Row>
                            ))}

                            <Button
                                type="dashed"
                                block
                                icon={<PlusOutlined />}
                                onClick={() =>
                                    add({
                                        part_type: "",
                                        brand: "",
                                        model: "",
                                        specifications: "",
                                        condition: "",
                                        serial_number: "",
                                    })
                                }
                                style={{ marginTop: 16 }}
                            >
                                Add Part
                            </Button>
                        </>
                    )}
                </Form.List>
            ),
        },
        {
            key: "software",
            label: "Software",
            children: (
                <Form.List name="software">
                    {(fields, { add, remove }) => (
                        <>
                            {fields.map(({ key, name }, index) => (
                                <Row
                                    key={key}
                                    gutter={12}
                                    align="middle"
                                    style={{ marginBottom: 8 }}
                                >
                                    <Form.Item name={[name, "id"]} hidden>
                                        <Input type="hidden" />
                                    </Form.Item>

                                    <CascadingSoftwareFields
                                        fieldPrefix={`software_${name}`}
                                        form={form}
                                        softwareHooks={softwareHooks}
                                        layout="inline"
                                        showLabels={index === 0}
                                    />

                                    {/* Hidden fields for license data */}
                                    <Form.Item
                                        name={[name, "_license_identifier"]}
                                        hidden
                                    >
                                        <Input type="hidden" />
                                    </Form.Item>
                                    <Form.Item
                                        name={[name, "account_user"]}
                                        hidden
                                    >
                                        <Input type="hidden" />
                                    </Form.Item>
                                    <Form.Item
                                        name={[name, "account_password"]}
                                        hidden
                                    >
                                        <Input type="hidden" />
                                    </Form.Item>

                                    {/* Remove Button */}
                                    <Col
                                        xs={24}
                                        sm={24}
                                        md={2}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            marginTop: index === 0 ? 24 : 0,
                                        }}
                                    >
                                        <MinusCircleOutlined
                                            style={{
                                                fontSize: 20,
                                                color: "#ff4d4f",
                                                cursor: "pointer",
                                            }}
                                            onClick={() => {
                                                const row =
                                                    form.getFieldValue(
                                                        "software",
                                                    )?.[name];
                                                handleRemoveWithReason(
                                                    "software",
                                                    name,
                                                    row,
                                                );
                                            }}
                                        />
                                    </Col>
                                </Row>
                            ))}

                            <Button
                                type="dashed"
                                block
                                icon={<PlusOutlined />}
                                onClick={() => add()}
                                style={{ marginTop: 16 }}
                            >
                                Add Software
                            </Button>
                        </>
                    )}
                </Form.List>
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
