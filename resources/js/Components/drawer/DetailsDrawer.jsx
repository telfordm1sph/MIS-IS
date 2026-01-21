import React from "react";
import { Drawer, Typography, Divider, Descriptions, Empty, Spin } from "antd";

const { Title } = Typography;

const DetailsDrawer = ({ visible, fieldGroups = [], loading, onClose }) => {
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
            ) : fieldGroups.length === 0 ? (
                <Empty description="No data available" />
            ) : (
                fieldGroups.map((group, i) => (
                    <div key={i} style={{ marginBottom: 24 }}>
                        <Title level={5}>{group.title}</Title>
                        <Divider style={{ margin: "4px 0 8px" }} />
                        <Descriptions
                            layout="vertical"
                            size="small"
                            column={group.column || 1}
                            bordered={false}
                            styles={{ label: { width: 250 } }}
                        >
                            {group.fields?.map((field, j) => (
                                <Descriptions.Item key={j} label={field.label}>
                                    {field.value || "-"}
                                </Descriptions.Item>
                            ))}
                        </Descriptions>
                    </div>
                ))
            )}
        </Drawer>
    );
};

export default DetailsDrawer;
