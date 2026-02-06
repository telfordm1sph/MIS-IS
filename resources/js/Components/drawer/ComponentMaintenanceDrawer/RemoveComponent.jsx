import React from "react";
import { Row, Col, Form, Select, Input, Alert } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";

const { TextArea } = Input;

const RemoveComponent = ({
    form,
    selectedComponent,
    selectedComponentType,
    selectedComponentData,
    componentOptions,
    onComponentSelect,
}) => {
    const CONDITION_REASON_MAP = {
        working: "Working",
        faulty: "Faulty",
        defective: "Defective",
        damaged: "Damaged",
    };

    return (
        <>
            <Alert
                title="Warning"
                description="Removing a component will return it to inventory or mark it for disposal based on its condition."
                type="warning"
                showIcon
                icon={<ExclamationCircleOutlined />}
                style={{ marginBottom: 24 }}
            />

            <Row gutter={16}>
                <Col span={24}>
                    <Form.Item
                        label="Component to Remove"
                        name="component_to_remove"
                        rules={[
                            {
                                required: true,
                                message: "Please select component to remove",
                            },
                        ]}
                    >
                        <Select
                            placeholder="Select component to remove"
                            options={componentOptions}
                            onChange={onComponentSelect}
                            showSearch
                            optionFilterProp="label"
                        />
                    </Form.Item>
                </Col>
            </Row>

            {selectedComponent && (
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            label="Component Condition"
                            name="removal_condition"
                            rules={[
                                {
                                    required: true,
                                    message: "Please select condition",
                                },
                            ]}
                        >
                            <Select
                                placeholder="Select condition"
                                onChange={(value) => {
                                    form.setFieldsValue({
                                        removal_reason:
                                            CONDITION_REASON_MAP[value],
                                    });
                                }}
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
                        </Form.Item>
                        <Form.Item name="removal_reason" hidden>
                            <Input />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            label="Remarks"
                            name="removal_remarks"
                            rules={[
                                {
                                    required: true,
                                    message: "Please provide a reason",
                                },
                            ]}
                        >
                            <TextArea
                                rows={3}
                                placeholder="Why are you removing this component?"
                                maxLength={500}
                                showCount
                            />
                        </Form.Item>
                    </Col>
                </Row>
            )}
        </>
    );
};

export default RemoveComponent;
