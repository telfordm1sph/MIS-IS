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
import { convertDatesToDayjs, convertDayjsToStrings } from "@/Utils/dateHelper";
import CascadingPartFields from "@/Components/forms/CascadingPartFields";
import CascadingSoftwareFields from "@/Components/forms/CascadingSoftwareFields";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * The parts API returns:
 *   { id, serial_number, status, part_info: { part_type, brand, model, specifications }, ... }
 *
 * The form / CascadingPartFields needs a flat shape:
 *   { id, serial_number, part_type, brand, model, specifications, condition }
 */
const flattenPart = (p) => ({
    id: p.id,
    serial_number: p.serial_number ?? "",
    condition: p.condition ?? p.status ?? "Used",
    part_type: p.part_info?.part_type ?? p.part_type ?? "",
    brand: p.part_info?.brand ?? p.brand ?? "",
    model: p.part_info?.model ?? p.model ?? "",
    specifications: p.part_info?.specifications ?? p.specifications ?? "",
});

/**
 * The software API returns:
 *   { id, installation_date, license: { license_key, account_user, account_password },
 *     inventory: { software_name, software_type, version }, ... }
 *
 * The form / CascadingSoftwareFields needs a flat shape:
 *   { id, software_name, software_type, version, license_key, account_user, account_password }
 */
const flattenSoftware = (s) => {
    const licenseKey = s.license?.license_key ?? s.license_key ?? null;
    const accountUser = s.license?.account_user ?? s.account_user ?? null;
    const accountPass =
        s.license?.account_password ?? s.account_password ?? null;

    const displayValue =
        licenseKey !== null && licenseKey !== undefined
            ? licenseKey
            : accountUser;

    return {
        id: s.id,
        installation_date: s.installation_date ?? null,
        software_name: s.inventory?.software_name ?? s.software_name ?? "",
        software_type: s.inventory?.software_type ?? s.software_type ?? "",
        version: s.inventory?.version ?? s.version ?? "",
        _license_identifier: displayValue,
        license_key: displayValue,
        _original_license_key: licenseKey,
        _original_account_user: accountUser,
        account_user: accountUser,
        account_password: accountPass,
    };
};

// ─────────────────────────────────────────────────────────────────────────────

