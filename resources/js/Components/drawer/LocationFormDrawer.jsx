import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { cn } from "@/lib/utils";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/Components/ui/sheet";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Textarea } from "@/Components/ui/textarea";
import { ScrollArea } from "@/Components/ui/scroll-area";

const FieldError = ({ message }) =>
    message ? <p className="text-xs text-destructive mt-1">{message}</p> : null;

const LocationFormDrawer = ({
    open,
    onClose,
    onSave,
    title,
    editingItem,
    fieldGroups = [],
}) => {
    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm();

    useEffect(() => {
        if (open && editingItem) {
            reset(editingItem);
        } else if (open && !editingItem) {
            reset({ id: undefined, location_name: "" });
        }
    }, [open, editingItem]);

    const onValid = async (values) => {
        try {
            await onSave(values);
        } catch (error) {
            console.error("Form submission error:", error);
        }
    };

    const renderField = (field) => {
        const fieldName = field.key;
        const isRequired =
            field.rules?.some((r) => r.required) || field.required;

        switch (field.type) {
            case "hidden":
                return (
                    <input
                        key={fieldName}
                        type="hidden"
                        {...register(fieldName)}
                    />
                );

            case "textarea":
                return (
                    <div key={fieldName} className="space-y-2">
                        <Label htmlFor={fieldName}>
                            {field.label}
                            {isRequired && (
                                <span className="text-destructive ml-1">*</span>
                            )}
                        </Label>
                        <Textarea
                            id={fieldName}
                            placeholder={field.placeholder || ""}
                            {...register(fieldName, {
                                required: isRequired
                                    ? `${field.label} is required`
                                    : false,
                            })}
                            className={cn(
                                errors[fieldName] && "border-destructive",
                            )}
                        />
                        <FieldError message={errors[fieldName]?.message} />
                    </div>
                );

            case "input":
            default:
                return (
                    <div key={fieldName} className="space-y-2">
                        <Label htmlFor={fieldName}>
                            {field.label}
                            {isRequired && (
                                <span className="text-destructive ml-1">*</span>
                            )}
                        </Label>
                        <Input
                            id={fieldName}
                            type="text"
                            placeholder={field.placeholder || ""}
                            {...register(fieldName, {
                                required: isRequired
                                    ? `${field.label} is required`
                                    : false,
                            })}
                            className={cn(
                                errors[fieldName] && "border-destructive",
                            )}
                        />
                        <FieldError message={errors[fieldName]?.message} />
                    </div>
                );
        }
    };

    return (
        <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
            <SheetContent
                side="right"
                className="!w-[600px] !max-w-[600px] p-0 flex flex-col gap-0"
            >
                {/* ── Header ── */}
                <SheetHeader className="px-6 py-4 border-b border-border/60 shrink-0">
                    <SheetTitle className="text-base font-semibold">
                        {title}
                    </SheetTitle>
                </SheetHeader>

                {/* ── Body ── */}
                <ScrollArea className="flex-1">
                    <form
                        onSubmit={handleSubmit(onValid)}
                        className="px-6 py-5 space-y-6"
                    >
                        {fieldGroups.map((group, groupIndex) => (
                            <div key={groupIndex} className="space-y-4">
                                {group.title && (
                                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                                        {group.title}
                                    </h3>
                                )}

                                <div
                                    className="grid gap-4"
                                    style={{
                                        gridTemplateColumns: `repeat(${group.column || 1}, minmax(0, 1fr))`,
                                    }}
                                >
                                    {group.fields.map(renderField)}
                                </div>
                            </div>
                        ))}
                    </form>
                </ScrollArea>

                {/* ── Footer ── */}
                <div className="px-6 py-4 border-t border-border/60 shrink-0 flex justify-end gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        form="location-form"
                        disabled={isSubmitting}
                        onClick={handleSubmit(onValid)}
                    >
                        {isSubmitting
                            ? "Saving..."
                            : editingItem
                              ? "Update Location"
                              : "Create Location"}
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
};

export default LocationFormDrawer;
