import React, { useState, useCallback } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { toast } from "sonner";
import axios from "axios";
import { usePage } from "@inertiajs/react";

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
    Wrench,
    ArrowLeftRight,
    PlusCircle,
    Trash2,
    Save,
    X,
} from "lucide-react";

import { useComponentMaintenance } from "@/Hooks/useComponentMaintenance";
import HardwareInfo from "./HardwareInfo";
import ReplaceComponent from "./ReplaceComponent";
import AddComponent from "./AddComponent";
import RemoveComponent from "./RemoveComponent";
import IssuanceConfirmationModal from "./IssuanceConfirmationModal";

// ── Constants ─────────────────────────────────────────────────────────────────

const ACTION_TABS = [
    {
        value: "replace",
        label: "Replace",
        icon: ArrowLeftRight,
        activeClass: "bg-blue-600 text-white shadow-sm dark:bg-blue-500",
        inactiveClass:
            "text-muted-foreground hover:text-foreground hover:bg-muted/60",
    },
    {
        value: "add",
        label: "Add",
        icon: PlusCircle,
        activeClass: "bg-emerald-600 text-white shadow-sm dark:bg-emerald-500",
        inactiveClass:
            "text-muted-foreground hover:text-foreground hover:bg-muted/60",
    },
    {
        value: "remove",
        label: "Remove",
        icon: Trash2,
        activeClass: "bg-red-600 text-white shadow-sm dark:bg-red-500",
        inactiveClass:
            "text-muted-foreground hover:text-foreground hover:bg-muted/60",
    },
];

const DEFAULT_VALUES = {
    components: [],
    replacements: [],
    components_to_remove: [{}],
};

// ── Inner component (always has hardware) ─────────────────────────────────────
// Separated so all hooks always run with a valid hardware object,
// eliminating hook-count changes between renders.

