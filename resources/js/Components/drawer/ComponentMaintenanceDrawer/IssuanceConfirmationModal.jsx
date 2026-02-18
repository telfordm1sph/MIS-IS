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
    DesktopOutlined,
    UserOutlined,
    WarningOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

const IssuanceConfirmationModal = ({
    visible,
    onCancel,
    onConfirm,
    hardware,
    operations = {},
    action,
    employeeData,
    loading = false,
}) => {
    const handleConfirm = () => {
        onConfirm(employeeData?.emp_id || employeeData);
    };

    const getOperationsArray = () => {
        if (!operations) return [];
        switch (action) {
            case "replace":
                return operations.replacements || [];
            case "add":
                return operations.components || [];
            case "remove":
                return operations.components_to_remove || [];
            default:
                return [];
        }
    };

    const operationsArray = getOperationsArray();

    const stats = {
        total: operationsArray.length,
        adds: action === "add" ? operationsArray.length : 0,
        removes: action === "remove" ? operationsArray.length : 0,
        replaces: action === "replace" ? operationsArray.length : 0,
    };

    const componentTypeColors = { part: "blue", software: "green" };
    const operationConfig = {
        add: { icon: <PlusCircleOutlined />, color: "green", text: "Add" },
        remove: { icon: <DeleteOutlined />, color: "red", text: "Remove" },
        replace: { icon: <SwapOutlined />, color: "orange", text: "Replace" },
    };

    const tableData = operationsArray.map((op, index) => {
        const type = op?.component_type || op?.componentType;
        const isPart = type === "part";

        const oldCompName = op?.component_to_replace
            ? isPart
                ? `${op?.replacement_brand || ""} ${op?.replacement_model || ""} - ${op?.replacement_specifications || ""}`
                : `${op?.replacement_software_name || ""} ${op?.replacement_version || ""}`
            : "-";

        const newCompName = (() => {
            if (op?.operation === "remove") return "-";
            if (op?.operation === "add") {
                return isPart
                    ? `${op?.new_brand || ""} ${op?.new_model || ""} - ${op?.new_specifications || ""}`
                    : `${op?.new_software_name || ""} ${op?.new_version || ""}`;
            }
            return isPart
                ? `${op?.replacement_brand || ""} ${op?.replacement_model || ""} - ${op?.replacement_specifications || ""}`
                : `${op?.replacement_software_name || ""} ${op?.replacement_version || ""}`;
        })();

        return {
            key: index,
            operation: op?.operation || action,
            componentType: type,
            oldComponent: oldCompName,
            oldCondition: op?.old_component_condition,
            newComponent: newCompName,
            newCondition: op?.replacement_condition || op?.new_condition,
            reason: op?.reason,
            remarks: op?.remarks,
            oldComponentId: op?.component_to_replace || op?.component_id,
            newComponentId:
                op?.replacement_serial_number || op?.new_serial_number,
        };
    });

    const columns = [
        {
            title: "Operation",
            dataIndex: "operation",
            key: "operation",
            render: (op) => {
                const cfg = operationConfig[op] || {};
                return (
                    <Tag icon={cfg.icon} color={cfg.color}>
                        {cfg.text}
                    </Tag>
                );
            },
        },
        {
            title: "Component Type",
            dataIndex: "componentType",
            key: "componentType",
            render: (t) => (
                <Tag color={componentTypeColors[t] || "default"}>
                    {t?.toUpperCase()}
                </Tag>
            ),
        },
        {
            title: "Old Component",
            key: "oldComponent",
            render: (_, rec) => (
                <Space direction="vertical" size={0}>
                    <Text strong>{rec.oldComponentId || "-"}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {rec.oldComponent || "N/A"}
                    </Text>
                    {rec.oldCondition && (
                        <Tag
                            color={
                                rec.oldCondition === "working" ? "green" : "red"
                            }
                            size="small"
                        >
                            {rec.oldCondition}
                        </Tag>
                    )}
                </Space>
            ),
        },
        {
            title: "New Component",
            key: "newComponent",
            render: (_, rec) => (
                <Space direction="vertical" size={0}>
                    <Text strong>{rec.newComponentId || "New"}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {rec.newComponent || "N/A"}
                    </Text>
                    {rec.newCondition && (
                        <Tag color="green" size="small">
                            {rec.newCondition}
                        </Tag>
                    )}
                </Space>
            ),
        },
        {
            title: "Reason/Remarks",
            key: "remarks",
            width: 200,
            render: (_, rec) => (
                <Space direction="vertical" size={0}>
                    {rec.reason && (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            <Text strong>Reason:</Text> {rec.reason}
                        </Text>
                    )}
                    {rec.remarks && (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            <Text strong>Remarks:</Text> {rec.remarks}
                        </Text>
                    )}
                </Space>
            ),
        },
    ];

    return (
        <Modal
            title={
                <Space>
                    <CheckCircleOutlined style={{ color: "#52c41a" }} /> Confirm
                    Hardware Maintenance Issuance
                </Space>
            }
            open={visible}
            onCancel={onCancel}
            onOk={handleConfirm}
            confirmLoading={loading}
            okText="Confirm & Create Issuance"
            cancelText="Review Changes"
            width={1000}
            style={{ top: 20 }}
        >
            <Space direction="vertical" size="large" style={{ width: "100%" }}>
                {/* Hardware Info */}
                <Card
                    size="small"
                    title={
                        <Space>
                            <DesktopOutlined /> Hardware Information
                        </Space>
                    }
                >
                    <Row gutter={[16, 16]}>
                        <Col span={8}>
                            <Statistic
                                title="Hostname"
                                value={hardware?.hostname || "N/A"}
                                prefix={<DesktopOutlined />}
                            />
                        </Col>
                        <Col span={8}>
                            <Statistic
                                title="Location"
                                value={hardware?.location || "N/A"}
                            />
                        </Col>
                        <Col span={8}>
                            <Statistic
                                title="Department"
                                value={hardware?.department || "N/A"}
                            />
                        </Col>
                    </Row>
                    <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                        <Col span={12}>
                            <Statistic
                                title="Brand/Model"
                                value={`${hardware?.brand || ""} ${hardware?.model || ""}`}
                            />
                        </Col>
                        <Col span={12}>
                            <Statistic
                                title="Serial Number"
                                value={hardware?.serial_number || "N/A"}
                            />
                        </Col>
                    </Row>
                </Card>

                {/* Issuance Details */}
                <Card
                    size="small"
                    title={
                        <Space>
                            <UserOutlined /> Issuance Details
                        </Space>
                    }
                >
                    <Descriptions column={2} size="small" layout="vertical">
                        <Descriptions.Item label="Issued To" span={2}>
                            <Text strong>{hardware?.issued_to || "N/A"}</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Issuance Date">
                            {new Date().toLocaleDateString()}
                        </Descriptions.Item>
                        <Descriptions.Item label="Status">
                            <Tag color="warning">Pending Acknowledgment</Tag>
                        </Descriptions.Item>
                    </Descriptions>
                </Card>

                {/* Stats */}
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

                {/* Table */}
                {operationsArray.length > 0 && (
                    <>
                        <Title level={5}>Component Changes</Title>
                        <Table
                            columns={columns}
                            dataSource={tableData}
                            pagination={false}
                            size="small"
                            bordered
                            scroll={{ x: 800 }}
                        />
                    </>
                )}

                {/* Warnings */}
                {stats.removes > 0 && (
                    <Alert
                        description={`${stats.removes} component(s) will be removed from this hardware.`}
                        type="warning"
                        showIcon
                        icon={<WarningOutlined />}
                    />
                )}
                <Alert
                    description="The user must acknowledge receipt of these changes. The issuance will be marked as 'Pending Acknowledgment' until confirmed."
                    type="info"
                    showIcon
                />
            </Space>
        </Modal>
    );
};

export default IssuanceConfirmationModal;