const HardwareFormDrawer = ({ open, onClose, item, onSave, fieldGroups }) => {
    const [removedItems, setRemovedItems] = useState({});
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();

    // Flat copies used as rowData props for cascading fields
    const [partsData, setPartsData] = useState([]);
    const [softwareData, setSoftwareData] = useState([]);

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

        partsHooks.loadPartTypes();
        softwareHooks.loadSoftwareNames();

        if (item) {
            setLoading(true);

            // ✅ Flatten nested API structures into the flat shape the form expects
            const flatParts = (Array.isArray(item.parts) ? item.parts : []).map(
                flattenPart,
            );
            const flatSoftware = (
                Array.isArray(item.software) ? item.software : []
            ).map(flattenSoftware);

            console.log("[HardwareFormDrawer] flatParts:", flatParts);
            console.log("[HardwareFormDrawer] flatSoftware:", flatSoftware);

            // Store BEFORE setFieldsValue so rowData prop is ready on first render
            setPartsData(flatParts);
            setSoftwareData(flatSoftware);

            const formattedItem = convertDatesToDayjs({
                ...item,
                date_issued: item.date_issued ? dayjs(item.date_issued) : null,
                remarks: "",
                parts: flatParts,
                software: flatSoftware,
            });

            form.setFieldsValue(formattedItem);
            setLoading(false);
        } else {
            form.resetFields();
            form.setFieldsValue({ parts: [], software: [] });
            setPartsData([]);
            setSoftwareData([]);
            setRemovedItems({});
        }
    }, [open, item]);

    // ─── Submit handler ───────────────────────────────────────────────────────
    const handleFinish = (values) => {
        const formattedValues = convertDayjsToStrings(values);

        if (Array.isArray(formattedValues.software)) {
            formattedValues.software = formattedValues.software.map(
                (sw, index) => {
                    const fieldName = `software_${index}`;
                    const licenseOptions =
                        softwareHooks.softwareOptions.licenses?.[fieldName] ||
                        [];
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

        if (Array.isArray(formattedValues.parts)) {
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
                    } catch {
                        return { ...part, condition: "Used" };
                    }
                }
                return { ...part, condition: part.condition || "Used" };
            });
        }

        Object.entries(removedItems).forEach(([key, items]) => {
            if (items?.length > 0) {
                formattedValues[key] = formattedValues[key] || [];
                items.forEach((removedItem) => {
                    formattedValues[key].push({
                        id: removedItem.id,
                        _delete: true,
                        removal_reason: removedItem.reason,
                        removal_condition: removedItem.condition,
                        removal_remarks: removedItem.remarks,
                    });
                });
            }
        });

        onSave(formattedValues, item?.id);
        setRemovedItems({});
    };

    // ─── Remove handlers ──────────────────────────────────────────────────────
    const handlePartRemove = (name, listRemove) => {
        const row = (form.getFieldValue("parts") ?? [])[name] ?? {};
        if (!row.id) {
            listRemove(name);
            return;
        }
        handleRemoveWithReason("parts", name, row);
    };

    const handleSoftwareRemove = (name, listRemove) => {
        const row = (form.getFieldValue("software") ?? [])[name] ?? {};
        if (!row.id) {
            listRemove(name);
            return;
        }
        handleRemoveWithReason("software", name, row);
    };

    // ─── Tab definitions ──────────────────────────────────────────────────────
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
                                                options={field.options ?? []}
                                                showSearch
                                                optionFilterProp="label"
                                                loading={field.loading ?? false}
                                                placeholder={`Select ${field.label}`}
                                                notFoundContent={
                                                    field.loading ? (
                                                        <Spin size="small" />
                                                    ) : (
                                                        "No Data"
                                                    )
                                                }
                                            />
                                        ) : field.type === "multiSelect" ? (
                                            <Select
                                                mode="multiple"
                                                allowClear
                                                showSearch
                                                optionFilterProp="label"
                                                placeholder={`Select ${field.label}`}
                                                options={field.options ?? []}
                                                loading={field.loading ?? false}
                                            />
                                        ) : (
                                            <Input
                                                placeholder={`Enter ${field.label}`}
                                                allowClear
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

                                    <Col xs={24}>
                                        <Row gutter={12} align="middle">
                                            <CascadingPartFields
                                                fieldPrefix={`parts_${name}`}
                                                form={form}
                                                partsHooks={partsHooks}
                                                layout="inline"
                                                showLabels={index === 0}
                                                isFormList={true}
                                                rowIndex={name}
                                                rowData={
                                                    partsData[name] ?? null
                                                }
                                            />
                                            <Col
                                                xs={6}
                                                sm={6}
                                                md={1}
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    marginTop:
                                                        index === 0 ? 24 : 0,
                                                }}
                                            >
                                                <MinusCircleOutlined
                                                    style={{
                                                        fontSize: 20,
                                                        color: "#ff4d4f",
                                                        cursor: "pointer",
                                                    }}
                                                    onClick={() =>
                                                        handlePartRemove(
                                                            name,
                                                            remove,
                                                        )
                                                    }
                                                />
                                            </Col>
                                        </Row>
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

                                    <Col xs={24}>
                                        <Row gutter={12} align="middle">
                                            <CascadingSoftwareFields
                                                fieldPrefix={`software_${name}`}
                                                form={form}
                                                softwareHooks={softwareHooks}
                                                layout="inline"
                                                showLabels={index === 0}
                                                isFormList={true}
                                                rowIndex={name}
                                                rowData={
                                                    softwareData[name] ?? null
                                                }
                                            />
                                            <Col
                                                xs={6}
                                                sm={6}
                                                md={1}
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    marginTop:
                                                        index === 0 ? 24 : 0,
                                                }}
                                            >
                                                <MinusCircleOutlined
                                                    style={{
                                                        fontSize: 20,
                                                        color: "#ff4d4f",
                                                        cursor: "pointer",
                                                    }}
                                                    onClick={() =>
                                                        handleSoftwareRemove(
                                                            name,
                                                            remove,
                                                        )
                                                    }
                                                />
                                            </Col>
                                        </Row>
                                    </Col>

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
