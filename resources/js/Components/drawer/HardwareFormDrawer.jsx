import React, { useEffect, useState } from "react";
import { Form, Input as AntInput } from "antd";
import {
    DatabaseOutlined,
    EditOutlined,
    HddOutlined,
    CodeOutlined,
    ToolOutlined,
    MinusCircleOutlined,
    PlusOutlined,
    InfoCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { cn } from "@/lib/utils";

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Combobox, MultiCombobox } from "@/Components/ui/Combobox";

import RemovalReasonModal from "../modal/RemovalReasonModal";
import { useHardwareParts } from "@/Hooks/useHardwareParts";
import { useHardwareSoftware } from "@/Hooks/useHardwareSoftware";
import { useRemovalModal } from "@/Hooks/useRemovalModal";
import { convertDatesToDayjs, convertDayjsToStrings } from "@/Utils/dateHelper";
import CascadingPartFields from "@/Components/forms/CascadingPartFields";
import CascadingSoftwareFields from "@/Components/forms/CascadingSoftwareFields";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const flattenPart = (p) => ({
    id: p.id,
    serial_number: p.serial_number ?? "",
    condition: p.condition ?? p.status ?? "Used",
    part_type: p.part_info?.part_type ?? p.part_type ?? "",
    brand: p.part_info?.brand ?? p.brand ?? "",
    model: p.part_info?.model ?? p.model ?? "",
    specifications: p.part_info?.specifications ?? p.specifications ?? "",
    bypass_inventory: p.bypass_inventory ?? false,
});

const flattenSoftware = (s) => {
    const licenseKey = s.license?.license_key ?? s.license_key ?? null;
    const accountUser = s.license?.account_user ?? s.account_user ?? null;
    const accountPass =
        s.license?.account_password ?? s.account_password ?? null;
    const displayValue = licenseKey ?? accountUser;
    return {
        id: s.id,
        installation_date: s.installation_date ?? null,
        software_name: s.inventory?.software_name ?? s.software_name ?? "",
        software_type: s.inventory?.software_type ?? s.software_type ?? "",
        version: s.inventory?.version ?? s.version ?? "",
        _license_identifier: displayValue,
        license_key: displayValue,
        _original_license_key: licenseKey,
        _original_account_user: accountUser,
        account_user: accountUser,
        account_password: accountPass,
        bypass_inventory: s.bypass_inventory ?? false,
    };
};

// ─── Design tokens ────────────────────────────────────────────────────────────
// Every cell column uses this exact three-zone structure so everything aligns:
//   [LABEL_H px] → [GAP px] → [INPUT_H px] → [BOTTOM px]

const LABEL_H = 18;
const GAP = 5;
const INPUT_H = 34;
const BOTTOM = 14;
const TOGGLE_W = 188;

// ─── Cell ─────────────────────────────────────────────────────────────────────

const Cell = ({ label, showLabel, flex, children, className }) => (
    <div className={cn("flex flex-col min-w-0", className)} style={{ flex }}>
        <div
            style={{
                height: LABEL_H,
                marginBottom: GAP,
                display: "flex",
                alignItems: "center",
            }}
        >
            {showLabel && label && (
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 truncate leading-none">
                    {label}
                </Label>
            )}
        </div>
        <div style={{ height: INPUT_H }}>{children}</div>
        <div style={{ height: BOTTOM }} />
    </div>
);

