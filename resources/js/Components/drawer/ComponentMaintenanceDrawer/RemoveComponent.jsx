import React, { useCallback, useEffect } from "react";
import { useFormContext, useFieldArray, Controller } from "react-hook-form";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select";
import { Textarea } from "@/Components/ui/textarea";
import { Button } from "@/Components/ui/button";
import { Alert, AlertDescription } from "@/Components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Label } from "@/Components/ui/label";
import { AlertTriangle, Trash2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Constants ─────────────────────────────────────────────────────────────────

const CONDITION_OPTIONS = [
    { value: "working", label: "Working — Return to Inventory" },
    { value: "faulty", label: "Faulty — For Repair" },
    { value: "defective", label: "Defective — Dispose" },
    { value: "damaged", label: "Damaged — Dispose" },
];

const CONDITION_REASON_MAP = {
    working: "Working",
    faulty: "Faulty",
    defective: "Defective",
    damaged: "Damaged",
};

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Generic UI for removing components from an asset.  The componentOptions
 * dropdown is provided by the caller.  The `entity` prop replaces the old
 * `hardware` prop to make this usable for printers or other asset types.
 */
const RemoveComponent = ({ componentOptions = [], hardware, entity }) => {
    const form = useFormContext();
    const {
        control,
        register,
        setValue,
        getValues,
        formState: { errors },
    } = form;

    const target = entity || hardware; // kept for future use or compatibility

    const { fields, append, remove } = useFieldArray({
        control,
        name: "components_to_remove",
    });

    // Helper: parse component ID into type and numeric ID (same as before)
    const getComponentData = useCallback((componentId) => {
        if (!componentId) return null;
        const [type, id] = componentId.split("_");
        if (type === "part" || type === "software") {
            return { type, id };
        }
        return null;
    }, []);

    const handleComponentChange = (index, value) => {
        if (!value) {
            setValue(`components_to_remove.${index}.component_type`, null);
            setValue(`components_to_remove.${index}.component_id`, null);
            setValue(
                `components_to_remove.${index}.component_id_display`,
                null,
            );
            return;
        }

        const componentData = getComponentData(value);

        if (componentData) {
            // 1️⃣ For UI display
            setValue(
                `components_to_remove.${index}.component_id_display`,
                value,
            );

            // 2️⃣ For backend (numeric ID only)
            setValue(
                `components_to_remove.${index}.component_id`,
                Number(componentData.id),
            );

            // 3️⃣ Store component type
            setValue(
                `components_to_remove.${index}.component_type`,
                componentData.type,
            );

            // 4️⃣ Store operation type
            setValue(`components_to_remove.${index}.operation`, "remove");
        }
    };

    const handleConditionChange = (index, value) => {
        setValue(`components_to_remove.${index}.condition`, value);
        setValue(
            `components_to_remove.${index}.reason`,
            CONDITION_REASON_MAP[value] ?? "",
        );
    };

    const handleAddOperation = () => {
        append({ operation: "remove" });
    };

    return (
        <div className="space-y-4">
            {/* Warning */}
            <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <AlertDescription className="text-amber-700 dark:text-amber-300">
                    Removing components will return them to inventory or mark
                    them for disposal based on their condition.
                </AlertDescription>
            </Alert>

            {/* Dynamic component cards */}
            {fields.map((field, index) => {
                const fieldErrors = errors?.components_to_remove?.[index];

                return (
                    <Card key={field.id} className="border-border/60">
                        <CardHeader className="pb-3 pt-4 px-4 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-sm font-semibold">
                                Component {index + 1}
                            </CardTitle>
                            {fields.length > 1 && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => remove(index)}
                                >
                                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                                    Remove
                                </Button>
                            )}
                        </CardHeader>

                        <CardContent className="px-4 pb-4 space-y-4">
                            {/* Hidden fields */}
                            <input
                                type="hidden"
                                {...register(
                                    `components_to_remove.${index}.operation`,
                                )}
                                value="remove"
                            />
                            <input
                                type="hidden"
                                {...register(
                                    `components_to_remove.${index}.component_type`,
                                )}
                            />
                            <input
                                type="hidden"
                                {...register(
                                    `components_to_remove.${index}.component_id`,
                                )}
                            />

                            {/* Component selector */}
                            <div className="space-y-1.5">
                                <Label>
                                    Component to Remove{" "}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Controller
                                    control={control}
                                    name={`components_to_remove.${index}.component_id_display`}
                                    rules={{
                                        required: "Please select a component",
                                    }}
                                    render={({ field: f }) => (
                                        <Select
                                            value={f.value || undefined}
                                            onValueChange={(value) => {
                                                f.onChange(value);
                                                handleComponentChange(
                                                    index,
                                                    value,
                                                );
                                            }}
                                        >
                                            <SelectTrigger
                                                className={cn(
                                                    fieldErrors?.component_id &&
                                                        "border-destructive focus:ring-destructive/30",
                                                )}
                                            >
                                                <SelectValue placeholder="Select component to remove" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {(componentOptions || []).map(
                                                    (opt) => (
                                                        <SelectItem
                                                            key={opt.value}
                                                            value={String(
                                                                opt.value,
                                                            )}
                                                        >
                                                            {opt.label}
                                                        </SelectItem>
                                                    ),
                                                )}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {fieldErrors?.component_id && (
                                    <p className="text-xs text-destructive">
                                        {fieldErrors.component_id.message}
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Condition */}
                                <div className="space-y-1.5">
                                    <Label>
                                        Component Condition{" "}
                                        <span className="text-destructive">
                                            *
                                        </span>
                                    </Label>
                                    <Controller
                                        control={control}
                                        name={`components_to_remove.${index}.condition`}
                                        rules={{
                                            required:
                                                "Please select a condition",
                                        }}
                                        render={({ field: f }) => (
                                            <Select
                                                value={f.value || undefined}
                                                onValueChange={(v) => {
                                                    f.onChange(v);
                                                    handleConditionChange(
                                                        index,
                                                        v,
                                                    );
                                                }}
                                            >
                                                <SelectTrigger
                                                    className={cn(
                                                        fieldErrors?.condition &&
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
                                                            >
                                                                {opt.label}
                                                            </SelectItem>
                                                        ),
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                    {fieldErrors?.condition && (
                                        <p className="text-xs text-destructive">
                                            {fieldErrors.condition.message}
                                        </p>
                                    )}
                                </div>

                                {/* Remarks */}
                                <div className="space-y-1.5">
                                    <Label>
                                        Remarks{" "}
                                        <span className="text-destructive">
                                            *
                                        </span>
                                    </Label>
                                    <Textarea
                                        {...register(
                                            `components_to_remove.${index}.remarks`,
                                            {
                                                required:
                                                    "Please provide remarks",
                                            },
                                        )}
                                        rows={3}
                                        placeholder="Why are you removing this?"
                                        maxLength={500}
                                        className={cn(
                                            "resize-none text-sm",
                                            fieldErrors?.remarks &&
                                                "border-destructive focus-visible:ring-destructive/30",
                                        )}
                                    />
                                    {fieldErrors?.remarks && (
                                        <p className="text-xs text-destructive">
                                            {fieldErrors.remarks.message}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}

            {/* Add more button */}
            <Button
                type="button"
                variant="outline"
                className="w-full border-dashed border-2 border-border hover:border-primary/50 hover:bg-primary/5 text-muted-foreground hover:text-foreground"
                onClick={handleAddOperation}
            >
                <Plus className="h-4 w-4 mr-2" />
                Add Another Component to Remove
            </Button>
        </div>
    );
};

export default RemoveComponent;
