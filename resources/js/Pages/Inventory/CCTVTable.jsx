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
const CCTVTable = () => {
    const { cctvs, pagination, filters, emp_data } = usePage().props;
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
            routeName: "cctv.index",
        });

    const { handleSave, handleDelete } = useCrudOperations({
        updateRoute: "cctv.update",
        storeRoute: "cctv.store",
        deleteRoute: "cctv.destroy",
        updateSuccessMessage: "CCTV updated successfully!",
        createSuccessMessage: "CCTV created successfully!",
        deleteSuccessMessage: "CCTV deleted successfully!",
        reloadProps: ["cctv"],
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
                title: "CCTV Name",
                dataIndex: "camera_name",
                key: "camera_name",
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
                title: "Channel",
                dataIndex: "channel",
                key: "channel",
                width: 120,
                sorter: true,
            },
            {
                title: "Control No",
                dataIndex: "control_no",
                key: "control_no",
                width: 150,
                sorter: true,
                render: (value) => (value ? value : "-"),
            },
            {
                title: "Location",
                dataIndex: "location",
                key: "location",
                sorter: true,
            },
            {
                title: "Location IP",
                dataIndex: "location_ip",
                key: "location_ip",
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
                                    title="Delete this CCTV?"
                                    description="This action cannot be undone."
                                    onConfirm={() => handleDelete(record.id)}
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
            name: "camera_name",
            label: "CCTV Name",
            rules: [{ required: true, message: "CCTV name is required" }],
            placeholder: "Enter CCTV name",
        },
        {
            name: "channel",
            label: "Channel",
            placeholder: "Enter channel",
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
            name: "location_ip",
            label: "Location IP",
            placeholder: "Enter location IP",
        },
        {
            name: "control_no",
            label: "Control No",
            placeholder: "Enter control number",
        },
        {
            name: "status",
            label: "Status",
            type: "select",
            options: [
                { value: 1, label: "Active" },
                { value: 2, label: "Inactive" },
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
                    items={[{ title: "MIS-IS", href: "/" }, { title: "CCTVs" }]}
                    style={{ marginBottom: 0 }}
                />
                <Button
                    type="primary"
                    icon={<PlusCircleOutlined />}
                    onClick={openCreate}
                >
                    Add CCTV
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
                            Printers
                        </span>
                        <Input
                            placeholder="Search CCTV name, channel, IP..."
                            allowClear
                            value={searchText}
                            prefix={<SearchOutlined />}
                            onChange={handleSearch}
                            style={{ flex: 1, maxWidth: "400px" }}
                        />
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
                    dataSource={cctvs}
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
                    title={editingItem ? "Edit CCTV" : "Add CCTV"}
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
                    entityType="CCTV"
                    apiRoute="cctv.logs"
                    title="CCTV Changes"
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

export default CCTVTable;
