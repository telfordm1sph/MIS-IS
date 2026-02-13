import React, { useState, useEffect } from "react";
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
    Select,
    message,
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
} from "@ant-design/icons";
import axios from "axios";

const { Title, Text } = Typography;
const { Option } = Select;

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
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [employees, setEmployees] = useState([]);
    const [loadingEmployees, setLoadingEmployees] = useState(false);

    // Fetch employees when modal opens
    useEffect(() => {
        if (visible) {
            fetchEmployees();
        }
    }, [visible]);

    // Set default employee if emp_data is provided
    useEffect(() => {
        if (employeeData?.emp_id) {
            setSelectedEmployee(employeeData.emp_id);
        }
    }, [employeeData]);

    const fetchEmployees = async () => {
        setLoadingEmployees(true);
        try {
            // Try to fetch from API first
            const response = await axios.get(route("employees.list"));
            setEmployees(response.data);
        } catch (error) {
            console.error("Failed to fetch employees:", error);
            // Use dummy employee data as fallback
            const dummyEmployees = [
                { emp_id: "1705", emp_name: "John Doe", department: "IT" },
                { emp_id: "EMP002", emp_name: "Jane Smith", department: "HR" },
                {
                    emp_id: "EMP003",
                    emp_name: "Mike Johnson",
                    department: "Finance",
                },
                {
                    emp_id: "EMP004",
                    emp_name: "Sarah Williams",
                    department: "Operations",
                },
            ];

            // Include current employee data if available, otherwise use all dummy data
            if (employeeData) {
                setEmployees([employeeData, ...dummyEmployees]);
            } else {
                setEmployees(dummyEmployees);
            }
        } finally {
            setLoadingEmployees(false);
        }
    };

    const handleConfirm = () => {
        if (!selectedEmployee) {
            message.error("Please select an employee to issue to");
            return;
        }
        onConfirm(selectedEmployee);
    };

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
                if (record.operation === "add" || record.operation === "add")
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
                    <Space orientation="vertical" size={0}>
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

                // Handle add mode payload
                if (record.operation === "add") {
                    if (record.component_type === "part") {
                        componentName = `${record.new_brand || ""} ${record.new_model || ""} - ${record.new_specifications || ""}`;
                    } else {
                        componentName = `${record.new_software_name || record.new_sw_software_name || ""} ${record.new_version || record.new_sw_version || ""}`;
                    }

                    return (
                        <Space orientation="vertical" size={0}>
                            <Text strong>
                                {record.new_serial_number || "New"}
                            </Text>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                {componentName || "N/A"}
                            </Text>
                            {record.new_condition && (
                                <Tag color="green" size="small">
                                    {record.new_condition}
                                </Tag>
                            )}
                        </Space>
                    );
                }

                // Handle replace mode payload
                let componentDetails =
                    record.newComponentData || record.component_data;
                if (componentDetails) {
                    if (record.componentType === "part") {
                        componentName = `${componentDetails.new_brand || componentDetails.brand || ""} ${componentDetails.new_model || componentDetails.model || ""} - ${componentDetails.new_specifications || componentDetails.specifications || ""}`;
                    } else {
                        componentName = `${componentDetails.new_sw_software_name || componentDetails.software_name || ""} ${componentDetails.new_sw_version || componentDetails.version || ""}`;
                    }
                }

                return (
                    <Space orientation="vertical" size={0}>
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
                <Space orientation="vertical" size={0}>
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
    const tableData = operations.map((op, index) => {
        // For add mode
        if (action === "add") {
            return {
                key: index,
                operation: "add",
                componentType: op.component_type,
                component_type: op.component_type,
                new_brand: op.new_brand,
                new_model: op.new_model,
                new_specifications: op.new_specifications,
                new_serial_number: op.new_serial_number,
                new_condition: op.new_condition,
                new_software_name: op.new_software_name,
                new_version: op.new_version,
                reason: op.reason,
                remarks: op.remarks,
            };
        }

        // For replace mode
        else if (action === "replace") {
            return {
                key: index,
                operation: "replace",
                componentType: op.component_type,
                component_type: op.component_type,
                oldComponentId: op.component_to_replace,
                oldComponentData: op.old_component_data,
                oldCondition: op.old_component_condition,
                newComponentData: op,
                newComponentId: op.replacement_serial_number,
                newCondition: op.replacement_condition,
                reason: op.reason,
                remarks: op.remarks,
            };
        }

        // For remove mode
        else if (action === "remove") {
            return {
                key: index,
                operation: "remove",
                componentType: op.component_type,
                component_type: op.component_type,
                oldComponentId: op.component_id,
                oldComponentData: op.component_data,
                oldCondition: op.condition,
                reason: op.reason,
                remarks: op.remarks,
            };
        }

        return op;
    });

    // Calculate statistics
    const stats = {
        total: operations.length,
        adds: operations.filter(
            (op) => action === "add" || op.operation === "add",
        ).length,
        removes: operations.filter(
            (op) => action === "remove" || op.operation === "remove",
        ).length,
        replaces: operations.filter(
            (op) => action === "replace" || op.operation === "replace",
        ).length,
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
            onOk={handleConfirm}
            confirmLoading={loading}
            okText="Confirm & Create Issuance"
            cancelText="Review Changes"
            width={1000}
            style={{ top: 20 }}
        >
            <Space
                orientation="vertical"
                size="large"
                style={{ width: "100%" }}
            >
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
                            <UserOutlined />
                            Issuance Details
                        </Space>
                    }
                >
                    <Descriptions column={2} size="small" layout="vertical">
                        <Descriptions.Item label="Issued To" span={2}>
                            <Select
                                placeholder="Select employee"
                                style={{ width: "100%" }}
                                value={selectedEmployee}
                                onChange={setSelectedEmployee}
                                loading={loadingEmployees}
                                showSearch
                                optionFilterProp="children"
                                filterOption={(input, option) =>
                                    option.children
                                        .toLowerCase()
                                        .indexOf(input.toLowerCase()) >= 0
                                }
                            >
                                {employees.map((emp) => (
                                    <Option key={emp.emp_id} value={emp.emp_id}>
                                        {emp.emp_name} ({emp.emp_id})
                                        {emp.department &&
                                            ` - ${emp.department}`}
                                    </Option>
                                ))}
                            </Select>
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
                {operations.length > 0 && (
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
                )}

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
