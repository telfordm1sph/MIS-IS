import React, { useMemo, useState } from "react";
import { Table, Spin, Card } from "antd";
import { usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import DetailsDrawer from "@/Components/drawer/DetailsDrawer";
import axios from "axios";
import dayjs from "dayjs";
const HardwareTable = () => {
    const { hardware, pagination, pageSizeOptions } = usePage().props;

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
    ];

    const paginationConfig = useMemo(
        () => ({
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            pageSizeOptions,
            showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} items`,
        }),
        [pagination, pageSizeOptions],
    );

    const getFieldGroups = (item) => {
        if (!item) return [];

        const hardwareFields = [
            { label: "Hostname", value: item.hostname || "-" },
            { label: "Brand", value: item.brand || "-" },
            { label: "Model", value: item.model || "-" },
            { label: "Category", value: item.category || "-" },
            { label: "Serial Number", value: item.serial_number || "-" },
        ];

        const hardwarePartsFields =
            item.parts?.map((p) => ({
                label: p.part_type,
                value: `${p.brand} ${p.model}${p.serial_number ? ` (${p.serial_number})` : ""} [${p.status}]`,
            })) || [];

        const softwareFields =
            item.software?.map((s) => ({
                label: s.inventory?.software_name,
                value: `Version: ${s.inventory?.version || "-"} (Installed on ${dayjs(s.installation_date).format("MMM DD, YYYY")}) - License: ${s.license?.license_key || "-"}`,
            })) || [];

        return [
            {
                title: "Hardware Specifications",
                column: 2,
                fields: hardwareFields,
            },
            { title: "Parts", column: 2, fields: hardwarePartsFields },
            { title: "Software", column: 2, fields: softwareFields },
        ];
    };

    return (
        <AuthenticatedLayout>
            <Card title="Hardware List" bordered style={{ margin: "16px" }}>
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
