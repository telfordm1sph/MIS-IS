import React from "react";
import { Drawer, Typography, Descriptions, Empty, Spin, Tabs, Tag } from "antd";

const { Title } = Typography;

const DetailsDrawer = ({ visible, fieldGroups = [], loading, onClose }) => {
    const renderFields = (fields) => {
        return Object.keys(fields).map((key) => {
            const value = fields[key];

            if (
                value &&
                typeof value === "object" &&
                "value" in value &&
                "color" in value
            ) {
                return (
                    <Descriptions.Item key={key} label={key}>
                        <Tag color={value.color}>{value.value}</Tag>
                    </Descriptions.Item>
                );
            }

            return (
                <Descriptions.Item key={key} label={key}>
                    {value || "-"}
                </Descriptions.Item>
            );
        });
    };

    const renderSubGroups = (subGroups, emptyMessage) => {
        if (!subGroups?.length) return <Empty description={emptyMessage} />;

        return subGroups.map((sub, k) => (
            <div
                key={k}
                style={{
                    marginBottom: 12,
                    padding: 8,
                    border: "1px solid #f0f0f0",
                    borderRadius: 4,
                }}
            >
                <Title level={5} style={{ marginBottom: 8 }}>
                    {sub.title}
                </Title>

                {!sub.fields?.length && !sub.subGroups?.length ? (
                    <Empty description={`No ${sub.title} Data`} />
                ) : (
                    <>
                        {sub.fields?.length && sub.fields[0].label ? (
                            // This is software style: array of { label, value }
                            <Descriptions
                                layout="vertical"
                                size="small"
                                column={sub.column || 2}
                                bordered={false}
                            >
                                {sub.fields.map((field, idx) => (
                                    <Descriptions.Item
                                        key={idx}
                                        label={field.label}
                                    >
                                        {field.value || "-"}
                                    </Descriptions.Item>
                                ))}
                            </Descriptions>
                        ) : (
                            // This is parts style: array of objects with multiple keys
                            sub.fields?.map((fieldObj, idx) => (
                                <Descriptions
                                    key={idx}
                                    layout="vertical"
                                    size="small"
                                    column={sub.column || 2}
                                    bordered={false}
                                    style={{
                                        marginBottom: 12,
                                        padding: 8,
                                        border: "1px solid #f5f5f5",
                                        borderRadius: 4,
                                    }}
                                >
                                    {Object.entries(fieldObj).map(([k, v]) => (
                                        <Descriptions.Item key={k} label={k}>
                                            {v || "-"}
                                        </Descriptions.Item>
                                    ))}
                                </Descriptions>
                            ))
                        )}

                        {sub.subGroups?.length &&
                            renderSubGroups(
                                sub.subGroups,
                                `No ${sub.title} Data`,
                            )}
                    </>
                )}
            </div>
        ));
    };

    const tabsItems = [
        {
            key: "hardware",
            label: "Hardware",
            children: (() => {
                const hardware = fieldGroups.find(
                    (g) => g.title === "Hardware Specifications",
                );
                return hardware?.fields?.length ? (
                    <Descriptions
                        layout="vertical"
                        size="small"
                        column={hardware.column || 2}
                        bordered={false}
                    >
                        {hardware.fields.map((field, i) => {
                            const value = field.value;
                            if (
                                value &&
                                typeof value === "object" &&
                                "value" in value &&
                                "color" in value
                            ) {
                                return (
                                    <Descriptions.Item
                                        key={i}
                                        label={field.label}
                                    >
                                        <Tag color={value.color}>
                                            {value.value}
                                        </Tag>
                                    </Descriptions.Item>
                                );
                            }
                            return (
                                <Descriptions.Item key={i} label={field.label}>
                                    {value || "-"}
                                </Descriptions.Item>
                            );
                        })}
                    </Descriptions>
                ) : (
                    <Empty description="No Hardware Data" />
                );
            })(),
        },
        {
            key: "parts",
            label: "Parts",
            children: renderSubGroups(
                fieldGroups.find((g) => g.title === "Parts")?.subGroups,
                "No Parts Data",
            ),
        },
        {
            key: "software",
            label: "Software",
            children: renderSubGroups(
                fieldGroups.find((g) => g.title === "Software")?.subGroups,
                "No Software Data",
            ),
        },
    ];

    return (
        <Drawer
            title="Hardware Details"
            placement="right"
            size={950}
            open={visible}
            onClose={onClose}
        >
            {loading ? (
                <Spin />
            ) : (
                <Tabs defaultActiveKey="hardware" items={tabsItems} />
            )}
        </Drawer>
    );
};

export default DetailsDrawer;
