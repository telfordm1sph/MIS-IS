import React, { useEffect, useState } from "react";
import {
    Drawer,
    Form,
    Select,
    Button,
    Radio,
    Input,
    message,
    Divider,
    Descriptions,
    Space,
    Tag,
    Row,
    Col,
} from "antd";
import { SwapOutlined, UpCircleOutlined } from "@ant-design/icons";
import axios from "axios";
import { usePage } from "@inertiajs/react";
import { useComponentSelection } from "@/Hooks/useComponentSelection";
import CascadingPartFields from "@/Components/forms/CascadingPartFields";
import CascadingSoftwareFields from "@/Components/forms/CascadingSoftwareFields";
import { useHardwareParts } from "@/Hooks/useHardwareParts";
import { useHardwareSoftware } from "@/Hooks/useHardwareSoftware";

const { TextArea } = Input;

const ComponentMaintenanceDrawer = ({
    open,
    onClose,
    hardware,
    mode,
    onSave,
}) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [upgradeAction, setUpgradeAction] = useState("replace");

    const { emp_data } = usePage().props;

    const partsHooks = useHardwareParts(form);
    const softwareHooks = useHardwareSoftware(form);
    const {
        selectedComponent,
        selectedComponentType,
        selectedComponentData,
        handleComponentSelect,
        resetSelection,
    } = useComponentSelection();

    useEffect(() => {
        if (open && hardware) {
            form.resetFields();
            resetSelection();
            setUpgradeAction("replace");

            // ✅ LOAD INITIAL OPTIONS
            partsHooks.loadPartTypes();
            softwareHooks.loadSoftwareNames();
        }
    }, [open, hardware]);

    const getComponentOptions = () => {
        const options = [];

        hardware?.parts?.forEach((part) => {
            options.push({
                label: `[Part] ${part.part_info?.part_type || "Part"}: ${part.part_info?.brand || ""} ${part.part_info?.model || ""} - ${part.part_info?.specifications || ""}`,
                value: `part_${part.id}`,
            });
        });

        hardware?.software?.forEach((software) => {
            options.push({
                label: `[Software] ${software.inventory?.software_name || "Software"} ${software.inventory?.version || ""} (${software.inventory?.software_type || ""})`,
                value: `software_${software.id}`,
            });
        });

        return options;
    };

    const getComponentTypes = () => {
        return [
            { label: "Hardware Part", value: "part" },
            { label: "Software", value: "software" },
        ];
    };
    const handleComponentSelectWrapper = (value, option) => {
        // Determine componentType from value prefix
        const componentType = value.startsWith("part_") ? "part" : "software";
        const componentId = value.split("_")[1];

        // Find the actual data
        let componentData = null;
        if (componentType === "part") {
            componentData = hardware?.parts?.find((p) => p.id == componentId);
        } else {
            componentData = hardware?.software?.find(
                (s) => s.id == componentId,
            );
        }

        // Create a clean option object
        const cleanOption = {
            componentType,
            data: componentData,
        };

        handleComponentSelect(value, cleanOption);

        // Reset ALL form fields for the component selection
        form.setFieldsValue({
            // Hardware part fields
            replacement_part_type: undefined,
            replacement_brand: undefined,
            replacement_model: undefined,
            replacement_specifications: undefined,
            // Software fields
            replacement_sw_software_name: undefined,
            replacement_sw_software_type: undefined,
            replacement_sw_version: undefined,
            replacement_sw_license: undefined,
            // Upgrade fields
            upgrade_part_type: undefined,
            upgrade_brand: undefined,
            upgrade_model: undefined,
            upgrade_specifications: undefined,
            upgrade_sw_software_name: undefined,
            upgrade_sw_software_type: undefined,
            upgrade_sw_version: undefined,
            upgrade_sw_license: undefined,
            // Clear any other related fields
            reason: undefined,
            remarks: undefined,
            old_component_condition: undefined,
        });

        // ✅ Handle PARTS - ONLY SET PART_TYPE, NOT BRAND/MODEL
        if (componentType === "part" && componentData) {
            const partData = componentData.part_info;

            if (mode === "replace") {
                // ✅ ONLY set part_type (which will be disabled), NOT brand/model
                form.setFieldsValue({
                    replacement_part_type: partData?.part_type,
                });

                // ✅ Load only brands for the part type
                setTimeout(() => {
                    if (partData?.part_type) {
                        partsHooks.loadBrands(
                            partData.part_type,
                            "replacement",
                        );
                    }
                }, 0);
            } else if (mode === "upgrade" && upgradeAction === "replace") {
                form.setFieldsValue({
                    upgrade_part_type: partData?.part_type,
                });

                setTimeout(() => {
                    if (partData?.part_type) {
                        partsHooks.loadBrands(partData.part_type, "upgrade");
                    }
                }, 0);
            }
        }

        // ✅ Handle SOFTWARE - ONLY LOCK NAME & TYPE, NOT VERSION
        if (componentType === "software" && componentData) {
            const softwareData = componentData.inventory;

            if (mode === "replace") {
                // ✅ ONLY set name and type (which will be disabled), NOT version
                form.setFieldsValue({
                    replacement_sw_software_name: softwareData?.software_name,
                    replacement_sw_software_type: softwareData?.software_type,
                    // ❌ DON'T SET VERSION - let user select different version/license
                    // replacement_sw_version: softwareData?.version,
                });

                // ✅ Load name -> type -> versions (but don't preselect version)
                setTimeout(() => {
                    if (softwareData?.software_name) {
                        softwareHooks.loadSoftwareTypes(
                            softwareData.software_name,
                            "replacement_sw",
                        );
                    }
                    if (
                        softwareData?.software_name &&
                        softwareData?.software_type
                    ) {
                        softwareHooks.loadSoftwareVersions(
                            softwareData.software_name,
                            softwareData.software_type,
                            "replacement_sw",
                        );
                    }
                    // ❌ DON'T LOAD LICENSES YET - user will select version first
                }, 0);
            } else if (mode === "upgrade" && upgradeAction === "replace") {
                form.setFieldsValue({
                    upgrade_sw_software_name: softwareData?.software_name,
                    upgrade_sw_software_type: softwareData?.software_type,
                    // ❌ DON'T SET VERSION for upgrade either
                });

                setTimeout(() => {
                    if (softwareData?.software_name) {
                        softwareHooks.loadSoftwareTypes(
                            softwareData.software_name,
                            "upgrade_sw",
                        );
                    }
                    if (
                        softwareData?.software_name &&
                        softwareData?.software_type
                    ) {
                        softwareHooks.loadSoftwareVersions(
                            softwareData.software_name,
                            softwareData.software_type,
                            "upgrade_sw",
                        );
                    }
                }, 0);
            }
        }
    };
    const handleUpgradeActionChange = (e) => {
        const newValue = e.target.value;
        setUpgradeAction(newValue);
        resetSelection();

        const currentUpgradeAction = form.getFieldValue("upgrade_action");
        form.resetFields();
        form.setFieldsValue({ upgrade_action: newValue });
    };

    const handleFinish = async (values) => {
        try {
            setLoading(true);

            const payload = {
                hardware_id: hardware.id,
                hostname: hardware.hostname,
                mode: mode,
                component_type: selectedComponentType,
                employee_id: emp_data?.emp_id,
                ...values,
            };

            if (selectedComponent) {
                const componentId = selectedComponent.split("_")[1];
                payload.component_id = componentId;
            }

            if (mode === "upgrade") {
                payload.upgrade_action = upgradeAction;
            }

            let endpoint = "";
            if (mode === "replace") {
                endpoint = route("hardware.component.replace");
            } else if (mode === "upgrade") {
                endpoint = route("hardware.component.upgrade");
            }

            const response = await axios.post(endpoint, payload);

            if (response.data?.success) {
                message.success(
                    response.data.message || `Component ${mode}d successfully`,
                );
                if (onSave) onSave(response.data);
                handleClose();
            } else {
                message.error(
                    response.data?.message || `Failed to ${mode} component`,
                );
            }
        } catch (error) {
            console.error(`Error ${mode}ing component:`, error);
            message.error(
                error.response?.data?.message ||
                    `An error occurred while ${mode}ing component`,
            );
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        form.resetFields();
        resetSelection();
        setUpgradeAction("replace");
        onClose();
    };

    const getDrawerTitle = () => {
        const icon =
            mode === "replace" ? <SwapOutlined /> : <UpCircleOutlined />;
        const text =
            mode === "replace" ? "Replace Component" : "Upgrade Component";
        return (
            <Space>
                {icon}
                {text}
            </Space>
        );
    };

    return (
        <Drawer
            title={getDrawerTitle()}
            size={1200}
            onClose={handleClose}
            open={open}
            styles={{ body: { paddingBottom: 80 } }}
            footer={
                <div style={{ textAlign: "right" }}>
                    <Button onClick={handleClose} style={{ marginRight: 8 }}>
                        Cancel
                    </Button>
                    <Button
                        type="primary"
                        onClick={() => form.submit()}
                        loading={loading}
                        icon={
                            mode === "replace" ? (
                                <SwapOutlined />
                            ) : (
                                <UpCircleOutlined />
                            )
                        }
                    >
                        {mode === "replace"
                            ? "Replace Component"
                            : "Upgrade Component"}
                    </Button>
                </div>
            }
        >
            {/* Hardware Information */}
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

            <Divider />

            <Form
                form={form}
                layout="vertical"
                onFinish={handleFinish}
                autoComplete="off"
            >
                {/* REPLACEMENT MODE */}
                {mode === "replace" && (
                    <>
                        <Row gutter={16}>
                            <Col span={24}>
                                <Form.Item
                                    label="Component to Replace"
                                    name="component_to_replace"
                                    rules={[
                                        {
                                            required: true,
                                            message:
                                                "Please select component to replace",
                                        },
                                    ]}
                                >
                                    <Select
                                        placeholder="Select component to replace"
                                        options={getComponentOptions()}
                                        onChange={handleComponentSelectWrapper}
                                        showSearch
                                        optionFilterProp="label"
                                    />
                                </Form.Item>
                            </Col>
                        </Row>

                        {selectedComponent &&
                            selectedComponentType === "part" && (
                                <>
                                    <Divider titlePlacement="left">
                                        Select Replacement Part from Inventory
                                    </Divider>

                                    <CascadingPartFields
                                        key={`part_${selectedComponent}_${mode}`}
                                        fieldPrefix="replacement"
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
                                        Replacement Details
                                    </Divider>

                                    <Row gutter={16}>
                                        <Col span={12}>
                                            <Form.Item
                                                label="Reason for Replacement"
                                                name="reason"
                                                rules={[
                                                    {
                                                        required: true,
                                                        message:
                                                            "Please select a reason",
                                                    },
                                                ]}
                                            >
                                                <Select placeholder="Select reason">
                                                    <Select.Option value="Faulty">
                                                        Faulty
                                                    </Select.Option>
                                                    <Select.Option value="Damaged">
                                                        Damaged
                                                    </Select.Option>
                                                    <Select.Option value="Not Working">
                                                        Not Working
                                                    </Select.Option>
                                                    <Select.Option value="Defective">
                                                        Defective
                                                    </Select.Option>
                                                </Select>
                                            </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item
                                                label="Old Component Condition"
                                                name="old_component_condition"
                                                rules={[
                                                    {
                                                        required: true,
                                                        message:
                                                            "Please select condition",
                                                    },
                                                ]}
                                            >
                                                <Select placeholder="Select condition">
                                                    <Select.Option value="Faulty">
                                                        Faulty - For Repair
                                                    </Select.Option>
                                                    <Select.Option value="Damaged">
                                                        Damaged - For Disposal
                                                    </Select.Option>
                                                    <Select.Option value="Defective">
                                                        Defective - Return to
                                                        Supplier
                                                    </Select.Option>
                                                </Select>
                                            </Form.Item>
                                        </Col>
                                    </Row>

                                    <Row gutter={16}>
                                        <Col span={24}>
                                            <Form.Item
                                                label="Remarks"
                                                name="remarks"
                                            >
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
                                        Select Replacement Software from
                                        Inventory
                                    </Divider>

                                    <CascadingSoftwareFields
                                        key={`software_${selectedComponent}_${mode}`}
                                        fieldPrefix="replacement_sw"
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

                                    <Divider titlePlacement="left">
                                        Replacement Details
                                    </Divider>

                                    <Row gutter={16}>
                                        <Col span={12}>
                                            <Form.Item
                                                label="Reason for Replacement"
                                                name="reason"
                                                rules={[
                                                    {
                                                        required: true,
                                                        message:
                                                            "Please select a reason",
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
                                                    <Select.Option value="Need Different License">
                                                        Need Different License
                                                    </Select.Option>
                                                </Select>
                                            </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item
                                                label="Remarks"
                                                name="remarks"
                                            >
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
                )}

                {/* UPGRADE MODE */}
                {mode === "upgrade" && (
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
                                    <Radio.Group
                                        onChange={handleUpgradeActionChange}
                                        // ❌ REMOVE THIS: value={upgradeAction}
                                    >
                                        <Space
                                            orientation="horizontal"
                                            size={32}
                                        >
                                            <div>
                                                <Radio value="replace">
                                                    <strong>
                                                        Replace existing
                                                        component with better
                                                        one
                                                    </strong>
                                                </Radio>
                                                <div
                                                    style={{
                                                        fontSize: 12,
                                                        color: "#666",
                                                    }}
                                                >
                                                    Swap out current component
                                                    and return to inventory
                                                </div>
                                            </div>

                                            <div>
                                                <Radio value="add">
                                                    <strong>
                                                        Add new component (keep
                                                        existing)
                                                    </strong>
                                                </Radio>
                                                <div
                                                    style={{
                                                        fontSize: 12,
                                                        color: "#666",
                                                    }}
                                                >
                                                    Add additional component
                                                    without removing current one
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
                                                options={getComponentOptions()}
                                                onChange={
                                                    handleComponentSelectWrapper
                                                }
                                                showSearch
                                                optionFilterProp="label"
                                            />
                                        </Form.Item>
                                    </Col>
                                </Row>

                                {selectedComponent &&
                                    selectedComponentType === "part" && (
                                        <>
                                            <Divider titlePlacement="left">
                                                Select Better Part from
                                                Inventory
                                            </Divider>

                                            <CascadingPartFields
                                                key={`upgrade_part_${selectedComponent}`}
                                                fieldPrefix="upgrade"
                                                form={form}
                                                partsHooks={partsHooks}
                                                initialValues={{
                                                    part_type:
                                                        selectedComponentData
                                                            ?.part_info
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
                                                        <Select placeholder="Select action">
                                                            <Select.Option value="return_inventory">
                                                                Return to
                                                                Inventory
                                                                (Working)
                                                            </Select.Option>
                                                            <Select.Option value="keep_spare">
                                                                Keep as Spare
                                                                for User
                                                            </Select.Option>
                                                            <Select.Option value="dispose">
                                                                Dispose
                                                            </Select.Option>
                                                        </Select>
                                                    </Form.Item>
                                                </Col>
                                                <Col span={12}>
                                                    <Form.Item
                                                        label="Reason for Upgrade"
                                                        name="reason"
                                                    >
                                                        <TextArea
                                                            rows={3}
                                                            placeholder="E.g., Performance improvement, User needs more capacity"
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
                                                        selectedComponentData
                                                            ?.inventory
                                                            ?.software_name,
                                                    software_type:
                                                        selectedComponentData
                                                            ?.inventory
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
                                                    message:
                                                        "Please select component type",
                                                },
                                            ]}
                                        >
                                            <Select
                                                placeholder="Select type"
                                                options={getComponentTypes()}
                                                onChange={(value) => {
                                                    // ✅ FIX: Set the component type in state
                                                    handleComponentSelect(
                                                        null,
                                                        {
                                                            componentType:
                                                                value,
                                                        },
                                                    );

                                                    // Reset form fields for new selection
                                                    form.setFieldsValue({
                                                        new_part_type:
                                                            undefined,
                                                        new_brand: undefined,
                                                        new_model: undefined,
                                                        new_specifications:
                                                            undefined,
                                                        new_software_name:
                                                            undefined,
                                                        new_software_type:
                                                            undefined,
                                                        new_version: undefined,
                                                        new_license: undefined,
                                                    });
                                                }}
                                            />
                                        </Form.Item>
                                    </Col>
                                </Row>

                                {selectedComponentType === "part" && (
                                    <>
                                        <Divider titlePlacement="left">
                                            Select Part from Inventory
                                        </Divider>

                                        {/* ✅ Now cascading will work because selectedComponentType is set */}
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

                                        {/* ✅ Now cascading will work */}
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
                )}
            </Form>
        </Drawer>
    );
};

export default ComponentMaintenanceDrawer;
