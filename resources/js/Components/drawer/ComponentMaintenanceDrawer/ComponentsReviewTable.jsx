import React from "react";
import { Input } from "@/Components/ui/input";
import { Textarea } from "@/Components/ui/textarea";
import { Button } from "@/Components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select";
import { Badge } from "@/Components/ui/badge";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const CONDITION_OPTIONS = [
    { value: "working", label: "Working — Return to Inventory" },
    { value: "faulty", label: "Faulty — For Repair" },
    { value: "defective", label: "Defective — Dispose" },
    { value: "damaged", label: "Damaged — Dispose" },
];

// ── Small helpers ─────────────────────────────────────────────────────────────

const PartDetails = ({ data }) => {
    if (!data) return <span className="text-muted-foreground text-xs">—</span>;
    const brand = data?.brand || data?.part_info?.brand;
    const model = data?.model || data?.part_info?.model;
    const partType = data?.part_type || data?.part_info?.part_type;
    const specs = data?.specifications || data?.part_info?.specifications;
    return (
        <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
                {brand} {model}
            </p>
            <p className="text-xs text-muted-foreground truncate">
                {partType} • {specs}
            </p>
            {data?.condition && (
                <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                    Condition: {data.condition}
                </p>
            )}
        </div>
    );
};

const SoftwareDetails = ({ data }) => {
    if (!data) return <span className="text-muted-foreground text-xs">—</span>;
    const name = data?.software_name || data?.inventory?.software_name;
    const type = data?.software_type || data?.inventory?.software_type;
    const version = data?.version || data?.inventory?.version;
    return (
        <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">{name}</p>
            <p className="text-xs text-muted-foreground">
                {type} • v{version}
            </p>
            {data?.identifier && (
                <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                    {data?.identifier_type || "ID"}: {data.identifier}
                </p>
            )}
        </div>
    );
};

const ComponentDetails = ({ data, type }) => {
    if (type === "part") return <PartDetails data={data} />;
    return <SoftwareDetails data={data} />;
};

// ── Cell components ───────────────────────────────────────────────────────────

const FieldError = ({ show }) =>
    show ? <p className="text-[11px] text-destructive mt-1">Required</p> : null;

// ── Main component ────────────────────────────────────────────────────────────

