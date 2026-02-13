import React from "react";
import { Table, Input, InputNumber, Button, Tag } from "antd";
import { DeleteOutlined } from "@ant-design/icons";

const { TextArea } = Input;

const ComponentsReviewTable = ({
    components,
    componentType = "add", // 'add' or 'replace'
    onQuantityChange,
    onSerialChange,
    onReasonChange,
    onRemove,
}) => {
    const isReplaceMode = componentType === "replace";

    const columns = [
        {
            title: "Type",
            dataIndex: "component_type",
            width: 100,
            fixed: "left",
            render: (type) =>
                type === "part" ? (
                    <Tag color="blue">PART</Tag>
                ) : (
                    <Tag color="green">SOFTWARE</Tag>
                ),
        },
        {
            title: isReplaceMode ? "Old Component" : "Details",
            width: isReplaceMode ? 250 : 300,
            render: (_, record) => {
                if (isReplaceMode) {
                    // For replace mode - show old component
                    const data = record.old_component_data;
                    if (!data) return null;

                    if (record.old_component_type === "part") {
                        return (
                            <div>
                                <div>
                                    <strong>{data?.part_info.brand}</strong>{" "}
                                    {data?.part_infomodel}
                                </div>
                                <div style={{ fontSize: 12, color: "#888" }}>
                                    {data?.part_info.part_type} •{" "}
                                    {data?.part_info.specifications}
                                </div>
                                <div style={{ fontSize: 11, color: "#aaa" }}>
                                    Condition: {data?.inventory.condition}
                                </div>
                            </div>
                        );
                    } else {
                        return (
                            <div>
                                <div>
                                    <strong>
                                        {data?.inventory.software_name}
                                    </strong>
                                </div>
                                <div style={{ fontSize: 12, color: "#888" }}>
                                    {data?.inventory.software_type} • v
                                    {data?.inventory.version}
                                </div>
                            </div>
                        );
                    }
                } else {
                    // For add mode - show component details
                    const data = record.component_data;
                    return record.component_type === "part" ? (
                        <div>
                            <div>
                                <strong>{data?.brand}</strong> {data?.model}
                            </div>
                            <div style={{ fontSize: 12, color: "#888" }}>
                                {data?.part_type} • {data?.specifications}
                            </div>
                            <div style={{ fontSize: 11, color: "#aaa" }}>
                                Condition: {data?.condition} • Location:{" "}
                                {data?.location}
                            </div>
                        </div>
                    ) : (
                        <div>
                            <div>
                                <strong>{data?.software_name}</strong>
                            </div>
                            <div style={{ fontSize: 12, color: "#888" }}>
                                {data?.software_type} • v{data?.version}
                            </div>
                            <div style={{ fontSize: 11, color: "#aaa" }}>
                                {data?.identifier_type}: {data?.identifier}
                            </div>
                        </div>
                    );
                }
            },
        },
        ...(isReplaceMode
            ? [
                  {
                      title: "New Component",
                      width: 300,
                      render: (_, record) => {
                          const data = record.component_data;
                          if (!data) return null;

                          if (record.component_type === "part") {
                              return (
                                  <div>
                                      <div>
                                          <strong>{data?.brand}</strong>{" "}
                                          {data?.model}
                                      </div>
                                      <div
                                          style={{
                                              fontSize: 12,
                                              color: "#888",
                                          }}
                                      >
                                          {data?.part_type} •{" "}
                                          {data?.specifications}
                                      </div>
                                      <div
                                          style={{
                                              fontSize: 11,
                                              color: "#aaa",
                                          }}
                                      >
                                          Condition: {data?.condition} •
                                          Location: {data?.location}
                                      </div>
                                  </div>
                              );
                          } else {
                              return (
                                  <div>
                                      <div>
                                          <strong>{data?.software_name}</strong>
                                      </div>
                                      <div
                                          style={{
                                              fontSize: 12,
                                              color: "#888",
                                          }}
                                      >
                                          {data?.software_type} • v
                                          {data?.version}
                                      </div>
                                      <div
                                          style={{
                                              fontSize: 11,
                                              color: "#aaa",
                                          }}
                                      >
                                          {data?.identifier_type}:{" "}
                                          {data?.identifier}
                                      </div>
                                  </div>
                              );
                          }
                      },
                  },
              ]
            : []),
        {
            title: "Quantity",
            width: 120,
            render: (_, record, index) =>
                record.component_type === "part" ? (
                    <InputNumber
                        min={1}
                        max={record.component_data?.quantity || 999}
                        value={record.quantity}
                        onChange={(value) => onQuantityChange(index, value)}
                        style={{ width: "100%" }}
                    />
                ) : null,
        },
        {
            title: "Serial Number",
            width: 150,
            render: (_, record, index) =>
                record.component_type === "part" ? (
                    <Input
                        placeholder="Enter serial number"
                        value={record.serial_number}
                        onChange={(e) => onSerialChange(index, e.target.value)}
                        allowClear
                    />
                ) : null,
        },
        {
            title: "Reason",
            width: 300,
            render: (_, record, index) => (
                <TextArea
                    rows={1}
                    placeholder={
                        isReplaceMode
                            ? "Reason for replacement"
                            : "Reason for addition"
                    }
                    maxLength={300}
                    value={record.reason}
                    onChange={(e) => onReasonChange(index, e.target.value)}
                    allowClear
                />
            ),
        },
        {
            title: "Action",
            width: 80,
            fixed: "right",
            render: (_, __, index) => (
                <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => onRemove(index)}
                />
            ),
        },
    ];

    return (
        <Table
            dataSource={components}
            rowKey="key"
            pagination={false}
            size="small"
            scroll={{ x: isReplaceMode ? 1400 : 1200 }}
            columns={columns}
        />
    );
};

export default ComponentsReviewTable;
