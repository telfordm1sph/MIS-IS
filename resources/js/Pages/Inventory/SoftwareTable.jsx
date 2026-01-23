import { getPaginationConfig } from "@/Config/pagination";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import FormDrawer from "@/Components/Drawer/FormDrawer";
import { router, usePage } from "@inertiajs/react";
import { Card, Table, Button, Space, Popconfirm, message } from "antd";
import React, { useMemo, useState } from "react";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";

const SoftwareTable = () => {
    const { softwares, pagination } = usePage().props;

    const [drawerOpen, setDrawerOpen] = useState(false);
    const [mode, setMode] = useState("create"); // create | edit
    const [selectedRow, setSelectedRow] = useState(null);

    /** 🔹 Fields inside this file */
    const fields = [
        {
            name: "software_name",
            label: "Software Name",
            rules: [{ required: true, message: "Software name is required" }],
        },
        {
            name: "software_type",
            label: "Software Type",
        },
        {
            name: "version",
            label: "Version",
        },
        {
            name: "publisher",
            label: "Publisher",
        },
        {
            name: "total_licenses",
            label: "Total Licenses",
            type: "number",
            rules: [{ required: true }],
        },
    ];

    // Open drawer for creating new software
    const openCreate = () => {
        setMode("create");
        setSelectedRow(null);
        setDrawerOpen(true);
    };

    // Open drawer for editing existing software
    const openEdit = (record) => {
        setMode("edit");
        setSelectedRow(record);
        setDrawerOpen(true);
    };

    const handleSubmit = async (data) => {
        const payload = { ...data };

        // Add id if editing
        if (mode === "edit" && selectedRow?.id) {
            payload.id = selectedRow.id;
        }

        console.log("Form values with ID:", payload);

        try {
            let response;
            if (payload.id) {
                response = await axios.put(
                    route("software.update", payload.id),
                    payload,
                );
            } else {
                response = await axios.post(route("software.store"), payload);
            }

            if (response.data.success) {
                message.success(
                    payload.id
                        ? "Software updated successfully!"
                        : `Software created successfully! ID: ${response.data.id || ""}`,
                );
                setDrawerOpen(false);
                router.reload({ only: ["softwares"] });
            } else {
                message.error(response.data.message || "Operation failed");
            }
        } catch (error) {
            message.error(
                payload.id
                    ? "Failed to update software. Please try again."
                    : "Failed to create software. Please try again.",
            );
            console.error("Software submission error:", error);
        }
    };

    const handleDelete = async (id, e) => {
        // Stop propagation to prevent row click
        e?.stopPropagation();

        try {
            const response = await axios.delete(route("software.destroy", id));

            if (response.data.success) {
                message.success("Software deleted successfully!");
                router.reload({ only: ["softwares"] });
            } else {
                message.error(
                    response.data.message || "Delete operation failed",
                );
            }
        } catch (error) {
            message.error("Failed to delete software. Please try again.");
            console.error("Request type deletion error:", error);
        }
    };

    const columns = [
        { title: "ID", dataIndex: "id", key: "id" },
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
        { title: "Version", dataIndex: "version", key: "version" },
        { title: "Publisher", dataIndex: "publisher", key: "publisher" },
        {
            title: "Total Licenses",
            dataIndex: "total_licenses",
            key: "total_licenses",
        },
        {
            title: "Action",
            key: "action",
            align: "center",
            render: (_, record) => (
                <Space>
                    <Button
                        type="link"
                        icon={<EditOutlined />}
                        onClick={() => openEdit(record)}
                    />
                    <Popconfirm
                        title="Delete this software?"
                        description="This action cannot be undone."
                        onConfirm={() => handleDelete(record.id)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button type="link" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    const paginationConfig = useMemo(
        () => getPaginationConfig(pagination),
        [pagination],
    );

    return (
        <AuthenticatedLayout>
            <Card
                title="Software Inventory"
                style={{ margin: "16px" }}
                extra={
                    <Button type="primary" onClick={openCreate}>
                        <PlusOutlined /> Add Software
                    </Button>
                }
            >
                <Table
                    columns={columns}
                    rowKey="id"
                    dataSource={softwares}
                    pagination={paginationConfig}
                    bordered
                    size="middle"
                />
            </Card>

            <FormDrawer
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                title={mode === "create" ? "Add Software" : "Edit Software"}
                mode={mode}
                initialValues={mode === "create" ? {} : selectedRow} // <-- Fix for create mode
                fields={fields}
                onSubmit={handleSubmit}
            />
        </AuthenticatedLayout>
    );
};

export default SoftwareTable;
