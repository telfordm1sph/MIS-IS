import React, { useState } from "react";
import { Drawer, Form, Button, Radio, Space, Divider, message } from "antd";
import {
    EditOutlined,
    SwapOutlined,
    PlusCircleOutlined,
    DeleteOutlined,
    SaveOutlined,
} from "@ant-design/icons";
import { usePage } from "@inertiajs/react";
import axios from "axios";

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
    const [pendingData, setPendingData] = useState([]);
    const [loading, setLoading] = useState(false);

    const { emp_data } = usePage().props;

    const {
        partsHooks,
        softwareHooks,
        selectedComponentType,
        handleComponentTypeSelect,
        getComponentOptions,
        handleClose,
    } = useComponentMaintenance(form, open, hardware, action, onSave, onClose);

    const handleActionChange = (e) => {
        setAction(e.target.value);
        form.resetFields();
    };

    // ----------------------------
    // Build unified payload for all actions
    // ----------------------------
    const buildPayload = (values, issuedToEmployeeId) => {
        // Add issuedToEmployeeId parameter
        const basePayload = {
            hardware_id: hardware.id,
            hostname: hardware.hostname,
            issued_to: issuedToEmployeeId, // Include issued_to in base payload
        };
        const payloads = [];

        const addOrReplaceHandler = (item, type) => {
            const qty = item.quantity || 1;
            for (let i = 0; i < qty; i++) {
                const common = {
                    ...basePayload,
                    component_type: item.component_type,
                    operation: type,
                    reason: item.reason || null,
                    remarks: item.remarks || null,
                };
                if (item.component_type === "part") {
                    payloads.push({
                        ...common,
                        ...(type === "replace"
                            ? {
                                  component_id: item.component_id,
                                  component_to_replace:
                                      item.component_to_replace,
                                  old_component_condition:
                                      item.old_component_condition,
                                  replacement_part_type:
                                      item.replacement_part_type,
                                  replacement_brand: item.replacement_brand,
                                  replacement_model: item.replacement_model,
                                  replacement_specifications:
                                      item.replacement_specifications || null,
                                  replacement_condition:
                                      item.replacement_condition || "New",
                                  replacement_serial_number:
                                      item.replacement_serial_number || null,
                              }
                            : {
                                  new_component_id: item.component_id,
                                  new_part_type: item.new_part_type,
                                  new_brand: item.new_brand,
                                  new_model: item.new_model,
                                  new_specifications:
                                      item.new_specifications || null,
                                  new_condition: item.new_condition || "New",
                                  new_serial_number:
                                      item.new_serial_number || null,
                              }),
                    });
                } else if (item.component_type === "software") {
                    payloads.push({
                        ...common,
                        ...(type === "replace"
                            ? {
                                  component_id: item.component_id,
                                  component_to_replace:
                                      item.component_to_replace,
                                  old_component_condition:
                                      item.old_component_condition,
                                  replacement_software_name:
                                      item.replacement_software_name,
                                  replacement_software_type:
                                      item.replacement_software_type,
                                  replacement_version: item.replacement_version,
                              }
                            : {
                                  new_software_name: item.new_software_name,
                                  new_software_type: item.new_software_type,
                                  new_version: item.new_version,
                                  new_license_key: item.new_license_key || null,
                                  new_account_user:
                                      item.new_account_user || null,
                                  new_account_password:
                                      item.new_account_password || null,
                              }),
                    });
                }
            }
        };

        if (action === "replace") {
            (values.replacements || []).forEach((r) =>
                addOrReplaceHandler(r, "replace"),
            );
        } else if (action === "add") {
            (values.components || []).forEach((c) =>
                addOrReplaceHandler(c, "add"),
            );
        } else if (action === "remove") {
            (values.components_to_remove || []).forEach((c) => {
                payloads.push({
                    ...basePayload,
                    component_id: c.component_id,
                    component_type: c.component_type,
                    operation: "remove",
                    condition: c.condition,
                    reason: c.reason,
                    remarks: c.remarks || null,
                });
            });
        }

        return payloads;
    };

    const handleSave = async () => {
        try {
            const values = await form.validateFields();

            if (
                action === "replace" &&
                (!values.replacements || values.replacements.length === 0)
            ) {
                message.error(
                    "Please select at least one component to replace",
                );
                return;
            }

            const payloads = buildPayload(values);
            if (!payloads.length) {
                message.error("Please select at least one component");
                return;
            }

            setPendingData(payloads);
            setShowConfirmModal(true);
        } catch (error) {
            console.error(error);
            message.error("Please fill in all required fields");
        }
    };

    // ----------------------------
    // Submit batch with employeeId from modal
    // ----------------------------
    const handleConfirmSubmit = async (employeeId) => {
        try {
            setLoading(true);
            console.log("Pending data", pendingData);

            if (!pendingData.length) return;

            const payload = {
                employee_id: emp_data?.emp_id,
                operations: pendingData.map((op) => ({
                    ...op,
                    issued_to: employeeId,
                })),
            };
            // const endpoint = route("component.maintenance.batch");
            // await axios.post(endpoint, payload);

            message.success(
                `Hardware ${action} completed successfully (${pendingData.length} item${pendingData.length > 1 ? "s" : ""})`,
            );

            setShowConfirmModal(false);
            setPendingData([]);
            form.resetFields();
            onSave?.();
            handleClose();
        } catch (error) {
            console.error(error);
            message.error(
                error.response?.data?.message ||
                    `Failed to ${action} components`,
            );
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
                        <EditOutlined /> Hardware Maintenance
                    </Space>
                }
                width={1200}
                onClose={handleClose}
                open={open}
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
                        <SwapOutlined /> Replace
                    </Radio.Button>
                    <Radio.Button
                        value="add"
                        style={{ width: "33.33%", textAlign: "center" }}
                    >
                        <PlusCircleOutlined /> Add
                    </Radio.Button>
                    <Radio.Button
                        value="remove"
                        style={{ width: "33.33%", textAlign: "center" }}
                    >
                        <DeleteOutlined /> Remove
                    </Radio.Button>
                </Radio.Group>

                <Form
                    form={form}
                    layout="vertical"
                    initialValues={{ components: [], replacements: [] }}
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
                            onComponentTypeSelect={handleComponentTypeSelect}
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
                onConfirm={handleConfirmSubmit} // employeeId passed from modal
                hardware={hardware}
                operations={pendingData}
                action={action}
                employeeData={emp_data}
                loading={loading}
            />
        </>
    );
};

export default ComponentMaintenanceDrawer;
