import React, { useCallback, useMemo, useState } from "react";
import { usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { cn } from "@/lib/utils";
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
import { Badge } from "@/components/ui/badge";

import { useInventoryFilters } from "@/Hooks/useInventoryFilters";
import { useFormDrawer } from "@/Hooks/useFormDrawer";
import { useLogsModal } from "@/Hooks/useLogsModal";
import { useCrudOperations } from "@/Hooks/useCrudOperations";
import FormDrawer from "@/Components/Drawer/FormDrawer";
import ActivityLogsModal from "@/Components/inventory/ActivityLogsModal";
import TablePagination from "@/Components/TablePagination";
import { DeleteConfirm } from "@/Components/DeleteConfirm";

// ─── Main Component ───────────────────────────────────────────────────────────

const PromisTable = () => {
    const { promis, pagination, filters, emp_data } = usePage().props;

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
        routeName: "promis.table",
    });

    const { handleSave, handleDelete } = useCrudOperations({
        updateRoute: "promis.update",
        storeRoute: "promis.store",
        deleteRoute: "promis.destroy",
        updateSuccessMessage: "Promis updated successfully!",
        createSuccessMessage: "Promis created successfully!",
        deleteSuccessMessage: "Promis deleted successfully!",
        reloadProps: ["promis"],
    });

    const handleFormSave = async (values) => {
        const id = values.id || null;
        const payload = { ...values, employee_id: emp_data?.emp_id };
        const result = await handleSave(payload, id);
        if (result?.success) closeForm();
    };

    // Table column configuration
    const tableColumns = useMemo(
        () => [
            {
                key: "id",
                label: "ID",
                accessor: "id",
                className: "text-xs font-mono text-muted-foreground",
            },
            {
                key: "promis_name",
                label: "Promis Name",
                accessor: "promis_name",
                className: "text-sm font-medium",
                fallback: "—",
            },
            {
                key: "ip_address",
                label: "IP Address",
                accessor: "ip_address",
                className: "text-sm text-muted-foreground",
                fallback: "—",
            },
            {
                key: "location",
                label: "Location",
                accessor: "location",
                className: "text-sm text-muted-foreground",
                fallback: "—",
            },
            {
                key: "model_name",
                label: "Model Name",
                accessor: "model_name",
                className: "text-sm text-muted-foreground",
                fallback: "—",
            },
            {
                key: "monitor",
                label: "Monitor",
                accessor: "monitor",
                className: "text-sm text-muted-foreground",
                fallback: "—",
            },
            {
                key: "mouse",
                label: "Mouse",
                accessor: "mouse",
                className: "text-sm text-muted-foreground",
                fallback: "—",
            },
            {
                key: "keyboard",
                label: "Keyboard",
                accessor: "keyboard",
                className: "text-sm text-muted-foreground",
                fallback: "—",
            },
            {
                key: "scanner",
                label: "Scanner",
                accessor: "scanner",
                className: "text-sm text-muted-foreground",
                fallback: "—",
            },
            {
                key: "badge_no",
                label: "Badge No",
                accessor: "badge_no",
                className: "text-sm text-muted-foreground",
                fallback: "—",
            },
            {
                key: "status",
                label: "Status",
                accessor: "status",
                className: "text-sm",
                render: (record) => {
                    const getStatusBadgeVariant = (status) => {
                        switch (status) {
                            case 1:
                                return "default";
                            case 2:
                                return "secondary";
                            case 3:
                                return "destructive";
                            default:
                                return "secondary";
                        }
                    };

                    return (
                        <Badge
                            variant={getStatusBadgeVariant(record.status)}
                            className="capitalize"
                        >
                            {record.status_label || "—"}
                        </Badge>
                    );
                },
            },
        ],
        [],
    );

    const fields = [
        { name: "id", label: "ID", hidden: true },
        {
            name: "promis_name",
            label: "Promis Name",
            placeholder: "Enter Promis name",
            rules: [{ required: true, message: "Promis name is required" }],
        },
        {
            name: "ip_address",
            label: "IP Address",
            placeholder: "Enter IP address",
        },
        {
            name: "location",
            label: "Location",
            placeholder: "Enter location",
            rules: [{ required: true, message: "Location is required" }],
        },
        {
            name: "model_name",
            label: "Model Name",
            placeholder: "Enter model name",
            rules: [{ required: true, message: "Model name is required" }],
        },
        { name: "monitor", label: "Monitor", placeholder: "Enter Monitor" },
        { name: "mouse", label: "Mouse", placeholder: "Enter Mouse" },
        { name: "keyboard", label: "Keyboard", placeholder: "Enter Keyboard" },
        { name: "scanner", label: "Scanner", placeholder: "Enter Scanner" },
        { name: "badge_no", label: "Badge No", placeholder: "Enter Badge No" },
        {
            name: "status",
            label: "Status",
            type: "select",
            placeholder: "Select status",
            rules: [{ required: true, message: "Status is required" }],
            options: [
                { value: 1, label: "Active" },
                { value: 2, label: "Spare" },
                { value: 3, label: "Defective" },
            ],
        },
    ];

    const flattenedPromis = useMemo(
        () =>
            promis.map((p) => ({
                id: p.id,
                promis_name: p.promis_name || "",
                ip_address: p.ip_address || "",
                location: p.location || "",
                model_name: p.model_name || "",
                monitor: p.monitor || "",
                mouse: p.mouse || "",
                keyboard: p.keyboard || "",
                scanner: p.scanner || "",
                badge_no: p.badge_no || "",
                status: p.status,
                status_label: p.status_label || "",
            })),
        [promis],
    );

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
                                    Promis Inventory
                                </BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>

                    <Button size="sm" onClick={openCreate} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add Promis
                    </Button>
                </div>

                {/* ── Main card ── */}
                <Card className="shadow-sm border-border/60 flex flex-col h-[calc(100vh-12rem)]">
                    <CardHeader className="pb-0 pt-4 px-4 flex-shrink-0">
                        <div className="flex items-center justify-between gap-4">
                            <h2 className="text-lg font-semibold text-foreground">
                                Promis Inventory
                            </h2>
                            <div className="relative w-72">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                                <Input
                                    placeholder="Search promis name, model name, IP..."
                                    value={searchText ?? ""}
                                    onChange={handleSearch}
                                    className="pl-8 h-9 text-sm"
                                />
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0 mt-3 flex-1 overflow-hidden flex flex-col">
                        {/* ── Table ── */}
                        <div className="overflow-auto max-h-[70vh]">
                            <Table className="h-full">
                                <TableHeader className="sticky top-0 z-30 bg-background">
                                    <TableRow className="border-border/60 hover:bg-transparent">
                                        {tableColumns.map((col) => (
                                            <TableHead
                                                key={col.key}
                                                className="bg-background text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap"
                                            >
                                                {col.label}
                                            </TableHead>
                                        ))}

                                        <TableHead className="sticky top-0 z-20 bg-background text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right w-12">
                                            Actions
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>

                                <TableBody>
                                    {flattenedPromis.length === 0 ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={
                                                    tableColumns.length + 1
                                                }
                                                className="h-32 text-center text-sm text-muted-foreground"
                                            >
                                                No promis records found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        flattenedPromis.map((record) => (
                                            <TableRow
                                                key={record.id}
                                                className="border-border/40 hover:bg-muted/30 transition-colors"
                                            >
                                                {tableColumns.map((col) => (
                                                    <TableCell
                                                        key={col.key}
                                                        className={
                                                            col.className
                                                        }
                                                    >
                                                        {col.render
                                                            ? col.render(record)
                                                            : record[
                                                                  col.accessor
                                                              ] ||
                                                              col.fallback ||
                                                              "—"}
                                                    </TableCell>
                                                ))}

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
                        <div className="border-t border-border/40 px-4">
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
                    title={editingItem ? "Edit Promis" : "Add Promis"}
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
                    entityType="Promis"
                    apiRoute="promis.logs"
                    title="Promis Changes"
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

export default PromisTable;
