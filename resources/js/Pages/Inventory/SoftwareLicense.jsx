import React, { useCallback, useMemo, useEffect, useState } from "react";
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
    message,
} from "antd";
import {
    PlusCircleOutlined,
    EditOutlined,
    DeleteOutlined,
    HistoryOutlined,
    SearchOutlined,
} from "@ant-design/icons";
import { EllipsisVertical } from "lucide-react";
import dayjs from "dayjs";
import axios from "axios";

import { useInventoryFilters } from "@/Components/Hooks/useInventoryFilters";
import { useFormDrawer } from "@/Components/Hooks/useFormDrawer";
import { useLogsModal } from "@/Components/Hooks/useLogsModal";
import { useCrudOperations } from "@/Components/Hooks/useCrudOperations";
import { useTableConfig } from "@/Components/Hooks/useTableConfig";
import FormDrawer from "@/Components/Drawer/FormDrawer";
import ActivityLogsModal from "@/Components/inventory/ActivityLogsModal";

const SoftwareLicense = () => {
    const { licenses, pagination, filters } = usePage().props;

    const [softwareOptions, setSoftwareOptions] = useState([]);
    const [loadingOptions, setLoadingOptions] = useState(false);

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
            routeName: "licenses.table",
        });

    const { handleSave, handleDelete } = useCrudOperations({
        updateRoute: "licenses.update",
        storeRoute: "licenses.store",
        deleteRoute: "licenses.destroy",
        updateSuccessMessage: "Software license updated successfully!",
        createSuccessMessage: "Software license created successfully!",
        deleteSuccessMessage: "Software license deleted successfully!",
        reloadProps: ["licenses"],
    });

    // Fetch software options when component mounts
    useEffect(() => {
        fetchSoftwareOptions();
    }, []);

    const fetchSoftwareOptions = async () => {
        setLoadingOptions(true);
        try {
            const response = await axios.get(
                route("software.inventory.options"),
            );
            setSoftwareOptions(response.data);
        } catch (error) {
            console.error("Failed to fetch software options:", error);
            message.error("Failed to load software options");
        } finally {
            setLoadingOptions(false);
        }
    };

    // ✅ Custom openEdit to handle date conversion
    const handleEditClick = (record) => {
        const editData = {
            ...record,
            subscription_start: record.subscription_start
                ? dayjs(record.subscription_start)
                : null,
            subscription_end: record.subscription_end
                ? dayjs(record.subscription_end)
                : null,
        };
        openEdit(editData);
    };

    // ✅ Wrapper for handleSave to close form on success and handle date conversion
    const handleFormSave = async (values, id) => {
        // Convert dayjs dates to strings
        const payload = {
            ...values,
            subscription_start: values.subscription_start
                ? dayjs(values.subscription_start).format("YYYY-MM-DD")
                : null,
            subscription_end: values.subscription_end
                ? dayjs(values.subscription_end).format("YYYY-MM-DD")
                : null,
        };

        const result = await handleSave(payload, id);
        if (result?.success) {
            closeForm();
        }
    };

    // Helper function to check if license is expiring soon
    const isExpiringSoon = useCallback((endDate, reminderDays) => {
        if (!endDate || !reminderDays) return false;
        const today = dayjs();
        const expiry = dayjs(endDate);
        const daysUntilExpiry = expiry.diff(today, "days");
        return daysUntilExpiry <= reminderDays && daysUntilExpiry >= 0;
    }, []);

    // Helper function to check if license is expired
    const isExpired = useCallback((endDate) => {
        if (!endDate) return false;
        return dayjs(endDate).isBefore(dayjs(), "day");
    }, []);

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
                title: "Software",
                dataIndex: ["software", "software_name"],
                key: "software_name",
                sorter: true,
                render: (text, record) => (
                    <div>
                        <div style={{ fontWeight: 500 }}>
                            {record.software?.software_name || "N/A"}
                        </div>
                        <div style={{ fontSize: "12px", color: "#888" }}>
                            {record.software?.software_type || ""}{" "}
                            {record.software?.version &&
                                `• v${record.software.version}`}
                        </div>
                    </div>
                ),
            },
            {
                title: "License Key / Account",
                key: "identifier",
                render: (_, record) => {
                    if (record.license_key) {
                        return (
                            <div>
                                <Tag color="blue">License Key</Tag>
                                <div style={{ marginTop: 4, fontSize: "12px" }}>
                                    {record.license_key}
                                </div>
                            </div>
                        );
                    }
                    if (record.account_user) {
                        return (
                            <div>
                                <Tag color="green">Account</Tag>
                                <div style={{ marginTop: 4, fontSize: "12px" }}>
                                    {record.account_user}
                                </div>
                            </div>
                        );
                    }
                    return <span style={{ color: "#999" }}>N/A</span>;
                },
            },
            {
                title: "Activations",
                key: "activations",
                align: "center",
                render: (_, record) => {
                    const current = record.current_activations || 0;
                    const max = record.max_activations;
                    const available = max ? max - current : "∞";

                    return (
                        <div>
                            <div style={{ fontWeight: 500 }}>
                                {current} / {max || "∞"}
                            </div>
                            {max && (
                                <div
                                    style={{ fontSize: "11px", color: "#888" }}
                                >
                                    {available} available
                                </div>
                            )}
                        </div>
                    );
                },
            },
            {
                title: "Subscription Period",
                key: "subscription",
                sorter: true,
                render: (_, record) => {
                    if (
                        !record.subscription_start &&
                        !record.subscription_end
                    ) {
                        return <span style={{ color: "#999" }}>Perpetual</span>;
                    }

                    const expired = isExpired(record.subscription_end);
                    const expiringSoon = isExpiringSoon(
                        record.subscription_end,
                        record.renewal_reminder_days,
                    );

                    return (
                        <div>
                            <div style={{ fontSize: "12px" }}>
                                {record.subscription_start
                                    ? dayjs(record.subscription_start).format(
                                          "MMM D, YYYY",
                                      )
                                    : "N/A"}{" "}
                                -{" "}
                                {record.subscription_end
                                    ? dayjs(record.subscription_end).format(
                                          "MMM D, YYYY",
                                      )
                                    : "N/A"}
                            </div>
                            {expired && (
                                <Tag color="red" style={{ marginTop: 4 }}>
                                    Expired
                                </Tag>
                            )}
                            {!expired && expiringSoon && (
                                <Tag color="orange" style={{ marginTop: 4 }}>
                                    Expiring Soon
                                </Tag>
                            )}
                            {!expired &&
                                !expiringSoon &&
                                record.subscription_end && (
                                    <Tag color="green" style={{ marginTop: 4 }}>
                                        Active
                                    </Tag>
                                )}
                        </div>
                    );
                },
            },
            {
                title: "Cost",
                dataIndex: "cost_per_license",
                key: "cost_per_license",
                align: "right",
                sorter: true,
                render: (cost) =>
                    cost ? `₱${parseFloat(cost).toFixed(2)}` : "N/A",
            },
            {
                title: "Actions",
                key: "actions",
                width: 100,
                align: "center",
                fixed: "right",
                render: (_, record) => {
                    const items = [
                        {
                            key: "edit",
                            label: "Edit",
                            onClick: () => handleEditClick(record),
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
                                    title="Delete this license?"
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
        [handleEditClick, openLogs, handleDelete, isExpired, isExpiringSoon],
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
            name: "software_inventory_id",
            label: "Software",
            type: "select",
            rules: [{ required: true, message: "Software is required" }],
            options: softwareOptions,
            placeholder: "Select software",
            showSearch: true,
            loading: loadingOptions,
            filterOption: (input, option) =>
                (option?.label ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase()),
        },
        {
            name: "license_key",
            label: "License Key",
            placeholder: "Enter license key",
        },
        {
            name: "account_user",
            label: "Account Username",
            placeholder: "Enter account username",
        },
        {
            name: "account_password",
            label: "Account Password",
            type: "password",
            placeholder: "Enter account password",
        },
        {
            name: "max_activations",
            label: "Max Activations",
            type: "number",
            min: 0,
            placeholder: "Maximum number of activations",
        },
        {
            name: "current_activations",
            label: "Current Activations",
            type: "number",
            min: 0,
            placeholder: "Current number of activations",
            initialValue: 0,
        },
        {
            name: "subscription_start",
            label: "Subscription Start Date",
            type: "date",
        },
        {
            name: "subscription_end",
            label: "Subscription End Date",
            type: "date",
        },
        {
            name: "renewal_reminder_days",
            label: "Renewal Reminder (Days)",
            type: "number",
            min: 0,
            placeholder: "Days before expiry to remind",
        },
        {
            name: "cost_per_license",
            label: "Cost Per License",
            type: "number",
            min: 0,
            step: 0.01,
            placeholder: "Enter cost per license",
        },
        {
            name: "remarks",
            label: "Remarks",
            type: "textarea",
            placeholder: "Enter any additional notes",
            rows: 3,
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
                        { title: "Software Licenses" },
                    ]}
                    style={{ marginBottom: 0 }}
                />
                <Button
                    type="primary"
                    icon={<PlusCircleOutlined />}
                    onClick={openCreate}
                >
                    Add License
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
                            Software Licenses
                        </span>
                        <Input
                            placeholder="Search software, license key, account..."
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
                    dataSource={licenses}
                    rowKey="id"
                    pagination={paginationConfig}
                    onChange={handleTableChange}
                    onRow={() => ({ style: { cursor: "default" } })}
                    bordered
                    scroll={{ x: 1200, y: "70vh" }}
                />

                {/* Form Drawer */}
                <FormDrawer
                    open={formDrawerOpen}
                    onClose={closeForm}
                    title={editingItem ? "Edit License" : "Add License"}
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
                    entityType="SoftwareLicense"
                    apiRoute="licenses.logs"
                    title="License Changes"
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

export default SoftwareLicense;
