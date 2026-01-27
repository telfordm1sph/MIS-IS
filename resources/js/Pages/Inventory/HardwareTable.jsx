import React, { useCallback, useMemo } from "react";
import { usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Breadcrumb, Card, Table, Tag, Button, Dropdown } from "antd";
import {
    PlusCircleOutlined,
    EyeOutlined,
    EditOutlined,
    HistoryOutlined,
} from "@ant-design/icons";
import { EllipsisVertical } from "lucide-react";
import dayjs from "dayjs";

import { useInventoryFilters } from "@/Components/Hooks/useInventoryFilters";
import { useDrawer } from "@/Components/Hooks/useDrawer";
import { useFormDrawer } from "@/Components/Hooks/useFormDrawer";
import { useLogsModal } from "@/Components/Hooks/useLogsModal";
import { useCrudOperations } from "@/Components/Hooks/useCrudOperations";
import { useTableConfig } from "@/Components/Hooks/useTableConfig";
import { ITEM_CONFIG } from "@/Config/itemConfig";
import InventoryHeaderWithFilters from "@/Components/inventory/InventoryHeaderWithFilters";
import DetailsDrawer from "@/Components/drawer/DetailsDrawer";
import HardwareFormDrawer from "@/Components/drawer/HardwareFormDrawer";
import CategoryBadge from "@/Components/inventory/CategoryBadge";
import ActivityLogsModal from "@/Components/inventory/ActivityLogsModal";
import axios from "axios";

const HardwareTable = () => {
    const { hardware, pagination, categoryCounts, filters } = usePage().props;

    const { drawerOpen, selectedItem, openDrawer, closeDrawer } = useDrawer();

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

    // Helper function to fetch hardware details
    const fetchHardwareDetails = async (hostname) => {
        try {
            const [partsRes, softwareRes] = await Promise.all([
                axios.get(route("hardware.parts.list", hostname)),
                axios.get(route("hardware.software.list", hostname)),
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

    // ✅ Wrapper for handleSave to close form on success
    const handleFormSave = async (values, id) => {
        const result = await handleSave(values, id);
        if (result?.success) {
            closeForm();
        }
    };

    // ✅ Custom handleView to fetch parts and software
    const handleView = async (record) => {
        const partsSoftware = await fetchHardwareDetails(record.hostname);
        const item = {
            ...record,
            parts: partsSoftware.parts,
            software: partsSoftware.software,
        };
        openDrawer(item);
    };

    // ✅ Custom handleEdit to fetch and flatten parts and software
    const handleEditClick = async (record) => {
        const partsSoftware = await fetchHardwareDetails(record.hostname);

        // Flatten hardware parts
        const partsFlattened = partsSoftware.parts.map((p) => ({
            id: p.id,
            part_type: p.part_info?.part_type || "",
            brand: p.part_info?.brand || "",
            model: p.part_info?.model || "",
            specifications: p.part_info?.specifications || "",
            serial_number: p.serial_number || "",
        }));

        // Flatten software objects
        const softwareFlattened = partsSoftware.software.map((s) => ({
            ...s,
            id: s.id,
            software_name: s.inventory?.software_name || "",
            software_type: s.inventory?.software_type || s.software_type || "",
            version: s.inventory?.version || s.version || "",
            license_key: s.license?.license_key || null,
            account_user: s.license?.account_user || null,
            account_password: s.license?.account_password || null,
        }));

        const item = {
            ...record,
            parts: partsFlattened,
            software: softwareFlattened,
        };

        openEdit(item);
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
                dataIndex: "location",
                key: "location",
            },
            {
                title: "Issued To",
                dataIndex: "issued_to_label",
                key: "issued_to_label",
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
                render: (_, record) => {
                    const items = [
                        {
                            key: "view",
                            label: "View Details",
                            onClick: () => handleView(record),
                            icon: <EyeOutlined />,
                        },
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
        [openLogs],
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
            { label: "Issued To", value: item.issued_to_label || "-" },
            { label: "Department", value: item.department || "-" },
            { label: "Installed By", value: item.installed_by || "-" },
            {
                label: "Status",
                value: {
                    value: item.status_label || "-",
                    color: item.status_color || "default",
                },
            },
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
    const formFieldGroups = [
        {
            title: "Hardware Specifications",
            column: 2,
            fields: [
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
                    type: "input",
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
