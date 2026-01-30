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
const PrinterTable = () => {
    const { printers, pagination, filters, emp_data } = usePage().props;
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
            routeName: "printers.index",
        });

    const { handleSave, handleDelete } = useCrudOperations({
        updateRoute: "printers.update",
        storeRoute: "printers.store",
        deleteRoute: "printers.destroy",
        updateSuccessMessage: "Printer updated successfully!",
        createSuccessMessage: "Printer created successfully!",
        deleteSuccessMessage: "Printer deleted successfully!",
        reloadProps: ["printers"],
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
                title: "Printer Name",
                dataIndex: "printer_name",
                key: "printer_name",
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
                title: "Type",
                dataIndex: "printer_type",
                key: "printer_type",
                width: 120,
                sorter: true,
            },
            {
                title: "Brand & Model",
                key: "brand_model",
                render: (_, record) => (
                    <Space orientation="vertical" size={0}>
                        <Text strong>{record.brand || "N/A"}</Text>
                        {record.model && (
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                {record.model}
                            </Text>
                        )}
                    </Space>
                ),
            },
            {
                title: "Serial Number",
                dataIndex: "serial_number",
                key: "serial_number",
                ellipsis: true,
                sorter: true,
            },
            {
                title: "Location",
                dataIndex: "location",
                key: "location",
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
                                    title="Delete this printer?"
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
            name: "printer_name",
            label: "Printer Name",
            rules: [{ required: true, message: "Printer name is required" }],
            placeholder: "Enter printer name",
        },
        {
            name: "ip_address",
            label: "IP Address",
            placeholder: "Enter IP address (e.g., 192.168.1.100)",
        },
        {
            name: "printer_type",
            label: "Printer Type",
            type: "input",
            placeholder: "Enter printer type",
        },
        {
            name: "printer_category",
            label: "Category",
            type: "input",
            placeholder: "Enter category",
        },
        {
            name: "location",
            label: "Location",
            placeholder: "Enter location",
        },
        {
            name: "brand",
            label: "Brand",
            placeholder: "Enter brand (e.g., HP, Canon, Epson)",
        },
        {
            name: "model",
            label: "Model",
            placeholder: "Enter model number",
        },
        {
            name: "serial_number",
            label: "Serial Number",
            placeholder: "Enter serial number",
        },
        {
            name: "dpi",
            label: "DPI (Resolution)",
            placeholder: "Enter DPI (e.g., 1200x1200)",
        },
        {
            name: "category_status",
            label: "Category Status",
            placeholder: "Enter category status",
        },
        {
            name: "toner",
            label: "Toner/Ink Type",
            placeholder: "Enter toner or ink type",
        },
        {
            name: "supplier",
            label: "Supplier",
            placeholder: "Enter supplier name",
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
                    items={[
                        { title: "MIS-IS", href: "/" },
                        { title: "Printers" },
                    ]}
                    style={{ marginBottom: 0 }}
                />
                <Button
                    type="primary"
                    icon={<PlusCircleOutlined />}
                    onClick={openCreate}
                >
                    Add Printer
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
                            placeholder="Search printer name, brand, model, IP..."
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
                    dataSource={printers}
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
                    title={editingItem ? "Edit Printer" : "Add Printer"}
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
                    entityType="Printer"
                    apiRoute="printers.logs"
                    title="Printer Changes"
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

export default PrinterTable;
