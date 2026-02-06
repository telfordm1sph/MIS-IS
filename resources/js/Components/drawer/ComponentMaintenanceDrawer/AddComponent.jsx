import React from "react";
import { Row, Col, Form, Select, Divider, Input } from "antd";
import CascadingPartFields from "@/Components/forms/CascadingPartFields";
import CascadingSoftwareFields from "@/Components/forms/CascadingSoftwareFields";

const { TextArea } = Input;

const AddComponent = ({
    form,
    selectedComponentType,
    partsHooks,
    softwareHooks,
    onComponentTypeSelect,
}) => {
    const componentTypes = [
        { label: "Hardware Part", value: "part" },
        { label: "Software", value: "software" },
    ];

    return (
        <>
            <Row gutter={16}>
                <Col span={24}>
                    <Form.Item
                        label="Component Type to Add"
                        name="component_type"
                        rules={[
                            {
                                required: true,
                                message: "Please select component type",
                            },
                        ]}
                    >
                        <Select
                            placeholder="Select type"
                            options={componentTypes}
                            onChange={onComponentTypeSelect}
                        />
                    </Form.Item>
                </Col>
            </Row>

            {selectedComponentType === "part" && (
                <>
                    <Divider titlePlacement="left">
                        Select Part from Inventory
                    </Divider>

                    <CascadingPartFields
                        fieldPrefix="new"
                        form={form}
                        partsHooks={partsHooks}
                        layout="horizontal"
                    />

                    <Row gutter={16}>
                        <Col span={24}>
                            <Form.Item
                                label="Reason for Addition"
                                name="reason"
                            >
                                <TextArea
                                    rows={3}
                                    placeholder="E.g., Need additional storage, Add second monitor"
                                    maxLength={500}
                                    showCount
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                </>
            )}

            {selectedComponentType === "software" && (
                <>
                    <Divider titlePlacement="left">
                        Select Software from Inventory
                    </Divider>

                    <CascadingSoftwareFields
                        fieldPrefix="new_sw"
                        form={form}
                        softwareHooks={softwareHooks}
                        layout="horizontal"
                    />

                    <Row gutter={16}>
                        <Col span={24}>
                            <Form.Item
                                label="Reason for Addition"
                                name="reason"
                            >
                                <TextArea
                                    rows={3}
                                    placeholder="E.g., User needs this software for work"
                                    maxLength={500}
                                    showCount
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                </>
            )}
        </>
    );
};

export default AddComponent;
