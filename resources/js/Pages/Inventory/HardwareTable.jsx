import React, { useCallback, useMemo, useState } from "react";
import { usePage } from "@inertiajs/react";
import { router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {
    Breadcrumb,
    Card,
    Table,
    Tag,
    Button,
    Dropdown,
    Tooltip,
    Avatar,
} from "antd";
import {
    PlusCircleOutlined,
    EyeOutlined,
    EditOutlined,
    HistoryOutlined,
    SwapOutlined,
    UpCircleOutlined,
} from "@ant-design/icons";
import {
    ClipboardPlus,
    ClipboardPlusIcon,
    EllipsisVertical,
} from "lucide-react";
import dayjs from "dayjs";

import { useInventoryFilters } from "@/Hooks/useInventoryFilters";
import { useDrawer } from "@/Hooks/useDrawer";
import { useFormDrawer } from "@/Hooks/useFormDrawer";
import { useLogsModal } from "@/Hooks/useLogsModal";
import { useCrudOperations } from "@/Hooks/useCrudOperations";
import { useTableConfig } from "@/Hooks/useTableConfig";
import { ITEM_CONFIG } from "@/Config/itemConfig";
import InventoryHeaderWithFilters from "@/Components/inventory/InventoryHeaderWithFilters";
import DetailsDrawer from "@/Components/drawer/DetailsDrawer";
import HardwareFormDrawer from "@/Components/drawer/HardwareFormDrawer";
import CategoryBadge from "@/Components/inventory/CategoryBadge";
import ActivityLogsModal from "@/Components/inventory/ActivityLogsModal";
import axios from "axios";
import ComponentMaintenanceDrawer from "@/Components/drawer/ComponentMaintenanceDrawer";

const HardwareTable = () => {
    const { hardware, pagination, categoryCounts, filters, emp_data } =
        usePage().props;
    console.log(usePage().props);

    const { drawerOpen, selectedItem, openDrawer, closeDrawer } = useDrawer();

    const {
        isOpen: formDrawerOpen,
        editingItem,
        openCreate,
        openEdit,
        close: closeForm,
        employeeOptions,
        departmentOptions,
        locationOptions,
        prodLineOptions,
        stationOptions,
        loadingOptions,
    } = useFormDrawer();

    const {
        isVisible: logsModalVisible,
        entityId,
        open: openLogs,
        close: closeLogs,
    } = useLogsModal();
    const [maintenanceDrawerOpen, setMaintenanceDrawerOpen] = useState(false);
    const [selectedHardware, setSelectedHardware] = useState(null);
    const {
        searchText,
        category,
        subCategory,
        handleSearch,
        handleCategoryChange,
        handleSubCategoryChange,
        handleResetFilters,
        handleTableChange,
    } = useInventoryFilters({
        filters,
        pagination,
        routeName: "hardware.table",
    });

    const { handleSave } = useCrudOperations({
        updateRoute: "hardware.update",
        storeRoute: "hardware.store",
        updateSuccessMessage: "Hardware updated successfully!",
        createSuccessMessage: "Hardware created successfully!",
        reloadProps: ["hardware"],
    });

    const handleFormSave = async (values) => {
        const id = values.id || null;

        const payload = {
            ...values,
            employee_id: emp_data?.emp_id,
        };
        console.log("payload", payload, id);

        const result = await handleSave(payload, id);
        if (result?.success) {
            closeForm();
        }
    };

    // Helper function to fetch hardware details
    const fetchHardwareDetails = async (id) => {
        try {
            const [partsRes, softwareRes] = await Promise.all([
                axios.get(route("hardware.parts.list", id)),
                axios.get(route("hardware.software.list", id)),
            ]);

            return {
                parts: partsRes.data ?? [],
                software: softwareRes.data ?? [],
            };
        } catch (error) {
            console.error("Error fetching hardware details:", error);
            return { parts: [], software: [] };
        }
    };

    // ✅ Custom handleView to fetch parts and software
    const handleView = async (record) => {
        const partsSoftware = await fetchHardwareDetails(record.id);
        const item = {
            ...record,
            parts: partsSoftware.parts,
            software: partsSoftware.software,
        };
        openDrawer(item);
    };

    // ✅ Open maintenance drawer to choose action
    const handleOpenMaintenance = async (record) => {
        const partsSoftware = await fetchHardwareDetails(record.id);
        setSelectedHardware({
            ...record,
            parts: partsSoftware.parts,
            software: partsSoftware.software,
        });
        setMaintenanceDrawerOpen(true);
    };

    // ✅ Category renderer
    const renderCategory = useCallback((value, uppercase = false) => {
        const config = ITEM_CONFIG[value?.toLowerCase()] || ITEM_CONFIG.default;

        return (
            <CategoryBadge
                value={value}
                config={config}
                uppercase={uppercase}
            />
        );
    }, []);

    // Simple function to generate a consistent color from a string
    const stringToColor = (str) => {
        if (!str) return "#999";

        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }

        return `hsl(${Math.abs(hash) % 360}, 70%, 60%)`;
    };
    // ✅ Column definitions (page-specific)
    const columnDefinitions = useMemo(
        () => [
            {
                title: "ID",
                dataIndex: "id",
                key: "id",
                width: 80,
            },
            {
                title: "Hostname",
                dataIndex: "hostname",
                key: "hostname",
            },
            {
                title: "Brand",
                dataIndex: "brand",
                key: "brand",
            },
            {
                title: "Category",
                dataIndex: "category",
                key: "category",
                isCategory: true,
            },
            {
                title: "Location",
                dataIndex: "location_name",
                key: "location_name",
            },
            {
                title: "Issued To",
                dataIndex: "assignedUsers",
                key: "issued_to",
                render: (assignedUsers) => {
                    if (!assignedUsers?.length) return null;

                    return (
                        <Avatar.Group
                            max={{
                                count: 3,
                                style: {
                                    color: "#fff",
                                    backgroundColor: "#999",
                                },
                            }}
                        >
                            {assignedUsers.map((user) => (
                                <Tooltip
                                    title={user.fullName}
                                    key={user.EMPLOYID}
                                >
                                    <Avatar
                                        style={{
                                            backgroundColor: stringToColor(
                                                user.fullName,
                                            ),
                                            color: "#fff",
                                        }}
                                    >
                                        {user.initials}
                                    </Avatar>
                                </Tooltip>
                            ))}
                        </Avatar.Group>
                    );
                },
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
                width: 120,
                render: (_, record) => {
                    const items = [
                        {
                            key: "view",
                            label: "View Details",
                            onClick: () => handleView(record),
                            icon: <EyeOutlined style={{ color: "#1890ff" }} />,
                        },
                        {
                            key: "logs",
                            label: "View Logs",
                            onClick: () => openLogs(record.id),
                            icon: (
                                <HistoryOutlined style={{ color: "#faad14" }} />
                            ),
                        },
                        { type: "divider" },
                        {
                            key: "edit",
                            label: "Edit Hardware",
                            onClick: () => openEdit(record),
                            icon: <EditOutlined style={{ color: "#52c41a" }} />,
                        },
                        record.status == "1"
                            ? {
                                  key: "maintenance",
                                  label: "Component Issuance",
                                  onClick: () => handleOpenMaintenance(record),
                                  icon: (
                                      <ClipboardPlusIcon
                                          style={{ color: "#722ed1" }}
                                          width={10}
                                      />
                                  ),
                              }
                            : null,
                    ].filter(Boolean); // remove null entries

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
        [handleView, openLogs, openEdit, handleOpenMaintenance], // updated dependencies
    );

    // ✅ Table configuration from hook
    const { columns, paginationConfig } = useTableConfig({
        filters,
        pagination,
        renderCategory,
        columnDefinitions,
    });

    // ✅ Generate drawer field groups dynamically
    const getFieldGroups = (item) => {
        if (!item) return [];

        const hardwareFields = [
            { label: "Hostname", value: item.hostname || "-" },
            { label: "Brand", value: item.brand || "-" },
            { label: "Model", value: item.model || "-" },
            { label: "Category", value: item.category || "-" },
            { label: "Serial Number", value: item.serial_number || "-" },
            { label: "Processor", value: item.processor || "-" },
            { label: "Motherboard", value: item.motherboard || "-" },
            { label: "IP Address", value: item.ip_address || "-" },
            { label: "Wifi MAC", value: item.wifi_mac || "-" },
            { label: "LAN MAC", value: item.lan_mac || "-" },
            { label: "Department", value: item.department_name || "-" },
            { label: "Location", value: item.location_name || "-" },
            { label: "Product Line", value: item.prodline_name || "-" },
            { label: "Station", value: item.station_name || "-" },
            { label: "Installed By", value: item.installed_by || "-" },
            {
                label: "Status",
                value: {
                    value: item.status_label || "-",
                    color: item.status_color || "default",
                },
            },
            { label: "Issued To", value: item.issued_to_label || "-" },
        ];

        // Group parts by part_type
        const partsByType = {};
        item.parts?.forEach((p) => {
            const type = p.part_info?.part_type || "Part";
            if (!partsByType[type]) partsByType[type] = [];
            partsByType[type].push(p);
        });

        const partsSubGroups = Object.keys(partsByType).map((type) => {
            return {
                title: type,
                column: 2,
                fields: partsByType[type].map((p, idx) => ({
                    Brand: p.part_info?.brand || "-",
                    Model: p.part_info?.model || "N/A",
                    "Serial No.": p.serial_number || "-",
                    Details:
                        `${p.part_info?.specifications || ""} ${p.status ? `[${p.status}]` : ""}`.trim(),
                })),
            };
        });

        const softwareSubGroups =
            item.software?.map((s) => ({
                title: s.inventory?.software_name || "Software",
                column: 2,
                fields: [
                    { label: "Version", value: s.inventory?.version || "-" },
                    { label: "Type", value: s.inventory?.software_type ?? "-" },
                    {
                        label: "Installed On",
                        value: s.installation_date
                            ? dayjs(s.installation_date).format("MMM DD, YYYY")
                            : "-",
                    },
                    {
                        label: "License Key/Account User",
                        value:
                            s.license?.license_key ??
                            s.license?.account_user ??
                            "-",
                    },
                ],
            })) || [];

        return [
            {
                title: "Hardware Specifications",
                column: 2,
                fields: hardwareFields,
            },
            { title: "Parts", column: 2, subGroups: partsSubGroups },
            { title: "Software", column: 2, subGroups: softwareSubGroups },
        ];
    };

    // ✅ Form field groups (page-specific)
    const formFieldGroups = useMemo(
        () => [
            {
                title: "Hardware Specifications",
                column: 2,
                fields: [
                    {
                        key: "id",
                        dataIndex: "id",
                        type: "hidden",
                    },
                    {
                        key: "status",
                        label: "Status",
                        dataIndex: "status",
                        type: "select",
                        options: [
                            { label: "Active", value: 1 },
                            { label: "New", value: 2 },
                            { label: "Inactive", value: 3 },
                            { label: "Defective", value: 4 },
                        ],
                    },
                    {
                        key: "hostname",
                        label: "Host Name",
                        dataIndex: "hostname",
                        type: "input",
                    },
                    {
                        key: "model",
                        label: "Model",
                        dataIndex: "model",
                        type: "input",
                    },
                    {
                        key: "brand",
                        label: "Brand",
                        dataIndex: "brand",
                        type: "input",
                    },
                    {
                        key: "category",
                        label: "Category",
                        dataIndex: "category",
                        type: "select",
                        options: [
                            { label: "Desktop", value: "Desktop" },
                            { label: "Laptop", value: "Laptop" },
                            { label: "Server", value: "Server" },
                            {
                                label: "Network Device",
                                value: "Network Device",
                            },
                            { label: "Other", value: "Other" },
                        ],
                    },
                    {
                        key: "serial_number",
                        label: "Serial Number",
                        dataIndex: "serial_number",
                        type: "input",
                    },
                    {
                        key: "processor",
                        label: "Processor",
                        dataIndex: "processor",
                        type: "input",
                    },
                    {
                        key: "motherboard",
                        label: "Motherboard",
                        dataIndex: "motherboard",
                        type: "input",
                    },
                    {
                        key: "ip_address",
                        label: "IP Address",
                        dataIndex: "ip_address",
                        type: "input",
                    },
                    {
                        key: "wifi_mac",
                        label: "WiFi MAC Address",
                        dataIndex: "wifi_mac",
                        type: "input",
                    },
                    {
                        key: "lan_mac",
                        label: "LAN MAC Address",
                        dataIndex: "lan_mac",
                        type: "input",
                    },

                    {
                        key: "department",
                        label: "Department",
                        dataIndex: "department",
                        type: "select",
                        options: departmentOptions,
                        loading: loadingOptions,
                    },
                    {
                        key: "location",
                        label: "Location",
                        dataIndex: "location",
                        type: "select",
                        options: locationOptions,
                        loading: loadingOptions,
                    },
                    {
                        key: "prodline",
                        label: "Product Line",
                        dataIndex: "prodline",
                        type: "select",
                        options: prodLineOptions,
                        loading: loadingOptions,
                    },
                    {
                        key: "station",
                        label: "Station",
                        dataIndex: "station",
                        type: "select",
                        options: stationOptions,
                        loading: loadingOptions,
                    },
                    {
                        key: "assignedUsersIds",
                        label: "Issued To",
                        dataIndex: "assignedUsersIds",
                        type: "multiSelect",
                        options: employeeOptions,
                        loading: loadingOptions,
                    },
                ],
            },
            {
                title: "Hardware Parts",
                column: 1,
                fields: [
                    {
                        key: "parts",
                        label: "Hardware Part",
                        type: "dynamicList",
                        dataIndex: "parts",
                        subFields: [
                            {
                                key: "id",
                                dataIndex: "id",
                                type: "hidden",
                            },
                            {
                                key: "condition",
                                dataIndex: "condition",
                                type: "hidden",
                            },
                            {
                                key: "part_type",
                                label: "Part Type",
                                dataIndex: "part_type",
                                type: "input",
                            },
                            {
                                key: "brand",
                                label: "Brand",
                                dataIndex: "brand",
                                type: "input",
                            },
                            {
                                key: "model",
                                label: "Model",
                                dataIndex: "model",
                                type: "input",
                            },
                            {
                                key: "specifications",
                                label: "Specifications",
                                dataIndex: "specifications",
                                type: "input",
                            },
                            {
                                key: "serial_number",
                                label: "Serial Number",
                                dataIndex: "serial_number",
                                type: "input",
                            },
                        ],
                    },
                ],
            },
            {
                title: "Installed Software",
                column: 1,
                fields: [
                    {
                        key: "id",
                        dataIndex: "id",
                        type: "hidden",
                    },
                    {
                        key: "software",
                        label: "Software",
                        type: "dynamicList",
                        dataIndex: "software",
                        subFields: [
                            {
                                key: "software_name",
                                label: "Software Name",
                                dataIndex: "software_name",
                                type: "input",
                            },
                            {
                                key: "software_type",
                                label: "Software Type",
                                dataIndex: "software_type",
                                type: "input",
                            },
                            {
                                key: "version",
                                label: "Version",
                                dataIndex: "version",
                                type: "input",
                            },
                            {
                                key: "license_key",
                                label: "License Key",
                                dataIndex: "license_key",
                                type: "input",
                            },
                        ],
                    },
                ],
            },
        ],
        [
            departmentOptions,
            locationOptions,
            prodLineOptions,
            stationOptions,
            employeeOptions,
            loadingOptions,
        ],
    );
    const handleMaintenanceClose = () => {
        setMaintenanceDrawerOpen(false);
        setSelectedHardware(null);
    };

    const handleMaintenanceSave = (data) => {
        router.reload({ only: ["hardware"] });
    };
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
                        { title: "Hardware Inventory" },
                    ]}
                    style={{ marginBottom: 0 }}
                />
                <Button
                    type="primary"
                    icon={<PlusCircleOutlined />}
                    onClick={openCreate}
                >
                    Add Hardware
                </Button>
            </div>

            <Card
                title={
                    <InventoryHeaderWithFilters
                        title="Hardware Inventory"
                        categoryCounts={categoryCounts}
                        categoryConfig={ITEM_CONFIG}
                        searchText={searchText}
                        category={category}
                        subCategory={subCategory}
                        onSearchChange={handleSearch}
                        onCategoryChange={handleCategoryChange}
                        onSubCategoryChange={handleSubCategoryChange}
                        hasActiveFilters={
                            !!(category || searchText || subCategory)
                        }
                        onResetFilters={handleResetFilters}
                    />
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
                    dataSource={hardware}
                    rowKey="id"
                    pagination={paginationConfig}
                    onChange={handleTableChange}
                    onRow={() => ({ style: { cursor: "default" } })}
                    bordered
                    scroll={{ y: "70vh" }}
                />

                {/* View Drawer */}
                <DetailsDrawer
                    visible={drawerOpen}
                    fieldGroups={getFieldGroups(selectedItem)}
                    loading={false}
                    onClose={closeDrawer}
                />

                {/* Form Drawer */}
                <HardwareFormDrawer
                    open={formDrawerOpen}
                    onClose={closeForm}
                    item={editingItem}
                    onSave={handleFormSave}
                    fieldGroups={formFieldGroups}
                />
                <ComponentMaintenanceDrawer
                    open={maintenanceDrawerOpen}
                    onClose={handleMaintenanceClose}
                    hardware={selectedHardware}
                    onSave={handleMaintenanceSave}
                />
                {/* Activity Logs Modal */}
                <ActivityLogsModal
                    visible={logsModalVisible}
                    onClose={closeLogs}
                    entityId={entityId}
                    entityType="Hardware"
                    apiRoute="hardware.logs"
                    title="Hardware Changes"
                    actionColors={{
                        created: "green",
                        updated: "blue",
                        deleted: "red",
                        software_attached: "cyan",
                        software_detached: "orange",
                    }}
                    perPage={5}
                />
            </Card>
        </AuthenticatedLayout>
    );
};

export default HardwareTable;
