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

const SoftwareTable = () => {
    const { softwares, pagination, filters } = usePage().props;

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
            routeName: "software.table",
        });

    const { handleSave, handleDelete } = useCrudOperations({
        updateRoute: "software.update",
        storeRoute: "software.store",
        deleteRoute: "software.destroy",
        updateSuccessMessage: "Software updated successfully!",
        createSuccessMessage: "Software created successfully!",
        deleteSuccessMessage: "Software deleted successfully!",
        reloadProps: ["softwares"],
    });

    // ✅ Wrapper for handleSave to close form on success
    const handleFormSave = async (values) => {
        const id = values.id || null; // extract id from form values

        const result = await handleSave(values, id); // call your CRUD hook
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
                title: "Software Name",
                dataIndex: "software_name",
                key: "software_name",
                sorter: true,
            },
            {
                title: "Software Type",
                dataIndex: "software_type",
                key: "software_type",
                sorter: true,
            },
            {
                title: "Version",
                dataIndex: "version",
                key: "version",
                sorter: true,
            },
            {
                title: "Publisher",
                dataIndex: "publisher",
                key: "publisher",
                sorter: true,
            },
            {
                title: "Total Licenses",
                dataIndex: "total_licenses",
                key: "total_licenses",
                sorter: true,
                width: 150,
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
                                    title="Delete this software?"
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
            name: "software_name",
            label: "Software Name",
            rules: [{ required: true, message: "Software name is required" }],
        },
        {
            name: "software_type",
            label: "Software Type",
        },
        {
            name: "version",
            label: "Version",
        },
        {
            name: "publisher",
            label: "Publisher",
        },
        {
            name: "total_licenses",
            label: "Total Licenses",
            type: "number",
            rules: [{ required: true, message: "Total licenses is required" }],
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
                        { title: "Software Inventory" },
                    ]}
                    style={{ marginBottom: 0 }}
                />
                <Button
                    type="primary"
                    icon={<PlusCircleOutlined />}
                    onClick={openCreate}
                >
                    Add Software
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
                            Software Inventory
                        </span>
                        <Input
                            placeholder="Search software name, type, version..."
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
                    dataSource={softwares}
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
                    title={editingItem ? "Edit Software" : "Add Software"}
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
                    entityType="Software"
                    apiRoute="software.logs"
                    title="Software Changes"
                    actionColors={{
                        created: "green",
                        updated: "blue",
                        deleted: "red",
                    }}
                    perPage={5}
                />
            </Card>
        </AuthenticatedLayout>
    );
};

export default SoftwareTable;
