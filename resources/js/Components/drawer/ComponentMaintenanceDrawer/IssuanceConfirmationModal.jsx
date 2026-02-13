import React from "react";
import {
    Modal,
    Descriptions,
    Table,
    Tag,
    Space,
    Typography,
    Divider,
    Alert,
    Card,
    Row,
    Col,
    Statistic,
} from "antd";
import {
    CheckCircleOutlined,
    SwapOutlined,
    PlusCircleOutlined,
    DeleteOutlined,
    EditOutlined,
    WarningOutlined,
    UserOutlined,
    DesktopOutlined,
    BarcodeOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

const IssuanceConfirmationModal = ({
    visible,
    onCancel,
    onConfirm,
    hardware,
    operations = [],
    action,
    employeeData,
    loading = false,
}) => {
    // Generate issuance number preview
    const generateIssuanceNumber = () => {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const random = Math.floor(Math.random() * 9999)
            .toString()
            .padStart(4, "0");
        return `ISS-${year}${month}${day}-${random}`;
    };

    const issuanceNumber = generateIssuanceNumber();

    // Component type tag colors
    const componentTypeColors = {
        part: "blue",
        software: "green",
    };

    // Operation type icons and colors
    const operationConfig = {
        add: {
            icon: <PlusCircleOutlined />,
            color: "green",
            text: "Add",
        },
        remove: {
            icon: <DeleteOutlined />,
            color: "red",
            text: "Remove",
        },
        replace: {
            icon: <SwapOutlined />,
            color: "orange",
            text: "Replace",
        },
        edit: {
            icon: <EditOutlined />,
            color: "blue",
            text: "Edit",
        },
    };

    // Columns for operations table
    const columns = [
        {
            title: "Operation",
            dataIndex: "operation",
            key: "operation",
            width: 100,
            render: (op) => {
                const config = operationConfig[op] || operationConfig.add;
                return (
                    <Tag icon={config.icon} color={config.color}>
                        {config.text}
                    </Tag>
                );
            },
        },
        {
            title: "Component Type",
            dataIndex: "componentType",
            key: "componentType",
            render: (type) => (
                <Tag color={componentTypeColors[type] || "default"}>
                    {type?.toUpperCase()}
                </Tag>
            ),
        },
        {
            title: "Old Component",
            key: "oldComponent",
            render: (_, record) => {
                if (record.operation === "add")
                    return <Text type="secondary">-</Text>;

                let componentName = "";
                if (record.oldComponentData) {
                    if (record.componentType === "part") {
                        const p = record.oldComponentData.part_info;
                        componentName = `${p?.brand || ""} ${p?.model || ""} - ${p?.specifications || ""}`;
                    } else {
                        const s = record.oldComponentData.inventory;
                        componentName = `${s?.software_name || ""} ${s?.version || ""}`;
                    }
                }

                return (
                    <Space direction="vertical" size={0}>
                        <Text strong>{record.oldComponentId || "-"}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            {componentName || "N/A"}
                        </Text>
                        {record.oldCondition && (
                            <Tag
                                color={
                                    record.oldCondition === "working"
                                        ? "green"
                                        : "red"
                                }
                                size="small"
                            >
                                {record.oldCondition}
                            </Tag>
                        )}
                    </Space>
                );
            },
        },
        {
            title: "New Component",
            key: "newComponent",
            render: (_, record) => {
                if (record.operation === "remove")
                    return <Text type="secondary">-</Text>;

                let componentName = "";
                let componentDetails =
                    record.newComponentData || record.component_data;

                if (componentDetails) {
                    if (record.componentType === "part") {
                        componentName = `${componentDetails.new_brand || ""} ${componentDetails.new_model || ""} - ${componentDetails.new_specifications || ""}`;
                    } else {
                        componentName = `${componentDetails.new_sw_software_name || ""} ${componentDetails.new_sw_version || ""}`;
                    }
                }

                return (
                    <Space direction="vertical" size={0}>
                        <Text strong>{record.newComponentId || "New"}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            {componentName || "N/A"}
                        </Text>
                        {record.newCondition && (
                            <Tag color="green" size="small">
                                {record.newCondition}
                            </Tag>
                        )}
                    </Space>
                );
            },
        },
        {
            title: "Reason/Remarks",
            key: "remarks",
            width: 200,
            render: (_, record) => (
                <Space direction="vertical" size={0}>
                    {record.reason && (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            <Text strong>Reason:</Text> {record.reason}
                        </Text>
                    )}
                    {record.remarks && (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            <Text strong>Remarks:</Text> {record.remarks}
                        </Text>
                    )}
                </Space>
            ),
        },
    ];

    // Transform operations to table data
    const tableData = operations.map((op, index) => ({
        key: index,
        operation: op.operation,
        componentType: op.component_type || op.old_component_type,
        oldComponentId: op.old_component_id,
        oldComponentData: op.old_component_data,
        oldCondition: op.condition || op.old_condition,
        newComponentId: op.new_component_id,
        newComponentData: op.new_component || op.component_data,
        newCondition: op.new_condition,
        reason: op.reason,
        remarks: op.remarks,
    }));

    // Calculate statistics
    const stats = {
        total: operations.length,
        adds: operations.filter((op) => op.operation === "add").length,
        removes: operations.filter((op) => op.operation === "remove").length,
        replaces: operations.filter((op) => op.operation === "replace").length,
    };

    return (
        <Modal
            title={
                <Space>
                    <CheckCircleOutlined style={{ color: "#52c41a" }} />
                    <span>Confirm Hardware Maintenance Issuance</span>
                </Space>
            }
            open={visible}
            onCancel={onCancel}
            onOk={onConfirm}
            confirmLoading={loading}
            okText="Confirm & Create Issuance"
            cancelText="Review Changes"
            width={1000}
            style={{ top: 20 }}
        >
            <Space direction="vertical" size="large" style={{ width: "100%" }}>
                {/* Issuance Header Alert */}
                <Alert
                    message={
                        <Space>
                            <BarcodeOutlined />
                            <Text strong>Issuance #{issuanceNumber}</Text>
                            <Text type="secondary">•</Text>
                            <Text type="secondary">
                                {new Date().toLocaleString()}
                            </Text>
                        </Space>
                    }
                    description="This issuance will record all component changes. The user must acknowledge receipt of these items."
                    type="info"
                    showIcon
                />

                {/* Hardware Information */}
                <Card
                    size="small"
                    title={
                        <Space>
                            <DesktopOutlined />
                            Hardware Information
                        </Space>
                    }
                >
                    <Row gutter={[16, 16]}>
                        <Col span={8}>
                            <Statistic
                                title="Hostname"
                                value={hardware?.hostname || "N/A"}
                                prefix={<DesktopOutlined />}
                                valueStyle={{ fontSize: 16 }}
                            />
                        </Col>
                        <Col span={8}>
                            <Statistic
                                title="Location"
                                value={hardware?.location || "N/A"}
                                valueStyle={{ fontSize: 16 }}
                            />
                        </Col>
                        <Col span={8}>
                            <Statistic
                                title="Department"
                                value={hardware?.department || "N/A"}
                                valueStyle={{ fontSize: 16 }}
                            />
                        </Col>
                    </Row>
                    <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                        <Col span={12}>
                            <Statistic
                                title="Brand/Model"
                                value={`${hardware?.brand || ""} ${hardware?.model || ""}`}
                                valueStyle={{ fontSize: 14 }}
                            />
                        </Col>
                        <Col span={12}>
                            <Statistic
                                title="Serial Number"
                                value={hardware?.serial_number || "N/A"}
                                valueStyle={{ fontSize: 14 }}
                            />
                        </Col>
                    </Row>
                </Card>

                {/* Issuance Details */}
                <Card
                    size="small"
                    title={
                        <Space>
                            <UserOutlined />
                            Issuance Details
                        </Space>
                    }
                >
                    <Descriptions column={2} size="small">
                        <Descriptions.Item label="Issued To">
                            <Space>
                                <UserOutlined />
                                {employeeData?.emp_name ||
                                    employeeData?.emp_id ||
                                    "N/A"}
                            </Space>
                        </Descriptions.Item>
                        <Descriptions.Item label="Employee ID">
                            {employeeData?.emp_id || "N/A"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Issuance Date">
                            {new Date().toLocaleDateString()}
                        </Descriptions.Item>
                        <Descriptions.Item label="Status">
                            <Tag color="warning">Pending Acknowledgment</Tag>
                        </Descriptions.Item>
                    </Descriptions>
                </Card>

                {/* Operations Summary */}
                <Row gutter={16}>
                    <Col span={6}>
                        <Card size="small">
                            <Statistic
                                title="Total Changes"
                                value={stats.total}
                                suffix="items"
                                valueStyle={{ color: "#1890ff" }}
                            />
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card size="small">
                            <Statistic
                                title="Additions"
                                value={stats.adds}
                                prefix={<PlusCircleOutlined />}
                                valueStyle={{ color: "#52c41a" }}
                            />
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card size="small">
                            <Statistic
                                title="Removals"
                                value={stats.removes}
                                prefix={<DeleteOutlined />}
                                valueStyle={{ color: "#ff4d4f" }}
                            />
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card size="small">
                            <Statistic
                                title="Replacements"
                                value={stats.replaces}
                                prefix={<SwapOutlined />}
                                valueStyle={{ color: "#fa8c16" }}
                            />
                        </Card>
                    </Col>
                </Row>

                <Divider style={{ margin: "8px 0" }} />

                {/* Components Table */}
                <div>
                    <Title level={5} style={{ marginBottom: 16 }}>
                        Component Changes
                    </Title>
                    <Table
                        columns={columns}
                        dataSource={tableData}
                        pagination={false}
                        size="small"
                        bordered
                        scroll={{ x: 800 }}
                    />
                </div>

                {/* Warning for removals */}
                {stats.removes > 0 && (
                    <Alert
                        message="Components Being Removed"
                        description={`${stats.removes} component(s) will be removed from this hardware and returned to inventory or marked for disposal.`}
                        type="warning"
                        showIcon
                        icon={<WarningOutlined />}
                    />
                )}

                {/* Acknowledgment Notice */}
                <Alert
                    message="Acknowledgment Required"
                    description="The user must acknowledge receipt of these changes. The issuance will be marked as 'Pending Acknowledgment' until confirmed."
                    type="info"
                    showIcon
                />
            </Space>
        </Modal>
    );
};

export default IssuanceConfirmationModal;
