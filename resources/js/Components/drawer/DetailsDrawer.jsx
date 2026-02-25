import React, { useMemo } from "react";
import { Drawer, Typography, Descriptions, Empty, Spin, Tabs, Tag } from "antd";

const { Title } = Typography;

const DetailsDrawer = ({ visible, fieldGroups = [], loading, onClose }) => {
    /* ------------------ Helpers ------------------ */

    const getGroup = (title) => fieldGroups.find((g) => g.title === title);

    const renderValue = (value) => {
        if (
            value &&
            typeof value === "object" &&
            "value" in value &&
            "color" in value
        ) {
            return <Tag color={value.color}>{value.value}</Tag>;
        }

        return value || "-";
    };

    const renderDescriptions = (fields = [], column = 2) => (
        <Descriptions
            layout="vertical"
            size="small"
            column={column}
            bordered={false}
        >
            {fields.map((field, idx) => (
                <Descriptions.Item key={idx} label={field.label}>
                    {renderValue(field.value)}
                </Descriptions.Item>
            ))}
        </Descriptions>
    );

    const renderObjectDescriptions = (objects = [], column = 2) =>
        objects.map((obj, idx) => (
            <Descriptions
                key={idx}
                layout="vertical"
                size="small"
                column={column}
                bordered={false}
                style={{
                    marginBottom: 12,
                    padding: 8,
                    border: "1px solid #f5f5f5",
                    borderRadius: 4,
                }}
            >
                {Object.entries(obj).map(([key, value]) => (
                    <Descriptions.Item key={key} label={key}>
                        {renderValue(value)}
                    </Descriptions.Item>
                ))}
            </Descriptions>
        ));

    const renderSubGroups = (subGroups = [], emptyMessage) => {
        if (!subGroups.length) return <Empty description={emptyMessage} />;

        return subGroups.map((sub, index) => (
            <div
                key={index}
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
                        {sub.fields?.length &&
                            (sub.fields[0]?.label
                                ? renderDescriptions(sub.fields, sub.column)
                                : renderObjectDescriptions(
                                      sub.fields,
                                      sub.column,
                                  ))}

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

    /* ------------------ Memoized Groups ------------------ */

    const hardwareGroup = useMemo(
        () => getGroup("Hardware Specifications"),
        [fieldGroups],
    );

    const partsGroup = useMemo(() => getGroup("Parts"), [fieldGroups]);

    const softwareGroup = useMemo(() => getGroup("Software"), [fieldGroups]);

    /* ------------------ Tabs ------------------ */

    const tabsItems = [
        {
            key: "hardware",
            label: "Hardware",
            children: hardwareGroup?.fields?.length ? (
                renderDescriptions(hardwareGroup.fields, hardwareGroup.column)
            ) : (
                <Empty description="No Hardware Data" />
            ),
        },
        {
            key: "parts",
            label: "Parts",
            children: renderSubGroups(partsGroup?.subGroups, "No Parts Data"),
        },
        {
            key: "software",
            label: "Software",
            children: renderSubGroups(
                softwareGroup?.subGroups,
                "No Software Data",
            ),
        },
    ];

    /* ------------------ Render ------------------ */

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
