import React, { useState } from "react";
import { Drawer, Form, Button, Radio, Space, Divider } from "antd";
import {
    EditOutlined,
    SwapOutlined,
    PlusCircleOutlined,
    DeleteOutlined,
} from "@ant-design/icons";

import { useComponentMaintenance } from "@/Hooks/useComponentMaintenance";
import HardwareInfo from "./HardwareInfo";
import EditHardwareInfo from "./EditHardwareInfo";
import ReplaceComponent from "./ReplaceComponent";
import AddComponent from "./AddComponent";
import RemoveComponent from "./RemoveComponent";

const ComponentMaintenanceDrawer = ({ open, onClose, hardware, onSave }) => {
    const [form] = Form.useForm();
    const [action, setAction] = useState("edit");

    const {
        loading,
        partsHooks,
        softwareHooks,
        selectedComponent,
        selectedComponentType,
        selectedComponentData,
        getComponentOptions,
        handleComponentSelectWrapper,
        handleFinish,
        handleClose,
    } = useComponentMaintenance(form, open, hardware, action, onSave, onClose);

    const handleActionChange = (e) => {
        setAction(e.target.value);
        form.resetFields();
    };

    const handleComponentTypeSelect = (value) => {
        handleComponentSelectWrapper(null, { componentType: value });
        form.resetFields([
            "new_part_type",
            "new_brand",
            "new_model",
            "new_specifications",
            "new_sw_software_name",
            "new_sw_software_type",
            "new_sw_version",
            "new_sw_license",
        ]);
    };

    const ACTION_CONFIG = {
        edit: {
            text: "Update Hardware",
            icon: <EditOutlined />,
            type: "primary",
            danger: false,
        },
        replace: {
            text: "Replace Component",
            icon: <SwapOutlined />,
            type: "primary",
            danger: false,
        },
        add: {
            text: "Add Component",
            icon: <PlusCircleOutlined />,
            type: "primary",
            danger: false,
        },
        remove: {
            text: "Remove Component",
            icon: <DeleteOutlined />,
            type: "primary",
            danger: true,
        },
    };

    const config = ACTION_CONFIG[action] || ACTION_CONFIG.edit;

    return (
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
                    <Button onClick={handleClose} style={{ marginRight: 8 }}>
                        Cancel
                    </Button>
                    <Button
                        type={config.type}
                        danger={config.danger}
                        onClick={() => form.submit()}
                        loading={loading}
                        icon={config.icon}
                    >
                        {config.text}
                    </Button>
                </div>
            }
        >
            {/* Hardware Info - Hide when editing */}
            {action !== "edit" && <HardwareInfo hardware={hardware} />}

            <Divider />

            {/* Action Selector */}
            <Radio.Group
                value={action}
                onChange={handleActionChange}
                style={{ marginBottom: 24, width: "100%" }}
                buttonStyle="solid"
            >
                <Radio.Button value="edit" style={{ width: "25%" }}>
                    <EditOutlined /> Edit Details
                </Radio.Button>
                <Radio.Button value="replace" style={{ width: "25%" }}>
                    <SwapOutlined /> Replace Component
                </Radio.Button>
                <Radio.Button value="add" style={{ width: "25%" }}>
                    <PlusCircleOutlined /> Add Component
                </Radio.Button>
                <Radio.Button value="remove" style={{ width: "25%" }}>
                    <DeleteOutlined /> Remove Component
                </Radio.Button>
            </Radio.Group>

            <Divider />

            {/* Dynamic Form based on action */}
            <Form
                form={form}
                layout="vertical"
                onFinish={handleFinish}
                autoComplete="off"
            >
                {action === "edit" && (
                    <EditHardwareInfo hardware={hardware} form={form} />
                )}

                {action === "replace" && (
                    <ReplaceComponent
                        form={form}
                        selectedComponent={selectedComponent}
                        selectedComponentType={selectedComponentType}
                        selectedComponentData={selectedComponentData}
                        componentOptions={getComponentOptions()}
                        partsHooks={partsHooks}
                        softwareHooks={softwareHooks}
                        onComponentSelect={handleComponentSelectWrapper}
                    />
                )}

                {action === "add" && (
                    <AddComponent
                        form={form}
                        selectedComponentType={selectedComponentType}
                        partsHooks={partsHooks}
                        softwareHooks={softwareHooks}
                        onComponentTypeSelect={handleComponentTypeSelect}
                    />
                )}

                {action === "remove" && (
                    <RemoveComponent
                        form={form}
                        selectedComponent={selectedComponent}
                        selectedComponentType={selectedComponentType}
                        selectedComponentData={selectedComponentData}
                        componentOptions={getComponentOptions()}
                        onComponentSelect={handleComponentSelectWrapper}
                    />
                )}
            </Form>
        </Drawer>
    );
};

export default ComponentMaintenanceDrawer;
