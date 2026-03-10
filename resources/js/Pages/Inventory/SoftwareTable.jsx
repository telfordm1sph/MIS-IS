import React, { useMemo, useState } from "react";
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
    "Software Name",
    "Software Type",
    "Version",
    "Publisher",
    "Total Licenses",
];

const SoftwareTable = () => {
    const { softwares, pagination, filters, emp_data } = usePage().props;

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

    const {
        searchText,
        handleSearch,
        handleTableChange,
        handlePageSizeChange,
    } = useInventoryFilters({
        filters,
        pagination,
        routeName: "software.table",
    });

    const { handleSave, handleDelete } = useCrudOperations({
        updateRoute: "software.update",
        storeRoute: "software.store",
        deleteRoute: "software.destroy",
        updateSuccessMessage: "Software updated successfully!",
        createSuccessMessage: "Software created successfully!",
        deleteSuccessMessage: "Software deleted successfully!",
        reloadProps: ["softwares"],
    });

    const handleFormSave = async (values) => {
        const result = await handleSave(values, values.id || null);
        if (result?.success) closeForm();
    };

    const fields = [
        { name: "id", label: "ID", hidden: true },
        {
            name: "software_name",
            label: "Software Name",
            rules: [{ required: true, message: "Software name is required" }],
        },
        { name: "software_type", label: "Software Type" },
        { name: "version", label: "Version" },
        { name: "publisher", label: "Publisher" },
        {
            name: "total_licenses",
            label: "Total Licenses",
            type: "number",
            rules: [{ required: true, message: "Total licenses is required" }],
        },
    ];

    return (
        <AuthenticatedLayout>
            <div className="px-4 sm:px-6 lg:px-8 py-4 space-y-4">
                {/* ── Top bar ── */}
                <div className="flex items-center justify-between">
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/">MIS-IS</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>
                                    Software Inventory
                                </BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>

                    <Button size="sm" onClick={openCreate} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add Software
                    </Button>
                </div>

                {/* ── Main card ── */}
                <Card className="shadow-sm border-border/60 flex flex-col h-[calc(100vh-12rem)]">
                    <CardHeader className="pb-0 pt-4 px-4 flex-shrink-0">
                        <div className="flex items-center justify-between gap-4">
                            <h2 className="text-lg font-semibold text-foreground">
                                Software Inventory
                            </h2>
                            <div className="relative w-72">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                                <Input
                                    placeholder="Search software name, type, version..."
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
                                        {COLUMNS.map((col, index) => (
                                            <TableHead
                                                key={index}
                                                className="bg-background text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                                            >
                                                {col}
                                            </TableHead>
                                        ))}
                                        <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-background text-right w-12">
                                            Actions
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>

                                <TableBody>
                                    {!softwares?.length ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={7}
                                                className="h-32 text-center text-sm text-muted-foreground"
                                            >
                                                No software records found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        softwares.map((record) => (
                                            <TableRow
                                                key={record.id}
                                                className="border-border/40 hover:bg-muted/30 transition-colors"
                                            >
                                                <TableCell className="text-xs font-mono text-muted-foreground">
                                                    {record.id}
                                                </TableCell>
                                                <TableCell className="text-sm font-medium">
                                                    {record.software_name ||
                                                        "—"}
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {record.software_type ||
                                                        "—"}
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {record.version || "—"}
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {record.publisher || "—"}
                                                </TableCell>
                                                <TableCell className="text-sm tabular-nums">
                                                    {record.total_licenses ??
                                                        "—"}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger
                                                            asChild
                                                        >
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                                            >
                                                                <EllipsisVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent
                                                            align="end"
                                                            className="w-40"
                                                        >
                                                            <DropdownMenuItem
                                                                className="gap-2 cursor-pointer text-sm"
                                                                onClick={() =>
                                                                    openEdit(
                                                                        record,
                                                                    )
                                                                }
                                                            >
                                                                <Pencil className="h-3.5 w-3.5 text-emerald-500" />
                                                                Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                className="gap-2 cursor-pointer text-sm"
                                                                onClick={() =>
                                                                    openLogs(
                                                                        record.id,
                                                                    )
                                                                }
                                                            >
                                                                <History className="h-3.5 w-3.5 text-amber-500" />
                                                                View Logs
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                className="gap-2 cursor-pointer text-sm text-destructive focus:text-destructive focus:bg-destructive/10"
                                                                onClick={() =>
                                                                    setDeleteTarget(
                                                                        record.id,
                                                                    )
                                                                }
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
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

                        {/* ── Pagination ── */}
                        <div className="border-t border-border/40 px-4 flex-shrink-0">
                            <TablePagination
                                pagination={pagination}
                                onChange={(page) =>
                                    handleTableChange({ current: page }, {}, {})
                                }
                                onChangePerPage={(size) =>
                                    handlePageSizeChange(size)
                                }
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* ── Delete confirm ── */}
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

                {/* ── Form Drawer ── */}
                <FormDrawer
                    open={formDrawerOpen}
                    onClose={closeForm}
                    title={editingItem ? "Edit Software" : "Add Software"}
                    mode={editingItem ? "edit" : "create"}
                    initialValues={editingItem}
                    fields={fields}
                    onSubmit={handleFormSave}
                />

                {/* ── Activity Logs ── */}
                <ActivityLogsModal
                    visible={logsModalVisible}
                    onClose={closeLogs}
                    entityId={entityId}
                    entityType="Software"
                    apiRoute="software.logs"
                    title="Software Changes"
                    actionColors={{
                        created: "green",
                        updated: "blue",
                        deleted: "red",
                    }}
                    perPage={5}
                />
            </div>
        </AuthenticatedLayout>
    );
};

export default SoftwareTable;
