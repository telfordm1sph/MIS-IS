import React from "react";
import { Drawer, Form, Button, Divider, Space } from "antd";
import { SwapOutlined, UpCircleOutlined } from "@ant-design/icons";

import { useComponentMaintenance } from "@/Hooks/useComponentMaintenance";
import HardwareInfo from "./HardwareInfo";
import UpgradeMode from "./UpgradeMode";
import ReplaceMode from "./ReplaceMode";

const ComponentMaintenanceDrawer = ({
    open,
    onClose,
    hardware,
    mode,
    onSave,
}) => {
    const [form] = Form.useForm();

    const {
        loading,
        upgradeAction,
        partsHooks,
        softwareHooks,
        selectedComponent,
        selectedComponentType,
        selectedComponentData,
        getComponentOptions,
        handleComponentSelectWrapper,
        handleUpgradeActionChange,
        handleFinish,
        handleClose,
    } = useComponentMaintenance(form, open, hardware, mode, onSave, onClose);

    const handleComponentTypeSelect = (value) => {
        handleComponentSelectWrapper(null, { componentType: value });
        form.setFieldsValue({
            new_part_type: undefined,
            new_brand: undefined,
            new_model: undefined,
            new_specifications: undefined,
            new_sw_software_name: undefined,
            new_sw_software_type: undefined,
            new_sw_version: undefined,
            new_sw_license: undefined,
        });
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
            <HardwareInfo hardware={hardware} />
            <Divider />

            <Form
                form={form}
                layout="vertical"
                onFinish={handleFinish}
                autoComplete="off"
            >
                {mode === "replace" && (
                    <ReplaceMode
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

                {mode === "upgrade" && (
                    <UpgradeMode
                        form={form}
                        upgradeAction={upgradeAction}
                        selectedComponent={selectedComponent}
                        selectedComponentType={selectedComponentType}
                        selectedComponentData={selectedComponentData}
                        componentOptions={getComponentOptions()}
                        partsHooks={partsHooks}
                        softwareHooks={softwareHooks}
                        onUpgradeActionChange={handleUpgradeActionChange}
                        onComponentSelect={handleComponentSelectWrapper}
                        onComponentTypeSelect={handleComponentTypeSelect}
                    />
                )}
            </Form>
        </Drawer>
    );
};

export default ComponentMaintenanceDrawer;
