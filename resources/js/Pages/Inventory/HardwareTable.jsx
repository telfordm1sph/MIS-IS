import React, { useCallback, useMemo, useState } from "react";
import { usePage, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
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
    Eye,
    Pencil,
    History,
    ClipboardPlus,
    EllipsisVertical,
} from "lucide-react";
import dayjs from "dayjs";

import { useInventoryFilters } from "@/Hooks/useInventoryFilters";
import { useDrawer } from "@/Hooks/useDrawer";
import { useFormDrawer } from "@/Hooks/useFormDrawer";
import { useLogsModal } from "@/Hooks/useLogsModal";
import { useCrudOperations } from "@/Hooks/useCrudOperations";
import { useTableConfig } from "@/Hooks/useTableConfig";
import { ITEM_CONFIG } from "@/Config/itemConfig";
import InventoryHeaderWithFilters from "@/Components/inventory/InventoryHeaderWithFilters";
import DetailsDrawer from "@/Components/drawer/DetailsDrawer";
import HardwareFormDrawer from "@/Components/drawer/HardwareFormDrawer";
import CategoryBadge from "@/Components/inventory/CategoryBadge";
import ActivityLogsModal from "@/Components/inventory/ActivityLogsModal";
import ComponentMaintenanceDrawer from "@/Components/drawer/ComponentMaintenanceDrawer";
import axios from "axios";
import { TablePagination } from "@/Components/TablePagination";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const stringToColor = (str) => {
    if (!str) return "#999";
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return `hsl(${Math.abs(hash) % 360}, 65%, 55%)`;
};

// Maps status_color (Ant color name or hex) → shadcn Badge variant classes
const STATUS_BADGE_CLASSES = {
    green: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
    blue: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
    orange: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800",
    red: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
    yellow: "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800",
    purple: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800",
    cyan: "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-300 dark:border-cyan-800",
    default:
        "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
};

