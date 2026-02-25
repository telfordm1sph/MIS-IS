import React, { useCallback, useMemo } from "react";
import { usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {
    Breadcrumb,
    Card,
    Table,
    Button,
    Dropdown,
    Space,
    Popconfirm,
    Input,
    Tag,
    Typography,
} from "antd";
import {
    PlusCircleOutlined,
    EditOutlined,
    DeleteOutlined,
    HistoryOutlined,
    SearchOutlined,
} from "@ant-design/icons";
import { EllipsisVertical } from "lucide-react";

import { useInventoryFilters } from "@/Hooks/useInventoryFilters";
import { useFormDrawer } from "@/Hooks/useFormDrawer";
import { useLogsModal } from "@/Hooks/useLogsModal";
import { useCrudOperations } from "@/Hooks/useCrudOperations";
import { useTableConfig } from "@/Hooks/useTableConfig";
import FormDrawer from "@/Components/Drawer/FormDrawer";
import ActivityLogsModal from "@/Components/inventory/ActivityLogsModal";
const { Text } = Typography;
const PromisTable = () => {
    const { promis, pagination, filters, emp_data } = usePage().props;
    console.log(usePage().props);

    const {
        isOpen: formDrawerOpen,
        editingItem,
        openCreate,
        openEdit,
        close: closeForm,
    } = useFormDrawer();

    const {
        isVisible: logsModalVisible,
        entityId,
        open: openLogs,
        close: closeLogs,
    } = useLogsModal();

    const { searchText, handleSearch, handleResetFilters, handleTableChange } =
        useInventoryFilters({
            filters,
            pagination,
            routeName: "promis.index",
        });

    const { handleSave, handleDelete } = useCrudOperations({
        updateRoute: "promis.update",
        storeRoute: "promis.store",
        deleteRoute: "promis.destroy",
        updateSuccessMessage: "Promis updated successfully!",
        createSuccessMessage: "Promis created successfully!",
        deleteSuccessMessage: "Promis deleted successfully!",
        reloadProps: ["promis"],
    });

    // ✅ Wrapper for handleSave to close form on success
    const handleFormSave = async (values) => {
        const id = values.id || null;

        const payload = {
            ...values,
            employee_id: emp_data?.emp_id,
        };

        const result = await handleSave(payload, id);
        if (result?.success) {
            closeForm();
        }
    };

    // ✅ Column definitions (page-specific)
    const columnDefinitions = useMemo(
        () => [
            {
                title: "ID",
                dataIndex: "id",
                key: "id",
                width: 80,
                sorter: true,
            },
            {
                title: "Promis Name",
                dataIndex: "promis_name",
                key: "promis_name",
                sorter: true,
                render: (text, record) => (
                    <Space orientation="vertical" size={0}>
                        <Text strong>{text}</Text>
                        {record.ip_address && (
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                IP: {record.ip_address}
                            </Text>
                        )}
                    </Space>
                ),
            },

            {
                title: "Location",
                dataIndex: "location",
                key: "location",
                width: 150,
                sorter: true,
                render: (value) => (value ? value : "-"),
            },
            {
                title: "Model Name",
                dataIndex: "model_name",
                key: "model_name",
                sorter: true,
            },
            {
                title: "Monitor",
                dataIndex: "monitor",
                key: "monitor",
                sorter: true,
            },
            {
                title: "Status",
                key: "status",
                render: (_, record) => (
                    <Tag color={record.status_color}>{record.status_label}</Tag>
                ),
            },
            {
                title: "Actions",
                key: "actions",
                width: 100,
                align: "center",
                render: (_, record) => {
                    const items = [
                        {
                            key: "edit",
                            label: "Edit",
                            onClick: () => openEdit(record),
                            icon: <EditOutlined />,
                        },
                        {
                            key: "logs",
                            label: "View Logs",
                            onClick: () => openLogs(record.id),
                            icon: <HistoryOutlined />,
                        },
                        {
                            type: "divider",
                        },
                        {
                            key: "delete",
                            label: (
                                <Popconfirm
                                    title="Delete this Promis?"
                                    description="This action cannot be undone."
                                    onConfirm={() =>
                                        handleDelete(record.id, {
                                            employee_id: emp_data?.emp_id,
                                        })
                                    }
                                    okText="Yes"
                                    cancelText="No"
                                    okButtonProps={{ danger: true }}
                                >
                                    <span>Delete</span>
                                </Popconfirm>
                            ),
                            icon: <DeleteOutlined />,
                            danger: true,
                        },
                    ];

                    return (
                        <Dropdown
                            menu={{ items }}
                            trigger={["click"]}
                            placement="bottomRight"
                        >
                            <Button
                                type="text"
                                icon={<EllipsisVertical className="w-5 h-5" />}
                            />
                        </Dropdown>
                    );
                },
            },
        ],
        [openEdit, openLogs, handleDelete],
    );

    // ✅ Table configuration from hook
    const { columns, paginationConfig } = useTableConfig({
        filters,
        pagination,
        columnDefinitions,
    });

    /** 🔹 Form Fields */
    const fields = [
        { name: "id", label: "ID", hidden: true },
        {
            name: "promis_name",
            label: "Promis Name",
            rules: [{ required: true, message: "Promis name is required" }],
            placeholder: "Enter Promis name",
        },
        {
            name: "ip_address",
            label: "IP Address",
            placeholder: "Enter IP address (e.g., 192.168.1.100)",
        },
        {
            name: "location",
            label: "Location",
            placeholder: "Enter location",
        },
        {
            name: "model_name",
            label: "Model Name",
            placeholder: "Enter Model Name",
        },
        {
            name: "monitor",
            label: "Monitor",
            placeholder: "Enter Monitor",
        },
        {
            name: "mouse",
            label: "Mouse",
            placeholder: "Enter Mouse",
        },
        {
            name: "keyboard",
            label: "Keyboard",
            placeholder: "Enter Keyboard",
        },
        {
            name: "scanner",
            label: "Scanner",
            placeholder: "Enter Scanner",
        },
        {
            name: "badge_no",
            label: "Badge No",
            placeholder: "Enter Badge No",
        },
        {
            name: "status",
            label: "Status",
            type: "select",
            options: [
                { value: 1, label: "Active" },
                { value: 2, label: "Spare" },
                { value: 3, label: "Defective" },
            ],
            placeholder: "Select status",
        },
    ];

    return (
        <AuthenticatedLayout>
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "16px",
                }}
            >
                <Breadcrumb
                    items={[
                        { title: "MIS-IS", href: "/" },
                        { title: "Promis" },
                    ]}
                    style={{ marginBottom: 0 }}
                />
                <Button
                    type="primary"
                    icon={<PlusCircleOutlined />}
                    onClick={openCreate}
                >
                    Add Promis
                </Button>
            </div>

            <Card
                title={
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "16px",
                        }}
                    >
                        <span style={{ fontSize: "18px", fontWeight: 600 }}>
                            Promis
                        </span>
                        <div style={{ marginLeft: "auto" }}>
                            <Input
                                placeholder="Search Promis name, model name, IP..."
                                allowClear
                                value={searchText}
                                prefix={<SearchOutlined />}
                                onChange={handleSearch}
                                style={{
                                    width: "300px",
                                    borderRadius: 8,
                                }}
                            />
                        </div>
                    </div>
                }
                variant="outlined"
                style={{
                    borderRadius: 8,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                    marginBottom: 24,
                }}
            >
                <Table
                    columns={columns}
                    dataSource={promis}
                    rowKey="id"
                    pagination={paginationConfig}
                    onChange={handleTableChange}
                    onRow={() => ({ style: { cursor: "default" } })}
                    bordered
                    scroll={{ y: "70vh" }}
                />

                {/* Form Drawer */}
                <FormDrawer
                    open={formDrawerOpen}
                    onClose={closeForm}
                    title={editingItem ? "Edit Promis" : "Add Promis"}
                    mode={editingItem ? "edit" : "create"}
                    initialValues={editingItem}
                    fields={fields}
                    onSubmit={handleFormSave}
                />

                {/* Activity Logs Modal */}
                <ActivityLogsModal
                    visible={logsModalVisible}
                    onClose={closeLogs}
                    entityId={entityId}
                    entityType="Promis"
                    apiRoute="promis.logs"
                    title="Promis Changes"
                    actionColors={{
                        created: "green",
                        updated: "blue",
                        deleted: "red",
                    }}
                    perPage={10}
                />
            </Card>
        </AuthenticatedLayout>
    );
};

export default PromisTable;
