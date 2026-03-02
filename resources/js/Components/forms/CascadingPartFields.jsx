import React, { useEffect, useRef } from "react";
import { Form, Input as AntInput } from "antd";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/Components/ui/Combobox";

// ─── Design tokens (must match HardwareFormDrawer) ────────────────────────────
const LABEL_H = 18;
const GAP = 5;
const INPUT_H = 34;
const BOTTOM = 14;

// ─── Cell primitive ───────────────────────────────────────────────────────────
const Cell = ({ label, showLabel, flex, children }) => (
    <div className="flex flex-col min-w-0" style={{ flex }}>
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

// ─────────────────────────────────────────────────────────────────────────────

const CascadingPartFields = ({
    fieldPrefix,
    form,
    initialValues = {},
    disabled = {},
    layout = "vertical",
    showLabels = true,
    onFieldChange,
    partsHooks,
    isFormList = false,
    rowIndex = null,
    rowData = null,
}) => {
    const { partsOptions, loadBrands, loadModels, loadSpecifications } =
        partsHooks;

    // Track loaded state to prevent infinite loops
    const loadedRef = useRef({
        partType: false,
        brand: false,
        model: false,
        specs: false,
    });

    const getFieldValue = (fieldKey) => {
        if (isFormList) {
            const allParts = form.getFieldValue("parts") || [];
            return allParts[rowIndex]?.[fieldKey];
        }
        return form.getFieldValue(`${fieldPrefix}_${fieldKey}`);
    };

    const setFieldValues = (updates) => {
        if (isFormList) {
            const allParts = form.getFieldValue("parts") || [];
            allParts[rowIndex] = { ...allParts[rowIndex], ...updates };
            form.setFieldsValue({ parts: allParts });
        } else {
            const flat = {};
            Object.entries(updates).forEach(([k, v]) => {
                flat[`${fieldPrefix}_${k}`] = v;
            });
            form.setFieldsValue(flat);
        }
    };

    // Load brands when part type changes
    useEffect(() => {
        const partType = rowData?.part_type;
        if (partType && partType !== loadedRef.current.partType) {
            loadedRef.current.partType = partType;
            loadBrands(partType, fieldPrefix);
        }
    }, [rowData?.part_type, fieldPrefix, loadBrands]);

    // Load models when part type AND brand are available
    useEffect(() => {
        const partType = rowData?.part_type;
        const brand = rowData?.brand;

        if (partType && brand) {
            const key = `${partType}|${brand}`;
            if (key !== loadedRef.current.brand) {
                loadedRef.current.brand = key;
                loadModels(partType, brand, fieldPrefix);
            }
        }
    }, [rowData?.part_type, rowData?.brand, fieldPrefix, loadModels]);

    // Load specifications when part type, brand, AND model are available
    useEffect(() => {
        const partType = rowData?.part_type;
        const brand = rowData?.brand;
        const model = rowData?.model;

        if (partType && brand && model) {
            const key = `${partType}|${brand}|${model}`;
            if (key !== loadedRef.current.model) {
                loadedRef.current.model = key;
                loadSpecifications(
                    partType,
                    brand,
                    model,
                    fieldPrefix,
                    rowIndex || 0,
                );
            }
        }
    }, [
        rowData?.part_type,
        rowData?.brand,
        rowData?.model,
        fieldPrefix,
        rowIndex,
        loadSpecifications,
    ]);

    const handlePartTypeChange = (val) => {
        // Reset loaded refs when part type changes
        loadedRef.current = {
            partType: false,
            brand: false,
            model: false,
            specs: false,
        };

        setFieldValues({
            part_type: val,
            brand: undefined,
            model: undefined,
            specifications: undefined,
            condition: undefined,
        });

        if (val) {
            loadBrands(val, fieldPrefix);
        }
        onFieldChange?.("part_type", val);
    };

    const handleBrandChange = (val) => {
        // Reset model and specs loaded flags
        loadedRef.current.model = false;
        loadedRef.current.specs = false;

        setFieldValues({
            brand: val,
            model: undefined,
            specifications: undefined,
        });

        if (val && getFieldValue("part_type")) {
            loadModels(getFieldValue("part_type"), val, fieldPrefix);
        }
        onFieldChange?.("brand", val);
    };

    const handleModelChange = (val) => {
        // Reset specs loaded flag
        loadedRef.current.specs = false;

        setFieldValues({
            model: val,
            specifications: undefined,
        });

        if (val && getFieldValue("part_type") && getFieldValue("brand")) {
            loadSpecifications(
                getFieldValue("part_type"),
                getFieldValue("brand"),
                val,
                fieldPrefix,
                rowIndex || 0,
            );
        }
        onFieldChange?.("model", val);
    };

    // ── inline + isFormList mode ── used inside HardwareFormDrawer Form.List
    if (layout === "inline" && isFormList) {
        return (
            <div className="flex gap-2 flex-1 min-w-0">
                {/* Part Type */}
                <Cell label="Part Type" showLabel={showLabels} flex={1}>
                    <Form.Item
                        name={[rowIndex, "part_type"]}
                        noStyle
                        rules={[{ required: true, message: "Required" }]}
                    >
                        <Combobox
                            options={partsOptions.types || []}
                            placeholder="Part Type"
                            value={rowData?.part_type} // Add this
                            disabled={disabled.part_type}
                            onChange={handlePartTypeChange}
                            style={{ height: INPUT_H }}
                        />
                    </Form.Item>
                </Cell>

                {/* Brand */}
                <Cell label="Brand" showLabel={showLabels} flex={1}>
                    <Form.Item
                        name={[rowIndex, "brand"]}
                        noStyle
                        rules={[{ required: true, message: "Required" }]}
                    >
                        <Combobox
                            options={partsOptions.brands[fieldPrefix] || []}
                            placeholder="Brand"
                            value={rowData?.brand} // Add this
                            disabled={
                                disabled.brand || !getFieldValue("part_type")
                            }
                            onChange={handleBrandChange}
                            onFocus={async () => {
                                const pt = getFieldValue("part_type");
                                if (pt) await loadBrands(pt, fieldPrefix);
                            }}
                            style={{ height: INPUT_H }}
                        />
                    </Form.Item>
                </Cell>

                {/* Model */}
                <Cell label="Model" showLabel={showLabels} flex={1}>
                    <Form.Item
                        name={[rowIndex, "model"]}
                        noStyle
                        rules={[{ required: true, message: "Required" }]}
                    >
                        <Combobox
                            options={partsOptions.models[fieldPrefix] || []}
                            placeholder="Model"
                            value={rowData?.model} // Add this
                            disabled={disabled.model || !getFieldValue("brand")}
                            onChange={handleModelChange}
                            onFocus={async () => {
                                const pt = getFieldValue("part_type");
                                const br = getFieldValue("brand");
                                if (pt && br)
                                    await loadModels(pt, br, fieldPrefix);
                            }}
                            style={{ height: INPUT_H }}
                        />
                    </Form.Item>
                </Cell>
                {/* Specifications */}
                <Cell label="Specifications" showLabel={showLabels} flex={1.3}>
                    <Form.Item name={[rowIndex, "specifications"]} noStyle>
                        <Combobox
                            options={
                                partsOptions.specifications[fieldPrefix] || []
                            }
                            placeholder="Specs"
                            value={rowData?.specifications}
                            disabled={
                                disabled.specifications ||
                                !getFieldValue("model")
                            }
                            onFocus={async () => {
                                const pt = getFieldValue("part_type");
                                const br = getFieldValue("brand");
                                const mo = getFieldValue("model");
                                if (pt && br && mo)
                                    await loadSpecifications(
                                        pt,
                                        br,
                                        mo,
                                        fieldPrefix,
                                        rowIndex || 0,
                                    );
                            }}
                            style={{ height: INPUT_H }}
                            allowCustomValue={true} // Add this
                        />
                    </Form.Item>
                </Cell>

                {/* Serial Number (keep as is - it's an Input, not Combobox) */}
                <Cell label="Serial No." showLabel={showLabels} flex={1.3}>
                    <Form.Item
                        name={[rowIndex, "serial_number"]}
                        noStyle
                        rules={[{ required: true, message: "Required" }]}
                    >
                        <Input
                            placeholder="Serial No."
                            value={rowData?.serial_number} // Add this if Input component supports it
                            className="text-sm w-full"
                            style={{ height: INPUT_H }}
                        />
                    </Form.Item>
                </Cell>
            </div>
        );
    }

    // ── inline (non-list) mode ────────────────────────────────────────────────
    if (layout === "inline") {
        const fieldDefs = [
            {
                name: "part_type",
                label: "Part Type",
                opts: partsOptions.types || [],
                required: true,
                onChange: handlePartTypeChange,
            },
            {
                name: "brand",
                label: "Brand",
                opts: partsOptions.brands[fieldPrefix] || [],
                required: true,
                onChange: handleBrandChange,
                onFocus: async () => {
                    const pt = getFieldValue("part_type");
                    if (pt) await loadBrands(pt, fieldPrefix);
                },
            },
            {
                name: "model",
                label: "Model",
                opts: partsOptions.models[fieldPrefix] || [],
                required: true,
                onChange: handleModelChange,
                onFocus: async () => {
                    const pt = getFieldValue("part_type");
                    const br = getFieldValue("brand");
                    if (pt && br) await loadModels(pt, br, fieldPrefix);
                },
            },
            {
                name: "specifications",
                label: "Specifications",
                opts: partsOptions.specifications[fieldPrefix] || [],
                required: false,
                onFocus: async () => {
                    const pt = getFieldValue("part_type");
                    const br = getFieldValue("brand");
                    const mo = getFieldValue("model");
                    if (pt && br && mo)
                        await loadSpecifications(
                            pt,
                            br,
                            mo,
                            fieldPrefix,
                            rowIndex || 0,
                        );
                },
            },
            {
                name: "serial_number",
                label: "Serial No.",
                type: "input",
                required: true,
            },
        ];

        return (
            <div className="flex gap-2 flex-1 min-w-0">
                {fieldDefs.map((f) => (
                    <div key={f.name} className="flex-1 min-w-0">
                        <Form.Item
                            name={`${fieldPrefix}_${f.name}`}
                            noStyle
                            rules={
                                f.required
                                    ? [{ required: true, message: "Required" }]
                                    : []
                            }
                        >
                            {f.type === "input" ? (
                                <Input
                                    placeholder={`Enter ${f.label}`}
                                    disabled={disabled[f.name]}
                                    className="text-sm w-full"
                                    style={{ height: INPUT_H }}
                                />
                            ) : (
                                <Combobox
                                    options={f.opts}
                                    placeholder={f.label}
                                    disabled={disabled[f.name]}
                                    onChange={f.onChange}
                                    onFocus={f.onFocus}
                                    style={{ height: INPUT_H }}
                                />
                            )}
                        </Form.Item>
                    </div>
                ))}
            </div>
        );
    }

    // ── vertical (default) mode ───────────────────────────────────────────────
    const vertFields = [
        {
            name: "part_type",
            label: "Part Type",
            opts: partsOptions.types || [],
            required: true,
            onChange: handlePartTypeChange,
        },
        {
            name: "brand",
            label: "Brand",
            opts: partsOptions.brands[fieldPrefix] || [],
            required: true,
            onChange: handleBrandChange,
            onFocus: async () => {
                const pt = getFieldValue("part_type");
                if (pt) await loadBrands(pt, fieldPrefix);
            },
        },
        {
            name: "model",
            label: "Model",
            opts: partsOptions.models[fieldPrefix] || [],
            required: true,
            onChange: handleModelChange,
            onFocus: async () => {
                const pt = getFieldValue("part_type");
                const br = getFieldValue("brand");
                if (pt && br) await loadModels(pt, br, fieldPrefix);
            },
        },
        {
            name: "specifications",
            label: "Specifications",
            opts: partsOptions.specifications[fieldPrefix] || [],
            required: false,
            onFocus: async () => {
                const pt = getFieldValue("part_type");
                const br = getFieldValue("brand");
                const mo = getFieldValue("model");
                if (pt && br && mo)
                    await loadSpecifications(
                        pt,
                        br,
                        mo,
                        fieldPrefix,
                        rowIndex || 0,
                    );
            },
        },
        {
            name: "serial_number",
            label: "Serial Number",
            type: "input",
            required: true,
        },
    ];

    return (
        <div
            className={cn(
                "grid gap-4",
                layout === "horizontal" ? "grid-cols-3" : "grid-cols-1",
            )}
        >
            {vertFields.map((f) => (
                <div key={f.name} className="flex flex-col gap-1.5">
                    {showLabels && (
                        <Label className="text-xs font-semibold text-muted-foreground">
                            {f.label}
                        </Label>
                    )}
                    <Form.Item
                        name={`${fieldPrefix}_${f.name}`}
                        noStyle
                        rules={
                            f.required
                                ? [
                                      {
                                          required: true,
                                          message: `Please ${f.type === "input" ? "enter" : "select"} ${f.label.toLowerCase()}`,
                                      },
                                  ]
                                : []
                        }
                        initialValue={initialValues[f.name]}
                    >
                        {f.type === "input" ? (
                            <Input
                                placeholder={`Enter ${f.label}`}
                                disabled={disabled[f.name]}
                                className="text-sm"
                            />
                        ) : (
                            <Combobox
                                options={f.opts}
                                placeholder={`Select ${f.label}`}
                                disabled={disabled[f.name]}
                                onChange={f.onChange}
                                onFocus={f.onFocus}
                            />
                        )}
                    </Form.Item>
                </div>
            ))}
        </div>
    );
};

export default CascadingPartFields;
