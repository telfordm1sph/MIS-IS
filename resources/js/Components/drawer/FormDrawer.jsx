// ─── FormDrawer.jsx ───────────────────────────────────────────────────────────
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select";
import { ScrollArea } from "@/Components/ui/scroll-area";

const FieldError = ({ message }) =>
    message ? <p className="text-xs text-destructive mt-1">{message}</p> : null;

export const FormDrawer = ({
    open,
    onClose,
    onSubmit,
    title,
    mode = "create",
    initialValues = {},
    fields = [],
    loading = false,
    columns = 2,
}) => {
    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors },
    } = useForm();

    useEffect(() => {
        if (open) {
            reset(initialValues ?? {});
        }
    }, [open, initialValues]);

    const onValid = (values) => onSubmit(values);

    return (
        <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
            <SheetContent
                side="right"
                className="!w-[860px] !max-w-[860px] p-0 flex flex-col gap-0"
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
                        id="form-drawer-form"
                        onSubmit={handleSubmit(onValid)}
                        className="px-6 py-5"
                    >
                        {/* Hidden fields */}
                        {fields
                            .filter((f) => f.hidden)
                            .map((f) => (
                                <input
                                    key={f.name}
                                    type="hidden"
                                    {...register(f.name)}
                                />
                            ))}

                        {/* Visible fields grid */}
                        <div
                            className="grid gap-4"
                            style={{
                                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                            }}
                        >
                            {fields
                                .filter((f) => !f.hidden)
                                .map((field) => {
                                    const colSpan = field.col
                                        ? Math.round(field.col / (24 / columns))
                                        : 1;

                                    const isRequired = field.rules?.some(
                                        (r) => r.required,
                                    );
                                    const errorMsg =
                                        errors[field.name]?.message;

                                    return (
                                        <div
                                            key={field.name}
                                            style={
                                                colSpan > 1
                                                    ? {
                                                          gridColumn: `span ${colSpan}`,
                                                      }
                                                    : {}
                                            }
                                        >
                                            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1.5 block">
                                                {field.label}
                                                {isRequired && (
                                                    <span className="text-destructive ml-0.5">
                                                        *
                                                    </span>
                                                )}
                                            </Label>

                                            {field.type === "select" ? (
                                                <>
                                                    <Select
                                                        value={
                                                            watch(field.name) ??
                                                            ""
                                                        }
                                                        onValueChange={(val) =>
                                                            setValue(
                                                                field.name,
                                                                val,
                                                                {
                                                                    shouldValidate: true,
                                                                },
                                                            )
                                                        }
                                                        disabled={
                                                            field.disabled
                                                        }
                                                    >
                                                        <SelectTrigger
                                                            className={cn(
                                                                "h-9 text-sm",
                                                                errorMsg &&
                                                                    "border-destructive",
                                                            )}
                                                        >
                                                            <SelectValue
                                                                placeholder={
                                                                    field.placeholder ??
                                                                    `Select ${field.label}`
                                                                }
                                                            />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {field.options?.map(
                                                                (opt) => (
                                                                    <SelectItem
                                                                        key={
                                                                            opt.value
                                                                        }
                                                                        value={String(
                                                                            opt.value,
                                                                        )}
                                                                    >
                                                                        {
                                                                            opt.label
                                                                        }
                                                                    </SelectItem>
                                                                ),
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                    {/* Register hidden input for validation */}
                                                    <input
                                                        type="hidden"
                                                        {...register(
                                                            field.name,
                                                            {
                                                                required:
                                                                    isRequired
                                                                        ? field.rules.find(
                                                                              (
                                                                                  r,
                                                                              ) =>
                                                                                  r.required,
                                                                          )
                                                                              ?.message ||
                                                                          "Required"
                                                                        : false,
                                                            },
                                                        )}
                                                    />
                                                </>
                                            ) : (
                                                <Input
                                                    type={
                                                        field.type === "number"
                                                            ? "number"
                                                            : "text"
                                                    }
                                                    placeholder={
                                                        field.placeholder ??
                                                        `Enter ${field.label}`
                                                    }
                                                    disabled={field.disabled}
                                                    className={cn(
                                                        "h-9 text-sm",
                                                        errorMsg &&
                                                            "border-destructive",
                                                    )}
                                                    {...register(field.name, {
                                                        required: isRequired
                                                            ? field.rules.find(
                                                                  (r) =>
                                                                      r.required,
                                                              )?.message ||
                                                              "Required"
                                                            : false,
                                                        valueAsNumber:
                                                            field.type ===
                                                            "number",
                                                    })}
                                                />
                                            )}

                                            <FieldError message={errorMsg} />
                                        </div>
                                    );
                                })}
                        </div>
                    </form>
                </ScrollArea>

                {/* ── Footer ── */}
                <div className="shrink-0 border-t border-border/60 px-6 py-4 flex items-center justify-end gap-2 bg-card/60">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        form="form-drawer-form"
                        size="sm"
                        disabled={loading}
                    >
                        {loading && (
                            <span className="w-3.5 h-3.5 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin mr-1.5" />
                        )}
                        {mode === "create" ? "Create" : "Update"}
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
};

export default FormDrawer;
