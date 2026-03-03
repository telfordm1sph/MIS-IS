import React, { useCallback } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import InventoryTable from "./InventoryTable";
import ComponentsReviewTable from "./ComponentsReviewTable";
import { getPartColumns, getSoftwareColumns } from "@/Utils/inventoryColumns";
import { useComponentManagement } from "@/Hooks/useComponentManagement";
import { useComponentSelection } from "@/Hooks/useComponentSelection";

const COMPONENT_TYPES = [
    { label: "Hardware Part", value: "part" },
    { label: "Software", value: "software" },
];

// ── Component ─────────────────────────────────────────────────────────────────

const AddComponent = ({ selectedComponentType, onComponentTypeSelect }) => {
    const form = useFormContext();

    // Live-watch the components array
    const selectedComponents =
        useWatch({ name: "components", control: form.control }) || [];

    const { handleSelectComponent } = useComponentSelection({
        form,
        fieldName: "components",
        operation: "add",
    });

    const {
        handleQuantityChange,
        handleSerialChange,
        handleReasonChange,
        handleRemoveComponent,
        handleRemarksChange,
    } = useComponentManagement({ form, fieldName: "components" });

    const handleAddSelect = useCallback(
        (record) => {
            if (!record || !selectedComponentType) return;
            handleSelectComponent({ record, selectedComponentType });
        },
        [selectedComponentType, handleSelectComponent],
    );

    return (
        <div className="space-y-4">
            {/* Step 1 */}
            <Card className="border-border/60">
                <CardHeader className="pb-3 pt-4 px-4">
                    <CardTitle className="text-sm font-semibold">
                        Step 1: Select Component Type
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                    <div className="space-y-1.5 ">
                        <Label>
                            Component Type{" "}
                            <span className="text-destructive">*</span>
                        </Label>
                        <Select
                            value={selectedComponentType || undefined}
                            onValueChange={onComponentTypeSelect}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                {COMPONENT_TYPES.map((t) => (
                                    <SelectItem key={t.value} value={t.value}>
                                        {t.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Step 2 */}
            {selectedComponentType && (
                <Card className="border-border/60">
                    <CardHeader className="pb-3 pt-4 px-4">
                        <CardTitle className="text-sm font-semibold">
                            Step 2: Select Components from Inventory
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <InventoryTable
                            key={selectedComponentType}
                            componentType={selectedComponentType}
                            fetchEndpoint={
                                selectedComponentType === "part"
                                    ? route("inventory.parts.available")
                                    : route("inventory.software.available")
                            }
                            onSelectComponent={handleAddSelect}
                            columns={
                                selectedComponentType === "part"
                                    ? getPartColumns(handleAddSelect)
                                    : getSoftwareColumns(handleAddSelect)
                            }
                        />
                    </CardContent>
                </Card>
            )}

            {/* Step 3 */}
            {selectedComponents.length > 0 && (
                <Card className="border-border/60">
                    <CardHeader className="pb-3 pt-4 px-4">
                        <CardTitle className="text-sm font-semibold">
                            Step 3: Review &amp; Configure (
                            {selectedComponents.length} item
                            {selectedComponents.length > 1 ? "s" : ""})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <ComponentsReviewTable
                            components={selectedComponents}
                            componentType="add"
                            onQuantityChange={handleQuantityChange}
                            onSerialChange={handleSerialChange}
                            onReasonChange={handleReasonChange}
                            onRemarksChange={handleRemarksChange}
                            onRemove={handleRemoveComponent}
                        />
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default AddComponent;
