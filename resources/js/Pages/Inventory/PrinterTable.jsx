import React, { useState } from "react";
import { usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";

import {
    Plus,
    Pencil,
    Trash2,
    History,
    EllipsisVertical,
    Search,
} from "lucide-react";

import { useInventoryFilters } from "@/Hooks/useInventoryFilters";
import { useFormDrawer } from "@/Hooks/useFormDrawer";
import { useLogsModal } from "@/Hooks/useLogsModal";
import { useCrudOperations } from "@/Hooks/useCrudOperations";

import FormDrawer from "@/Components/Drawer/FormDrawer";
import ActivityLogsModal from "@/Components/inventory/ActivityLogsModal";
import { DeleteConfirm } from "@/Components/DeleteConfirm";
import TablePagination from "@/Components/TablePagination";
const COLUMNS = [
    "ID",
    "Printer Name",
    "Type",
    "Brand & Model",
    "Serial Number",
    "Location",
    "Status",
];

const PrinterTable = () => {
    const { printers, pagination, filters, emp_data } = usePage().props;

    const [deleteTarget, setDeleteTarget] = useState(null);

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

    const { searchText, handleSearch, handleTableChange } = useInventoryFilters(
        {
            filters,
            pagination,
            routeName: "printers.index",
        },
    );

    const { handleSave, handleDelete } = useCrudOperations({
        updateRoute: "printers.update",
        storeRoute: "printers.store",
        deleteRoute: "printers.destroy",
        updateSuccessMessage: "Printer updated successfully!",
        createSuccessMessage: "Printer created successfully!",
        deleteSuccessMessage: "Printer deleted successfully!",
        reloadProps: ["printers"],
    });

    const handleFormSave = async (values) => {
        const payload = {
            ...values,
            employee_id: emp_data?.emp_id,
        };

        const result = await handleSave(payload, values.id || null);
        if (result?.success) closeForm();
    };

    const getStatusVariant = (status) => {
        if (status === 1) return "default";
        if (status === 2) return "secondary";
        return "outline";
    };

    const fields = [
        { name: "id", label: "ID", hidden: true },
        {
            name: "printer_name",
            label: "Printer Name",
            rules: [{ required: true }],
        },
        { name: "ip_address", label: "IP Address" },
        { name: "printer_type", label: "Printer Type" },
        { name: "printer_category", label: "Category" },
        { name: "location", label: "Location" },
        { name: "brand", label: "Brand" },
        { name: "model", label: "Model" },
        { name: "serial_number", label: "Serial Number" },
        { name: "dpi", label: "DPI (Resolution)" },
        { name: "category_status", label: "Category Status" },
        { name: "toner", label: "Toner/Ink Type" },
        { name: "supplier", label: "Supplier" },
        {
            name: "status",
            label: "Status",
            type: "select",
            options: [
                { value: 1, label: "Active" },
                { value: 2, label: "Inactive" },
            ],
        },
    ];

    return (
        <AuthenticatedLayout>
            <div className="px-4 sm:px-6 lg:px-8 py-4 space-y-4">
                {/* Top Bar */}
                <div className="flex items-center justify-between">
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/">MIS-IS</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Printers</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>

                    <Button size="sm" onClick={openCreate} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add Printer
                    </Button>
                </div>

                {/* Main Card */}
                <Card className="shadow-sm border-border/60 flex flex-col h-[calc(100vh-12rem)]">
                    <CardHeader className="pb-0 pt-4 px-4 flex-shrink-0">
                        <div className="flex items-center justify-between gap-4">
                            <h2 className="text-lg font-semibold">
                                Printer Inventory
                            </h2>

                            <div className="relative w-72">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                <Input
                                    placeholder="Search printer name, brand, model, IP..."
                                    value={searchText ?? ""}
                                    onChange={handleSearch}
                                    className="pl-8 h-9 text-sm"
                                />
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0 mt-3 flex-1 overflow-hidden flex flex-col">
                        {/* ── Scrollable Table Container ── */}
                        <div className="flex-1 overflow-auto relative">
                            <Table className="h-full">
                                <TableHeader className="sticky top-0 z-30 bg-background">
                                    <TableRow className="border-border/60 hover:bg-transparent">
                                        {COLUMNS.map((col) => (
                                            <TableHead className="bg-background text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                                {col}
                                            </TableHead>
                                        ))}
                                        <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-background text-right w-12">
                                            Actions
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>

                                <TableBody>
                                    {!printers?.length ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={8}
                                                className="h-32 text-center text-muted-foreground"
                                            >
                                                No printer records found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        printers.map((record) => (
                                            <TableRow key={record.id}>
                                                <TableCell className="font-mono text-xs">
                                                    {record.id}
                                                </TableCell>

                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">
                                                            {
                                                                record.printer_name
                                                            }
                                                        </span>
                                                        {record.ip_address && (
                                                            <span className="text-xs text-muted-foreground">
                                                                IP:{" "}
                                                                {
                                                                    record.ip_address
                                                                }
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>

                                                <TableCell>
                                                    {record.printer_type || "-"}
                                                </TableCell>

                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">
                                                            {record.brand ||
                                                                "N/A"}
                                                        </span>
                                                        {record.model && (
                                                            <span className="text-xs text-muted-foreground">
                                                                {record.model}
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>

                                                <TableCell>
                                                    {record.serial_number ||
                                                        "-"}
                                                </TableCell>
                                                <TableCell>
                                                    {record.location || "-"}
                                                </TableCell>

                                                <TableCell>
                                                    <Badge
                                                        variant={getStatusVariant(
                                                            record.status,
                                                        )}
                                                    >
                                                        {record.status == 1
                                                            ? "Active"
                                                            : "Inactive"}
                                                    </Badge>
                                                </TableCell>

                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger
                                                            asChild
                                                        >
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                            >
                                                                <EllipsisVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem
                                                                onClick={() =>
                                                                    openEdit(
                                                                        record,
                                                                    )
                                                                }
                                                            >
                                                                <Pencil className="h-4 w-4 mr-2" />
                                                                Edit
                                                            </DropdownMenuItem>

                                                            <DropdownMenuItem
                                                                onClick={() =>
                                                                    openLogs(
                                                                        record.id,
                                                                    )
                                                                }
                                                            >
                                                                <History className="h-4 w-4 mr-2" />
                                                                View Logs
                                                            </DropdownMenuItem>

                                                            <DropdownMenuSeparator />

                                                            <DropdownMenuItem
                                                                className="text-destructive"
                                                                onClick={() =>
                                                                    setDeleteTarget(
                                                                        record.id,
                                                                    )
                                                                }
                                                            >
                                                                <Trash2 className="h-4 w-4 mr-2" />
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        <div className="border-t px-4 flex-shrink-0">
                            <TablePagination
                                pagination={pagination}
                                onChange={(page) =>
                                    handleTableChange({ current: page }, {}, {})
                                }
                            />
                        </div>
                    </CardContent>
                </Card>

                <DeleteConfirm
                    open={!!deleteTarget}
                    onOpenChange={(v) => !v && setDeleteTarget(null)}
                    onConfirm={() => {
                        handleDelete(deleteTarget, {
                            employee_id: emp_data?.emp_id,
                        });
                        setDeleteTarget(null);
                    }}
                />

                <FormDrawer
                    open={formDrawerOpen}
                    onClose={closeForm}
                    title={editingItem ? "Edit Printer" : "Add Printer"}
                    mode={editingItem ? "edit" : "create"}
                    initialValues={editingItem}
                    fields={fields}
                    onSubmit={handleFormSave}
                />

                <ActivityLogsModal
                    visible={logsModalVisible}
                    onClose={closeLogs}
                    entityId={entityId}
                    entityType="Printer"
                    apiRoute="printers.logs"
                    title="Printer Changes"
                    actionColors={{
                        created: "green",
                        updated: "blue",
                        deleted: "red",
                    }}
                    perPage={10}
                />
            </div>
        </AuthenticatedLayout>
    );
};

export default PrinterTable;