const StatusBadge = ({ color, label }) => {
    const cls = STATUS_BADGE_CLASSES[color] ?? STATUS_BADGE_CLASSES.default;
    return (
        <Badge
            variant="outline"
            className={cn("gap-1.5 rounded-full text-xs font-medium", cls)}
        >
            <span className={cn("h-1.5 w-1.5 rounded-full", `bg-current`)} />
            {label}
        </Badge>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const HardwareTable = () => {
    const { hardware, pagination, categoryCounts, filters, emp_data } =
        usePage().props;

    const { drawerOpen, selectedItem, openDrawer, closeDrawer } = useDrawer();

    const {
        isOpen: formDrawerOpen,
        editingItem,
        openCreate,
        openEdit,
        close: closeForm,
        employeeOptions,
        departmentOptions,
        locationOptions,
        prodLineOptions,
        stationOptions,
        loadingOptions,
    } = useFormDrawer();

    const {
        isVisible: logsModalVisible,
        entityId,
        open: openLogs,
        close: closeLogs,
    } = useLogsModal();

    const [maintenanceDrawerOpen, setMaintenanceDrawerOpen] = useState(false);
    const [selectedHardware, setSelectedHardware] = useState(null);

    const {
        searchText,
        category,
        subCategory,
        handleSearch,
        handleCategoryChange,
        handleSubCategoryChange,
        handleResetFilters,
        handleTableChange,
        handlePageSizeChange,
    } = useInventoryFilters({
        filters,
        pagination,
        routeName: "hardware.table",
    });

    const { handleSave } = useCrudOperations({
        updateRoute: "hardware.update",
        storeRoute: "hardware.store",
        updateSuccessMessage: "Hardware updated successfully!",
        createSuccessMessage: "Hardware created successfully!",
        reloadProps: ["hardware"],
    });

    const handleFormSave = async (values) => {
        const result = await handleSave(
            { ...values, employee_id: emp_data?.emp_id },
            values.id || null,
        );
        if (result?.success) closeForm();
    };

    const fetchHardwareDetails = async (id) => {
        try {
            const [partsRes, softwareRes] = await Promise.all([
                axios.get(route("hardware.parts.list", id)),
                axios.get(route("hardware.software.list", id)),
            ]);
            return {
                parts: partsRes.data ?? [],
                software: softwareRes.data ?? [],
            };
        } catch {
            return { parts: [], software: [] };
        }
    };
    const handleMaintenanceClose = useCallback(() => {
        setMaintenanceDrawerOpen(false);
        setTimeout(() => setSelectedHardware(null), 300); // wait for Sheet animation
    }, []);
    const handleView = async (record) => {
        const details = await fetchHardwareDetails(record.id);
        openDrawer({ ...record, ...details });
    };

    const handleEdit = async (record) => {
        const details = await fetchHardwareDetails(record.id);
        openEdit({ ...record, ...details });
    };

    const handleOpenMaintenance = async (record) => {
        const details = await fetchHardwareDetails(record.id);
        setSelectedHardware({ ...record, ...details });
        setMaintenanceDrawerOpen(true);
    };

    const renderCategory = useCallback((value) => {
        const config = ITEM_CONFIG[value?.toLowerCase()] || ITEM_CONFIG.default;
        return <CategoryBadge value={value} config={config} />;
    }, []);

    // ─── Field groups for details drawer ─────────────────────────────────────

    const getFieldGroups = (item) => {
        if (!item) return [];

        const hardwareFields = [
            { label: "Hostname", value: item.hostname || "-" },
            { label: "Brand", value: item.brand || "-" },
            { label: "Model", value: item.model || "-" },
            { label: "Category", value: item.category || "-" },
            { label: "Serial Number", value: item.serial_number || "-" },
            { label: "Processor", value: item.processor || "-" },
            { label: "Motherboard", value: item.motherboard || "-" },
            { label: "IP Address", value: item.ip_address || "-" },
            { label: "Wifi MAC", value: item.wifi_mac || "-" },
            { label: "LAN MAC", value: item.lan_mac || "-" },
            { label: "Department", value: item.department_name || "-" },
            { label: "Location", value: item.location_name || "-" },
            { label: "Product Line", value: item.prodline_name || "-" },
            { label: "Station", value: item.station_name || "-" },
            { label: "Installed By", value: item.installed_by || "-" },
            {
                label: "Status",
                value: {
                    value: item.status_label || "-",
                    color: item.status_color || "default",
                },
            },
            { label: "Issued To", value: item.issued_to_label || "-" },
        ];

        const partsByType = {};
        item.parts?.forEach((p) => {
            const type = p.part_info?.part_type || "Part";
            if (!partsByType[type]) partsByType[type] = [];
            partsByType[type].push(p);
        });

        const partsSubGroups = Object.keys(partsByType).map((type) => ({
            title: type,
            column: 2,
            fields: partsByType[type].map((p) => ({
                Brand: p.part_info?.brand || "-",
                Model: p.part_info?.model || "N/A",
                "Serial No.": p.serial_number || "-",
                Details:
                    `${p.part_info?.specifications || ""} ${p.status ? `[${p.status}]` : ""}`.trim(),
            })),
        }));

        const softwareSubGroups =
            item.software?.map((s) => ({
                title: s.inventory?.software_name || "Software",
                column: 2,
                fields: [
                    { label: "Version", value: s.inventory?.version || "-" },
                    { label: "Type", value: s.inventory?.software_type ?? "-" },
                    {
                        label: "Installed On",
                        value: s.installation_date
                            ? dayjs(s.installation_date).format("MMM DD, YYYY")
                            : "-",
                    },
                    {
                        label: "License Key/Account User",
                        value:
                            s.license?.license_key ??
                            s.license?.account_user ??
                            "-",
                    },
                ],
            })) || [];

        return [
            {
                title: "Hardware Specifications",
                column: 2,
                fields: hardwareFields,
            },
            { title: "Parts", column: 2, subGroups: partsSubGroups },
            { title: "Software", column: 2, subGroups: softwareSubGroups },
        ];
    };

    // ─── Form field groups ────────────────────────────────────────────────────

    const formFieldGroups = useMemo(
        () => [
            {
                title: "Hardware Specifications",
                column: 2,
                fields: [
                    { key: "id", dataIndex: "id", type: "hidden" },
                    {
                        key: "status",
                        label: "Status",
                        dataIndex: "status",
                        type: "select",
                        options: [
                            { label: "Active", value: 1 },
                            { label: "New", value: 2 },
                            { label: "Inactive", value: 3 },
                            { label: "Defective", value: 4 },
                        ],
                    },
                    {
                        key: "hostname",
                        label: "Host Name",
                        dataIndex: "hostname",
                        type: "input",
                    },
                    {
                        key: "model",
                        label: "Model",
                        dataIndex: "model",
                        type: "input",
                    },
                    {
                        key: "brand",
                        label: "Brand",
                        dataIndex: "brand",
                        type: "input",
                    },
                    {
                        key: "category",
                        label: "Category",
                        dataIndex: "category",
                        type: "select",
                        options: [
                            { label: "Desktop", value: "Desktop" },
                            { label: "Laptop", value: "Laptop" },
                            { label: "Server", value: "Server" },
                            {
                                label: "Network Device",
                                value: "Network Device",
                            },
                            { label: "Other", value: "Other" },
                        ],
                    },
                    {
                        key: "serial_number",
                        label: "Serial Number",
                        dataIndex: "serial_number",
                        type: "input",
                    },
                    {
                        key: "processor",
                        label: "Processor",
                        dataIndex: "processor",
                        type: "input",
                    },
                    {
                        key: "motherboard",
                        label: "Motherboard",
                        dataIndex: "motherboard",
                        type: "input",
                    },
                    {
                        key: "ip_address",
                        label: "IP Address",
                        dataIndex: "ip_address",
                        type: "input",
                    },
                    {
                        key: "wifi_mac",
                        label: "WiFi MAC",
                        dataIndex: "wifi_mac",
                        type: "input",
                    },
                    {
                        key: "lan_mac",
                        label: "LAN MAC",
                        dataIndex: "lan_mac",
                        type: "input",
                    },
                    {
                        key: "department",
                        label: "Department",
                        dataIndex: "department",
                        type: "select",
                        options: departmentOptions,
                        loading: loadingOptions,
                    },
                    {
                        key: "location",
                        label: "Location",
                        dataIndex: "location",
                        type: "select",
                        options: locationOptions,
                        loading: loadingOptions,
                    },
                    {
                        key: "prodline",
                        label: "Product Line",
                        dataIndex: "prodline",
                        type: "select",
                        options: prodLineOptions,
                        loading: loadingOptions,
                    },
                    {
                        key: "station",
                        label: "Station",
                        dataIndex: "station",
                        type: "select",
                        options: stationOptions,
                        loading: loadingOptions,
                    },
                    {
                        key: "assignedUsersIds",
                        label: "Issued To",
                        dataIndex: "assignedUsersIds",
                        type: "multiSelect",
                        options: employeeOptions,
                        loading: loadingOptions,
                    },
                ],
            },
        ],
        [
            departmentOptions,
            locationOptions,
            prodLineOptions,
            stationOptions,
            employeeOptions,
            loadingOptions,
        ],
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
                                        Hardware Inventory
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
                            Add Hardware
                        </Button>
                    </div>

                    {/* ── Main card ── */}
                    <Card className="shadow-sm border-border/60 flex flex-col h-[calc(100vh-12rem)]">
                        <CardHeader className="pb-0 pt-4 px-4 flex-shrink-0">
                            <InventoryHeaderWithFilters
                                title="Hardware Inventory"
                                categoryCounts={categoryCounts}
                                categoryConfig={ITEM_CONFIG}
                                searchText={searchText}
                                category={category}
                                subCategory={subCategory}
                                onSearchChange={handleSearch}
                                onCategoryChange={handleCategoryChange}
                                onSubCategoryChange={handleSubCategoryChange}
                                hasActiveFilters={
                                    !!(category || searchText || subCategory)
                                }
                                onResetFilters={handleResetFilters}
                            />
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
                                                Hostname
                                            </TableHead>
                                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                                Brand
                                            </TableHead>
                                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                                Category
                                            </TableHead>
                                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                                Location
                                            </TableHead>
                                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                                Issued To
                                            </TableHead>
                                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                                Status
                                            </TableHead>
                                            <TableHead className="w-12 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">
                                                Actions
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {hardware?.length === 0 ? (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={8}
                                                    className="h-32 text-center text-sm text-muted-foreground"
                                                >
                                                    No hardware records found.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            hardware?.map((record) => (
                                                <TableRow
                                                    key={record.id}
                                                    className="border-border/40 hover:bg-muted/30 transition-colors"
                                                >
                                                    <TableCell className="text-xs text-muted-foreground font-mono">
                                                        {record.id}
                                                    </TableCell>
                                                    <TableCell className="text-sm font-medium">
                                                        {record.hostname || "—"}
                                                    </TableCell>
                                                    <TableCell className="text-sm text-muted-foreground">
                                                        {record.brand || "—"}
                                                    </TableCell>
                                                    <TableCell>
                                                        {renderCategory(
                                                            record.category,
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-sm text-muted-foreground">
                                                        {record.location_name ||
                                                            "—"}
                                                    </TableCell>
                                                    <TableCell>
                                                        {record.assignedUsers
                                                            ?.length ? (
                                                            <div className="flex -space-x-2">
                                                                {record.assignedUsers
                                                                    .slice(0, 3)
                                                                    .map(
                                                                        (
                                                                            user,
                                                                        ) => (
                                                                            <Tooltip
                                                                                key={
                                                                                    user.EMPLOYID
                                                                                }
                                                                            >
                                                                                <TooltipTrigger
                                                                                    asChild
                                                                                >
                                                                                    <Avatar className="h-7 w-7 border-2 border-background cursor-default">
                                                                                        <AvatarFallback
                                                                                            className="text-[10px] font-bold text-white"
                                                                                            style={{
                                                                                                backgroundColor:
                                                                                                    stringToColor(
                                                                                                        user.fullName,
                                                                                                    ),
                                                                                            }}
                                                                                        >
                                                                                            {
                                                                                                user.initials
                                                                                            }
                                                                                        </AvatarFallback>
                                                                                    </Avatar>
                                                                                </TooltipTrigger>
                                                                                <TooltipContent
                                                                                    side="top"
                                                                                    className="text-xs"
                                                                                >
                                                                                    {
                                                                                        user.fullName
                                                                                    }
                                                                                </TooltipContent>
                                                                            </Tooltip>
                                                                        ),
                                                                    )}
                                                                {record
                                                                    .assignedUsers
                                                                    .length >
                                                                    3 && (
                                                                    <Avatar className="h-7 w-7 border-2 border-background">
                                                                        <AvatarFallback className="text-[10px] font-bold bg-muted text-muted-foreground">
                                                                            +
                                                                            {record
                                                                                .assignedUsers
                                                                                .length -
                                                                                3}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground/50">
                                                                —
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <StatusBadge
                                                            color={
                                                                record.status_color
                                                            }
                                                            label={
                                                                record.status_label
                                                            }
                                                        />
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
                                                                className="w-48"
                                                            >
                                                                <DropdownMenuItem
                                                                    className="gap-2 cursor-pointer text-sm"
                                                                    onClick={() =>
                                                                        handleView(
                                                                            record,
                                                                        )
                                                                    }
                                                                >
                                                                    <Eye className="h-3.5 w-3.5 text-blue-500" />
                                                                    View Details
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
                                                                    className="gap-2 cursor-pointer text-sm"
                                                                    onClick={() =>
                                                                        handleEdit(
                                                                            record,
                                                                        )
                                                                    }
                                                                >
                                                                    <Pencil className="h-3.5 w-3.5 text-emerald-500" />
                                                                    Edit
                                                                    Hardware
                                                                </DropdownMenuItem>
                                                                {record.status ==
                                                                    "1" && (
                                                                    <DropdownMenuItem
                                                                        className="gap-2 cursor-pointer text-sm"
                                                                        onClick={() =>
                                                                            handleOpenMaintenance(
                                                                                record,
                                                                            )
                                                                        }
                                                                    >
                                                                        <ClipboardPlus className="h-3.5 w-3.5 text-purple-500" />
                                                                        Component
                                                                        Issuance
                                                                    </DropdownMenuItem>
                                                                )}
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
                        </CardContent>
                    </Card>

                    {/* ── Drawers & Modals ── */}
                    <DetailsDrawer
                        visible={drawerOpen}
                        fieldGroups={getFieldGroups(selectedItem)}
                        loading={false}
                        onClose={closeDrawer}
                    />

                    <HardwareFormDrawer
                        open={formDrawerOpen}
                        onClose={closeForm}
                        item={editingItem}
                        onSave={handleFormSave}
                        fieldGroups={formFieldGroups}
                    />

                    {selectedHardware && ( // ✅ FIX 1: don't mount until hardware exists
                        <ComponentMaintenanceDrawer
                            open={maintenanceDrawerOpen}
                            onClose={handleMaintenanceClose} // ✅ FIX 2: delayed null
                            hardware={selectedHardware}
                            onSave={() => router.reload({ only: ["hardware"] })}
                        />
                    )}

                    <ActivityLogsModal
                        visible={logsModalVisible}
                        onClose={closeLogs}
                        entityId={entityId}
                        entityType="Hardware"
                        apiRoute="hardware.logs"
                        title="Hardware Changes"
                        actionColors={{
                            created: "green",
                            updated: "blue",
                            deleted: "red",
                            software_attached: "cyan",
                            software_detached: "orange",
                        }}
                        perPage={5}
                    />
                </div>
            </TooltipProvider>
        </AuthenticatedLayout>
    );
};

export default HardwareTable;
