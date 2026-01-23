import React, { useEffect, useState } from "react";
import {
    Drawer,
    Form,
    Input,
    Select,
    Button,
    DatePicker,
    Divider,
    Tabs,
    Spin,
} from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { TextArea } = Input;

const HardwareFormDrawer = ({ open, onClose, item, onSave, fieldGroups }) => {
    const [removedItems, setRemovedItems] = useState({});
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();
    console.log("Field", fieldGroups);

    // Convert date strings to dayjs objects recursively
    const convertDatesToDayjs = (obj) => {
        if (!obj) return obj;

        if (Array.isArray(obj)) {
            return obj.map((item) => convertDatesToDayjs(item));
        }

        if (typeof obj === "object") {
            const converted = {};
            for (const [key, value] of Object.entries(obj)) {
                if ((key.includes("date") || key.includes("Date")) && value) {
                    converted[key] = dayjs(value);
                } else if (typeof value === "object") {
                    converted[key] = convertDatesToDayjs(value);
                } else {
                    converted[key] = value;
                }
            }
            return converted;
        }

        return obj;
    };

    useEffect(() => {
        if (!open) return;
        if (item) {
            setLoading(true);
            // Convert all date fields to dayjs objects
            const formattedItem = convertDatesToDayjs({
                ...item,
                date_issued: item.date_issued ? dayjs(item.date_issued) : null,
                remarks: "",
            });
            form.setFieldsValue(formattedItem);
            setLoading(false);
        } else {
            form.resetFields();
        }
    }, [item, form, open]);

    const handleFinish = (values) => {
        const convertDayjsToStrings = (obj) => {
            if (!obj) return obj;
            if (Array.isArray(obj))
                return obj.map((item) => convertDayjsToStrings(item));
            if (dayjs.isDayjs(obj)) return obj.format("YYYY-MM-DD");
            if (typeof obj === "object") {
                const converted = {};
                for (const [key, value] of Object.entries(obj)) {
                    converted[key] = convertDayjsToStrings(value);
                }
                return converted;
            }
            return obj;
        };

        const formattedValues = convertDayjsToStrings(values);

        Object.entries(removedItems).forEach(([key, ids]) => {
            formattedValues[key] = formattedValues[key] || [];
            ids.forEach((id) => {
                formattedValues[key].push({ id, _delete: true });
            });
        });

        onSave(formattedValues, item?.id);
        setRemovedItems([]);
    };

    const renderField = (field) => {
        const isDisabled = field.editable === false;

        switch (field.type) {
            case "select":
                return (
                    <Select
                        placeholder={`Select ${field.label}`}
                        options={field.options}
                        allowClear
                        disabled={isDisabled}
                        showSearch
                        optionFilterProp="label"
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
                                        {field.subFields.map((sub) => (
                                            <Form.Item
                                                {...f}
                                                key={sub.key}
                                                name={[f.name, sub.dataIndex]}
                                                fieldKey={[
                                                    f.fieldKey,
                                                    sub.dataIndex,
                                                ]}
                                                rules={sub.rules || []}
                                                style={{ flex: sub.flex || 1 }}
                                                label={
                                                    rowIndex === 0
                                                        ? sub.label
                                                        : ""
                                                }
                                            >
                                                {renderField({
                                                    ...sub,
                                                    editable:
                                                        sub.editable !== false,
                                                })}
                                            </Form.Item>
                                        ))}
                                        {!isDisabled && (
                                            <MinusCircleOutlined
                                                onClick={() => {
                                                    const row =
                                                        form.getFieldValue(
                                                            field.dataIndex,
                                                        )?.[f.name];

                                                    if (row?.id) {
                                                        setRemovedItems(
                                                            (prev) => ({
                                                                ...prev,
                                                                [field.dataIndex]:
                                                                    [
                                                                        ...(prev[
                                                                            field
                                                                                .dataIndex
                                                                        ] ||
                                                                            []),
                                                                        row.id,
                                                                    ],
                                                            }),
                                                        );
                                                    }

                                                    remove(f.name);
                                                }}
                                                style={{
                                                    marginTop:
                                                        rowIndex === 0 ? 30 : 4,
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

    // Group fieldGroups into tabs
    const tabItems = [
        {
            key: "assignment",
            label: "Assignment",
            children: (
                <div style={{ marginBottom: 24 }}>
                    <h3 className="font-bold text-xl mb-3 text-gray-900 dark:text-blue-400">
                        Assignment Details
                    </h3>
                    <Divider style={{ margin: "12px 0 16px" }} />
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(2, 1fr)",
                            gap: 16,
                        }}
                    >
                        {fieldGroups
                            .find((g) => g.title === "Assignment Details")
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
            key: "hardware",
            label: "Hardware",
            children: (
                <div style={{ marginBottom: 24 }}>
                    <h3 className="font-bold text-xl mb-3 text-gray-900 dark:text-blue-400">
                        Hardware Specifications
                    </h3>
                    <Divider style={{ margin: "12px 0 16px" }} />
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(2, 1fr)",
                            gap: 16,
                        }}
                    >
                        {fieldGroups
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
                    <h3 className="font-bold text-xl mb-3 text-gray-900 dark:text-blue-400">
                        Hardware Parts
                    </h3>
                    <Divider style={{ margin: "12px 0 16px" }} />
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr",
                            gap: 16,
                        }}
                    >
                        {fieldGroups
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
                    <h3 className="font-bold text-xl mb-3 text-gray-900 dark:text-blue-400">
                        Installed Software
                    </h3>
                    <Divider style={{ margin: "12px 0 16px" }} />
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr",
                            gap: 16,
                        }}
                    >
                        {fieldGroups
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
        {
            key: "notes",
            label: "Notes",
            children: (
                <div style={{ marginBottom: 24 }}>
                    <h3 className="font-bold text-xl mb-3 text-gray-900 dark:text-blue-400">
                        Additional Information
                    </h3>
                    <Divider style={{ margin: "12px 0 16px" }} />
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr",
                            gap: 16,
                        }}
                    >
                        {fieldGroups
                            .find((g) => g.title === "Additional Information")
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
        <Drawer
            title={
                item
                    ? `Edit: ${item.hostname || "Hardware"}`
                    : "Create New Hardware"
            }
            size={900}
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
                    <Tabs defaultActiveKey="assignment" items={tabItems} />
                </Form>
            )}
        </Drawer>
    );
};

export default HardwareFormDrawer;
