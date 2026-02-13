import React from "react";
import {
    Row,
    Col,
    Form,
    Select,
    Input,
    Alert,
    Card,
    Button,
    Space,
} from "antd";
import {
    ExclamationCircleOutlined,
    DeleteOutlined,
    PlusOutlined,
} from "@ant-design/icons";

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
                description="Removing components will return them to inventory or mark them for disposal based on their condition."
                type="warning"
                showIcon
                icon={<ExclamationCircleOutlined />}
                style={{ marginBottom: 24 }}
            />

            <Form.List name="components_to_remove" initialValue={[{}]}>
                {(fields, { add, remove }) => (
                    <>
                        {fields.map(({ key, name, ...restField }, index) => (
                            <Card
                                key={key}
                                size="small"
                                title={`Component ${index + 1}`}
                                extra={
                                    fields.length > 1 && (
                                        <Button
                                            type="text"
                                            danger
                                            icon={<DeleteOutlined />}
                                            onClick={() => remove(name)}
                                        >
                                            Remove
                                        </Button>
                                    )
                                }
                                style={{ marginBottom: 16 }}
                            >
                                <Row gutter={16}>
                                    <Col span={24}>
                                        <Form.Item
                                            {...restField}
                                            label="Component to Remove"
                                            name={[name, "component_id"]}
                                            rules={[
                                                {
                                                    required: true,
                                                    message:
                                                        "Please select component",
                                                },
                                            ]}
                                        >
                                            <Select
                                                placeholder="Select component to remove"
                                                options={componentOptions}
                                                showSearch
                                                optionFilterProp="label"
                                            />
                                        </Form.Item>
                                    </Col>
                                </Row>

                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Form.Item
                                            {...restField}
                                            label="Component Condition"
                                            name={[name, "condition"]}
                                            rules={[
                                                {
                                                    required: true,
                                                    message:
                                                        "Please select condition",
                                                },
                                            ]}
                                        >
                                            <Select
                                                placeholder="Select condition"
                                                onChange={(value) => {
                                                    const currentValues =
                                                        form.getFieldValue(
                                                            "components_to_remove",
                                                        ) || [];
                                                    currentValues[name] = {
                                                        ...currentValues[name],
                                                        reason: CONDITION_REASON_MAP[
                                                            value
                                                        ],
                                                    };
                                                    form.setFieldsValue({
                                                        components_to_remove:
                                                            currentValues,
                                                    });
                                                }}
                                            >
                                                <Select.Option value="working">
                                                    Working - Return to
                                                    Inventory
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
                                        <Form.Item
                                            {...restField}
                                            name={[name, "reason"]}
                                            hidden
                                        >
                                            <Input />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            {...restField}
                                            label="Remarks"
                                            name={[name, "remarks"]}
                                            rules={[
                                                {
                                                    required: true,
                                                    message:
                                                        "Please provide remarks",
                                                },
                                            ]}
                                        >
                                            <TextArea
                                                rows={3}
                                                placeholder="Why are you removing this?"
                                                maxLength={500}
                                                showCount
                                            />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </Card>
                        ))}

                        <Button
                            type="dashed"
                            onClick={() => add()}
                            block
                            icon={<PlusOutlined />}
                        >
                            Add Another Component to Remove
                        </Button>
                    </>
                )}
            </Form.List>
        </>
    );
};

export default RemoveComponent;