const DrawerContent = ({
    open,
    onClose,
    hardware, // kept for compatibility
    entity,
    componentTypes,
    fetchEndpoints,
    getColumns,
    infoFields,
    onSave,
}) => {
    const [action, setAction] = useState("replace");
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [pendingData, setPendingData] = useState(null);
    const [loading, setLoading] = useState(false);

    const { emp_data } = usePage().props;

    const form = useForm({ defaultValues: DEFAULT_VALUES });

    const {
        selectedComponentType,
        handleComponentTypeSelect,
        getComponentOptions,
        handleClose,
    } = useComponentMaintenance(
        form,
        open,
        entity || hardware,
        action,
        onSave,
        onClose,
    );

    const handleActionChange = useCallback(
        (val) => {
            setAction(val);
            form.reset(DEFAULT_VALUES);
        },
        [form],
    );

    // ── Payload builder ───────────────────────────────────────────────────────

    const buildPayload = useCallback(
        (values) => {
            const subject = entity || hardware;

            // Detect entity type — printers have printer_name, hardware has hostname
            const entityType = subject?.printer_name ? "printer" : "hardware";

            const base = {
                hardware_id: subject?.id,
                entity_id: subject?.id,
                entity_type: entityType, // ← add this
                hostname: subject?.hostname ?? subject?.printer_name, // ← fallback for printers
                issued_to: subject?.issued_to,
            };
            const payloads = [];

            const pushItem = (item, type) => {
                const qty = item.quantity || 1;
                for (let i = 0; i < qty; i++) {
                    const common = {
                        ...base,
                        component_type: item.component_type,
                        operation: type,
                        reason: item.reason || null,
                        remarks: item.remarks || null,
                    };
                    if (item.component_type === "part") {
                        payloads.push({
                            ...common,
                            ...(type === "replace"
                                ? {
                                      component_id: item.component_id,
                                      component_to_replace:
                                          item.component_to_replace,
                                      old_component_condition:
                                          item.old_component_condition,
                                      replacement_part_type:
                                          item.replacement_part_type,
                                      replacement_brand: item.replacement_brand,
                                      replacement_model: item.replacement_model,
                                      replacement_specifications:
                                          item.replacement_specifications ||
                                          null,
                                      replacement_condition:
                                          item.replacement_condition || "New",
                                      replacement_serial_number:
                                          item.replacement_serial_number ||
                                          null,
                                  }
                                : {
                                      new_component_id: item.component_id,
                                      new_part_type: item.new_part_type,
                                      new_brand: item.new_brand,
                                      new_model: item.new_model,
                                      new_specifications:
                                          item.new_specifications || null,
                                      new_condition:
                                          item.new_condition || "New",
                                      new_serial_number:
                                          item.new_serial_number || null,
                                  }),
                        });
                    } else if (item.component_type === "software") {
                        payloads.push({
                            ...common,
                            ...(type === "replace"
                                ? {
                                      component_id: item.component_id,
                                      component_to_replace:
                                          item.component_to_replace,
                                      old_component_condition:
                                          item.old_component_condition,
                                      replacement_software_name:
                                          item.replacement_software_name,
                                      replacement_software_type:
                                          item.replacement_software_type,
                                      replacement_version:
                                          item.replacement_version,
                                  }
                                : {
                                      new_software_name: item.new_software_name,
                                      new_software_type: item.new_software_type,
                                      new_version: item.new_version,
                                      new_license_key:
                                          item.new_license_key || null,
                                      new_account_user:
                                          item.new_account_user || null,
                                      new_account_password:
                                          item.new_account_password || null,
                                  }),
                        });
                    }
                }
            };

            if (action === "replace")
                (values.replacements || []).forEach((r) =>
                    pushItem(r, "replace"),
                );
            else if (action === "add")
                (values.components || []).forEach((c) => pushItem(c, "add"));
            else if (action === "remove")
                (values.components_to_remove || []).forEach((c) =>
                    payloads.push({
                        ...base,
                        component_id: c.component_id,
                        component_type: c.component_type,
                        operation: "remove",
                        condition: c.condition,
                        reason: c.reason,
                        remarks: c.remarks || null,
                    }),
                );

            return payloads;
        },
        [action, entity, hardware],
    );

    // ── Save ──────────────────────────────────────────────────────────────────

    const handleSave = useCallback(
        form.handleSubmit(
            (values) => {
                if (action === "replace" && !values.replacements?.length) {
                    toast.error(
                        "Please select at least one component to replace",
                    );
                    return;
                }
                if (action === "add" && !values.components?.length) {
                    toast.error("Please select at least one component to add");
                    return;
                }
                if (
                    action === "remove" &&
                    !values.components_to_remove?.some((c) => c.component_id)
                ) {
                    toast.error(
                        "Please select at least one component to remove",
                    );
                    return;
                }
                setPendingData(values);
                setShowConfirmModal(true);
            },
            () => toast.error("Please fill in all required fields"),
        ),
        [action, form],
    );

    const handleConfirmSubmit = useCallback(async () => {
        try {
            setLoading(true);
            if (!pendingData) {
                toast.error("No data to submit");
                return;
            }

            const payloads = buildPayload(pendingData);
            if (!payloads.length) {
                toast.error("Please select at least one component");
                return;
            }

            await axios.post(route("component.maintenance.batch"), {
                employee_id: emp_data?.emp_id,
                operations: payloads,
            });

            toast.success(
                `Component ${action} completed (${payloads.length} item${payloads.length > 1 ? "s" : ""})`,
            );

            setShowConfirmModal(false);
            setPendingData(null);
            form.reset(DEFAULT_VALUES);
            onSave?.();
            handleClose();
        } catch (error) {
            toast.error(
                error.response?.data?.message ||
                    `Failed to ${action} components`,
            );
        } finally {
            setLoading(false);
        }
    }, [
        action,
        pendingData,
        buildPayload,
        emp_data,
        form,
        handleClose,
        onSave,
    ]);

    return (
        <>
            <SheetContent
                side="right"
                className="!max-w-[1200px] w-full p-0 flex flex-col gap-0"
                showCloseButton={false}
            >
                {/* Header */}
                <SheetHeader className="px-6 py-4 border-b border-border/60 bg-card/80 flex-shrink-0">
                    <SheetTitle className="flex items-center gap-2 text-base">
                        <Wrench className="h-4 w-4 text-muted-foreground" />
                        Component Maintenance
                    </SheetTitle>
                </SheetHeader>

                {/* Body */}
                <FormProvider {...form}>
                    <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                        <HardwareInfo
                            hardware={hardware}
                            entity={entity || hardware}
                            fields={infoFields}
                        />

                        <Separator />

                        {/* Action tabs */}
                        <div className="flex rounded-lg bg-muted/40 border border-border/60 p-1 gap-1">
                            {ACTION_TABS.map(
                                ({
                                    value,
                                    label,
                                    icon: Icon,
                                    activeClass,
                                    inactiveClass,
                                }) => (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() =>
                                            handleActionChange(value)
                                        }
                                        className={cn(
                                            "flex-1 flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all duration-150",
                                            action === value
                                                ? activeClass
                                                : inactiveClass,
                                        )}
                                    >
                                        <Icon className="h-3.5 w-3.5" />
                                        {label}
                                    </button>
                                ),
                            )}
                        </div>

                        {/* Active panel */}
                        {action === "replace" && (
                            <ReplaceComponent
                                componentOptions={getComponentOptions()}
                                hardware={hardware}
                                entity={entity || hardware}
                                fetchEndpoints={fetchEndpoints}
                                getColumns={getColumns}
                            />
                        )}
                        {action === "add" && (
                            <AddComponent
                                selectedComponentType={selectedComponentType}
                                onComponentTypeSelect={
                                    handleComponentTypeSelect
                                }
                                componentTypes={componentTypes}
                                fetchEndpoints={fetchEndpoints}
                                getColumns={getColumns}
                            />
                        )}
                        {action === "remove" && (
                            <RemoveComponent
                                componentOptions={getComponentOptions()}
                                hardware={hardware}
                                entity={entity || hardware}
                            />
                        )}
                    </div>
                </FormProvider>

                {/* Footer */}
                <div className="flex-shrink-0 border-t border-border/60 bg-card/80 px-6 py-4 flex items-center justify-end gap-2">
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        disabled={loading}
                    >
                        <X className="h-4 w-4 mr-1.5" />
                        Cancel
                    </Button>
                    <Button
                        variant={
                            action === "remove" ? "destructive" : "default"
                        }
                        onClick={handleSave}
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="h-4 w-4 mr-2 rounded-full border-2 border-current/30 border-t-current animate-spin" />
                        ) : (
                            <Save className="h-4 w-4 mr-1.5" />
                        )}
                        Save All Changes
                    </Button>
                </div>
            </SheetContent>

            <IssuanceConfirmationModal
                visible={showConfirmModal}
                onCancel={() => setShowConfirmModal(false)}
                onConfirm={handleConfirmSubmit}
                hardware={hardware}
                operations={pendingData}
                action={action}
                employeeData={emp_data}
                loading={loading}
            />
        </>
    );
};

// ── Outer shell — only mounts DrawerContent when hardware exists ──────────────
// This prevents hooks inside DrawerContent from running with null hardware,
// which was causing the "Rendered more hooks than previous render" error.

const ComponentMaintenanceDrawer = ({
    open,
    onClose,
    hardware,
    entity,
    componentTypes,
    fetchEndpoints,
    getColumns,
    infoFields,
    onSave,
}) => {
    return (
        <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
            {(hardware || entity) && (
                <DrawerContent
                    open={open}
                    onClose={onClose}
                    hardware={hardware}
                    entity={entity}
                    componentTypes={componentTypes}
                    fetchEndpoints={fetchEndpoints}
                    getColumns={getColumns}
                    infoFields={infoFields}
                    onSave={onSave}
                />
            )}
        </Sheet>
    );
};

export default ComponentMaintenanceDrawer;
