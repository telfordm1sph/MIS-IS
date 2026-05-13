import React, { useMemo, useState } from "react";
import { usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/Components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/Components/ui/tooltip";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/Components/ui/breadcrumb";
import {
    Plus,
    Eye,
    Pencil,
    EllipsisVertical,
    MapPin,
    Trash,
    Search,
} from "lucide-react";

import DetailsDrawer from "@/Components/drawer/DetailsDrawer";
import LocationFormDrawer from "@/Components/drawer/LocationFormDrawer";
import { useDrawer } from "@/Hooks/useDrawer";
import { useFormDrawer } from "@/Hooks/useFormDrawer";
import { useInventoryFilters } from "@/Hooks/useInventoryFilters";
import { useCrudOperations } from "@/Hooks/useCrudOperations";
import { DeleteConfirm } from "@/Components/DeleteConfirm";
import TablePagination from "@/Components/TablePagination";

const Location = () => {
    const { locations, pagination, filters } = usePage().props;
    const [deleteTarget, setDeleteTarget] = useState(null);
    const { drawerOpen, selectedItem, openDrawer, closeDrawer } = useDrawer();

    const {
        isOpen: formDrawerOpen,
        editingItem,
        openCreate,
        openEdit,
        close: closeForm,
    } = useFormDrawer();

    const {
        searchText,
        handleSearch,
        handleTableChange,
        handlePageSizeChange,
    } = useInventoryFilters({
        filters,
        pagination,
        routeName: "locations.index",
    });

    const { handleSave, handleDelete } = useCrudOperations({
        updateRoute: "locations.update",
        storeRoute: "locations.store",
        deleteRoute: "locations.destroy",
        updateSuccessMessage: "Location updated successfully!",
        createSuccessMessage: "Location created successfully!",
        deleteSuccessMessage: "Location deleted successfully!",
        reloadProps: ["locations", "pagination", "filters"],
    });

    const handleFormSave = async (values) => {
        const result = await handleSave({ ...values }, values.id || null);
        if (result?.success) closeForm();
    };

    const handleDeleteClick = (record) => {
        setDeleteTarget(record);
    };

    const handleConfirmDelete = async () => {
        if (deleteTarget) {
            await handleDelete(deleteTarget.id);
            setDeleteTarget(null);
        }
    };

    const handleView = async (record) => {
        openDrawer(record);
    };

    const handleEdit = async (record) => {
        openEdit(record);
    };

    // ─── Field groups for details drawer ─────────────────────────────────────

    const getFieldGroups = (item) => {
        if (!item) return [];

        const locationFields = [
            { label: "Location ID", value: item.id || "-" },
            { label: "Location Name", value: item.location_name || "-" },
            { label: "Description", value: item.location_description || "-" },
            { label: "Created By", value: item.created_by_emp_name || "-" },
            {
                label: "Created At",
                value: item.date_created
                    ? new Date(item.date_created).toLocaleString()
                    : "-",
            },
            { label: "Updated By", value: item.updated_by_emp_name || "-" },
            {
                label: "Updated At",
                value: item.date_updated
                    ? new Date(item.date_updated).toLocaleString()
                    : "-",
            },
        ];

        return [
            {
                title: "Location Information",
                column: 1,
                fields: locationFields,
            },
        ];
    };

    // ─── Form field groups ────────────────────────────────────────────────────

    const formFieldGroups = useMemo(
        () => [
            {
                title: "Location Details",
                column: 1,
                fields: [
                    { key: "id", dataIndex: "id", type: "hidden" },
                    {
                        key: "location_name",
                        label: "Location Name",
                        dataIndex: "location_name",
                        type: "input",
                        placeholder: "Enter location name",
                    },
                    {
                        key: "location_description",
                        label: "Description",
                        dataIndex: "location_description",
                        type: "textarea",
                        placeholder: "Enter location description",
                    },
                ],
            },
        ],
        [],
    );

    return (
        <AuthenticatedLayout>
            <TooltipProvider delayDuration={200}>
                <div className="px-4 sm:px-6 lg:px-8 py-4 space-y-4">
                    {/* ── Top bar ── */}
                    <div className="flex items-center justify-between">
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbLink href="/">
                                        MIS-IS
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>
                                    <BreadcrumbPage>
                                        Locations Management
                                    </BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>

                        <Button
                            size="sm"
                            onClick={openCreate}
                            className="gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            Add Location
                        </Button>
                    </div>

                    {/* ── Main card ── */}
                    <Card className="shadow-sm border-border/60 flex flex-col h-[calc(100vh-12rem)]">
                        <CardHeader className="pb-0 pt-4 px-4 flex-shrink-0">
                            <div className="flex items-center justify-between gap-4">
                                <h2 className="text-lg font-semibold">
                                    Locations
                                </h2>

                                <div className="relative w-72">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                    <Input
                                        placeholder="Search locations..."
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
                                            <TableHead className="w-16 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                                ID
                                            </TableHead>
                                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                                Location Name
                                            </TableHead>
                                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                                Description
                                            </TableHead>
                                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                                Created By
                                            </TableHead>
                                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                                Created At
                                            </TableHead>
                                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                                Updated By
                                            </TableHead>
                                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                                Updated At
                                            </TableHead>
                                            <TableHead className="w-12 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">
                                                Actions
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {locations?.length === 0 ? (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={8}
                                                    className="h-32 text-center text-sm text-muted-foreground"
                                                >
                                                    No locations found.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            locations?.map((record) => (
                                                <TableRow
                                                    key={record.id}
                                                    className="border-border/40 hover:bg-muted/30 transition-colors"
                                                >
                                                    <TableCell className="text-xs text-muted-foreground font-mono">
                                                        {record.id}
                                                    </TableCell>
                                                    <TableCell className="text-sm font-medium">
                                                        <div className="flex items-center gap-2">
                                                            <MapPin className="h-4 w-4 text-muted-foreground" />
                                                            {record.location_name ||
                                                                "—"}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-sm text-muted-foreground">
                                                        {record.location_description ||
                                                            "—"}
                                                    </TableCell>
                                                    <TableCell className="text-sm text-muted-foreground">
                                                        {record.created_by_emp_name ||
                                                            "—"}
                                                    </TableCell>
                                                    <TableCell className="text-sm text-muted-foreground">
                                                        {record.date_created
                                                            ? new Date(
                                                                  record.date_created,
                                                              ).toLocaleDateString()
                                                            : "—"}
                                                    </TableCell>
                                                    <TableCell className="text-sm text-muted-foreground">
                                                        {record.updated_by_emp_name ||
                                                            "—"}
                                                    </TableCell>
                                                    <TableCell className="text-sm text-muted-foreground">
                                                        {record.date_updated
                                                            ? new Date(
                                                                  record.date_updated,
                                                              ).toLocaleDateString()
                                                            : "—"}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger
                                                                asChild
                                                            >
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-8 w-8 p-0"
                                                                >
                                                                    <EllipsisVertical className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem
                                                                    onClick={() =>
                                                                        handleEdit(
                                                                            record,
                                                                        )
                                                                    }
                                                                    className="gap-2"
                                                                >
                                                                    <Pencil className="h-4 w-4" />
                                                                    Edit
                                                                    Location
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    onClick={() =>
                                                                        handleDeleteClick(
                                                                            record,
                                                                        )
                                                                    }
                                                                    className="gap-2 text-destructive"
                                                                >
                                                                    <Trash className="h-4 w-4" />
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
                            {pagination && (
                                <div className="border-t border-border/60 px-4 py-3">
                                    <TablePagination
                                        pagination={pagination}
                                        onChange={(page) =>
                                            handleTableChange(
                                                { current: page },
                                                {},
                                                {},
                                            )
                                        }
                                        onChangePerPage={(size) =>
                                            handlePageSizeChange(size)
                                        }
                                    />
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    <DeleteConfirm
                        open={!!deleteTarget}
                        onOpenChange={(open) => !open && setDeleteTarget(null)}
                        onConfirm={handleConfirmDelete}
                    />
                    {/* ── Drawers and Modals ── */}
                    <DetailsDrawer
                        open={drawerOpen}
                        onClose={closeDrawer}
                        item={selectedItem}
                        getFieldGroups={getFieldGroups}
                        title="Location Details"
                    />

                    <LocationFormDrawer
                        open={formDrawerOpen}
                        onClose={closeForm}
                        editingItem={editingItem}
                        fieldGroups={formFieldGroups}
                        onSave={handleFormSave}
                        title={
                            editingItem ? "Edit Location" : "Add New Location"
                        }
                        key={editingItem ? `edit-${editingItem.id}` : "create"}
                    />
                </div>
            </TooltipProvider>
        </AuthenticatedLayout>
    );
};

export default Location;
