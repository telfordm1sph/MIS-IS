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

import { useInventoryFilters } from "@/Components/Hooks/useInventoryFilters";
import { useFormDrawer } from "@/Components/Hooks/useFormDrawer";
import { useLogsModal } from "@/Components/Hooks/useLogsModal";
import { useCrudOperations } from "@/Components/Hooks/useCrudOperations";
import { useTableConfig } from "@/Components/Hooks/useTableConfig";
import FormDrawer from "@/Components/Drawer/FormDrawer";
import ActivityLogsModal from "@/Components/inventory/ActivityLogsModal";

const PartsTable = () => {
    const { parts, pagination, filters } = usePage().props;

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
            routeName: "parts.table",
        });

    const { handleSave, handleDelete } = useCrudOperations({
        updateRoute: "parts.update",
        storeRoute: "parts.store",
        deleteRoute: "parts.destroy",
        updateSuccessMessage: "Part updated successfully!",
        createSuccessMessage: "Part created successfully!",
        deleteSuccessMessage: "Part deleted successfully!",
        reloadProps: ["parts"],
    });

    // ✅ Wrapper for handleSave to close form on success
    const handleFormSave = async (values, id) => {
        const result = await handleSave(values, id);
        if (result?.success) {
            closeForm();
        }
    };

    // 🔹 Flatten the nested `part` object for the table
    const flattenedParts = useMemo(
        () =>
            parts.map((p) => ({
                id: p.id,
                part_type: p.part?.part_type || "",
                brand: p.part?.brand || "",
                model: p.part?.model || "",
                specifications: p.part?.specifications || "",
                quantity: p.quantity,
                condition: p.condition,
                location: p.location,
                remarks: p.remarks,
                reorder_level: p.reorder_level,
                reorder_quantity: p.reorder_quantity,
                unit_cost: p.unit_cost,
                supplier: p.supplier,
            })),
        [parts],
    );

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
                title: "Part Type",
                dataIndex: "part_type",
                key: "part_type",
                sorter: true,
            },
            {
                title: "Brand",
                dataIndex: "brand",
                key: "brand",
                sorter: true,
            },
            {
                title: "Model",
                dataIndex: "model",
                key: "model",
                sorter: true,
            },
            {
                title: "Specifications",
                dataIndex: "specifications",
                key: "specifications",
            },
            {
                title: "Quantity",
                dataIndex: "quantity",
                key: "quantity",
                sorter: true,
            },
            {
                title: "Condition",
                dataIndex: "condition",
                key: "condition",
                sorter: true,
                width: 120,
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
                                    title="Delete this part?"
                                    description="This action cannot be undone."
                                    onConfirm={() => handleDelete(record.id)}
                                    okText="Yes"
                                    cancelText="No"
                                    okButtonProps={{ danger: true }}
                                >
                                    <span style={{ color: "#ff4d4f" }}>
                                        Delete
                                    </span>
                                </Popconfirm>
                            ),
                            icon: (
                                <DeleteOutlined style={{ color: "#ff4d4f" }} />
                            ),
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
        {
            name: "part_type",
            label: "Part Type",
            rules: [{ required: true, message: "Part type is required" }],
        },
        {
            name: "brand",
            label: "Brand",
            rules: [{ required: true, message: "Brand is required" }],
        },
        { name: "model", label: "Model" },
        { name: "specifications", label: "Specifications" },
        {
            name: "quantity",
            label: "Quantity",
            type: "number",
            rules: [{ required: true, message: "Quantity is required" }],
        },
        {
            name: "condition",
            label: "Condition",
            type: "select",
            placeholder: "Select condition",
            rules: [{ required: true, message: "Condition is required" }],
            options: [
                { label: "New", value: "New" },
                { label: "Used", value: "Used" },
                { label: "Defective", value: "Defective" },
            ],
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
                        { title: "Parts Inventory" },
                    ]}
                    style={{ marginBottom: 0 }}
                />
                <Button
                    type="primary"
                    icon={<PlusCircleOutlined />}
                    onClick={openCreate}
                >
                    Add Part
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
                            Parts Inventory
                        </span>
                        <Input
                            placeholder="Search part type, brand, model..."
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
                    dataSource={flattenedParts}
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
                    title={editingItem ? "Edit Part" : "Add Part"}
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
                    entityType="Part"
                    apiRoute="parts.logs"
                    title="Part Changes"
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

export default PartsTable;
