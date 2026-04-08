import React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/Components/ui/dialog";
import { Button } from "@/Components/ui/button";
import { Badge } from "@/Components/ui/badge";
import { Separator } from "@/Components/ui/separator";
import { Alert, AlertDescription } from "@/Components/ui/alert";
import { Card, CardContent } from "@/Components/ui/card";
import { cn } from "@/lib/utils";
import {
    CheckCircle2,
    ArrowLeftRight,
    PlusCircle,
    Trash2,
    Monitor,
    User,
    AlertTriangle,
    Info,
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────

const operationConfig = {
    add: {
        icon: <PlusCircle className="h-3 w-3" />,
        className:
            "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300",
        label: "Add",
    },
    remove: {
        icon: <Trash2 className="h-3 w-3" />,
        className:
            "bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300",
        label: "Remove",
    },
    replace: {
        icon: <ArrowLeftRight className="h-3 w-3" />,
        className:
            "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300",
        label: "Replace",
    },
};

const componentTypeConfig = {
    part: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300",
    software:
        "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300",
};

const StatCard = ({ label, value, icon, valueClass }) => (
    <Card className="border-border/60">
        <CardContent className="pt-4 pb-3 px-4">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1">
                {label}
            </p>
            <p className={cn("text-2xl font-bold tabular-nums", valueClass)}>
                {icon && (
                    <span className="mr-1 inline-flex items-center translate-y-0.5">
                        {icon}
                    </span>
                )}
                {value}
            </p>
        </CardContent>
    </Card>
);

const InlineBadge = ({ className, icon, children }) => (
    <span
        className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold",
            className,
        )}
    >
        {icon}
        {children}
    </span>
);

// ── Main component ────────────────────────────────────────────────────────────

