import React from "react";
import { Modal, Form, Radio, Select, Input } from "antd";

const { TextArea } = Input;

const RemovalReasonModal = ({
    visible,
    onConfirm,
    onCancel,
    form,
    itemType = "item", // "part" or "software"
}) => {
    return (
        <Modal
            title={`Reason for Removing ${itemType === "parts" ? "Part" : "Software"}`}
            open={visible}
            onOk={onConfirm}
            onCancel={onCancel}
            okText="Confirm Removal"
            cancelText="Cancel"
            width={500}
        >
            <Form form={form} layout="vertical">
                <Form.Item
                    name="reason"
                    label="Reason for Removal"
                    rules={[
                        { required: true, message: "Please select a reason" },
                    ]}
                >
                    <Radio.Group style={{ width: "100%" }}>
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr", // 2 columns
                                gap: "8px 16px", // row gap 8px, column gap 16px
                            }}
                        >
                            <Radio value="defective">Defective</Radio>
                            <Radio value="replacement">Replacement</Radio>
                            <Radio value="upgrade">Upgrade</Radio>
                            <Radio value="transfer">
                                Transfer to another unit
                            </Radio>
                            <Radio value="obsolete">Obsolete/End of Life</Radio>
                            <Radio value="other">Other</Radio>
                        </div>
                    </Radio.Group>
                </Form.Item>

                <Form.Item
                    name="condition"
                    label="Current Condition"
                    rules={[
                        {
                            required: true,
                            message: "Please select the condition",
                        },
                    ]}
                >
                    <Select
                        placeholder="Select condition"
                        options={[
                            { label: "Working", value: "working" },
                            { label: "Not Working", value: "not_working" },
                            {
                                label: "Partially Working",
                                value: "partially_working",
                            },
                            { label: "Unknown", value: "unknown" },
                        ]}
                    />
                </Form.Item>

                <Form.Item name="remarks" label="Additional Remarks (Optional)">
                    <TextArea
                        rows={4}
                        placeholder="Add any additional notes about the removal (e.g., specific issues, destination if transferring, etc.)"
                        maxLength={500}
                        showCount
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default RemovalReasonModal;
