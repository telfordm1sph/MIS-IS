import React, { useState, useCallback } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Info } from "lucide-react";

import InventoryTable from "./InventoryTable";
import ComponentsReviewTable from "./ComponentsReviewTable";
import { getPartColumns, getSoftwareColumns } from "@/Utils/inventoryColumns";
import { useComponentManagement } from "@/Hooks/useComponentManagement";
import { useComponentSelection } from "@/Hooks/useComponentSelection";

// ── Component ─────────────────────────────────────────────────────────────────

const ReplaceComponent = ({ componentOptions, hardware }) => {
    const form = useFormContext();

    const [selectedOldComponent, setSelectedOldComponent] = useState(null);
    const [componentType, setComponentType] = useState(null);
    const [selectedComponentInfo, setSelectedComponentInfo] = useState(null);
    const [selectedPartType, setSelectedPartType] = useState(null);

    // Live-watch the replacements array from the shared form context
    const replacements =
        useWatch({ name: "replacements", control: form.control }) || [];

    const getComponentData = useCallback(
        (componentId) => {
            if (!componentId) return null;
            const [type, id] = componentId.split("_");
            if (type === "part") {
                const data = hardware?.parts?.find((p) => p.id == id);
                return { type: "part", data };
            }
            const data = hardware?.software?.find((s) => s.id == id);
            return { type: "software", data };
        },
        [hardware],
    );

    const handleOldComponentChange = (value) => {
        setSelectedOldComponent(value || null);
        if (value) {
            const info = getComponentData(value);
            setComponentType(info?.type || null);
            setSelectedComponentInfo(info);
            setSelectedPartType(
                info?.type === "part"
                    ? info.data?.part_info?.part_type
                    : info?.data?.inventory?.software_name,
            );
        } else {
            setComponentType(null);
            setSelectedComponentInfo(null);
            setSelectedPartType(null);
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
                            fetchEndpoint={
                                componentType === "part"
                                    ? route("inventory.parts.available")
                                    : route("inventory.software.available")
                            }
                            selectedType={selectedPartType}
                            onSelectComponent={handleReplacementSelect}
                            columns={
                                componentType === "part"
                                    ? getPartColumns(handleReplacementSelect)
                                    : getSoftwareColumns(
                                          handleReplacementSelect,
                                      )
                            }
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
