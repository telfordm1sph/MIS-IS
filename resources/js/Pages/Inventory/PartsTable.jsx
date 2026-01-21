import { getPaginationConfig } from "@/Config/pagination";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { usePage } from "@inertiajs/react";
import { Card, Table } from "antd";
import React, { useMemo } from "react";

const PartsTable = () => {
    const { parts, pagination, filters } = usePage().props;
    console.log(usePage().props);
    const columns = [
        {
            title: "ID",
            dataIndex: "id",
            key: "id",
        },
        {
            title: "Part Type",
            dataIndex: "part_type",
            key: "part_type",
        },
        {
            title: "Brand",
            dataIndex: "brand",
            key: "brand",
        },
        {
            title: "Model",
            dataIndex: "model",
            key: "model",
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
        },
        {
            title: "Condition",
            dataIndex: "condition",
            key: "condition",
        },
    ];
    const paginationConfig = useMemo(
        () => getPaginationConfig(pagination),
        [pagination],
    );
    return (
        <AuthenticatedLayout>
            <Card title="Parts Inventory" style={{ margin: "16px" }}>
                <Table
                    columns={columns}
                    rowKey="id"
                    dataSource={parts}
                    pagination={paginationConfig}
                    bordered
                    size="middle"
                />
            </Card>
        </AuthenticatedLayout>
    );
};

export default PartsTable;
