import { getPaginationConfig } from "@/Config/pagination";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import FormDrawer from "@/Components/Drawer/FormDrawer";
import { router, usePage } from "@inertiajs/react";
import { Card, Table, Button, Space, Popconfirm, message } from "antd";
import React, { useMemo, useState } from "react";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import axios from "axios";

const PartsTable = () => {
    const { parts, pagination } = usePage().props;
    console.log("Raw parts props:", usePage().props);

    const [drawerOpen, setDrawerOpen] = useState(false);
    const [mode, setMode] = useState("create");
    const [selectedRow, setSelectedRow] = useState(null);

    /** 🔹 Fields (condition is SELECT) */
    const fields = [
        { name: "part_type", label: "Part Type", rules: [{ required: true, message: "Part type is required" }] },
        { name: "brand", label: "Brand", rules: [{ required: true, message: "Brand is required" }] },
        { name: "model", label: "Model" },
        { name: "specifications", label: "Specifications" },
        { name: "quantity", label: "Quantity", type: "number", rules: [{ required: true }] },
        {
            name: "condition",
            label: "Condition",
            type: "select",
            placeholder: "Select condition",
            rules: [{ required: true }],
            options: [
                { label: "New", value: "New" },
                { label: "Used", value: "Used" },
                { label: "Defective", value: "Defective" },
            ],
        },
    ];

    const openCreate = () => {
        setMode("create");
        setSelectedRow(null);
        setDrawerOpen(true);
    };

    const openEdit = (record) => {
        setMode("edit");
        setSelectedRow(record);
        setDrawerOpen(true);
    };

    const handleSubmit = async (data) => {
        const payload = { ...data };
        if (mode === "edit" && selectedRow?.id) payload.id = selectedRow.id;

        console.log("Form values with ID:", payload);

        try {
            const response = payload.id
                ? await axios.put(route("parts.update", payload.id), payload)
                : await axios.post(route("parts.store"), payload);

            if (response.data.success) {
                message.success(payload.id ? "Part updated successfully!" : `Part created successfully! ID: ${response.data.id || ""}`);
                setDrawerOpen(false);
                router.reload({ only: ["parts"] });
            } else {
                message.error(response.data.message || "Operation failed");
            }
        } catch (error) {
            message.error(payload.id ? "Failed to update part. Please try again." : "Failed to create part. Please try again.");
            console.error("Part submission error:", error);
        }
    };

    const handleDelete = async (id, e) => {
        e?.stopPropagation();

        try {
            const response = await axios.delete(route("parts.destroy", id));
            if (response.data.success) {
                message.success("Part deleted successfully!");
                router.reload({ only: ["parts"] });
            } else {
                message.error(response.data.message || "Delete operation failed");
            }
        } catch (error) {
            message.error("Failed to delete part. Please try again.");
            console.error("Part deletion error:", error);
        }
    };

    // 🔹 Flatten the nested `part` object for the table
    const flattenedParts = parts.map(p => ({
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
    }));

    const columns = [
        { title: "ID", dataIndex: "id", key: "id" },
        { title: "Part Type", dataIndex: "part_type", key: "part_type" },
        { title: "Brand", dataIndex: "brand", key: "brand" },
        { title: "Model", dataIndex: "model", key: "model" },
        { title: "Specifications", dataIndex: "specifications", key: "specifications" },
        { title: "Quantity", dataIndex: "quantity", key: "quantity" },
        { title: "Condition", dataIndex: "condition", key: "condition" },
        {
            title: "Action",
            key: "action",
            align: "center",
            render: (_, record) => (
                <Space>
                    <Button type="link" icon={<EditOutlined />} onClick={() => openEdit(record)} />
                    <Popconfirm
                        title="Delete this part?"
                        description="This action cannot be undone."
                        onConfirm={() => handleDelete(record.id)}
                        onCancel={(e) => e?.stopPropagation()}
                        okText="Yes"
                        cancelText="No"
                        okButtonProps={{ danger: true }}
                    >
                        <Button type="link" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    const paginationConfig = useMemo(() => getPaginationConfig(pagination), [pagination]);

    return (
        <AuthenticatedLayout>
            <Card
                title="Parts Inventory"
                style={{ margin: "16px" }}
                extra={<Button type="primary" onClick={openCreate}><PlusOutlined /> Add Part</Button>}
            >
                <Table
                    columns={columns}
                    rowKey="id"
                    dataSource={flattenedParts} 
                    pagination={paginationConfig}
                    bordered
                    size="middle"
                />
            </Card>

            <FormDrawer
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                title={mode === "create" ? "Add Part" : "Edit Part"}
                mode={mode}
                initialValues={selectedRow}
                fields={fields}
                onSubmit={handleSubmit}
            />
        </AuthenticatedLayout>
    );
};

export default PartsTable;
