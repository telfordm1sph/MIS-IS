import React from "react";
import { Row, Col, Form, Select, Radio, Divider, Input, Space } from "antd";
import CascadingPartFields from "@/Components/forms/CascadingPartFields";
import CascadingSoftwareFields from "@/Components/forms/CascadingSoftwareFields";

const { TextArea } = Input;

const UpgradeMode = ({
    form,
    upgradeAction,
    selectedComponent,
    selectedComponentType,
    selectedComponentData,
    componentOptions,
    partsHooks,
    softwareHooks,
    onUpgradeActionChange,
    onComponentSelect,
    onComponentTypeSelect,
}) => {
    const componentTypes = [
        { label: "Hardware Part", value: "part" },
        { label: "Software", value: "software" },
    ];
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
                        label="Upgrade Action"
                        name="upgrade_action"
                        initialValue="replace"
                        rules={[
                            {
                                required: true,
                                message: "Please select an action",
                            },
                        ]}
                    >
                        <Radio.Group onChange={onUpgradeActionChange}>
                            <Space orientation="horizontal" size={32}>
                                <div>
                                    <Radio value="replace">
                                        <strong>
                                            Replace existing component with
                                            better one
                                        </strong>
                                    </Radio>
                                    <div
                                        style={{ fontSize: 12, color: "#666" }}
                                    >
                                        Swap out current component and return to
                                        inventory
                                    </div>
                                </div>
                                <div>
                                    <Radio value="add">
                                        <strong>
                                            Add new component (keep existing)
                                        </strong>
                                    </Radio>
                                    <div
                                        style={{ fontSize: 12, color: "#666" }}
                                    >
                                        Add additional component without
                                        removing current one
                                    </div>
                                </div>
                            </Space>
                        </Radio.Group>
                    </Form.Item>
                </Col>
            </Row>

            <Divider />

            {/* UPGRADE - REPLACE EXISTING */}
            {upgradeAction === "replace" && (
                <>
                    <Row gutter={16}>
                        <Col span={24}>
                            <Form.Item
                                label="Component to Upgrade"
                                name="component_to_upgrade"
                                rules={[
                                    {
                                        required: true,
                                        message:
                                            "Please select component to upgrade",
                                    },
                                ]}
                            >
                                <Select
                                    placeholder="Select component to upgrade"
                                    options={componentOptions}
                                    onChange={onComponentSelect}
                                    showSearch
                                    optionFilterProp="label"
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    {selectedComponent && selectedComponentType === "part" && (
                        <>
                            <Divider titlePlacement="left">
                                Select Better Part from Inventory
                            </Divider>

                            <CascadingPartFields
                                key={`upgrade_part_${selectedComponent}`}
                                fieldPrefix="upgrade"
                                form={form}
                                partsHooks={partsHooks}
                                initialValues={{
                                    part_type:
                                        selectedComponentData?.part_info
                                            ?.part_type,
                                }}
                                disabled={{ part_type: true }}
                                layout="horizontal"
                            />

                            <Divider titlePlacement="left">
                                Upgrade Details
                            </Divider>

                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item
                                        label="What to do with old component?"
                                        name="old_component_action"
                                        rules={[
                                            {
                                                required: true,
                                                message:
                                                    "Please select an option",
                                            },
                                        ]}
                                    >
                                        <Select
                                            placeholder="Select action"
                                            onChange={(value) => {
                                                form.setFieldsValue({
                                                    reason: CONDITION_REASON_MAP[
                                                        value
                                                    ],
                                                });
                                            }}
                                        >
                                            <Select.Option value="working">
                                                Return to Inventory (Working)
                                            </Select.Option>
                                            <Select.Option value="faulty">
                                                Faulty - For Repair
                                            </Select.Option>
                                            <Select.Option value="Defective">
                                                Defective
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

                    {selectedComponent &&
                        selectedComponentType === "software" && (
                            <>
                                <Divider titlePlacement="left">
                                    Select Better Software Version
                                </Divider>

                                <CascadingSoftwareFields
                                    key={`upgrade_${selectedComponent}`}
                                    fieldPrefix="upgrade_sw"
                                    form={form}
                                    softwareHooks={softwareHooks}
                                    initialValues={{
                                        software_name:
                                            selectedComponentData?.inventory
                                                ?.software_name,
                                        software_type:
                                            selectedComponentData?.inventory
                                                ?.software_type,
                                    }}
                                    disabled={{
                                        software_name: true,
                                        software_type: true,
                                    }}
                                    layout="horizontal"
                                />

                                <Row gutter={16}>
                                    <Col span={24}>
                                        <Form.Item
                                            label="Reason for Upgrade"
                                            name="reason"
                                        >
                                            <TextArea
                                                rows={3}
                                                placeholder="E.g., Need newer features, Security updates"
                                                maxLength={500}
                                                showCount
                                            />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </>
                        )}
                </>
            )}

            {/* UPGRADE - ADD NEW COMPONENT */}
            {upgradeAction === "add" && (
                <>
                    <Row gutter={16}>
                        <Col span={24}>
                            <Form.Item
                                label="Component Type to Add"
                                name="new_component_type"
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
            )}
        </>
    );
};

export default UpgradeMode;
