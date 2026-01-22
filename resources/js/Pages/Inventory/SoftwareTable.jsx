import { getPaginationConfig } from "@/Config/pagination";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { usePage } from "@inertiajs/react";
import { Card, Table } from "antd";
import React, { useMemo } from "react";

const PartsTable = () => {
    const { softwares, pagination, filters } = usePage().props;
    console.log(usePage().props);
    const columns = [
        {
            title: "ID",
            dataIndex: "id",
            key: "id",
        },
        {
            title: "Software Name",
            dataIndex: "software_name",
            key: "software_name",
        },
        {
            title: "Software Type",
            dataIndex: "software_type",
            key: "software_type",
        },
        {
            title: "Version",
            dataIndex: "version",
            key: "version",
        },
        {
            title: "Publisher",
            dataIndex: "publisher",
            key: "publisher",
        },
        {
            title: "Total Licenses",
            dataIndex: "total_licenses",
            key: "total_licenses",
        },
    ];
    const paginationConfig = useMemo(
        () => getPaginationConfig(pagination),
        [pagination],
    );
    return (
        <AuthenticatedLayout>
            <Card title="Software Inventory" style={{ margin: "16px" }}>
                <Table
                    columns={columns}
                    rowKey="id"
                    dataSource={softwares}
                    pagination={paginationConfig}
                    bordered
                    size="middle"
                />
            </Card>
        </AuthenticatedLayout>
    );
};

export default PartsTable;
