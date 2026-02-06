import React, { useEffect } from "react";
import { Row, Col, Form, Input, Select } from "antd";

const { TextArea } = Input;

const EditHardwareInfo = ({ hardware, form }) => {
    // Set initial values when component mounts
    useEffect(() => {
        if (hardware) {
            form.setFieldsValue({
                hostname: hardware.hostname,
                brand: hardware.brand,
                model: hardware.model,
                serial_number: hardware.serial_number,
                processor: hardware.processor,
                motherboard: hardware.motherboard,
                ip_address: hardware.ip_address,
                wifi_mac: hardware.wifi_mac,
                lan_mac: hardware.lan_mac,
                location: hardware.location,
                department: hardware.department,
            });
        }
    }, [hardware, form]);

    return (
        <>
            <Row gutter={16}>
                <Col span={12}>
                    <Form.Item
                        label="Hostname"
                        name="hostname"
                        rules={[
                            {
                                required: true,
                                message: "Please enter hostname",
                            },
                        ]}
                    >
                        <Input allowClear placeholder="Enter hostname" />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item
                        label="Brand"
                        name="brand"
                        rules={[
                            { required: true, message: "Please enter brand" },
                        ]}
                    >
                        <Input allowClear placeholder="Enter brand" />
                    </Form.Item>
                </Col>
            </Row>

            <Row gutter={16}>
                <Col span={12}>
                    <Form.Item
                        label="Model"
                        name="model"
                        rules={[
                            { required: true, message: "Please enter model" },
                        ]}
                    >
                        <Input allowClear placeholder="Enter model" />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item label="Serial Number" name="serial_number">
                        <Input allowClear placeholder="Enter serial number" />
                    </Form.Item>
                </Col>
            </Row>

            <Row gutter={16}>
                <Col span={12}>
                    <Form.Item label="Processor" name="processor">
                        <Input allowClear placeholder="Enter processor" />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item label="Motherboard" name="motherboard">
                        <Input allowClear placeholder="Enter motherboard" />
                    </Form.Item>
                </Col>
            </Row>

            <Row gutter={16}>
                <Col span={12}>
                    <Form.Item label="IP Address" name="ip_address">
                        <Input allowClear placeholder="Enter IP address" />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item label="WiFi MAC" name="wifi_mac">
                        <Input allowClear placeholder="Enter WiFi MAC" />
                    </Form.Item>
                </Col>
            </Row>

            <Row gutter={16}>
                <Col span={12}>
                    <Form.Item label="LAN MAC" name="lan_mac">
                        <Input allowClear placeholder="Enter LAN MAC" />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item label="Location" name="location">
                        <Input allowClear placeholder="Enter location" />
                    </Form.Item>
                </Col>
            </Row>

            <Row gutter={16}>
                <Col span={12}>
                    <Form.Item label="Department" name="department">
                        <Input allowClear placeholder="Enter department" />
                    </Form.Item>
                </Col>
            </Row>
        </>
    );
};

export default EditHardwareInfo;
