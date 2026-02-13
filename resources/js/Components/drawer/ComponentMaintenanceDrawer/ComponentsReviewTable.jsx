import React from "react";
import { Table, Input, InputNumber, Select, Button, Tag } from "antd";
import { DeleteOutlined } from "@ant-design/icons";

const { TextArea } = Input;

const ComponentsReviewTable = ({
    components,
    componentType = "add", // "add" or "replace"
    onQuantityChange,
    onSerialChange,
    onReasonChange,
    onRemarksChange,
    onConditionChange,
    onRemove,
}) => {
    const isReplaceMode = componentType === "replace";

    // Render component info for part/software
    const renderComponentDetails = (data, type) => {
        if (!data) return null;

        if (type === "part") {
            return (
                <div>
                    <strong>
                        {data?.brand || data?.part_info?.brand}{" "}
                        {data?.model || data?.part_info?.model}
                    </strong>
                    <div style={{ fontSize: 12, color: "#666" }}>
                        {data?.part_type || data?.part_info?.part_type} •{" "}
                        {data?.specifications ||
                            data?.part_info?.specifications}
                    </div>
                    {data?.condition && (
                        <div style={{ fontSize: 11, color: "#999" }}>
                            Condition: {data.condition}
                        </div>
                    )}
                </div>
            );
        } else {
            return (
                <div>
                    <strong>
                        {data?.software_name || data?.inventory?.software_name}
                    </strong>
                    <div style={{ fontSize: 12, color: "#666" }}>
                        {data?.software_type || data?.inventory?.software_type}{" "}
                        • v{data?.version || data?.inventory?.version}
                    </div>
                    {data?.identifier && (
                        <div style={{ fontSize: 11, color: "#999" }}>
                            {data?.identifier_type || "ID"}: {data.identifier}
                        </div>
                    )}
                </div>
            );
        }
    };

    const columns = [
        {
            title: "#",
            width: 50,
            fixed: "left",
            render: (_, __, index) => index + 1,
        },

        // Old Component (replace mode)
        ...(isReplaceMode
            ? [
                  {
                      title: "Old Component",
                      width: 250,
                      render: (_, record) =>
                          renderComponentDetails(
                              record.old_component_data,
                              record.component_type,
                          ),
                  },
                  {
                      title: "Condition",
                      width: 180,
                      render: (_, record, index) => (
                          <Select
                              placeholder="Select condition"
                              value={
                                  record.old_component_condition || undefined
                              }
                              onChange={(value) =>
                                  onConditionChange?.(index, value)
                              }
                              style={{ width: "100%" }}
                              status={
                                  !record.old_component_condition ? "error" : ""
                              }
                          >
                              <Select.Option value="working">
                                  Working - Return to Inventory
                              </Select.Option>
                              <Select.Option value="faulty">
                                  Faulty - For Repair
                              </Select.Option>
                              <Select.Option value="defective">
                                  Defective - Dispose
                              </Select.Option>
                              <Select.Option value="damaged">
                                  Damaged - Dispose
                              </Select.Option>
                          </Select>
                      ),
                  },
                  {
                      title: "Reason",
                      width: 200,
                      render: (_, record, index) => (
                          <TextArea
                              placeholder="Reason for replacement"
                              value={record.reason || ""}
                              onChange={(e) =>
                                  onReasonChange?.(index, e.target.value)
                              }
                              rows={1}
                              maxLength={255}
                              showCount
                              status={!record.reason ? "error" : ""}
                          />
                      ),
                  },
              ]
            : []),

        // New Component (or Component for add mode)
        {
            title: isReplaceMode ? "New Component" : "Component",
            width: 300,
            render: (_, record) =>
                renderComponentDetails(
                    record.component_data,
                    record.component_type,
                ),
        },

        // Quantity (parts only)
        {
            title: "Quantity",
            width: 120,
            render: (_, record, index) => {
                if (record.component_type !== "part") return null;
                const maxQty = record.component_data?.quantity || 999;
                return (
                    <InputNumber
                        min={1}
                        max={maxQty}
                        value={record.quantity}
                        onChange={(value) => onQuantityChange?.(index, value)}
                        style={{ width: "100%" }}
                    />
                );
            },
        },

        // Serial Number (parts only, required)
        {
            title: "Serial Number",
            width: 150,
            render: (_, record, index) => {
                if (record.component_type !== "part") return null; // hide for software
                return (
                <Input
    allowClear
    placeholder="Enter serial number"
    value={
        componentType === "replace"
            ? record.replacement_serial_number || ""
            : record.new_serial_number || ""
    }
    onChange={(e) => onSerialChange?.(index, e.target.value)}
    maxLength={100}
    status={
        componentType === "replace"
            ? !record.replacement_serial_number
                ? "error"
                : ""
            : !record.new_serial_number
            ? "error"
            : ""
    }
    required
/>

                );
            },
        },

        // Remarks (optional)
        {
            title: "Remarks",
            width: 200,
            render: (_, record, index) => (
                <TextArea
                    placeholder={
                        isReplaceMode
                            ? "Additional notes (optional)"
                            : "Reason for addition (optional)"
                    }
                    value={record.remarks || ""}
                    onChange={(e) => onRemarksChange?.(index, e.target.value)}
                    rows={1}
                    maxLength={500}
                    showCount
                />
            ),
        },

        // Action
        {
            title: "Action",
            width: 80,
            fixed: "right",
            render: (_, __, index) => (
                <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => onRemove?.(index)}
                />
            ),
        },
    ];

    return (
        <Table
            columns={columns}
            dataSource={components}
            pagination={false}
            rowKey={(record, index) => record.key || index}
            scroll={{ x: 1600 }}
            size="small"
            bordered
        />
    );
};

export default ComponentsReviewTable;
