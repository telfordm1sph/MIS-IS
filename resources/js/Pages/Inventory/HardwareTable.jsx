import React, { useMemo, useState } from "react";
import { Table, Spin, Card, Tag } from "antd";
import { usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import DetailsDrawer from "@/Components/drawer/DetailsDrawer";
import axios from "axios";
import dayjs from "dayjs";
import { getPaginationConfig } from "@/Config/pagination";
const HardwareTable = () => {
    const { hardware, pagination, pageSizeOptions } = usePage().props;
    console.log(usePage().props);

    const [drawerVisible, setDrawerVisible] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchHardwareDetails = async (hostname) => {
        setLoading(true);
        try {
            const [partsRes, softwareRes] = await Promise.all([
                axios.get(route("hardware.parts.list", hostname)),
                axios.get(route("hardware.software.list", hostname)),
            ]);
            console.log("PArts", partsRes.data);
            console.log("Software", softwareRes.data);

            return {
                parts: partsRes.data ?? [],
                software: softwareRes.data ?? [],
            };
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        { title: "ID", dataIndex: "id", key: "id" },
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
            const type = p.part_type || "Part";
            if (!partsByType[type]) partsByType[type] = [];
            partsByType[type].push(p);
        });

        const partsSubGroups = Object.keys(partsByType).map((type) => {
            return {
                title: type,
                column: 2,
                fields: partsByType[type].map((p, idx) => ({
                    Brand: p.brand || "-",
                    Model: p.model || "N/A",
                    "Serial No.": p.serial_number || "-",
                    Details:
                        `${p.specifications || ""} ${p.status ? `[${p.status}]` : ""}`.trim(),
                })),
            };
        });

        const softwareSubGroups =
            item.software?.map((s) => ({
                title: s.inventory?.software_name || "Software",
                column: 2,
                fields: [
                    { label: "Version", value: s.inventory?.version || "-" },
                    {
                        label: "Installed On",
                        value: dayjs(s.installation_date).format(
                            "MMM DD, YYYY",
                        ),
                    },
                    {
                        label: "License Key",
                        value: s.license?.license_key || "-",
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

    return (
        <AuthenticatedLayout>
            <Card title="Hardware List" style={{ margin: "16px" }}>
                <Table
                    columns={columns}
                    dataSource={hardware}
                    rowKey="id"
                    pagination={paginationConfig}
                    onRow={(record) => ({
                        onClick: async () => {
                            setDrawerVisible(true);
                            const partsSoftware = await fetchHardwareDetails(
                                record.hostname,
                            );

                            const item = {
                                ...record,
                                parts: partsSoftware.parts,
                                software: partsSoftware.software,
                            };
                            setSelectedItem(item);
                        },
                        style: { cursor: "pointer" },
                    })}
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
        </AuthenticatedLayout>
    );
};

export default HardwareTable;