const ComponentsReviewTable = ({
    components = [],
    componentType = "add",
    onQuantityChange,
    onSerialChange,
    onReasonChange,
    onRemarksChange,
    onConditionChange,
    onRemove,
}) => {
    const isReplaceMode = componentType === "replace";

    if (!components.length) return null;

    return (
        <div className="rounded-lg border border-border overflow-hidden">
            {/* Scrollable table wrapper */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse min-w-[900px]">
                    {/* Header */}
                    <thead>
                        <tr className="bg-muted/60 border-b border-border">
                            <th className="text-left px-3 py-2.5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground w-10">
                                #
                            </th>

                            {isReplaceMode && (
                                <>
                                    <th className="text-left px-3 py-2.5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground min-w-[200px]">
                                        Old Component
                                    </th>
                                    <th className="text-left px-3 py-2.5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground min-w-[180px]">
                                        Condition
                                    </th>
                                    <th className="text-left px-3 py-2.5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground min-w-[180px]">
                                        Reason
                                    </th>
                                </>
                            )}

                            <th className="text-left px-3 py-2.5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground min-w-[220px]">
                                {isReplaceMode ? "New Component" : "Component"}
                            </th>

                            <th className="text-left px-3 py-2.5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground w-28">
                                Qty
                            </th>

                            <th className="text-left px-3 py-2.5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground min-w-[140px]">
                                Serial No.
                            </th>

                            <th className="text-left px-3 py-2.5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground min-w-[180px]">
                                Remarks
                            </th>

                            <th className="text-left px-3 py-2.5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground w-16"></th>
                        </tr>
                    </thead>

                    {/* Body */}
                    <tbody>
                        {components.map((record, index) => (
                            <tr
                                key={record.key || index}
                                className={cn(
                                    "border-b border-border/50 align-top",
                                    index % 2 === 0
                                        ? "bg-background"
                                        : "bg-muted/20",
                                )}
                            >
                                {/* # */}
                                <td className="px-3 py-3 text-xs text-muted-foreground font-medium">
                                    {index + 1}
                                </td>

                                {/* Old component (replace only) */}
                                {isReplaceMode && (
                                    <>
                                        <td className="px-3 py-3">
                                            <ComponentDetails
                                                data={record.old_component_data}
                                                type={record.component_type}
                                            />
                                        </td>

                                        {/* Condition */}
                                        <td className="px-3 py-3">
                                            <Select
                                                value={
                                                    record.old_component_condition ||
                                                    undefined
                                                }
                                                onValueChange={(v) =>
                                                    onConditionChange?.(
                                                        index,
                                                        v,
                                                    )
                                                }
                                            >
                                                <SelectTrigger
                                                    className={cn(
                                                        "h-8 text-xs",
                                                        !record.old_component_condition &&
                                                            "border-destructive focus:ring-destructive/30",
                                                    )}
                                                >
                                                    <SelectValue placeholder="Select condition" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {CONDITION_OPTIONS.map(
                                                        (opt) => (
                                                            <SelectItem
                                                                key={opt.value}
                                                                value={
                                                                    opt.value
                                                                }
                                                                className="text-xs"
                                                            >
                                                                {opt.label}
                                                            </SelectItem>
                                                        ),
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            <FieldError
                                                show={
                                                    !record.old_component_condition
                                                }
                                            />
                                        </td>

                                        {/* Reason */}
                                        <td className="px-3 py-3">
                                            <Textarea
                                                placeholder="Reason for replacement"
                                                value={record.reason || ""}
                                                onChange={(e) =>
                                                    onReasonChange?.(
                                                        index,
                                                        e.target.value,
                                                    )
                                                }
                                                rows={2}
                                                maxLength={255}
                                                className={cn(
                                                    "resize-none text-xs min-h-0",
                                                    !record.reason &&
                                                        "border-destructive focus-visible:ring-destructive/30",
                                                )}
                                            />
                                            <FieldError show={!record.reason} />
                                        </td>
                                    </>
                                )}

                                {/* New / Component details */}
                                <td className="px-3 py-3">
                                    <ComponentDetails
                                        data={record.component_data}
                                        type={record.component_type}
                                    />
                                </td>

                                {/* Quantity (parts only) */}
                                <td className="px-3 py-3">
                                    {record.component_type === "part" ? (
                                        <Input
                                            type="number"
                                            min={1}
                                            max={
                                                record.component_data
                                                    ?.quantity || 999
                                            }
                                            value={record.quantity ?? 1}
                                            onChange={(e) =>
                                                onQuantityChange?.(
                                                    index,
                                                    Number(e.target.value),
                                                )
                                            }
                                            className="h-8 text-xs w-20"
                                        />
                                    ) : (
                                        <span className="text-xs text-muted-foreground">
                                            —
                                        </span>
                                    )}
                                </td>

                                {/* Serial number (parts only) */}
                                <td className="px-3 py-3">
                                    {record.component_type === "part" ? (
                                        <>
                                            <Input
                                                placeholder="Serial number"
                                                value={
                                                    isReplaceMode
                                                        ? record.replacement_serial_number ||
                                                          ""
                                                        : record.new_serial_number ||
                                                          ""
                                                }
                                                onChange={(e) =>
                                                    onSerialChange?.(
                                                        index,
                                                        e.target.value,
                                                    )
                                                }
                                                maxLength={100}
                                                className={cn(
                                                    "h-8 text-xs",
                                                    (isReplaceMode
                                                        ? !record.replacement_serial_number
                                                        : !record.new_serial_number) &&
                                                        "border-destructive focus-visible:ring-destructive/30",
                                                )}
                                            />
                                            <FieldError
                                                show={
                                                    isReplaceMode
                                                        ? !record.replacement_serial_number
                                                        : !record.new_serial_number
                                                }
                                            />
                                        </>
                                    ) : (
                                        <span className="text-xs text-muted-foreground">
                                            —
                                        </span>
                                    )}
                                </td>

                                {/* Remarks */}
                                <td className="px-3 py-3">
                                    <Textarea
                                        placeholder={
                                            isReplaceMode
                                                ? "Additional notes (optional)"
                                                : "Reason for addition (optional)"
                                        }
                                        value={record.remarks || ""}
                                        onChange={(e) =>
                                            onRemarksChange?.(
                                                index,
                                                e.target.value,
                                            )
                                        }
                                        rows={2}
                                        maxLength={500}
                                        className="resize-none text-xs min-h-0"
                                    />
                                </td>

                                {/* Delete */}
                                <td className="px-3 py-3">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => onRemove?.(index)}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ComponentsReviewTable;
