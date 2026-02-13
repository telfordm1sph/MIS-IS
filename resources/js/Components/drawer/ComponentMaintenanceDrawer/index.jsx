import React, { useState } from "react";
import { Drawer, Form, Button, Radio, Space, Divider, message } from "antd";
import {
    EditOutlined,
    SwapOutlined,
    PlusCircleOutlined,
    DeleteOutlined,
    SaveOutlined,
} from "@ant-design/icons";

import { useComponentMaintenance } from "@/Hooks/useComponentMaintenance";
import HardwareInfo from "./HardwareInfo";
import ReplaceComponent from "./ReplaceComponent";
import AddComponent from "./AddComponent";
import RemoveComponent from "./RemoveComponent";
import IssuanceConfirmationModal from "./IssuanceConfirmationModal";

const ComponentMaintenanceDrawer = ({ open, onClose, hardware, onSave }) => {
    const [form] = Form.useForm();
    const [action, setAction] = useState("replace");
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [pendingData, setPendingData] = useState(null);

    const {
        loading,
        partsHooks,
        softwareHooks,
        selectedComponentType,
        getComponentOptions,
        handleComponentSelectWrapper,
        handleClose,
    } = useComponentMaintenance(form, open, hardware, action, onSave, onClose);

    const handleActionChange = (e) => {
        setAction(e.target.value);
        form.resetFields();
    };

    const handleComponentTypeSelect = (value) => {
        handleComponentSelectWrapper(null, { componentType: value });
    };

    // Centralized save handler
    const handleSave = async () => {
        try {
            const values = await form.validateFields();

            // Build consolidated payload
            const payload = {
                hardware_id: hardware.id,
                hostname: hardware.hostname,
                operations: [],
            };

            // Process based on action
            if (action === "replace") {
                const replacements = values.replacements || [];
                replacements.forEach((replacement) => {
                    payload.operations.push({
                        operation: "replace",
                        old_component_id: replacement.old_component_id,
                        old_component_type: replacement.old_component_type,
                        old_component_data: replacement.old_component_data,
                        old_condition: replacement.old_condition,
                        new_component_id: replacement.new_component_id,
                        new_component_data: replacement.new_component_data,
                        reason: replacement.reason,
                        remarks: replacement.remarks,
                    });
                });
            } else if (action === "add") {
                const components = values.components || [];
                components.forEach((component) => {
                    payload.operations.push({
                        operation: "add",
                        component_type: component.component_type,
                        component_id: component.component_id,
                        component_data: component.component_data,
                        reason: component.reason,
                    });
                });
            } else if (action === "remove") {
                const components = values.components_to_remove || [];
                components.forEach((component) => {
                    payload.operations.push({
                        operation: "remove",
                        component_id: component.component_id,
                        condition: component.condition,
                        reason: component.reason,
                        remarks: component.remarks,
                    });
                });
            }

            console.log(
                "📦 CONSOLIDATED PAYLOAD:",
                JSON.stringify(payload, null, 2),
            );

            // Show confirmation modal
            setPendingData(payload);
            setShowConfirmModal(true);
        } catch (error) {
            console.error("Validation error:", error);
            message.error("Please fill in all required fields");
        }
    };

    // Confirm and submit
    const handleConfirmSubmit = async () => {
        try {
            setLoading(true);

            // Make API call here
            // const response = await axios.post(route('hardware.maintenance.batch'), pendingData);

            message.success("Maintenance operations completed successfully");
            setShowConfirmModal(false);
            setPendingData(null);
            form.resetFields();
            onSave?.();
            handleClose();
        } catch (error) {
            console.error("Submit error:", error);
            message.error("Failed to save maintenance operations");
        } finally {
            setLoading(false);
        }
    };

    const ACTION_CONFIG = {
        replace: {
            text: "Save All Changes",
            icon: <SaveOutlined />,
            type: "primary",
            danger: false,
        },
        add: {
            text: "Save All Changes",
            icon: <SaveOutlined />,
            type: "primary",
            danger: false,
        },
        remove: {
            text: "Save All Changes",
            icon: <SaveOutlined />,
            type: "primary",
            danger: true,
        },
    };

    const config = ACTION_CONFIG[action];

    return (
        <>
            <Drawer
                title={
                    <Space>
                        <EditOutlined />
                        Hardware Maintenance
                    </Space>
                }
                size={1200}
                onClose={handleClose}
                open={open}
                styles={{ body: { paddingBottom: 80 } }}
                footer={
                    <div style={{ textAlign: "right" }}>
                        <Button
                            onClick={handleClose}
                            style={{ marginRight: 8 }}
                        >
                            Cancel
                        </Button>
                        <Button
                            type={config.type}
                            danger={config.danger}
                            onClick={handleSave}
                            loading={loading}
                            icon={config.icon}
                        >
                            {config.text}
                        </Button>
                    </div>
                }
            >
                <HardwareInfo hardware={hardware} />

                <Divider />
                <Radio.Group
                    value={action}
                    onChange={handleActionChange}
                    style={{ marginBottom: 24, width: "100%" }}
                    buttonStyle="solid"
                >
                    <Radio.Button
                        value="replace"
                        style={{ width: "33.33%", textAlign: "center" }}
                    >
                        <SwapOutlined /> Replace Component
                    </Radio.Button>
                    <Radio.Button
                        value="add"
                        style={{ width: "33.33%", textAlign: "center" }}
                    >
                        <PlusCircleOutlined /> Add Component
                    </Radio.Button>
                    <Radio.Button
                        value="remove"
                        style={{ width: "33.33%", textAlign: "center" }}
                    >
                        <DeleteOutlined /> Remove Component
                    </Radio.Button>
                </Radio.Group>

                <Divider />

                <Form
                    form={form}
                    layout="vertical"
                    initialValues={{ components: [], component_type: null }}
                    autoComplete="off"
                >
                    {action === "replace" && (
                        <ReplaceComponent
                            form={form}
                            componentOptions={getComponentOptions()}
                            partsHooks={partsHooks}
                            softwareHooks={softwareHooks}
                            hardware={hardware}
                        />
                    )}

                    {action === "add" && (
                        <AddComponent
                            form={form}
                            selectedComponentType={selectedComponentType}
                            onComponentTypeSelect={(value) => {
                                handleComponentSelectWrapper(null, {
                                    componentType: value,
                                });
                            }}
                        />
                    )}

                    {action === "remove" && (
                        <RemoveComponent
                            form={form}
                            componentOptions={getComponentOptions()}
                        />
                    )}
                </Form>
            </Drawer>

            <IssuanceConfirmationModal
                visible={showConfirmModal}
                onCancel={() => setShowConfirmModal(false)}
                onConfirm={handleConfirmSubmit}
                hardware={hardware}
                operations={pendingData?.operations || []}
                action={action}
                employeeData={{ emp_id: "EMP001", emp_name: "John Doe" }}
                loading={loading}
            />
        </>
    );
};

export default ComponentMaintenanceDrawer;
