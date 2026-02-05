import React from "react";
import { Descriptions, Tag } from "antd";

const HardwareInfo = ({ hardware }) => {
    return (
        <Descriptions
            title="Hardware Information"
            bordered
            size="small"
            column={2}
            style={{ marginBottom: 24 }}
        >
            <Descriptions.Item label="Hostname">
                {hardware?.hostname || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Brand">
                {hardware?.brand || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Model">
                {hardware?.model || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Category">
                {hardware?.category || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Issued To">
                {hardware?.issued_to_label || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
                <Tag color={hardware?.status_color}>
                    {hardware?.status_label}
                </Tag>
            </Descriptions.Item>
        </Descriptions>
    );
};

export default HardwareInfo;
