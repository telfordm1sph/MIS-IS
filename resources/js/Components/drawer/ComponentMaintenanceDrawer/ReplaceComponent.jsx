import React from "react";
import { Row, Col, Form, Select, Divider, Input } from "antd";
import CascadingPartFields from "@/Components/forms/CascadingPartFields";
import CascadingSoftwareFields from "@/Components/forms/CascadingSoftwareFields";

const { TextArea } = Input;

const ReplaceComponent = ({
    form,
    selectedComponent,
    selectedComponentType,
    selectedComponentData,
    componentOptions,
    partsHooks,
    softwareHooks,
    onComponentSelect,
}) => {
    const CONDITION_REASON_MAP = {
        working: "Working",
        faulty: "Faulty",
        defective: "Defective",
    };

    return (
        <>
            <Row gutter={16}>
                <Col span={24}>
                    <Form.Item
                        label="Component to Replace"
                        name="component_to_replace"
                        rules={[
                            {
                                required: true,
                                message: "Please select component to replace",
                            },
                        ]}
                    >
                        <Select
                            placeholder="Select component to replace"
                            options={componentOptions}
                            onChange={onComponentSelect}
                            showSearch
                            optionFilterProp="label"
                        />
                    </Form.Item>
                </Col>
            </Row>

            {/* PART REPLACEMENT */}
            {selectedComponent && selectedComponentType === "part" && (
                <>
                    <Divider titlePlacement="left">
                        Select Replacement Part from Inventory
                    </Divider>

                    <CascadingPartFields
                        key={`part_${selectedComponent}_replace`}
                        fieldPrefix="replacement"
                        form={form}
                        partsHooks={partsHooks}
                        initialValues={{
                            part_type:
                                selectedComponentData?.part_info?.part_type,
                        }}
                        disabled={{ part_type: true }}
                        layout="horizontal"
                    />

                    <Divider titlePlacement="left">Replacement Details</Divider>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                label="Old Component Condition"
                                name="old_component_condition"
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
                                            reason: CONDITION_REASON_MAP[value],
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
                                </Select>
                            </Form.Item>
                            <Form.Item name="reason" hidden>
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="Remarks" name="remarks">
                                <TextArea
                                    rows={3}
                                    placeholder="Enter any additional notes"
                                    maxLength={500}
                                    showCount
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                </>
            )}

            {/* SOFTWARE REPLACEMENT */}
            {selectedComponent && selectedComponentType === "software" && (
                <>
                    <Divider titlePlacement="left">
                        Select Replacement Software from Inventory
                    </Divider>

                    <CascadingSoftwareFields
                        key={`software_${selectedComponent}_replace`}
                        fieldPrefix="replacement_sw"
                        form={form}
                        softwareHooks={softwareHooks}
                        initialValues={{
                            software_name:
                                selectedComponentData?.inventory?.software_name,
                            software_type:
                                selectedComponentData?.inventory?.software_type,
                        }}
                        disabled={{
                            software_name: true,
                            software_type: true,
                        }}
                        layout="horizontal"
                    />

                    <Divider titlePlacement="left">Replacement Details</Divider>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                label="Reason for Replacement"
                                name="reason"
                                rules={[
                                    {
                                        required: true,
                                        message: "Please select a reason",
                                    },
                                ]}
                            >
                                <Select placeholder="Select reason">
                                    <Select.Option value="License Expired">
                                        License Expired
                                    </Select.Option>
                                    <Select.Option value="Software Corrupted">
                                        Software Corrupted
                                    </Select.Option>
                                    <Select.Option value="Not Working">
                                        Not Working
                                    </Select.Option>
                                    <Select.Option value="Upgrade Version">
                                        Upgrade to Better Version
                                    </Select.Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="Remarks" name="remarks">
                                <TextArea
                                    rows={3}
                                    placeholder="Enter any additional notes"
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

export default ReplaceComponent;
