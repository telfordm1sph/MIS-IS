import React, { useState, useCallback } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select";
import { Label } from "@/Components/ui/label";
import { Alert, AlertDescription } from "@/Components/ui/alert";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/Components/ui/card";
import { Info } from "lucide-react";

import InventoryTable from "./InventoryTable";
import ComponentsReviewTable from "./ComponentsReviewTable";
import { getPartColumns, getSoftwareColumns } from "@/Utils/inventoryColumns";
import { useComponentManagement } from "@/Hooks/useComponentManagement";
import { useComponentSelection } from "@/Hooks/useComponentSelection";

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * A reusable component for selecting a replacement item from inventory.
 *
 * Originally written for hardware maintenance, this component is now generic
 * enough to be used with any "entity" that has `parts` and/or `software`
 * arrays (e.g. printers).  Callers can supply custom fetch endpoints and
 * column generators to adapt to different inventory types.
 *
 * Props:
 *   - componentOptions: options for the select dropdown of existing components
 *   - hardware (deprecated) / entity: the current asset whose component is
 *     being replaced.  Either prop may be provided for backwards
 *     compatibility; `entity` takes precedence.
 *   - fetchEndpoints: optional map `{ part, software }` to override default
 *     inventory API routes.
 *   - getColumns: optional map `{ part, software }` with functions that
 *     return column definitions for the inventory table.
 */
const ReplaceComponent = ({
    componentOptions,
    hardware, // kept for backwards compatibility
    entity,
    fetchEndpoints,
    getColumns,
}) => {
    const form = useFormContext();

    const target = entity || hardware; // the object we inspect for parts/software

    const [selectedOldComponent, setSelectedOldComponent] = useState(null);
    const [componentType, setComponentType] = useState(null);
    const [selectedComponentInfo, setSelectedComponentInfo] = useState(null);
    const [selectedSubtype, setSelectedSubtype] = useState(null);

    // Live-watch the replacements array from the shared form context
    const replacements =
        useWatch({ name: "replacements", control: form.control }) || [];

    // default endpoints/column generators (same as before)
    const defaultFetch = {
        part: route("inventory.parts.available"),
        software: route("inventory.software.available"),
    };

    const defaultGetCols = {
        part: getPartColumns,
        software: getSoftwareColumns,
    };

    const endpoints = {
        ...defaultFetch,
        ...fetchEndpoints,
    };

    const columnsProvider = {
        ...defaultGetCols,
        ...getColumns,
    };

    const getComponentData = useCallback(
        (componentId) => {
            if (!componentId) return null;
            const [type, id] = componentId.split("_");
            if (type === "part") {
                const data = target?.parts?.find((p) => p.id == id);
                return { type: "part", data };
            }
            const data = target?.software?.find((s) => s.id == id);
            return { type: "software", data };
        },
        [target],
    );

    const handleOldComponentChange = (value) => {
        setSelectedOldComponent(value || null);
        if (value) {
            const info = getComponentData(value);
            setComponentType(info?.type || null);
            setSelectedComponentInfo(info);
            setSelectedSubtype(
                info?.type === "part"
                    ? info.data?.part_info?.part_type
                    : info?.data?.inventory?.software_name,
            );
        } else {
            setComponentType(null);
            setSelectedComponentInfo(null);
            setSelectedSubtype(null);
        }
    };

    const { handleSelectComponent } = useComponentSelection({
        form,
        fieldName: "replacements",
        mode: "replace",
    });

    const handleReplacementSelect = useCallback(
        (record) => {
            if (!selectedOldComponent || !selectedComponentInfo) return;
            handleSelectComponent({
                record,
                selectedOldComponent,
                selectedComponentInfo,
            });
        },
        [selectedOldComponent, selectedComponentInfo, handleSelectComponent],
    );

    const {
        handleQuantityChange,
        handleSerialChange,
        handleReasonChange,
        handleRemarksChange,
        handleConditionChange,
        handleRemoveComponent,
    } = useComponentManagement({ form, fieldName: "replacements" });

    return (
        <div className="space-y-4">
            {/* Info */}
            <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800">
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertDescription className="text-blue-700 dark:text-blue-300 text-sm">
                    Select the old component to replace, then choose a
                    replacement from inventory. You must specify the condition
                    of the old component to determine how it will be returned to
                    inventory.
                </AlertDescription>
            </Alert>

            {/* Step 1 */}
            <Card className="border-border/60">
                <CardHeader className="pb-3 pt-4 px-4">
                    <CardTitle className="text-sm font-semibold">
                        Step 1: Select Component to Replace
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                    <div className="space-y-1.5 ">
                        <Label>
                            Old Component{" "}
                            <span className="text-destructive">*</span>
                        </Label>
                        <Select
                            value={selectedOldComponent || undefined}
                            onValueChange={handleOldComponentChange}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select component to replace" />
                            </SelectTrigger>
                            <SelectContent>
                                {(componentOptions || []).map((opt) => (
                                    <SelectItem
                                        key={opt.value}
                                        value={String(opt.value)}
                                    >
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>
            {/* Step 2 */}
            {selectedOldComponent && componentType && (
                <Card className="border-border/60">
                    <CardHeader className="pb-3 pt-4 px-4">
                        <CardTitle className="text-sm font-semibold">
                            Step 2: Select Replacement from Inventory
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <InventoryTable
                            key={componentType}
                            componentType={componentType}
                            fetchEndpoint={endpoints[componentType]}
                            selectedType={selectedSubtype}
                            onSelectComponent={handleReplacementSelect}
                            columns={columnsProvider[componentType](
                                handleReplacementSelect,
                            )}
                        />
                    </CardContent>
                </Card>
            )}

            {/* Step 3 */}
            {replacements.length > 0 && (
                <Card className="border-border/60">
                    <CardHeader className="pb-3 pt-4 px-4 flex flex-row items-start justify-between space-y-0">
                        <div>
                            <CardTitle className="text-sm font-semibold">
                                Step 3: Review &amp; Configure (
                                {replacements.length} replacement
                                {replacements.length > 1 ? "s" : ""})
                            </CardTitle>
                            <CardDescription className="text-xs mt-0.5">
                                Required: Old condition, Reason
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <ComponentsReviewTable
                            components={replacements}
                            componentType="replace"
                            onQuantityChange={handleQuantityChange}
                            onSerialChange={handleSerialChange}
                            onReasonChange={handleReasonChange}
                            onRemarksChange={handleRemarksChange}
                            onConditionChange={handleConditionChange}
                            onRemove={handleRemoveComponent}
                        />
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default ReplaceComponent;