// ─── Source Toggle ────────────────────────────────────────────────────────────
const BypassToggle = ({ name, fieldKey, value, onChange, showLabel }) => {
    // Get form instance
    const form = Form.useFormInstance();

    const handleToggle = (newValue) => {
        // Update the form field value
        form.setFieldValue([name, fieldKey], newValue);
        // Call the parent onChange for UI state
        onChange(newValue);
    };

    return (
        <div
            style={{
                width: TOGGLE_W,
                minWidth: TOGGLE_W,
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
            }}
        >
            <div
                style={{
                    height: LABEL_H,
                    marginBottom: GAP,
                    display: "flex",
                    alignItems: "center",
                }}
            >
                {showLabel && (
                    <TooltipProvider delayDuration={300}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 cursor-default select-none">
                                    Source{" "}
                                    <InfoCircleOutlined
                                        style={{ fontSize: 9 }}
                                    />
                                </span>
                            </TooltipTrigger>
                            <TooltipContent
                                side="top"
                                className="text-xs max-w-xs"
                            >
                                <strong>Inventory</strong> — pulls from stock,
                                tracks quantity.
                                <br />
                                <strong>Manual</strong> — records without
                                affecting inventory.
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
            </div>

            {/* Hidden form item - value will be updated by handleToggle */}
            <Form.Item name={[name, fieldKey]} noStyle>
                <AntInput type="hidden" />
            </Form.Item>

            <div
                className="flex rounded-md border border-input overflow-hidden bg-muted/30"
                style={{ height: INPUT_H }}
            >
                <button
                    type="button"
                    onClick={() => handleToggle(false)}
                    className={cn(
                        "flex-1 flex items-center justify-center gap-1.5 text-[11px] font-semibold transition-all duration-150",
                        !value
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                    )}
                >
                    <DatabaseOutlined style={{ fontSize: 10 }} /> Inventory
                </button>
                <div className="w-px bg-border/60" />
                <button
                    type="button"
                    onClick={() => handleToggle(true)}
                    className={cn(
                        "flex-1 flex items-center justify-center gap-1.5 text-[11px] font-semibold transition-all duration-150",
                        value
                            ? "bg-amber-500 text-white"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                    )}
                >
                    <EditOutlined style={{ fontSize: 10 }} /> Manual
                </button>
            </div>
            <div style={{ height: BOTTOM }} />
        </div>
    );
};
// ─── Remove Button ────────────────────────────────────────────────────────────

const RemoveBtn = ({ onClick }) => (
    <div
        style={{
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
        }}
    >
        <div style={{ height: LABEL_H, marginBottom: GAP }} />
        <div style={{ height: INPUT_H, display: "flex", alignItems: "center" }}>
            <button
                type="button"
                onClick={onClick}
                className="w-8 h-8 rounded-md flex items-center justify-center text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
                <MinusCircleOutlined style={{ fontSize: 14 }} />
            </button>
        </div>
        <div style={{ height: BOTTOM }} />
    </div>
);

// ─── Manual Part Fields ───────────────────────────────────────────────────────

const PART_FIELDS = [
    {
        key: "part_type",
        label: "Part Type",
        placeholder: "e.g. RAM",
        required: true,
        flex: 1,
    },
    {
        key: "brand",
        label: "Brand",
        placeholder: "Brand",
        required: true,
        flex: 1,
    },
    {
        key: "model",
        label: "Model",
        placeholder: "Model",
        required: true,
        flex: 1,
    },
    {
        key: "specifications",
        label: "Specifications",
        placeholder: "e.g. 16GB DDR4",
        required: false,
        flex: 1.3,
    },
    {
        key: "serial_number",
        label: "Serial No.",
        placeholder: "Serial No.",
        required: false,
        flex: 1.3,
    },
];

const ManualPartFields = ({ name, showLabels }) => (
    <div className="flex gap-2 flex-1 min-w-0">
        {PART_FIELDS.map(({ key, label, placeholder, required, flex }) => (
            <Cell
                key={key}
                label={label}
                showLabel={showLabels}
                flex={flex}
                className="min-w-0"
            >
                <Form.Item
                    name={[name, key]}
                    rules={
                        required
                            ? [{ required: true, message: "Required" }]
                            : []
                    }
                    noStyle
                >
                    <Input
                        placeholder={placeholder}
                        className="text-sm w-full"
                        style={{ height: INPUT_H }}
                    />
                </Form.Item>
            </Cell>
        ))}
    </div>
);

// ─── Manual Software Fields ───────────────────────────────────────────────────

const SW_FIELDS = [
    {
        key: "software_name",
        label: "Software Name",
        placeholder: "e.g. Office",
        required: true,
        flex: 1.6,
    },
    {
        key: "software_type",
        label: "Type",
        placeholder: "e.g. Productivity",
        required: true,
        flex: 1.1,
    },
    {
        key: "version",
        label: "Version",
        placeholder: "e.g. 2021",
        required: true,
        flex: 0.9,
    },
    {
        key: "license_key",
        label: "License Key",
        placeholder: "Optional",
        required: false,
        flex: 1.8,
    },
];

const ManualSoftwareFields = ({ name, showLabels }) => (
    <div className="flex gap-2 flex-1 min-w-0">
        {SW_FIELDS.map(({ key, label, placeholder, required, flex }) => (
            <Cell
                key={key}
                label={label}
                showLabel={showLabels}
                flex={flex}
                className="min-w-0"
            >
                <Form.Item
                    name={[name, key]}
                    rules={
                        required
                            ? [{ required: true, message: "Required" }]
                            : []
                    }
                    noStyle
                >
                    <Input
                        placeholder={placeholder}
                        className="text-sm w-full"
                        style={{ height: INPUT_H }}
                    />
                </Form.Item>
            </Cell>
        ))}
    </div>
);

// ─── List Row Card ────────────────────────────────────────────────────────────

const ListRowCard = ({ isManual, children }) => (
    <div
        className={cn(
            "rounded-xl mb-2 px-3 border transition-all duration-200",
            isManual
                ? "bg-amber-50/70 border-amber-300/60 border-dashed dark:bg-amber-950/15 dark:border-amber-700/40"
                : "bg-card border-border/40",
        )}
    >
        {children}
    </div>
);

// ─── Section Header ───────────────────────────────────────────────────────────

const SectionHeader = ({ icon, title, subtitle, count }) => (
    <div className="flex items-center gap-3 mb-4 pb-3 border-b border-border/40">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0 text-sm">
            {icon}
        </div>
        <div className="flex-1">
            <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-foreground leading-none">
                    {title}
                </p>
                {count !== undefined && (
                    <Badge
                        variant="secondary"
                        className="text-[10px] px-1.5 py-0 h-4 rounded-full"
                    >
                        {count}
                    </Badge>
                )}
            </div>
            {subtitle && (
                <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
        </div>
    </div>
);

const EmptyState = ({ emoji, label }) => (
    <div className="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground/30 rounded-xl border border-dashed border-border/30 mb-3 bg-muted/5">
        <span className="text-2xl">{emoji}</span>
        <p className="text-xs font-medium">No {label} added yet</p>
    </div>
);

const Loader = () => (
    <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
    </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

const HardwareFormDrawer = ({ open, onClose, item, onSave, fieldGroups }) => {
    const [removedItems, setRemovedItems] = useState({});
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();
    const [bypassParts, setBypassParts] = useState({});
    const [bypassSoftware, setBypassSoftware] = useState({});
    const [partsData, setPartsData] = useState([]);
    const [softwareData, setSoftwareData] = useState([]);

    const {
        removalModalVisible,
        pendingRemoval,
        removalForm,
        handleRemoveWithReason,
        confirmRemoval,
        cancelRemoval,
    } = useRemovalModal(form, setRemovedItems);

    const partsHooks = useHardwareParts(form);
    const softwareHooks = useHardwareSoftware(form);

    useEffect(() => {
        if (!open) return;

        // Load base data (only once)
        partsHooks.loadPartTypes();
        softwareHooks.loadSoftwareNames();

        if (item) {
            setLoading(true);

            // Process parts and software
            const flatParts = (Array.isArray(item.parts) ? item.parts : []).map(
                (p, index) => ({
                    ...flattenPart(p),
                    _tempId: `part_${index}_${p.id || Date.now()}`,
                }),
            );

            const flatSoftware = (
                Array.isArray(item.software) ? item.software : []
            ).map((s, index) => ({
                ...flattenSoftware(s),
                _tempId: `sw_${index}_${s.id || Date.now()}`,
            }));

            setPartsData(flatParts);
            setSoftwareData(flatSoftware);

            // Set bypass states
            const ibp = {};
            flatParts.forEach((p, i) => {
                if (p.bypass_inventory) ibp[i] = true;
            });

            const ibs = {};
            flatSoftware.forEach((s, i) => {
                if (s.bypass_inventory) ibs[i] = true;
            });

            setBypassParts(ibp);
            setBypassSoftware(ibs);

            // Set form values immediately (don't wait for preloads)
            const formValues = convertDatesToDayjs({
                ...item,
                date_issued: item.date_issued ? dayjs(item.date_issued) : null,
                remarks: "",
                parts: flatParts,
                software: flatSoftware,
            });

            form.setFieldsValue(formValues);

            // Preload all part data in parallel (don't await)
            const preloadPromises = flatParts
                .filter((part) => !part.bypass_inventory)
                .map((part) => partsHooks.preloadPartData?.(part));

            // Preload all software data in parallel
            const preloadSoftwarePromises = flatSoftware
                .filter((sw) => !sw.bypass_inventory)
                .map((sw) => softwareHooks.preloadSoftwareData?.(sw));

            // Wait for all preloads to complete before setting loading to false
            Promise.all([
                ...preloadPromises,
                ...preloadSoftwarePromises,
            ]).finally(() => {
                setLoading(false);
            });
        } else {
            form.resetFields();
            form.setFieldsValue({ parts: [], software: [] });
            setPartsData([]);
            setSoftwareData([]);
            setRemovedItems({});
            setBypassParts({});
            setBypassSoftware({});
            setLoading(false);
        }
    }, [open, item?.id]);

    // ─── Submit ───────────────────────────────────────────────────────────────
    const handleFinish = (values) => {
        const fv = convertDayjsToStrings(values);

        if (Array.isArray(fv.software)) {
            fv.software = fv.software.map((sw, index) => {
                if (sw.bypass_inventory) {
                    return {
                        id: sw.id ?? undefined,
                        bypass_inventory: true,
                        software_name: sw.software_name,
                        software_type: sw.software_type,
                        version: sw.version,
                        license_key: sw.license_key || null,
                        account_user: null,
                        account_password: null,
                    };
                }
                const fn = `software_${index}`;
                const opts = softwareHooks.softwareOptions.licenses?.[fn] || [];
                const sel = opts.find(
                    (o) => o.value === sw._license_identifier,
                );
                const ld = sel?.license_data;
                const isKey =
                    ld &&
                    ld.license_key !== null &&
                    ld.license_key !== undefined &&
                    ld.license_key !== "";
                const result = {
                    ...sw,
                    bypass_inventory: false,
                    _license_identifier: undefined,
                    _original_license_key: undefined,
                    _original_account_user: undefined,
                };
                if (isKey) {
                    result.license_key = sw._license_identifier;
                    result.account_user = null;
                    result.account_password = null;
                } else if (ld) {
                    result.license_key = null;
                    result.account_user = sw._license_identifier;
                    result.account_password = ld.account_password || null;
                } else {
                    result.license_key = sw._original_license_key || null;
                    result.account_user = sw._original_account_user || null;
                    result.account_password = sw.account_password || null;
                }
                return result;
            });
        }

        if (Array.isArray(fv.parts)) {
            fv.parts = fv.parts.map((part) => {
                if (part.bypass_inventory)
                    return {
                        id: part.id ?? undefined,
                        bypass_inventory: true,
                        part_type: part.part_type,
                        brand: part.brand,
                        model: part.model,
                        specifications: part.specifications || null,
                        serial_number: part.serial_number || null,
                        condition: part.condition || null,
                    };
                if (
                    part.specifications &&
                    typeof part.specifications === "string"
                ) {
                    try {
                        const p = JSON.parse(part.specifications);
                        return {
                            ...part,
                            bypass_inventory: false,
                            specifications:
                                p.specifications || part.specifications,
                            condition: p.condition || "Used",
                        };
                    } catch {
                        return {
                            ...part,
                            bypass_inventory: false,
                            condition: "Used",
                        };
                    }
                }
                return {
                    ...part,
                    bypass_inventory: false,
                    condition: part.condition || "Used",
                };
            });
        }

        Object.entries(removedItems).forEach(([key, items]) => {
            if (items?.length > 0) {
                fv[key] = fv[key] || [];
                items.forEach((r) =>
                    fv[key].push({
                        id: r.id,
                        _delete: true,
                        removal_reason: r.reason,
                        removal_condition: r.condition,
                        removal_remarks: r.remarks,
                    }),
                );
            }
        });

        onSave(fv, item?.id);
        setRemovedItems({});
    };

    const handlePartRemove = (name, listRemove) => {
        const row = (form.getFieldValue("parts") ?? [])[name] ?? {};
        if (!row.id) {
            listRemove(name);
            setBypassParts((p) => {
                const n = { ...p };
                delete n[name];
                return n;
            });
            return;
        }
        handleRemoveWithReason("parts", name, row);
    };
    const handleSoftwareRemove = (name, listRemove) => {
        const row = (form.getFieldValue("software") ?? [])[name] ?? {};
        if (!row.id) {
            listRemove(name);
            setBypassSoftware((p) => {
                const n = { ...p };
                delete n[name];
                return n;
            });
            return;
        }
        handleRemoveWithReason("software", name, row);
    };

    const hwFields =
        fieldGroups?.find((g) => g.title === "Hardware Specifications")
            ?.fields ?? [];

    return (
        <>
            <Sheet
                open={open}
                onOpenChange={(v) => {
                    if (!v && removalModalVisible) return;
                    !v && onClose();
                }}
            >
                <SheetContent
                    side="bottom"
                    showCloseButton={false}
                    className="p-0 flex flex-col gap-0 overflow-hidden h-[92vh] rounded-t-2xl focus:outline-none"
                    onInteractOutside={(e) => e.preventDefault()}
                    onPointerDownOutside={(e) => e.preventDefault()}
                    onFocusOutside={(e) => e.preventDefault()}
                >
                    {/* Drag handle */}
                    <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                        <div className="w-10 h-1 rounded-full bg-border/50" />
                    </div>

                    {/* ── Header ── */}
                    <SheetHeader className="px-6 py-3 border-b border-border/40 flex-shrink-0 space-y-0">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                                <HddOutlined className="text-sm" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <SheetTitle className="text-sm font-semibold leading-tight truncate">
                                    {item
                                        ? `Edit: ${item.hostname || "Hardware"}`
                                        : "New Hardware"}
                                </SheetTitle>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {item
                                        ? "Update device information, parts and software"
                                        : "Register a new device to the system"}
                                </p>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={onClose}
                                className="flex-shrink-0 h-8 px-3 text-xs"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                onClick={() => form.submit()}
                                className="flex-shrink-0 h-8 px-4 text-xs"
                            >
                                {item ? "Save Changes" : "Create Device"}
                            </Button>
                        </div>
                    </SheetHeader>

                    {/* ── Body ── */}
                    <div className="flex-1 overflow-y-auto min-h-0">
                        {loading ? (
                            <Loader />
                        ) : (
                            <Form
                                form={form}
                                layout="vertical"
                                onFinish={handleFinish}
                                autoComplete="off"
                            >
                                <Tabs
                                    defaultValue="hardware"
                                    className="w-full"
                                >
                                    {/* Sticky tab bar */}
                                    <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/40 px-6">
                                        <TabsList className="h-10 bg-transparent gap-0 rounded-none p-0 w-auto">
                                            {[
                                                {
                                                    value: "hardware",
                                                    icon: <HddOutlined />,
                                                    label: "Hardware",
                                                },
                                                {
                                                    value: "parts",
                                                    icon: <ToolOutlined />,
                                                    label: "Parts",
                                                },
                                                {
                                                    value: "software",
                                                    icon: <CodeOutlined />,
                                                    label: "Software",
                                                },
                                            ].map(({ value, icon, label }) => (
                                                <TabsTrigger
                                                    key={value}
                                                    value={value}
                                                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none h-10 px-5 gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                                                >
                                                    {icon} {label}
                                                </TabsTrigger>
                                            ))}
                                        </TabsList>
                                    </div>

                                    {/* ── Hardware Tab ── */}
                                    <TabsContent
                                        value="hardware"
                                        className="px-6 pt-5 pb-6 mt-0 data-[state=inactive]:hidden"
                                        forceMount
                                    >
                                        <SectionHeader
                                            icon={<HddOutlined />}
                                            title="Hardware Specifications"
                                            subtitle="Core device information and identifiers"
                                        />
                                        <div className="grid grid-cols-4 gap-x-3">
                                            {hwFields.map((field) => {
                                                if (field.type === "hidden")
                                                    return (
                                                        <Form.Item
                                                            key={field.key}
                                                            name={
                                                                field.dataIndex
                                                            }
                                                            style={{
                                                                display: "none",
                                                            }}
                                                        >
                                                            <AntInput type="hidden" />
                                                        </Form.Item>
                                                    );
                                                return (
                                                    <Cell
                                                        key={field.key}
                                                        label={field.label}
                                                        showLabel
                                                        flex={1}
                                                    >
                                                        <Form.Item
                                                            name={
                                                                field.dataIndex
                                                            }
                                                            rules={
                                                                field.rules ||
                                                                []
                                                            }
                                                            noStyle
                                                        >
                                                            {field.type ===
                                                            "select" ? (
                                                                <Combobox
                                                                    options={
                                                                        field.options ??
                                                                        []
                                                                    }
                                                                    placeholder={`Select ${field.label}`}
                                                                    loading={
                                                                        field.loading ??
                                                                        false
                                                                    }
                                                                    style={{
                                                                        height: INPUT_H,
                                                                    }}
                                                                />
                                                            ) : field.type ===
                                                              "multiSelect" ? (
                                                                <MultiCombobox
                                                                    options={
                                                                        field.options ??
                                                                        []
                                                                    }
                                                                    placeholder={`Select ${field.label}`}
                                                                    loading={
                                                                        field.loading ??
                                                                        false
                                                                    }
                                                                    style={{
                                                                        height: INPUT_H,
                                                                    }}
                                                                />
                                                            ) : (
                                                                <Input
                                                                    placeholder={`Enter ${field.label}`}
                                                                    className="text-sm"
                                                                    style={{
                                                                        height: INPUT_H,
                                                                    }}
                                                                />
                                                            )}
                                                        </Form.Item>
                                                    </Cell>
                                                );
                                            })}
                                        </div>
                                    </TabsContent>

                                    {/* ── Parts Tab ── */}
                                    <TabsContent
                                        value="parts"
                                        className="px-6 pt-5 pb-6 mt-0 data-[state=inactive]:hidden"
                                        forceMount
                                    >
                                        <Form.List name="parts">
                                            {(fields, { add, remove }) => (
                                                <>
                                                    <SectionHeader
                                                        icon={<ToolOutlined />}
                                                        title="Hardware Parts"
                                                        subtitle="Physical components attached to this device"
                                                        count={fields.length}
                                                    />
                                                    {fields.length === 0 && (
                                                        <EmptyState
                                                            emoji="🔧"
                                                            label="parts"
                                                        />
                                                    )}

                                                    {fields.map(
                                                        (
                                                            { key, name },
                                                            index,
                                                        ) => {
                                                            const isManual =
                                                                !!bypassParts[
                                                                    name
                                                                ];
                                                            const showLabel =
                                                                index === 0;
                                                            return (
                                                                <ListRowCard
                                                                    key={key}
                                                                    isManual={
                                                                        isManual
                                                                    }
                                                                >
                                                                    <Form.Item
                                                                        name={[
                                                                            name,
                                                                            "id",
                                                                        ]}
                                                                        hidden
                                                                    >
                                                                        <AntInput type="hidden" />
                                                                    </Form.Item>
                                                                    <Form.Item
                                                                        name={[
                                                                            name,
                                                                            "condition",
                                                                        ]}
                                                                        hidden
                                                                    >
                                                                        <AntInput type="hidden" />
                                                                    </Form.Item>

                                                                    <div className="flex items-start gap-2">
                                                                        <BypassToggle
                                                                            name={
                                                                                name
                                                                            }
                                                                            fieldKey="bypass_inventory"
                                                                            showLabel={
                                                                                showLabel
                                                                            }
                                                                            value={
                                                                                isManual
                                                                            }
                                                                            onChange={(
                                                                                val,
                                                                            ) => {
                                                                                // Update both the UI state AND the form field value
                                                                                setBypassParts(
                                                                                    (
                                                                                        p,
                                                                                    ) => ({
                                                                                        ...p,
                                                                                        [name]: val,
                                                                                    }),
                                                                                );
                                                                                // Also update the actual form field
                                                                                form.setFieldValue(
                                                                                    [
                                                                                        "parts",
                                                                                        name,
                                                                                        "bypass_inventory",
                                                                                    ],
                                                                                    val,
                                                                                );
                                                                            }}
                                                                        />

                                                                        {/*
                                                                      Both ManualPartFields and CascadingPartFields now return
                                                                      identical flex divs — no wrapper needed, alignment is native.
                                                                    */}
                                                                        {isManual ? (
                                                                            <ManualPartFields
                                                                                name={
                                                                                    name
                                                                                }
                                                                                showLabels={
                                                                                    showLabel
                                                                                }
                                                                            />
                                                                        ) : (
                                                                            <CascadingPartFields
                                                                                fieldPrefix={`parts_${name}`}
                                                                                form={
                                                                                    form
                                                                                }
                                                                                partsHooks={
                                                                                    partsHooks
                                                                                }
                                                                                layout="inline"
                                                                                showLabels={
                                                                                    showLabel
                                                                                }
                                                                                isFormList={
                                                                                    true
                                                                                }
                                                                                rowIndex={
                                                                                    name
                                                                                }
                                                                                rowData={
                                                                                    partsData[
                                                                                        name
                                                                                    ] ??
                                                                                    null
                                                                                }
                                                                            />
                                                                        )}

                                                                        <RemoveBtn
                                                                            onClick={() =>
                                                                                handlePartRemove(
                                                                                    name,
                                                                                    remove,
                                                                                )
                                                                            }
                                                                        />
                                                                    </div>
                                                                </ListRowCard>
                                                            );
                                                        },
                                                    )}

                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        className="w-full mt-1 h-9 border-dashed text-muted-foreground hover:text-primary hover:border-primary gap-2 text-xs font-semibold"
                                                        onClick={() =>
                                                            add({
                                                                bypass_inventory: false,
                                                            })
                                                        }
                                                    >
                                                        <PlusOutlined /> Add
                                                        Part
                                                    </Button>
                                                </>
                                            )}
                                        </Form.List>
                                    </TabsContent>

                                    {/* ── Software Tab ── */}
                                    <TabsContent
                                        value="software"
                                        className="px-6 pt-5 pb-6 mt-0 data-[state=inactive]:hidden"
                                        forceMount
                                    >
                                        <Form.List name="software">
                                            {(fields, { add, remove }) => (
                                                <>
                                                    <SectionHeader
                                                        icon={<CodeOutlined />}
                                                        title="Installed Software"
                                                        subtitle="Licenses and applications on this device"
                                                        count={fields.length}
                                                    />
                                                    {fields.length === 0 && (
                                                        <EmptyState
                                                            emoji="💿"
                                                            label="software"
                                                        />
                                                    )}

                                                    {fields.map(
                                                        (
                                                            { key, name },
                                                            index,
                                                        ) => {
                                                            const isManual =
                                                                !!bypassSoftware[
                                                                    name
                                                                ];
                                                            const showLabel =
                                                                index === 0;
                                                            return (
                                                                <ListRowCard
                                                                    key={key}
                                                                    isManual={
                                                                        isManual
                                                                    }
                                                                >
                                                                    <Form.Item
                                                                        name={[
                                                                            name,
                                                                            "id",
                                                                        ]}
                                                                        hidden
                                                                    >
                                                                        <AntInput type="hidden" />
                                                                    </Form.Item>
                                                                    <Form.Item
                                                                        name={[
                                                                            name,
                                                                            "account_user",
                                                                        ]}
                                                                        hidden
                                                                    >
                                                                        <AntInput type="hidden" />
                                                                    </Form.Item>
                                                                    <Form.Item
                                                                        name={[
                                                                            name,
                                                                            "account_password",
                                                                        ]}
                                                                        hidden
                                                                    >
                                                                        <AntInput type="hidden" />
                                                                    </Form.Item>

                                                                    <div className="flex items-start gap-2">
                                                                        <BypassToggle
                                                                            name={
                                                                                name
                                                                            }
                                                                            fieldKey="bypass_inventory"
                                                                            showLabel={
                                                                                showLabel
                                                                            }
                                                                            value={
                                                                                isManual
                                                                            }
                                                                            onChange={(
                                                                                val,
                                                                            ) => {
                                                                                // Update both the UI state AND the form field value
                                                                                setBypassSoftware(
                                                                                    (
                                                                                        p,
                                                                                    ) => ({
                                                                                        ...p,
                                                                                        [name]: val,
                                                                                    }),
                                                                                );
                                                                                // Also update the actual form field
                                                                                form.setFieldValue(
                                                                                    [
                                                                                        "software",
                                                                                        name,
                                                                                        "bypass_inventory",
                                                                                    ],
                                                                                    val,
                                                                                );
                                                                            }}
                                                                        />

                                                                        {isManual ? (
                                                                            <ManualSoftwareFields
                                                                                name={
                                                                                    name
                                                                                }
                                                                                showLabels={
                                                                                    showLabel
                                                                                }
                                                                            />
                                                                        ) : (
                                                                            <CascadingSoftwareFields
                                                                                fieldPrefix={`software_${name}`}
                                                                                form={
                                                                                    form
                                                                                }
                                                                                softwareHooks={
                                                                                    softwareHooks
                                                                                }
                                                                                layout="inline"
                                                                                showLabels={
                                                                                    showLabel
                                                                                }
                                                                                isFormList={
                                                                                    true
                                                                                }
                                                                                rowIndex={
                                                                                    name
                                                                                }
                                                                                rowData={
                                                                                    softwareData[
                                                                                        name
                                                                                    ] ??
                                                                                    null
                                                                                }
                                                                            />
                                                                        )}

                                                                        <RemoveBtn
                                                                            onClick={() =>
                                                                                handleSoftwareRemove(
                                                                                    name,
                                                                                    remove,
                                                                                )
                                                                            }
                                                                        />
                                                                    </div>
                                                                </ListRowCard>
                                                            );
                                                        },
                                                    )}

                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        className="w-full mt-1 h-9 border-dashed text-muted-foreground hover:text-primary hover:border-primary gap-2 text-xs font-semibold"
                                                        onClick={() =>
                                                            add({
                                                                bypass_inventory: false,
                                                            })
                                                        }
                                                    >
                                                        <PlusOutlined /> Add
                                                        Software
                                                    </Button>
                                                </>
                                            )}
                                        </Form.List>
                                    </TabsContent>
                                </Tabs>
                            </Form>
                        )}
                    </div>
                </SheetContent>
            </Sheet>

            <RemovalReasonModal
                visible={removalModalVisible}
                onConfirm={confirmRemoval}
                onCancel={cancelRemoval}
                form={removalForm}
                itemType={pendingRemoval?.fieldDataIndex}
            />
        </>
    );
};

export default HardwareFormDrawer;
