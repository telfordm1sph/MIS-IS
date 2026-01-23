import React, { useMemo, useState } from "react";
import { Table, Spin, Card, Tag, Button, Dropdown } from "antd";
import {
    PlusOutlined,
    MoreOutlined,
    EyeOutlined,
    EditOutlined,
} from "@ant-design/icons";
import { usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import DetailsDrawer from "@/Components/drawer/DetailsDrawer";
import axios from "axios";
import dayjs from "dayjs";
import { getPaginationConfig } from "@/Config/pagination";
import HardwareFormDrawer from "@/Components/drawer/HardwareFormDrawer";

const HardwareTable = () => {
    const { hardware, pagination, pageSizeOptions } = usePage().props;
    console.log(usePage().props);

    const [drawerVisible, setDrawerVisible] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [loading, setLoading] = useState(false);
    const [formDrawerOpen, setFormDrawerOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const fetchHardwareDetails = async (hostname) => {
        setLoading(true);
        try {
            const [partsRes, softwareRes] = await Promise.all([
                axios.get(route("hardware.parts.list", hostname)),
                axios.get(route("hardware.software.list", hostname)),
            ]);
            console.log("Parts", partsRes.data);
            console.log("Software", softwareRes.data);

            return {
                parts: partsRes.data ?? [],
                software: softwareRes.data ?? [],
            };
        } finally {
            setLoading(false);
        }
    };

    const closeForm = () => {
        setFormDrawerOpen(false);
        setEditingItem(null);
    };

    const handleFormSave = async (values, itemId) => {
        console.log("Form values:", values);
        // try {
        //     if (itemId) {
        //         await axios.put(route("hardware.update", itemId), values);
        //     } else {
        //         await axios.post(route("hardware.store"), values);
        //     }
        //     closeForm();
        //     window.location.reload();
        // } catch (error) {
        //     console.error("Error saving hardware:", error);
        // }
    };

const handleEdit = async (record) => {
    const partsSoftware = await fetchHardwareDetails(record.hostname);

    // Flatten hardware parts
    const partsFlattened = partsSoftware.parts.map((p) => ({
        part_type: p.part_info?.part_type || "",
        brand: p.part_info?.brand || "",
        model: p.part_info?.model || "",
        specifications: p.part_info?.specifications || "",
        serial_number: p.serial_number || "",
    }));

    // Flatten software objects
    const softwareFlattened = partsSoftware.software.map((s) => ({
        ...s,
        software_name: s.inventory?.software_name || "",
        software_type: s.inventory?.software_type || s.software_type || "",
        version: s.inventory?.version || s.version || "",
        license_key: s.license?.license_key || s.license_key || "",
    }));

    const item = {
        ...record,
        parts: partsFlattened,
        software: softwareFlattened,
    };

    setEditingItem(item);
    setFormDrawerOpen(true);
};


    const handleView = async (record) => {
        setLoading(true);
        try {
            const partsSoftware = await fetchHardwareDetails(record.hostname);
            const item = {
                ...record,
                parts: partsSoftware.parts,
                software: partsSoftware.software,
            };
            setSelectedItem(item);
            setDrawerVisible(true);
        } finally {
            setLoading(false);
        }
    };

    const handleAddNew = () => {
        setEditingItem(null);
        setFormDrawerOpen(true);
    };

    const columns = [
        { title: "ID", dataIndex: "id", key: "id", width: 80 },
        { title: "Hostname", dataIndex: "hostname", key: "hostname" },
        { title: "Brand", dataIndex: "brand", key: "brand" },
        { title: "Category", dataIndex: "category", key: "category" },
        { title: "Location", dataIndex: "location", key: "location" },
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
                // Create menu items for the dropdown
                const items = [
                    {
                        key: "view",
                        label: "View Details",
                        icon: <EyeOutlined />,
                        onClick: () => handleView(record),
                    },
                    {
                        key: "edit",
                        label: "Edit",
                        icon: <EditOutlined />,
                        onClick: () => handleEdit(record),
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
                            icon={<MoreOutlined />}
                            style={{ marginLeft: -8 }}
                        />
                    </Dropdown>
                );
            },
        },
    ];

    const paginationConfig = useMemo(
        () => getPaginationConfig(pagination),
        [pagination],
    );

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
            Details: `${p.part_info?.specifications || ""} ${p.status ? `[${p.status}]` : ""}`.trim(),
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
                        label: "License Key",
                        value: s.license?.license_key ?? "N/A",
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

    const formFieldGroups = [
        {
            title: "Assignment Details",
            column: 2,
            fields: [
                {
                    key: "issued_to_label",
                    label: "Issued To",
                    dataIndex: "issued_to_label",
                    type: "input",
                    editable: false,
                },
                {
                    key: "issued_to",
                    dataIndex: "issued_to",
                    type: "hidden",
                },
                {
                    key: "location",
                    label: "Location",
                    dataIndex: "location",
                    type: "input",
                    editable: false,
                },
                {
                    key: "date_issued",
                    label: "Issued Date",
                    dataIndex: "date_issued",
                    type: "date",
                    editable: false,
                },
            ],
        },
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
        {
            title: "Additional Information",
            column: 1,
            fields: [
                {
                    key: "remarks",
                    label: "Notes",
                    dataIndex: "remarks",
                    type: "textarea",
                },
            ],
        },
    ];

    return (
        <AuthenticatedLayout>
            <Card
                title="Hardware List"
                style={{ margin: "16px" }}
                extra={
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleAddNew}
                    >
                        Add Hardware
                    </Button>
                }
            >
                <Table
                    columns={columns}
                    dataSource={hardware}
                    rowKey="id"
                    pagination={paginationConfig}
                    bordered
                    scroll={{ y: "70vh" }}
                />
            </Card>

            <DetailsDrawer
                visible={drawerVisible}
                fieldGroups={getFieldGroups(selectedItem)}
                loading={loading}
                onClose={() => {
                    setDrawerVisible(false);
                    setSelectedItem(null);
                }}
            />
            <HardwareFormDrawer
                open={formDrawerOpen}
                onClose={closeForm}
                item={editingItem}
                onSave={handleFormSave}
                fieldGroups={formFieldGroups}
            />
        </AuthenticatedLayout>
    );
};

export default HardwareTable;