const IssuanceConfirmationModal = ({
    visible,
    onCancel,
    onConfirm,
    hardware,
    operations = {},
    action,
    employeeData,
    loading = false,
}) => {
    const handleConfirm = () => {
        onConfirm(employeeData?.emp_id || employeeData);
    };

    const getOperationsArray = () => {
        if (!operations) return [];
        switch (action) {
            case "replace":
                return operations.replacements || [];
            case "add":
                return operations.components || [];
            case "remove":
                return operations.components_to_remove || [];
            default:
                return [];
        }
    };

    const operationsArray = getOperationsArray();

    const stats = {
        total: operationsArray.length,
        adds: action === "add" ? operationsArray.length : 0,
        removes: action === "remove" ? operationsArray.length : 0,
        replaces: action === "replace" ? operationsArray.length : 0,
    };

    const tableData = operationsArray.map((op, index) => {
        const type = op?.component_type || op?.componentType;
        const isPart = type === "part";

        const oldCompName = op?.component_to_replace
            ? isPart
                ? `${op?.replacement_brand || ""} ${op?.replacement_model || ""} - ${op?.replacement_specifications || ""}`
                : `${op?.replacement_software_name || ""} ${op?.replacement_version || ""}`
            : "-";

        const newCompName = (() => {
            if (op?.operation === "remove") return "-";
            if (op?.operation === "add")
                return isPart
                    ? `${op?.new_brand || ""} ${op?.new_model || ""} - ${op?.new_specifications || ""}`
                    : `${op?.new_software_name || ""} ${op?.new_version || ""}`;
            return isPart
                ? `${op?.replacement_brand || ""} ${op?.replacement_model || ""} - ${op?.replacement_specifications || ""}`
                : `${op?.replacement_software_name || ""} ${op?.replacement_version || ""}`;
        })();

        return {
            key: index,
            operation: op?.operation || action,
            componentType: type,
            oldComponent: oldCompName,
            oldCondition: op?.old_component_condition,
            newComponent: newCompName,
            newCondition: op?.replacement_condition || op?.new_condition,
            reason: op?.reason,
            remarks: op?.remarks,
            oldComponentId: op?.component_to_replace || op?.component_id,
            newComponentId:
                op?.replacement_serial_number || op?.new_serial_number,
        };
    });

    return (
        <Dialog open={visible} onOpenChange={(open) => !open && onCancel()}>
            <DialogContent className="!max-w-[960px] p-0 gap-0 overflow-hidden max-h-[90vh] flex flex-col">
                {/* Header */}
                <DialogHeader className="px-6 py-4 border-b border-border/60 bg-card/80 flex-shrink-0">
                    <DialogTitle className="flex items-center gap-2 text-base">
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                        Confirm Hardware Maintenance Issuance
                    </DialogTitle>
                </DialogHeader>

                {/* Scrollable body */}
                <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
                    {/* Hardware info */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <Monitor className="h-4 w-4 text-muted-foreground" />
                            <h3 className="text-sm font-semibold text-foreground">
                                Hardware Information
                            </h3>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                {
                                    label: "Hostname",
                                    value: hardware?.hostname,
                                },
                                {
                                    label: "Location",
                                    value: hardware?.location_name,
                                },
                                {
                                    label: "Department",
                                    value: hardware?.department_name,
                                },
                                {
                                    label: "Brand / Model",
                                    value: `${hardware?.brand || ""} ${hardware?.model || ""}`.trim(),
                                },
                                {
                                    label: "Serial Number",
                                    value: hardware?.serial_number,
                                },
                            ].map(({ label, value }) => (
                                <div
                                    key={label}
                                    className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5"
                                >
                                    <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-0.5">
                                        {label}
                                    </p>
                                    <p className="text-sm font-semibold text-foreground">
                                        {value || "N/A"}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Issuance details */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <h3 className="text-sm font-semibold text-foreground">
                                Issuance Details
                            </h3>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5 col-span-1">
                                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-0.5">
                                    Issued To
                                </p>
                                <p className="text-sm font-semibold text-foreground">
                                    {hardware?.assignedUsers?.[0]?.fullName ||
                                        "N/A"}
                                </p>
                            </div>
                            <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5">
                                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-0.5">
                                    Issuance Date
                                </p>
                                <p className="text-sm font-semibold text-foreground">
                                    {new Date().toLocaleDateString()}
                                </p>
                            </div>
                            <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5">
                                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-0.5">
                                    Status
                                </p>
                                <InlineBadge className="bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 mt-0.5">
                                    Pending Acknowledgment
                                </InlineBadge>
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-4 gap-3">
                        <StatCard
                            label="Total Changes"
                            value={`${stats.total} items`}
                            valueClass="text-blue-600 dark:text-blue-400 text-lg"
                        />
                        <StatCard
                            label="Additions"
                            value={stats.adds}
                            icon={
                                <PlusCircle className="h-5 w-5 text-emerald-500" />
                            }
                            valueClass="text-emerald-600 dark:text-emerald-400"
                        />
                        <StatCard
                            label="Removals"
                            value={stats.removes}
                            icon={<Trash2 className="h-5 w-5 text-red-500" />}
                            valueClass="text-red-600 dark:text-red-400"
                        />
                        <StatCard
                            label="Replacements"
                            value={stats.replaces}
                            icon={
                                <ArrowLeftRight className="h-5 w-5 text-amber-500" />
                            }
                            valueClass="text-amber-600 dark:text-amber-400"
                        />
                    </div>

                    <Separator />

                    {/* Component changes table */}
                    {tableData.length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold text-foreground mb-3">
                                Component Changes
                            </h3>
                            <div className="rounded-lg border border-border overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm border-collapse min-w-[700px]">
                                        <thead>
                                            <tr className="bg-muted/60 border-b border-border">
                                                {[
                                                    "Operation",
                                                    "Type",
                                                    "Old Component",
                                                    "New Component",
                                                    "Reason / Remarks",
                                                ].map((h) => (
                                                    <th
                                                        key={h}
                                                        className="text-left px-3 py-2.5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground"
                                                    >
                                                        {h}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {tableData.map((row, i) => {
                                                const opCfg =
                                                    operationConfig[
                                                        row.operation
                                                    ] || operationConfig.add;
                                                const typeCfg =
                                                    componentTypeConfig[
                                                        row.componentType
                                                    ] ||
                                                    componentTypeConfig.part;

                                                return (
                                                    <tr
                                                        key={row.key}
                                                        className={cn(
                                                            "border-b border-border/50 align-top",
                                                            i % 2 === 0
                                                                ? "bg-background"
                                                                : "bg-muted/20",
                                                        )}
                                                    >
                                                        <td className="px-3 py-3">
                                                            <InlineBadge
                                                                className={
                                                                    opCfg.className
                                                                }
                                                                icon={
                                                                    opCfg.icon
                                                                }
                                                            >
                                                                {opCfg.label}
                                                            </InlineBadge>
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <InlineBadge
                                                                className={
                                                                    typeCfg
                                                                }
                                                            >
                                                                {row.componentType?.toUpperCase()}
                                                            </InlineBadge>
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <p className="text-sm font-semibold">
                                                                {row.oldComponentId ||
                                                                    "—"}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {row.oldComponent ||
                                                                    "N/A"}
                                                            </p>
                                                            {row.oldCondition && (
                                                                <InlineBadge
                                                                    className={
                                                                        row.oldCondition ===
                                                                        "working"
                                                                            ? "bg-emerald-100 text-emerald-700 border-emerald-200 mt-1"
                                                                            : "bg-red-100 text-red-700 border-red-200 mt-1"
                                                                    }
                                                                >
                                                                    {
                                                                        row.oldCondition
                                                                    }
                                                                </InlineBadge>
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <p className="text-sm font-semibold">
                                                                {row.newComponentId ||
                                                                    "New"}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {row.newComponent ||
                                                                    "N/A"}
                                                            </p>
                                                            {row.newCondition && (
                                                                <InlineBadge className="bg-emerald-100 text-emerald-700 border-emerald-200 mt-1">
                                                                    {
                                                                        row.newCondition
                                                                    }
                                                                </InlineBadge>
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-3 space-y-1">
                                                            {row.reason && (
                                                                <p className="text-xs text-muted-foreground">
                                                                    <span className="font-semibold text-foreground">
                                                                        Reason:
                                                                    </span>{" "}
                                                                    {row.reason}
                                                                </p>
                                                            )}
                                                            {row.remarks && (
                                                                <p className="text-xs text-muted-foreground">
                                                                    <span className="font-semibold text-foreground">
                                                                        Remarks:
                                                                    </span>{" "}
                                                                    {
                                                                        row.remarks
                                                                    }
                                                                </p>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Warnings */}
                    {stats.removes > 0 && (
                        <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800">
                            <AlertTriangle className="h-4 w-4 text-amber-600" />
                            <AlertDescription className="text-amber-700 dark:text-amber-300">
                                {stats.removes} component(s) will be removed
                                from this hardware.
                            </AlertDescription>
                        </Alert>
                    )}

                    <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800">
                        <Info className="h-4 w-4 text-blue-600" />
                        <AlertDescription className="text-blue-700 dark:text-blue-300">
                            The user must acknowledge receipt of these changes.
                            The issuance will be marked as "Pending
                            Acknowledgment" until confirmed.
                        </AlertDescription>
                    </Alert>
                </div>

                {/* Footer */}
                <DialogFooter className="px-6 py-4 border-t border-border/60 bg-card/80 flex-shrink-0">
                    <Button
                        variant="outline"
                        onClick={onCancel}
                        disabled={loading}
                    >
                        Review Changes
                    </Button>
                    <Button onClick={handleConfirm} disabled={loading}>
                        {loading && (
                            <span className="mr-2 h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                        )}
                        <CheckCircle2 className="h-4 w-4 mr-1.5" />
                        Confirm &amp; Create Issuance
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default IssuanceConfirmationModal;
