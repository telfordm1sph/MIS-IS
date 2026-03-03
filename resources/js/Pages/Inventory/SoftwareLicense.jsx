import React, { useCallback, useMemo, useEffect, useState } from "react";
import { usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
    KeyRound,
    User,
} from "lucide-react";
import dayjs from "dayjs";
import axios from "axios";
import { toast } from "sonner";

import { useInventoryFilters } from "@/Hooks/useInventoryFilters";
import { useFormDrawer } from "@/Hooks/useFormDrawer";
import { useLogsModal } from "@/Hooks/useLogsModal";
import { useCrudOperations } from "@/Hooks/useCrudOperations";
import FormDrawer from "@/Components/Drawer/FormDrawer";
import ActivityLogsModal from "@/Components/inventory/ActivityLogsModal";

import { DeleteConfirm } from "@/Components/DeleteConfirm";
import TablePagination from "@/Components/TablePagination";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const isExpiringSoon = (endDate, reminderDays) => {
    if (!endDate || !reminderDays) return false;
    const days = dayjs(endDate).diff(dayjs(), "days");
    return days <= reminderDays && days >= 0;
};

const isExpired = (endDate) => {
    if (!endDate) return false;
    return dayjs(endDate).isBefore(dayjs(), "day");
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const SubscriptionBadge = ({ record }) => {
    const expired = isExpired(record.subscription_end);
    const expiringSoon = isExpiringSoon(
        record.subscription_end,
        record.renewal_reminder_days,
    );

    if (expired)
        return (
            <Badge
                variant="outline"
                className="rounded-full text-xs bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800"
            >
                Expired
            </Badge>
        );
    if (expiringSoon)
        return (
            <Badge
                variant="outline"
                className="rounded-full text-xs bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800"
            >
                Expiring Soon
            </Badge>
        );
    if (record.subscription_end)
        return (
            <Badge
                variant="outline"
                className="rounded-full text-xs bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800"
            >
                Active
            </Badge>
        );
    return null;
};

// ─── Main component ───────────────────────────────────────────────────────────

const SoftwareLicense = () => {
    const { licenses, pagination, filters, emp_data } = usePage().props;

    const [softwareOptions, setSoftwareOptions] = useState([]);
    const [loadingOptions, setLoadingOptions] = useState(false);
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
        routeName: "licenses.table",
    });

    const { handleSave, handleDelete } = useCrudOperations({
        updateRoute: "licenses.update",
        storeRoute: "licenses.store",
        deleteRoute: "licenses.destroy",
        updateSuccessMessage: "Software license updated successfully!",
        createSuccessMessage: "Software license created successfully!",
        deleteSuccessMessage: "Software license deleted successfully!",
        reloadProps: ["licenses"],
    });

    useEffect(() => {
        (async () => {
            setLoadingOptions(true);
            try {
                const res = await axios.get(
                    route("software.inventory.options"),
                );
                setSoftwareOptions(res.data);
            } catch {
                toast.error("Failed to load software options");
            } finally {
                setLoadingOptions(false);
            }
        })();
    }, []);

    const handleEditClick = (record) => {
        openEdit({
            ...record,
            subscription_start: record.subscription_start
                ? dayjs(record.subscription_start)
                : null,
            subscription_end: record.subscription_end
                ? dayjs(record.subscription_end)
                : null,
        });
    };

    const handleFormSave = async (values) => {
        const payload = {
            ...values,
            subscription_start: values.subscription_start
                ? dayjs(values.subscription_start).format("YYYY-MM-DD")
                : null,
            subscription_end: values.subscription_end
                ? dayjs(values.subscription_end).format("YYYY-MM-DD")
                : null,
        };
        const result = await handleSave(payload, values.id || null);
        if (result?.success) closeForm();
    };

    const fields = [
        {
            name: "software_inventory_id",
            label: "Software",
            type: "select",
            options: softwareOptions,
            loading: loadingOptions,
            placeholder: "Select software",
            rules: [{ required: true, message: "Software is required" }],
        },
        {
            name: "license_key",
            label: "License Key",
            placeholder: "Enter license key",
        },
        {
            name: "account_user",
            label: "Account Username",
            placeholder: "Enter account username",
        },
        {
            name: "account_password",
            label: "Account Password",
            type: "password",
            placeholder: "Enter account password",
        },
        {
            name: "max_activations",
            label: "Max Activations",
            type: "number",
            placeholder: "Maximum activations",
        },
        {
            name: "current_activations",
            label: "Current Activations",
            type: "number",
            placeholder: "Current activations",
        },
        {
            name: "subscription_start",
            label: "Subscription Start Date",
            type: "date",
        },
        {
            name: "subscription_end",
            label: "Subscription End Date",
            type: "date",
        },
        {
            name: "renewal_reminder_days",
            label: "Renewal Reminder (Days)",
            type: "number",
            placeholder: "Days before expiry",
        },
        {
            name: "cost_per_license",
            label: "Cost Per License",
            type: "number",
            placeholder: "Enter cost",
        },
        {
            name: "remarks",
            label: "Remarks",
            type: "textarea",
            placeholder: "Additional notes",
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
                                    Software Licenses
                                </BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                    <Button size="sm" onClick={openCreate} className="gap-2">
                        <Plus className="h-4 w-4" /> Add License
                    </Button>
                </div>

                {/* ── Main card ── */}
                <Card className="shadow-sm border-border/60 flex flex-col h-[calc(100vh-12rem)]">
                    <CardHeader className="pb-0 pt-4 px-4 flex-shrink-0">
                        <div className="flex items-center justify-between gap-4">
                            <h2 className="text-lg font-semibold text-foreground">
                                Software Licenses
                            </h2>
                            <div className="relative w-72">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                                <Input
                                    placeholder="Search software, license key, account..."
                                    value={searchText ?? ""}
                                    onChange={handleSearch}
                                    className="pl-8 h-9 text-sm"
                                />
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0 mt-3 flex-1 overflow-hidden flex flex-col">
                        <div className="flex-1 overflow-auto relative">
                            <Table className="h-full">
                                <TableHeader className="sticky top-0 z-30 bg-background">
                                    <TableRow className="border-border/60 hover:bg-transparent">
                                        {[
                                            "ID",
                                            "Software",
                                            "License Key / Account",
                                            "Activations",
                                            "Subscription Period",
                                            "Cost",
                                        ].map((col) => (
                                            <TableHead
                                                key={col}
                                                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                                            >
                                                {col}
                                            </TableHead>
                                        ))}
                                        <TableHead className="w-12 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">
                                            Actions
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>

                                <TableBody>
                                    {!licenses?.length ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={7}
                                                className="h-32 text-center text-sm text-muted-foreground"
                                            >
                                                No license records found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        licenses.map((record) => (
                                            <TableRow
                                                key={record.id}
                                                className="border-border/40 hover:bg-muted/30 transition-colors align-top"
                                            >
                                                {/* ID */}
                                                <TableCell className="text-xs font-mono text-muted-foreground pt-3">
                                                    {record.id}
                                                </TableCell>

                                                {/* Software */}
                                                <TableCell className="pt-3">
                                                    <div className="text-sm font-medium">
                                                        {record.software
                                                            ?.software_name ||
                                                            "N/A"}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground mt-0.5">
                                                        {
                                                            record.software
                                                                ?.software_type
                                                        }
                                                        {record.software
                                                            ?.version &&
                                                            ` • v${record.software.version}`}
                                                    </div>
                                                </TableCell>

                                                {/* License Key / Account */}
                                                <TableCell className="pt-3">
                                                    {record.license_key ? (
                                                        <div className="space-y-1">
                                                            <Badge
                                                                variant="outline"
                                                                className="rounded-full text-[10px] gap-1 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800"
                                                            >
                                                                <KeyRound className="h-2.5 w-2.5" />{" "}
                                                                License Key
                                                            </Badge>
                                                            <div className="text-xs text-muted-foreground font-mono truncate max-w-[160px]">
                                                                {
                                                                    record.license_key
                                                                }
                                                            </div>
                                                        </div>
                                                    ) : record.account_user ? (
                                                        <div className="space-y-1">
                                                            <Badge
                                                                variant="outline"
                                                                className="rounded-full text-[10px] gap-1 bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800"
                                                            >
                                                                <User className="h-2.5 w-2.5" />{" "}
                                                                Account
                                                            </Badge>
                                                            <div className="text-xs text-muted-foreground truncate max-w-[160px]">
                                                                {
                                                                    record.account_user
                                                                }
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground/50">
                                                            N/A
                                                        </span>
                                                    )}
                                                </TableCell>

                                                {/* Activations */}
                                                <TableCell className="pt-3 text-center">
                                                    <div className="text-sm font-medium tabular-nums">
                                                        {record.current_activations ??
                                                            0}{" "}
                                                        /{" "}
                                                        {record.max_activations ??
                                                            "∞"}
                                                    </div>
                                                    {record.max_activations && (
                                                        <div className="text-xs text-muted-foreground mt-0.5">
                                                            {record.max_activations -
                                                                (record.current_activations ??
                                                                    0)}{" "}
                                                            available
                                                        </div>
                                                    )}
                                                </TableCell>

                                                {/* Subscription */}
                                                <TableCell className="pt-3">
                                                    {!record.subscription_start &&
                                                    !record.subscription_end ? (
                                                        <span className="text-xs text-muted-foreground">
                                                            Perpetual
                                                        </span>
                                                    ) : (
                                                        <div className="space-y-1">
                                                            <div className="text-xs text-muted-foreground">
                                                                {record.subscription_start
                                                                    ? dayjs(
                                                                          record.subscription_start,
                                                                      ).format(
                                                                          "MMM D, YYYY",
                                                                      )
                                                                    : "N/A"}
                                                                {" – "}
                                                                {record.subscription_end
                                                                    ? dayjs(
                                                                          record.subscription_end,
                                                                      ).format(
                                                                          "MMM D, YYYY",
                                                                      )
                                                                    : "N/A"}
                                                            </div>
                                                            <SubscriptionBadge
                                                                record={record}
                                                            />
                                                        </div>
                                                    )}
                                                </TableCell>

                                                {/* Cost */}
                                                <TableCell className="pt-3 text-right tabular-nums text-sm">
                                                    {record.cost_per_license ? (
                                                        `₱${parseFloat(record.cost_per_license).toFixed(2)}`
                                                    ) : (
                                                        <span className="text-muted-foreground/50">
                                                            N/A
                                                        </span>
                                                    )}
                                                </TableCell>

                                                {/* Actions */}
                                                <TableCell className="text-right pt-2">
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
                                                                    handleEditClick(
                                                                        record,
                                                                    )
                                                                }
                                                            >
                                                                <Pencil className="h-3.5 w-3.5 text-emerald-500" />{" "}
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
                                                                <History className="h-3.5 w-3.5 text-amber-500" />{" "}
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
                                                                <Trash2 className="h-3.5 w-3.5" />{" "}
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
                    title={editingItem ? "Edit License" : "Add License"}
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
                    entityType="SoftwareLicense"
                    apiRoute="licenses.logs"
                    title="License Changes"
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

export default SoftwareLicense;
